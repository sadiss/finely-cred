import type { AgentPersonaId } from '../domain/agentPersonas';
import type { PortraitGender, StaffMember, StaffShiftBlock } from '../domain/staffMember';
import {
  activeShiftBlockForMember,
  clampStaffShiftBlocks,
  formatStaffShiftBlock,
  formatStaffShiftSchedule,
  isOvernightShiftBlock,
  shiftBlockMatches,
  staffMemberOnShift,
} from '../domain/staffMember';
import { STAFF_ROSTER_EXPANSION } from './staffRosterExpansion';

/** 8-hour day shift (never stack with EVENING on the same person). */
const WEEKDAY: StaffShiftBlock = { days: [1, 2, 3, 4, 5], startHour: 9, endHour: 17 };
const WEEKEND: StaffShiftBlock = { days: [0, 6], startHour: 10, endHour: 18 };
/** Evening-only coverage — assign alone, not on top of WEEKDAY. */
const EVENING: StaffShiftBlock = { days: [1, 2, 3, 4, 5], startHour: 17, endHour: 21 };
/** Late swing ending at 10 PM. */
const LATE: StaffShiftBlock = { days: [1, 2, 3, 4, 5], startHour: 14, endHour: 22 };

function m(
  id: string,
  firstName: string,
  lastName: string,
  primaryRoleId: AgentPersonaId,
  department: StaffMember['department'],
  portraitGender: PortraitGender,
  bio: string,
  shifts: StaffShiftBlock[] = [WEEKDAY],
): StaffMember {
  return {
    id,
    firstName,
    lastName,
    primaryRoleId,
    department,
    portraitGender,
    avatarPath: `staff-portrait://${id}`,
    bioLine: bio,
    shiftBlocks: clampStaffShiftBlocks(shifts),
    active: true,
  };
}

