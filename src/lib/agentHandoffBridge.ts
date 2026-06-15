import type { AgentPersonaId } from '../domain/agentPersonas';
import { loadJson, saveJson } from '../data/localJsonStore';

const KEY = 'finely.agentHandoff.v1';

export type AgentHandoffContext = {
  personaId: AgentPersonaId;
  goal?: string;
  leadId?: string;
  email?: string;
  surface: 'public_chat' | 'funnel' | 'lead_magnet';
  at: string;
};

type Store = { handoff: AgentHandoffContext | null };

function loadStore(): Store {
  return loadJson(KEY, { handoff: null }, 1);
}

/** Persist public → portal persona context for seamless handoff (Phase 6). */
export function saveAgentHandoff(args: Omit<AgentHandoffContext, 'at'>) {
  const handoff: AgentHandoffContext = { ...args, at: new Date().toISOString() };
  saveJson(KEY, { handoff }, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function loadAgentHandoff(): AgentHandoffContext | null {
  return loadStore().handoff;
}

/** Read handoff without clearing (onboarding banner). */
export function peekAgentHandoff(maxAgeMs = 7 * 86400000): AgentHandoffContext | null {
  const h = loadAgentHandoff();
  if (!h) return null;
  if (Date.now() - Date.parse(h.at) > maxAgeMs) return null;
  return h;
}

export function clearAgentHandoff() {
  saveJson(KEY, { handoff: null }, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function consumeAgentHandoff(maxAgeMs = 7 * 86400000): AgentHandoffContext | null {
  const h = loadAgentHandoff();
  if (!h) return null;
  if (Date.now() - Date.parse(h.at) > maxAgeMs) {
    clearAgentHandoff();
    return null;
  }
  clearAgentHandoff();
  return h;
}
