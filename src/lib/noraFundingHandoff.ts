import { isSupabaseConfigured, supabase } from './supabaseClient';
import { getNoraCapitalSettings } from '../data/settingsRepo';
import { noraRequest } from './noraCapitalClient';
import { adminUpsertPartner } from '../data/partnersRepo';
import type { Partner } from '../domain/partners';
import { buildPartnerFundingReadiness, partnerReadinessPayload } from './partnerFundingReadiness';

export async function submitPartnerFundingHandoff(partner: Partner): Promise<{ ok: boolean; error?: string }> {
  const readiness = buildPartnerFundingReadiness(partner);
  if (!readiness.ready) {
    return { ok: false, error: readiness.blockers[0] ?? 'Partner not funding-ready.' };
  }
  const payload = partnerReadinessPayload(partner, readiness);
  const nora = getNoraCapitalSettings();
  if (nora.status === 'not_configured' || !isSupabaseConfigured) {
    await adminUpsertPartner({
      ...partner,
      fundingStage: 'submitted',
      journeySignals: {
        ...partner.journeySignals,
        fundingStage: 'submitted',
        fundingMeta: { submittedAt: new Date().toISOString(), payload },
      },
    });
    return { ok: true };
  }
  try {
    const res = await noraRequest({
      path: '/v1/applications',
      method: 'POST',
      body: payload,
      idempotencyKey: `fund:${partner.id}:${Date.now()}`,
    });
    await adminUpsertPartner({
      ...partner,
      fundingStage: 'submitted',
      journeySignals: {
        ...partner.journeySignals,
        fundingStage: 'submitted',
        fundingMeta: {
          submittedAt: new Date().toISOString(),
          noraResponseStatus: res.status,
          noraResponseBody: res.body?.slice?.(0, 4000),
        },
      },
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Funding handoff failed.' };
  }
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
