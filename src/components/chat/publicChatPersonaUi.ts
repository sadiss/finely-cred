import type { AgentPersona, AgentPersonaId } from '../../domain/agentPersonas';
import { resolveChatStaffPresentation, refreshChatStaffPresentation } from '../../lib/chatStaffPresentation';

export type { PublicChatPersonaPresentation } from '../../lib/chatPersonaStyles';
export { PERSONA_PRESENTATION_STYLES, welcomeForDutyStaff } from '../../lib/chatPersonaStyles';

export function getPublicChatPersonaPresentation(
  persona: AgentPersona,
  date = new Date(),
) {
  return resolveChatStaffPresentation({ personaId: persona.id, date }).presentation;
}

export function refreshPublicChatOnDutyPresentation(date = new Date()) {
  return refreshChatStaffPresentation({ date }).presentation;
}

export function getPublicChatPersonaPresentationById(id: AgentPersonaId, date = new Date()) {
  return resolveChatStaffPresentation({ personaId: id, date }).presentation;
}

export function getPublicChatOnDutyPresentation(date = new Date()) {
  return resolveChatStaffPresentation({ date }).presentation;
}
