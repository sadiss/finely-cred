import type { HumanStaffAgent } from '../humanStaffOs/types';
import { findStaff, staffFullName, staffPortraitUrl } from '../staffCommandCenter/staffRoster';
import { STAFF_ROSTER_PROFILES } from '../staffCommandCenter/staffRosterProfiles';
import { resolveStaffPortraitFallbackUrl, resolveStaffPortraitUrl } from '../../lib/staffPortrait';

export function humanStaffDisplayName(agent: Pick<HumanStaffAgent, 'id' | 'name'>): string {
  const staff = findStaff(agent.id);
  if (staff) return staffFullName(staff);
  const seed = STAFF_ROSTER_PROFILES[agent.id];
  if (seed) return `${seed.firstName} ${seed.lastName}`.trim();
  return agent.name;
}

export function humanStaffCodename(agent: Pick<HumanStaffAgent, 'id' | 'name'>): string {
  const staff = findStaff(agent.id);
  if (staff) return staff.codename;
  const seed = STAFF_ROSTER_PROFILES[agent.id];
  return seed?.codename ?? agent.name;
}

export function humanStaffPortraitUrl(agentId: string): string {
  const staff = findStaff(agentId);
  if (staff) return staffPortraitUrl(staff);
  const seed = STAFF_ROSTER_PROFILES[agentId];
  const parts = agentId.replace(/_/g, ' ').split(/\s+/);
  const firstName = seed?.firstName ?? parts[0] ?? 'Staff';
  const lastName = seed?.lastName ?? parts.slice(1).join(' ') ?? '';
  const portraitGender = seed?.portraitGender ?? 'neutral';
  const staffLike = {
    id: agentId,
    firstName,
    lastName,
    portraitGender,
    avatarPath: `staff-portrait://${agentId}`,
  };
  return (
    resolveStaffPortraitFallbackUrl(staffLike) ??
    resolveStaffPortraitUrl(staffLike)
  );
}

export function humanStaffBio(agent: HumanStaffAgent): string {
  const staff = findStaff(agent.id);
  if (staff) return staff.personality.bio;
  const seed = STAFF_ROSTER_PROFILES[agent.id];
  return seed?.personality.bio ?? agent.mission;
}
