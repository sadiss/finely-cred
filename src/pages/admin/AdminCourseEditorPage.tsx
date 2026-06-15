import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, BookOpen, CheckCircle2, Clapperboard, Copy, Headphones, LayoutGrid, Loader2, Plus, Save, Sparkles, Trash2, GraduationCap } from 'lucide-react';
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
import { CourseIntelligencePanel } from '../../features/educationStudio/CourseIntelligencePanel';
import { VideoProductionPanel } from '../../features/educationStudio/VideoProductionPanel';
import { narrateAllCourseLessons, narrateCourseLesson } from '../../lib/courseVoiceNarrate';
import { runCourseLessonAgent } from '../../lib/courseLessonAgent';
import { getVoiceStudioStatus } from '../../lib/voiceStudioClient';
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
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

type StudioTab = 'curriculum' | 'authoring' | 'video' | 'experience';

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
  const md = lesson.content
    .filter((b) => b.type === 'markdown')
    .map((b) => String((b as any)?.data?.markdown ?? ''))
    .join('\n\n')
    .trim();
  return md || '';
}

export default function AdminCourseEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [version, setVersion] = useState(0);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    const lesson = mod.lessons.find((l) => l.id === (activeLessonId ?? mod.lessons[0]?.id)) ?? null;
    return lesson;
  }, [activeLessonId, activeModuleId, draft]);
  const allLessonsFlat = useMemo(() => {
    if (!draft) return [] as Array<{ id: string; title: string }>;
    const out: Array<{ id: string; title: string }> = [];
    for (const m of draft.modules ?? []) for (const l of m.lessons ?? []) out.push({ id: l.id, title: l.title });
    return out;
  }, [draft]);

  const [tagsRaw, setTagsRaw] = useState('');
  const [studioTab, setStudioTab] = useState<StudioTab>('curriculum');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [agentNotice, setAgentNotice] = useState<string | null>(null);
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentPartnerId, setAgentPartnerId] = useState('');
  const voiceStudio = useMemo(() => getVoiceStudioStatus(), []);
  const videoStyle = (draft?.studio?.productionStyle ?? 'cinematic') as VideoProductionStyle;
  const videoProvider = (draft?.studio?.videoProvider ?? 'kling') as VideoProviderId;
  const lessonScenes = useMemo(
    () => (draft?.videoScenes ?? []).filter((s) => s.lessonId === activeLesson?.id),
    [draft?.videoScenes, activeLesson?.id],
  );
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
    if (activeLessonId === lessonId) {
      setActiveLessonId(lessons[0]?.id ?? null);
    }
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

  const narrateEntireCourse = async () => {
    if (!draft) return;
    setVoiceBusy(true);
    setVoiceNotice(null);
    try {
      const res = await narrateAllCourseLessons({
        course: draft,
        onProgress: (done, total, title) => setVoiceNotice(`Rendering ${done}/${total}: ${title}`),
      });
      setVoiceNotice(`Done — ${res.ok} rendered, ${res.failed} failed.`);
    } catch (e: unknown) {
      setVoiceNotice((e as Error)?.message ?? 'Bulk narration failed.');
    } finally {
      setVoiceBusy(false);
    }
  };

  const runLessonAgent = async (dryRun = false) => {
    if (!draft || !activeLesson) return;
    setAgentBusy(true);
    setAgentNotice(null);
    try {
      const res = await runCourseLessonAgent({
        course: draft,
        lesson: activeLesson,
        partnerId: agentPartnerId.trim() || undefined,
        dryRun,
      });
      setAgentNotice(res.summary);
    } catch (e: unknown) {
      setAgentNotice((e as Error)?.message ?? 'Lesson agent failed.');
    } finally {
      setAgentBusy(false);
    }
  };

  if (!id) {
    return <PageShell badge="Admin" title="Course not found" subtitle="No course selected." />;
  }

  if (!draft) {
    return <PageShell badge="Admin" title="Course not found" subtitle="This course does not exist." />;
  }

  return (
    <PageShell badge="Admin" title="AI Education Studio" subtitle={draft.title}>
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin/courses')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Education Studio
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(`/portal/courses/${draft.id}`)}
              className={FINELY_OS_SECONDARY_BTN}
            >
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
            Five-engine studio: curriculum, authoring, video production, multimedia blocks, and learner experience — edit each layer without rebuilding manually.
          </p>
        </div>

        <div className={FINELY_OS_VIEW_TABS}>
          {(
            [
              ['curriculum', LayoutGrid, 'Curriculum'],
              ['authoring', BookOpen, 'Authoring'],
              ['video', Clapperboard, 'Video'],
              ['experience', GraduationCap, 'Experience'],
            ] as const
          ).map(([tab, Icon, label]) => (
            <button key={tab} type="button" onClick={() => setStudioTab(tab)} className={finelyOsViewTab(studioTab === tab, tab === 'video' ? 'fuchsia' : 'emerald')}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <FinelyOsGlassPanel icon={BookOpen} title="Curriculum tree" subtitle="Modules and lessons" accent="emerald" variant="inner" actions={
              <button type="button" onClick={addModule} className={FINELY_OS_SECONDARY_BTN}><Plus size={14} /> Module</button>
            }>
              <div className="space-y-3">
                {draft.modules.map((m) => {
                  const active = m.id === (activeModuleId ?? draft.modules[0]?.id);
                  return (
                    <div key={m.id} className={finelyOsListItem(active, 'emerald')}>
                      <div className="flex items-start gap-2">
                        <button type="button" onClick={() => { setActiveModuleId(m.id); setActiveLessonId(m.lessons[0]?.id ?? null); }} className="flex-1 text-left min-w-0">
                          <div className={FINELY_OS_ENTITY_VALUE}>{m.title}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>lessons: {m.lessons.length}</div>
                        </button>
                        <div className="flex shrink-0 gap-1">
                          <button type="button" onClick={() => duplicateModule(m.id)} className="p-1.5 rounded-lg border border-white/[0.08] text-white/50 hover:text-white" title="Duplicate module"><Copy size={12} /></button>
                          <button type="button" onClick={() => removeModule(m.id)} className="p-1.5 rounded-lg border border-red-500/25 text-red-300/80 hover:bg-red-500/10" title="Delete module"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {m.lessons.map((l) => {
                          const isActiveLesson = l.id === (activeLessonId ?? m.lessons[0]?.id);
                          return (
                            <div key={l.id} className="flex items-center gap-1">
                              <button type="button" onClick={() => { setActiveModuleId(m.id); setActiveLessonId(l.id); }} className={`flex-1 text-left px-3 py-2 rounded-xl border text-xs transition-all ${finelyOsListItem(isActiveLesson, 'emerald')}`}>
                                {l.title}
                              </button>
                              <button type="button" onClick={() => removeLesson(m.id, l.id)} className="p-1.5 rounded-lg border border-red-500/20 text-red-300/70 hover:bg-red-500/10 shrink-0" title="Delete lesson"><Trash2 size={11} /></button>
                            </div>
                          );
                        })}
                        <button type="button" onClick={() => addLesson(m.id)} className={`w-full ${FINELY_OS_SECONDARY_BTN} justify-center`}><Plus size={14} /> Lesson</button>
                      </div>
                    </div>
                  );
                })}
                {draft.modules.length === 0 ? (
                  <p className={`text-xs ${FINELY_OS_ENTITY_BODY} py-2`}>No modules yet — add one or generate an AI outline.</p>
                ) : null}
              </div>
            </FinelyOsGlassPanel>

            <FinelyOsGlassPanel icon={Sparkles} title="Curriculum engine" subtitle="AI outline for this course" accent="violet" variant="inner">
              <button type="button" onClick={aiGenerateOutline} disabled={busy} className={`w-full ${FINELY_OS_PRIMARY_BTN} justify-center py-3`}>
                <Sparkles size={14} /> Generate outline
              </button>
            </FinelyOsGlassPanel>

            <FinelyOsGlassPanel icon={CheckCircle2} title="Publish readiness" accent="amber" variant="inner" headerless>
              <CoursePublishChecklist course={draft} />
            </FinelyOsGlassPanel>

            <CourseIntelligencePanel
              course={draft}
              onApplyCourse={(next) => {
                setDraft(next);
                setTagsRaw((next.tags ?? []).join(', '));
              }}
              onRunBulkNarration={async () => {
                setBusy(true);
                try {
                  await narrateAllCourseLessons({ course: draft });
                } finally {
                  setBusy(false);
                }
              }}
              bulkBusy={busy}
            />
          </div>

          <div className="lg:col-span-8 space-y-4">
            {(studioTab === 'curriculum' || studioTab === 'authoring') && (
              <FinelyOsGlassPanel icon={BookOpen} title="Course metadata" accent="violet">
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="md:col-span-2">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Title</div>
                    <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={FINELY_OS_ENTITY_INPUT} />
                  </label>
                  <label className="md:col-span-2">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Description</div>
                    <textarea value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} className={`${FINELY_OS_ENTITY_INPUT} min-h-[90px]`} />
                  </label>
                  <label className="md:col-span-2">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Tags</div>
                    <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="personal, disputes" />
                  </label>
                  <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} className="accent-violet-600" />
                    Published
                  </label>
                </div>
                {draft.studio?.learningObjectives?.length ? (
                  <div className="mt-4">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Learning objectives</div>
                    <ul className={`mt-2 space-y-1 ${FINELY_OS_ENTITY_BODY}`}>
                      {draft.studio.learningObjectives.map((o) => <li key={o}>• {o}</li>)}
                    </ul>
                  </div>
                ) : null}
              </FinelyOsGlassPanel>
            )}

            {studioTab === 'authoring' && (
              <FinelyOsGlassPanel icon={Bot} title="Lesson authoring" subtitle="Blocks, scripts, quizzes" accent="emerald" actions={
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={aiGenerateLessonScript} disabled={busy || !activeLesson} className={FINELY_OS_SUCCESS_BTN}><Sparkles size={14} /> Script</button>
                  <button type="button" onClick={aiGenerateStoryboard} disabled={busy || !activeLesson} className={FINELY_OS_SECONDARY_BTN}><Bot size={14} /> Storyboard</button>
                  <button type="button" onClick={() => void narrateActiveLesson()} disabled={voiceBusy || !activeLesson} className={FINELY_OS_SECONDARY_BTN}>
                    {voiceBusy ? <Loader2 size={14} className="animate-spin" /> : <Headphones size={14} />} Narrate lesson
                  </button>
                  <button type="button" onClick={() => void runLessonAgent(false)} disabled={agentBusy || !activeLesson} className={FINELY_OS_PRIMARY_BTN}>
                    {agentBusy ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />} Run lesson agent
                  </button>
                </div>
              }>
                {!activeLesson ? (
                  <p className={FINELY_OS_ENTITY_BODY}>Select a lesson from the curriculum tree.</p>
                ) : (
                  <div className="space-y-4">
                    {agentNotice ? <div className={FINELY_OS_BANNER}>{agentNotice}</div> : null}
                    <label>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Optional partner ID — creates Work OS checklist tasks</div>
                      <input value={agentPartnerId} onChange={(e) => setAgentPartnerId(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="partner_… (leave blank for narrate + event only)" />
                    </label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="md:col-span-2">
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Lesson title</div>
                        <input value={activeLesson.title} onChange={(e) => {
                          if (!draft) return;
                          const next = cloneCourse(draft);
                          for (const m of next.modules) {
                            const li = m.lessons.findIndex((l) => l.id === activeLesson.id);
                            if (li >= 0) m.lessons[li] = { ...m.lessons[li]!, title: e.target.value };
                          }
                          setDraft(next);
                        }} className={FINELY_OS_ENTITY_INPUT} />
                      </label>
                      <label className="md:col-span-2">
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Summary</div>
                        <input value={activeLesson.summary ?? ''} onChange={(e) => {
                          if (!draft) return;
                          const next = cloneCourse(draft);
                          for (const m of next.modules) {
                            const li = m.lessons.findIndex((l) => l.id === activeLesson.id);
                            if (li >= 0) m.lessons[li] = { ...m.lessons[li]!, summary: e.target.value || undefined };
                          }
                          setDraft(next);
                        }} className={FINELY_OS_ENTITY_INPUT} />
                      </label>
                    </div>
                    <LessonBlockEditor value={activeLesson.content as any} onChange={(blocks) => {
                      if (!draft) return;
                      const next = cloneCourse(draft);
                      for (const m of next.modules) {
                        const li = m.lessons.findIndex((l) => l.id === activeLesson.id);
                        if (li >= 0) m.lessons[li] = { ...m.lessons[li]!, content: blocks as any };
                      }
                      setDraft(next);
                    }} />
                    <button type="button" onClick={() => activeLesson && navigator.clipboard?.writeText(lessonMarkdown(activeLesson))} className={FINELY_OS_SECONDARY_BTN}><Copy size={14} /> Copy markdown</button>
                  </div>
                )}
              </FinelyOsGlassPanel>
            )}

            {studioTab === 'video' && (
              <>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigate('/admin/media-studio')} className={FINELY_OS_SECONDARY_BTN}>
                    <Clapperboard size={14} /> Media Studio assets
                  </button>
                  <button type="button" onClick={() => navigate('/admin/voice-studio')} className={FINELY_OS_SECONDARY_BTN}>
                    <Headphones size={14} /> Voice Studio narration
                  </button>
                </div>
                <VideoProductionPanel
                courseTitle={draft.title}
                lesson={activeLesson}
                lessonMarkdown={activeLesson ? lessonMarkdown(activeLesson) : ''}
                style={videoStyle}
                provider={videoProvider}
                onStyleChange={(s) => setDraft({ ...draft, studio: { ...(draft.studio ?? {}), productionStyle: s } })}
                onProviderChange={(p) => setDraft({ ...draft, studio: { ...(draft.studio ?? {}), videoProvider: p } })}
                scenes={lessonScenes}
                onScenesChange={(scenes) => {
                  const other = (draft.videoScenes ?? []).filter((s) => s.lessonId !== activeLesson?.id);
                  setDraft({ ...draft, videoScenes: [...other, ...scenes] });
                }}
              />
              </>
            )}

            {studioTab === 'experience' && (
              <FinelyOsGlassPanel icon={GraduationCap} title="Learning experience" subtitle="Portal player, progress, certificates" accent="sky">
                <p className={FINELY_OS_ENTITY_BODY}>
                  Learners access published courses in the portal player with drip schedules, prerequisites, quizzes, and certificate issuance on completion.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigate(`/portal/courses/${draft.id}`)} className={FINELY_OS_PRIMARY_BTN}>Open portal preview</button>
                  <button type="button" onClick={() => void narrateEntireCourse()} disabled={voiceBusy} className={FINELY_OS_SECONDARY_BTN}>
                    {voiceBusy ? <Loader2 size={14} className="animate-spin" /> : <Headphones size={14} />} Narrate all lessons
                  </button>
                </div>
                {voiceNotice ? <p className={`mt-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>{voiceNotice}</p> : null}
                {!voiceStudio.available ? (
                  <p className={`mt-2 text-xs text-amber-200/80 ${FINELY_OS_ENTITY_BODY}`}>{voiceStudio.reason ?? 'Voice Studio unavailable — browser preview only in dev.'}</p>
                ) : null}
                {draft.studio?.marketingHeadline ? (
                  <div className={`mt-4 ${finelyOsInlineListItem()} !p-4`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Marketing headline</div>
                    <div className={FINELY_OS_ENTITY_VALUE}>{draft.studio.marketingHeadline}</div>
                    {draft.studio.marketingSummary ? <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{draft.studio.marketingSummary}</p> : null}
                  </div>
                ) : null}
              </FinelyOsGlassPanel>
            )}
          </div>
        </div>

        <FinelyOsPageFooter variant="hidden" />
      </div>
    </PageShell>
  );
}