/** Seed roster — 43 named team members, each with a unique touched-up photo portrait. */
export const STAFF_ROSTER_SEED: StaffMember[] = [
  m('staff-morgan-hale', 'Morgan', 'Hale', 'finely_advisor', 'credit_operations', 'feminine', 'Credit Restoration Specialist — restore lane onboarding.'),
  m('staff-taylor-brooks', 'Taylor', 'Brooks', 'dispute_coach', 'dispute_processing', 'feminine', 'Dispute Processing Specialist — Metro 2 field accuracy.'),
  m('staff-marcus-reed', 'Marcus', 'Reed', 'funding_strategist', 'funding', 'masculine', 'Business Credit & Funding Strategist.'),
  m('staff-casey-nguyen', 'Casey', 'Nguyen', 'debt_strategist', 'debt_resolution', 'masculine', 'Debt Resolution Specialist — validation workflows.', [WEEKDAY, { days: [2, 4], startHour: 10, endHour: 16 }]),
  m('staff-avery-luna', 'Avery', 'Luna', 'nurture_concierge', 'growth_sessions', 'feminine', 'Welcome Concierge — guide downloads & sessions.', [WEEKEND, WEEKDAY]),
  m('staff-jordan-patel', 'Jordan', 'Patel', 'support_specialist', 'partner_success', 'masculine', 'Partner Success Specialist — portal navigation.'),
  m('staff-sam-ortiz', 'Sam', 'Ortiz', 'appointment_setter', 'growth_sessions', 'masculine', 'Session Coordinator — enlightenment bookings.'),
  m('staff-riley-chen', 'Riley', 'Chen', 'sales_closer', 'growth_sessions', 'feminine', 'Solutions Advisor — DIY vs DFY fit.', [WEEKDAY]),
  /** Evening lead_converter — Cameron is day-only so chat does not pin him 24/7. */
  m('staff-alex-wright', 'Alex', 'Wright', 'lead_converter', 'partner_success', 'masculine', 'Partner Activation Specialist — trial uploads.', [EVENING]),
  m('staff-jamie-foster', 'Jamie', 'Foster', 'social_creator', 'marketing', 'feminine', 'Brand & Growth Specialist — compliant campaigns.'),
  m('staff-dana-kim', 'Dana', 'Kim', 'dispute_coach', 'dispute_processing', 'feminine', 'Dispute Processing Specialist — round sequencing.'),
  m('staff-elena-voss', 'Elena', 'Voss', 'processing_agent', 'dispute_processing', 'feminine', 'Processing Agent — bureau response review and report triage.'),
  m('staff-noah-grant', 'Noah', 'Grant', 'dispute_coach', 'dispute_processing', 'masculine', 'Dispute Processing Specialist — evidence linking.'),
  m('staff-priya-shah', 'Priya', 'Shah', 'finely_advisor', 'credit_operations', 'feminine', 'Credit Restoration Specialist — education coach.'),
  m('staff-chris-alvarez', 'Chris', 'Alvarez', 'finely_advisor', 'credit_operations', 'masculine', 'Credit Restoration Specialist — checklist lane.'),
  m('staff-mia-thompson', 'Mia', 'Thompson', 'funding_strategist', 'funding', 'feminine', 'Funding Strategist — vendor ladder sequencing.'),
  m('staff-derek-ford', 'Derek', 'Ford', 'funding_strategist', 'funding', 'masculine', 'Business Credit Strategist — entity hygiene.'),
  m('staff-sienna-roy', 'Sienna', 'Roy', 'debt_strategist', 'debt_resolution', 'feminine', 'Debt Resolution Specialist — collections review.'),
  m('staff-omar-hassan', 'Omar', 'Hassan', 'debt_strategist', 'debt_resolution', 'masculine', 'Debt Resolution Specialist — summons awareness.', [LATE]),
  m('staff-lily-martinez', 'Lily', 'Martinez', 'support_specialist', 'partner_success', 'feminine', 'Partner Success Specialist — documents vault.'),
  m('staff-tyler-banks', 'Tyler', 'Banks', 'support_specialist', 'partner_success', 'masculine', 'Partner Success Specialist — billing questions.', [EVENING]),
  m('staff-nina-cole', 'Nina', 'Cole', 'appointment_setter', 'growth_sessions', 'feminine', 'Session Coordinator — calendar follow-up.'),
  m('staff-victor-stone', 'Victor', 'Stone', 'sales_closer', 'growth_sessions', 'masculine', 'Solutions Advisor — tradeline education.', [EVENING]),
  m('staff-hannah-lee', 'Hannah', 'Lee', 'lead_converter', 'partner_success', 'feminine', 'Partner Activation Specialist — first report upload.', [EVENING]),
  m('staff-isaac-bell', 'Isaac', 'Bell', 'ops_copilot', 'internal_ops', 'masculine', 'Operations Agent — workflow queue.'),
  m('staff-zara-mitchell', 'Zara', 'Mitchell', 'ops_copilot', 'internal_ops', 'feminine', 'Operations Agent — automation monitoring.'),
  m('staff-ethan-cross', 'Ethan', 'Cross', 'social_creator', 'marketing', 'masculine', 'Brand Specialist — funnel creative.'),
  m('staff-ruby-santos', 'Ruby', 'Santos', 'nurture_concierge', 'growth_sessions', 'feminine', 'Welcome Concierge — lead magnet follow-up.', [WEEKEND]),
  m('staff-calvin-wu', 'Calvin', 'Wu', 'finely_advisor', 'credit_operations', 'masculine', 'Credit Restoration Specialist — score roadmap.'),
  m('staff-jasmine-kerr', 'Jasmine', 'Kerr', 'dispute_coach', 'dispute_processing', 'feminine', 'Dispute Processing Specialist — letter QA.', [LATE]),
  m('staff-leo-park', 'Leo', 'Park', 'funding_strategist', 'funding', 'masculine', 'Funding Strategist — underwriting prep.'),
  m('staff-ava-dunn', 'Ava', 'Dunn', 'support_specialist', 'partner_success', 'feminine', 'Partner Success Specialist — Communication Hub.'),
  m('staff-renee-cole', 'Renee', 'Cole', 'compliance_agent', 'internal_ops', 'feminine', 'Compliance Review Agent — escalation review.'),
  m('staff-kai-morrison', 'Kai', 'Morrison', 'letter_ops_agent', 'dispute_processing', 'masculine', 'Letter Operations Agent — draft QA and mail queue.'),
  m('staff-sophie-grant', 'Sophie', 'Grant', 'letter_ops_agent', 'dispute_processing', 'feminine', 'Letter Operations Agent — certified mail prep.'),
  m('staff-nate-brooks', 'Nate', 'Brooks', 'education_coach', 'credit_operations', 'masculine', 'Partner Education Coach — courses and checklists.'),
  m('staff-olivia-park', 'Olivia', 'Park', 'education_coach', 'growth_sessions', 'feminine', 'Partner Education Coach — library walkthroughs.'),
  m('staff-miles-chen', 'Miles', 'Chen', 'affiliate_specialist', 'marketing', 'masculine', 'Affiliate Success Specialist — referral kits.'),
  m('staff-harper-wells', 'Harper', 'Wells', 'affiliate_specialist', 'marketing', 'feminine', 'Affiliate Success Specialist — compliant promo copy.'),
  m('staff-nora-finch', 'Nora', 'Finch', 'evidence_specialist', 'dispute_processing', 'feminine', 'Evidence & Documentation Specialist — proof packs and vault.'),
  m('staff-quinn-hayes', 'Quinn', 'Hayes', 'crm_intake_specialist', 'internal_ops', 'neutral', 'CRM Intake Specialist — lead scoring and routing.', [WEEKDAY]),
  m('staff-leo-vance', 'Leo', 'Vance', 'underwriting_analyst', 'funding', 'masculine', 'Funding Underwriting Analyst — readiness review.'),
  m('staff-ines-ortega', 'Ines', 'Ortega', 'processing_agent', 'dispute_processing', 'feminine', 'Processing Agent — round timeline tracking.', [WEEKDAY]),
  m('staff-adrian-stone', 'Adrian', 'Stone', 'sales_closer', 'growth_sessions', 'masculine', 'Senior Solutions Director — enterprise DFY programs & package fit.', [WEEKDAY]),
  m('staff-brielle-monroe', 'Brielle', 'Monroe', 'sales_closer', 'growth_sessions', 'feminine', 'Executive Sales Advisor — tradeline, funding, and upgrade paths.', [WEEKDAY]),
  /** Day shift only — was WEEKDAY+EVENING (13h). Evening lead_converter coverage → Alex/Hannah or EVENING specialists. */
  m('staff-cameron-blake', 'Cameron', 'Blake', 'lead_converter', 'growth_sessions', 'masculine', 'Revenue Activation Director — trial-to-paid conversion & onboarding.', [WEEKDAY]),
  m('staff-elise-hart', 'Elise', 'Hart', 'social_creator', 'marketing', 'feminine', 'Growth Marketing Director — compliant campaigns & funnel creative.', [WEEKDAY, WEEKEND]),
  m('staff-drew-sinclair', 'Drew', 'Sinclair', 'affiliate_specialist', 'marketing', 'masculine', 'Partner Marketing Director — affiliate kits & co-marketing.', [WEEKDAY]),
  m('staff-aia-guide', 'Aia', 'Guide', 'nurture_concierge', 'growth_sessions', 'feminine', 'Onboarding guide — plain-language portal help and strategy call booking.'),
  { ...m('staff-naomi-fairchild', 'Naomi', 'Fairchild', 'ops_copilot', 'partner_success', 'feminine', 'Chief Operating Officer — human floor under Co-Owner Ruth.'), displayTitle: 'Chief Operating Officer' },
  { ...m('staff-david-okonkwo', 'David', 'Okonkwo', 'compliance_agent', 'internal_ops', 'masculine', 'Chief Compliance & Trust Officer — human backstop for claims and consent.'), displayTitle: 'Chief Compliance Officer' },
  { ...m('staff-marcus-sterling-exec', 'Marcus', 'Sterling', 'sales_closer', 'growth_sessions', 'masculine', 'Chief Revenue Officer — consult quality and ethical close.'), displayTitle: 'Chief Revenue Officer' },
  { ...m('staff-tamara-brooks-exec', 'Tamara', 'Brooks', 'social_creator', 'marketing', 'feminine', 'VP Marketing & Brand — premium campaigns with honest education.'), displayTitle: 'VP Marketing & Brand' },
  ...STAFF_ROSTER_EXPANSION,
];

