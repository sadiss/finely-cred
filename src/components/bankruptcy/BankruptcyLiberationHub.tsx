import React, { useState } from 'react';
import { ArrowRight, Heart, Home, Scale, Shield, Sparkles, Zap } from 'lucide-react';
import { BANKRUPTCY_LIBERATION_SCENARIOS, HOME_RETENTION_DEEP_DIVE, type BankruptcyLiberationScenario } from '../../legal/bankruptcyLiberationPaths';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  save_home_foreclosure: Home,
  fresh_start_ch7: Sparkles,
  ch13_catch_up: Home,
  stop_harassment: Shield,
  business_reorg: Scale,
  fix_credit_after: Heart,
};

type Props = {
  onAskCoach: (prompt: string) => void;
  onSelectScenario?: (id: string) => void;
};

export function BankruptcyLiberationHub({ onAskCoach, onSelectScenario }: Props) {
  const [active, setActive] = useState<BankruptcyLiberationScenario | null>(BANKRUPTCY_LIBERATION_SCENARIOS[0] ?? null);
  const [showDeep, setShowDeep] = useState(false);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/10 via-violet-500/5 to-black/40 p-5">
        <div className="flex items-center gap-2 text-sky-300 text-[10px] font-black uppercase tracking-widest">
          <Zap size={14} /> Liberation paths
        </div>
        <h2 className="mt-2 text-xl font-black text-white">What situation are you in?</h2>
        <p className="mt-2 text-sm text-white/60 max-w-2xl">
          Pick your scenario — not a endless checklist. Each path gives you clarity, next moves, and a coach who specializes in that fight.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {BANKRUPTCY_LIBERATION_SCENARIOS.map((s) => {
          const Icon = ICONS[s.id] ?? Scale;
          const selected = active?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActive(s);
                onSelectScenario?.(s.id);
              }}
              className={`text-left rounded-2xl border p-4 transition ${
                selected
                  ? 'border-sky-400/50 bg-sky-500/15 shadow-lg shadow-sky-900/20'
                  : 'border-white/10 bg-black/30 hover:border-sky-500/30'
              }`}
            >
              <Icon size={20} className={selected ? 'text-sky-300' : 'text-white/50'} />
              <div className="mt-3 font-bold text-white">{s.title}</div>
              <div className="mt-1 text-xs text-white/50 line-clamp-2">{s.headline}</div>
              {s.urgency === 'critical' ? (
                <span className="mt-2 inline-block rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-rose-200">
                  Time-sensitive
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {active ? (
        <div className="rounded-2xl border border-white/10 bg-black/35 p-5 space-y-4">
          <div>
            <h3 className="text-lg font-black text-white">{active.headline}</h3>
            <p className="mt-2 text-sm text-sky-100/80 leading-relaxed">{active.feeling}</p>
          </div>
          <ol className="space-y-2">
            {active.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-white/75">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10 text-xs font-bold text-sky-200">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="fc-button-brand" onClick={() => onAskCoach(active.coachPrompt)}>
              Ask your specialist <ArrowRight size={14} />
            </button>
            {active.id === 'save_home_foreclosure' || active.id === 'ch13_catch_up' ? (
              <button type="button" className="fc-button-soft" onClick={() => setShowDeep((v) => !v)}>
                {showDeep ? 'Hide' : 'Show'} home retention deep dive
              </button>
            ) : null}
          </div>
          {showDeep ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-4">
              <h4 className="font-bold text-amber-100">{HOME_RETENTION_DEEP_DIVE.title}</h4>
              {HOME_RETENTION_DEEP_DIVE.sections.map((sec) => (
                <div key={sec.heading}>
                  <div className="text-sm font-semibold text-white/90">{sec.heading}</div>
                  <ul className="mt-1 text-sm text-white/60 list-disc pl-5 space-y-1">
                    {sec.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
