import type { AgentPersonaId } from '../domain/agentPersonas';
import { portalPersonaForLane } from './agentPersonasRepo';
import type { StaffMember, StaffShiftBlock } from '../domain/staffMember';
import { listStaffByRole, loadStaffRoster } from './staffRoster';
import { resolveStaffIdForBankruptcyScenario } from './staffBankruptcyScenarioCoaches';
import { resolveStaffIdForLaneFocus } from './staffLaneFocusCoaches';

function shiftMatches(block: StaffShiftBlock, date: Date): boolean {
  const day = date.getDay();
  const hour = date.getHours();
  return block.days.includes(day) && hour >= block.startHour && hour < block.endHour;
}

function laneHash(lane: string): number {
  let h = 0;
  for (let i = 0; i < lane.length; i += 1) {
    h = (h * 31 + lane.charCodeAt(i)) >>> 0;
  }
  return h;
}

function staffMatchesLane(staff: StaffMember, lane: string): boolean {
  const l = lane.toLowerCase();
  const text = `${staff.displayTitle ?? ''} ${staff.bioLine} ${staff.firstName}`.toLowerCase();
  if (l.includes('bankruptcy') || l.includes('discharge')) {
    return text.includes('bankruptcy') || text.includes('discharge') || text.includes('chapter');
  }
  if (l.includes('foreclosure') || l.includes('repossession')) {
    return text.includes('foreclosure') || text.includes('repossession') || text.includes('collateral');
  }
  if (l.includes('court') || l.includes('summons') || l.includes('affidavit')) {
    return text.includes('court') || text.includes('summons') || text.includes('affidavit');
  }
  if (l.includes('validation') || l.includes('collection')) {
    return text.includes('validation') || text.includes('fdcpa') || text.includes('collection');
  }
  if (l.includes('dispute') || l.includes('bureau') || l.includes('tradeline')) {
    return text.includes('dispute') || text.includes('bureau') || text.includes('metro');
  }
  if (l.includes('funding') || l.includes('business') || l.includes('vendor')) {
    return text.includes('funding') || text.includes('business') || text.includes('vendor');
  }
  if (l.includes('affiliate') || l.includes('referral')) {
    return text.includes('affiliate') || text.includes('referral');
  }
  if (l.includes('appointment') || l.includes('booking')) {
    return text.includes('appointment') || text.includes('booking') || text.includes('session');
  }
  if (l.includes('nurture') || l.includes('welcome')) {
    return text.includes('nurture') || text.includes('welcome') || text.includes('concierge');
  }
  return true;
}

function roleForLane(lane?: string): AgentPersonaId {
  return portalPersonaForLane(lane).id;
}

/**
 * Picks a dedicated on-duty staff member per portal lane so chat boxes do not all show the same person.
 */
export function resolveStaffOnDutyForLane(lane?: string, date = new Date()): StaffMember | null {
  const l = (lane || 'general').trim().toLowerCase() || 'general';
  const roleId = roleForLane(l);
  let pool = listStaffByRole(roleId).filter((s) => s.active);
  const specialized = pool.filter((s) => staffMatchesLane(s, l));
  if (specialized.length >= 2) pool = specialized;
  else if (specialized.length === 1 && pool.length > 3) {
    pool = [...specialized, ...pool.filter((s) => !specialized.includes(s))];
  }
  if (!pool.length) {
    pool = loadStaffRoster().filter((s) => s.active);
  }
  if (!pool.length) return null;

  const onShift = pool.filter((s) => s.shiftBlocks.some((b) => shiftMatches(b, date)));
  const candidates = onShift.length >= 2 ? onShift : pool;
  const idx = laneHash(l) % candidates.length;
  return candidates[idx] ?? candidates[0] ?? null;
}

/** Scenario-specific bankruptcy coach — falls back to lane hash when unmapped. */
export function resolveStaffForBankruptcyScenario(
  scenarioId: string,
  lane = 'bankruptcy',
  date = new Date(),
): StaffMember | null {
  const dedicatedId = resolveStaffIdForBankruptcyScenario(scenarioId);
  if (dedicatedId) {
    const staff = loadStaffRoster().find((s) => s.id === dedicatedId);
    if (staff?.active) return staff;
  }
  return resolveStaffOnDutyForLane(lane, date);
}

/** Bureau, debt workstation, or dispute focus → dedicated specialist. */
export function resolveStaffForLaneFocus(
  focusId: string,
  lane?: string,
  date = new Date(),
): StaffMember | null {
  const dedicatedId = resolveStaffIdForLaneFocus(focusId, lane);
  if (dedicatedId) {
    const staff = loadStaffRoster().find((s) => s.id === dedicatedId);
    if (staff?.active) return staff;
  }
  return resolveStaffOnDutyForLane(lane ?? focusId, date);
}
