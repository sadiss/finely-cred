/**
 * Lydia Chen — SEO & Local Pages health-check sub-agent (Phase 5b real-reasoning
 * upgrade). Lydia's "Check my pages" capability previously pointed at a manual
 * admin panel with no agent behind it. There is no live crawler or rank-tracking
 * data source in this codebase, so this sub-agent deliberately does NOT fake a
 * crawl — it runs the same real, checkable audit the admin SEO health panel
 * already uses (`growthSeoAuditor.ts` against the static `publicSeoCatalog.ts`
 * route registry: title/description length + missing JSON-LD schema flags) and
 * asks the agent brain whether the worst offenders are bad enough to flag for a
 * human fix this cycle.
 */
import { auditPublicSeoCatalog, getTopSeoIssues, summarizeSeoAudit } from '../growthSeoAuditor';
import { runAgentBrainStep } from '../growthAgentBrain';
import { createMarketingTask, findOpenMarketingTask } from '../../marketingDesk/marketingDeskTasks';
import { ranToday, markRan } from './subagentCadence';

const AGENT_ID = 'seo-local.health_check';
const CADENCE_KEY = 'finely.lydia.seo_health_cadence.v1';
const REVIEW_RECORD_ID = 'lydia-seo-health';

export type LydiaSeoHealthResult = {
  ok: boolean;
  action?: string;
  message: string;
};

/** Run once per local day — call from the shared `agent_team_tick` autopilot. */
export async function runLydiaSeoHealthCheck(): Promise<LydiaSeoHealthResult> {
  try {
    if (ranToday(CADENCE_KEY, 'daily')) {
      return { ok: true, message: 'SEO health check already ran today.' };
    }

    const results = auditPublicSeoCatalog();
    const summary = summarizeSeoAudit(results);
    markRan(CADENCE_KEY, 'daily');

    if (summary.issueCount === 0) {
      return {
        ok: true,
        action: 'no_action',
        message: `All ${summary.routeCount} public routes pass title/description/schema checks.`,
      };
    }

    const top = getTopSeoIssues(results, 5);
    const situationSummary = [
      `Public SEO catalog audit: ${summary.routesWithIssues}/${summary.routeCount} route(s) have at least one issue (${summary.issueCount} issue(s) total).`,
      'Top issues:',
      ...top.map((t) => `- ${t.path}: ${t.issue.message}`),
    ].join('\n');

    const directive = await runAgentBrainStep({
      agentId: AGENT_ID,
      taskType: 'lydia_seo_health_check',
      situationSummary,
      allowedActions: ['create_task', 'no_action'],
      autoExecutableActions: ['create_task'],
      entityType: 'seo_catalog',
      entityId: 'public_routes',
    });

    if (directive.action === 'create_task' && directive.autoExecuted) {
      const existing = findOpenMarketingTask({ kind: 'nurture', recordId: REVIEW_RECORD_ID });
      if (!existing) {
        createMarketingTask({
          kind: 'nurture',
          title: `SEO fix — ${summary.routesWithIssues} route(s) need title/description work`,
          notes: [directive.reasoning, ...top.map((t) => `${t.path}: ${t.issue.message}`)].join('\n'),
          recordId: REVIEW_RECORD_ID,
          href: '/admin/access',
          tags: ['lydia-seo-health', 'persona:seo_local'],
          growthAgentId: 'seo-local',
          priority: summary.routesWithIssues >= 5 ? 'high' : 'normal',
          dueAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
          meta: { routesWithIssues: summary.routesWithIssues, issueCount: summary.issueCount },
        });
      }
      return { ok: true, action: 'create_task', message: directive.reasoning };
    }

    return {
      ok: true,
      action: directive.action,
      message:
        directive.reasoning ||
        `${summary.issueCount} SEO issue(s) found across ${summary.routesWithIssues} route(s) — below action threshold.`,
    };
  } catch (e) {
    return { ok: false, message: (e as Error)?.message || 'Lydia SEO health check failed.' };
  }
}
