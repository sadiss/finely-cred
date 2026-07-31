import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clapperboard, Film, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Course, CourseLesson } from '../../domain/courses';
import type { VideoProductionStyle, VideoProviderId, VideoScenePlan } from './educationStudioModel';
import { FinelyOsGlassPanel } from '../os/FinelyOsGlassPanel';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsDeckTile,
  finelyOsInlineListItem,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { VideoProductionPanel } from './VideoProductionPanel';
import {
  contentStudioUrlForCourseLesson,
  countLessonScenesForLesson,
  inferLessonVideoStage,
  intakeFromCourseLesson,
  lessonHasAttachedVideo,
  lessonMarkdownFromBlocks,
} from './courseVideoBridge';
import {
  COURSE_VIDEO_STAGE_ORDER,
  type CourseLessonVideoStage,
  getCourseLessonVideoJob,
  listCourseVideoJobs,
  upsertCourseLessonVideoJob,
} from '../../data/courseVideoPipelineRepo';
import { createContentStudioJob, setSelectedContentStudioJobId } from '../studioCommandOs/contentStudioRepo';

const STAGE_LABELS: Record<CourseLessonVideoStage, string> = {
  draft: 'Draft',
  script: 'Script',
  storyboard: 'Storyboard',
  render_queued: 'Render queued',
  rendered: 'Rendered',
  attached: 'Attached',
  published: 'Published',
};

function stageTone(stage: CourseLessonVideoStage): string {
  if (stage === 'published' || stage === 'attached') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  if (stage === 'rendered' || stage === 'render_queued') return 'text-sky-300 border-sky-500/30 bg-sky-500/10';
  if (stage === 'storyboard') return 'text-fuchsia-300 border-fuchsia-500/30 bg-fuchsia-500/10';
  if (stage === 'script') return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  return 'text-white/50 border-white/10 bg-white/[0.03]';
}

type Props = {
  courseId: string;
  course: Course;
  lesson: CourseLesson | null;
  lessonMarkdown: string;
  style: VideoProductionStyle;
  provider: VideoProviderId;
  onStyleChange: (s: VideoProductionStyle) => void;
  onProviderChange: (p: VideoProviderId) => void;
  scenes: VideoScenePlan[];
  onScenesChange: (scenes: VideoScenePlan[]) => void;
  onGenerateScript: () => Promise<void>;
  onGenerateStoryboard: () => Promise<void>;
  busy: boolean;
  onLessonSelect?: (lessonId: string) => void;
};

