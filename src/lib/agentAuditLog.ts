/**
 * Attributed agent-action audit trail — closes the "actorType: 'agent' is defined
 * but never used" gap. Every growth-agent action (hunt run, outreach sent, link
 * generated, cadence step fired, sub-agent decision) should call this so the
 * per-lead verifiable trail (Growth Command Hub) can answer "why did this agent
 * do this" after the fact.
 */
import { addAuditEvent } from '../data/auditRepo';
import { getGrowthAgent } from '../features/growthAgents/growthAgentRegistry';

export type AgentAuditArgs = {
  /** Growth agent registry id, e.g. 'lead-discovery', or a sub-agent id like 'lead-discovery.qualifier'. */
  agentId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  /** Why the agent made this decision — the human-readable reasoning trace. */
  reasoning?: string;
  meta?: Record<string, unknown>;
};

/** Resolve a human-readable agent name for a base or sub-agent id ("lead-discovery.qualifier" -> "Caleb Brooks - Qualifier"). */
export function resolveAgentDisplayName(agentId: string): string {
  const [baseId, subId] = agentId.split('.');
  const base = getGrowthAgent(baseId);
  if (!base) return agentId;
  if (!subId) return base.name;
  const sub = base.subagents?.find((s) => s.id === subId);
  return sub ? `${base.name} - ${sub.label}` : `${base.name} - ${subId}`;
}

export function logAgentAction(args: AgentAuditArgs) {
  try {
    return addAuditEvent({
      actorType: 'agent',
      actorUserId: args.agentId,
      actorEmail: resolveAgentDisplayName(args.agentId),
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      meta: { reasoning: args.reasoning, ...args.meta },
    });
  } catch {
    return null;
  }
}
