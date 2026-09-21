import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS_CREDIT_JOURNEY_STEPS } from '../../domain/businessCreditJourney';
import { getJourneyProgress, journeyPercentComplete } from '../../data/businessCreditJourneyProgress';

/** Staff view — same 7 steps as public /business-credit journey. */
export function BusinessCreditJourneyCoachPanel() {
  const [version, setVersion] = useState(0);
  const progress = useMemo(() => getJourneyProgress(), [version]);
  const pct = useMemo(() => journeyPercentComplete(), [version]);

  React.useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  return (
    <div className="rounded-3xl border border-[#fbbf24]/30 bg-[#0b1110] p-6 space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#fbbf24]">Client coach map</div>
          <div className="text-white font-semibold text-lg">Business credit journey (public parity)</div>
          <p className="text-white/65 text-sm mt-1">
            Same steps as{' '}
            <Link to="/business-credit" className="text-[#fbbf24] underline">/business-credit</Link> — use in calls.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/45">Local progress</div>
          <div className="text-2xl font-bold text-[#fbbf24]">{pct}%</div>
        </div>
      </div>
      <ol className="space-y-2">
        {BUSINESS_CREDIT_JOURNEY_STEPS.map((s) => (
          <li
            key={s.id}
            className={`rounded-xl border px-4 py-3 text-sm ${
              progress.completed[s.id]
                ? 'border-emerald-500/30 bg-emerald-500/5 text-white/85'
                : 'border-white/10 bg-black/30 text-white/70'
            }`}
          >
            <span className="font-semibold text-white">Step {s.step}:</span> {s.title}
          </li>
        ))}
      </ol>
    </div>
  );
}
