/**
 * Partner care-team assignment — specialist / coach / business partner (affiliate).
 * Primary specialist stays synced to Partner.assignedAgentId for existing caseload APIs.
 */
import type { Partner } from '../domain/partners';
import { adminUpsertPartner, listPartnersLocal } from '../data/partnersRepo';
import { careerRoleForPartner } from './partnerInviteRouting';

export type CareTeamRole = 'specialist' | 'coach' | 'affiliate';

export type CareTeamMember = {
  role: CareTeamRole;
  partnerId: string;
  assignedAt: string;
  assignedBy?: string;
};

const CARE_TEAM_KEY = 'careTeam';

export const CARE_TEAM_ROLE_LABEL: Record<CareTeamRole, string> = {
  specialist: 'Credit specialist',
  coach: 'Coach',
  affiliate: 'Business partner',
};

export function isClientPartner(p: Partner): boolean {
  const role = careerRoleForPartner(p);
  return role === 'client' || (!role && p.lane !== 'agent' && p.lane !== 'affiliate' && p.lane !== 'au_tradelines');
}

export function isCreditSpecialistPartner(p: Partner): boolean {
  return careerRoleForPartner(p) === 'agent' || p.lane === 'agent';
}

export function isAffiliatePartner(p: Partner): boolean {
  return careerRoleForPartner(p) === 'affiliate' || p.lane === 'affiliate';
}

export function canCoachPartner(p: Partner): boolean {
  if (isCreditSpecialistPartner(p)) return true;
  return Boolean((p.journeySignals as Record<string, unknown> | undefined)?.canCoach);
}

export function readCareTeam(partner: Partner): CareTeamMember[] {
  const raw = (partner.journeySignals as Record<string, unknown> | undefined)?.[CARE_TEAM_KEY];
  if (!Array.isArray(raw)) return [];
  const out: CareTeamMember[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const role = String(row.role || '') as CareTeamRole;
    const partnerId = String(row.partnerId || '').trim();
    if (!partnerId || !['specialist', 'coach', 'affiliate'].includes(role)) continue;
    out.push({
      role,
      partnerId,
      assignedAt: String(row.assignedAt || partner.updatedAt || new Date().toISOString()),
      assignedBy: row.assignedBy ? String(row.assignedBy) : undefined,
    });
  }
  return out;
}

/** Prefer careTeam.specialist; fall back to assignedAgentId for legacy rows. */
export function resolveCareTeam(partner: Partner): CareTeamMember[] {
  const team = readCareTeam(partner);
  const hasSpecialist = team.some((m) => m.role === 'specialist');
  if (!hasSpecialist && partner.assignedAgentId) {
    return [
      {
        role: 'specialist',
        partnerId: partner.assignedAgentId,
        assignedAt: String(
          (partner.journeySignals as Record<string, unknown> | undefined)?.assignedSpecialistAt ||
            partner.updatedAt ||
            new Date().toISOString(),
        ),
      },
      ...team,
    ];
  }
  return team;
}

export function careMemberForRole(partner: Partner, role: CareTeamRole): CareTeamMember | undefined {
  return resolveCareTeam(partner).find((m) => m.role === role);
}

export function isEligibleForCareRole(helper: Partner, role: CareTeamRole): boolean {
  if (role === 'specialist') return isCreditSpecialistPartner(helper);
  if (role === 'affiliate') return isAffiliatePartner(helper);
  if (role === 'coach') return canCoachPartner(helper);
  return false;
}

export function listEligibleHelpers(args: {
  tenantId: string;
  role: CareTeamRole;
  partners?: Partner[];
}): Partner[] {
  const pool = args.partners ?? listPartnersLocal();
  return pool
    .filter((p) => p.tenantId === args.tenantId && isEligibleForCareRole(p, args.role))
    .sort((a, b) => (a.profile.fullName || '').localeCompare(b.profile.fullName || ''));
}

export function applyCareTeamRole(args: {
  partner: Partner;
  role: CareTeamRole;
  helperPartnerId: string | null;
  assignedBy?: string;
}): Partner {
  const now = new Date().toISOString();
  const prev = resolveCareTeam(args.partner).filter((m) => m.role !== args.role);
  const nextTeam = args.helperPartnerId
    ? [
        ...prev,
        {
          role: args.role,
          partnerId: args.helperPartnerId,
          assignedAt: now,
          assignedBy: args.assignedBy,
        },
      ]
    : prev;

  const specialistId =
    args.role === 'specialist'
      ? args.helperPartnerId || undefined
      : nextTeam.find((m) => m.role === 'specialist')?.partnerId || args.partner.assignedAgentId;

  return {
    ...args.partner,
    assignedAgentId: specialistId || undefined,
    journeySignals: {
      ...(args.partner.journeySignals ?? {}),
      [CARE_TEAM_KEY]: nextTeam,
      assignedSpecialistAt: specialistId
        ? String(
            (args.partner.journeySignals as Record<string, unknown> | undefined)?.assignedSpecialistAt || now,
          )
        : undefined,
      supportModel: specialistId
        ? args.partner.journeySignals?.supportModel || 'finely_specialist'
        : args.partner.journeySignals?.supportModel,
    },
    updatedAt: now,
  };
}

export async function saveCareTeamRole(args: {
  partner: Partner;
  role: CareTeamRole;
  helperPartnerId: string | null;
  assignedBy?: string;
}): Promise<Partner> {
  const next = applyCareTeamRole(args);
  return adminUpsertPartner(next);
}

export function partnerHasCareMember(partner: Partner, helperPartnerId: string): boolean {
  const id = helperPartnerId.trim();
  if (!id) return false;
  if (partner.assignedAgentId === id) return true;
  return resolveCareTeam(partner).some((m) => m.partnerId === id);
}

export function filterPartnersForCareMember(args: {
  tenantId: string;
  helperPartnerId: string;
  partners?: Partner[];
}): Partner[] {
  const helperId = args.helperPartnerId.trim();
  if (!helperId) return [];
  const pool = args.partners ?? listPartnersLocal();
  return pool
    .filter((p) => p.tenantId === args.tenantId && isClientPartner(p) && partnerHasCareMember(p, helperId))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export function resolveHelperPartner(helperId: string | undefined, partners?: Partner[]): Partner | null {
  if (!helperId) return null;
  const pool = partners ?? listPartnersLocal();
  return pool.find((p) => p.id === helperId) ?? null;
}

export function careTeamSummaryLabels(partner: Partner, partners?: Partner[]): {
  specialist?: string;
  coach?: string;
  affiliate?: string;
} {
  const pool = partners ?? listPartnersLocal();
  const team = resolveCareTeam(partner);
  const label = (id: string) => {
    const h = pool.find((p) => p.id === id);
    return h?.profile.fullName || h?.profile.email || id;
  };
  const out: { specialist?: string; coach?: string; affiliate?: string } = {};
  for (const m of team) {
    if (m.role === 'specialist') out.specialist = label(m.partnerId);
    if (m.role === 'coach') out.coach = label(m.partnerId);
    if (m.role === 'affiliate') out.affiliate = label(m.partnerId);
  }
  return out;
}
