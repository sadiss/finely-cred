import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { enrollPartnerInCourse, getCourse, getCourseProgress, isLessonUnlocked, markLessonComplete, nextUnlockedLesson } from '../../data/coursesRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { LessonBlockRenderer } from '../../components/courses/LessonBlockRenderer';
import { CourseLessonAudioPlayer } from '../../components/courses/CourseLessonAudioPlayer';
import { getCertificate } from '../../data/certificatesRepo';
import { generateCertificatePdfBytes } from '../../certificates/generateCertificatePdf';
import { downloadBlob } from '../../utils/download';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SUCCESS_BTN,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

function lessonIdList(course: any): string[] {
  const ids: string[] = [];
  for (const m of course.modules ?? []) for (const l of m.lessons ?? []) ids.push(l.id);
  return ids;
}

export default function PartnerCoursePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const auth = useAuth();
  const adminPreview = searchParams.get('preview') === 'admin' && isAdminEmail(auth.user?.email);
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const course = useMemo(() => (id ? getCourse(id) : null), [id, version]);
  const progress = useMemo(() => {
    if (!partner || !course) return null;
    return getCourseProgress({ partnerId: partner.id, courseId: course.id });
  }, [course, partner, version]);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  type CourseTab = 'syllabus' | 'lesson';
  const [tab, setTab] = useState<CourseTab>('lesson');
  useEffect(() => {
    if (!course) return;
    if (partner) {
      enrollPartnerInCourse({ partnerId: partner.id, courseId: course.id });
      const next = nextUnlockedLesson({ partnerId: partner.id, course }) ?? lessonIdList(course)[0] ?? null;
      setActiveLessonId((cur) => cur ?? next);
      window.dispatchEvent(new Event('finely:store'));
      setVersion((v) => v + 1);
    } else {
      const first = lessonIdList(course)[0] ?? null;
      setActiveLessonId((cur) => cur ?? first);
    }
  }, [course?.id, partner?.id]);

  const activeLesson = useMemo(() => {
    if (!course || !activeLessonId) return null;
    for (const m of course.modules) {
      const found = m.lessons.find((l) => l.id === activeLessonId);
      if (found) return found;
    }
    return null;
  }, [activeLessonId, course]);

  const isDone = (lessonId: string) => Boolean(progress?.lessons.find((l) => l.lessonId === lessonId)?.completedAt);

  if (!partner) {
    return (
      <PageShell badge="Partner Portal" title="Course" subtitle="Sign in with a partner profile to access self-paced lessons.">
        <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>No partner profile found.</div>
      </PageShell>
    );
  }

  if (!isFeatureEnabled('courses')) {
    return (
      <PageShell badge="Partner Portal" title="Course" subtitle="Courses are disabled in Admin settings until your workspace enables them.">
        <div className={`${FINELY_OS_NOTICE_WARN} space-y-2`}>
          <div className="inline-flex items-center gap-2 text-fuchsia-300">
            <Lock size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Module gated</span>
          </div>
          <div className={FINELY_OS_ENTITY_BODY}>Courses are disabled right now.</div>
        </div>
      </PageShell>
    );
  }

  if (!course) {
    return <PageShell badge="Partner Portal" title="Course not found" subtitle="That course does not exist." />;
  }

  if (!course.published && !adminPreview) {
    return (
      <PageShell badge="Partner Portal" title={course.title} subtitle="This course is not published yet.">
        <div className={`${FINELY_OS_LUXURY_EMPTY} text-sm`}>
          Ask support to publish it, or preview as admin with <span className="font-mono">?preview=admin</span>.
        </div>
      </PageShell>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const done = progress?.lessons.filter((l) => l.completedAt).length ?? 0;
  const courseDone = totalLessons > 0 && done >= totalLessons;
  const cert = progress?.certificateId ? getCertificate(progress.certificateId) : null;

  return (
    <PageShell badge="Partner Portal" title={course.title} subtitle={course.desc}>
      <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.courses]}>
        <div className={FINELY_OS_PAGE}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => navigate('/portal/courses')} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Courses
            </button>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
              progress: {done}/{totalLessons}
            </div>
          </div>

          <FinelyUnifiedHubLayout
            eyebrow="Course player"
            title={course.title}
            subtitle={course.desc ?? 'Self-paced lessons with narration and checklist tasks.'}
            accent="violet"
            kpis={[
              { label: 'Progress', value: `${done}/${totalLessons}`, hint: 'Lessons', accent: 'violet' },
              { label: 'Modules', value: String(course.modules.length), hint: 'Sections', accent: 'amber' },
              { label: 'Complete', value: courseDone ? '100%' : `${totalLessons ? Math.round((done / totalLessons) * 100) : 0}%`, hint: 'Course', accent: 'emerald' },
              { label: 'Cert', value: cert ? 'Ready' : '—', hint: 'Download', accent: 'sky' },
            ]}
            tabs={[
              { id: 'syllabus', label: 'Syllabus', badge: totalLessons || undefined },
              { id: 'lesson', label: 'Lesson' },
            ]}
            activeTab={tab}
            onTabChange={(id) => setTab(id as CourseTab)}
            primaryAction={{ label: 'All courses', onClick: () => navigate('/portal/courses') }}
            secondaryAction={{ label: 'My tasks', onClick: () => navigate('/portal/my-tasks') }}
          >
          {tab === 'syllabus' && (
          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Lessons</div>
              <div className="space-y-3">
                {course.modules.map((m) => (
                  <div key={m.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                    <div className={FINELY_OS_ENTITY_VALUE}>{m.title}</div>
                    <div className="space-y-1">
                      {m.lessons.map((l) => {
                        const active = l.id === activeLessonId;
                        const doneLesson = isDone(l.id);
                        const unlock = partner ? isLessonUnlocked({ partnerId: partner.id, course, lessonId: l.id }) : { ok: true as const };
                        const locked = !unlock.ok;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              if (locked) return;
                              setActiveLessonId(l.id);
                              setTab('lesson');
                            }}
                            disabled={locked}
                            className={`${finelyOsListItem(active, 'amber')} !p-3 text-[11px] ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className="flex items-center justify-between gap-3 w-full">
                              <span className="truncate">{l.title}</span>
                              {doneLesson ? (
                                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                              ) : locked ? (
                                <Lock size={14} className="text-white/40 shrink-0" />
                              ) : (
                                <PlayCircle size={14} className="text-white/40 shrink-0" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
          </div>
          )}

          {tab === 'lesson' && (
            <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-4`}>
              {!activeLesson ? (
                <div className={FINELY_OS_ENTITY_BODY}>Select a lesson from the syllabus tab.</div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className={FINELY_OS_ENTITY_VALUE}>{activeLesson.title}</div>
                      {activeLesson.summary ? <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{activeLesson.summary}</div> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {courseDone && cert ? (
                        <button
                          type="button"
                          onClick={async () => {
                            const bytes = await generateCertificatePdfBytes({ cert, issuerName: 'Finely Cred' });
                            const ab = (bytes.buffer as ArrayBufferLike).slice(
                              bytes.byteOffset,
                              bytes.byteOffset + bytes.byteLength,
                            ) as ArrayBuffer;
                            downloadBlob({
                              blob: new Blob([ab], { type: 'application/pdf' }),
                              filename: `certificate_${course.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.pdf`,
                            });
                          }}
                          className={FINELY_OS_SUCCESS_BTN}
                        >
                          <CheckCircle2 size={14} /> Download certificate
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          const unlock = isLessonUnlocked({ partnerId: partner.id, course, lessonId: activeLesson.id });
                          if (!unlock.ok) return;
                          markLessonComplete({ partnerId: partner.id, courseId: course.id, lessonId: activeLesson.id });
                          window.dispatchEvent(new Event('finely:store'));
                          setVersion((v) => v + 1);
                        }}
                        className={FINELY_OS_SUCCESS_BTN}
                      >
                        <CheckCircle2 size={14} /> Mark complete
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const unlock = isLessonUnlocked({ partnerId: partner.id, course, lessonId: activeLesson.id });
                    if (unlock.ok) return null;
                    return (
                      <div className={`${FINELY_OS_NOTICE_WARN} space-y-2`}>
                        <div className="inline-flex items-center gap-2 text-fuchsia-300">
                          <Lock size={16} />
                          <span className={FINELY_OS_ENTITY_SUBLABEL}>Lesson locked</span>
                        </div>
                        <div className={FINELY_OS_ENTITY_BODY}>{unlock.reason || 'This lesson is locked.'}</div>
                      </div>
                    );
                  })()}

                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                    <CourseLessonAudioPlayer course={course} lesson={activeLesson} />
                    <LessonBlockRenderer blocks={activeLesson.content as any} />
                  </div>
                </>
              )}
            </div>
          )}
          </FinelyUnifiedHubLayout>

          <FinelyOsPageFooter />
        </div>
      </EntitlementGate>
    </PageShell>
  );
}
