import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  countAutomationExceptions,
  getWhileYouSleptSummary,
  isGrowthAutopilotEnabled,
  runGrowthAutopilotTick,
  setGrowthAutopilotEnabled,
} from '../../lib/finelyAutomationOrchestrator';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../os/finelyOsLightUi';

/** Compact autopilot state for Marketing Department hub. */
export function MarketingAutopilotStrip() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);

  const enabled = useMemo(() => {
    void tick;
    return isGrowthAutopilotEnabled();
  }, [tick]);

  const summary = useMemo(() => {
    void tick;
    return getWhileYouSleptSummary();
  }, [tick]);

  const exceptions = useMemo(() => {
    void tick;
    return countAutomationExceptions();
  }, [tick]);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void runGrowthAutopilotTick();
  }, [enabled]);

  const toggle = () => {
    setGrowthAutopilotEnabled(!enabled);
    setTick((t) => t + 1);
  };

  const runNow = async () => {
    setBusy(true);
    try {
      await runGrowthAutopilotTick({ force: true });
    } finally {
      setBusy(false);
      setTick((t) => t + 1);
    }
  };

  return (
    <div className={finelyOsCatalogCardCompact('violet')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-200/80">Growth autopilot</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {enabled ? 'On — daily find, nurture, agent reviews' : 'Off — manual runs only'}
          </p>
          <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {summary.summaryLine || 'No overnight summary yet.'}
          </p>
          {exceptions > 0 ? (
            <span className={`mt-2 inline-block ${FINELY_OS_ENTITY_CHIP}`}>{exceptions} exception(s) need review</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={toggle}>
            {enabled ? 'Turn off' : 'Turn on'}
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={() => void runNow()}>
            {busy ? 'Running…' : 'Run tick now'}
          </button>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => navigate('/admin/growth-automation')}
          >
            Full console
          </button>
        </div>
      </div>
    </div>
  );
}
