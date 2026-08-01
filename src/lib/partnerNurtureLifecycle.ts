/**
 * Partner lifecycle nurture enrollments — onboard keep-warm, monthly education,
 * birthday, opportunity, and specialist keep-warm.
 */
import type { Partner } from '../domain/partners';
import { listLeadCaptures } from '../data/leadsRepo';
import { listPartners, upsertPartner } from '../data/partnersRepo';
import { getNotificationPrefs } from '../data/notificationPrefsRepo';
import { nurtureMuteKindForSequence } from '../domain/notificationPrefs';
import {
  enrollLeadInNurtureSequence,
  listNurtureEnrollments,
  type NurtureEnrollment,
} from './nurtureEngine';

const APPLY_FUNNEL_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

function partnerEmail(partner: Partner): string {
  return (partner.profile.email || '').trim().toLowerCase();
}

/** Marketing opt-in: lead consent, communication consent, or explicit journey signal. */
export function partnerHasMarketingOptIn(partner: Partner): boolean {
  if (partner.journeySignals?.marketingOptIn === false) return false;
  if (partner.journeySignals?.marketingOptIn === true) return true;
  if (partner.consents?.communicationConsentAt) return true;
  const email = partnerEmail(partner);
  if (!email) return false;
  const lead = listLeadCaptures().find((l) => (l.email || '').trim().toLowerCase() === email);
  if (lead) return lead.consentEmailMarketing !== false && Boolean(lead.consentEmailMarketing || lead.consentToContact);
  return false;
}

function muteBlocksSequence(partner: Partner, sequenceId: string): boolean {
  const kind = nurtureMuteKindForSequence(sequenceId);
  if (!kind) return false;
  const prefs = getNotificationPrefs({ partnerId: partner.id });
  return (prefs.mutedKinds ?? []).includes(kind);
}

function enrollPartnerSequence(
  partner: Partner,
  sequenceId: string,
  context?: Record<string, unknown>,
): NurtureEnrollment | null {
  if (muteBlocksSequence(partner, sequenceId)) return null;
  const needsMarketing =
    sequenceId === 'seq_partner_birthday' ||
    sequenceId === 'seq_partner_opportunity_au' ||
    sequenceId === 'seq_partner_opportunity_affiliate';
  if (needsMarketing && !partnerHasMarketingOptIn(partner)) return null;

  return enrollLeadInNurtureSequence({
    leadId: partner.id,
    sequenceId,
    tenantId: partner.tenantId || 'finely_cred',
    context: {
      email: partner.profile.email,
      fullName: partner.profile.fullName,
      partnerId: partner.id,
      lane: partner.lane,
      immediateWelcomeSent: true,
      ...context,
    },
  });
}

function recentApplyFunnelEnrollment(partnerId: string, now = Date.now()): boolean {
  const rows = listNurtureEnrollments(200).filter(
    (e) => e.leadId === partnerId && e.sequenceId === 'seq_specialist_apply_funnel',
  );
  return rows.some((e) => {
    const ts = Date.parse(e.updatedAt ?? e.startedAt);
    if (!Number.isFinite(ts)) return e.status === 'active';
    if (e.status === 'active') return true;
    return now - ts < APPLY_FUNNEL_COOLDOWN_MS;
  });
}

/** Idempotent enrollments when a partner is created or activated. */
export function enrollPartnerLifecycleOnActivate(partner: Partner): {
  onboard: NurtureEnrollment | null;
  monthly: NurtureEnrollment | null;
  specialist: NurtureEnrollment | null;
} {
  const onboard = enrollPartnerSequence(partner, 'seq_partner_onboard_keepwarm');
  const monthly =
    partner.status === 'active' || partner.status === 'lead'
      ? enrollPartnerSequence(partner, 'seq_partner_monthly_education')
      : null;

  let specialist: NurtureEnrollment | null = null;
  if (partner.lane === 'agent' && !recentApplyFunnelEnrollment(partner.id)) {
    specialist = enrollPartnerSequence(partner, 'seq_specialist_keepwarm');
  }

  return { onboard, monthly, specialist };
}

/** Opt-in opportunity sequences (AU / affiliate) — requires marketing opt-in. */
export function enrollPartnerOpportunitySequences(partner: Partner): {
  opportunityAu: NurtureEnrollment | null;
  opportunityAffiliate: NurtureEnrollment | null;
} {
  const opportunityAu =
    partner.lane !== 'au_tradelines'
      ? enrollPartnerSequence(partner, 'seq_partner_opportunity_au')
      : null;
  const opportunityAffiliate =
    partner.lane !== 'affiliate'
      ? enrollPartnerSequence(partner, 'seq_partner_opportunity_affiliate')
      : null;
  return { opportunityAu, opportunityAffiliate };
}

function parseDobMonthDay(dob: string | undefined): { month: number; day: number } | null {
  if (!dob?.trim()) return null;
  const raw = dob.trim();
  // YYYY-MM-DD
  let m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return { month: Number(m[2]), day: Number(m[3]) };
  // MM/DD/YYYY or M/D/YYYY
  m = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) return { month: Number(m[1]), day: Number(m[2]) };
  return null;
}

function partnerDob(partner: Partner): string | undefined {
  const routes = partner.routes ?? {};
  for (const key of Object.keys(routes) as Array<keyof typeof routes>) {
    const dob = routes[key]?.personal?.dob;
    if (dob) return dob;
  }
  const signalDob = partner.journeySignals?.dob ?? partner.journeySignals?.dateOfBirth;
  return typeof signalDob === 'string' ? signalDob : undefined;
}

export type BirthdayNurtureTickResult = {
  checked: number;
  enrolled: number;
  skipped: number;
  dryRun: boolean;
  partnerIds: string[];
};

/** Daily birthday enroll — month/day match, marketing opt-in, once per calendar year. */
export async function processPartnerBirthdayNurtureTick(opts?: {
  dryRun?: boolean;
  now?: Date;
  partners?: Partner[];
}): Promise<BirthdayNurtureTickResult> {
  const now = opts?.now ?? new Date();
  const dryRun = opts?.dryRun ?? true;
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const partners = opts?.partners ?? (await listPartners());
  let checked = 0;
  let enrolled = 0;
  let skipped = 0;
  const partnerIds: string[] = [];

  for (const partner of partners) {
    if (partner.status === 'paused') continue;
    checked += 1;
    const md = parseDobMonthDay(partnerDob(partner));
    if (!md || md.month !== month || md.day !== day) {
      skipped += 1;
      continue;
    }
    if (!partnerHasMarketingOptIn(partner)) {
      skipped += 1;
      continue;
    }
    if (muteBlocksSequence(partner, 'seq_partner_birthday')) {
      skipped += 1;
      continue;
    }
    const lastYear = Number(partner.journeySignals?.lastBirthdayNurtureYear ?? 0);
    if (lastYear === year) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      enrolled += 1;
      partnerIds.push(partner.id);
      continue;
    }

    const hit = enrollPartnerSequence(partner, 'seq_partner_birthday', { birthdayYear: year });
    if (hit) {
      enrolled += 1;
      partnerIds.push(partner.id);
      try {
        await upsertPartner({
          ...partner,
          journeySignals: {
            ...(partner.journeySignals ?? {}),
            lastBirthdayNurtureYear: year,
          },
          updatedAt: now.toISOString(),
        });
      } catch {
        // non-blocking — enrollment still counts
      }
    } else {
      skipped += 1;
    }
  }

  return { checked, enrolled, skipped, dryRun, partnerIds };
}
