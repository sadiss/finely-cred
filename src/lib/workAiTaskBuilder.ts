import type { TaskItem } from '../domain/tasks';
import type { TaskResultType } from '../domain/workResults';
import { draftTaskFromPrompt } from './aiTaskCreate';
import { getTaskPlaybook, listTaskPlaybooks } from '../data/taskPlaybooksRepo';
import { newId } from '../utils/ids';

export type WorkTaskDraft = TaskItem & {
  successCriteria?: string;
  resultType?: TaskResultType;
  targetMetric?: string;
};

function inferResultType(prompt: string): TaskResultType | undefined {
  const p = prompt.toLowerCase();
  if (p.includes('fico') || p.includes('score')) return 'score_change';
  if (p.includes('delet') || p.includes('remove tradeline')) return 'deletion';
  if (p.includes('upload') || p.includes('document')) return 'document_upload';
  if (p.includes('fund') || p.includes('loan')) return 'funding_approval';
  return undefined;
}

function inferSuccessCriteria(prompt: string, kind?: string): string {
  const p = prompt.trim();
  if (p.length > 20) return `Complete: ${p.slice(0, 120)}`;
  if (kind === 'mail_letter') return 'Letter mailed with tracking confirmation on file';
  if (kind === 'upload_document') return 'Required document uploaded to evidence vault';
  if (kind === 'review_results') return 'Results reviewed and next steps documented';
  return 'Task completed with documented outcome';
}

/** AI-powered task generation with success criteria and playbook enrichment (Phase 13). */
export async function buildTaskFromPrompt(args: {
  prompt: string;
  partnerId: string;
  projectId?: string;
  playbookId?: string;
  context?: Record<string, unknown>;
}): Promise<WorkTaskDraft> {
  const base = await draftTaskFromPrompt({
    prompt: args.prompt,
    partnerId: args.partnerId,
    projectId: args.projectId,
    context: args.context,
  });

  const playbook = args.playbookId ? getTaskPlaybook(args.playbookId) : undefined;
  const resultType = inferResultType(args.prompt);
  const successCriteria = playbook?.partnerInstructions
    ? `${inferSuccessCriteria(args.prompt, base.kind)} — ${playbook.partnerInstructions.slice(0, 200)}`
    : inferSuccessCriteria(args.prompt, base.kind);

  const checklist =
    playbook?.checklist?.map((text) => ({ id: newId('chk'), text, done: false })) ?? base.checklist;

  return {
    ...base,
    successCriteria,
    resultType,
    targetMetric: resultType === 'score_change' ? '+40 FICO points' : undefined,
    partnerInstructions: playbook?.partnerInstructions,
    adminInstructions: playbook?.adminInstructions,
    checklist,
    tags: [...new Set([...(base.tags ?? []), ...(playbook?.tags ?? []), 'ai-generated'])],
    aiGenerated: true,
    aiSuggestedNextSteps: playbook
      ? [`Apply playbook: ${playbook.title}`]
      : ['Review success criteria before marking complete'],
  };
}

export function listPlaybookOptionsForStage(stage?: string) {
  return listTaskPlaybooks()
    .filter((p) => !stage || p.stage === stage)
    .slice(0, 24)
    .map((p) => ({ id: p.id, label: p.title, stage: p.stage }));
}
