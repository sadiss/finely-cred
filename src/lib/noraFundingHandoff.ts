import { isSupabaseConfigured, supabase } from './supabaseClient';
import { getNoraCapitalSettings } from '../data/settingsRepo';
import { noraRequest } from './noraCapitalClient';
import { adminUpsertPartner } from '../data/partnersRepo';
import type { Partner } from '../domain/partners';
import { buildPartnerFundingReadiness } from './partnerFundingReadiness';
import { noraPartnerFundingDossierPush, noraPartnerFundingBrief } from './noraPartnerApiClient';
import { syncPartnerFundingFromNora } from './noraCapitalPullClient';
import { formatFundingHandoffForUi, type NoraFundingHandoffUi, type NoraFundingPushResponse } from './noraFundingApiTypes';

export type FundingHandoffResult = NoraFundingHandoffUi & {
  ok: boolean;
  exportId?: string;
  raw?: NoraFundingPushResponse;
};

/** Preview funding brief without pushing — instant UX feedback. */
export async function previewPartnerFundingBrief(partner: Partner) {
  const res = await noraPartnerFundingBrief({ partnerId: partner.id, email: partner.profile.email ?? undefined });
  if (!res.ok || !res.brief) {
    return { ok: false as const, error: res.error, hint: res.hint };
  }
  return {
    ok: true as const,
    brief: res.brief,
    lenderReadiness: res.lenderReadiness,
    nextSteps: res.nextSteps,
    compliance: res.compliance,
  };
}

/** Push full funding dossier v6 to Nora Capital. Returns user-friendly UI payload. */
export async function submitPartnerFundingHandoff(
  partner: Partner,
  opts?: { force?: boolean; clientId?: string },
): Promise<FundingHandoffResult> {
  const readiness = buildPartnerFundingReadiness(partner);
  if (!readiness.ready && !opts?.force) {
    const brief = await previewPartnerFundingBrief(partner);
    return {
      ok: false,
      success: false,
      title: 'Not fund-ready yet',
      message: readiness.blockers[0] ?? 'Partner not funding-ready.',
      doThisNext: brief.ok ? brief.brief.doThisNext : [],
      error: readiness.blockers[0],
      hint: 'Complete blockers in the portal, or use force handoff from admin.',
    };
  }

  const nora = getNoraCapitalSettings();
  if (!isSupabaseConfigured) {
    await adminUpsertPartner({
      ...partner,
      fundingStage: 'submitted',
      journeySignals: {
        ...partner.journeySignals,
        fundingStage: 'submitted',
        fundingMeta: { submittedAt: new Date().toISOString(), mode: 'offline_queue' },
      },
    });
    return {
      ok: true,
      success: true,
      title: 'Queued locally',
      message: 'Supabase offline — handoff queued on partner record.',
      doThisNext: ['Configure Supabase and retry push to Nora Capital.'],
    };
  }

  const res = await noraPartnerFundingDossierPush({
    partnerId: partner.id,
    email: partner.profile.email ?? undefined,
    clientId: opts?.clientId ?? partner.importExternalId ?? undefined,
    force: Boolean(opts?.force),
    includeMl: true,
  });

  if (res.ok) {
    await adminUpsertPartner({
      ...partner,
      fundingStage: 'submitted',
      journeySignals: {
        ...partner.journeySignals,
        fundingStage: 'submitted',
        fundingMeta: {
          submittedAt: new Date().toISOString(),
          dossierExportId: res.exportId,
          noraEventId: res.push?.eventId,
          mode: 'dossier_v6_webhook',
          lenderVerdict: res.lenderReadiness?.verdict,
          complianceScore: res.compliance?.score,
        },
        fundingDossierV6: {
          exportId: res.exportId,
          pushedAt: new Date().toISOString(),
          verdict: res.brief?.verdict,
          lenderVerdict: res.lenderReadiness?.verdict,
        },
      },
    });
    return { ok: true, ...formatFundingHandoffForUi(res), exportId: res.exportId, raw: res };
  }

  if (nora.status !== 'not_configured') {
    try {
      await noraRequest({
        path: '/v1/applications',
        method: 'POST',
        body: {
          partnerId: partner.id,
          externalId: partner.importExternalId ?? null,
          fullName: partner.profile.fullName,
          email: partner.profile.email ?? null,
          readinessScore: readiness.score,
          mode: 'legacy_readiness_fallback',
          exportedAt: new Date().toISOString(),
        },
        idempotencyKey: `fund:${partner.id}:${Date.now()}`,
      });
      return {
        ok: true,
        success: true,
        title: 'Legacy application submitted',
        message: 'Dossier push failed but basic application was sent via fallback.',
        doThisNext: ['Retry full dossier push when Nora webhook is available.'],
        hint: res.hint,
      };
    } catch {
      /* fall through */
    }
  }

  return {
    ok: false,
    ...formatFundingHandoffForUi(res),
    raw: res,
  };
}

export async function fetchPartnerFundingDossierV6(args: {
  partnerId?: string;
  email?: string;
  sections?: string | string[];
}) {
  const { noraPartnerFundingDossierV6 } = await import('./noraPartnerApiClient');
  return noraPartnerFundingDossierV6(args);
}

/** Pull latest funding status/dossier summary back from Nora Capital into Finely. */
export async function pullPartnerFundingFromNora(args: {
  partner: Partner;
  clientId?: string;
  exportId?: string;
}) {
  return syncPartnerFundingFromNora({
    partner: args.partner,
    clientId: args.clientId,
    exportId: args.exportId ?? (args.partner.journeySignals as any)?.fundingDossierV6?.exportId,
  });
}

export async function updatePartnerFundingStageFromWebhook(args: {
  partnerId?: string;
  email?: string;
  stage: string;
  applicationId?: string;
  meta?: Record<string, unknown>;
}) {
  if (!isSupabaseConfigured) return;
  let q = supabase.from('partners').select('*');
  if (args.partnerId) q = q.eq('id', args.partnerId);
  else if (args.email) q = q.filter('profile->>email', 'eq', args.email.trim().toLowerCase());
  else return;
  const { data } = await q.maybeSingle();
  if (!data) return;
  await supabase
    .from('partners')
    .update({
      funding_stage: args.stage,
      funding_meta: {
        ...(data.funding_meta ?? {}),
        applicationId: args.applicationId,
        webhookAt: new Date().toISOString(),
        ...args.meta,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id);
}
