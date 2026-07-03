import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

export type CourseLessonVideoStage =
  | 'draft'
  | 'script'
  | 'storyboard'
  | 'render_queued'
  | 'rendered'
  | 'attached'
  | 'published';

export type CourseLessonVideoJob = {
  id: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  stage: CourseLessonVideoStage;
  sceneCount?: number;
  resourceVideoId?: string;
  contentStudioAssetId?: string;
  contentStudioJobId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

const KEY = 'finely.courseVideoPipeline.v1';

type Store = { jobs: CourseLessonVideoJob[] };

function load(): Store {
  return loadJson(KEY, { jobs: [] }, 1);
}

function save(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export const COURSE_VIDEO_STAGE_ORDER: CourseLessonVideoStage[] = [
  'draft',
  'script',
  'storyboard',
  'render_queued',
  'rendered',
  'attached',
  'published',
];

export function listCourseVideoJobs(courseId?: string): CourseLessonVideoJob[] {
  const jobs = load().jobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return courseId ? jobs.filter((j) => j.courseId === courseId) : jobs;
}

export function getCourseLessonVideoJob(courseId: string, lessonId: string): CourseLessonVideoJob | null {
  return load().jobs.find((j) => j.courseId === courseId && j.lessonId === lessonId) ?? null;
}

export function upsertCourseLessonVideoJob(
  args: Omit<CourseLessonVideoJob, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): CourseLessonVideoJob {
  const store = load();
  const now = new Date().toISOString();
  const existingIdx = store.jobs.findIndex((j) => j.courseId === args.courseId && j.lessonId === args.lessonId);
  if (existingIdx >= 0) {
    store.jobs[existingIdx] = {
      ...store.jobs[existingIdx]!,
      ...args,
      updatedAt: now,
    };
    save(store);
    return store.jobs[existingIdx]!;
  }
  const job: CourseLessonVideoJob = {
    id: args.id ?? newId('cvjob'),
    courseId: args.courseId,
    lessonId: args.lessonId,
    lessonTitle: args.lessonTitle,
    stage: args.stage,
    sceneCount: args.sceneCount,
    resourceVideoId: args.resourceVideoId,
    contentStudioAssetId: args.contentStudioAssetId,
    contentStudioJobId: args.contentStudioJobId,
    notes: args.notes,
    createdAt: now,
    updatedAt: now,
  };
  store.jobs.unshift(job);
  save(store);
  return job;
}

export function advanceCourseLessonVideoStage(
  courseId: string,
  lessonId: string,
  stage: CourseLessonVideoStage,
  patch?: Partial<Pick<CourseLessonVideoJob, 'sceneCount' | 'resourceVideoId' | 'contentStudioAssetId' | 'contentStudioJobId' | 'notes' | 'lessonTitle'>>,
): CourseLessonVideoJob | null {
  const store = load();
  const idx = store.jobs.findIndex((j) => j.courseId === courseId && j.lessonId === lessonId);
  if (idx < 0) return null;
  store.jobs[idx] = {
    ...store.jobs[idx]!,
    ...patch,
    stage,
    updatedAt: new Date().toISOString(),
  };
  save(store);
  return store.jobs[idx]!;
}

export function courseVideoPipelineStats(courseId: string): Record<CourseLessonVideoStage, number> {
  const jobs = listCourseVideoJobs(courseId);
  const stats: Record<CourseLessonVideoStage, number> = {
    draft: 0,
    script: 0,
    storyboard: 0,
    render_queued: 0,
    rendered: 0,
    attached: 0,
    published: 0,
  };
  for (const j of jobs) stats[j.stage] += 1;
  return stats;
}
