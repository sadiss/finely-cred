import type { Course, CourseLesson } from '../domain/courses';
import { buildDefaultNarration, type GuideNarration } from '../resources/guideNarration';
import { getPublicVoiceProfile, renderVoiceAsset, getVoiceStudioStatus } from './voiceStudioClient';
import { resolveCourseLessonVoiceContentId } from './courseVoiceCatalog';

export function lessonToNarration(course: Course, lesson: CourseLesson): GuideNarration {
  const contentId = resolveCourseLessonVoiceContentId(course, lesson);
  const bullets = lesson.content
    .filter((b) => b.type === 'markdown' || b.type === 'rich_text')
    .flatMap((b) => {
      const data = (b as { data?: { markdown?: string; text?: string; html?: string } }).data;
      const text = String(data?.markdown ?? data?.text ?? data?.html ?? '');
      return text.split('\n').filter((l) => l.trim().length > 24).slice(0, 16);
    });

  if (bullets.length === 0 && lesson.summary) {
    bullets.push(lesson.summary);
  }

  return buildDefaultNarration(
    contentId,
    `${course.title} — ${lesson.title}`,
    [{ heading: lesson.title, bullets: bullets.length ? bullets : ['Lesson content'] }],
  );
}

export async function narrateCourseLesson(args: {
  course: Course;
  lesson: CourseLesson;
  force?: boolean;
}): Promise<{ ok: boolean; message: string }> {
  const studio = getVoiceStudioStatus();
  if (!studio.available) {
    return { ok: false, message: studio.reason ?? 'Voice Studio not configured.' };
  }

  const narration = lessonToNarration(args.course, args.lesson);
  const contentId = resolveCourseLessonVoiceContentId(args.course, args.lesson);
  try {
    await renderVoiceAsset({
      tenantId: 'finely_cred',
      contentType: 'course_lesson',
      contentId,
      title: `${args.course.title} — ${args.lesson.title}`,
      narration,
      voiceProfile: getPublicVoiceProfile('finely_cred'),
      force: args.force,
    });
    return { ok: true, message: `Narration queued for "${args.lesson.title}".` };
  } catch (e: unknown) {
    return { ok: false, message: (e as Error)?.message ?? 'Render failed.' };
  }
}

export async function narrateAllCourseLessons(args: {
  course: Course;
  force?: boolean;
  onProgress?: (done: number, total: number, lessonTitle: string) => void;
}): Promise<{ ok: number; failed: number; messages: string[] }> {
  const lessons: CourseLesson[] = [];
  for (const m of args.course.modules ?? []) {
    for (const l of m.lessons ?? []) lessons.push(l);
  }

  let ok = 0;
  let failed = 0;
  const messages: string[] = [];

  for (let i = 0; i < lessons.length; i += 1) {
    const lesson = lessons[i]!;
    args.onProgress?.(i + 1, lessons.length, lesson.title);
    const res = await narrateCourseLesson({ course: args.course, lesson, force: args.force });
    if (res.ok) ok += 1;
    else {
      failed += 1;
      messages.push(`${lesson.title}: ${res.message}`);
    }
  }

  return { ok, failed, messages };
}