export function CourseVideoProductionCommand({
  courseId,
  course,
  lesson,
  lessonMarkdown,
  style,
  provider,
  onStyleChange,
  onProviderChange,
  scenes,
  onScenesChange,
  onGenerateScript,
  onGenerateStoryboard,
  busy,
  onLessonSelect,
}: Props) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const allLessons = useMemo(() => {
    const out: Array<{ lessonId: string; moduleTitle: string; lesson: CourseLesson }> = [];
    for (const m of course.modules ?? []) {
      for (const l of m.lessons ?? []) out.push({ lessonId: l.id, moduleTitle: m.title, lesson: l });
    }
    return out;
  }, [course]);

  const pipelineJobs = useMemo(() => listCourseVideoJobs(courseId), [courseId, version]);

  const lessonRows = useMemo(
    () =>
      allLessons.map(({ lessonId, moduleTitle, lesson: l }) => {
        const job = pipelineJobs.find((j) => j.lessonId === lessonId) ?? getCourseLessonVideoJob(courseId, lessonId);
        const sceneCount = countLessonScenesForLesson(course, lessonId);
        const stage = inferLessonVideoStage({
          lesson: l,
          sceneCount: job?.sceneCount ?? sceneCount,
          pipelineStage: job?.stage,
        });
        return { lessonId, moduleTitle, lesson: l, stage, sceneCount: job?.sceneCount ?? sceneCount, hasVideo: lessonHasAttachedVideo(l) };
      }),
    [allLessons, course, courseId, pipelineJobs],
  );

  const activeStage = useMemo(() => {
    if (!lesson) return 'draft' as CourseLessonVideoStage;
    const row = lessonRows.find((r) => r.lessonId === lesson.id);
    return row?.stage ?? 'draft';
  }, [lesson, lessonRows]);

  const syncPipeline = (lessonId: string, lessonTitle: string, stage: CourseLessonVideoStage, sceneCount?: number) => {
    upsertCourseLessonVideoJob({
      courseId,
      lessonId,
      lessonTitle,
      stage,
      sceneCount,
    });
    setVersion((v) => v + 1);
  };

  const openContentStudio = (lessonId: string, l: CourseLesson) => {
    const md = lessonId === lesson?.id ? lessonMarkdown : lessonMarkdownFromBlocks(l);
    const job = createContentStudioJob(intakeFromCourseLesson({ course, lesson: l, lessonMarkdown: md }));
    setSelectedContentStudioJobId(job.id);
    syncPipeline(lessonId, l.title, 'render_queued', scenes.length);
    setNotice(`Content Studio job created — render and attach video for "${l.title}".`);
    navigate(contentStudioUrlForCourseLesson(courseId, lessonId));
  };

  const runBulkQueue = () => {
    setPipelineBusy(true);
    try {
      let queued = 0;
      for (const { lessonId, lesson: l } of allLessons) {
        if (lessonHasAttachedVideo(l)) continue;
        const md = lessonMarkdownFromBlocks(l);
        const job = createContentStudioJob(intakeFromCourseLesson({ course, lesson: l, lessonMarkdown: md }));
        if (queued === 0) setSelectedContentStudioJobId(job.id);
        syncPipeline(lessonId, l.title, 'render_queued');
        queued += 1;
      }
      setNotice(queued ? `Queued ${queued} lesson video job(s) in Content Studio.` : 'All lessons already have attached videos.');
      if (queued) navigate(contentStudioUrlForCourseLesson(courseId, allLessons[0]?.lessonId ?? '', 'course_videos'));
    } finally {
      setPipelineBusy(false);
    }
  };

  const afterScenes = (nextScenes: VideoScenePlan[]) => {
    onScenesChange(nextScenes);
    if (lesson && nextScenes.length) syncPipeline(lesson.id, lesson.title, 'storyboard', nextScenes.length);
  };

  return (
    <div className="space-y-4">
      <FinelyOsGlassPanel
        icon={Film}
        title="Course video production pipeline"
        subtitle="Draft → Script → Storyboard → Render → Attach → Publish — every lesson gets a cinematic video via Content Studio."
        accent="fuchsia"
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={pipelineBusy} onClick={runBulkQueue}>
              {pipelineBusy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Queue all lessons
            </button>
            {lesson ? (
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => openContentStudio(lesson.id, lesson)}>
                <Clapperboard size={14} /> Render in Content Studio <ArrowRight size={12} />
              </button>
            ) : null}
          </div>
        }
      >
        {notice ? <div className={`mb-4 ${FINELY_OS_ENTITY_BODY} text-sm text-emerald-200/90`}>{notice}</div> : null}

        <div className="flex flex-wrap gap-2 mb-4">
          {COURSE_VIDEO_STAGE_ORDER.map((s) => {
            const count = lessonRows.filter((r) => r.stage === s).length;
            return (
              <span key={s} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${stageTone(s)}`}>
                {STAGE_LABELS[s]} · {count}
              </span>
            );
          })}
        </div>

        <FinelyOsPaginatedStack
          items={lessonRows}
          pageSize={8}
          emptyMessage="Add lessons in Curriculum to start video production."
          itemSpacingClassName="grid sm:grid-cols-2 lg:grid-cols-3 gap-2"
          renderItem={(row) => {
            const active = lesson?.id === row.lessonId;
            return (
              <button
                key={row.lessonId}
                type="button"
                onClick={() => onLessonSelect?.(row.lessonId)}
                className={`${finelyOsDeckTile('fuchsia', active)} p-3 text-left`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{row.lesson.title}</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} truncate`}>{row.moduleTitle}</div>
                  </div>
                  <span className={finelyOsMicroStat(row.hasVideo ? 'emerald' : 'fuchsia')}>{STAGE_LABELS[row.stage]}</span>
                </div>
                <div className={`mt-2 flex flex-wrap gap-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  {row.sceneCount > 0 ? <span>{row.sceneCount} scenes</span> : <span>No scenes</span>}
                  {row.hasVideo ? (
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <CheckCircle2 size={12} /> Attached
                    </span>
                  ) : null}
                </div>
              </button>
            );
          }}
        />
      </FinelyOsGlassPanel>

      {lesson ? (
        <FinelyOsGlassPanel icon={Sparkles} title={`Active lesson — ${lesson.title}`} subtitle="Script, storyboard, scene plan, then full render in Content Studio." accent="amber" variant="inner">
          <div className="flex flex-wrap gap-2 mb-4">
            {COURSE_VIDEO_STAGE_ORDER.map((s, i) => {
              const currentIdx = COURSE_VIDEO_STAGE_ORDER.indexOf(activeStage);
              const done = i <= currentIdx;
              return (
                <span
                  key={s}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${done ? stageTone(s) : 'text-white/35 border-white/8'}`}
                >
                  {STAGE_LABELS[s]}
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" disabled={busy} onClick={() => void onGenerateScript().then(() => syncPipeline(lesson.id, lesson.title, 'script'))} className={FINELY_OS_SECONDARY_BTN}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI script
            </button>
            <button type="button" disabled={busy} onClick={() => void onGenerateStoryboard().then(() => syncPipeline(lesson.id, lesson.title, 'storyboard'))} className={FINELY_OS_SECONDARY_BTN}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} AI storyboard
            </button>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => openContentStudio(lesson.id, lesson)}>
              <Clapperboard size={14} /> Open Content Studio render
            </button>
          </div>
          <div className={`${finelyOsInlineListItem()} !p-3 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Full render path: Content Studio → prompt-to-video → scene images → narration → WebM export → attach to this lesson.
          </div>
        </FinelyOsGlassPanel>
      ) : null}

      <VideoProductionPanel
        courseTitle={course.title}
        lesson={lesson}
        lessonMarkdown={lessonMarkdown}
        style={style}
        provider={provider}
        onStyleChange={onStyleChange}
        onProviderChange={onProviderChange}
        scenes={scenes}
        onScenesChange={afterScenes}
      />
    </div>
  );
}