let memoryRoster: StaffMember[] | null = null;
/** Bump when shift policy changes so in-memory/DB faces re-clamp without a full restart. */
const SHIFT_POLICY_VERSION = 5;
let appliedShiftPolicyVersion = 0;

function queueStaffRosterPersist(members: StaffMember[]) {
  if (typeof window === 'undefined') return;
  void import('./staffSupabaseSync').then(({ syncStaffRosterToSupabase }) => syncStaffRosterToSupabase({ members }));
}

export function seedStaffRoster(members: StaffMember[]): StaffMember[] {
  memoryRoster = mergeRosterFromSeed(members);
  appliedShiftPolicyVersion = SHIFT_POLICY_VERSION;
  return memoryRoster;
}

function mergeRosterFromSeed(existing: StaffMember[]): StaffMember[] {
  const seedById = new Map(STAFF_ROSTER_SEED.map((s) => [s.id, s]));
  const merged = existing.map((m) => {
    const seed = seedById.get(m.id);
    if (!seed) {
      return { ...m, shiftBlocks: clampStaffShiftBlocks(m.shiftBlocks) };
    }
    return {
      ...m,
      // Keep seeded role + active so evening coverage (e.g. Alex) is not lost from stale DB rows.
      primaryRoleId: seed.primaryRoleId,
      department: seed.department,
      active: seed.active,
      portraitGender: seed.portraitGender,
      avatarPath: seed.avatarPath,
      bioLine: m.bioLine || seed.bioLine,
      // Re-sync seeded duty windows so long stacked shifts (e.g. Cameron 8–21) don't stick in memory/DB.
      shiftBlocks: clampStaffShiftBlocks(seed.shiftBlocks),
    };
  });
  for (const seed of STAFF_ROSTER_SEED) {
    if (!merged.some((m) => m.id === seed.id)) merged.push(seed);
  }
  return merged;
}

