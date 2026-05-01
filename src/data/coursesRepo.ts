import type { Course, CourseId, CourseProgress, CourseLessonId } from '../domain/courses';
import { newCourse, nowIso } from '../domain/courses';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { issueCertificate } from './certificatesRepo';

const KEY = 'finely.courses.v1';

type Store = {
  courses: Course[];
  progress: CourseProgress[];
};

function loadStore(): Store {
  return loadJson<Store>(
    KEY,
    {
      courses: [
        {
          ...newCourse({
            title: 'Dispute Rounds Mastery',
            desc: 'Round 1 → Round 2 → Round 3, evidence discipline, response handling, and clean follow-up cadence.',
            tags: ['personal', 'disputes'],
          }),
          published: true,
        },
      ],
      progress: [],
    },
    1,
  );
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function normCourseBlocks(course: Course): { course: Course; changed: boolean } {
  let changed = false;
  const next: Course = {
    ...course,
    modules: (course.modules ?? []).map((m) => ({
      ...m,
      lessons: (m.lessons ?? []).map((l) => {
        const contentRaw = Array.isArray((l as any).content) ? (l as any).content : [];
        const content = contentRaw
          .map((b: any) => {
            if (!b) return null;
            // New format: { id, type, data }
            if (typeof b?.id === 'string' && typeof b?.type === 'string' && b?.data && typeof b.data === 'object') return b;
            // Legacy markdown: { type:'markdown', markdown:string }
            if (b?.type === 'markdown') {
              changed = true;
              return { id: newId('blk'), type: 'markdown', data: { markdown: String(b?.markdown ?? '') } };
            }
            // Legacy video asset: { type:'video_asset', videoAssetId, caption? }
            if (b?.type === 'video_asset') {
              changed = true;
              return {
                id: newId('blk'),
                type: 'video_asset',
                data: { videoAssetId: String(b?.videoAssetId ?? ''), caption: b?.caption ? String(b.caption) : undefined },
              };
            }
            // Unknown legacy block: wrap it
            changed = true;
            return { id: newId('blk'), type: String(b?.type ?? 'markdown'), data: { ...b } };
          })
          .filter(Boolean)
          .slice(0, 300);

        return { ...l, content };
      }),
    })),
  };
  return { course: next, changed };
}

export function listAllCourses(): Course[] {
  const store = loadStore();
  let changed = false;
  const normalized = store.courses.map((c) => {
    const res = normCourseBlocks(c);
    if (res.changed) changed = true;
    return res.course;
  });
  if (changed) {
    store.courses = normalized;
    saveStore(store);
  }
  return normalized.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listPublishedCourses(): Course[] {
  return listAllCourses().filter((c) => c.published);
}

export function getCourse(id: CourseId): Course | null {
  return listAllCourses().find((c) => c.id === id) ?? null;
}

export function upsertCourse(course: Course): Course {
  const store = loadStore();
  const idx = store.courses.findIndex((c) => c.id === course.id);
  const normalized = normCourseBlocks(course).course;
  const updated: Course = { ...normalized, updatedAt: nowIso() };
  if (idx >= 0) store.courses[idx] = updated;
  else store.courses.push(updated);
  saveStore(store);
  return updated;
}

export function createCourse(seed?: Partial<Pick<Course, 'title' | 'desc' | 'tags'>>): Course {
  const course = newCourse(seed);
  return upsertCourse(course);
}

export function deleteCourse(id: CourseId) {
  const store = loadStore();
  store.courses = store.courses.filter((c) => c.id !== id);
  store.progress = store.progress.filter((p) => p.courseId !== id);
  saveStore(store);
}

export function getCourseProgress(args: { partnerId: string; courseId: CourseId }): CourseProgress {
  const store = loadStore();
  const existing = store.progress.find((p) => p.partnerId === args.partnerId && p.courseId === args.courseId);
  if (existing) {
    // Normalize legacy progress
    if (!(existing as any).enrolledAt) {
      (existing as any).enrolledAt = existing.updatedAt || nowIso();
      saveStore(store);
    }
    return existing as any;
  }
  const next: CourseProgress = {
    id: newId('course_prog'),
    partnerId: args.partnerId,
    courseId: args.courseId,
    enrolledAt: nowIso(),
    lessons: [],
    updatedAt: nowIso(),
  };
  store.progress.push(next);
  saveStore(store);
  return next;
}

export function enrollPartnerInCourse(args: { partnerId: string; courseId: CourseId }): CourseProgress {
  const prog = getCourseProgress(args);
  if (!prog.enrolledAt) {
    const store = loadStore();
    const p = store.progress.find((x) => x.id === prog.id);
    if (p) {
      (p as any).enrolledAt = nowIso();
      p.updatedAt = nowIso();
      saveStore(store);
      return p as any;
    }
  }
  return prog;
}

function allLessonIds(course: Course): string[] {
  const out: string[] = [];
  for (const m of course.modules ?? []) for (const l of m.lessons ?? []) out.push(l.id);
  return out;
}

function daysBetween(aIso: string, bIso: string): number {
  try {
    const a = new Date(aIso).getTime();
    const b = new Date(bIso).getTime();
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function isLessonUnlocked(args: {
  partnerId: string;
  course: Course;
  lessonId: CourseLessonId;
}): { ok: boolean; reason?: string } {
  const prog = getCourseProgress({ partnerId: args.partnerId, courseId: args.course.id });
  const enrolledAt = prog.enrolledAt || prog.updatedAt || nowIso();
  const all = args.course.modules ?? [];
  for (const m of all) {
    const lesson = (m.lessons ?? []).find((l) => l.id === args.lessonId);
    if (!lesson) continue;

    // Module prereqs (by id)
    if (Array.isArray((m as any).prereqModuleIds) && (m as any).prereqModuleIds.length) {
      const prereqModuleIds = (m as any).prereqModuleIds as string[];
      const prereqLessonIds: string[] = [];
      for (const pm of all.filter((x) => prereqModuleIds.includes(x.id))) {
        for (const pl of pm.lessons ?? []) prereqLessonIds.push(pl.id);
      }
      const missing = prereqLessonIds.filter((id) => !prog.lessons.find((x) => x.lessonId === id && x.completedAt));
      if (missing.length) return { ok: false, reason: 'Complete prerequisites (earlier module lessons) to unlock.' };
    }

    // Lesson prereqs
    const prereqLessonIds = Array.isArray((lesson as any).prereqLessonIds) ? ((lesson as any).prereqLessonIds as string[]) : [];
    if (prereqLessonIds.length) {
      const missing = prereqLessonIds.filter((id) => !prog.lessons.find((x) => x.lessonId === id && x.completedAt));
      if (missing.length) return { ok: false, reason: 'Complete prerequisite lesson(s) to unlock.' };
    }

    // Drip rules (module and lesson)
    const dripDays = Math.max(0, Number((lesson as any).dripDays ?? (m as any).dripDays ?? 0) || 0);
    if (dripDays > 0) {
      const age = daysBetween(enrolledAt, nowIso());
      if (age < dripDays) return { ok: false, reason: `Unlocks ${dripDays} day(s) after enrollment.` };
    }

    return { ok: true };
  }
  return { ok: true };
}

export function nextUnlockedLesson(args: { partnerId: string; course: Course }): CourseLessonId | null {
  const prog = getCourseProgress({ partnerId: args.partnerId, courseId: args.course.id });
  for (const id of allLessonIds(args.course)) {
    const done = Boolean(prog.lessons.find((l) => l.lessonId === id)?.completedAt);
    if (done) continue;
    const ok = isLessonUnlocked({ partnerId: args.partnerId, course: args.course, lessonId: id }).ok;
    if (ok) return id;
  }
  return null;
}

function maybeCompleteCourse(args: { partnerId: string; course: Course }) {
  const store = loadStore();
  const prog = store.progress.find((p) => p.partnerId === args.partnerId && p.courseId === args.course.id);
  if (!prog) return;
  const all = allLessonIds(args.course);
  if (!all.length) return;
  const done = all.every((id) => Boolean(prog.lessons.find((l) => l.lessonId === id)?.completedAt));
  if (!done) return;
  if (!prog.completedAt) prog.completedAt = nowIso();
  if (!prog.certificateId) {
    const cert = issueCertificate({
      partnerId: args.partnerId,
      courseId: args.course.id,
      courseTitle: args.course.title,
      issuedAt: prog.completedAt || nowIso(),
    });
    prog.certificateId = cert.id;
  }
  prog.updatedAt = nowIso();
  saveStore(store);
}

export function markLessonComplete(args: { partnerId: string; courseId: CourseId; lessonId: CourseLessonId }) {
  const store = loadStore();
  const now = nowIso();
  let prog = store.progress.find((p) => p.partnerId === args.partnerId && p.courseId === args.courseId);
  if (!prog) {
    prog = {
      id: newId('course_prog'),
      partnerId: args.partnerId,
      courseId: args.courseId,
      enrolledAt: now,
      lessons: [],
      updatedAt: now,
    };
    store.progress.push(prog);
  }
  const idx = prog.lessons.findIndex((l) => l.lessonId === args.lessonId);
  if (idx >= 0) prog.lessons[idx] = { ...prog.lessons[idx]!, completedAt: now };
  else prog.lessons.push({ lessonId: args.lessonId, completedAt: now });
  prog.updatedAt = now;
  saveStore(store);

  const course = getCourse(args.courseId);
  if (course) maybeCompleteCourse({ partnerId: args.partnerId, course });
}

