import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Clapperboard, Film, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listAllCourses } from '../../data/coursesRepo';
import type { CourseLesson } from '../../domain/courses';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsListItem,
} from '../os/finelyOsLightUi';
import {
  contentStudioUrlForCourseLesson,
  countLessonScenesForLesson,
  inferLessonVideoStage,
  intakeFromCourseLesson,
  lessonHasAttachedVideo,
  lessonMarkdownFromBlocks,
  videoCommandRequestFromCourseLesson,
} from '../educationStudio/courseVideoBridge';
import {
  COURSE_VIDEO_STAGE_ORDER,
  type CourseLessonVideoStage,
  listCourseVideoJobs,
} from '../../data/courseVideoPipelineRepo';
import { createContentStudioJob, setSelectedContentStudioJobId } from './contentStudioRepo';
import { GeminiStyleVideoCommand } from './GeminiStyleVideoCommand';

const STAGE_LABELS: Record<CourseLessonVideoStage, string> = {
  draft: 'Draft',
  script: 'Script',
  storyboard: 'Storyboard',
  render_queued: 'Render queued',
  rendered: 'Rendered',
  attached: 'Attached',
  published: 'Published',
};

type Props = {
  courseId?: string | null;
  lessonId?: string | null;
};

export function CourseVideoBatchWorkroom({ courseId, lessonId }: Props) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(courseId ?? null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(lessonId ?? null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (courseId) setActiveCourseId(courseId);
    if (lessonId) setActiveLessonId(lessonId);
  }, [courseId, lessonId]);

  const courses = useMemo(() => listAllCourses(), [version]);
  const activeCourse = useMemo(() => courses.find((c) => c.id === activeCourseId) ?? courses[0] ?? null, [courses, activeCourseId]);

  const lessonRows = useMemo(() => {
    if (!activeCourse) return [];
    const jobs = listCourseVideoJobs(activeCourse.id);
    const out: Array<{
      lessonId: string;
      moduleTitle: string;
      title: string;
      stage: CourseLessonVideoStage;
      hasVideo: boolean;
    }> = [];
    for (const m of activeCourse.modules ?? []) {
      for (const l of m.lessons ?? []) {
        const job = jobs.find((j) => j.lessonId === l.id);
        const sceneCount = countLessonScenesForLesson(activeCourse, l.id);
        out.push({
          lessonId: l.id,
          moduleTitle: m.title,
          title: l.title,
          stage: inferLessonVideoStage({ lesson: l, sceneCount: job?.sceneCount ?? sceneCount, pipelineStage: job?.stage }),
          hasVideo: lessonHasAttachedVideo(l),
        });
      }
    }
    return out;
  }, [activeCourse, version]);

  const activeLesson = useMemo(() => {
    if (!activeCourse || !activeLessonId) return null;
    for (const m of activeCourse.modules ?? []) {
      const l = m.lessons?.find((x) => x.id === activeLessonId);
      if (l) return l;
    }
    return activeCourse.modules?.[0]?.lessons?.[0] ?? null;
  }, [activeCourse, activeLessonId]);

  const videoInitialRequest = useMemo(() => {
    if (!activeCourse || !activeLesson) return undefined;
    return videoCommandRequestFromCourseLesson({
      course: activeCourse,
      lesson: activeLesson,
      lessonMarkdown: lessonMarkdownFromBlocks(activeLesson),
    });
  }, [activeCourse, activeLesson]);

  const startLessonRender = (cId: string, lId: string) => {
    const course = courses.find((c) => c.id === cId);
    if (!course) return;
    let lesson: CourseLesson | null = null;
    for (const m of course.modules ?? []) {
      const found = m.lessons?.find((x) => x.id === lId);
      if (found) {
        lesson = found;
        break;
      }
    }
    if (!lesson) return;
    const job = createContentStudioJob(
      intakeFromCourseLesson({ course, lesson, lessonMarkdown: lessonMarkdownFromBlocks(lesson) }),
    );
    setSelectedContentStudioJobId(job.id);
    setActiveCourseId(cId);
    setActiveLessonId(lId);
    setNotice(`Render job created for "${lesson.title}".`);
    navigate(contentStudioUrlForCourseLesson(cId, lId));
    setVersion((v) => v + 1);
  };

  const queueCourse = () => {
    if (!activeCourse) return;
    setBusy(true);
    try {
      let n = 0;
      for (const m of activeCourse.modules ?? []) {
        for (const l of m.lessons ?? []) {
          if (lessonHasAttachedVideo(l)) continue;
          const job = createContentStudioJob(
            intakeFromCourseLesson({ course: activeCourse, lesson: l, lessonMarkdown: lessonMarkdownFromBlocks(l) }),
          );
          if (!n) setSelectedContentStudioJobId(job.id);
          n += 1;
        }
      }
      setNotice(n ? `Queued ${n} lesson video(s) for "${activeCourse.title}".` : 'All lessons already have videos.');
      setVersion((v) => v + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${finelyOsCatalogCard('fuchsia')} !p-6 space-y-4`} data-fc-accent="fuchsia">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
          <BookOpen size={16} />
          <span>Course video batch factory</span>
        </div>
        <p className={FINELY_OS_ENTITY_BODY}>
          Full prompt-to-video pipeline for every course lesson — script, storyboard, render, and attach as{' '}
          <code className="opacity-80">video_asset</code> blocks in the course builder.
        </p>
        {notice ? <p className="text-sm text-emerald-200/90">{notice}</p> : null}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={activeCourse?.id ?? ''}
            onChange={(e) => {
              setActiveCourseId(e.target.value || null);
              setActiveLessonId(null);
            }}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy || !activeCourse} onClick={queueCourse}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Queue all lessons
          </button>
          {activeCourse ? (
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(`/admin/courses/${activeCourse.id}`)}>
              Open course builder <ArrowRight size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {activeCourse ? (
        <FinelyOsPaginatedStack
          items={lessonRows}
          pageSize={10}
          emptyMessage="No lessons in this course yet."
          renderItem={(row) => {
            const active = activeLessonId === row.lessonId;
            return (
              <div key={row.lessonId} className={`${finelyOsListItem(active, 'fuchsia')} flex flex-wrap items-center justify-between gap-3`}>
                <button type="button" className="text-left min-w-0 flex-1" onClick={() => setActiveLessonId(row.lessonId)}>
                  <div className={FINELY_OS_ENTITY_VALUE}>{row.title}</div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>{row.moduleTitle} · {STAGE_LABELS[row.stage]}{row.hasVideo ? ' · video attached' : ''}</div>
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => startLessonRender(activeCourse.id, row.lessonId)}>
                  <Clapperboard size={14} /> Render
                </button>
              </div>
            );
          }}
        />
      ) : null}

      {activeCourse && activeLesson ? (
        <div className="space-y-3">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
            <Film size={16} />
            <span>Video command — {activeLesson.title}</span>
          </div>
          <GeminiStyleVideoCommand key={`${activeCourse.id}-${activeLesson.id}`} initialRequest={videoInitialRequest} />
        </div>
      ) : null}
    </div>
  );
}
