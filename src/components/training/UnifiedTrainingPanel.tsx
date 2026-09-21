import React from 'react';
import { BookOpen, ClipboardCheck, GraduationCap } from 'lucide-react';
import { ACADEMY_GROUPS, ACADEMY_ITEMS, TRACK_LABELS, type AcademyItem } from '../../specialistAcademy/academyCatalog';
import { ACADEMY_QUIZZES } from '../../specialistAcademy/academyQuizzes';
import { getQuizPasses } from './AcademyQuizPanel';

type Tab = 'library' | 'quizzes';

export function UnifiedTrainingPanel({
  lang,
  progress,
  activeTab,
  onTabChange,
  onOpenLesson,
  onOpenQuiz,
  activeLessonId,
  activeQuizId,
}: {
  lang: 'en' | 'ht';
  progress: Set<string>;
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  onOpenLesson: (item: AcademyItem) => void;
  onOpenQuiz: (quizId: string) => void;
  activeLessonId?: string | null;
  activeQuizId?: string | null;
}) {
  const quizPasses = getQuizPasses();

  return (
    <aside className="lg:sticky lg:top-24 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto fc-scroll-area pr-1">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-2 flex gap-1">
        <button
          type="button"
          onClick={() => onTabChange('library')}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
            activeTab === 'library' ? 'bg-amber-500 text-black' : 'text-white/60'
          }`}
        >
          <BookOpen size={14} /> Library
        </button>
        <button
          type="button"
          onClick={() => onTabChange('quizzes')}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
            activeTab === 'quizzes' ? 'bg-amber-500 text-black' : 'text-white/60'
          }`}
        >
          <ClipboardCheck size={14} /> Quizzes
        </button>
      </div>

      {activeTab === 'library' ? (
        <>
          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-4">
            <div className="flex items-center gap-2 text-violet-100 font-semibold text-sm">
              <GraduationCap size={16} /> Consumer-power curriculum
            </div>
            <p className="mt-2 text-white/60 text-xs leading-relaxed">
              Teach rights + how reporting really works. Start with <strong className="text-white/80">f-consumer-power</strong> in Track F.
            </p>
          </div>
          {ACADEMY_GROUPS.map((g) => (
            <div key={g.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="text-[10px] uppercase tracking-widest text-white/45 font-black px-1 mb-2">
                {lang === 'ht' && g.labelHt ? g.labelHt : g.label}
              </div>
              <div className="space-y-1">
                {g.items.map((item) => {
                  const done = progress.has(item.id);
                  const isActive = item.id === activeLessonId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onOpenLesson(item)}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all ${
                        isActive
                          ? 'border-amber-500/35 bg-amber-500/10 text-amber-100'
                          : 'border-transparent text-white/70 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="leading-snug">{lang === 'ht' && item.titleHt ? item.titleHt : item.title}</span>
                      {done ? <span className="ml-2 text-emerald-400 text-[10px]">✓</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-white/55 text-xs px-1">
            Multi-question checks — pass {ACADEMY_QUIZZES[0]?.passPercent ?? 80}%+ on methodology & compliance.
          </p>
          {ACADEMY_QUIZZES.map((quiz) => {
            const pass = quizPasses[quiz.id];
            const isActive = quiz.id === activeQuizId;
            return (
              <button
                key={quiz.id}
                type="button"
                onClick={() => onOpenQuiz(quiz.id)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  isActive ? 'border-amber-500/35 bg-amber-500/10' : 'border-white/10 bg-black/25 hover:bg-white/[0.03]'
                }`}
              >
                <div className="text-white font-semibold text-sm">
                  {lang === 'ht' && quiz.titleHt ? quiz.titleHt : quiz.title}
                </div>
                <div className="mt-1 text-white/50 text-xs">{quiz.questions.length} questions · pass {quiz.passPercent}%</div>
                {pass?.passed ? (
                  <div className="mt-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">Passed {pass.score}%</div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
      <div className="text-[10px] text-white/40 px-2 leading-relaxed">
        {ACADEMY_ITEMS.length} lessons · {TRACK_LABELS.H} · {TRACK_LABELS.F}
      </div>
    </aside>
  );
}