/** Re-apply seed shift windows (max 8h) and push to Supabase — call when public chat opens. */
export function forceStaffShiftPolicyResync(): StaffMember[] {
  const base = memoryRoster?.length ? memoryRoster : STAFF_ROSTER_SEED;
  memoryRoster = mergeRosterFromSeed(base);
  appliedShiftPolicyVersion = SHIFT_POLICY_VERSION;
  queueStaffRosterPersist(memoryRoster);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('finely:store', { detail: { key: 'staffRoster.shiftPolicy' } }));
  }
  return memoryRoster;
}

export function loadStaffRoster(): StaffMember[] {
  if (!memoryRoster?.length) {
    memoryRoster = mergeRosterFromSeed(STAFF_ROSTER_SEED);
    appliedShiftPolicyVersion = SHIFT_POLICY_VERSION;
    return memoryRoster;
  }
  if (appliedShiftPolicyVersion !== SHIFT_POLICY_VERSION) {
    memoryRoster = mergeRosterFromSeed(memoryRoster);
    appliedShiftPolicyVersion = SHIFT_POLICY_VERSION;
    queueStaffRosterPersist(memoryRoster);
  }
  return memoryRoster;
}

export function saveStaffRoster(members: StaffMember[]) {
  memoryRoster = mergeRosterFromSeed(members);
  queueStaffRosterPersist(memoryRoster);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function listStaffByRole(roleId: AgentPersonaId): StaffMember[] {
  return loadStaffRoster().filter((s) => s.active && s.primaryRoleId === roleId);
}

/** Black team members featured on public marketing for portrait diversity. */
export const MARKETING_BLACK_STAFF_IDS = new Set([
  'staff-marcus-reed',
  'staff-jasmine-kerr',
  'staff-renee-cole',
  'staff-tyler-banks',
  'staff-victor-stone',
  'staff-adrian-stone',
  'staff-cameron-blake',
  'staff-omar-hassan',
  'staff-darnell-price',
  'staff-reginald-shaw',
  'staff-terrence-floyd',
  'staff-monique-baker',
  'staff-malcolm-grant',
  'staff-cedric-powell',
  'staff-andre-coleman',
  'staff-raheem-sullivan',
  'staff-yolanda-cruz',
  'staff-imani-cooper',
]);

/**
 * Curated public faces per lane — not the full roster.
 * Each strip shows up to four people with at least three Black team members where possible.
 */
const MARKETING_DISPLAY_BY_ROLE: Partial<Record<AgentPersonaId, string[]>> = {
  finely_advisor: ['staff-marcus-reed', 'staff-jasmine-kerr', 'staff-victor-stone', 'staff-morgan-hale'],
  dispute_coach: ['staff-jasmine-kerr', 'staff-adrian-stone', 'staff-taylor-brooks', 'staff-dana-kim'],
  funding_strategist: ['staff-marcus-reed', 'staff-cameron-blake', 'staff-mia-thompson', 'staff-derek-ford'],
  nurture_concierge: ['staff-ruby-santos', 'staff-avery-luna', 'staff-cameron-blake', 'staff-jasmine-kerr'],
  support_specialist: ['staff-tyler-banks', 'staff-jordan-patel', 'staff-lily-martinez', 'staff-ava-dunn'],
  appointment_setter: ['staff-nina-cole', 'staff-sam-ortiz', 'staff-victor-stone', 'staff-renee-cole'],
  sales_closer: ['staff-victor-stone', 'staff-adrian-stone', 'staff-riley-chen', 'staff-brielle-monroe'],
  lead_converter: ['staff-cameron-blake', 'staff-yolanda-cruz', 'staff-marcus-reed', 'staff-alex-wright'],
  debt_strategist: ['staff-omar-hassan', 'staff-darnell-price', 'staff-monique-baker', 'staff-terrence-floyd'],
  education_coach: ['staff-nate-brooks', 'staff-olivia-park', 'staff-jasmine-kerr', 'staff-priya-shah'],
  affiliate_specialist: ['staff-miles-chen', 'staff-harper-wells', 'staff-adrian-stone', 'staff-drew-sinclair'],
  social_creator: ['staff-jamie-foster', 'staff-elise-hart', 'staff-ethan-cross', 'staff-renee-cole'],
};

function pickDiverseMarketingSubset(pool: StaffMember[], max: number): StaffMember[] {
  if (pool.length <= max) return pool;
  const black = pool.filter((s) => MARKETING_BLACK_STAFF_IDS.has(s.id));
  const rest = pool.filter((s) => !MARKETING_BLACK_STAFF_IDS.has(s.id));
  const picked: StaffMember[] = [];
  for (const s of black) {
    if (picked.length >= max) break;
    picked.push(s);
  }
  for (const s of rest) {
    if (picked.length >= max) break;
    if (!picked.some((p) => p.id === s.id)) picked.push(s);
  }
  return picked.slice(0, max);
}

/** Public marketing strip — curated subset, not everyone on the roster. */
export function listMarketingDisplayStaff(roleId: AgentPersonaId, max = 4): StaffMember[] {
  const roster = loadStaffRoster().filter((s) => s.active);
  const byId = new Map(roster.map((s) => [s.id, s]));
  const curated = MARKETING_DISPLAY_BY_ROLE[roleId];
  if (curated?.length) {
    const picked = curated.map((id) => byId.get(id)).filter(Boolean) as StaffMember[];
    if (picked.length) return picked.slice(0, max);
  }
  return pickDiverseMarketingSubset(listStaffByRole(roleId), max);
}

const SALES_MARKETING_ROLES: AgentPersonaId[] = [
  'sales_closer',
  'lead_converter',
  'appointment_setter',
  'social_creator',
  'affiliate_specialist',
  'nurture_concierge',
];

/** Every active roster member partners can message — lane boosts relevant departments first. */
export function listAllMessageableStaff(lane?: string): StaffMember[] {
  const all = loadStaffRoster().filter((s) => s.active);
  const l = (lane || '').toLowerCase();
  if (!l) {
    return all.sort((a, b) => a.department.localeCompare(b.department) || a.firstName.localeCompare(b.firstName));
  }

  const priorityDepts = new Set<StaffMember['department']>();
  if (l.includes('debt') || l.includes('summons') || l.includes('bankruptcy') || l.includes('foreclosure')) priorityDepts.add('debt_resolution');
  if (l.includes('business') || l.includes('funding')) priorityDepts.add('funding');
  if (l.includes('tradeline') || l.includes('sales') || l.includes('upgrade')) priorityDepts.add('growth_sessions');
  if (l.includes('affiliate') || l.includes('referral') || l.includes('marketing')) priorityDepts.add('marketing');
  if (l.includes('restore') || l.includes('credit') || l.includes('dispute')) {
    priorityDepts.add('credit_operations');
    priorityDepts.add('dispute_processing');
  }
  priorityDepts.add('growth_sessions');
  priorityDepts.add('marketing');
  priorityDepts.add('partner_success');

  const score = (m: StaffMember) => {
    let s = 0;
    if (priorityDepts.has(m.department)) s += 10;
    if (SALES_MARKETING_ROLES.includes(m.primaryRoleId)) s += 5;
    return s;
  };

  return [...all].sort((a, b) => score(b) - score(a) || a.firstName.localeCompare(b.firstName));
}

/** Portal hub staff — full roster, lane-prioritized (no cap). */
export function listPortalStaffForLane(lane?: string): StaffMember[] {
  return listAllMessageableStaff(lane);
}

function shiftMatches(block: StaffShiftBlock, date: Date): boolean {
  return shiftBlockMatches(block, date);
}

/** Plain-language shift window for UI badges (active block, else full schedule). */
export function staffShiftSummary(member: StaffMember, date = new Date()): string {
  const block = activeShiftBlockForMember(member, date) ?? member.shiftBlocks[0];
  if (!block) return 'Schedule varies';
  return formatStaffShiftBlock(block);
}

export function staffFullShiftSchedule(member: StaffMember): string {
  return formatStaffShiftSchedule(member.shiftBlocks) || 'Schedule varies';
}

export function isStaffOnShift(member: StaffMember, date = new Date()): boolean {
  return staffMemberOnShift(member, date);
}

function preferAfterHoursStaff(pool: StaffMember[]): StaffMember[] {
  const evening = pool.filter((s) =>
    s.shiftBlocks.some((b) => isOvernightShiftBlock(b) || b.startHour >= 17),
  );
  return evening.length ? evening : pool;
}

/** Prefer curated marketing face order (e.g. Cameron before Alex for lead_converter). */
function orderStaffPoolForRole(roleId: AgentPersonaId, pool: StaffMember[]): StaffMember[] {
  const curated = MARKETING_DISPLAY_BY_ROLE[roleId];
  if (!curated?.length) return pool;
  const byId = new Map(pool.map((s) => [s.id, s]));
  const ordered: StaffMember[] = [];
  for (const id of curated) {
    const hit = byId.get(id);
    if (hit) ordered.push(hit);
  }
  for (const s of pool) {
    if (!ordered.some((o) => o.id === s.id)) ordered.push(s);
  }
  return ordered;
}

/** Stable daily rotation index — same face all day, changes at midnight local. */
function dailyRotationIndex(pool: StaffMember[], date: Date): number {
  if (!pool.length) return 0;
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
  return dayOfYear % pool.length;
}

/** On-duty human for a role at a given time. Daily shift rotation — never pins one face 24/7. */
export function resolveStaffOnDuty(roleId: AgentPersonaId, date = new Date()): StaffMember | null {
  const pool = orderStaffPoolForRole(roleId, listStaffByRole(roleId));
  if (!pool.length) return null;
  const onShift = pool.filter((s) => isStaffOnShift(s, date));
  if (onShift.length) return onShift[dailyRotationIndex(onShift, date)]!;
  const afterHours = preferAfterHoursStaff(pool);
  return afterHours[dailyRotationIndex(afterHours, date)] ?? null;
}

export { resolveStaffOnDutyForLane, resolveStaffForBankruptcyScenario, resolveStaffForLaneFocus } from './staffLaneAssignment';

export function getStaffMemberById(id: string): StaffMember | null {
  return loadStaffRoster().find((s) => s.id === id) ?? null;
}

export function ensureStaffRosterSeeded() {
  loadStaffRoster();
}

export function upsertStaffMember(member: StaffMember): StaffMember {
  const roster = loadStaffRoster();
  const idx = roster.findIndex((s) => s.id === member.id);
  const next = idx >= 0 ? roster.map((s, i) => (i === idx ? member : s)) : [...roster, member];
  saveStaffRoster(next);
  return member;
}

export function updateStaffMemberShifts(id: string, shiftBlocks: StaffShiftBlock[]): StaffMember | null {
  const roster = loadStaffRoster();
  const idx = roster.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const updated = { ...roster[idx]!, shiftBlocks: clampStaffShiftBlocks(shiftBlocks) };
  roster[idx] = updated;
  saveStaffRoster(roster);
  return updated;
}

/** Active roster members whose shift blocks include the given time. */
export function listStaffOnDutyNow(date = new Date()): StaffMember[] {
  return loadStaffRoster().filter((s) => s.active && s.shiftBlocks.some((b) => shiftMatches(b, date)));
}

/** Roles with no roster or no one on shift right now. */
export function listRoleCoverageGaps(roleIds: AgentPersonaId[], date = new Date()): string[] {
  const gaps: string[] = [];
  for (const roleId of roleIds) {
    const pool = listStaffByRole(roleId);
    if (!pool.length) {
      gaps.push(`${roleId}: no roster members`);
      continue;
    }
    const onShift = pool.some((s) => s.shiftBlocks.some((b) => shiftMatches(b, date)));
    if (!onShift) gaps.push(`${roleId}: no one on shift now`);
  }
  return gaps;
}
