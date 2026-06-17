import type { AgentPersona, AgentPersonaId } from '../domain/agentPersonas';
import { AGENT_PERSONAS, getAgentPersona } from '../domain/agentPersonas';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.agentPersonaOverrides.v1';

export type AgentPersonaOverride = {
  personaId: AgentPersonaId;
  /** Extra system prompt appended to base */
  promptAddendum?: string;
  /** Short personality descriptors editable by admin */
  personalityTraits?: string[];
  /** What this agent is great at */
  capabilities?: string[];
  /** Special powers / edge skills */
  superPowers?: string[];
  /** Preferred response languages */
  languages?: Array<'en' | 'ht' | 'fr'>;
  /** Max words per reply (human pacing) */
  maxReplyWords?: number;
  /** Wait ms before typing indicator (human feel) */
  typingDelayMs?: number;
  displayName?: string;
  displayTitle?: string;
  updatedAt?: string;
};

export type AgentPersonaOverridesStore = {
  overrides: Record<string, AgentPersonaOverride>;
  updatedAt: string;
};

function defaultStore(): AgentPersonaOverridesStore {
  return { overrides: {}, updatedAt: new Date().toISOString() };
}

export function loadPersonaOverrides(): AgentPersonaOverridesStore {
  return loadJson(KEY, defaultStore(), 1);
}

export function savePersonaOverrides(store: AgentPersonaOverridesStore) {
  saveJson(KEY, { ...store, updatedAt: new Date().toISOString() }, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function getPersonaOverride(id: AgentPersonaId): AgentPersonaOverride | undefined {
  return loadPersonaOverrides().overrides[id];
}

export function upsertPersonaOverride(patch: AgentPersonaOverride) {
  const store = loadPersonaOverrides();
  store.overrides[patch.personaId] = {
    ...store.overrides[patch.personaId],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  savePersonaOverrides(store);
}

/** Merge code defaults + admin overrides into effective persona for chat. */
export function getEffectiveAgentPersona(id: AgentPersonaId): AgentPersona {
  const base = getAgentPersona(id) ?? AGENT_PERSONAS[0]!;
  const o = getPersonaOverride(id);
  if (!o) return base;

  const traitBlock = [
    o.personalityTraits?.length ? `Personality: ${o.personalityTraits.join(', ')}.` : '',
    o.capabilities?.length ? `Capabilities: ${o.capabilities.join('; ')}.` : '',
    o.superPowers?.length ? `Super powers: ${o.superPowers.join('; ')}.` : '',
    o.languages?.length ? `Respond primarily in: ${o.languages.join(', ')} when the visitor uses that language.` : '',
    o.maxReplyWords ? `Keep replies under ${o.maxReplyWords} words unless they ask for detail.` : '',
    o.promptAddendum ?? '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    ...base,
    name: o.displayName?.trim() || base.name,
    displayTitle: o.displayTitle?.trim() || base.displayTitle,
    systemPrompt: traitBlock ? `${base.systemPrompt}\n\nAdmin-tuned traits:\n${traitBlock}` : base.systemPrompt,
    toneTags: o.personalityTraits?.length ? [...base.toneTags, ...o.personalityTraits].slice(0, 8) : base.toneTags,
  };
}

export function listEditablePersonas(): AgentPersona[] {
  return AGENT_PERSONAS.map((p) => getEffectiveAgentPersona(p.id));
}
