/**
 * Staff intelligence — lightweight ML loop (intent × staff affinity weights in Supabase).
 * Improves routing suggestions over time from partner click feedback.
 */

import type { AgentPersonaId } from '../domain/agentPersonas';
import type { StaffMember } from '../domain/staffMember';
import type { MessageIntent } from './intentClassifier';
import { saveTenantState } from '../data/tenantStateRepo';

const STATE_KEY = 'staff_intelligence_weights';

export type RoutingWeights = {
  /** intent → staffId → score boost */
  intentStaff: Record<string, Record<string, number>>;
  /** personaId → staffId affinity */
  personaStaff: Record<string, Record<string, number>>;
  totalEvents: number;
};

export function defaultRoutingWeights(): RoutingWeights {
  return { intentStaff: {}, personaStaff: {}, totalEvents: 0 };
}

let memoryWeights: RoutingWeights | null = null;

export function seedRoutingWeights(w: RoutingWeights): RoutingWeights {
  memoryWeights = w;
  return w;
}

function loadWeights(): RoutingWeights {
  return memoryWeights ?? defaultRoutingWeights();
}

function saveWeights(w: RoutingWeights) {
  memoryWeights = w;
  saveTenantState(STATE_KEY, w);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function loadRoutingWeights(): RoutingWeights {
  return loadWeights();
}

export function getStaffRoutingWeights(): RoutingWeights {
  return loadWeights();
}

export function recordCommsRoutingFeedback(args: {
  intent: MessageIntent;
  staffId?: string;
  personaId?: AgentPersonaId;
  kind: string;
}) {
  if (!args.staffId) return;
  const w = loadWeights();
  w.totalEvents += 1;
  const intentKey = args.intent;
  w.intentStaff[intentKey] = w.intentStaff[intentKey] ?? {};
  w.intentStaff[intentKey]![args.staffId] = (w.intentStaff[intentKey]![args.staffId] ?? 0) + 0.12;

  if (args.personaId) {
    w.personaStaff[args.personaId] = w.personaStaff[args.personaId] ?? {};
    w.personaStaff[args.personaId]![args.staffId] = (w.personaStaff[args.personaId]![args.staffId] ?? 0) + 0.08;
  }

  saveWeights(w);
}

export function rankStaffByIntent(args: {
  intent: MessageIntent;
  personaId: AgentPersonaId;
  staff: StaffMember[];
  weights?: RoutingWeights;
}): StaffMember[] {
  const w = args.weights ?? loadWeights();
  const scored = args.staff.map((s) => {
    let score = 0;
    if (s.primaryRoleId === args.personaId) score += 2;
    score += w.intentStaff[args.intent]?.[s.id] ?? 0;
    score += w.personaStaff[args.personaId]?.[s.id] ?? 0;
    if (s.active !== false) score += 0.5;
    return { staff: s, score };
  });
  return scored.sort((a, b) => b.score - a.score).map((x) => x.staff);
}

export function getStaffIntelligenceSummary() {
  const w = loadWeights();
  return {
    totalRoutingEvents: w.totalEvents,
    learnedIntentPairs: Object.values(w.intentStaff).reduce((n, m) => n + Object.keys(m).length, 0),
    learnedPersonaPairs: Object.values(w.personaStaff).reduce((n, m) => n + Object.keys(m).length, 0),
  };
}
