import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { enrollPartnerInCourse, getCourse, getCourseProgress, isLessonUnlocked, markLessonComplete, nextUnlockedLesson } from '../../data/coursesRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import type { CourseLesson } from '../../domain/courses';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { LessonBlockRenderer } from '../../components/courses/LessonBlockRenderer';
import { getCertificate } from '../../data/certificatesRepo';
import { generateCertificatePdfBytes } from '../../certificates/generateCertificatePdf';
import { downloadBlob } from '../../utils/download';

function lessonIdList(course: any): string[] {
  const ids: string[] = [];
  for (const m of course.modules ?? []) for (const l of m.lessons ?? []) ids.push(l.id);
  return ids;
}

export default function PartnerCoursePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const auth = useAuth();
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
  useEffect(() => {
    if (!course) return;
    // Ensure enrollment exists and pick the next unlocked lesson by default
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
      <PageShell badge="Partner Portal" title="Course" subtitle="">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">No partner profile found.</div>
      </PageShell>
    );
  }

  if (!isFeatureEnabled('courses')) {
    return (
      <PageShell badge="Partner Portal" title="Course" subtitle="">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-white/80">
          <div className="flex items-center gap-2 text-amber-300">
            <Lock size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Module gated</span>
          </div>
          <div className="mt-2 text-white/70 text-sm">Courses are disabled right now.</div>
        </div>
      </PageShell>
    );
  }

  if (!course) {
    return <PageShell badge="Partner Portal" title="Course not found" subtitle="That course does not exist." />;
  }

  if (!course.published) {
    return (
      <PageShell badge="Partner Portal" title={course.title} subtitle="This course is not published yet.">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">Ask support to publish it.</div>
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
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/courses')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Courses
            </button>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              progress: {done}/{totalLessons}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Lessons</div>
              <div className="space-y-3">
                {course.modules.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                    <div className="text-white font-semibold">{m.title}</div>
                    <div className="space-y-1">
                      {m.lessons.map((l) => {
                        const active = l.id === activeLessonId;
                        const done = isDone(l.id);
                        const unlock = partner ? isLessonUnlocked({ partnerId: partner.id, course, lessonId: l.id }) : { ok: true as const };
                        const locked = !unlock.ok;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              if (locked) return;
                              setActiveLessonId(l.id);
                            }}
                            className={`w-full text-left inline-flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-[11px] transition-all ${
                              active
                                ? 'border-amber-500/30 bg-amber-500/10 text-white'
                                : locked
                                  ? 'border-white/10 bg-white/[0.01] text-white/35'
                                  : 'border-white/10 bg-white/[0.01] text-white/70 hover:bg-white/[0.04]'
                            }`}
                          >
                            <span className="truncate">{l.title}</span>
                            {done ? (
                              <CheckCircle2 size={14} className="text-emerald-300" />
                            ) : locked ? (
                              <Lock size={14} className="text-white/25" />
                            ) : (
                              <PlayCircle size={14} className="text-white/25" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              {!activeLesson ? (
                <div className="text-white/60 text-sm">Select a lesson.</div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-white font-semibold">{activeLesson.title}</div>
                      {activeLesson.summary ? <div className="mt-1 text-white/60 text-sm">{activeLesson.summary}</div> : null}
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
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
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
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                      >
                        <CheckCircle2 size={14} /> Mark complete
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const unlock = isLessonUnlocked({ partnerId: partner.id, course, lessonId: activeLesson.id });
                    if (unlock.ok) return null;
                    return (
                      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-white/80 text-sm">
                        <div className="inline-flex items-center gap-2 text-amber-300">
                          <Lock size={16} />
                          <span className="text-xs font-semibold uppercase tracking-wider">Lesson locked</span>
                        </div>
                        <div className="mt-2 text-white/70">{unlock.reason || 'This lesson is locked.'}</div>
                      </div>
                    );
                  })()}

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                    <LessonBlockRenderer blocks={activeLesson.content as any} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </EntitlementGate>
    </PageShell>
  );
}

