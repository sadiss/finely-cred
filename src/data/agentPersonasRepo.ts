import type { AgentPersona, AgentPersonaId } from '../domain/agentPersonas';
import { AGENT_PERSONAS, getAgentPersona } from '../domain/agentPersonas';
import { getEffectiveAgentPersona } from './agentPersonaOverridesRepo';
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

/** Growth-first public schedule — lead_converter covers weekday + evening so Cameron/growth faces map correctly. */
const DEFAULT_SHIFTS: PersonaShiftBlock[] = [
  { personaId: 'lead_converter', days: [1, 2, 3, 4, 5], startHour: 8, endHour: 21 },
  { personaId: 'sales_closer', days: [1, 2, 3, 4, 5], startHour: 17, endHour: 21 },
  { personaId: 'nurture_concierge', days: [0, 6], startHour: 9, endHour: 20 },
  { personaId: 'support_specialist', days: [1, 2, 3, 4, 5], startHour: 8, endHour: 17 },
  { personaId: 'finely_advisor', days: [1, 2, 3, 4, 5], startHour: 8, endHour: 17 },
  { personaId: 'debt_strategist', days: [2, 4], startHour: 10, endHour: 16 },
];

const AGENT_STAFF_CONFIG_VERSION = 2;

function defaultConfig(): AgentStaffConfig {
  return {
    shifts: DEFAULT_SHIFTS,
    publicDefaultPersonaId: 'lead_converter',
    portalDefaultPersonaId: 'support_specialist',
    updatedAt: new Date().toISOString(),
  };
}

export function loadAgentStaffConfig(): AgentStaffConfig {
  return loadJson(KEY, defaultConfig(), AGENT_STAFF_CONFIG_VERSION);
}

export function saveAgentStaffConfig(cfg: AgentStaffConfig) {
  saveJson(KEY, { ...cfg, updatedAt: new Date().toISOString() }, AGENT_STAFF_CONFIG_VERSION);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function listAllPersonas(): AgentPersona[] {
  return AGENT_PERSONAS.map((p) => getEffectiveAgentPersona(p.id));
}

export function personaOnDutyAt(date = new Date()): AgentPersona {
  const cfg = loadAgentStaffConfig();
  const day = date.getDay();
  const hour = date.getHours();
  for (const block of cfg.shifts) {
    if (!block.days.includes(day)) continue;
    if (hour >= block.startHour && hour < block.endHour) {
      return getEffectiveAgentPersona(block.personaId);
    }
  }
  return getEffectiveAgentPersona(cfg.publicDefaultPersonaId);
}

export function portalPersonaForLane(lane?: string): AgentPersona {
  const cfg = loadAgentStaffConfig();
  const l = (lane || '').toLowerCase();
  if (l.includes('debt') || l.includes('summons') || l.includes('validation') || l.includes('foreclosure') || l.includes('repossession') || l.includes('bankruptcy') || l.includes('discharge')) {
    return getAgentPersona('debt_strategist')!;
  }
  if (l.includes('dispute') || l.includes('bureau') || l.includes('restore') || l.includes('tradeline') || l.includes('letter')) {
    return getAgentPersona('dispute_coach')!;
  }
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
