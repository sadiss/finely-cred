import { portraitIndexFromStaffId } from '../../data/staffPortraitIndex';
import { resolveStaffPortraitUrl } from '../../lib/staffPortrait';
import type { StaffDepartmentId, StaffMember, StaffMemberSeed, StaffMissionType, StaffPersonality } from './types';
import { STAFF_MEMBERS_BASE } from './staffDirectory';
import { STAFF_ROSTER_PROFILES } from './staffRosterProfiles';
import { getStaffProfileOverride } from './staffProfileRepo';

export function staffFullName(m: Pick<StaffMember, 'firstName' | 'lastName'>): string {
  return `${m.firstName} ${m.lastName}`.trim();
}

export function staffPortraitUrl(m: Pick<StaffMember, 'id' | 'firstName' | 'lastName' | 'portrait'>): string {
  return resolveStaffPortraitUrl({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    portraitGender: m.portrait?.portraitGender ?? 'neutral',
    avatarPath: `staff-portrait://${m.id}`,
  });
}

function mergePersonality(base: StaffPersonality, override?: Partial<StaffPersonality>): StaffPersonality {
  if (!override) return base;
  return { ...base, ...override };
}

export function enrichStaffMember(base: StaffMemberSeed): StaffMember {
  const seed = STAFF_ROSTER_PROFILES[base.id];
  const override = getStaffProfileOverride(base.id);
  const firstName = override?.firstName ?? seed?.firstName ?? base.name.split(' ')[0] ?? base.name;
  const lastName = override?.lastName ?? seed?.lastName ?? base.name.split(' ').slice(1).join(' ') ?? '';
  const codename = seed?.codename ?? base.name;
  const personality = mergePersonality(
    seed?.personality ?? {
      voice: 'professional',
      cadence: 'clear and direct',
      humor: 'light',
      conflictStyle: 'collaborative',
      decisionStyle: 'evidence-based',
      bio: base.tagline,
    },
    override?.personality,
  );
  const portraitGender = seed?.portraitGender ?? 'neutral';
  const portraitIndex = seed?.portraitIndex ?? portraitIndexFromStaffId(base.id);

  return {
    ...base,
    firstName,
    lastName,
    codename,
    name: staffFullName({ firstName, lastName }),
    title: override?.title ?? base.title,
    personality,
    portrait: {
      ...base.portrait,
      portraitIndex,
      portraitGender,
      initials: `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || base.portrait.initials,
    },
  };
}

let rosterCache: StaffMember[] | null = null;

function buildRoster(): StaffMember[] {
  const base = STAFF_MEMBERS_BASE;
  if (!Array.isArray(base) || base.length === 0) return [];
  try {
    return base.map(enrichStaffMember);
  } catch (err) {
    console.error('[staffRoster] Failed to build roster', err);
    return [];
  }
}

/** Fresh roster (respects profile overrides from local storage). */
export function getStaffRoster(): StaffMember[] {
  if (rosterCache === null || (rosterCache.length === 0 && STAFF_MEMBERS_BASE.length > 0)) {
    rosterCache = buildRoster();
  }
  return rosterCache;
}

export function refreshStaffRoster(): StaffMember[] {
  rosterCache = buildRoster();
  return rosterCache;
}

/** @deprecated use getStaffRoster() — kept for gradual migration */
export function getStaffMembersSnapshot(): StaffMember[] {
  return getStaffRoster();
}

export function findStaff(id: string): StaffMember | null {
  return getStaffRoster().find((x) => x.id === id) ?? null;
}

export function resolveLeadStaff(candidates: Array<StaffMember | null | undefined>): StaffMember {
  for (const c of candidates) {
    if (c?.portrait?.initials) return c;
  }
  const fallback = findStaff('professor_apex') ?? getStaffRoster()[0];
  if (!fallback) {
    throw new Error('Staff roster is unavailable. Refresh the page or reset Staff Command Center demo data.');
  }
  return fallback;
}

export function isStaffMemberHydrated(m: StaffMember | null | undefined): m is StaffMember {
  return Boolean(m?.id && m.portrait?.initials && m.personality);
}

export function listDepartmentStaff(departmentId: StaffDepartmentId) {
  return getStaffRoster().filter((x) => x.departmentId === departmentId);
}

export function listLeadIntelStaff() {
  return listDepartmentStaff('lead_intel');
}

export function leadIntelStaffIds(): string[] {
  return ['pipeline_titan', 'scout_supreme', 'night_owl_intel', 'switchboard', 'velvet_hammer', 'geo_commander'];
}

export function listSelectableStaff() {
  return getStaffRoster().filter((x) => x.canBeSelected);
}

export function staffForMission(missionType: StaffMissionType) {
  return getStaffRoster().filter((x) => x.canBeSelected && x.missionTypes.includes(missionType));
}

export function resolveStaffDisplayByCodename(codename: string): StaffMember | null {
  const normalized = codename.trim().toLowerCase();
  return (
    getStaffRoster().find(
      (s) =>
        s.codename.toLowerCase() === normalized ||
        s.name.toLowerCase() === normalized ||
        staffFullName(s).toLowerCase() === normalized,
    ) ?? null
  );
}

/** Live feed / swarm log label — real name when roster matches codename. */
export function staffFeedAgentLabel(codename: string): string {
  const staff = resolveStaffDisplayByCodename(codename);
  return staff ? staffFullName(staff) : codename;
}
