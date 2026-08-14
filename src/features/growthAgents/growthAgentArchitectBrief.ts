/**
 * Agent Architect (Professor Apex) — Ruth's chief-of-staff brief (Phase 3).
 *
 * Watches the handoff ledger + audit trail across every growth agent and
 * produces the one decision Ruth should look at today, instead of Ruth having
 * to parse raw handoff/audit rows herself. This is what makes the Agent
 * Architect a real position, not a title — its entire job is turning team
 * activity into a proactive brief.
 */
import { listGrowthHandoffs, listStalledGrowthHandoffs, sweepStalledHandoffs } from '../../data/growthHandoffLedgerRepo';
import { listPendingGrowthApprovals } from '../../data/growthAgentApprovalQueueRepo';
import { getAllAgentConfidences } from './growthAgentLearningLoop';
import { GROWTH_AGENTS } from './growthAgentRegistry';
import { resolveAgentDisplayName } from '../../lib/agentAuditLog';

export type AgentArchitectBrief = {
  headline: string;
  stalledCount: number;
  pendingApprovalCount: number;
  topRisk?: string;
  mostConfidentAgent?: string;
  leastActiveAgent?: string;
  briefLines: string[];
  generatedAt: string;
};

/** Build the brief Ruth sees — call on Growth Command Hub load or from Ruth's chat context. */
export function buildAgentArchitectBrief(): AgentArchitectBrief {
  sweepStalledHandoffs();
  const stalled = listStalledGrowthHandoffs();
  const pendingApprovals = listPendingGrowthApprovals();
  const recent = listGrowthHandoffs(50);

  const agentIds = GROWTH_AGENTS.map((a) => a.id);
  const confidences = getAllAgentConfidences(agentIds);
  const withSamples = confidences.filter((c) => c.sampleSize > 0);
  const mostConfident = [...withSamples].sort((a, b) => b.decisiveRate - a.decisiveRate)[0];
  const leastActive = [...confidences].sort((a, b) => a.sampleSize - b.sampleSize)[0];

  const lines: string[] = [];
  if (stalled.length > 0) {
    lines.push(`${stalled.length} handoff(s) stalled >48h without acknowledgement — needs a human nudge.`);
  }
  if (pendingApprovals.length > 0) {
    lines.push(`${pendingApprovals.length} agent directive(s) waiting in the approval queue.`);
  }
  if (recent.length > 0) {
    lines.push(`${recent.length} handoffs logged recently — team is actively coordinating (verifiable in the trail view).`);
  } else {
    lines.push('No handoffs logged yet — team-context feed is still warming up.');
  }
  if (mostConfident) {
    lines.push(`${resolveAgentDisplayName(mostConfident.agentId)} is the most decisive agent this week (${Math.round(mostConfident.decisiveRate * 100)}% of reasoning steps produced a real action).`);
  }

  const headline =
    stalled.length > 0
      ? `${stalled.length} stalled handoff(s) need attention`
      : pendingApprovals.length > 0
        ? `${pendingApprovals.length} agent decision(s) waiting on your OK`
        : 'Team is coordinated — nothing urgent right now';

  return {
    headline,
    stalledCount: stalled.length,
    pendingApprovalCount: pendingApprovals.length,
    topRisk: stalled[0] ? `${resolveAgentDisplayName(stalled[0].fromAgentId)} -> ${resolveAgentDisplayName(stalled[0].toAgentId)}: ${stalled[0].action}` : undefined,
    mostConfidentAgent: mostConfident ? resolveAgentDisplayName(mostConfident.agentId) : undefined,
    leastActiveAgent: leastActive?.sampleSize === 0 ? resolveAgentDisplayName(leastActive.agentId) : undefined,
    briefLines: lines,
    generatedAt: new Date().toISOString(),
  };
}
