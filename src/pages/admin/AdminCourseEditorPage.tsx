import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, BookOpen, CheckCircle2, Copy, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { getCourse, upsertCourse } from '../../data/coursesRepo';
import type { Course, CourseLesson, CourseModule, LessonContentBlock } from '../../domain/courses';
import { nowIso } from '../../domain/courses';
import { newId } from '../../utils/ids';
import { callAiGateway } from '../../lib/aiClient';
import { extractFirstJsonObject } from '../../utils/jsonExtract';
import { LessonBlockEditor } from '../../components/courses/LessonBlockEditor';

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

  if (!id) {
    return <PageShell badge="Admin" title="Course not found" subtitle="No course selected." />;
  }

  if (!draft) {
    return <PageShell badge="Admin" title="Course not found" subtitle="This course does not exist." />;
  }

  return (
    <PageShell badge="Admin" title="Course Builder" subtitle="Edit modules, lessons, and generate scripts/storyboards with AI.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin/courses')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Courses
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                saved ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500 text-black hover:brightness-110'
              }`}
            >
              {saved ? <CheckCircle2 size={14} /> : <Save size={14} />} {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {err && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100 text-sm">{err}</div>}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <BookOpen size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Modules</span>
              </div>
              <button
                type="button"
                onClick={addModule}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/15 transition-all"
              >
                <Plus size={14} /> Module
              </button>
            </div>

            <div className="space-y-3">
              {draft.modules.map((m) => {
                const active = m.id === (activeModuleId ?? draft.modules[0]?.id);
                return (
                  <div key={m.id} className={`rounded-2xl border p-4 ${active ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-white/[0.02]'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModuleId(m.id);
                        setActiveLessonId(m.lessons[0]?.id ?? null);
                      }}
                      className="w-full text-left"
                    >
                      <div className="text-white font-semibold truncate">{m.title}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        lessons: {m.lessons.length}
                      </div>
                    </button>

                    <div className="mt-3 space-y-1">
                      {m.lessons.map((l) => {
                        const isActiveLesson = l.id === (activeLessonId ?? m.lessons[0]?.id);
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setActiveModuleId(m.id);
                              setActiveLessonId(l.id);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl border text-[11px] transition-all ${
                              isActiveLesson
                                ? 'border-white/10 bg-black/30 text-white'
                                : 'border-white/10 bg-white/[0.01] text-white/60 hover:bg-white/[0.04]'
                            }`}
                          >
                            {l.title}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => addLesson(m.id)}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 text-[10px] font-black uppercase tracking-widest"
                      >
                        <Plus size={14} /> Add lesson
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40">AI tools</div>
              <button
                type="button"
                onClick={aiGenerateOutline}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
              >
                <Sparkles size={14} /> Generate outline
              </button>
              <div className="text-white/45 text-xs">
                Uses AI Gateway. If disabled, enable `aiGateway` in Admin Settings → Features.
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Course metadata</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block md:col-span-2">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Title</div>
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Description</div>
                    <textarea
                      value={draft.desc}
                      onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors min-h-[90px]"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tags (comma separated)</div>
                    <input
                      value={tagsRaw}
                      onChange={(e) => setTagsRaw(e.target.value)}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="personal, disputes"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                    <input
                      type="checkbox"
                      checked={draft.published}
                      onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                      className="accent-amber-500"
                    />
                    Published
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <Bot size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Lesson editor</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={aiGenerateLessonScript}
                    disabled={busy || !activeLesson}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
                  >
                    <Sparkles size={14} /> Script
                  </button>
                  <button
                    type="button"
                    onClick={aiGenerateStoryboard}
                    disabled={busy || !activeLesson}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60"
                  >
                    <Bot size={14} /> Storyboard
                  </button>
                </div>
              </div>

              {!activeLesson ? (
                <div className="text-white/60 text-sm">Select a lesson to edit.</div>
              ) : (
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="block md:col-span-2">
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Lesson title</div>
                      <input
                        value={activeLesson.title}
                        onChange={(e) => {
                          if (!draft) return;
                          const next = cloneCourse(draft);
                          for (const m of next.modules) {
                            const li = m.lessons.findIndex((l) => l.id === activeLesson.id);
                            if (li >= 0) m.lessons[li] = { ...m.lessons[li]!, title: e.target.value };
                          }
                          setDraft(next);
                        }}
                        className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Lesson summary</div>
                      <input
                        value={activeLesson.summary ?? ''}
                        onChange={(e) => {
                          if (!draft) return;
                          const next = cloneCourse(draft);
                          for (const m of next.modules) {
                            const li = m.lessons.findIndex((l) => l.id === activeLesson.id);
                            if (li >= 0) m.lessons[li] = { ...m.lessons[li]!, summary: e.target.value || undefined };
                          }
                          setDraft(next);
                        }}
                        className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </label>

                    <label className="block">
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Drip (days)</div>
                      <input
                        type="number"
                        min={0}
                        value={String((activeLesson as any).dripDays ?? '')}
                        onChange={(e) => {
                          if (!draft) return;
                          const raw = e.target.value;
                          const dripDays = raw === '' ? undefined : Math.max(0, Math.round(Number(raw) || 0));
                          const next = cloneCourse(draft);
                          for (const m of next.modules) {
                            const li = m.lessons.findIndex((l) => l.id === activeLesson.id);
                            if (li >= 0) m.lessons[li] = { ...m.lessons[li]!, dripDays };
                          }
                          setDraft(next);
                        }}
                        className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="0"
                      />
                      <div className="mt-1 text-white/40 text-xs">Unlocks N days after enrollment (leave blank for immediate).</div>
                    </label>

                    <label className="block">
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Prerequisites</div>
                      <select
                        multiple
                        value={Array.isArray((activeLesson as any).prereqLessonIds) ? (activeLesson as any).prereqLessonIds : []}
                        onChange={(e) => {
                          if (!draft) return;
                          const selected = Array.from(e.target.selectedOptions).map((o) => o.value).filter(Boolean);
                          const prereqLessonIds = selected.length ? selected : undefined;
                          const next = cloneCourse(draft);
                          for (const m of next.modules) {
                            const li = m.lessons.findIndex((l) => l.id === activeLesson.id);
                            if (li >= 0) m.lessons[li] = { ...m.lessons[li]!, prereqLessonIds };
                          }
                          setDraft(next);
                        }}
                        className="mt-2 w-full min-h-[120px] bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        title="Select prerequisite lessons"
                      >
                        {allLessonsFlat
                          .filter((x) => x.id !== activeLesson.id)
                          .map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.title} ({x.id.slice(0, 6)})
                            </option>
                          ))}
                      </select>
                      <div className="mt-1 text-white/40 text-xs">Hold Ctrl/Cmd to select multiple lessons.</div>
                    </label>
                  </div>

                  <label className="block">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Lesson blocks</div>
                    <div className="mt-2">
                      <LessonBlockEditor
                        value={activeLesson.content as any}
                        onChange={(blocks) => {
                          if (!draft) return;
                          const next = cloneCourse(draft);
                          for (const m of next.modules) {
                            const li = m.lessons.findIndex((l) => l.id === activeLesson.id);
                            if (li >= 0) m.lessons[li] = { ...m.lessons[li]!, content: blocks as any };
                          }
                          setDraft(next);
                        }}
                      />
                    </div>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeLesson) return;
                        navigator.clipboard?.writeText(lessonMarkdown(activeLesson));
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    >
                      <Copy size={14} /> Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/portal/courses/${draft.id}`)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                      Preview in portal <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-white/50 text-xs">
              Note: Video generation APIs aren’t wired yet; the “Video storyboard” tool generates structured assets (scenes, VO, on-screen text)
              you can hand to your video pipeline. Next step is connecting a real video provider.
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

