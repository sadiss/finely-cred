import type { TaskItem, TaskKind, TaskPriority, TaskStage } from '../domain/tasks';
import { callAiGateway } from './aiClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { extractFirstJsonObject } from '../utils/jsonExtract';
import { newId } from '../utils/ids';

function nowIso() {
  return new Date().toISOString();
}

export type AiTaskDraft = Pick<
  TaskItem,
  'title' | 'kind' | 'priority' | 'stage' | 'notes' | 'tags' | 'estimateMinutes' | 'dueAt'
>;

const FALLBACK_KINDS: TaskKind[] = ['general', 'follow_up', 'upload_document', 'review_results', 'mail_letter'];

export async function draftTaskFromPrompt(args: {
  prompt: string;
  partnerId: string;
  projectId?: string;
  context?: Record<string, unknown>;
}): Promise<TaskItem> {
  const draft = await generateTaskDraft(args.prompt, args.context);
  const t = nowIso();
  return {
    id: newId('task'),
    partnerId: args.partnerId,
    projectId: args.projectId,
    title: draft.title,
    kind: draft.kind ?? 'general',
    priority: draft.priority ?? 'normal',
    stage: draft.stage ?? 'intake',
    status: 'pending',
    createdAt: t,
    updatedAt: t,
    notes: draft.notes,
    tags: draft.tags,
    estimateMinutes: draft.estimateMinutes,
    dueAt: draft.dueAt,
  };
}

async function generateTaskDraft(prompt: string, context?: Record<string, unknown>): Promise<AiTaskDraft> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return { title: 'New task', kind: 'general', priority: 'normal', stage: 'intake' };
  }

  const canAi = isFeatureEnabled('aiGateway') && isSupabaseConfigured;
  if (canAi) {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.access_token) {
        const res = await callAiGateway({
          taskType: 'work_os_task_create',
          responseFormat: 'json',
          messages: [
            {
              role: 'system',
              content: `You create Finely Cred Work OS tasks. Return JSON only: { "title", "kind", "priority", "stage", "notes", "tags", "estimateMinutes", "dueDaysFromNow" }. kind one of: ${FALLBACK_KINDS.join(', ')}. priority: low|normal|high|urgent. stage: intake|reports|evidence|disputes|debt|identity|funding|complete.`,
            },
            { role: 'user', content: `${trimmed}\n\nContext: ${JSON.stringify(context ?? {})}` },
          ],
        });
        const obj = extractFirstJsonObject(res.text) as Record<string, unknown> | null;
        if (obj?.title) {
          const dueDays = typeof obj.dueDaysFromNow === 'number' ? obj.dueDaysFromNow : undefined;
          return {
            title: String(obj.title).slice(0, 200),
            kind: FALLBACK_KINDS.includes(obj.kind as TaskKind) ? (obj.kind as TaskKind) : 'general',
            priority: (['low', 'normal', 'high', 'urgent'].includes(String(obj.priority)) ? obj.priority : 'normal') as TaskPriority,
            stage: (['intake', 'reports', 'evidence', 'disputes', 'debt', 'identity', 'funding', 'complete'].includes(String(obj.stage)) ? obj.stage : 'intake') as TaskStage,
            notes: obj.notes ? String(obj.notes) : undefined,
            tags: Array.isArray(obj.tags) ? obj.tags.map(String) : undefined,
            estimateMinutes: typeof obj.estimateMinutes === 'number' ? obj.estimateMinutes : undefined,
            dueAt: dueDays != null ? new Date(Date.now() + dueDays * 86400000).toISOString() : undefined,
          };
        }
      }
    } catch {
      // fallback below
    }
  }

  return {
    title: trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed,
    kind: trimmed.toLowerCase().includes('mail') ? 'mail_letter' : trimmed.toLowerCase().includes('upload') ? 'upload_document' : 'general',
    priority: trimmed.toLowerCase().includes('urgent') ? 'urgent' : 'normal',
    stage: 'intake',
    notes: trimmed,
  };
}
