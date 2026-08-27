import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  CircleHelp,
  Clapperboard,
  ExternalLink,
  GraduationCap,
  Lock,
  PlayCircle,
  Shield,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { isAdminEmail } from '../../../../auth/admin';
import { CommsWorkspaceActions } from '../../../../components/comms/CommsWorkspaceActions';
import { FinelyTourPlayer } from '../../../../components/tours/FinelyTourPlayer';
import { getTourById } from '../../../../config/tourManifest';
import { canShowPublicDemoVideos } from '../../../../config/publicMediaPolicy';
import { PLATFORM_SOP_LIBRARY } from '../../../../domain/platformSops';
import {
  CORE_TRACK_ID,
  type TrainingLesson,
  type TrainingModule,
  type TrainingTrack,
} from '../../../../domain/trainingAcademy';
import {
  getOrCreateEnrollment,
  getTrainingProgress,
  passTrainingQuiz,
} from '../../../../data/trainingProgressRepo';
import { listCertificatesByPartner } from '../../../../data/certificatesRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';

type RunwayView = 'path' | 'certifications' | 'resources';

function catalogAccent(accent: TrainingTrack['accent']): 'emerald' | 'violet' | 'sky' | 'rose' {
  if (accent === 'amber' || accent === 'fuchsia') return 'rose';
  return accent;
}

