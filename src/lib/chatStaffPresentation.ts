import type { AgentPersona, AgentPersonaId } from '../domain/agentPersonas';
import { getAgentPersona } from '../domain/agentPersonas';
import { personaOnDutyAt, getPortalStaffPersona, portalPersonaForLane } from '../data/agentPersonasRepo';
import {
  ensureStaffRosterSeeded,
  forceStaffShiftPolicyResync,
  getStaffMemberById,
  loadStaffRoster,
  resolveStaffOnDuty,
  resolveStaffOnDutyForLane,
} from '../data/staffRoster';
import { staffMemberFullName, type StaffMember } from '../domain/staffMember';
import { resolveStaffPortraitUrl } from './staffPortrait';
import { CO_OWNER_IDENTITY } from '../domain/coOwnerPersona';
import {
  PERSONA_PRESENTATION_STYLES,
  type PublicChatPersonaPresentation,
  welcomeForDutyStaff,
} from './chatPersonaStyles';

export type ChatStaffAudience = 'guest' | 'partner';

export type ChatStaffPresentation = {
  presentation: PublicChatPersonaPresentation;
  staff: StaffMember | null;
  persona: AgentPersona;
  personaId: AgentPersonaId;
  /** Plain-language personality hints from persona + staff bio */
  personalityHint: string;
  welcomeWithAiDisclosure: string;
  aiAssistBadgeLabel: string;
};

function initialsFor(firstName: string, lastName?: string): string {
  if (lastName?.trim()) return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const parts = firstName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? 'FC').toUpperCase();
}

function firstActiveRosterMember(): StaffMember | null {
  return loadStaffRoster().find((s) => s.active) ?? null;
}

function resolveStaffForContext(args: {
  personaId?: AgentPersonaId;
  lane?: string;
  date: Date;
  staffMemberId?: string | null;
}): { staff: StaffMember | null; persona: AgentPersona; personaId: AgentPersonaId } {
  if (args.staffMemberId) {
    const staff = getStaffMemberById(args.staffMemberId);
    if (staff) {
      const persona = getPortalStaffPersona(staff.primaryRoleId);
      return { staff, persona, personaId: staff.primaryRoleId };
    }
  }

  let personaId = args.personaId;
  if (!personaId) {
    personaId = args.lane ? portalPersonaForLane(args.lane).id : personaOnDutyAt(args.date).id;
  }
  const persona = getPortalStaffPersona(personaId);
  const staff =
    (args.lane ? resolveStaffOnDutyForLane(args.lane, args.date) : null) ??
    resolveStaffOnDuty(personaId, args.date) ??
    firstActiveRosterMember();

  return { staff, persona, personaId };
}

function buildPresentation(
  persona: AgentPersona,
  staff: StaffMember | null,
  date: Date,
): PublicChatPersonaPresentation {
  const base = PERSONA_PRESENTATION_STYLES[persona.id] ?? PERSONA_PRESENTATION_STYLES.finely_advisor;
  const dutyStaff = staff ?? firstActiveRosterMember();
  const firstName = dutyStaff?.firstName ?? base.firstName;
  const lastName = dutyStaff?.lastName ?? '';
  const title = dutyStaff?.displayTitle || persona.displayTitle || base.title;
  const avatarUrl = dutyStaff ? resolveStaffPortraitUrl(dutyStaff) : resolveStaffPortraitUrl(firstActiveRosterMember()!);

  return {
    ...base,
    firstName,
    title,
    welcome: welcomeForDutyStaff(base.welcome, base.firstName, firstName),
    initials: initialsFor(firstName, lastName),
    avatarUrl,
    staffMemberId: dutyStaff?.id,
  };
}

export function buildAiDisclosureWelcome(
  presentation: Pick<PublicChatPersonaPresentation, 'firstName' | 'title' | 'welcome'>,
  audience: ChatStaffAudience,
): string {
  const pronoun = 'they';
  const disclosure = `You're chatting with Finely's AI, standing in for ${presentation.firstName}, ${presentation.title} — ${pronoun}'ll take over live when you're ready.`;
  const tail =
    audience === 'partner'
      ? 'Ask anything about your portal, disputes, documents, or funding — or tap a suggestion below.'
      : 'Pick a lane or tell me what you need — restore, business credit, debt help, or a free session.';
  return `${disclosure}\n\n${presentation.welcome}\n\n${tail}`;
}

export function buildAiAssistSystemPrompt(args: {
  presentation: Pick<PublicChatPersonaPresentation, 'firstName' | 'title'>;
  persona: AgentPersona;
  staff: StaffMember | null;
  personalityHint: string;
  audience: ChatStaffAudience;
  extra?: string;
}): string {
  const liveName = args.staff ? staffMemberFullName(args.staff) : args.presentation.firstName;
  const audienceLabel = args.audience === 'partner' ? 'partner' : 'guest';
  return [
    `You are Finely Cred's AI assistant, speaking in ${args.presentation.firstName}'s voice as ${args.presentation.title}.`,
    `You are NOT ${liveName} — you are AI assisting on ${liveName}'s behalf until they can take over live. Do not pretend to be human.`,
    `Tone: ${args.persona.toneTags.join(', ') || 'warm, clear, educational'}.`,
    args.personalityHint ? `Personality: ${args.personalityHint}` : null,
    args.staff?.bioLine ? `Role focus: ${args.staff.bioLine}` : null,
    `Refer to logged-in portal users as partners; public visitors are guests — never "client", "customer", or "user".`,
    `Never give legal advice. Never guarantee deletions or score increases.`,
    `When the ${audienceLabel} asks for a human, live person, or ${args.presentation.firstName} directly, explain you will connect them — ${args.audience === 'partner' ? 'offer Team chat or a routing chip' : 'offer a free strategy session or Communication Hub after they create a partner account'}.`,
    args.extra?.trim() || null,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Single resolver for every chat face — launcher, header, bubbles, typing indicator,
 * lane pickers, and portal coach. Portrait, name, role, and tone all come from the
 * same on-shift staff record (or first active roster member as last resort).
 */
export function resolveChatStaffPresentation(args?: {
  personaId?: AgentPersonaId;
  lane?: string;
  date?: Date;
  staffMemberId?: string | null;
  audience?: ChatStaffAudience;
}): ChatStaffPresentation {
  ensureStaffRosterSeeded();
  const date = args?.date ?? new Date();
  const audience = args?.audience ?? 'guest';
  const { staff, persona, personaId } = resolveStaffForContext({
    personaId: args?.personaId,
    lane: args?.lane,
    date,
    staffMemberId: args?.staffMemberId,
  });
  const presentation = buildPresentation(persona, staff, date);
  const personalityHint = [
    persona.voiceProfile ? `voice ${persona.voiceProfile}` : null,
    persona.toneTags.length ? persona.toneTags.join(', ') : null,
    staff?.bioLine ?? null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    presentation,
    staff,
    persona,
    personaId,
    personalityHint,
    welcomeWithAiDisclosure: buildAiDisclosureWelcome(presentation, audience),
    aiAssistBadgeLabel: 'AI assist',
  };
}

export function refreshChatStaffPresentation(args?: Parameters<typeof resolveChatStaffPresentation>[0]): ChatStaffPresentation {
  forceStaffShiftPolicyResync();
  return resolveChatStaffPresentation(args);
}
