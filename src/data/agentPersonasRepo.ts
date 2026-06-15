import type { AgentPersona, AgentPersonaId } from '../domain/agentPersonas';
import { AGENT_PERSONAS, getAgentPersona } from '../domain/agentPersonas';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.agentStaff.v1';

export type PersonaShiftBlock = {
  personaId: AgentPersonaId;
  /** 0=Sun … 6=Sat */
  days: number[];
  startHour: number;
  endHour: number;
};

export type AgentStaffConfig = {
  shifts: PersonaShiftBlock[];
  /** Override which persona is default for public chat when no shift matches */
  publicDefaultPersonaId: AgentPersonaId;
  portalDefaultPersonaId: AgentPersonaId;
  updatedAt: string;
};

const DEFAULT_SHIFTS: PersonaShiftBlock[] = [
  { personaId: 'finely_advisor', days: [1, 2, 3, 4, 5], startHour: 8, endHour: 17 },
  { personaId: 'sales_closer', days: [1, 2, 3, 4, 5], startHour: 17, endHour: 21 },
  { personaId: 'nurture_concierge', days: [0, 6], startHour: 9, endHour: 20 },
  { personaId: 'debt_strategist', days: [2, 4], startHour: 10, endHour: 16 },
];

function defaultConfig(): AgentStaffConfig {
  return {
    shifts: DEFAULT_SHIFTS,
    publicDefaultPersonaId: 'finely_advisor',
    portalDefaultPersonaId: 'support_specialist',
    updatedAt: new Date().toISOString(),
  };
}

export function loadAgentStaffConfig(): AgentStaffConfig {
  return loadJson(KEY, defaultConfig(), 1);
}

export function saveAgentStaffConfig(cfg: AgentStaffConfig) {
  saveJson(KEY, { ...cfg, updatedAt: new Date().toISOString() }, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function listAllPersonas(): AgentPersona[] {
  return [...AGENT_PERSONAS];
}

export function personaOnDutyAt(date = new Date()): AgentPersona {
  const cfg = loadAgentStaffConfig();
  const day = date.getDay();
  const hour = date.getHours();
  for (const block of cfg.shifts) {
    if (!block.days.includes(day)) continue;
    if (hour >= block.startHour && hour < block.endHour) {
      return getAgentPersona(block.personaId) ?? getAgentPersona(cfg.publicDefaultPersonaId)!;
    }
  }
  return getAgentPersona(cfg.publicDefaultPersonaId) ?? AGENT_PERSONAS[0]!;
}

export function portalPersonaForLane(lane?: string): AgentPersona {
  const cfg = loadAgentStaffConfig();
  const l = (lane || '').toLowerCase();
  if (l.includes('debt') || l.includes('summons')) return getAgentPersona('debt_strategist')!;
  if (l.includes('business') || l.includes('funding')) return getAgentPersona('funding_strategist')!;
  if (l.includes('sales') || l.includes('upgrade')) return getAgentPersona('sales_closer')!;
  return getAgentPersona(cfg.portalDefaultPersonaId) ?? getAgentPersona('support_specialist')!;
}

export const PORTAL_STAFF_PERSONAS: AgentPersonaId[] = [
  'support_specialist',
  'funding_strategist',
  'appointment_setter',
  'sales_closer',
  'lead_converter',
  'social_creator',
  'affiliate_specialist',
  'debt_strategist',
];

export function getPortalStaffPersona(id: AgentPersonaId): AgentPersona {
  return getAgentPersona(id) ?? getAgentPersona('support_specialist')!;
}
