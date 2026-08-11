import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clapperboard,
  Copy,
  GraduationCap,
  Headphones,
  LayoutGrid,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  Wand2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { getCourse, upsertCourse } from '../../data/coursesRepo';
import type { Course, CourseLesson, CourseModule, LessonContentBlock } from '../../domain/courses';
import type { VideoProductionStyle, VideoProviderId, VideoScenePlan } from '../../domain/educationStudio';
import { nowIso } from '../../domain/courses';
import { newId } from '../../utils/ids';
import { callAiGateway } from '../../lib/aiClient';
import { extractFirstJsonObject } from '../../utils/jsonExtract';
import { LessonBlockEditor } from '../../components/courses/LessonBlockEditor';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import { FinelyOsIconBadge } from '../../features/os/FinelyOsIconBadge';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { CoursePublishChecklist } from '../../features/educationStudio/CoursePublishChecklist';
import { CourseVideoProductionCommand } from '../../features/educationStudio/CourseVideoProductionCommand';
import { narrateCourseLesson } from '../../lib/courseVoiceNarrate';
import { runCourseLessonAgent } from '../../lib/courseLessonAgent';
import {
  attachBlobToCourseLesson,
  inferLessonVideoStage,
  countLessonScenesForLesson,
  lessonHasAttachedVideo,
  lessonMarkdownFromBlocks,
  videoCommandRequestFromCourseLesson,
} from '../../features/educationStudio/courseVideoBridge';
import { VideoCreateWizard } from '../../features/studioCommandOs/VideoCreateWizard';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsDeckTile,
  finelyOsListItem,
  finelyOsMicroStat,
} from '../../features/os/finelyOsLightUi';

type CommandStep = 'idea' | 'outline' | 'teach' | 'videos' | 'community';

const WIZARD_STEPS: Array<{ id: CommandStep; label: string }> = [
  { id: 'idea', label: '1 · Idea' },
  { id: 'outline', label: '2 · Outline' },
  { id: 'teach', label: '3 · Teach' },
  { id: 'videos', label: '4 · Videos' },
  { id: 'community', label: '5 · Publish' },
];

function cloneCourse(c: Course): Course {
  return JSON.parse(JSON.stringify(c)) as Course;
}

function normalizeTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function lessonMarkdown(lesson: CourseLesson): string {
  return lessonMarkdownFromBlocks(lesson);
}

function stepIndex(step: CommandStep): number {
  return WIZARD_STEPS.findIndex((s) => s.id === step);
}

