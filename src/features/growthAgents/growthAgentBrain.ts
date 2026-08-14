/**
 * Shared AI-gateway reasoning step for growth agents (Phase 3 "agent brain").
 *
 * Gives Esther, Hannah, and Alex the same real reasoning step Caleb's mid-band
 * review already had (`optionalAiFitVerdict` in marketingDeskHunt.ts is the
 * pattern this generalizes). Every call is grounded in the shared team-context
 * feed so agents react to what the team already did instead of reasoning in
 * isolation, auto-executes only within safe bounds, otherwise queues to the one
 * unified approval inbox, and always logs its outcome for the learning-loop
 * confidence indicator — never throws, always degrades to a safe no-op.
 */
import { callAiGateway } from '../../lib/aiClient';
import type { AgentCallTraceContext } from '../../lib/agentCallTrace';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { getGrowthTeamContext } from './growthTeamContext';
import { logAgentAction, resolveAgentDisplayName } from '../../lib/agentAuditLog';
import { enqueueGrowthApproval } from '../../data/growthAgentApprovalQueueRepo';
import { createGrowthHandoff } from '../../data/growthHandoffLedgerRepo';
import { recordAgentOutcome } from './growthAgentLearningLoop';
import { buildPsychologyAwareSystemPromptFragment } from './agentCognitiveEngine';

export type AgentDirectiveAction = 'send_email' | 'send_sms' | 'create_task' | 'route_handoff' | 'stage_move' | 'no_action';

export type AgentDirective = {
  action: AgentDirectiveAction;
  targetEntityId?: string;
  targetAgentId?: string;
  reasoning: string;
  confidence: number;
  autoExecuted: boolean;
};

export type AgentBrainStepArgs = {
  agentId: string;
  taskType: string;
  situationSummary: string;
  allowedActions: AgentDirectiveAction[];
  /** Actions here execute immediately when confidence is high enough; others always queue for human approval. */
  autoExecutableActions?: AgentDirectiveAction[];
  entityId?: string;
  entityType?: string;
  minAutoConfidence?: number;
  /**
   * Additive, optional (Phase H2 pilot — structured agent-call trace).
   * Forwarded as-is to `callAiGateway()`'s own optional `traceContext`.
   * Omitting it is a no-op — behavior is unchanged for every existing caller.
   */
  traceContext?: AgentCallTraceContext;
};

function safeParseDirective(text: string): { action: AgentDirectiveAction; reasoning: string; confidence: number; targetAgentId?: string } | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text);
    if (!parsed || typeof parsed.action !== 'string') return null;
    return {
      action: parsed.action,
      reasoning: String(parsed.reasoning || '').slice(0, 400),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
      targetAgentId: parsed.targetAgentId ? String(parsed.targetAgentId) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Run one reasoning step for a growth agent. Returns a directive that has
 * already been auto-executed-or-queued and logged — callers apply the concrete
 * side effect for their domain (this function does not send emails itself; it
 * decides + attributes + routes, the caller's own send/action code runs it).
 */
export async function runAgentBrainStep(args: AgentBrainStepArgs): Promise<AgentDirective> {
  const minConfidence = args.minAutoConfidence ?? 0.72;
  const fallback: AgentDirective = {
    action: 'no_action',
    reasoning: 'AI Gateway unavailable — no directive generated this cycle.',
    confidence: 0,
    autoExecuted: false,
  };

  if (!isFeatureEnabled('aiGateway') || !isSupabaseConfigured) {
    recordAgentOutcome(args.agentId, { directive: fallback.action, autoExecuted: false, hadDirective: false });
    return fallback;
  }

  const team = getGrowthTeamContext();
  let psychologyFragment = '';
  try {
    psychologyFragment = buildPsychologyAwareSystemPromptFragment(args.agentId) || '';
  } catch {
    psychologyFragment = '';
  }

  try {
    const res = await callAiGateway({
      taskType: args.taskType,
      responseFormat: 'text',
      messages: [
        {
          role: 'system',
          content: [
            `You are ${resolveAgentDisplayName(args.agentId)}, a growth agent at a credit-repair education company.`,
            `Allowed actions: ${args.allowedActions.join(', ')}.`,
            'Reply with ONLY a JSON object: {"action": "<one of the allowed actions>", "reasoning": "<one plain-English sentence>", "confidence": <0-1 number>, "targetAgentId": "<optional, only for route_handoff>"}.',
            'Be conservative — pick no_action if nothing productive and low-risk is clearly indicated.',
            ...(psychologyFragment ? [psychologyFragment] : []),
          ].join(' '),
        },
        {
          role: 'user',
          content: `Team context:\n${team.briefText}\n\nSituation:\n${args.situationSummary}`,
        },
      ],
      traceContext: args.traceContext,
    });

    const parsed = safeParseDirective(res.text || '');
    if (!parsed || !args.allowedActions.includes(parsed.action)) {
      recordAgentOutcome(args.agentId, { directive: 'no_action', autoExecuted: false, hadDirective: false });
      return fallback;
    }

    const canAuto = (args.autoExecutableActions ?? []).includes(parsed.action) && parsed.confidence >= minConfidence;
    const directive: AgentDirective = {
      action: parsed.action,
      targetEntityId: args.entityId,
      targetAgentId: parsed.targetAgentId,
      reasoning: parsed.reasoning,
      confidence: parsed.confidence,
      autoExecuted: canAuto,
    };

    logAgentAction({
      agentId: args.agentId,
      action: `brain.directive.${parsed.action}`,
      entityType: args.entityType,
      entityId: args.entityId,
      reasoning: parsed.reasoning,
      meta: { confidence: parsed.confidence, autoExecuted: canAuto },
    });

    if (parsed.action === 'route_handoff' && parsed.targetAgentId) {
      createGrowthHandoff({
        fromAgentId: args.agentId,
        toAgentId: parsed.targetAgentId,
        entityType: args.entityType,
        entityId: args.entityId,
        action: 'brain_routed',
        reasoning: parsed.reasoning,
      });
    }

    if (!canAuto && parsed.action !== 'no_action') {
      enqueueGrowthApproval({
        agentId: args.agentId,
        action: parsed.action,
        entityType: args.entityType,
        entityId: args.entityId,
        reasoning: parsed.reasoning,
        confidence: parsed.confidence,
      });
    }

    recordAgentOutcome(args.agentId, { directive: parsed.action, autoExecuted: canAuto, hadDirective: true });
    return directive;
  } catch {
    recordAgentOutcome(args.agentId, { directive: fallback.action, autoExecuted: false, hadDirective: false });
    return fallback;
  }
}
