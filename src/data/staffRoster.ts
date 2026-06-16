import type { AgentPersonaId } from '../domain/agentPersonas';
import type { PortraitGender, StaffMember, StaffShiftBlock } from '../domain/staffMember';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.staffRoster.v2';

const WEEKDAY: StaffShiftBlock = { days: [1, 2, 3, 4, 5], startHour: 8, endHour: 17 };
const WEEKEND: StaffShiftBlock = { days: [0, 6], startHour: 9, endHour: 18 };
const EVENING: StaffShiftBlock = { days: [1, 2, 3, 4, 5], startHour: 17, endHour: 21 };

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
    shiftBlocks: shifts,
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
  m('staff-riley-chen', 'Riley', 'Chen', 'sales_closer', 'growth_sessions', 'feminine', 'Solutions Advisor — DIY vs DFY fit.', [WEEKDAY, EVENING]),
  m('staff-alex-wright', 'Alex', 'Wright', 'lead_converter', 'partner_success', 'masculine', 'Partner Activation Specialist — trial uploads.'),
  m('staff-jamie-foster', 'Jamie', 'Foster', 'social_creator', 'marketing', 'feminine', 'Brand & Growth Specialist — compliant campaigns.'),
  m('staff-dana-kim', 'Dana', 'Kim', 'dispute_coach', 'dispute_processing', 'feminine', 'Dispute Processing Specialist — round sequencing.'),
  m('staff-elena-voss', 'Elena', 'Voss', 'processing_agent', 'dispute_processing', 'feminine', 'Processing Agent — bureau response review and report triage.'),
  m('staff-noah-grant', 'Noah', 'Grant', 'dispute_coach', 'dispute_processing', 'masculine', 'Dispute Processing Specialist — evidence linking.'),
  m('staff-priya-shah', 'Priya', 'Shah', 'finely_advisor', 'credit_operations', 'feminine', 'Credit Restoration Specialist — education coach.'),
  m('staff-chris-alvarez', 'Chris', 'Alvarez', 'finely_advisor', 'credit_operations', 'masculine', 'Credit Restoration Specialist — checklist lane.'),
  m('staff-mia-thompson', 'Mia', 'Thompson', 'funding_strategist', 'funding', 'feminine', 'Funding Strategist — vendor ladder sequencing.'),
  m('staff-derek-ford', 'Derek', 'Ford', 'funding_strategist', 'funding', 'masculine', 'Business Credit Strategist — entity hygiene.'),
  m('staff-sienna-roy', 'Sienna', 'Roy', 'debt_strategist', 'debt_resolution', 'feminine', 'Debt Resolution Specialist — collections review.'),
  m('staff-omar-hassan', 'Omar', 'Hassan', 'debt_strategist', 'debt_resolution', 'masculine', 'Debt Resolution Specialist — summons awareness.'),
  m('staff-lily-martinez', 'Lily', 'Martinez', 'support_specialist', 'partner_success', 'feminine', 'Partner Success Specialist — documents vault.'),
  m('staff-tyler-banks', 'Tyler', 'Banks', 'support_specialist', 'partner_success', 'masculine', 'Partner Success Specialist — billing questions.'),
  m('staff-nina-cole', 'Nina', 'Cole', 'appointment_setter', 'growth_sessions', 'feminine', 'Session Coordinator — calendar follow-up.'),
  m('staff-victor-stone', 'Victor', 'Stone', 'sales_closer', 'growth_sessions', 'masculine', 'Solutions Advisor — tradeline education.', [EVENING]),
  m('staff-hannah-lee', 'Hannah', 'Lee', 'lead_converter', 'partner_success', 'feminine', 'Partner Activation Specialist — first report upload.'),
  m('staff-isaac-bell', 'Isaac', 'Bell', 'ops_copilot', 'internal_ops', 'masculine', 'Operations Agent — workflow queue.'),
  m('staff-zara-mitchell', 'Zara', 'Mitchell', 'ops_copilot', 'internal_ops', 'feminine', 'Operations Agent — automation monitoring.'),
  m('staff-ethan-cross', 'Ethan', 'Cross', 'social_creator', 'marketing', 'masculine', 'Brand Specialist — funnel creative.'),
  m('staff-ruby-santos', 'Ruby', 'Santos', 'nurture_concierge', 'growth_sessions', 'feminine', 'Welcome Concierge — lead magnet follow-up.', [WEEKEND]),
  m('staff-calvin-wu', 'Calvin', 'Wu', 'finely_advisor', 'credit_operations', 'masculine', 'Credit Restoration Specialist — score roadmap.'),
  m('staff-jasmine-kerr', 'Jasmine', 'Kerr', 'dispute_coach', 'dispute_processing', 'feminine', 'Dispute Processing Specialist — letter QA.'),
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
  m('staff-quinn-hayes', 'Quinn', 'Hayes', 'crm_intake_specialist', 'internal_ops', 'neutral', 'CRM Intake Specialist — lead scoring and routing.', [WEEKDAY, EVENING]),
  m('staff-leo-vance', 'Leo', 'Vance', 'underwriting_analyst', 'funding', 'masculine', 'Funding Underwriting Analyst — readiness review.'),
  m('staff-ines-ortega', 'Ines', 'Ortega', 'processing_agent', 'dispute_processing', 'feminine', 'Processing Agent — round timeline tracking.', [WEEKDAY, EVENING]),
  m('staff-adrian-stone', 'Adrian', 'Stone', 'sales_closer', 'growth_sessions', 'masculine', 'Senior Solutions Director — enterprise DFY programs & package fit.', [WEEKDAY, EVENING]),
  m('staff-brielle-monroe', 'Brielle', 'Monroe', 'sales_closer', 'growth_sessions', 'feminine', 'Executive Sales Advisor — tradeline, funding, and upgrade paths.', [WEEKDAY, EVENING]),
  m('staff-cameron-blake', 'Cameron', 'Blake', 'lead_converter', 'growth_sessions', 'masculine', 'Revenue Activation Director — trial-to-paid conversion & onboarding.', [WEEKDAY, EVENING]),
  m('staff-elise-hart', 'Elise', 'Hart', 'social_creator', 'marketing', 'feminine', 'Growth Marketing Director — compliant campaigns & funnel creative.', [WEEKDAY, WEEKEND]),
  m('staff-drew-sinclair', 'Drew', 'Sinclair', 'affiliate_specialist', 'marketing', 'masculine', 'Partner Marketing Director — affiliate kits & co-marketing.', [WEEKDAY, EVENING]),
];

