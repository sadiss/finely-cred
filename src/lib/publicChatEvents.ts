import type { LeadMagnetFunnelConfig } from '../domain/leadMagnetFunnels';

import type { AgentPersonaId } from '../domain/agentPersonas';
import type { ChatLocale } from './publicChatI18n';

export type PublicChatGoal = 'personal' | 'business' | 'tradelines' | 'debt' | 'not_sure' | 'haitian' | 'building';

export type OpenPublicChatIntent = 'upload_report';

export type OpenPublicChatDetail = {
  goal?: PublicChatGoal;
  personaId?: AgentPersonaId;
  leadId?: string;
  locale?: ChatLocale;
  intent?: OpenPublicChatIntent;
  initialDraft?: string;
};

export const OPEN_PUBLIC_CHAT_EVENT = 'finely:open-public-chat';

export function goalFromFunnelConfig(config: LeadMagnetFunnelConfig): PublicChatGoal {
  if (config.id === 'debt') return 'debt';
  if (config.id === 'business' || config.id === 'agency') return 'business';
  if (config.id === 'tradeline') return 'tradelines';
  if (config.id === 'kreyol' || config.id === 'haitian') return 'haitian';
  if (config.id === 'affiliate') return 'not_sure';
  return 'personal';
}

export function openPublicChat(detail?: OpenPublicChatDetail) {
  window.dispatchEvent(new CustomEvent(OPEN_PUBLIC_CHAT_EVENT, { detail: detail ?? {} }));
}
