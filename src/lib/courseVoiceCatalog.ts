import type { Course, CourseLesson } from '../domain/courses';
import courseVoiceManifest from '../../data/course-voice-lessons.json';

/** Map course template title → stable prerender contentId (Phase 4B). */
const STABLE_INTRO_BY_COURSE_TITLE = new Map<string, string>(
  (courseVoiceManifest.lessons ?? []).map((entry) => {
    const courseTitle = entry.title.replace(/\s*—\s*Lesson\s*1\s*$/i, '').trim();
    return [courseTitle, entry.contentId] as const;
  }),
);

function isFirstLessonInCourse(course: Course, lesson: CourseLesson): boolean {
  const first = course.modules?.[0]?.lessons?.[0];
  return Boolean(first && first.id === lesson.id);
}

/** Runtime lesson id — falls back to dynamic id when no catalog match. */
export function resolveCourseLessonVoiceContentId(course: Course, lesson: CourseLesson): string {
  if (isFirstLessonInCourse(course, lesson)) {
    const stable = STABLE_INTRO_BY_COURSE_TITLE.get(course.title.trim());
    if (stable) return stable;
  }
  return `course-${course.id}-${lesson.id}`;
}

export function listStableCourseVoiceContentIds(): string[] {
  return [...STABLE_INTRO_BY_COURSE_TITLE.values()];
}
