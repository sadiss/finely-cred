import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import {
  ACADEMY_ITEMS,
  TRACK_LABELS,
  findAcademyItem,
  type AcademyItem,
} from '../../specialistAcademy/academyCatalog';
import { AcademyMarkdown } from '../../specialistAcademy/AcademyMarkdown';
import { getAcademyMarkdown, preloadAcademyMarkdown } from '../../specialistAcademy/academyContent';
import {
  academyProgressPercent,
  getAcademyProgress,
  markAcademyItemComplete,
} from '../../specialistAcademy/academyProgress';
import { getQuiz } from '../../specialistAcademy/academyQuizzes';
import { AcademyQuizPanel } from '../../components/training/AcademyQuizPanel';
import { UnifiedTrainingPanel } from '../../components/training/UnifiedTrainingPanel';
import { academyLessonNeighbors } from '../../specialistAcademy/academyNav';
import { AcademyHubHero, AcademyHubKpis, AcademyModuleGrid } from '../../components/training/academy/AcademyHub';
import { AcademyLessonVisuals } from '../../components/training/academy/AcademyLessonVisuals';
import { AcademyLessonToc } from '../../components/training/academy/AcademyLessonToc';
import { AcademyToolbar } from '../../components/training/academy/AcademyToolbar';
import { AcademyNarrateButton } from '../../components/training/academy/AcademyNarrateButton';
import { AcademyFade } from '../../components/training/academy/AcademyMotion';
import { getAcademyReduceMotion, setAcademyReduceMotion } from '../../specialistAcademy/academyMotionPrefs';
import { ensureAcademyTraineeTemplates } from '../../specialistAcademy/academyTraineeComms';
import { academyBaseUrl, type AcademyTraineeEmailEvent } from '../../specialistAcademy/academyTraineeEmailPipeline';
import { dispatchAcademyTraineeNurture } from '../../nurture/nurtureEngine';
import { createLoungePost } from '../../data/specialistLoungeRepo';
import { getAcademyCourseStatus } from '../../specialistAcademy/academyCourseStatus';
import { ACADEMY_COURSE_MODULES } from '../../specialistAcademy/academyWalkthroughs';
import { AcademyMaterialPackSender } from '../../components/training/academy/AcademyMaterialPackSender';
import { AcademyResourcesShelf } from '../../components/training/academy/AcademyResourcesShelf';
import { AcademyCoachChat } from '../../components/training/academy/AcademyCoachChat';
import { buildMaterialPackBody } from '../../specialistAcademy/academyMaterialPack';
import { getAcademyTraineeSettings } from '../../data/settingsRepo';

type Lang = 'en' | 'ht';

export default function AdminSpecialistAcademyPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { itemId, quizId } = useParams<{ itemId?: string; quizId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = (searchParams.get('lang') === 'ht' ? 'ht' : 'en') as Lang;
  const sidebarTab = searchParams.get('tab') === 'quizzes' ? 'quizzes' : 'library';

  const [markdown, setMarkdown] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(() => getAcademyProgress());
  const [reduceMotion, setReduceMotion] = useState(() => getAcademyReduceMotion());

  const active = findAcademyItem(itemId ?? null);
  const quiz = quizId ? getQuiz(quizId) : undefined;
  const traineeEmail = auth.user?.email ?? '';
  const traineeName = auth.user?.email?.split('@')[0] ?? 'Trainee';

  useEffect(() => {
    ensureAcademyTraineeTemplates();
    preloadAcademyMarkdown().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!active || quizId) {
      setMarkdown('');
      return;
    }
    const path = lang === 'ht' && active.pathHt ? active.pathHt : active.pathEn;
    setLoadError(null);
    getAcademyMarkdown(path).then((md) => {
      if (!md) setLoadError(`Content not found: ${path}`);
      else setMarkdown(md);
    });
  }, [active, lang, quizId]);

  const progressPct = useMemo(() => academyProgressPercent(ACADEMY_ITEMS.length, progress), [progress]);
  const courseStatus = useMemo(() => getAcademyCourseStatus(), [progress, quizId, itemId]);

  const emailCtx = useCallback(
    (extra?: Record<string, unknown>) => ({
      trainee: { name: traineeName, email: traineeEmail, lang },
      academy: {
        url: academyBaseUrl(),
        lessonUrl: active ? `${academyBaseUrl()}/${active.id}?lang=${lang}` : academyBaseUrl(),
        quizUrl: quizId ? `${academyBaseUrl()}/quiz/${quizId}?lang=${lang}` : academyBaseUrl(),
        nextUrl: academyBaseUrl(),
      },
      progress: {
        percent: progressPct,
        weekCompleted: progress.size,
        quizzesPassed: courseStatus.quizzesPassed,
      },
      ...extra,
    }),
    [traineeName, traineeEmail, lang, active, quizId, progressPct, progress.size, courseStatus.quizzesPassed],
  );

  const sendTraineeEmail = useCallback(
    async (event: AcademyTraineeEmailEvent, dedupeKey: string, extra?: Record<string, unknown>, dedupeHours?: number) => {
      if (!traineeEmail) return;
      await dispatchAcademyTraineeNurture({
        sequenceId: 'academy_trainee_v1',
        stepId: event,
        event,
        toEmail: traineeEmail,
        toName: traineeName,
        dedupeKey,
        dedupeHours,
        ctx: emailCtx(extra),
      });
    },
    [traineeEmail, traineeName, emailCtx],
  );

  useEffect(() => {
    const hub = !itemId && !quizId;
    if (!hub || !traineeEmail) return;
    void sendTraineeEmail('welcome', `welcome:${traineeEmail}`);
    try {
      const key = `finely.lounge.welcome:${traineeEmail}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        createLoungePost({
          channelId: 'announce',
          authorEmail: traineeEmail,
          authorName: traineeName,
          role: 'trainee',
          body: `Joined Specialist Lounge via Academy — ${lang === 'ht' ? 'bon vwayaj!' : 'welcome aboard!'}`,
        });
      }
    } catch {
      /* ignore */
    }
    const traineeSettings = getAcademyTraineeSettings();
    if (traineeSettings.weeklyDigestEnabled) {
      void sendTraineeEmail('weekly_digest', `weekly_digest:${traineeEmail}`, undefined, 24 * 7);
    }
  }, [itemId, quizId, traineeEmail, sendTraineeEmail]);

  useEffect(() => {
    if (!active || !traineeEmail) return;
    const mod = ACADEMY_COURSE_MODULES.find((m) => m.lessonId === active.id);
    if (!mod) return;
    void sendTraineeEmail(
      'module_started',
      `module_started:${mod.id}:${traineeEmail}`,
      { module: { title: lang === 'ht' ? mod.titleHt : mod.titleEn } },
      24,
    );
  }, [active?.id, traineeEmail, lang, sendTraineeEmail]);

  const setLang = (next: Lang) => {
    const p = new URLSearchParams(searchParams);
    p.set('lang', next);
    setSearchParams(p, { replace: true });
  };

  const setSidebarTab = (tab: 'library' | 'quizzes') => {
    const p = new URLSearchParams(searchParams);
    p.set('tab', tab);
    setSearchParams(p, { replace: true });
  };

  const openItem = (item: AcademyItem) => {
    navigate(`/admin/specialist-academy/${item.id}?lang=${lang}&tab=library`);
  };

  const openQuiz = (id: string) => {
    navigate(`/admin/specialist-academy/quiz/${id}?lang=${lang}&tab=quizzes`);
  };

  const markDone = () => {
    if (!active) return;
    const isNew = markAcademyItemComplete(active.id);
    setProgress(getAcademyProgress());
    if (!isNew || !traineeEmail) return;
    const takeaway = window.prompt(lang === 'ht' ? 'Pataje yon takeaway nan Lounge? (optional)' : 'Share one takeaway to the Lounge? (optional)');
    if (takeaway?.trim()) {
      createLoungePost({
        channelId: 'module_huddle',
        authorEmail: traineeEmail,
        authorName: traineeName,
        role: 'trainee',
        body: takeaway.trim(),
        moduleLessonId: active.id,
      });
    }
    const mod = ACADEMY_COURSE_MODULES.find((m) => m.lessonId === active.id);
    void sendTraineeEmail(
      'module_completed',
      `module_completed:${active.id}:${traineeEmail}`,
      { module: { title: mod ? (lang === 'ht' ? mod.titleHt : mod.titleEn) : active.title } },
    );
    const status = getAcademyCourseStatus();
    if (status.complete) {
      void sendTraineeEmail('course_complete', `course_complete:${traineeEmail}`);
      void sendTraineeEmail(
        'material_pack',
        `material_pack_auto:${traineeEmail}`,
        { materialPack: { body: buildMaterialPackBody(lang) } },
      );
    }
  };

  const hub = !itemId && !quizId;
  const neighbors = useMemo(() => academyLessonNeighbors(itemId), [itemId]);

  const title = quiz ? quiz.title : hub ? 'Specialist Academy' : active?.title ?? 'Lesson';

  const toggleReduceMotion = () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    setAcademyReduceMotion(next);
  };

  const narrateText = useMemo(() => {
    if (!markdown) return '';
    return markdown
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*/g, '')
      .slice(0, 3500);
  }, [markdown]);

  return (
    <div className={`academy-lms ${reduceMotion ? 'academy-reduce-motion' : ''}`}>
      <PageShell
        badge="Official course library"
        title={title}
        subtitle={
          hub
            ? 'Interactive restore training — motion walkthroughs, progress, quizzes, trainee emails (when enabled).'
            : quiz
              ? 'Assessment gate — reinforces rights & process'
              : TRACK_LABELS[active?.track ?? 'F']
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 max-w-7xl mx-auto">
          <button
            type="button"
            onClick={() => {
              if (hub) navigate('/admin');
              else navigate(`/admin/specialist-academy?lang=${lang}&tab=${sidebarTab}`);
            }}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} /> {hub ? 'Admin dashboard' : 'Course home'}
          </button>
          <AcademyToolbar
            lang={lang}
            setLang={setLang}
            progressPct={progressPct}
            reduceMotion={reduceMotion}
            onToggleReduceMotion={toggleReduceMotion}
          />
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start max-w-7xl mx-auto">
          <UnifiedTrainingPanel
            lang={lang}
            progress={progress}
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            onOpenLesson={openItem}
            onOpenQuiz={openQuiz}
            activeLessonId={itemId}
            activeQuizId={quizId}
          />

          <main className="min-w-0">
            {!ready ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-10 text-center text-white/60 fc-panel">Loading course…</div>
            ) : hub ? (
              <AcademyFade reduceMotion={reduceMotion} className="space-y-8">
                <AcademyHubHero lang={lang} progressPct={progressPct} />
                <AcademyHubKpis lessonCount={ACADEMY_ITEMS.length} progressPct={progressPct} />
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">Course modules</h2>
                  <AcademyModuleGrid
                    lang={lang}
                    progress={progress}
                    onOpenLesson={openItem}
                    onOpenQuiz={openQuiz}
                  />
                </div>
                {courseStatus.complete ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-100 text-sm academy-foil-border">
                    Core path complete — schedule Haitian desk shadowing and live scrubbed file practice with your coach.
                  </div>
                ) : null}
                <AcademyCoachChat lang={lang} />
                <AcademyResourcesShelf lang={lang} />
                <AcademyMaterialPackSender lang={lang} />
                <button
                  type="button"
                  onClick={() => navigate(`/admin/specialist-lounge?lang=${lang}&ch=general`)}
                  className="w-full rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-emerald-500/10 p-5 text-left card-hover"
                >
                  <div className="text-amber-100 font-bold text-lg">Enter Specialist Lounge →</div>
                  <p className="mt-1 text-white/60 text-sm">Hangout, Ask the Desk, wins, meeting lobby — course-adjacent social OS.</p>
                </button>
              </AcademyFade>
            ) : quizId && !quiz ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">Quiz not found.</div>
            ) : quiz ? (
              <div className="rounded-[28px] border border-white/10 bg-[#070b09]/80 backdrop-blur-xl p-6 md:p-10 academy-foil-border">
                <AcademyQuizPanel
                  quiz={quiz}
                  lang={lang}
                  reduceMotion={reduceMotion}
                  onFinished={({ passed, score }) => {
                    if (!traineeEmail) return;
                    const qTitle = quiz.title;
                    if (passed) {
                      void sendTraineeEmail(
                        'quiz_passed',
                        `quiz_passed:${quiz.id}:${traineeEmail}`,
                        { quiz: { title: qTitle, score, passPercent: quiz.passPercent } },
                      );
                    } else {
                      void sendTraineeEmail(
                        'quiz_retry',
                        `quiz_retry:${quiz.id}:${score}:${traineeEmail}`,
                        { quiz: { title: qTitle, score, passPercent: quiz.passPercent } },
                        12,
                      );
                    }
                    const status = getAcademyCourseStatus();
                    if (status.complete) {
                      void sendTraineeEmail('course_complete', `course_complete:${traineeEmail}`);
                      void sendTraineeEmail(
                        'material_pack',
                        `material_pack_auto:${traineeEmail}`,
                        { materialPack: { body: buildMaterialPackBody(lang) } },
                      );
                    }
                  }}
                />
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">{loadError}</div>
            ) : (
              <div className="grid xl:grid-cols-[1fr_220px] gap-6 items-start">
                <div className="rounded-[28px] border border-white/10 bg-[#070b09]/80 backdrop-blur-xl p-6 md:p-10 shadow-2xl shadow-black/30 academy-foil-border min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-widest font-black">
                      <BookOpen size={14} /> {active?.minutes ? `~${active.minutes} min` : 'Lesson'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AcademyNarrateButton text={narrateText} lang={lang} />
                      <button
                        type="button"
                        onClick={markDone}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
                      >
                        <CheckCircle2 size={14} /> Mark complete
                      </button>
                    </div>
                  </div>
                  <AcademyFade reduceMotion={reduceMotion}>
                    <AcademyMarkdown markdown={markdown} />
                  </AcademyFade>
                  <AcademyLessonVisuals lessonId={active?.id} lang={lang} reduceMotion={reduceMotion} />
                  {(neighbors.prev || neighbors.next) && (
                    <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap gap-3 justify-between">
                      {neighbors.prev ? (
                        <button
                          type="button"
                          onClick={() => openItem(neighbors.prev!)}
                          className="text-left px-4 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.04] text-sm text-white/80 max-w-[48%] card-hover"
                        >
                          <span className="text-[10px] uppercase tracking-widest text-white/40 font-black">Previous</span>
                          <div className="mt-1 font-semibold text-white">{neighbors.prev.title}</div>
                        </button>
                      ) : (
                        <span />
                      )}
                      {neighbors.next ? (
                        <button
                          type="button"
                          onClick={() => openItem(neighbors.next!)}
                          className="text-right px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 text-sm max-w-[48%] card-hover"
                        >
                          <span className="text-[10px] uppercase tracking-widest text-amber-200/70 font-black">Next</span>
                          <div className="mt-1 font-semibold text-amber-50">{neighbors.next.title}</div>
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
                <AcademyLessonToc markdown={markdown} reduceMotion={reduceMotion} />
              </div>
            )}
          </main>
        </div>
      </PageShell>
    </div>
  );
}
