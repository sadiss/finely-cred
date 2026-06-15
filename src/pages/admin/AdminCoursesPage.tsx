import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Clapperboard,
  GraduationCap,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';
import type { CourseLevel } from '../../domain/educationStudio';

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [q, setQ] = useState('');
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

  const courses = useMemo(() => {
    const all = listAllCourses();
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter((c) => `${c.title} ${c.desc} ${(c.tags ?? []).join(' ')} ${c.id}`.toLowerCase().includes(query));
  }, [q, version]);

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

  const courseCatalogItems = useMemo((): FinelyOsCatalogItem[] =>
    courses.map((c, i) => ({
      id: c.id,
      title: c.title,
      subtitle: c.published ? 'Published' : 'Draft',
      description: c.desc,
      accentIndex: i,
      meta: [`${c.modules.length} modules`, ...(c.studio?.level ? [c.studio.level] : [])],
    })),
  [courses]);

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
      navigate(`/admin/courses/${created.id}`);
    } catch (e: any) {
      setErr(e?.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageShell
      badge="Admin"
      title="AI Education Studio"
      subtitle="Enterprise educational production — curriculum, authoring, cinematic video, multimedia, and LMS in one pipeline."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setTplOpen(true)} className={FINELY_OS_SECONDARY_BTN}>
              <Layers size={14} /> From template
            </button>
            <button
              type="button"
              onClick={() => {
                const c = createCourse({ title: 'New course' });
                window.dispatchEvent(new Event('finely:store'));
                navigate(`/admin/courses/${c.id}`);
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
                value={ideaPrompt}
                onChange={(e) => setIdeaPrompt(e.target.value)}
                rows={3}
                placeholder='Example: "Create a complete course teaching Forex liquidity concepts for beginners."'
                className={`${FINELY_OS_ENTITY_INPUT} min-h-[96px] resize-y`}
              />
            </div>
            <div className="lg:col-span-3">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Level</div>
              <select value={ideaLevel} onChange={(e) => setIdeaLevel(e.target.value as CourseLevel)} className={FINELY_OS_ENTITY_SELECT}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
        </FinelyOsGlassPanel>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {EDUCATION_ENGINES.map((engine, i) => (
            <FinelyOsGlassPanel
              key={engine.id}
              icon={engine.id === 'video' ? Clapperboard : BookOpen}
              title={engine.title}
              subtitle={engine.description}
              accent={(['violet', 'emerald', 'fuchsia', 'sky', 'amber'] as const)[i % 5]}
              variant="inner"
            >
              <ul className={`space-y-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>
                {engine.outputs.map((o) => (
                  <li key={o}>• {o}</li>
                ))}
              </ul>
            </FinelyOsGlassPanel>
          ))}
        </div>

        <FinelyOsGlassPanel icon={Sparkles} title="Specialized AI agents" subtitle="Ten agents collaborate across the production pipeline." accent="amber" variant="catalog">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EDUCATION_AGENTS.map((a) => (
              <div key={a.id} className={`${finelyOsInlineListItem()} !p-4`}>
                <div className={FINELY_OS_ENTITY_VALUE}>{a.label}</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>{a.role}</div>
              </div>
            ))}
          </div>
        </FinelyOsGlassPanel>

        <FinelyOsGlassPanel icon={BookOpen} title="Course library" subtitle="Search, edit, publish, and open the full studio for any course." accent="emerald">
          <div className={`${FINELY_OS_TOOLBAR} !p-4 mb-4`}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search courses…"
              className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} flex-1 min-w-[200px]`}
            />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>{courses.length} courses</span>
          </div>
          <FinelyOsCatalogBrowser
            items={courseCatalogItems}
            pageSize={9}
            searchPlaceholder="Filter library…"
            emptyMessage="No courses yet — generate from an idea or start blank."
            initialView="grid"
            onItemClick={(id) => navigate(`/admin/courses/${id}`)}
            renderTrailing={(item) => {
              const c = courses.find((x) => x.id === item.id);
              if (!c) return null;
              return (
                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      upsertCourse({ ...c, published: !c.published });
                      window.dispatchEvent(new Event('finely:store'));
                      setVersion((v) => v + 1);
                    }}
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    {c.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCourse(c.id);
                      window.dispatchEvent(new Event('finely:store'));
                      setVersion((v) => v + 1);
                    }}
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              );
            }}
          />
        </FinelyOsGlassPanel>

        <FinelyOsPageFooter variant="hub" />

        {tplOpen ? (
          <div className="fixed inset-0 z-[80]">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setTplOpen(false)} />
            <div className={`absolute inset-x-0 top-[8vh] mx-auto w-[min(1100px,calc(100vw-24px))] ${finelyOsCatalogCard('violet')} !p-6 lg:!p-8`} data-fc-accent="violet">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Course templates</div>
                  <div className={FINELY_OS_ENTITY_VALUE}>Create from preset (30+)</div>
                  <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Instant draft courses you refine in the full studio.</p>
                </div>
                <button type="button" onClick={() => setTplOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
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
                  navigate(`/admin/courses/${c.id}`);
                }}
                renderTrailing={() => <span className="text-[10px] font-bold uppercase text-violet-700">Use →</span>}
              />
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
