import React from 'react';
import { ArrowRight, BookOpen, ClipboardCheck, Sparkles } from 'lucide-react';
import { KpiCard } from '../../ui/KpiCards';
import { ACADEMY_COURSE_MODULES } from '../../../specialistAcademy/academyWalkthroughs';
import { findAcademyItem, type AcademyItem } from '../../../specialistAcademy/academyCatalog';
import { academyMotionClass, useReducedMotion } from './useReducedMotion';

export function AcademyHubHero({ lang, progressPct }: { lang: 'en' | 'ht'; progressPct: number }) {
  const reduced = useReducedMotion();
  return (
    <div
      className={`relative overflow-hidden rounded-[32px] border border-amber-500/25 fc-panel p-8 md:p-12 ${academyMotionClass(reduced)}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-100 text-[11px] font-black uppercase tracking-widest">
          <Sparkles size={14} /> {lang === 'ht' ? 'Akademi espesyalis' : 'Self-guided training'}
        </div>
        <h2 className="mt-4 text-3xl md:text-4xl font-bold text-white tracking-tight">
          {lang === 'ht' ? 'Aprann restore ak dwa konsomatè' : 'Learn restore with consumer power'}
        </h2>
        <p className="mt-4 text-white/65 text-base leading-relaxed">
          {lang === 'ht'
            ? 'Pwosesis konplè: lekti, ekran demo, egzanp, quiz — Sanz pa bezwen repete debaz yo.'
            : 'Full prose, annotated product walkthroughs (demo data only), examples, and quizzes — so Sanz answers only advanced questions.'}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <div className="h-2 flex-1 max-w-xs rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 academy-progress-pulse transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-amber-200 text-sm font-bold">{progressPct}%</span>
        </div>
      </div>
    </div>
  );
}

export function AcademyModuleGrid({
  lang,
  progress,
  onOpenLesson,
  onOpenQuiz,
}: {
  lang: 'en' | 'ht';
  progress: Set<string>;
  onOpenLesson: (item: AcademyItem) => void;
  onOpenQuiz: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const toneBorder = (t: string) =>
    t === 'gold' ? 'border-amber-500/30 hover:border-amber-500/50' : t === 'emerald' ? 'border-emerald-500/30 hover:border-emerald-500/50' : 'border-violet-500/30 hover:border-violet-500/50';

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {ACADEMY_COURSE_MODULES.map((m, i) => {
        const done = progress.has(m.lessonId);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              const item = findAcademyItem(m.lessonId);
              if (item) onOpenLesson(item);
            }}
            className={`text-left rounded-2xl border bg-black/30 p-5 card-hover academy-card-lift ${toneBorder(m.tone)} ${academyMotionClass(reduced, i % 2 ? '' : 'animate-slide-up-fade')}`}
            style={reduced ? undefined : { animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/45 font-black">
                  Module {i + 1}
                </div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {lang === 'ht' ? m.titleHt : m.titleEn}
                </div>
              </div>
              {done ? <span className="text-emerald-400 text-xs font-bold">✓</span> : null}
            </div>
            <p className="mt-2 text-white/55 text-sm">{lang === 'ht' ? m.blurbHt : m.blurbEn}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-amber-300 text-xs font-semibold">
                <BookOpen size={14} /> {lang === 'ht' ? 'Leson' : 'Lesson'}
              </span>
              {m.quizId ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenQuiz(m.quizId!);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      onOpenQuiz(m.quizId!);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-white/70 text-xs hover:bg-amber-500/20 cursor-pointer"
                >
                  <ClipboardCheck size={14} /> Quiz
                </span>
              ) : null}
              <ArrowRight size={14} className="text-white/30 ml-auto mt-1" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function AcademyHubKpis({
  lessonCount,
  progressPct,
}: {
  lessonCount: number;
  progressPct: number;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Curriculum items" value={lessonCount} hint="Library + SOPs" tone="amber" />
      <KpiCard label="Quizzes" value={4} hint="Pass 75–80%" tone="violet" />
      <KpiCard label="Visual steps" value={9} hint="Restore + debt" tone="emerald" />
      <KpiCard label="Your progress" value={`${progressPct}%`} hint="Lessons marked" tone="amber" />
    </div>
  );
}
