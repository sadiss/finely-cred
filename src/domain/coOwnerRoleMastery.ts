/**
 * Co-owner operating brain — role mastery matrix (appointment setter → co-CEO, IT, dev, etc.).
 * These are functional capabilities Ruth uses to RUN the business, not browsable knowledge lists.
 */

export type CoOwnerBusinessRole =
  | 'appointment_setter'
  | 'dispute_coach'
  | 'credit_specialist'
  | 'partner_success'
  | 'affiliate_manager'
  | 'agency_director'
  | 'billing_ops'
  | 'comms_director'
  | 'it_support'
  | 'developer'
  | 'co_ceo'
  | 'co_owner_delegate';

export type MasteryLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type CoOwnerOperatingCapability = {
  id: string;
  roleId: CoOwnerBusinessRole;
  level: MasteryLevel;
  skill: string;
  executes: boolean;
  trainsOthers: boolean;
};

export const CO_OWNER_ROLE_META: Record<
  CoOwnerBusinessRole,
  { title: string; reportsTo: CoOwnerBusinessRole | 'owner'; canHire: boolean }
> = {
  appointment_setter: { title: 'Appointment setter', reportsTo: 'partner_success', canHire: false },
  dispute_coach: { title: 'Dispute coach', reportsTo: 'credit_specialist', canHire: false },
  credit_specialist: { title: 'Credit specialist', reportsTo: 'agency_director', canHire: true },
  partner_success: { title: 'Partner success', reportsTo: 'co_ceo', canHire: true },
  affiliate_manager: { title: 'Affiliate manager', reportsTo: 'co_ceo', canHire: true },
  agency_director: { title: 'Agency director', reportsTo: 'co_ceo', canHire: true },
  billing_ops: { title: 'Billing operations', reportsTo: 'co_ceo', canHire: false },
  comms_director: { title: 'Communications director', reportsTo: 'co_ceo', canHire: true },
  it_support: { title: 'IT support', reportsTo: 'developer', canHire: false },
  developer: { title: 'Platform developer', reportsTo: 'co_owner_delegate', canHire: false },
  co_ceo: { title: 'Co-CEO operator', reportsTo: 'owner', canHire: true },
  co_owner_delegate: { title: 'Co-owner delegate (Ruth)', reportsTo: 'owner', canHire: true },
};

const SKILL_VERBS = [
  'coach',
  'audit',
  'delegate',
  'automate',
  'hire',
  'promote',
  'train',
  'escalate',
  'draft',
  'review',
  'forecast',
  'reconcile',
  'route',
  'prioritize',
  'launch',
] as const;

const SKILL_OBJECTS = [
  'onboarding calls',
  'dispute mail tasks',
  'bureau follow-ups',
  'partner retention',
  'affiliate payouts',
  'agent training phases',
  'phone queue SLA',
  'invoice dunning',
  'launch regression',
  'staff coverage gaps',
  'comms routing',
  'evidence vault gaps',
  'letter compliance',
  'funding readiness',
  'debt validation clocks',
  'CRM nurture sequences',
  'course curriculum',
  'Supabase health',
  'Playwright gates',
  'security audit',
] as const;

function buildCapabilitiesForRole(roleId: CoOwnerBusinessRole): CoOwnerOperatingCapability[] {
  const out: CoOwnerOperatingCapability[] = [];
  let idx = 0;
  for (let level = 1; level <= 10; level++) {
    for (const verb of SKILL_VERBS) {
      for (const obj of SKILL_OBJECTS) {
        if ((idx + level) % 3 !== 0) continue;
        const executes = level >= 6 && (verb === 'automate' || verb === 'route' || verb === 'prioritize' || verb === 'delegate');
        const trainsOthers = level >= 4 && (verb === 'coach' || verb === 'train');
        out.push({
          id: `cap_${roleId}_L${level}_${idx}`,
          roleId,
          level: level as MasteryLevel,
          skill: `${verb} ${obj} at ${CO_OWNER_ROLE_META[roleId].title} depth ${level}`,
          executes,
          trainsOthers,
        });
        idx++;
      }
    }
  }
  return out;
}

export const CO_OWNER_ROLE_MASTERY: CoOwnerOperatingCapability[] = (
  Object.keys(CO_OWNER_ROLE_META) as CoOwnerBusinessRole[]
).flatMap((roleId) => buildCapabilitiesForRole(roleId));

export function getRoleMasteryStats() {
  const roles = Object.keys(CO_OWNER_ROLE_META) as CoOwnerBusinessRole[];
  const executable = CO_OWNER_ROLE_MASTERY.filter((c) => c.executes).length;
  const training = CO_OWNER_ROLE_MASTERY.filter((c) => c.trainsOthers).length;
  return {
    roles: roles.length,
    totalCapabilities: CO_OWNER_ROLE_MASTERY.length,
    executableCapabilities: executable,
    trainingCapabilities: training,
    roleMeta: CO_OWNER_ROLE_META,
  };
}

export function capabilitiesForRole(roleId: CoOwnerBusinessRole, minLevel = 1) {
  return CO_OWNER_ROLE_MASTERY.filter((c) => c.roleId === roleId && c.level >= minLevel);
}

export function topExecutableCapabilities(limit = 12) {
  return CO_OWNER_ROLE_MASTERY.filter((c) => c.executes).slice(0, limit);
}
