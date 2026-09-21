import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, GraduationCap, Languages, Map } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import {
  ACADEMY_GROUPS,
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

type Lang = 'en' | 'ht';

export default function AdminSpecialistAcademyPage() {
  const navigate = useNavigate();
  const { itemId, quizId } = useParams<{ itemId?: string; quizId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = (searchParams.get('lang') === 'ht' ? 'ht' : 'en') as Lang;
  const sidebarTab = searchParams.get('tab') === 'quizzes' ? 'quizzes' : 'library';

  const [markdown, setMarkdown] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(() => getAcademyProgress());

  const active = findAcademyItem(itemId ?? null);
  const quiz = quizId ? getQuiz(quizId) : undefined;

  useEffect(() => {
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
    markAcademyItemComplete(active.id);
    setProgress(getAcademyProgress());
  };

  const hub = !itemId && !quizId;

  const title = quiz ? quiz.title : hub ? 'Specialist Academy' : active?.title ?? 'Lesson';

  return (
    <PageShell
      badge="Specialist Academy"
      title={title}
      subtitle={
        hub
          ? 'Consumer-power restore training — methodology, compliance law, quizzes, BUILD.'
          : quiz
            ? 'Multi-question assessment — reinforces rights & process'
            : TRACK_LABELS[active?.track ?? 'F']
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            if (hub) navigate('/admin');
            else navigate(`/admin/specialist-academy?lang=${lang}&tab=${sidebarTab}`);
          }}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} /> {hub ? 'Admin dashboard' : 'Academy home'}
        </button>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-[10px] font-black uppercase tracking-widest text-white/60">
            <GraduationCap size={14} className="text-amber-300" />
            Progress {progressPct}%
          </div>
          <div className="inline-flex rounded-xl border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest ${lang === 'en' ? 'bg-amber-500 text-black' : 'bg-black/30 text-white/70'}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ht')}
              className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 ${lang === 'ht' ? 'bg-amber-500 text-black' : 'bg-black/30 text-white/70'}`}
            >
              <Languages size={12} /> HT
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
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
            <div className="rounded-2xl border border-white/10 bg-black/30 p-10 text-center text-white/60">Loading academy…</div>
          ) : hub ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Kpi label="Lessons & SOPs" value={String(ACADEMY_ITEMS.length)} hint="Library" tone="amber" />
                <Kpi label="Quizzes" value="4" hint="8–10 Q each" tone="violet" />
                <Kpi label="Track H" value="9" hint="Compliance" tone="emerald" />
                <Kpi label="Track F" value="9" hint="Methodology" tone="emerald" />
                <Kpi label="Progress" value={`${progressPct}%`} hint="Lessons read" tone="amber" />
              </div>
              <button
                type="button"
                onClick={() => openItem(ACADEMY_ITEMS.find((x) => x.id === 'f-consumer-power')!)}
                className="w-full rounded-2xl border border-violet-500/25 bg-violet-500/10 p-5 text-left hover:bg-violet-500/15 transition-all"
              >
                <div className="text-violet-100 font-semibold">Start here: Consumer power & system mechanics</div>
                <p className="mt-2 text-white/65 text-sm">Furnishers, bureaus, e-OSCAR, Metro 2, validation rights—then Track F.</p>
              </button>
              <button
                type="button"
                onClick={() => openQuiz('methodology')}
                className="w-full rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-left hover:bg-amber-500/15 transition-all"
              >
                <div className="text-amber-100 font-semibold">Take the methodology quiz (10 questions)</div>
              </button>
              <button
                type="button"
                onClick={() => openItem(ACADEMY_ITEMS.find((x) => x.id === 'workflow')!)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 p-5 text-left hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Map size={18} /> Workflow map
                </div>
              </button>
            </div>
          ) : quizId && !quiz ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">Quiz not found.</div>
          ) : quiz ? (
            <div className="rounded-[28px] border border-white/10 bg-[#070b09]/80 backdrop-blur-xl p-6 md:p-10">
              <AcademyQuizPanel quiz={quiz} lang={lang} />
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">{loadError}</div>
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-[#070b09]/80 backdrop-blur-xl p-6 md:p-10 shadow-2xl shadow-black/30">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-widest font-black">
                  <BookOpen size={14} /> {active?.minutes ? `~${active.minutes} min read` : 'Lesson'}
                </div>
                <button
                  type="button"
                  onClick={markDone}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
                >
                  <CheckCircle2 size={14} /> Mark complete
                </button>
              </div>
              <AcademyMarkdown markdown={markdown} />
            </div>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: 'amber' | 'violet' | 'emerald';
}) {
  const border =
    tone === 'amber' ? 'border-amber-500/25 bg-amber-500/10' : tone === 'violet' ? 'border-violet-500/25 bg-violet-500/10' : 'border-emerald-500/25 bg-emerald-500/10';
  return (
    <div className={`rounded-2xl border p-4 ${border}`}>
      <div className="text-[10px] uppercase tracking-widest text-white/50 font-black">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      {hint ? <div className="mt-1 text-white/50 text-xs">{hint}</div> : null}
    </div>
  );
}
