import type { CreditScoreSnapshot } from '../domain/creditScoreSnapshots';
import type { ParsedCreditReport } from '../domain/creditReports';
import { listProjectsByPartner, upsertProject } from '../data/projectsRepo';
import { listTasksByPartner } from '../data/tasksRepo';
import { defaultOutcomesForProject, syncProjectKpis } from './projectKpiEngine';
import { emitPlatformEvent } from '../domain/platformEvents';

function avgUtilizationPct(parsed?: ParsedCreditReport | null): number | undefined {
  if (!parsed?.tradelines?.length) return undefined;
  const vals: number[] = [];
  for (const t of parsed.tradelines) {
    const u = t.utilizationPct;
    if (u && typeof u === 'object') {
      for (const v of Object.values(u)) {
        if (typeof v === 'number' && Number.isFinite(v)) vals.push(v);
      }
    }
  }
  if (!vals.length) return undefined;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Push latest FICO / utilization into active project outcome KPIs (Phase 18). */
export function syncCreditIntelToProjectOutcomes(args: {
  partnerId: string;
  snapshot?: CreditScoreSnapshot | null;
  parsed?: ParsedCreditReport | null;
}): { projectsUpdated: number } {
  const headlineScore = args.snapshot?.headlineScore;
  const utilization = avgUtilizationPct(args.parsed);

  const active = listProjectsByPartner(args.partnerId).filter(
    (p) => p.status === 'active' && (p.scope ?? 'personal') !== 'business',
  );
  if (!active.length) return { projectsUpdated: 0 };

  let projectsUpdated = 0;
  for (const project of active) {
    const outcomes = project.outcomes?.length ? project.outcomes : defaultOutcomesForProject(project);
    let changed = false;

    const nextOutcomes = outcomes.map((o) => {
      if (o.metricType === 'fico' && headlineScore != null) {
        changed = true;
        const target = o.targetValue ?? 700;
        let status = o.status;
        if (headlineScore >= target) status = 'achieved';
        else if (status === 'not_started') status = 'in_progress';
        return { ...o, currentValue: headlineScore, status };
      }
      if (o.metricType === 'utilization' && utilization != null) {
        changed = true;
        const target = o.targetValue ?? 30;
        let status = o.status;
        if (utilization <= target) status = 'achieved';
        else if (status === 'not_started') status = 'in_progress';
        return { ...o, currentValue: utilization, status };
      }
      return o;
    });

    if (!changed) continue;

    const updated = upsertProject({
      ...project,
      outcomes: nextOutcomes,
      updatedAt: new Date().toISOString(),
    });
    syncProjectKpis(updated, listTasksByPartner(args.partnerId).filter((t) => t.projectId === project.id));
    projectsUpdated += 1;
  }

  if (projectsUpdated > 0) {
    emitPlatformEvent({
      type: 'automation.triggered',
      tenantId: 'finely_cred',
      partnerId: args.partnerId,
      payload: {
        kind: 'credit_intel_outcomes_synced',
        headlineScore: headlineScore ?? null,
        utilization: utilization ?? null,
        projectsUpdated,
      },
    });
  }

  return { projectsUpdated };
}
