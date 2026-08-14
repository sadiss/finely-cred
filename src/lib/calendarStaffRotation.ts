import type {
  CalendarBookingHost,
  CalendarEvent,
  CalendarStaffAssignee,
  ConsultationTopic,
} from '../domain/calendar';
import type { AgentPersonaId } from '../domain/agentPersonas';
import type { StaffShiftBlock } from '../domain/staffMember';
import { shiftBlockMatches, staffMemberOnShift } from '../domain/staffMember';
import { getCalendarBookingSettings } from '../data/calendarSettingsRepo';
import { getStaffMemberById } from '../data/staffRoster';
import { getGrowthAgent } from '../features/growthAgents/growthAgentRegistry';
import { loadJson, saveJson } from '../data/localJsonStore';

const RR_KEY = 'finely.calendar.roundRobin.v1';

/** Default weekday shift for growth-agent session hosts (9–17 local). */
const WEEKDAY_SHIFT: StaffShiftBlock = { days: [1, 2, 3, 4, 5], startHour: 9, endHour: 17 };

type RoundRobinState = { lastIndex: number };

/** Known growth agents that can host public strategy sessions. */
export type GrowthAgentBookingProfile = {
  growthAgentId: string;
  displayName: string;
  defaultEmail: string;
  roleLabel: string;
  personaRoleId?: AgentPersonaId;
  defaultShiftBlocks?: StaffShiftBlock[];
  topics?: ConsultationTopic[];
};

export const GROWTH_AGENT_BOOKING_PROFILES: GrowthAgentBookingProfile[] = [
  {
    growthAgentId: 'appointment-setter',
    displayName: 'Alex Rivera',
    defaultEmail: 'alex@finelycred.com',
    roleLabel: 'Appointment Setter',
    personaRoleId: 'appointment_setter',
    defaultShiftBlocks: [WEEKDAY_SHIFT],
    topics: ['enlightenment', 'credit_restore', 'other', 'billing'],
  },
  {
    growthAgentId: 'lead-discovery',
    displayName: 'Caleb Brooks',
    defaultEmail: 'caleb@finelycred.com',
    roleLabel: 'Lead Discovery',
    personaRoleId: 'lead_converter',
    defaultShiftBlocks: [WEEKDAY_SHIFT],
    topics: ['enlightenment', 'funding_strategy', 'business_build', 'affiliate'],
  },
];

function loadRrState(): RoundRobinState {
  return loadJson<RoundRobinState>(RR_KEY, { lastIndex: -1 }, 1);
}

function saveRrState(state: RoundRobinState) {
  saveJson(RR_KEY, state, 1);
}

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Match staff assignee to a growth agent profile by explicit id, email, or display name. */
export function resolveGrowthAgentIdForAssignee(assignee: CalendarStaffAssignee): string | undefined {
  if (assignee.growthAgentId?.trim()) return assignee.growthAgentId.trim();
  const email = normEmail(assignee.email);
  const name = normName(assignee.displayName);
  for (const p of GROWTH_AGENT_BOOKING_PROFILES) {
    if (email && email === normEmail(p.defaultEmail)) return p.growthAgentId;
    if (name && name === normName(p.displayName)) return p.growthAgentId;
  }
  return undefined;
}

export function getGrowthAgentBookingProfile(growthAgentId: string): GrowthAgentBookingProfile | undefined {
  return GROWTH_AGENT_BOOKING_PROFILES.find((p) => p.growthAgentId === growthAgentId);
}

function assigneeShiftBlocks(assignee: CalendarStaffAssignee): StaffShiftBlock[] {
  if (assignee.shiftBlocks?.length) return assignee.shiftBlocks;
  const agentId = resolveGrowthAgentIdForAssignee(assignee);
  if (agentId) {
    const profile = getGrowthAgentBookingProfile(agentId);
    if (profile?.defaultShiftBlocks?.length) return profile.defaultShiftBlocks;
  }
  return [WEEKDAY_SHIFT];
}

/** True when assignee is on shift at the given time (slot time or now). */
export function isAssigneeOnDuty(assignee: CalendarStaffAssignee, at = new Date()): boolean {
  if (!assignee.enabled) return false;
  if (assignee.respectShiftSchedule === false) return true;

  if (assignee.staffRosterId) {
    const member = getStaffMemberById(assignee.staffRosterId);
    if (member) return staffMemberOnShift(member, at);
  }

  const blocks = assigneeShiftBlocks(assignee);
  return blocks.some((b) => shiftBlockMatches(b, at));
}

