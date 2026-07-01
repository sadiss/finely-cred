import React, { useState } from 'react';
import { FlaskConical, Trophy } from 'lucide-react';
import { createHookExperiment, pickExperimentWinner } from '../../lib/cmoPhase3/cmoExperimentEngine';
import { listCmoExperiments } from '../../data/cmoPhase3Repo';
import type { CmoExperiment } from '../../domain/cmoPhase3';

const DEFAULT_HOOKS = [
  'Business funding is not the problem. Being unprepared is.',
  'Before you apply for funding, check these five silent deal killers.',
  'Your credit profile may be talking lenders out of saying yes.',
  'Stop guessing. Get a funding readiness roadmap first.',
  'Most business owners chase money before their file is ready. Expensive little circus.',
];

export function CmoExperimentLab() {
  const [experiments, setExperiments] = useState<CmoExperiment[]>(() => listCmoExperiments());
  const create = () => {
    createHookExperiment({
      name: 'Funding Readiness Hook Test',
      channel: 'youtube_shorts',
      audience: 'business owners',
      offer: 'funding readiness review',
      hooks: DEFAULT_HOOKS,
    });
    setExperiments(listCmoExperiments());
  };
  return (
    <section className="fc-panel p-5 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Experiment Lab</p>
          <h2 className="text-2xl font-semibold text-white">A/B testing and creative memory</h2>
          <p className="mt-2 text-sm text-slate-300">The CMO tests hooks, watches winners, and turns results into the next creative move.</p>
        </div>
        <button type="button" className="fc-button-brand inline-flex items-center gap-2" onClick={create}><FlaskConical className="h-4 w-4" /> Create hook test</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {experiments.map((experiment) => {
          const winner = pickExperimentWinner(experiment.variants);
          return (
            <article key={experiment.id} className="fc-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">{experiment.name}</h3>
                <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300">{experiment.status}</span>
              </div>
              <p className="text-sm text-slate-300">{experiment.hypothesis}</p>
              <div className="space-y-2">
                {experiment.variants.map((variant) => (
                  <div key={variant.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
                    <div className="flex items-start justify-between gap-3"><span>{variant.hook}</span><strong className="text-amber-100">{variant.score150}</strong></div>
                  </div>
                ))}
              </div>
              <p className="flex items-center gap-2 text-sm text-amber-100"><Trophy className="h-4 w-4" />{winner ? `Current winner: ${winner.label}` : experiment.recommendation}</p>
            </article>
          );
        })}
        {!experiments.length ? <div className="fc-card p-6 text-sm text-slate-300">No experiments yet. Create one and let the CMO stop guessing in public.</div> : null}
      </div>
    </section>
  );
}
