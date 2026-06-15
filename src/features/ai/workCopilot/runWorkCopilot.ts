import type { Project } from '../../../domain/projects';
import type { TaskItem } from '../../../domain/tasks';
import type { TaskPlaybook } from '../../../domain/taskPlaybooks';
import { listTaskPlaybooks } from '../../../data/taskPlaybooksRepo';
import type { WorkCopilotResult, WorkRescheduleSuggestion, WorkRiskScore, WorkCompletionPrediction } from '../schemas/workCopilot';
import { callAiGateway } from '../../../lib/aiClient';
import { isFeatureEnabled } from '../../../data/settingsRepo';

function existingPlaybookIds(tasks: TaskItem[]): Set<string> {
  const ids = new Set<string>();
  for (const t of tasks) {
    for (const tag of t.tags ?? []) {
      if (tag.startsWith('playbook:')) ids.add(tag.replace('playbook:', ''));
    }
  }
  return ids;
}

function scorePlaybook(pb: TaskPlaybook, project: Project, tasks: TaskItem[]): number {
  let score = 0;
  const stage = project.stage ?? 'intake';
  if (pb.stage === stage) score += 3;
  if (pb.categories.some((c) => (project.tags ?? []).includes(c))) score += 2;
  for (const tag of project.tags ?? []) {
    if (pb.packageIds?.includes(tag) || pb.tags?.includes(tag)) score += 4;
  }
  const openStages = new Set(tasks.filter((t) => t.status !== 'completed').map((t) => t.stage));
  if (!openStages.has(pb.stage) && pb.stage !== 'complete') score += 1;
  if (pb.priority === 'high' || pb.priority === 'urgent') score += 1;
  return score;
}

function addDaysIso(days: number, fromMs = Date.now()) {
  return new Date(fromMs + days * 86400000).toISOString();
}

function buildProInsights(project: Project, tasks: TaskItem[]): Pick<WorkCopilotResult, 'rescheduleSuggestions' | 'riskScore' | 'clientSummaryDraft' | 'completionPrediction'> {
  const open = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const overdue = open.filter((t) => t.dueAt && Date.parse(t.dueAt) < Date.now());
  const blocked = open.filter((t) =>
    (t.blockedByTaskIds ?? []).some((id) => tasks.find((x) => x.id === id)?.status !== 'completed'),
  );
  const rescheduleSuggestions: WorkRescheduleSuggestion[] = [];

  for (const t of overdue) {
    const title = t.title.toLowerCase();
    const shiftDays = title.includes('statement') || title.includes('pay before') || title.includes('utilization') ? 7 : 2;
    rescheduleSuggestions.push({
      taskId: t.id,
      taskTitle: t.title,
      currentDueAt: t.dueAt,
      suggestedDueAt: addDaysIso(shiftDays),
      reason: shiftDays > 2 ? 'Statement-cycle task — shift to next safe window' : 'Overdue — bump to near-term slot',
    });
  }

  for (const t of open.filter((x) => !x.dueAt && x.status === 'pending')) {
    const ageDays = (Date.now() - Date.parse(t.createdAt)) / 86400000;
    if (ageDays >= 3) {
      rescheduleSuggestions.push({
        taskId: t.id,
        taskTitle: t.title,
        suggestedDueAt: addDaysIso(2),
        reason: 'No due date — set response window',
      });
    }
  }

  let riskScore: WorkRiskScore = 'green';
  if (overdue.length >= 3 || blocked.length >= 2) riskScore = 'red';
  else if (overdue.length >= 1 || blocked.length >= 1) riskScore = 'amber';

  const done = tasks.filter((t) => t.status === 'completed').length;
  const stage = project.stage ?? 'intake';
  const clientSummaryDraft =
    `Progress update: We're in the ${stage} phase with ${done} step${done === 1 ? '' : 's'} completed and ${open.length} still open.` +
    (overdue.length ? ` ${overdue.length} item${overdue.length === 1 ? ' is' : 's are'} past due — we're prioritizing those next.` : '') +
    (blocked.length ? ` ${blocked.length} task${blocked.length === 1 ? ' is' : 's are'} waiting on prerequisites.` : ' Next up: continue the playbook chain toward funding-ready.');

  return { rescheduleSuggestions: rescheduleSuggestions.slice(0, 6), riskScore, clientSummaryDraft, completionPrediction: predictCompletion(project, tasks) };
}

const STAGE_ORDER = ['intake', 'reports', 'analysis', 'disputes', 'letters', 'mailing', 'funding', 'complete'] as const;

function predictCompletion(project: Project, tasks: TaskItem[]): WorkCompletionPrediction {
  const open = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const done = tasks.filter((t) => t.status === 'completed').length;
  const ageWeeks = Math.max(0.5, (Date.now() - Date.parse(project.createdAt)) / (7 * 86400000));
  const velocityPerWeek = Math.max(0.5, done / ageWeeks);
  const stageIdx = STAGE_ORDER.indexOf(project.stage as (typeof STAGE_ORDER)[number]);
  const remainingPhases = stageIdx >= 0 ? Math.max(0, STAGE_ORDER.length - stageIdx - 1) : 3;
  const taskWeeks = open.length / velocityPerWeek;
  const phaseBufferDays = remainingPhases * 4;
  const estimatedDays = Math.max(3, Math.round(taskWeeks * 7 + phaseBufferDays));
  const confidence: WorkCompletionPrediction['confidence'] =
    done >= 5 && open.length <= 8 ? 'high' : done >= 2 ? 'medium' : 'low';

  return {
    estimatedDays,
    estimatedCompleteAt: addDaysIso(estimatedDays),
    confidence,
    openTasks: open.length,
    velocityPerWeek: Math.round(velocityPerWeek * 10) / 10,
  };
}