type Store = { members: StaffMember[]; version?: number };

function defaultStore(): Store {
  return { members: STAFF_ROSTER_SEED, version: 4 };
}

function mergeRosterFromSeed(existing: StaffMember[]): StaffMember[] {
  const seedById = new Map(STAFF_ROSTER_SEED.map((s) => [s.id, s]));
  const merged = existing.map((m) => {
    const seed = seedById.get(m.id);
    if (!seed) return m;
    return {
      ...m,
      portraitGender: seed.portraitGender,
      avatarPath: seed.avatarPath,
      bioLine: m.bioLine || seed.bioLine,
    };
  });
  for (const seed of STAFF_ROSTER_SEED) {
    if (!merged.some((m) => m.id === seed.id)) merged.push(seed);
  }
  return merged;
}

export function loadStaffRoster(): StaffMember[] {
  const legacy = loadJson<{ members?: StaffMember[] }>('finely.staffRoster.v1', { members: [] }, 1);
  const store = loadJson(KEY, defaultStore(), 1);
  if (!store.members?.length) {
    if (legacy.members?.length) {
      const migrated = mergeRosterFromSeed(legacy.members);
      saveStaffRoster(migrated);
      return migrated;
    }
    return STAFF_ROSTER_SEED;
  }
  if (store.version !== 4 || store.members.some((m) => !m.portraitGender)) {
    const migrated = mergeRosterFromSeed(store.members);
    saveStaffRoster(migrated);
    return migrated;
  }
  return store.members;
}

export function saveStaffRoster(members: StaffMember[]) {
  saveJson(KEY, { members, version: 4 }, 1);
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
  lead_converter: ['staff-cameron-blake', 'staff-alex-wright', 'staff-hannah-lee', 'staff-marcus-reed'],
  debt_strategist: ['staff-omar-hassan', 'staff-casey-nguyen', 'staff-sienna-roy', 'staff-tyler-banks'],
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
  if (l.includes('debt') || l.includes('summons')) priorityDepts.add('debt_resolution');
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
  const day = date.getDay();
  const hour = date.getHours();
  return block.days.includes(day) && hour >= block.startHour && hour < block.endHour;
}

/** On-duty human for a role at a given time; falls back to first active member for role. */
export function resolveStaffOnDuty(roleId: AgentPersonaId, date = new Date()): StaffMember | null {
  const pool = listStaffByRole(roleId);
  if (!pool.length) return null;
  const onShift = pool.find((s) => s.shiftBlocks.some((b) => shiftMatches(b, date)));
  return onShift ?? pool[0]!;
}

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
  const updated = { ...roster[idx]!, shiftBlocks };
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
