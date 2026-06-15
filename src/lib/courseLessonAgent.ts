import type { Course, CourseLesson } from '../domain/courses';
import { createTask } from '../data/tasksRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { narrateCourseLesson } from './courseVoiceNarrate';
import { callAiGateway } from './aiClient';

export type LessonAgentAction = 'narrate' | 'checklist_tasks' | 'publish_event';

export type LessonAgentResult = {
  ok: boolean;
  summary: string;
  narration?: { ok: boolean; message: string };
  checklistTasksCreated: number;
  actions: LessonAgentAction[];
};

function extractChecklistItems(markdown: string, max = 5): string[] {
  const lines = markdown.split('\n');
  const items: string[] = [];
  for (const line of lines) {
    const m = line.match(/^[-*]\s+(?:\[[ x]\]\s+)?(.+)$/i);
    if (!m?.[1]) continue;
    const text = m[1].trim();
    if (text.length < 8 || text.length > 120) continue;
    items.push(text);
    if (items.length >= max) break;
  }
  return items;
}

function lessonMarkdown(lesson: CourseLesson): string {
  return lesson.content
    .filter((b) => b.type === 'markdown')
    .map((b) => String((b as { data?: { markdown?: string } }).data?.markdown ?? ''))
    .join('\n\n')
    .trim();
}

/** Executable lesson agent — Voice Studio render + optional Work OS checklist tasks (Phase 9). */
export async function runCourseLessonAgent(args: {
  course: Course;
  lesson: CourseLesson;
  partnerId?: string;
  projectId?: string;
  dryRun?: boolean;
}): Promise<LessonAgentResult> {
  const actions: LessonAgentAction[] = [];
  const md = lessonMarkdown(args.lesson);
  let checklistTasksCreated = 0;
  let narration: LessonAgentResult['narration'];

  if (!args.dryRun) {
    narration = await narrateCourseLesson({ course: args.course, lesson: args.lesson, force: false });
    actions.push('narrate');
  }

  let checklist = extractChecklistItems(md);
  if (!checklist.length && md.length > 40) {
    try {
      const res = await callAiGateway({
        taskType: 'course.lesson_checklist',
        responseFormat: 'json',
        messages: [
          {
            role: 'system',
            content:
              'Extract 3-5 actionable learner checklist items from a lesson. Return ONLY JSON: { items: string[] }. Each item is a short imperative task (under 100 chars).',
          },
          { role: 'user', content: `Lesson: ${args.lesson.title}\n\n${md.slice(0, 4000)}` },
        ],
      });
      const parsed = JSON.parse(res.text) as { items?: string[] };
      if (Array.isArray(parsed.items)) {
        checklist = parsed.items.filter((s) => typeof s === 'string' && s.trim().length > 6).slice(0, 5);
      }
    } catch {
      checklist = [`Complete lesson: ${args.lesson.title}`];
    }
  }

  if (args.partnerId && checklist.length && !args.dryRun) {
    for (const title of checklist) {
      createTask({
        partnerId: args.partnerId,
        projectId: args.projectId,
        title,
        kind: 'general',
        status: 'pending',
        stage: 'intake',
        priority: 'normal',
        tags: ['course_agent', `course:${args.course.id}`, `lesson:${args.lesson.id}`],
        notes: `Auto-created from course lesson "${args.lesson.title}".`,
      });
      checklistTasksCreated += 1;
    }
    actions.push('checklist_tasks');
  }

  if (!args.dryRun) {
    emitPlatformEvent({
      type: 'automation.triggered',
      tenantId: FINELY_TENANT_ID,
      entityType: 'course_lesson',
      entityId: args.lesson.id,
      payload: {
        kind: 'course_lesson_agent_run',
        courseId: args.course.id,
        lessonId: args.lesson.id,
        lessonTitle: args.lesson.title,
        checklistTasksCreated,
        narrationOk: narration?.ok ?? false,
      },
    });
    actions.push('publish_event');
  }

  const summary = args.dryRun
    ? `Dry run — ${checklist.length} checklist item(s) ready; narration skipped.`
    : `${narration?.ok ? 'Narration queued' : narration?.message ?? 'Narration skipped'} · ${checklistTasksCreated} task(s) · event emitted`;

  return {
    ok: true,
    summary,
    narration,
    checklistTasksCreated,
    actions,
  };
}
