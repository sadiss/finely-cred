import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Clapperboard,
  ExternalLink,
  GraduationCap,
  Lock,
  PlayCircle,
  Shield,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { CommsWorkspaceActions } from '../../components/comms/CommsWorkspaceActions';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyTourPlayer } from '../../components/tours/FinelyTourPlayer';
import { getTourById } from '../../config/tourManifest';
import { PLATFORM_SOP_LIBRARY } from '../../domain/platformSops';
import {
  CORE_TRACK_ID,
  type TrainingLesson,
  type TrainingModule,
  type TrainingTrack,
} from '../../domain/trainingAcademy';
import {
  getOrCreateEnrollment,
  getTrainingProgress,
  passTrainingQuiz,
} from '../../data/trainingProgressRepo';
import { listCertificatesByPartner } from '../../data/certificatesRepo';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type AcademyTab = 'path' | 'certifications' | 'resources';

function ProgressRing({ pct, label }: { pct: number; label: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-emerald-400"
          strokeWidth="8"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center -mt-[72px] pt-[72px]">
        <div className="text-xl font-black text-white">{pct}%</div>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px]`}>{label}</div>
      </div>
    </div>
  );
}

function LessonRow(props: {
  lesson: TrainingLesson;
  module: TrainingModule;
  done: boolean;
  partnerId: string;
  lane?: import('../../domain/partners').PartnerLane;
  isAdmin: boolean;
  recipientName?: string;
  onRefresh: () => void;
  onOpenTour: (tourId: string) => void;
}) {
  const navigate = useNavigate();
  const { lesson, module, done, partnerId, lane, isAdmin, recipientName, onRefresh, onOpenTour } = props;
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [quizMsg, setQuizMsg] = useState<string | null>(null);
  const hasQuiz = Boolean(lesson.quiz?.length);

  const markDone = () => {
    if (hasQuiz && !done) {
      setQuizMsg('Pass the quick check below to complete this lesson.');
      return;
    }
    passTrainingQuiz({
      partnerId,
      lessonId: lesson.id,
      selectedIndex: lesson.quiz?.[0]?.correctIndex ?? 0,
      lane,
      isAdmin,
      recipientName,
    });
    onRefresh();
  };

  const submitQuiz = () => {
    if (quizPick === null) return;
    const res = passTrainingQuiz({
      partnerId,
      lessonId: lesson.id,
      selectedIndex: quizPick,
      lane,
      isAdmin,
      recipientName,
    });
    setQuizMsg(res.message);
    if (res.ok) onRefresh();
  };

  return (
    <div
      className={`${finelyOsCatalogCard('sky')} !p-4 space-y-3 ${done ? 'border-emerald-500/25' : ''}`}
      data-fc-lesson={lesson.id}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {done ? (
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Circle size={20} className="text-white/30 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_VALUE}>{lesson.title}</div>
            <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>
              {lesson.estimatedMinutes} min · {module.title}
            </div>
            <ul className="mt-2 space-y-1">
              {lesson.objectives.map((o) => (
                <li key={o} className={`${FINELY_OS_ENTITY_BODY} text-xs flex gap-2`}>
                  <span className="text-emerald-400/80">•</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {!done ? (
          <button type="button" onClick={markDone} className={`${FINELY_OS_SUCCESS_BTN} shrink-0 text-xs`}>
            Complete
          </button>
        ) : (
          <span className={`${finelyOsStatusChip('ok')} shrink-0`}>Done</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {lesson.hubPath ? (
          <button type="button" onClick={() => navigate(lesson.hubPath!)} className={FINELY_OS_PRIMARY_BTN}>
            Open in app <ArrowRight size={14} />
          </button>
        ) : null}
        {lesson.guideId ? (
          <button type="button" onClick={() => navigate(`/resources#${lesson.guideId}`)} className={FINELY_OS_PRIMARY_BTN}>
            Field guide <BookOpen size={14} />
          </button>
        ) : null}
        {lesson.resourcePath ? (
          <button type="button" onClick={() => navigate(lesson.resourcePath!)} className={FINELY_OS_PRIMARY_BTN}>
            Resources <ExternalLink size={14} />
          </button>
        ) : null}
        {lesson.tourIds?.map((tid) => (
          <button key={tid} type="button" onClick={() => onOpenTour(tid)} className={FINELY_OS_PRIMARY_BTN}>
            Watch tour <PlayCircle size={14} />
          </button>
        ))}
        {lesson.sopIds?.map((sid) => {
          const sop = PLATFORM_SOP_LIBRARY.find((s) => s.id === sid);
          return (
            <button
              key={sid}
              type="button"
              onClick={() => navigate('/help-center')}
              className={FINELY_OS_PRIMARY_BTN}
              title={sop?.title ?? sid}
            >
              Playbook <Shield size={14} />
            </button>
          );
        })}
      </div>

      {hasQuiz && !done ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-3 space-y-2`}>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>Quick check</div>
          <div className={FINELY_OS_ENTITY_BODY}>{lesson.quiz![0]!.question}</div>
          <div className="space-y-1">
            {lesson.quiz![0]!.options.map((opt, i) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-white/75 cursor-pointer">
                <input
                  type="radio"
                  name={`quiz-${lesson.id}`}
                  checked={quizPick === i}
                  onChange={() => setQuizPick(i)}
                  className="accent-emerald-500"
                />
                {opt}
              </label>
            ))}
          </div>
          <button type="button" onClick={submitQuiz} className={FINELY_OS_SUCCESS_BTN}>
            Submit answer
          </button>
          {quizMsg ? <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{quizMsg}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function TrackSection(props: {
  track: TrainingTrack;
  modules: TrainingModule[];
  completed: Set<string>;
  partnerId: string;
  lane?: import('../../domain/partners').PartnerLane;
  isAdmin: boolean;
  recipientName?: string;
  onRefresh: () => void;
  onOpenTour: (tourId: string) => void;
}) {
  const { track, modules, completed, partnerId, lane, isAdmin, recipientName, onRefresh, onOpenTour } = props;
  const lessons = modules.flatMap((m) => m.lessons.map((l) => ({ module: m, lesson: l })));
  const doneCount = lessons.filter(({ lesson }) => completed.has(lesson.id)).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  const isCore = track.id === CORE_TRACK_ID;

  return (
    <div className={`${finelyOsCatalogCard(track.accent)} !p-5 space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-white/70">
            {isCore ? <Shield size={18} className="text-emerald-400" /> : <GraduationCap size={18} />}
            <span className={FINELY_OS_ENTITY_SUBLABEL}>{isCore ? 'Required for everyone' : 'Your role track'}</span>
          </div>
          <h3 className={`${FINELY_OS_ENTITY_VALUE} text-xl mt-1`}>{track.title}</h3>
          <p className={`${FINELY_OS_ENTITY_BODY} mt-1 max-w-2xl`}>{track.subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">{pct}%</div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>
            {doneCount}/{lessons.length} lessons
          </div>
        </div>
      </div>

      {modules.map((mod) => (
        <div key={mod.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={FINELY_OS_ENTITY_VALUE}>{mod.title}</div>
            {mod.certification && mod.lessons.every((l) => completed.has(l.id)) ? (
              <span className={`${finelyOsStatusChip('ok')} inline-flex items-center gap-1`}>
                <Award size={12} /> {mod.certification.badge} {mod.certification.title}
              </span>
            ) : null}
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{mod.description}</p>
          <div className="space-y-2">
            {mod.lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                module={mod}
                done={completed.has(lesson.id)}
                partnerId={partnerId}
                lane={lane}
                isAdmin={isAdmin}
                recipientName={recipientName}
                onRefresh={onRefresh}
                onOpenTour={onOpenTour}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PartnerTrainingAcademyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusLesson = searchParams.get('focus') ?? searchParams.get('lesson');
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const isAdmin = isAdminEmail(auth.user?.email);
  const [tab, setTab] = useState<AcademyTab>('path');
  const [storeVersion, setStoreVersion] = useState(0);
  const [tourId, setTourId] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (partner?.id) {
      getOrCreateEnrollment({ partnerId: partner.id, lane: partner.lane, isAdmin });
    }
  }, [partner?.id, partner?.lane, isAdmin]);

  const progress = useMemo(() => {
    if (!partner) return null;
    return getTrainingProgress({
      partnerId: partner.id,
      lane: partner.lane,
      isAdmin,
    });
  }, [partner, isAdmin, storeVersion]);

  useEffect(() => {
    if (!focusLesson) return;
    const el = document.querySelector(`[data-fc-lesson="${focusLesson}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-emerald-400/60');
    }
  }, [focusLesson, storeVersion, progress?.plan.roleModules.length]);

  const certs = useMemo(() => (partner ? listCertificatesByPartner(partner.id) : []), [partner, storeVersion]);
  const previewTour = useMemo(() => (tourId ? getTourById(tourId) : null), [tourId]);
  const completed = useMemo(
    () => new Set(progress?.enrollment.completedLessonIds ?? []),
    [progress?.enrollment.completedLessonIds],
  );

  const coreModules = progress?.plan.coreModules ?? [];
  const roleModules = progress?.plan.roleModules ?? [];
  const coreTrack = progress?.plan.tracks.find((t) => t.role === 'core');
  const roleTracks = progress?.plan.tracks.filter((t) => t.role !== 'core') ?? [];

  return (
    <PageShell
      badge="Finely Training Academy"
      title="Training Academy"
      subtitle="One signup, one academy — core foundation for everyone, then role tracks unlock from your onboarding lane."
    >
      {!partner ? (
        <div className={FINELY_OS_LUXURY_EMPTY}>
          Sign in and complete onboarding first. There is no separate training signup — your lane selects your track
          automatically.
        </div>
      ) : (
        <div className={FINELY_OS_PAGE}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button type="button" onClick={() => navigate('/portal/education')} className={FINELY_OS_BACK_LINK}>
              Education library
            </button>
          </div>

          <CommsWorkspaceActions />

          <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-3`}>
            <div className="inline-flex items-center gap-2 text-emerald-300">
              <GraduationCap size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Unified architecture</span>
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} max-w-3xl`}>
              Everyone completes <strong className="text-white">Core Foundation</strong> (compliance, validation-first
              doctrine, platform safety). Your onboarding lane unlocks a <strong className="text-white">role track</strong>{' '}
              — client restore, affiliate, credit specialist, AU seller, business credit, debt validation, admin, or agency.
              Courses, tours, SOPs, and field guides link from each lesson — no duplicate curricula.
            </p>
            {progress ? (
              <div className="flex flex-wrap gap-6 items-center pt-2">
                <ProgressRing pct={progress.corePct} label="Core" />
                <ProgressRing pct={progress.rolePct} label="Role track" />
                <ProgressRing pct={progress.overallPct} label="Overall" />
                {progress.coreComplete ? (
                  <span className={`${finelyOsStatusChip('ok')} inline-flex items-center gap-2`}>
                    <CheckCircle2 size={14} /> Core graduate — advanced hubs unlocked
                  </span>
                ) : (
                  <span className={`${finelyOsStatusChip('warn')} inline-flex items-center gap-2`}>
                    <Lock size={14} /> Complete core before mailing disputes
                  </span>
                )}
              </div>
            ) : null}
          </div>

          <FinelyUnifiedHubLayout
            eyebrow="Training academy"
            title="Your learning path"
            subtitle={`Primary role: ${progress?.enrollment.primaryRole.replace(/_/g, ' ')} · ${progress?.plan.lessonCount ?? 0} lessons`}
            accent="emerald"
            kpis={[
              { label: 'Core', value: `${progress?.corePct ?? 0}%`, hint: 'Required', accent: 'emerald' },
              { label: 'Role', value: `${progress?.rolePct ?? 0}%`, hint: 'Your lane', accent: 'sky' },
              { label: 'Certs', value: String(certs.length), hint: 'Earned', accent: 'violet' },
              { label: 'Launch courses', value: String(progress?.plan.launchCourses.length ?? 0), hint: 'Linked', accent: 'amber' },
            ]}
            tabs={[
              { id: 'path', label: 'Learning path' },
              { id: 'certifications', label: 'Certifications', badge: certs.length || undefined },
              { id: 'resources', label: 'Linked courses' },
            ]}
            activeTab={tab}
            onTabChange={(id) => setTab(id as AcademyTab)}
            primaryAction={{ label: 'Open courses LMS', onClick: () => navigate('/portal/courses') }}
            secondaryAction={{ label: 'Help center SOPs', onClick: () => navigate('/help-center') }}
          >
            {tab === 'path' && (
              <div className="space-y-6">
                {coreTrack ? (
                  <TrackSection
                    track={coreTrack}
                    modules={coreModules}
                    completed={completed}
                    partnerId={partner.id}
                    lane={partner.lane}
                    isAdmin={isAdmin}
                    recipientName={partner.profile.fullName ?? partner.profile.email}
                    onRefresh={() => setStoreVersion((v) => v + 1)}
                    onOpenTour={setTourId}
                  />
                ) : null}
                {roleTracks.map((track) => {
                  const mods = roleModules.filter((m) => track.moduleIds.includes(m.id));
                  if (!mods.length) return null;
                  return (
                    <TrackSection
                      key={track.id}
                      track={track}
                      modules={mods}
                      completed={completed}
                      partnerId={partner.id}
                      lane={partner.lane}
                      isAdmin={isAdmin}
                      recipientName={partner.profile.fullName ?? partner.profile.email}
                      onRefresh={() => setStoreVersion((v) => v + 1)}
                      onOpenTour={setTourId}
                    />
                  );
                })}
              </div>
            )}

            {tab === 'certifications' && (
              <div className="grid md:grid-cols-2 gap-4">
                {certs.length ? (
                  certs.map((c) => (
                    <div key={c.id} className={`${finelyOsCatalogCard('violet')} !p-4 space-y-2`}>
                      <div className="inline-flex items-center gap-2 text-violet-300">
                        <Award size={16} />
                        <span className={FINELY_OS_ENTITY_SUBLABEL}>Certificate</span>
                      </div>
                      <div className={FINELY_OS_ENTITY_VALUE}>{c.courseTitle}</div>
                      <div className={`${FINELY_OS_ENTITY_BODY} text-xs font-mono`}>
                        {new Date(c.issuedAt).toLocaleDateString()} · {c.verificationCode}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>
                    Complete module lessons to earn certifications. Core compliance and role operator badges appear here
                    automatically.
                  </div>
                )}
              </div>
            )}

            {tab === 'resources' && (
              <div className="space-y-4">
                <p className={FINELY_OS_ENTITY_BODY}>
                  Launch role courses mirror your academy tracks — same SOPs and tours, packaged for quick reference.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {progress?.plan.launchCourses.map((course) => (
                    <div key={course.id} className={`${finelyOsCatalogCard(course.accent)} !p-4 space-y-3`}>
                      <div className="inline-flex items-center gap-2">
                        <Clapperboard size={16} />
                        <span className={FINELY_OS_ENTITY_SUBLABEL}>{course.role}</span>
                      </div>
                      <div className={FINELY_OS_ENTITY_VALUE}>{course.title}</div>
                      <div className={FINELY_OS_ENTITY_BODY}>{course.desc}</div>
                      <button type="button" onClick={() => navigate(course.hubPath)} className={FINELY_OS_SUCCESS_BTN}>
                        Open hub <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </FinelyUnifiedHubLayout>

          <FinelyOsPageFooter />
        </div>
      )}

      <FinelyTourPlayer tour={previewTour} open={Boolean(previewTour)} onClose={() => setTourId(null)} />
    </PageShell>
  );
}
