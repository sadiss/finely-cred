/**
 * Esther Hayes — Weekly Strategy Review sub-agent (Phase 5b real-reasoning
 * upgrade). Esther's only capability before this was a static "this week's
 * focus" read — no agent ever looked at whether the focus was actually
 * producing results. This sub-agent reads the live CRM funnel (real stage
 * counts + a real week-over-week lead-volume comparison, not a fabricated
 * metric) alongside the current week focus, then asks the shared agent-brain
 * step whether the lane/city should shift or whether Caleb/Hannah need a
 * nudge. `route_handoff` directives write straight into the real handoff
 * ledger (already handled inside `runAgentBrainStep`); `create_task`
 * directives create a real Marketing Desk follow-up task.
 */
import { getGrowthWeekFocus } from '../growthWeekFocus';
import { listCrmRecords } from '../../../data/crmRecordsRepo';
import { isClosedStage } from '../../../domain/crmRecords';
import { runAgentBrainStep } from '../growthAgentBrain';
import { createMarketingTask, findOpenMarketingTask } from '../../marketingDesk/marketingDeskTasks';
import { ranThisWeek, markRan } from './subagentCadence';
import { getTierStrategy, type BusinessCreditTierStrategy } from '../../../data/businessCreditDoctrineRepo';

const AGENT_ID = 'marketing-director.strategy_review';
const CADENCE_KEY = 'finely.esther.strategy_review_cadence.v1';
const REVIEW_RECORD_ID = 'esther-strategy-review';

export type EstherStrategyReviewResult = {
  ok: boolean;
  action?: string;
  message: string;
};

function leadVolumeTrend(days = 7): { thisWindow: number; prevWindow: number } {
  const now = Date.now();
  const cutoffThis = now - days * 86_400_000;
  const cutoffPrev = cutoffThis - days * 86_400_000;
  const records = listCrmRecords();
  const thisWindow = records.filter((r) => {
    const t = Date.parse(r.createdAt);
    return Number.isFinite(t) && t >= cutoffThis;
  }).length;
  const prevWindow = records.filter((r) => {
    const t = Date.parse(r.createdAt);
    return Number.isFinite(t) && t >= cutoffPrev && t < cutoffThis;
  }).length;
  return { thisWindow, prevWindow };
}

function stageCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of listCrmRecords()) {
    counts[r.stage] = (counts[r.stage] ?? 0) + 1;
  }
  return counts;
}

type BusinessCreditTierAngle = {
  tier: BusinessCreditTierStrategy['tier'];
  tierName: string;
  sampleVendor?: string;
  timeToNextTierWeeks: number;
};

/**
 * Phase K4 — wire `businessCreditDoctrineRepo.ts`'s real tier-progression data into Esther's
 * weekly-focus reasoning. Pure heuristic on the current pipeline's stage mix (not a guess):
 * a pipeline still mostly early-stage (new/researching) argues for the foundation-tier
 * case-study angle; a pipeline with real reply/booking traction argues for a later-tier angle
 * that shows the next rung on the ladder. Only called when this week's focus lane is
 * `business_credit` — otherwise the doctrine repo has nothing relevant to contribute.
 */
function pickBusinessCreditTierAngle(counts: Record<string, number>): BusinessCreditTierAngle | null {
  const early = (counts.new ?? 0) + (counts.researching ?? 0);
  const mid = (counts.contact_ready ?? 0) + (counts.outreach_sent ?? 0) + (counts.contacted ?? 0);
  const late = (counts.replied ?? 0) + (counts.booked ?? 0);

  let tier: BusinessCreditTierStrategy['tier'] = 1;
  if (late > 0 && late >= early && late >= mid) tier = 3;
  else if (mid > 0 && mid >= early) tier = 2;

  const strategy = getTierStrategy(tier);
  if (!strategy) return null;
  return {
    tier: strategy.tier,
    tierName: strategy.tierName,
    sampleVendor: strategy.vendorList[0]?.name,
    timeToNextTierWeeks: strategy.timeToNextTierWeeks,
  };
}

/** Run once per local week — call from the shared `agent_team_tick` autopilot. */
export async function runEstherStrategyReview(): Promise<EstherStrategyReviewResult> {
  try {
    if (ranThisWeek(CADENCE_KEY, 'weekly')) {
      return { ok: true, message: 'Strategy review already ran this week.' };
    }

    const focus = getGrowthWeekFocus();
    const counts = stageCounts();
    const records = listCrmRecords();
    const openCount = records.filter((r) => !isClosedStage(r.stage)).length;
    const { thisWindow, prevWindow } = leadVolumeTrend(7);
    const trendPct = prevWindow > 0 ? Math.round(((thisWindow - prevWindow) / prevWindow) * 100) : null;
    const tierAngle = focus.lane === 'business_credit' ? pickBusinessCreditTierAngle(counts) : null;

    const situationSummary = [
      `This week's focus: ${focus.laneLabel} in ${focus.city}, CTA ${focus.ctaPath}.`,
      `CRM stage counts: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(', ') || 'no records yet'}.`,
      `Open pipeline: ${openCount} record(s) of ${records.length} total.`,
      trendPct === null
        ? `Lead volume last 7 days: ${thisWindow} (no prior-week baseline yet).`
        : `Lead volume last 7 days: ${thisWindow} vs prior 7 days: ${prevWindow} (${trendPct >= 0 ? '+' : ''}${trendPct}%).`,
      tierAngle
        ? `Business-credit doctrine (businessCreditDoctrineRepo): pipeline mix argues for the ${tierAngle.tierName} case-study angle this week (sample vendor: ${tierAngle.sampleVendor ?? 'n/a'}, ~${tierAngle.timeToNextTierWeeks}w to next tier).`
        : null,
    ]
      .filter(Boolean)
      .join(' ');

    const directive = await runAgentBrainStep({
      agentId: AGENT_ID,
      taskType: 'esther_strategy_review',
      situationSummary,
      allowedActions: ['create_task', 'route_handoff', 'no_action'],
      autoExecutableActions: ['create_task', 'route_handoff'],
      entityType: 'growth_week_focus',
      entityId: focus.lane,
      // Phase H2 pilot — structured agent-call trace (scaffold + pilot only).
      traceContext: { agentId: AGENT_ID, linkedEntityType: 'growth_week_focus', linkedEntityId: focus.lane },
    });

    markRan(CADENCE_KEY, 'weekly');

    if (directive.action === 'create_task' && directive.autoExecuted) {
      const existing = findOpenMarketingTask({ kind: 'nurture', recordId: REVIEW_RECORD_ID });
      if (!existing) {
        createMarketingTask({
          kind: 'nurture',
          title: `Strategy check — ${focus.laneLabel} in ${focus.city}`,
          notes: directive.reasoning,
          recordId: REVIEW_RECORD_ID,
          href: '/admin/growth-agents/marketing-director',
          tags: ['esther-strategy-review', 'persona:marketing_director'],
          priority: 'normal',
          dueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          meta: { lane: focus.lane, city: focus.city, trendPct },
        });
      }
      return { ok: true, action: 'create_task', message: directive.reasoning };
    }

    if (directive.action === 'route_handoff') {
      return { ok: true, action: 'route_handoff', message: directive.reasoning };
    }

    return {
      ok: true,
      action: 'no_action',
      message: directive.reasoning || 'No strategy shift indicated this week.',
    };
  } catch (e) {
    return { ok: false, message: (e as Error)?.message || 'Esther strategy review failed.' };
  }
}