function ProgressRing({ pct, label }: { pct: number; label: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
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
        <div className={`text-xl font-black ${FINELY_OS_ENTITY_VALUE}`}>{pct}%</div>
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
  lane?: import('../../../../domain/partners').PartnerLane;
  isAdmin: boolean;
  recipientName?: string;
  onRefresh: () => void;
  onOpenTour: (tourId: string) => void;
  showTourVideos?: boolean;
  mapPortalHref: (href: string) => string;
}) {
  const navigate = useNavigate();
  const {
    lesson,
    module,
    done,
    partnerId,
    lane,
    isAdmin,
    recipientName,
    onRefresh,
    onOpenTour,
    showTourVideos = false,
    mapPortalHref,
  } = props;
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
      className={`${finelyOsCatalogCard('sky')} space-y-3 ${done ? 'border-emerald-500/25' : ''}`}
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
          <button type="button" onClick={() => navigate(mapPortalHref(lesson.hubPath!))} className={FINELY_OS_PRIMARY_BTN}>
            Open in app <ArrowRight size={14} />
          </button>
        ) : null}
        {lesson.guideId ? (
          <button type="button" onClick={() => navigate(`/resources#${lesson.guideId}`)} className={FINELY_OS_PRIMARY_BTN}>
            Field guide <BookOpen size={14} />
          </button>
        ) : null}
        {lesson.resourcePath ? (
          <button type="button" onClick={() => navigate(mapPortalHref(lesson.resourcePath!))} className={FINELY_OS_PRIMARY_BTN}>
            Resources <ExternalLink size={14} />
          </button>
        ) : null}
        {showTourVideos
          ? lesson.tourIds?.map((tid) => (
              <button key={tid} type="button" onClick={() => onOpenTour(tid)} className={FINELY_OS_PRIMARY_BTN}>
                Watch tour <PlayCircle size={14} />
              </button>
            ))
          : null}
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
        <div className={`${finelyOsCatalogCard('violet')} space-y-3`} data-fc-accent="violet">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>Quick check</div>
          <div className={FINELY_OS_ENTITY_BODY}>{lesson.quiz![0]!.question}</div>
          <div className="space-y-1">
            {lesson.quiz![0]!.options.map((opt, i) => (
              <label key={opt} className={`flex items-center gap-2 text-sm ${FINELY_OS_ENTITY_BODY} cursor-pointer`}>
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
  lane?: import('../../../../domain/partners').PartnerLane;
  isAdmin: boolean;
  recipientName?: string;
  onRefresh: () => void;
  onOpenTour: (tourId: string) => void;
  showTourVideos?: boolean;
  mapPortalHref: (href: string) => string;
}) {
  const {
    track,
    modules,
    completed,
    partnerId,
    lane,
    isAdmin,
    recipientName,
    onRefresh,
    onOpenTour,
    showTourVideos = false,
    mapPortalHref,
  } = props;
  const lessons = modules.flatMap((m) => m.lessons.map((l) => ({ module: m, lesson: l })));
  const doneCount = lessons.filter(({ lesson }) => completed.has(lesson.id)).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  const isCore = track.id === CORE_TRACK_ID;

  return (
    <div className={`${finelyOsCatalogCard(catalogAccent(track.accent))} space-y-4`} data-fc-accent={catalogAccent(track.accent)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2">
            {isCore ? <Shield size={18} className="text-emerald-400" /> : <GraduationCap size={18} />}
            <span className={FINELY_OS_ENTITY_SUBLABEL}>{isCore ? 'Required for everyone' : 'Your role track'}</span>
          </div>
          <h3 className={`${FINELY_OS_ENTITY_VALUE} text-xl mt-1`}>{track.title}</h3>
          <p className={`${FINELY_OS_ENTITY_BODY} mt-1 max-w-2xl`}>{track.subtitle}</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black ${FINELY_OS_ENTITY_VALUE}`}>{pct}%</div>
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
                showTourVideos={showTourVideos}
                mapPortalHref={mapPortalHref}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const RUNWAY_NODES: Array<{ id: RunwayView; label: string; accent: 'emerald' | 'violet' | 'sky' }> = [
  { id: 'path', label: 'Learning path', accent: 'emerald' },
  { id: 'certifications', label: 'Certifications', accent: 'violet' },
  { id: 'resources', label: 'Linked courses', accent: 'sky' },
];

export default function PartnerTrainingProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { pathname } = useLocation();
  const showTourVideos = canShowPublicDemoVideos(pathname);
  const [searchParams] = useSearchParams();
  const focusLesson = searchParams.get('focus') ?? searchParams.get('lesson');
  const auth = useAuth();
  const { partner: sessionPartner } = usePartnerSession();
  const partner = useMemo(
    () => (partnerId ? getPartnerSync(partnerId) ?? sessionPartner : sessionPartner),
    [partnerId, sessionPartner],
  );
  const isAdmin = isAdminEmail(auth.user?.email);
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? GraduationCap;
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partner;
  const demoSpec = getWorkspaceProductPageSpec('partner', pageId);

  const [runwayView, setRunwayView] = useState<RunwayView>('path');
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
    if (!partner || isDemo) return null;
    return getTrainingProgress({
      partnerId: partner.id,
      lane: partner.lane,
      isAdmin,
    });
  }, [partner, isAdmin, storeVersion, isDemo]);

  useEffect(() => {
    if (!focusLesson) return;
    const el = document.querySelector(`[data-fc-lesson="${focusLesson}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-emerald-400/60');
    }
  }, [focusLesson, storeVersion, progress?.plan.roleModules.length]);

  const certs = useMemo(
    () => (partner && !isDemo ? listCertificatesByPartner(partner.id) : []),
    [partner, storeVersion, isDemo],
  );
  const previewTour = useMemo(() => (tourId ? getTourById(tourId) : null), [tourId]);
  const completed = useMemo(
    () => new Set(progress?.enrollment.completedLessonIds ?? []),
    [progress?.enrollment.completedLessonIds],
  );

  const coreModules = progress?.plan.coreModules ?? [];
  const roleModules = progress?.plan.roleModules ?? [];
  const coreTrack = progress?.plan.tracks.find((t) => t.role === 'core');
  const roleTracks = progress?.plan.tracks.filter((t) => t.role !== 'core') ?? [];

  const nextLesson = useMemo(() => {
    if (!progress) return null;
    for (const mod of [...coreModules, ...roleModules]) {
      for (const lesson of mod.lessons) {
        if (!completed.has(lesson.id)) return { module: mod, lesson };
      }
    }
    return null;
  }, [progress, coreModules, roleModules, completed]);

  const askFinelyPrompt = 'Which academy lesson should I finish next for my lane?';

  const metrics: ProductMetric[] = [
    {
      label: 'Core',
      value: isDemo ? '42%' : `${progress?.corePct ?? 0}%`,
      hint: 'Required',
      accent: 'emerald',
      icon: Shield,
      onClick: () => setRunwayView('path'),
    },
    {
      label: 'Role',
      value: isDemo ? '18%' : `${progress?.rolePct ?? 0}%`,
      hint: 'Your lane',
      accent: 'sky',
      icon: GraduationCap,
      onClick: () => setRunwayView('path'),
    },
    {
      label: 'Certs',
      value: isDemo ? 1 : certs.length,
      hint: 'Earned',
      accent: 'violet',
      icon: Award,
      onClick: () => setRunwayView('certifications'),
    },
    {
      label: 'Launch courses',
      value: isDemo ? 3 : progress?.plan.launchCourses.length ?? 0,
      hint: 'Linked',
      accent: 'rose',
      icon: Clapperboard,
      onClick: () => setRunwayView('resources'),
    },
  ];

  const runwayBody = (
    <section className="fc-wlp-section space-y-6" data-surface-layout="control-room">
      {!isDemo ? <CommsWorkspaceActions variant="inline" /> : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Core foundation',
            value: isDemo ? '42%' : `${progress?.corePct ?? 0}%`,
            hint: 'Required for everyone',
            accent: 'emerald' as const,
            icon: Shield,
          },
          {
            label: 'Role track',
            value: isDemo ? '18%' : `${progress?.rolePct ?? 0}%`,
            hint: progress?.enrollment.primaryRole.replace(/_/g, ' ') ?? 'Your lane',
            accent: 'violet' as const,
            icon: GraduationCap,
          },
          {
            label: 'Overall',
            value: isDemo ? '30%' : `${progress?.overallPct ?? 0}%`,
            hint: `${progress?.plan.lessonCount ?? 0} lessons`,
            accent: 'sky' as const,
            icon: CheckCircle2,
          },
          {
            label: 'Certificates',
            value: isDemo ? 1 : certs.length,
            hint: 'Earned badges',
            accent: 'rose' as const,
            icon: Award,
          },
        ].map((cell) => {
          const Icon = cell.icon;
          return (
            <div
              key={cell.label}
              className={`${finelyOsCatalogCard(cell.accent)} p-6 lg:p-8 min-h-[140px] flex flex-col justify-between`}
              data-fc-accent={cell.accent}
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Icon size={18} />
              </div>
              <div>
                <div className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{cell.value}</div>
                <div className={`mt-1 font-bold ${FINELY_OS_ENTITY_VALUE}`}>{cell.label}</div>
                <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{cell.hint}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={`${finelyOsCatalogCard(progress?.coreComplete ? 'emerald' : 'rose')} p-6 lg:p-8`}
        data-fc-accent={progress?.coreComplete ? 'emerald' : 'rose'}
        role="alert"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            {progress?.coreComplete ? (
              <CheckCircle2 size={28} className="text-emerald-400 shrink-0" />
            ) : (
              <Lock size={28} className="text-rose-400 shrink-0" />
            )}
            <div>
              <div className="fc-wlp-eyebrow">Academy alert</div>
              <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                {progress?.coreComplete ? 'Core graduate — advanced hubs unlocked' : 'Complete core before mailing disputes'}
              </div>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY} max-w-3xl`}>
                Everyone completes <strong className={FINELY_OS_ENTITY_VALUE}>Core Foundation</strong> (compliance, validation-first
                doctrine, platform safety). Your onboarding lane unlocks a <strong className={FINELY_OS_ENTITY_VALUE}>role track</strong>{' '}
                — partner restore, affiliate, credit specialist, AU seller, business credit, debt validation, admin, or agency.
              </p>
            </div>
          </div>
          {progress && !isDemo ? (
            <div className="flex flex-wrap gap-4 items-center">
              <ProgressRing pct={progress.corePct} label="Core" />
              <ProgressRing pct={progress.rolePct} label="Role" />
              <ProgressRing pct={progress.overallPct} label="Overall" />
            </div>
          ) : null}
        </div>
        {nextLesson && !isDemo ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Next lesson</div>
              <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{nextLesson.lesson.title}</div>
              <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {nextLesson.lesson.estimatedMinutes} min · {nextLesson.module.title}
              </div>
            </div>
            <button
              type="button"
              className={FINELY_OS_PRIMARY_BTN}
              onClick={() => {
                setRunwayView('path');
                document
                  .querySelector(`[data-fc-lesson="${nextLesson.lesson.id}"]`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              Go to lesson <ArrowRight size={14} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative flex flex-wrap items-center gap-2 md:gap-0 md:flex-nowrap">
        {RUNWAY_NODES.map((node, index) => {
          const active = runwayView === node.id;
          return (
            <React.Fragment key={node.id}>
              <button
                type="button"
                onClick={() => setRunwayView(node.id)}
                className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold border transition-all ${
                  active ? 'ring-2 ring-white/20 scale-[1.02]' : 'opacity-80 hover:opacity-100'
                }`}
                data-fcm-accent={node.accent}
                style={{
                  borderColor: `var(--fcm-${node.accent}-border, rgba(255,255,255,0.15))`,
                  background: active ? `var(--fcm-${node.accent}-wash, rgba(255,255,255,0.08))` : 'rgba(255,255,255,0.04)',
                }}
              >
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black"
                  data-fcm-accent={node.accent}
                >
                  {index + 1}
                </span>
                {node.label}
                {node.id === 'certifications' && certs.length ? (
                  <span className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px]">{certs.length}</span>
                ) : null}
              </button>
              {index < RUNWAY_NODES.length - 1 ? (
                <div
                  className="hidden md:block h-1 flex-1 min-w-[40px] mx-2 rounded-full bg-gradient-to-r from-emerald-500/40 via-violet-500/40 to-sky-500/40"
                  aria-hidden
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      {runwayView === 'path' && partner && !isDemo ? (
        <div className="space-y-6 pl-0 md:pl-6 border-l-0 md:border-l-2 md:border-emerald-500/30">
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
              showTourVideos={showTourVideos}
              mapPortalHref={mapPortalHref}
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
                showTourVideos={showTourVideos}
                mapPortalHref={mapPortalHref}
              />
            );
          })}
        </div>
      ) : null}

      {runwayView === 'path' && isDemo ? (
        <div className={`${finelyOsCatalogCard('sky')} p-6 ${FINELY_OS_ENTITY_BODY}`}>
          Demo preview — sign in to walk your real core and role tracks with quizzes, tours, and linked hubs.
        </div>
      ) : null}

      {runwayView === 'certifications' ? (
        <div className="grid md:grid-cols-2 gap-4">
          {certs.length ? (
            certs.map((c, idx) => (
              <div
                key={c.id}
                className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} space-y-3`}
                data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
              >
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
            <div className={`${finelyOsCatalogCard('violet')} ${FINELY_OS_ENTITY_BODY} md:col-span-2`}>
              Complete module lessons to earn certifications. Core compliance and role operator badges appear here
              automatically.
            </div>
          )}
        </div>
      ) : null}

      {runwayView === 'resources' ? (
        <div className="space-y-4">
          <p className={FINELY_OS_ENTITY_BODY}>
            Launch role courses mirror your academy tracks — same SOPs and tours, packaged for quick reference.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {(isDemo
              ? [
                  { id: 'demo-1', accent: 'emerald' as const, role: 'Partner restore', title: 'Restore operator', desc: 'Dispute workflow essentials.', hubPath: '/portal/courses' },
                  { id: 'demo-2', accent: 'violet' as const, role: 'Compliance', title: 'Core compliance', desc: 'Platform safety and validation.', hubPath: '/portal/courses' },
                ]
              : progress?.plan.launchCourses ?? []
            ).map((course) => (
              <div key={course.id} className={`${finelyOsCatalogCard(course.accent)} space-y-3`} data-fc-accent={course.accent}>
                <div className="inline-flex items-center gap-2">
                  <Clapperboard size={16} />
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>{course.role}</span>
                </div>
                <div className={FINELY_OS_ENTITY_VALUE}>{course.title}</div>
                <div className={FINELY_OS_ENTITY_BODY}>{course.desc}</div>
                <button type="button" onClick={() => navigate(mapPortalHref(course.hubPath))} className={FINELY_OS_SUCCESS_BTN}>
                  Open hub <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow={demoSpec?.eyebrow ?? 'Training academy'}
        title={demoSpec?.title ?? 'Deeper certification-style training tracks.'}
        description={
          demoSpec?.description ??
          'Core foundation plus a role track — courses, tours, SOPs, and field guides link from each lesson.'
        }
        status={`${demoSpec?.status ?? 'Core 42% · Role 18%'} · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metrics={metrics}
        metricTitle="Academy progress"
        metricDescription="Walk the runway — core first, then your lane-specific operator track."
        primaryAction={
          <ProductPagePrimaryAction
            label="Open courses LMS"
            onClick={() => navigate(mapPortalHref('/portal/courses'))}
          />
        }
      >
        {runwayBody}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    );
  }

  if (!partner) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="Training academy"
        title="Sign in to start your academy path"
        description="Your lane selects your role track automatically — no separate training signup."
        status="Sign in required"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}
      >
        <div className={FINELY_OS_LUXURY_EMPTY}>
          Sign in and complete onboarding first. There is no separate training signup — your lane selects your track
          automatically.
        </div>
      </ProductHubScaffold>
    );
  }

  return (
    <>
      <ProductHubScaffold
        role={role}
        eyebrow="Training academy"
        title="Your learning path"
        description={`Primary role: ${progress?.enrollment.primaryRole.replace(/_/g, ' ') ?? partner.lane ?? 'partner'} · ${progress?.plan.lessonCount ?? 0} lessons`}
        status={`${progress?.overallPct ?? 0}% overall · live data`}
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metrics={metrics}
        metricTitle="Academy progress"
        metricDescription="Core foundation unlocks advanced hubs — finish lessons in order on the runway."
        primaryAction={
          <ProductPagePrimaryAction
            label="Open courses LMS"
            onClick={() => navigate(mapPortalHref('/portal/courses'))}
          />
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/help-center')}>
            Help center SOPs
          </button>
        }
      >
        {runwayBody}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>

      {showTourVideos ? (
        <FinelyTourPlayer tour={previewTour} open={Boolean(previewTour)} onClose={() => setTourId(null)} />
      ) : null}
    </>
  );
}
