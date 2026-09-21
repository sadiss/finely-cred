import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import type { AcademyQuiz } from '../../specialistAcademy/academyQuizzes';

const QUIZ_PROGRESS_KEY = 'finely.specialistAcademy.quiz.v1';

export function getQuizPasses(): Record<string, { passed: boolean; score: number; at: string }> {
  try {
    return JSON.parse(localStorage.getItem(QUIZ_PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveQuizPass(quizId: string, score: number, passed: boolean) {
  const all = getQuizPasses();
  all[quizId] = { passed, score, at: new Date().toISOString() };
  localStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(all));
}

export function AcademyQuizPanel({
  quiz,
  lang,
}: {
  quiz: AcademyQuiz;
  lang: 'en' | 'ht';
}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const q = quiz.questions[idx];
  const total = quiz.questions.length;

  const score = useMemo(() => {
    let correct = 0;
    for (const question of quiz.questions) {
      if (answers[question.id] === question.answerIndex) correct += 1;
    }
    return Math.round((correct / total) * 100);
  }, [answers, quiz.questions, total]);

  const passed = score >= quiz.passPercent;

  const prompt = lang === 'ht' && q.promptHt ? q.promptHt : q.prompt;
  const choices = lang === 'ht' && q.choicesHt ? q.choicesHt : q.choices;
  const explain = lang === 'ht' && q.explainHt ? q.explainHt : q.explain;

  const pick = (choiceIndex: number) => {
    setAnswers((prev) => ({ ...prev, [q.id]: choiceIndex }));
  };

  const next = () => {
    if (idx < total - 1) setIdx(idx + 1);
    else {
      let correct = 0;
      for (const question of quiz.questions) {
        if (answers[question.id] === question.answerIndex) correct += 1;
      }
      const finalScore = Math.round((correct / total) * 100);
      const didPass = finalScore >= quiz.passPercent;
      setDone(true);
      saveQuizPass(quiz.id, finalScore, didPass);
    }
  };

  const reset = () => {
    setIdx(0);
    setAnswers({});
    setDone(false);
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center space-y-4">
        <div className={`text-4xl font-bold ${passed ? 'text-emerald-300' : 'text-amber-300'}`}>{score}%</div>
        <div className="text-white font-semibold text-lg">
          {passed ? 'Passed — great work.' : `Keep studying — pass mark is ${quiz.passPercent}%.`}
        </div>
        <p className="text-white/60 text-sm max-w-md mx-auto">
          Educational quiz only. Passing does not certify legal outcomes or funding approval.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 text-sm"
        >
          <RotateCcw size={16} /> Retake
        </button>
      </div>
    );
  }

  const selected = answers[q.id];
  const answered = selected !== undefined;
  const correct = answered && selected === q.answerIndex;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/50 font-black">
        <span>Question {idx + 1} of {total}</span>
        <span>{quiz.title}</span>
      </div>
      <h2 className="text-xl font-semibold text-white leading-snug">{prompt}</h2>
      <div className="space-y-3">
        {choices.map((choice, i) => {
          const isSel = selected === i;
          let tone = 'border-white/10 bg-black/20 hover:bg-white/[0.04]';
          if (answered) {
            if (i === q.answerIndex) tone = 'border-emerald-500/40 bg-emerald-500/10';
            else if (isSel) tone = 'border-rose-500/40 bg-rose-500/10';
          } else if (isSel) tone = 'border-amber-500/40 bg-amber-500/10';
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => pick(i)}
              className={`w-full text-left rounded-2xl border p-4 text-white/80 transition-all ${tone}`}
            >
              {choice}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`rounded-2xl border p-4 flex gap-3 ${correct ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
          {correct ? <CheckCircle2 className="text-emerald-300 shrink-0" /> : <XCircle className="text-amber-300 shrink-0" />}
          <p className="text-white/75 text-sm leading-relaxed">{explain}</p>
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!answered}
          onClick={next}
          className="px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] disabled:opacity-40"
        >
          {idx < total - 1 ? 'Next' : 'Finish quiz'}
        </button>
      </div>
    </div>
  );
}
