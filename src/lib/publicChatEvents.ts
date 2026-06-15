import type { LeadMagnetFunnelConfig } from '../domain/leadMagnetFunnels';

import type { AgentPersonaId } from '../domain/agentPersonas';

export type PublicChatGoal = 'personal' | 'business' | 'tradelines' | 'debt' | 'not_sure';

export const OPEN_PUBLIC_CHAT_EVENT = 'finely:open-public-chat';

export function goalFromFunnelConfig(config: LeadMagnetFunnelConfig): PublicChatGoal {
  if (config.id === 'debt') return 'debt';
  if (config.id === 'business' || config.id === 'agency') return 'business';
  if (config.id === 'tradeline') return 'tradelines';
  if (config.id === 'affiliate') return 'not_sure';
  return 'personal';
}

export function openPublicChat(detail?: { goal?: PublicChatGoal; personaId?: AgentPersonaId; leadId?: string }) {
  window.dispatchEvent(new CustomEvent(OPEN_PUBLIC_CHAT_EVENT, { detail: detail ?? {} }));
}
