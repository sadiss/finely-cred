import React, { useMemo } from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { BUSINESS_ROADMAP_STEPS, type BusinessRoadmapStepId } from '../../domain/businessCredit';
import { getBusinessCreditProfile, setRoadmapStepDone } from '../../data/businessCreditRepo';

export function BusinessCreditRoadmapPanel({ partnerId }: { partnerId: string }) {
  const profile = useMemo(() => getBusinessCreditProfile(partnerId), [partnerId]);
  const steps = BUSINESS_ROADMAP_STEPS;
  const doneCount = steps.filter((s) => profile.roadmap?.[s.id]?.done).length;
  const pct = Math.round((doneCount / Math.max(1, steps.length)) * 100);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-white/40">A→Z roadmap</div>
          <div className="mt-2 text-white font-semibold">Business Credit Roadmap (guided)</div>
          <div className="mt-1 text-white/60 text-sm">
            Execute in sequence. Keep every “why” collapsed unless you need it — no walls of text.
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Progress</div>
          <div className="mt-1 text-white font-semibold">
            {doneCount}/{steps.length} • {pct}%
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {steps.map((s) => {
          const done = Boolean(profile.roadmap?.[s.id]?.done);
          const Icon = done ? CheckCircle2 : Circle;
          return (
            <details key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <summary className="cursor-pointer select-none px-5 py-4 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <Icon size={18} className={done ? 'text-emerald-400' : 'text-white/35'} />
                    <div className="text-white font-semibold truncate">{s.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRoadmapStepDone({ partnerId, stepId: s.id as BusinessRoadmapStepId, done: !done });
                    }}
                    className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      done
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                        : 'border-white/10 bg-black/30 text-white/70 hover:bg-white/[0.05]'
                    }`}
                    title={done ? 'Mark not done' : 'Mark done'}
                  >
                    {done ? 'Done' : 'Mark done'}
                  </button>
                </div>
              </summary>
              <div className="px-5 pb-5 pt-0 border-t border-white/10">
                <div className="pt-4 text-white/70 text-sm space-y-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Why underwriters care</div>
                    <div className="mt-1">{s.whyItMatters}</div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Do</div>
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-white/75 text-sm">
                        {s.do.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Avoid</div>
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-white/75 text-sm">
                        {s.avoid.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="pt-1">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                      Next action: execute this step <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

