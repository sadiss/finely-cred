import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Layers, Plus, Search, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { createCourse, deleteCourse, listAllCourses, upsertCourse } from '../../data/coursesRepo';
import { createCourseFromTemplate, createCourseTemplateFromCourse, listCourseTemplates } from '../../data/courseTemplatesRepo';

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [q, setQ] = useState('');
  const [tplOpen, setTplOpen] = useState(false);
  const [tplQuery, setTplQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(t);
  }, [notice]);

  const courses = useMemo(() => {
    const all = listAllCourses();
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter((c) => `${c.title} ${c.desc} ${(c.tags ?? []).join(' ')} ${c.id}`.toLowerCase().includes(query));
  }, [q, version]);

  const templates = useMemo(() => {
    const all = listCourseTemplates();
    const query = tplQuery.trim().toLowerCase();
    if (!query) return all;
    return all.filter((t) => `${t.title} ${t.description} ${t.category} ${t.tags.join(' ')} ${t.id}`.toLowerCase().includes(query));
  }, [tplQuery, tplOpen]);

  return (
    <PageShell badge="Admin" title="Courses" subtitle="Create, edit, publish, and launch courses (Course Builder).">
      <div className="space-y-6">
        {notice ? (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100 text-sm">
            {notice}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTplOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
              title="Create from a template"
            >
              <Layers size={14} /> From template
            </button>
            <button
              type="button"
              onClick={() => {
                const c = createCourse({ title: 'New course' });
                window.dispatchEvent(new Event('finely:store'));
                navigate(`/admin/courses/${c.id}`);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              <Plus size={14} /> New course
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white/70">
              <Search size={16} className="text-white/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search courses…"
                className="w-[360px] max-w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{courses.length} courses</div>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">No courses yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div key={c.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 text-amber-400">
                      <BookOpen size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">{c.published ? 'Published' : 'Draft'}</span>
                    </div>
                    <div className="mt-2 text-white font-semibold truncate">{c.title}</div>
                    <div className="mt-1 text-white/60 text-sm line-clamp-2">{c.desc}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                      {c.id} • modules:{c.modules.length}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/courses/${c.id}`)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black hover:brightness-110 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Edit <ArrowRight size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        createCourseTemplateFromCourse({ courseId: c.id, category: 'general' });
                        window.dispatchEvent(new Event('finely:store'));
                        setNotice('Saved as template.');
                        setTplOpen(true);
                      } catch (e: any) {
                        setNotice(e?.message || 'Could not save as template.');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    title="Save this course as a reusable template"
                  >
                    Template <ArrowRight size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      upsertCourse({ ...c, published: !c.published });
                      window.dispatchEvent(new Event('finely:store'));
                      setVersion((v) => v + 1);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  >
                    {c.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteCourse(c.id);
                      window.dispatchEvent(new Event('finely:store'));
                      setVersion((v) => v + 1);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/15 transition-all"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tplOpen ? (
          <div className="fixed inset-0 z-[80]">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={() => setTplOpen(false)} />
            <div className="absolute inset-x-0 top-[8vh] mx-auto w-[min(1100px,calc(100vw-24px))] rounded-3xl border border-white/10 bg-[#0b1110]/90 backdrop-blur-xl shadow-2xl">
              <div className="p-6 border-b border-white/10 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Course templates</div>
                  <div className="mt-1 text-white font-semibold">Create from a preset (30+)</div>
                  <div className="mt-1 text-white/60 text-sm">Choose a template to generate a new draft course you can edit immediately.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setTplOpen(false)}
                  className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[76vh] overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white/70">
                    <Search size={16} className="text-white/40" />
                    <input
                      value={tplQuery}
                      onChange={(e) => setTplQuery(e.target.value)}
                      placeholder="Search templates…"
                      className="w-[420px] max-w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{templates.length} templates</div>
                </div>

                {templates.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">No templates match your search.</div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {templates.map((t) => (
                      <div key={t.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                        <div className="inline-flex items-center gap-2 text-amber-400">
                          <Layers size={16} />
                          <span className="text-xs font-semibold uppercase tracking-wider">{t.category.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="text-white font-semibold">{t.title}</div>
                        <div className="text-white/60 text-sm line-clamp-3">{t.description}</div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                          modules:{t.blueprint.modules.length} • tags:{t.tags.length}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const c = createCourseFromTemplate({ templateId: t.id });
                              window.dispatchEvent(new Event('finely:store'));
                              setTplOpen(false);
                              navigate(`/admin/courses/${c.id}`);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                          >
                            Use template <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}