/** Enabled staff with valid email — base pool before shift/topic filters. */
export function activeStaffAssignees(settings = getCalendarBookingSettings()): CalendarStaffAssignee[] {
  return (settings.staffAssignees ?? []).filter((s) => s.enabled && s.email.includes('@'));
}

/** On-duty subset of enabled staff for rotation at a given slot time. */
export function activeStaffAssigneesOnDuty(
  settings = getCalendarBookingSettings(),
  at = new Date(),
): CalendarStaffAssignee[] {
  return activeStaffAssignees(settings).filter((s) => isAssigneeOnDuty(s, at));
}

function filterPoolByTopic(pool: CalendarStaffAssignee[], topic?: ConsultationTopic): CalendarStaffAssignee[] {
  if (!topic) return pool;
  const matched = pool.filter((s) => !s.topics?.length || s.topics.includes(topic));
  if (matched.length) return matched;
  const byProfile = pool.filter((s) => {
    const agentId = resolveGrowthAgentIdForAssignee(s);
    if (!agentId) return true;
    const profile = getGrowthAgentBookingProfile(agentId);
    return !profile?.topics?.length || profile.topics.includes(topic);
  });
  return byProfile.length ? byProfile : pool;
}

export type PickHostOptions = {
  /** Slot start time — on-duty check uses this, not booking confirmation time. */
  at?: Date;
  topic?: ConsultationTopic;
  /** When false, return first on-duty host without advancing round-robin cursor. */
  advanceCursor?: boolean;
};

/**
 * Pick the next host for a confirmed booking (round-robin when enabled).
 * Persists cursor so bookings alternate fairly across the on-duty team.
 */
export function pickRoundRobinAssignee(
  settings = getCalendarBookingSettings(),
  opts?: PickHostOptions,
): CalendarStaffAssignee | null {
  if (!settings.roundRobinEnabled) return null;
  const at = opts?.at ?? new Date();
  let pool = activeStaffAssigneesOnDuty(settings, at);
  pool = filterPoolByTopic(pool, opts?.topic);
  if (!pool.length) {
    pool = filterPoolByTopic(activeStaffAssignees(settings), opts?.topic);
  }
  if (!pool.length) return null;

  const state = loadRrState();
  const nextIndex = (state.lastIndex + 1) % pool.length;
  if (opts?.advanceCursor !== false) {
    saveRrState({ lastIndex: nextIndex });
  }
  return pool[nextIndex] ?? null;
}

/** Resolve explicit host override or round-robin pick into a booking host record. */
export function resolveBookingHost(args?: {
  hostName?: string;
  hostRoleLabel?: string;
  hostEmail?: string;
  staffAssigneeId?: string;
  at?: Date;
  topic?: ConsultationTopic;
  settings?: ReturnType<typeof getCalendarBookingSettings>;
}): CalendarBookingHost {
  const settings = args?.settings ?? getCalendarBookingSettings();
  const at = args?.at ?? new Date();

  if (args?.staffAssigneeId) {
    const explicit = (settings.staffAssignees ?? []).find((s) => s.id === args.staffAssigneeId);
    if (explicit) {
      return assigneeToBookingHost(explicit);
    }
  }

  if (args?.hostName?.trim()) {
    const byName = (settings.staffAssignees ?? []).find(
      (s) => normName(s.displayName) === normName(args.hostName!),
    );
    if (byName) return assigneeToBookingHost(byName);
    return {
      displayName: args.hostName.trim(),
      email: args.hostEmail?.trim(),
      roleLabel: args.hostRoleLabel?.trim(),
    };
  }

  const picked = pickRoundRobinAssignee(settings, { at, topic: args?.topic });
  if (picked) return assigneeToBookingHost(picked);

  const onDuty = activeStaffAssigneesOnDuty(settings, at);
  const fallbackAssignee = onDuty[0] ?? activeStaffAssignees(settings)[0];
  if (fallbackAssignee) return assigneeToBookingHost(fallbackAssignee);

  const alex = getGrowthAgentBookingProfile('appointment-setter');
  return {
    displayName: alex?.displayName ?? 'Alex Rivera',
    email: alex?.defaultEmail,
    roleLabel: alex?.roleLabel ?? 'Session Coordinator',
    growthAgentId: 'appointment-setter',
  };
}

