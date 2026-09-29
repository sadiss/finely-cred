import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { createCourse, deleteCourse, listAllCourses, upsertCourse } from '../../data/coursesRepo';
import { createCourseFromTemplate, listCourseTemplates } from '../../data/courseTemplatesRepo';
import { generateCourseFromPrompt } from '../../features/educationStudio/educationStudioPipeline';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { nowIso, type Course } from '../../domain/courses';
import { newId } from '../../utils/ids';
import type { CourseLevel } from '../../domain/educationStudio';

function lessonCount(course: Course) {
  return course.modules.reduce((n, module) => n + (module.lessons?.length ?? 0), 0);
}

const goldBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#fbbf24] px-4 py-2.5 text-sm font-bold text-[#0b1110] hover:brightness-110 disabled:opacity-50';
const ghostBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8e8e8]/40 bg-[#0b1110] px-4 py-2.5 text-sm font-semibold text-[#e8e8e8] hover:border-[#fbbf24]';

export function AdminCoursesWorkspace({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [version, setVersion] = useState(0);
  const [creating, setCreating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showIdea, setShowIdea] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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
  const templates = useMemo(() => listCourseTemplates(), [version, showTemplates]);

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

  const startBlank = () => {
    const course = createCourse({ title: 'New course' });
    window.dispatchEvent(new Event('finely:store'));
    openCourse(course.id);
  };

  const generateFromIdea = async () => {
    const prompt = ideaPrompt.trim();
    if (!prompt) return;
    setGenerating(true);
    setErr(null);
    setNotice(null);
    try {
      if (!isFeatureEnabled('aiGateway')) throw new Error('Turn on AI Gateway in Admin Settings before generating a course.');
      const { course: blueprint, studio } = await generateCourseFromPrompt({ prompt, level: ideaLevel });
      const id = newId('course');
      const now = nowIso();
      const created = { ...blueprint, id, createdAt: now, updatedAt: now, studio };
      upsertCourse(created);
      window.dispatchEvent(new Event('finely:store'));
      setNotice(`Created “${created.title}”.`);
      setIdeaPrompt('');
      openCourse(created.id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not create that course.');
    } finally {
      setGenerating(false);
    }
  };

  const content = (
    <div className="fc-admin-readable mx-auto max-w-7xl space-y-8 text-[#e8e8e8]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl space-y-3">
          {embedded ? null : (
            <button type="button" onClick={() => navigate('/admin')} className={ghostBtn}>
              <ArrowLeft size={16} /> Admin
            </button>
          )}
          <h1 className="text-4xl font-semibold tracking-tight text-[#e8e8e8]">Your courses</h1>
          <p className="text-lg leading-relaxed text-[#e8e8e8]">
            These are the courses in Finely. Open one to teach it, or edit its title and lessons.
          </p>
        </div>
        <button
          type="button"
          className={goldBtn}
          onClick={() => {
            setCreating((open) => !open);
            setShowTemplates(false);
            setShowIdea(false);
          }}
        >
          <Plus size={16} /> {creating ? 'Close' : 'Create course'}
        </button>
      </header>

      {notice ? (
        <p className="rounded-2xl border border-[#fbbf24]/40 bg-[#0b1110] px-5 py-4 text-base text-[#e8e8e8]">{notice}</p>
      ) : null}
      {err ? (
        <p className="rounded-2xl border border-red-400/50 bg-[#0b1110] px-5 py-4 text-base text-[#e8e8e8]">{err}</p>
      ) : null}

      {courses.length === 0 ? (
        <section className="rounded-2xl border border-[#e8e8e8]/25 bg-[#0b1110] p-8">
          <h2 className="text-2xl font-semibold text-[#e8e8e8]">No courses yet</h2>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[#e8e8e8]">
            Create a course to add lessons partners can take.
          </p>
          <button type="button" className={`${goldBtn} mt-6`} onClick={() => setCreating(true)}>
            <Plus size={16} /> Create course
          </button>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {courses.map((course) => {
            const lessons = lessonCount(course);
            return (
              <article key={course.id} className="flex flex-col gap-4 rounded-2xl border border-[#e8e8e8]/25 bg-[#0b1110] p-6">
                <p className="text-sm font-bold uppercase tracking-wide text-[#fbbf24]">
                  {course.published ? 'Published' : 'Draft'}
                </p>
                <h2 className="text-2xl font-semibold text-[#e8e8e8]">{course.title || 'Untitled course'}</h2>
                <p className="text-base leading-relaxed text-[#e8e8e8]">{course.desc || 'No description yet.'}</p>
                <p className="text-base text-[#e8e8e8]">
                  {lessons} {lessons === 1 ? 'lesson' : 'lessons'}
                </p>
                <div className="mt-auto flex flex-wrap gap-3">
                  <button type="button" className={goldBtn} onClick={() => openCourse(course.id, 'teach')}>
                    Open
                  </button>
                  <button type="button" className={ghostBtn} onClick={() => openCourse(course.id)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className={ghostBtn}
                    onClick={() => {
                      upsertCourse({ ...course, published: !course.published });
                      window.dispatchEvent(new Event('finely:store'));
                      setVersion((v) => v + 1);
                    }}
                  >
                    {course.published ? 'Unpublish' : 'Publish'}
                  </button>
                  {pendingDeleteId === course.id ? (
                    <>
                      <button
                        type="button"
                        className={ghostBtn}
                        onClick={() => {
                          deleteCourse(course.id);
                          window.dispatchEvent(new Event('finely:store'));
                          setPendingDeleteId(null);
                          setVersion((v) => v + 1);
                        }}
                      >
                        Confirm delete
                      </button>
                      <button type="button" className={ghostBtn} onClick={() => setPendingDeleteId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" className={ghostBtn} onClick={() => setPendingDeleteId(course.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {creating ? (
        <section className="space-y-6 rounded-2xl border border-[#e8e8e8]/25 bg-[#0b1110] p-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#e8e8e8]">Create a course</h2>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-[#e8e8e8]">
              Start blank, pick a starter, or describe the topic. The new course opens so you can edit it.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={goldBtn} onClick={startBlank}>
              Blank course
            </button>
            <button
              type="button"
              className={ghostBtn}
              onClick={() => {
                setShowTemplates((open) => !open);
                setShowIdea(false);
              }}
            >
              {showTemplates ? 'Hide starters' : 'Start from a template'}
            </button>
            <button
              type="button"
              className={ghostBtn}
              onClick={() => {
                setShowIdea((open) => !open);
                setShowTemplates(false);
              }}
            >
              {showIdea ? 'Hide topic form' : 'Write a topic'}
            </button>
          </div>

          {showTemplates ? (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="rounded-2xl border border-[#e8e8e8]/25 bg-[#070a0f] p-5 text-left text-[#e8e8e8] hover:border-[#fbbf24]"
                  onClick={() => {
                    const course = createCourseFromTemplate({ templateId: template.id });
                    window.dispatchEvent(new Event('finely:store'));
                    openCourse(course.id);
                  }}
                >
                  <span className="block text-lg font-semibold text-[#e8e8e8]">{template.title}</span>
                  <span className="mt-2 block text-base leading-relaxed text-[#e8e8e8]">{template.description}</span>
                </button>
              ))}
            </div>
          ) : null}

          {showIdea ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void generateFromIdea();
              }}
            >
              <label className="block text-base font-semibold text-[#e8e8e8]">
                Topic
                <textarea
                  aria-label="Course topic"
                  value={ideaPrompt}
                  onChange={(e) => setIdeaPrompt(e.target.value)}
                  rows={3}
                  placeholder="Example: Teach partners how to run a dispute round."
                  className="mt-2 w-full rounded-xl border border-[#e8e8e8]/30 bg-[#070a0f] px-4 py-3 text-base text-[#e8e8e8] placeholder:text-[#e8e8e8]/55"
                />
              </label>
              <label className="block max-w-xs text-base font-semibold text-[#e8e8e8]">
                Level
                <select
                  aria-label="Course level"
                  value={ideaLevel}
                  onChange={(e) => setIdeaLevel(e.target.value as CourseLevel)}
                  className="mt-2 w-full rounded-xl border border-[#e8e8e8]/30 bg-[#070a0f] px-4 py-3 text-base text-[#e8e8e8]"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </label>
              <button type="submit" className={goldBtn} disabled={generating || !ideaPrompt.trim()}>
                {generating ? 'Creating…' : 'Create this course'}
              </button>
            </form>
          ) : null}
        </section>
      ) : null}
    </div>
  );

  if (embedded) return content;

  return (
    <PageShell badge="Admin" title="Your courses" subtitle="Open a course or create one.">
      {content}
    </PageShell>
  );
}

export default function AdminCoursesPage() {
  return <AdminCoursesWorkspace />;
}
