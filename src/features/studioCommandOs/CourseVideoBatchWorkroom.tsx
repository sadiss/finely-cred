import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Clapperboard, Film, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listAllCourses } from '../../data/coursesRepo';
import type { CourseLesson } from '../../domain/courses';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowKpi,
  finelyOsMicroStat,
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
  render_queued: 'Queued',
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
  const [lessonOpen, setLessonOpen] = useState(Boolean(lessonId));

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
      sceneCount: number;
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
          sceneCount: job?.sceneCount ?? sceneCount,
        });
      }
    }
    return out;
  }, [activeCourse, version]);

  const stageCounts = useMemo(() => {
    const counts = Object.fromEntries(COURSE_VIDEO_STAGE_ORDER.map((s) => [s, 0])) as Record<CourseLessonVideoStage, number>;
    for (const row of lessonRows) counts[row.stage] += 1;
    return counts;
  }, [lessonRows]);

  const activeLesson = useMemo(() => {
    if (!activeCourse || !activeLessonId) return null;
    for (const m of activeCourse.modules ?? []) {
      const l = m.lessons?.find((x) => x.id === activeLessonId);
      if (l) return l;
    }
    return activeCourse.modules?.[0]?.lessons?.[0] ?? null;
  }, [activeCourse, activeLessonId]);

  const activeRow = useMemo(
    () => lessonRows.find((r) => r.lessonId === (activeLesson?.id ?? activeLessonId)) ?? lessonRows[0] ?? null,
    [lessonRows, activeLesson, activeLessonId],
  );

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
    <div className={FINELY_OS_COMPACT_PAGE}>
      <div className={`${finelyOsCatalogCardCompact('fuchsia')} space-y-3`} data-fc-accent="fuchsia">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
              <BookOpen size={14} />
              <span>Finely Course Flow</span>
            </div>
            <h2 className={`${FINELY_OS_ENTITY_TITLE} mt-1`}>Course video factory</h2>
            <p className={`${FINELY_OS_ENTITY_BODY} mt-1 max-w-2xl`}>
              Deck of lessons → one focused render. Presenter Mode (stills + VO) is live; cinematic Kling/Runway/Veo stays Planned.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={activeCourse?.id ?? ''}
              onChange={(e) => {
                setActiveCourseId(e.target.value || null);
                setActiveLessonId(null);
              }}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 max-w-xs"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy || !activeCourse} onClick={queueCourse}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Queue missing
            </button>
            {activeCourse ? (
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(`/admin/courses/${activeCourse.id}`)}>
                Course builder <ArrowRight size={14} />
              </button>
            ) : null}
          </div>
        </div>
        {notice ? <p className="text-sm text-emerald-200/90">{notice}</p> : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className={`${finelyOsGlowKpi('fuchsia')} !p-3`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Lessons</div>
            <div className={FINELY_OS_ENTITY_VALUE}>{lessonRows.length}</div>
          </div>
          <div className={`${finelyOsGlowKpi('violet')} !p-3`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Storyboard</div>
            <div className={FINELY_OS_ENTITY_VALUE}>{stageCounts.storyboard + stageCounts.render_queued}</div>
          </div>
          <div className={`${finelyOsGlowKpi('sky')} !p-3`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Rendered</div>
            <div className={FINELY_OS_ENTITY_VALUE}>{stageCounts.rendered}</div>
          </div>
          <div className={`${finelyOsGlowKpi('emerald')} !p-3`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Attached</div>
            <div className={FINELY_OS_ENTITY_VALUE}>{stageCounts.attached + stageCounts.published}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {COURSE_VIDEO_STAGE_ORDER.map((s) => (
            <span key={s} className={finelyOsMicroStat(s === 'attached' || s === 'published' ? 'emerald' : s === 'storyboard' ? 'fuchsia' : 'violet')}>
              {STAGE_LABELS[s]} · {stageCounts[s]}
            </span>
          ))}
        </div>
      </div>

      {activeCourse && !lessonOpen ? (
        <div className="space-y-3">
          <div className="text-lg font-semibold text-[#e8e8e8]">Lessons</div>
          <FinelyOsPaginatedStack
            items={lessonRows}
            pageSize={8}
            emptyMessage="No lessons in this course yet."
            itemSpacingClassName="grid gap-4 sm:grid-cols-2"
            renderItem={(row) => (
              <button
                key={row.lessonId}
                type="button"
                onClick={() => {
                  setActiveLessonId(row.lessonId);
                  setLessonOpen(true);
                }}
                className="rounded-2xl border border-white/15 bg-[#0b1110] p-5 text-left"
              >
                <div className="text-sm text-[#fbbf24]">{row.moduleTitle}</div>
                <div className="mt-2 text-lg font-semibold text-[#e8e8e8]">{row.title}</div>
                <div className="mt-2 text-base text-[#e8e8e8]">
                  {STAGE_LABELS[row.stage]}
                  {row.sceneCount > 0 ? ` · ${row.sceneCount} scenes` : ''}
                </div>
              </button>
            )}
          />
        </div>
      ) : null}

      {activeCourse && lessonOpen && activeLesson && activeRow ? (
        <div className="space-y-4 rounded-2xl border border-white/15 bg-[#0b1110] p-6">
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => setLessonOpen(false)}
          >
            <ArrowLeft size={16} /> All lessons
          </button>
          <h3 className="text-2xl font-semibold text-[#e8e8e8]">{activeLesson.title}</h3>
          <p className="text-base text-[#e8e8e8]">
            {activeRow.moduleTitle} · {STAGE_LABELS[activeRow.stage]}
            {activeRow.hasVideo ? ' · video attached' : ''}
          </p>
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            onClick={() => startLessonRender(activeCourse.id, activeLesson.id)}
          >
            <Clapperboard size={14} /> Render this lesson
          </button>
        </div>
      ) : null}

      {activeCourse && activeLesson ? (
        <div className="space-y-2">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
            <Film size={14} />
            <span>Presenter / plan command — {activeLesson.title}</span>
          </div>
          <GeminiStyleVideoCommand key={`${activeCourse.id}-${activeLesson.id}`} initialRequest={videoInitialRequest} />
        </div>
      ) : null}
    </div>
  );
}
