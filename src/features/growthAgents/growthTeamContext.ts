/**
 * Shared live team-context feed — Phase 3 "work together drastically better".
 *
 * Every growth agent's brain step (growthAgentBrain.ts) reads this BEFORE deciding
 * its next action, so Caleb's next move is shaped by what Alex/Hannah already did
 * this week, not run in isolation. This is what makes the team coordinated and
 * anticipatable to each other, instead of each agent guessing blind — and because
 * it's built from the handoff ledger + audit trail, it's the same data a human can
 * pull up afterward to verify what happened and why.
 */
import { getGrowthWeekFocus, type GrowthWeekFocus } from './growthWeekFocus';
import { listGrowthHandoffs, type GrowthHandoff } from '../../data/growthHandoffLedgerRepo';
import { listAuditEvents } from '../../data/auditRepo';
import type { AuditEvent } from '../../domain/audit';
import { resolveAgentDisplayName } from '../../lib/agentAuditLog';

export type GrowthTeamContext = {
  focus: GrowthWeekFocus;
  recentHandoffs: GrowthHandoff[];
  recentAgentActions: AuditEvent[];
  /** Compact plain-English brief — safe to drop straight into an AI-gateway prompt. */
  briefText: string;
};

/** Build the live team-context snapshot every agent brain step should read first. */
export function getGrowthTeamContext(opts?: { limit?: number }): GrowthTeamContext {
  const limit = opts?.limit ?? 12;
  const focus = getGrowthWeekFocus();
  const recentHandoffs = listGrowthHandoffs(limit);
  const recentAgentActions = listAuditEvents()
    .filter((e) => e.actorType === 'agent')
    .slice(0, limit);

  const handoffLines = recentHandoffs.slice(0, 6).map((h) => {
    const from = resolveAgentDisplayName(h.fromAgentId);
    const to = resolveAgentDisplayName(h.toAgentId);
    const ago = timeAgo(h.createdAt);
    return `- ${from} -> ${to}: ${h.action} (${h.status}, ${ago})${h.reasoning ? ` — ${h.reasoning}` : ''}`;
  });

  const actionLines = recentAgentActions.slice(0, 6).map((e) => {
    const agent = e.actorEmail || e.actorUserId || 'agent';
    const ago = timeAgo(e.createdAt);
    return `- ${agent}: ${e.action} (${ago})`;
  });

  const briefText = [
    `This week's focus: ${focus.laneLabel} in ${focus.city}, CTA ${focus.ctaPath}.`,
    handoffLines.length ? `Recent team handoffs:\n${handoffLines.join('\n')}` : 'No recent handoffs yet.',
    actionLines.length ? `Recent agent actions:\n${actionLines.join('\n')}` : 'No recent agent actions logged yet.',
  ].join('\n\n');

  return { focus, recentHandoffs, recentAgentActions, briefText };
}

function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