function ruleBasedSuggestions(project: Project, tasks: TaskItem[]): WorkCopilotResult {
  const have = existingPlaybookIds(tasks);
  const open = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const overdue = open.filter((t) => t.dueAt && Date.parse(t.dueAt) < Date.now());
  const blocked = open.filter((t) => (t.blockedByTaskIds ?? []).some((id) => tasks.find((x) => x.id === id)?.status !== 'completed'));

  const candidates = listTaskPlaybooks()
    .filter((pb) => !have.has(pb.id))
    .map((pb) => ({ pb, score: scorePlaybook(pb, project, tasks) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const blockers: string[] = [];
  if (overdue.length) blockers.push(`${overdue.length} overdue task(s) need attention`);
  if (blocked.length) blockers.push(`${blocked.length} task(s) blocked by dependencies`);

  const timingHints: string[] = [];
  if (project.stage === 'reports') timingHints.push('Upload all three bureau reports before dispute work');
  if (project.stage === 'disputes') timingHints.push('Mail within 48h of letter generation for DFY SLA');
  if (project.stage === 'funding') timingHints.push('Run utilization check before funding applications');

  return {
    source: 'catalog',
    summary: `Project at ${project.stage} — ${open.length} open, ${overdue.length} overdue. Suggestions are catalog-only.`,
    playbookSuggestions: candidates.map(({ pb, score }) => ({
      playbookId: pb.id,
      title: pb.title,
      stage: pb.stage,
      kind: pb.kind,
      reason: score >= 4 ? 'Matches project lane + phase' : 'Fills gap in workflow',
      dueDaysOffset: pb.dueDaysOffset,
    })),
    blockers,
    timingHints,
    ...buildProInsights(project, tasks),
  };
}

export async function runWorkCopilot(args: {
  project: Project;
  tasks: TaskItem[];
  partnerLane?: string;
}): Promise<WorkCopilotResult> {
  const baseline = ruleBasedSuggestions(args.project, args.tasks);
  if (!isFeatureEnabled('aiGateway')) return baseline;

  const catalogSlice = listTaskPlaybooks().slice(0, 40).map((p) => ({
    id: p.id,
    title: p.title,
    stage: p.stage,
    kind: p.kind,
  }));

  try {
    const res = await callAiGateway({
      taskType: 'work_copilot_mvp',
      responseFormat: 'json',
      context: {
        projectId: args.project.id,
        stage: args.project.stage,
        tags: args.project.tags,
        openTaskCount: args.tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length,
      },
      messages: [
        {
          role: 'system',
          content:
            'You are Finely Work Copilot. Return JSON only: { summary, playbookIds: string[], blockers: string[], timingHints: string[] }. playbookIds MUST be chosen ONLY from the provided catalog IDs. Never invent tasks.',
        },
        {
          role: 'user',
          content: JSON.stringify({ catalog: catalogSlice, project: { stage: args.project.stage, tags: args.project.tags }, tasks: args.tasks.map((t) => ({ title: t.title, stage: t.stage, status: t.status })) }),
        },
      ],
    });
    const parsed = JSON.parse(res.text || '{}') as {
      summary?: string;
      playbookIds?: string[];
      blockers?: string[];
      timingHints?: string[];
    };
    const allowed = new Set(catalogSlice.map((c) => c.id));
    const picks = (parsed.playbookIds ?? []).filter((id) => allowed.has(id)).slice(0, 6);
    const byId = new Map(listTaskPlaybooks().map((p) => [p.id, p]));
    const playbookSuggestions = picks
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((pb) => ({
        playbookId: pb!.id,
        title: pb!.title,
        stage: pb!.stage,
        kind: pb!.kind,
        reason: 'AI selected from catalog',
        dueDaysOffset: pb!.dueDaysOffset,
      }));

    if (!playbookSuggestions.length) return baseline;

    return {
      source: 'ai',
      summary: parsed.summary || baseline.summary,
      playbookSuggestions: [...playbookSuggestions, ...baseline.playbookSuggestions.filter((s) => !picks.includes(s.playbookId))].slice(0, 8),
      blockers: parsed.blockers?.length ? parsed.blockers : baseline.blockers,
      timingHints: parsed.timingHints?.length ? parsed.timingHints : baseline.timingHints,
      rescheduleSuggestions: baseline.rescheduleSuggestions,
      riskScore: baseline.riskScore,
      clientSummaryDraft: baseline.clientSummaryDraft,
      completionPrediction: baseline.completionPrediction,
    };
  } catch {
    return baseline;
  }
}
