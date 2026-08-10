import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Clock } from 'lucide-react';
import { buildNurtureOpsSnapshot, NURTURE_TIMING_BEST_PRACTICE } from '../../lib/nurtureCadenceReport';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { processDueNurtureSteps } from '../../lib/nurtureEngine';

export function NurtureOpsStrip() {
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const snap = useMemo(() => {
    void tick;
    return buildNurtureOpsSnapshot();
  }, [tick]);

  const commsOn = isFeatureEnabled('commsDelivery');
  const { rollup } = snap;

  return (
    <div className={finelyOsCatalogCardCompact('sky')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>Lead & partner nurture email</div>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Planned cadence lives in nurture sequences. This strip reports what actually sent (local log + cron).
          </p>
        </div>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            try {
              const dryRun = !commsOn;
              const rows = await processDueNurtureSteps({ dryRun });
              setMsg(
                dryRun
                  ? `Dry-run processed ${rows.length} step(s) — enable commsDelivery + Supabase to send live.`
                  : `Processed ${rows.length} step(s).`,
              );
              setTick((t) => t + 1);
            } catch (e) {
              setMsg(e instanceof Error ? e.message : 'Nurture tick failed.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <Clock size={14} /> Run due steps
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={finelyOsMicroStat('emerald')}>
          <Mail size={12} /> Today {rollup.sentToday}
        </span>
        <span className={finelyOsMicroStat('sky')}>7d sent {rollup.sent7d}</span>
        <span className={finelyOsMicroStat('violet')}>14d sent {rollup.sent14d}</span>
        <span className={finelyOsMicroStat('amber')}>7d skipped {rollup.skipped7d}</span>
      </div>

      <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
        Cadence buckets (14d sent): immediate {rollup.byCadenceBucket.immediate} · daily {rollup.byCadenceBucket.daily} ·
        weekly {rollup.byCadenceBucket.weekly} · biweekly {rollup.byCadenceBucket.biweekly} · monthly{' '}
        {rollup.byCadenceBucket.monthly}
      </p>

      {rollup.bySequence.length ? (
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Top sequences: {rollup.bySequence.map((s) => `${s.sequenceId.replace('seq_', '')} (${s.sent})`).join(' · ')}
        </p>
      ) : null}

      {msg ? <p className={`mt-2 text-xs text-sky-200/90`}>{msg}</p> : null}

      <details className="mt-2">
        <summary className={`cursor-pointer text-xs ${FINELY_OS_ENTITY_BODY}`}>Timing best practice (reference)</summary>
        <ul className={`mt-2 list-disc pl-5 text-xs space-y-1 ${FINELY_OS_ENTITY_BODY}`}>
          {NURTURE_TIMING_BEST_PRACTICE.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
