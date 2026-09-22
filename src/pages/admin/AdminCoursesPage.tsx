import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { createCourse, deleteCourse, listAllCourses, upsertCourse } from '../../data/coursesRepo';
import { createCourseFromTemplate, listCourseTemplates } from '../../data/courseTemplatesRepo';
import { FinelyOsCatalogBrowser, type FinelyOsCatalogItem } from '../../features/os/FinelyOsCatalogBrowser';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import { FinelyOsIconBadge } from '../../features/os/FinelyOsIconBadge';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { EDUCATION_AGENTS, EDUCATION_ENGINES } from '../../features/educationStudio/educationStudioModel';
import { generateCourseFromPrompt } from '../../features/educationStudio/educationStudioPipeline';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { nowIso } from '../../domain/courses';
import { newId } from '../../utils/ids';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import type { CourseLevel } from '../../domain/educationStudio';

export function AdminCoursesWorkspace({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [version, setVersion] = useState(0);
  const [tplOpen, setTplOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [ideaLevel, setIdeaLevel] = useState<CourseLevel>('beginner');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const courses = useMemo(() => listAllCourses(), [version]);

  const templates = useMemo(() => listCourseTemplates(), [version, tplOpen]);

  const stats = useMemo(
    () => ({
      total: courses.length,
      published: courses.filter((c) => c.published).length,
      modules: courses.reduce((n, c) => n + c.modules.length, 0),
      aiGenerated: courses.filter((c) => c.studio?.generationPrompt).length,
    }),
    [courses],
  );

  const templateCatalogItems = useMemo((): FinelyOsCatalogItem[] =>
    templates.map((t, i) => ({
      id: t.id,
      title: t.title,
      subtitle: t.category.replace(/_/g, ' '),
      description: t.description,
      accentIndex: i,
      meta: [`${t.blueprint.modules.length} modules`, `${t.tags.length} tags`],
    })),
  [templates]);

  const openCourse = (courseId: string, step?: 'teach') => {
    const productPath = pathname.startsWith('/preview/workspace-light')
      ? '/preview/workspace-light/admin/courses'
      : '/admin/courses';
    const stepQuery = step ? `&step=${step}` : '';
    navigate(
      embedded
        ? `${productPath}?courseId=${encodeURIComponent(courseId)}${stepQuery}`
        : `/admin/courses/${courseId}${step ? `?step=${step}` : ''}`,
    );
  };

  const generateFromIdea = async () => {
    const prompt = ideaPrompt.trim();
    if (!prompt) return;
    setGenerating(true);
    setErr(null);
    setNotice(null);
    try {
      if (!isFeatureEnabled('aiGateway')) throw new Error('Enable AI Gateway in Admin Settings → Features.');
      const { course: blueprint, studio } = await generateCourseFromPrompt({ prompt, level: ideaLevel });
      const id = newId('course');
      const now = nowIso();
      const created = { ...blueprint, id, createdAt: now, updatedAt: now, studio };
      upsertCourse(created);
      window.dispatchEvent(new Event('finely:store'));
      setNotice(`Generated “${created.title}” with ${created.modules.length} modules.`);
      setIdeaPrompt('');
      openCourse(created.id);
    } catch (e: any) {
      setErr(e?.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const content = (
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {embedded ? (
            <div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Admin Courses</div>
              <div className={FINELY_OS_ENTITY_VALUE}>Courses you built</div>
            </div>
          ) : (
            <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Admin Dashboard
            </button>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setTplOpen(true)} className={FINELY_OS_SECONDARY_BTN}>
              <Layers size={14} /> From template
            </button>
            <button
              type="button"
              onClick={() => {
                const c = createCourse({ title: 'New course' });
                window.dispatchEvent(new Event('finely:store'));
                openCourse(c.id);
              }}
              className={FINELY_OS_PRIMARY_BTN}
            >
              <Plus size={14} /> Blank course
            </button>
          </div>
        </div>

        <div className={FINELY_OS_BANNER}>
          <FinelyOsIconBadge icon={GraduationCap} accent="emerald" size={18} className="p-2.5 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
            Type a topic — the studio generates curriculum, lessons, quizzes, video scenes, and marketing copy. Comparable to{' '}
            <strong className="text-emerald-300">Kajabi + Teachable + Kling/Runway</strong> in one Finely OS workspace.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Courses', value: stats.total },
            { label: 'Published', value: stats.published },
            { label: 'Modules', value: stats.modules },
            { label: 'AI generated', value: stats.aiGenerated },
          ].map((m, i) => (
            <div key={m.label} className={`rounded-xl border p-4 shadow-sm backdrop-blur-xl ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{m.label}</div>
              <div className={`text-2xl font-bold mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{m.value}</div>
            </div>
          ))}
        </div>

        {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
        {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}

        <FinelyOsGlassPanel
          icon={Wand2}
          title="Generate complete course from idea"
          subtitle="Curriculum Architect + Instructional Designer + Assessment Designer agents run in one pipeline."
          accent="violet"
          actions={
            <button type="button" disabled={generating || !ideaPrompt.trim()} onClick={() => void generateFromIdea()} className={FINELY_OS_PRIMARY_BTN}>
              <Sparkles size={14} /> {generating ? 'Producing…' : 'Produce course'}
            </button>
          }
        >
          <div className="grid lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-9">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Topic prompt</div>
              <textarea
                aria-label="Course topic prompt"
                value={ideaPrompt}
                onChange={(e) => setIdeaPrompt(e.target.value)}
                rows={2}
                placeholder='Example: "Create a complete course teaching Forex liquidity concepts for beginners."'
                className={`${FINELY_OS_ENTITY_INPUT} resize-y`}
              />
            </div>
            <div className="lg:col-span-3">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Level</div>
              <select aria-label="Course level" value={ideaLevel} onChange={(e) => setIdeaLevel(e.target.value as CourseLevel)} className={FINELY_OS_ENTITY_SELECT}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
        </FinelyOsGlassPanel>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#e8e8e8]">Courses you built</h2>
          <p className="max-w-3xl text-base leading-relaxed text-[#e8e8e8]">
            This is the only admin home for courses. Edit a course or open its lessons.
          </p>
          {courses.length === 0 ? (
            <p className="rounded-2xl border border-white/15 bg-[#0b1110] p-6 text-base text-[#e8e8e8]">
              No courses yet. Start a blank course or generate one from a topic above.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {courses.map((c) => (
                <article key={c.id} className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-[#0b1110] p-6">
                  <div className="text-sm font-semibold text-[#fbbf24]">{c.published ? 'Published' : 'Draft'}</div>
                  <h3 className="text-xl font-semibold text-[#e8e8e8]">{c.title || 'Untitled course'}</h3>
                  <p className="text-base leading-relaxed text-[#e8e8e8]">{c.desc || 'No description yet.'}</p>
                  <p className="text-sm text-[#e8e8e8]">{c.modules.length} modules</p>
                  <div className="mt-auto flex flex-wrap gap-3">
                    <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => openCourse(c.id)}>
                      Edit
                    </button>
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => openCourse(c.id, 'teach')}>
                      Open lessons
                    </button>
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => {
                        upsertCourse({ ...c, published: !c.published });
                        window.dispatchEvent(new Event('finely:store'));
                        setVersion((v) => v + 1);
                      }}
                    >
                      {c.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => {
                        deleteCourse(c.id);
                        window.dispatchEvent(new Event('finely:store'));
                        setVersion((v) => v + 1);
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#e8e8e8]">Specialized agents</h2>
          <p className="max-w-3xl text-base text-[#e8e8e8]">These agents write outline, lessons, scripts, and quizzes when you generate a course.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {EDUCATION_AGENTS.map((a) => (
              <div key={a.id} className="rounded-2xl border border-white/15 bg-[#0b1110] p-5">
                <div className="text-lg font-semibold text-[#e8e8e8]">{a.label}</div>
                <div className="mt-2 text-base leading-relaxed text-[#e8e8e8]">{a.role}</div>
              </div>
            ))}
          </div>
        </section>

        <details className="rounded-2xl border border-white/15 bg-[#0b1110] p-6">
          <summary className="cursor-pointer text-lg font-semibold text-[#e8e8e8]">What the studio can produce</summary>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {EDUCATION_ENGINES.map((engine) => (
              <div key={engine.id}>
                <div className="text-lg font-semibold text-[#e8e8e8]">{engine.title}</div>
                <p className="mt-2 text-base text-[#e8e8e8]">{engine.description}</p>
              </div>
            ))}
          </div>
        </details>

        <FinelyOsPageFooter variant="hub" />

        {tplOpen ? (
          <div className="fixed inset-0 z-[80]">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setTplOpen(false)} />
            <div
              className={`absolute inset-x-0 top-[8vh] mx-auto w-[min(1100px,calc(100vw-24px))] ${finelyOsCatalogCard('violet')}`}
              data-fc-accent="violet"
              role="dialog"
              aria-modal="true"
              aria-label="Course template catalog"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Course templates</div>
                  <div className={FINELY_OS_ENTITY_VALUE}>Create from preset (30+)</div>
                  <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Instant draft courses you refine in the full studio.</p>
                </div>
                <button type="button" aria-label="Close course templates" onClick={() => setTplOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
                  <X size={16} />
                </button>
              </div>
              <FinelyOsCatalogBrowser
                items={templateCatalogItems}
                pageSize={12}
                searchPlaceholder="Search templates…"
                emptyMessage="No templates match."
                initialView="grid"
                onItemClick={(id) => {
                  const c = createCourseFromTemplate({ templateId: id });
                  window.dispatchEvent(new Event('finely:store'));
                  setTplOpen(false);
                  openCourse(c.id);
                }}
                renderTrailing={() => <span className="text-[10px] font-bold uppercase text-violet-700">Use →</span>}
              />
            </div>
          </div>
        ) : null}
      </div>
  );

  if (embedded) return content;

  return (
    <PageShell
      badge="Admin"
      title="Admin Courses"
      subtitle="The courses you built. Edit one, or open its lessons."
    >
      {content}
    </PageShell>
  );
}

export default function AdminCoursesPage() {
  return <AdminCoursesWorkspace />;
}