export function assigneeToBookingHost(assignee: CalendarStaffAssignee): CalendarBookingHost {
  const growthAgentId = resolveGrowthAgentIdForAssignee(assignee);
  const profile = growthAgentId ? getGrowthAgentBookingProfile(growthAgentId) : undefined;
  const agent = growthAgentId ? getGrowthAgent(growthAgentId) : undefined;
  return {
    staffAssigneeId: assignee.id,
    displayName: assignee.displayName.trim() || profile?.displayName || agent?.name || 'Session host',
    email: assignee.email.trim() || profile?.defaultEmail,
    roleLabel: assignee.roleLabel?.trim() || profile?.roleLabel || agent?.roleTitle,
    growthAgentId,
  };
}

/** Host for Alex/Caleb outreach emails — respects on-duty rotation for that agent. */
export function resolveOutreachHostForGrowthAgent(
  growthAgentId: string,
  at = new Date(),
): CalendarBookingHost {
  const settings = getCalendarBookingSettings();
  const pool = activeStaffAssignees(settings).filter((s) => resolveGrowthAgentIdForAssignee(s) === growthAgentId);
  const onDuty = pool.filter((s) => isAssigneeOnDuty(s, at));
  const hit = onDuty[0] ?? pool[0];
  if (hit) return assigneeToBookingHost(hit);

  const profile = getGrowthAgentBookingProfile(growthAgentId);
  const agent = getGrowthAgent(growthAgentId);
  return {
    displayName: profile?.displayName ?? agent?.name ?? 'Session Coordinator',
    email: profile?.defaultEmail,
    roleLabel: profile?.roleLabel ?? agent?.roleTitle ?? 'Session Coordinator',
    growthAgentId,
  };
}

/** Read persisted host from a calendar event, with growth-agent fallback. */
export function resolveHostFromEvent(ev: CalendarEvent): CalendarBookingHost {
  if (ev.hostDisplayName || ev.hostStaffAssigneeId || ev.hostGrowthAgentId) {
    return {
      staffAssigneeId: ev.hostStaffAssigneeId,
      displayName: ev.hostDisplayName ?? 'Session host',
      email: ev.hostEmail,
      roleLabel: ev.hostRoleLabel,
      growthAgentId: ev.hostGrowthAgentId,
    };
  }
  return resolveBookingHost({ at: new Date(ev.startAt) });
}

export function calendarHostFieldsFromBookingHost(host: CalendarBookingHost): Pick<
  CalendarEvent,
  'hostStaffAssigneeId' | 'hostDisplayName' | 'hostEmail' | 'hostRoleLabel' | 'hostGrowthAgentId'
> {
  return {
    hostStaffAssigneeId: host.staffAssigneeId,
    hostDisplayName: host.displayName,
    hostEmail: host.email,
    hostRoleLabel: host.roleLabel,
    hostGrowthAgentId: host.growthAgentId,
  };
}

/** Summary for admin UI — who's in rotation and on duty now. */
export function describeStaffRotationStatus(at = new Date()) {
  const settings = getCalendarBookingSettings();
  const enabled = activeStaffAssignees(settings);
  const onDuty = activeStaffAssigneesOnDuty(settings, at);
  const nextHost = settings.roundRobinEnabled
    ? pickRoundRobinAssignee(settings, { at, advanceCursor: false })
    : null;
  return {
    roundRobinEnabled: Boolean(settings.roundRobinEnabled),
    enabledCount: enabled.length,
    onDutyCount: onDuty.length,
    onDuty: onDuty.map((s) => ({
      ...assigneeToBookingHost(s),
      onDuty: true,
    })),
    offDuty: enabled
      .filter((s) => !isAssigneeOnDuty(s, at))
      .map((s) => ({ ...assigneeToBookingHost(s), onDuty: false })),
    nextHost: nextHost ? assigneeToBookingHost(nextHost) : null,
  };
}

export function resetRoundRobinCursor() {
  saveRrState({ lastIndex: -1 });
}