export default function AdminCourseEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [version, setVersion] = useState(0);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [commandStep, setCommandStep] = useState<CommandStep>('idea');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const course = useMemo(() => (id ? getCourse(id) : null), [id, version]);
  const [draft, setDraft] = useState<Course | null>(course ? cloneCourse(course) : null);

  useEffect(() => {
    if (!course) return;
    setDraft(cloneCourse(course));
  }, [course?.id]);

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const activeLesson = useMemo(() => {
    if (!draft) return null;
    const mod = draft.modules.find((m) => m.id === (activeModuleId ?? draft.modules[0]?.id));
    if (!mod) return null;
    return mod.lessons.find((l) => l.id === (activeLessonId ?? mod.lessons[0]?.id)) ?? null;
  }, [activeLessonId, activeModuleId, draft]);

  const [tagsRaw, setTagsRaw] = useState('');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [agentNotice, setAgentNotice] = useState<string | null>(null);
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentPartnerId, setAgentPartnerId] = useState('');
  const [videoNotice, setVideoNotice] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardLessonId, setWizardLessonId] = useState<string | null>(null);

  const videoStyle = (draft?.studio?.productionStyle ?? 'cinematic') as VideoProductionStyle;
  const videoProvider = (draft?.studio?.videoProvider ?? 'kling') as VideoProviderId;
  const lessonScenes = useMemo(
    () => (draft?.videoScenes ?? []).filter((s) => s.lessonId === activeLesson?.id),
    [draft?.videoScenes, activeLesson?.id],
  );

  const wizardLesson = useMemo(() => {
    if (!draft || !wizardLessonId) return activeLesson;
    for (const m of draft.modules) {
      const l = m.lessons.find((x) => x.id === wizardLessonId);
      if (l) return l;
    }
    return activeLesson;
  }, [activeLesson, draft, wizardLessonId]);

  const wizardInitialRequest = useMemo(() => {
    if (!draft || !wizardLesson) return undefined;
    return videoCommandRequestFromCourseLesson({
      course: draft,
      lesson: wizardLesson,
      lessonMarkdown: lessonMarkdown(wizardLesson),
    });
  }, [draft, wizardLesson]);

  useEffect(() => {
    if (!draft) return;
    setTagsRaw((draft.tags ?? []).join(', '));
  }, [draft?.id]);

  const save = () => {
    if (!draft) return;
    setErr(null);
    const cleaned: Course = {
      ...draft,
      title: (draft.title || '').trim() || 'Untitled course',
      desc: (draft.desc || '').trim(),
      tags: normalizeTags(tagsRaw),
      studio: draft.studio,
      videoScenes: draft.videoScenes,
      modules: (draft.modules ?? []).map((m) => ({
        ...m,
        title: (m.title || '').trim() || 'Module',
        lessons: (m.lessons ?? []).map((l) => ({
          ...l,
          title: (l.title || '').trim() || 'Lesson',
          summary: (l.summary || '').trim() || undefined,
          content: (l.content ?? []).filter(Boolean).map((b: LessonContentBlock) => {
            if (b.type === 'markdown') {
              return { ...b, type: 'markdown', data: { ...(b as any).data, markdown: String((b as any)?.data?.markdown ?? '') } };
            }
            return b;
          }),
        })),
      })),
      updatedAt: nowIso(),
    };
    upsertCourse(cleaned);
    window.dispatchEvent(new Event('finely:store'));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
    setVersion((v) => v + 1);
  };

  const patchStudio = (patch: NonNullable<Course['studio']>) => {
    if (!draft) return;
    setDraft({ ...draft, studio: { ...(draft.studio ?? {}), ...patch } });
  };

  const addModule = () => {
    if (!draft) return;
    const mod: CourseModule = { id: newId('mod'), title: `Module ${draft.modules.length + 1}`, lessons: [] };
    setDraft({ ...draft, modules: [...draft.modules, mod] });
    setActiveModuleId(mod.id);
    setActiveLessonId(null);
  };

  const addLesson = (moduleId: string) => {
    if (!draft) return;
    const idx = draft.modules.findIndex((m) => m.id === moduleId);
    if (idx < 0) return;
    const mod = draft.modules[idx]!;
    const lesson: CourseLesson = {
      id: newId('lesson'),
      title: `Lesson ${mod.lessons.length + 1}`,
      summary: 'High-signal lesson.',
      content: [{ id: newId('blk'), type: 'markdown', data: { markdown: '## Lesson\n\nWrite your lesson content here.\n' } } as any],
    };
    const next = cloneCourse(draft);
    next.modules[idx] = { ...mod, lessons: [...mod.lessons, lesson] };
    setDraft(next);
    setActiveModuleId(moduleId);
    setActiveLessonId(lesson.id);
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    if (!draft) return;
    const modIdx = draft.modules.findIndex((m) => m.id === moduleId);
    if (modIdx < 0) return;
    const mod = draft.modules[modIdx]!;
    if (!window.confirm(`Delete lesson "${mod.lessons.find((l) => l.id === lessonId)?.title ?? 'this lesson'}"?`)) return;
    const next = cloneCourse(draft);
    const lessons = mod.lessons.filter((l) => l.id !== lessonId);
    next.modules[modIdx] = { ...mod, lessons };
    setDraft(next);
    if (activeLessonId === lessonId) setActiveLessonId(lessons[0]?.id ?? null);
  };

  const removeModule = (moduleId: string) => {
    if (!draft) return;
    const mod = draft.modules.find((m) => m.id === moduleId);
    if (!mod) return;
    if (!window.confirm(`Delete module "${mod.title}" and all ${mod.lessons.length} lesson(s)?`)) return;
    const next = cloneCourse(draft);
    next.modules = next.modules.filter((m) => m.id !== moduleId);
    setDraft(next);
    if (activeModuleId === moduleId) {
      const first = next.modules[0];
      setActiveModuleId(first?.id ?? null);
      setActiveLessonId(first?.lessons[0]?.id ?? null);
    }
  };

  const duplicateModule = (moduleId: string) => {
    if (!draft) return;
    const mod = draft.modules.find((m) => m.id === moduleId);
    if (!mod) return;
    const copy: CourseModule = {
      id: newId('mod'),
      title: `${mod.title} (copy)`,
      lessons: mod.lessons.map((l) => ({
        ...l,
        id: newId('lesson'),
        content: (l.content ?? []).map((b) => ({ ...b, id: newId('blk') })),
      })),
    };
    setDraft({ ...draft, modules: [...draft.modules, copy] });
    setActiveModuleId(copy.id);
    setActiveLessonId(copy.lessons[0]?.id ?? null);
  };

  const aiGenerateOutline = async () => {
    if (!draft) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await callAiGateway({
        taskType: 'course_outline',
        responseFormat: 'json',
        messages: [
          {
            role: 'system',
            content:
              'You are a course architect. Return ONLY JSON for a course outline. Schema: { modules: [{ title: string, lessons: [{ title: string, summary: string }] }] }. Keep it practical, compliance-safe, and workflow-aligned.',
          },
          {
            role: 'user',
            content: `Course title: ${draft.title}\nCourse description: ${draft.desc}\nTags: ${(draft.tags ?? []).join(', ')}`,
          },
        ],
      });
      const obj = extractFirstJsonObject(res.text);
      const modules = Array.isArray((obj as any)?.modules) ? (obj as any).modules : [];
      if (!modules.length) throw new Error('AI returned no modules.');

      const next = cloneCourse(draft);
      next.modules = modules.slice(0, 12).map((m: any, mi: number) => ({
        id: newId('mod'),
        title: String(m?.title ?? `Module ${mi + 1}`),
        lessons: Array.isArray(m?.lessons)
          ? m.lessons.slice(0, 20).map((l: any, li: number) => ({
              id: newId('lesson'),
              title: String(l?.title ?? `Lesson ${li + 1}`),
              summary: String(l?.summary ?? '').trim() || undefined,
              content: [{ id: newId('blk'), type: 'markdown', data: { markdown: `## ${String(l?.title ?? 'Lesson')}\n\n` } }],
            }))
          : [],
      }));
      setDraft(next);
      setActiveModuleId(next.modules[0]?.id ?? null);
      setActiveLessonId(next.modules[0]?.lessons[0]?.id ?? null);
      setCommandStep('outline');
    } catch (e: any) {
      setErr(e?.message || 'AI outline failed.');
    } finally {
      setBusy(false);
    }
  };

  const aiGenerateLessonScript = async () => {
    if (!draft || !activeLesson) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await callAiGateway({
        taskType: 'lesson_script',
        responseFormat: 'text',
        messages: [
          {
            role: 'system',
            content:
              'You write lesson scripts for a credit education course. Provide a structured lesson in markdown with: objectives, key points, step-by-step workflow, common mistakes, and a short checklist. Keep it compliant and non-legal-advice.',
          },
          {
            role: 'user',
            content:
              `Course: ${draft.title}\nLesson title: ${activeLesson.title}\nLesson summary: ${activeLesson.summary ?? ''}\n\nExisting content:\n${lessonMarkdown(activeLesson)}`.trim(),
          },
        ],
      });
      updateActiveLessonMarkdown(res.text.trim() || lessonMarkdown(activeLesson));
    } catch (e: any) {
      setErr(e?.message || 'AI lesson script failed.');
    } finally {
      setBusy(false);
    }
  };

  const aiGenerateStoryboard = async () => {
    if (!draft || !activeLesson) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await callAiGateway({
        taskType: 'lesson_storyboard',
        responseFormat: 'text',
        messages: [
          {
            role: 'system',
            content:
              'Generate a video storyboard in markdown. Include: hook, scenes with on-screen text, voiceover, b-roll suggestions, and CTA. Keep it practical and aligned with the lesson.',
          },
          {
            role: 'user',
            content:
              `Course: ${draft.title}\nLesson: ${activeLesson.title}\n\nLesson content:\n${lessonMarkdown(activeLesson)}`.trim(),
          },
        ],
      });
      const merged = `${lessonMarkdown(activeLesson)}\n\n---\n\n## Video storyboard\n\n${res.text.trim()}\n`.trim();
      updateActiveLessonMarkdown(merged);
    } catch (e: any) {
      setErr(e?.message || 'AI storyboard failed.');
    } finally {
      setBusy(false);
    }
  };

  const updateActiveLessonMarkdown = (md: string) => {
    if (!draft || !activeLesson) return;
    const next = cloneCourse(draft);
    for (const m of next.modules) {
      const li = m.lessons.findIndex((l) => l.id === activeLesson.id);
      if (li < 0) continue;
      const l = m.lessons[li]!;
      const existing: any[] = Array.isArray((l as any).content) ? ([...(l as any).content] as any[]) : [];
      const idx = existing.findIndex((b) => b?.type === 'markdown');
      if (idx >= 0) {
        const cur = existing[idx] ?? {};
        existing[idx] = { ...cur, type: 'markdown', data: { ...(cur?.data || {}), markdown: md } };
        m.lessons[li] = { ...l, content: existing as any };
      } else {
        m.lessons[li] = { ...l, content: [{ id: newId('blk'), type: 'markdown', data: { markdown: md } }, ...existing] as any };
      }
      break;
    }
    setDraft(next);
  };

  const narrateActiveLesson = async () => {
    if (!draft || !activeLesson) return;
    setVoiceBusy(true);
    setVoiceNotice(null);
    try {
      const res = await narrateCourseLesson({ course: draft, lesson: activeLesson });
      setVoiceNotice(res.message);
    } catch (e: unknown) {
      setVoiceNotice((e as Error)?.message ?? 'Narration failed.');
    } finally {
      setVoiceBusy(false);
    }
  };

  const runLessonAgent = async () => {
    if (!draft || !activeLesson) return;
    setAgentBusy(true);
    setAgentNotice(null);
    try {
      const res = await runCourseLessonAgent({
        course: draft,
        lesson: activeLesson,
        partnerId: agentPartnerId.trim() || undefined,
        dryRun: false,
      });
      setAgentNotice(res.summary);
    } catch (e: unknown) {
      setAgentNotice((e as Error)?.message ?? 'Lesson agent failed.');
    } finally {
      setAgentBusy(false);
    }
  };

  const openVideoWizard = (lessonId: string) => {
    setWizardLessonId(lessonId);
    setActiveLessonId(lessonId);
    for (const m of draft?.modules ?? []) {
      if (m.lessons.some((l) => l.id === lessonId)) {
        setActiveModuleId(m.id);
        break;
      }
    }
    setWizardOpen(true);
  };

  const autoProduceAllStub = () => {
    if (!draft) return;
    const pending = draft.modules.reduce((n, m) => n + m.lessons.filter((l) => !lessonHasAttachedVideo(l)).length, 0);
    setVideoNotice(
      pending
        ? `Auto-produce all (stub): ${pending} lesson(s) queued for batch pipeline. Use Produce video per lesson until batch automation ships.`
        : 'All lessons already have attached videos.',
    );
  };

  const goNext = () => {
    const idx = stepIndex(commandStep);
    if (idx < WIZARD_STEPS.length - 1) setCommandStep(WIZARD_STEPS[idx + 1]!.id);
  };

  const goPrev = () => {
    const idx = stepIndex(commandStep);
    if (idx > 0) setCommandStep(WIZARD_STEPS[idx - 1]!.id);
  };

  if (!id) {
    return <PageShell badge="Admin" title="Course not found" subtitle="No course selected." />;
  }

  if (!draft) {
    return <PageShell badge="Admin" title="Course not found" subtitle="This course does not exist." />;
  }

  const lessonCount = draft.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <PageShell badge="Admin" title="Course Command Center" subtitle={draft.title}>
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin/courses')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Courses
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate(`/portal/courses/${draft.id}`)} className={FINELY_OS_SECONDARY_BTN}>
              Preview <ArrowRight size={12} />
            </button>
            <button type="button" onClick={save} className={saved ? FINELY_OS_SUCCESS_BTN : FINELY_OS_PRIMARY_BTN}>
              {saved ? <CheckCircle2 size={14} /> : <Save size={14} />} {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className={FINELY_OS_BANNER}>
          <FinelyOsIconBadge icon={GraduationCap} accent="emerald" size={18} className="p-2.5 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
            Five-step command center: idea → outline → teach → videos → community &amp; publish. One obvious next step at each layer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {WIZARD_STEPS.map((s, idx) => {
            const active = commandStep === s.id;
            const done = stepIndex(commandStep) > idx;
            return (
              <React.Fragment key={s.id}>
                {idx > 0 ? <ChevronRight size={14} className="text-white/30 shrink-0" aria-hidden /> : null}
                <button
                  type="button"
                  onClick={() => setCommandStep(s.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-50'
                      : done
                        ? 'border-emerald-400/25 bg-emerald-500/8 text-emerald-200/80'
                        : 'border-white/12 bg-black/30 text-white/55 hover:text-white/75'
                  }`}
                >
                  {s.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}

        {commandStep === 'idea' ? (
          <FinelyOsGlassPanel icon={Sparkles} title="Step 1 — Idea" subtitle="Course concept and AI outline" accent="violet">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="md:col-span-2">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Title</div>
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={FINELY_OS_ENTITY_INPUT} />
              </label>
              <label className="md:col-span-2">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Description</div>
                <textarea value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} className={`${FINELY_OS_ENTITY_INPUT} min-h-[88px]`} rows={3} />
              </label>
              <label className="md:col-span-2">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Tags</div>
                <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="personal, disputes" />
              </label>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <button type="button" onClick={() => void aiGenerateOutline()} disabled={busy} className={`w-full sm:w-auto ${FINELY_OS_PRIMARY_BTN} justify-center py-3`}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Generate AI outline
              </button>
              <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>One click builds modules and lesson titles — then refine in Outline and Teach.</p>
            </div>
          </FinelyOsGlassPanel>
        ) : null}

        {commandStep === 'outline' ? (
          <FinelyOsGlassPanel
            icon={LayoutGrid}
            title="Step 2 — Outline"
            subtitle={`${draft.modules.length} modules · ${lessonCount} lessons`}
            accent="emerald"
            actions={
              <button type="button" onClick={addModule} className={FINELY_OS_SECONDARY_BTN}>
                <Plus size={14} /> Module
              </button>
            }
          >
            {draft.modules.length === 0 ? (
              <p className={FINELY_OS_ENTITY_BODY}>No modules yet — go to Idea and generate an AI outline, or add a module.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {draft.modules.map((m) => {
                  const moduleActive = m.id === (activeModuleId ?? draft.modules[0]?.id);
                  return (
                    <div key={m.id} className={`${finelyOsDeckTile('emerald', moduleActive)} !p-4 space-y-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <input
                          value={m.title}
                          onChange={(e) => {
                            const next = cloneCourse(draft);
                            const mi = next.modules.findIndex((x) => x.id === m.id);
                            if (mi >= 0) next.modules[mi] = { ...next.modules[mi]!, title: e.target.value };
                            setDraft(next);
                            setActiveModuleId(m.id);
                          }}
                          className={`${FINELY_OS_ENTITY_VALUE} bg-transparent border-none outline-none w-full`}
                        />
                        <div className="flex shrink-0 gap-1">
                          <button type="button" onClick={() => duplicateModule(m.id)} className="p-1 rounded border border-white/10 text-white/50 hover:text-white" title="Duplicate">
                            <Copy size={11} />
                          </button>
                          <button type="button" onClick={() => removeModule(m.id)} className="p-1 rounded border border-red-500/25 text-red-300/80" title="Delete">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {m.lessons.map((l) => {
                          const lessonActive = l.id === activeLessonId;
                          return (
                            <div key={l.id} className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveModuleId(m.id);
                                  setActiveLessonId(l.id);
                                }}
                                className={`flex-1 text-left px-2.5 py-2 rounded-xl border text-xs ${finelyOsListItem(lessonActive, 'emerald')}`}
                              >
                                <div className="truncate font-semibold">{l.title}</div>
                                {l.summary ? <div className={`truncate ${FINELY_OS_ENTITY_BODY}`}>{l.summary}</div> : null}
                              </button>
                              <button type="button" onClick={() => removeLesson(m.id, l.id)} className="p-1 rounded border border-red-500/20 text-red-300/70 shrink-0">
                                <Trash2 size={10} />
                              </button>
                            </div>
                          );
                        })}
                        <button type="button" onClick={() => addLesson(m.id)} className={`w-full ${FINELY_OS_SECONDARY_BTN} !py-1.5 justify-center text-xs`}>
                          <Plus size={12} /> Lesson
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </FinelyOsGlassPanel>
        ) : null}

        {commandStep === 'teach' ? (
          <div className="grid lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-3">
              <FinelyOsGlassPanel icon={BookOpen} title="Lessons" subtitle="Pick a lesson to edit" accent="emerald" variant="inner" headerless>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {draft.modules.map((m) => (
                    <div key={m.id} className="space-y-1">
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} px-1`}>{m.title}</div>
                      {m.lessons.map((l) => {
                        const active = l.id === activeLessonId;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setActiveModuleId(m.id);
                              setActiveLessonId(l.id);
                            }}
                            className={`${finelyOsDeckTile('violet', active)} !p-3 w-full text-left`}
                          >
                            <div className={FINELY_OS_ENTITY_VALUE}>{l.title}</div>
                            {l.summary ? <div className={`mt-1 truncate ${FINELY_OS_ENTITY_BODY}`}>{l.summary}</div> : null}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </FinelyOsGlassPanel>
            </div>
            <div className="lg:col-span-8">
              <FinelyOsGlassPanel
                icon={BookOpen}
                title={activeLesson ? activeLesson.title : 'Lesson editor'}
                subtitle="Slide-panel authoring — blocks, scripts, narration"
                accent="violet"
                actions={
                  activeLesson ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void aiGenerateLessonScript()} disabled={busy} className={FINELY_OS_SUCCESS_BTN}>
                        <Sparkles size={14} /> Script
                      </button>
                      <button type="button" onClick={() => void narrateActiveLesson()} disabled={voiceBusy} className={FINELY_OS_SECONDARY_BTN}>
                        {voiceBusy ? <Loader2 size={14} className="animate-spin" /> : <Headphones size={14} />} Narrate
                      </button>
                    </div>
                  ) : null
                }
              >
                {!activeLesson ? (
                  <p className={FINELY_OS_ENTITY_BODY}>Select a lesson from the panel.</p>
                ) : (
                  <div className="space-y-4">
                    {agentNotice || voiceNotice ? (
                      <div className={FINELY_OS_BANNER}>{agentNotice ?? voiceNotice}</div>
                    ) : null}
                    <div className="grid md:grid-cols-2 gap-3">
                      <label className="md:col-span-2">
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Lesson title</div>
                        <input
                          value={activeLesson.title}
                          onChange={(e) => {
                            const next = cloneCourse(draft);
                            for (const mod of next.modules) {
                              const li = mod.lessons.findIndex((l) => l.id === activeLesson.id);
                              if (li >= 0) mod.lessons[li] = { ...mod.lessons[li]!, title: e.target.value };
                            }
                            setDraft(next);
                          }}
                          className={FINELY_OS_ENTITY_INPUT}
                        />
                      </label>
                      <label className="md:col-span-2">
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Summary</div>
                        <input
                          value={activeLesson.summary ?? ''}
                          onChange={(e) => {
                            const next = cloneCourse(draft);
                            for (const mod of next.modules) {
                              const li = mod.lessons.findIndex((l) => l.id === activeLesson.id);
                              if (li >= 0) mod.lessons[li] = { ...mod.lessons[li]!, summary: e.target.value || undefined };
                            }
                            setDraft(next);
                          }}
                          className={FINELY_OS_ENTITY_INPUT}
                        />
                      </label>
                    </div>
                    <LessonBlockEditor
                      value={activeLesson.content as any}
                      onChange={(blocks) => {
                        const next = cloneCourse(draft);
                        for (const mod of next.modules) {
                          const li = mod.lessons.findIndex((l) => l.id === activeLesson.id);
                          if (li >= 0) mod.lessons[li] = { ...mod.lessons[li]!, content: blocks as any };
                        }
                        setDraft(next);
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void runLessonAgent()} disabled={agentBusy} className={FINELY_OS_SECONDARY_BTN}>
                        Run lesson agent
                      </button>
                      <input
                        value={agentPartnerId}
                        onChange={(e) => setAgentPartnerId(e.target.value)}
                        className={`${FINELY_OS_ENTITY_INPUT} max-w-xs`}
                        placeholder="Partner ID (optional)"
                      />
                    </div>
                  </div>
                )}
              </FinelyOsGlassPanel>
            </div>
          </div>
        ) : null}

        {commandStep === 'videos' ? (
          <div className="space-y-4">
            {videoNotice ? <div className={`${FINELY_OS_BANNER} text-sm`}>{videoNotice}</div> : null}
            <FinelyOsGlassPanel
              icon={Clapperboard}
              title="Step 4 — Videos"
              subtitle="Produce lesson videos via VideoCreateWizard"
              accent="fuchsia"
              actions={
                <button type="button" onClick={autoProduceAllStub} className={FINELY_OS_SECONDARY_BTN}>
                  <Wand2 size={14} /> Auto-produce all (stub)
                </button>
              }
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {draft.modules.flatMap((m) =>
                  m.lessons.map((l) => {
                    const sceneCount = countLessonScenesForLesson(draft, l.id);
                    const stage = inferLessonVideoStage({ lesson: l, sceneCount });
                    const hasVideo = lessonHasAttachedVideo(l);
                    const active = l.id === activeLessonId;
                    return (
                      <div key={l.id} className={`${finelyOsDeckTile('fuchsia', active)} !p-3 space-y-2`}>
                        <div className="min-w-0">
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{l.title}</div>
                          <div className={`${FINELY_OS_ENTITY_SUBLABEL} truncate`}>{m.title}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={finelyOsMicroStat(hasVideo ? 'emerald' : 'fuchsia')}>{hasVideo ? 'Attached' : stage}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openVideoWizard(l.id)}
                          className={`w-full ${FINELY_OS_PRIMARY_BTN} justify-center !py-2 text-xs`}
                        >
                          <Clapperboard size={12} /> Produce video
                        </button>
                      </div>
                    );
                  }),
                )}
              </div>
            </FinelyOsGlassPanel>
            <CourseVideoProductionCommand
              courseId={draft.id}
              course={draft}
              lesson={activeLesson}
              lessonMarkdown={activeLesson ? lessonMarkdown(activeLesson) : ''}
              style={videoStyle}
              provider={videoProvider}
              onStyleChange={(s) => setDraft({ ...draft, studio: { ...(draft.studio ?? {}), productionStyle: s } })}
              onProviderChange={(p) => setDraft({ ...draft, studio: { ...(draft.studio ?? {}), videoProvider: p } })}
              scenes={lessonScenes}
              onScenesChange={(scenes: VideoScenePlan[]) => {
                const other = (draft.videoScenes ?? []).filter((s) => s.lessonId !== activeLesson?.id);
                setDraft({ ...draft, videoScenes: [...other, ...scenes] });
              }}
              onGenerateScript={aiGenerateLessonScript}
              onGenerateStoryboard={aiGenerateStoryboard}
              busy={busy}
              onLessonSelect={(lessonId) => {
                setActiveLessonId(lessonId);
                for (const m of draft.modules) {
                  if (m.lessons.some((l) => l.id === lessonId)) {
                    setActiveModuleId(m.id);
                    break;
                  }
                }
              }}
            />
          </div>
        ) : null}

        {commandStep === 'community' ? (
          <div className="grid lg:grid-cols-2 gap-4">
            <FinelyOsGlassPanel icon={Users} title="Step 5 — Community & cohort" subtitle="Learner cohort settings" accent="sky">
              <div className="space-y-4">
                <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <input
                    type="checkbox"
                    checked={Boolean(draft.studio?.communityEnabled)}
                    onChange={(e) => patchStudio({ communityEnabled: e.target.checked })}
                    className="accent-sky-600"
                  />
                  Enable community tab for partners
                </label>
                <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <input
                    type="checkbox"
                    checked={Boolean(draft.studio?.cohortEnabled)}
                    onChange={(e) => patchStudio({ cohortEnabled: e.target.checked })}
                    className="accent-sky-600"
                  />
                  Cohort enrollment (limited seats)
                </label>
                <label>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Max cohort size</div>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={draft.studio?.cohortMaxSize ?? ''}
                    onChange={(e) => patchStudio({ cohortMaxSize: e.target.value ? Number(e.target.value) : undefined })}
                    className={FINELY_OS_ENTITY_INPUT}
                    placeholder="50"
                  />
                </label>
                <label>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Cohort start date</div>
                  <input
                    type="date"
                    value={draft.studio?.cohortStartDate?.slice(0, 10) ?? ''}
                    onChange={(e) => patchStudio({ cohortStartDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined })}
                    className={FINELY_OS_ENTITY_INPUT}
                  />
                </label>
                <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} className="accent-emerald-600" />
                  Published — visible in partner portal
                </label>
              </div>
            </FinelyOsGlassPanel>
            <FinelyOsGlassPanel icon={CheckCircle2} title="Publish checklist" accent="amber" variant="inner" headerless>
              <CoursePublishChecklist course={draft} />
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate(`/portal/courses/${draft.id}`)} className={FINELY_OS_PRIMARY_BTN}>
                  Open portal preview
                </button>
                <button type="button" onClick={save} className={FINELY_OS_SECONDARY_BTN}>
                  Save &amp; publish settings
                </button>
              </div>
            </FinelyOsGlassPanel>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
          <button type="button" onClick={goPrev} disabled={commandStep === 'idea'} className={FINELY_OS_SECONDARY_BTN}>
            <ArrowLeft size={14} /> Back
          </button>
          <button type="button" onClick={goNext} disabled={commandStep === 'community'} className={FINELY_OS_PRIMARY_BTN}>
            Next <ArrowRight size={14} />
          </button>
        </div>

        <FinelyOsPageFooter variant="hidden" />
      </div>

      <VideoCreateWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        presetId="guide_promo"
        initialRequest={wizardInitialRequest}
        onExportComplete={({ blobRef, filename }) => {
          if (!draft || !wizardLesson) return;
          const next = attachBlobToCourseLesson({
            course: draft,
            lessonId: wizardLesson.id,
            blobRef,
            title: `${wizardLesson.title} — lesson video`,
            summary: filename,
          });
          setDraft(cloneCourse(next));
          setVideoNotice(`Video attached to "${wizardLesson.title}".`);
          window.dispatchEvent(new Event('finely:store'));
          setVersion((v) => v + 1);
        }}
        onExported={() => setVersion((v) => v + 1)}
      />
    </PageShell>
  );
}
