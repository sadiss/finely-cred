import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  countAutomationExceptions,
  getWhileYouSleptSummary,
  isGrowthAutopilotEnabled,
  runGrowthAutopilotTick,
  setGrowthAutopilotEnabled,
} from '../../lib/finelyAutomationOrchestrator';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';
import {
  MARKETING_HUB_CONTENT_SHELL,
  MarketingKpiChip,
  MarketingOnOffTile,
  MarketingSectionHeader,
} from './marketingHubUi';

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
    <div className={MARKETING_HUB_CONTENT_SHELL}>
      <MarketingSectionHeader
        eyebrow="Daily growth"
        title="Growth autopilot"
        subtitle="Green = scheduler running overnight. Red = you run everything manually."
        helpId={enabled ? 'autopilot_on' : 'autopilot_off'}
      />
      <div className="grid lg:grid-cols-[1.1fr_1fr_auto] gap-3 items-stretch">
        <MarketingOnOffTile
          on={enabled}
          title={enabled ? 'Autopilot is running for you' : 'Autopilot is paused'}
          subtitle={summary.summaryLine || 'Tap to toggle — or use the buttons on the right.'}
          helpId={enabled ? 'autopilot_on' : 'autopilot_off'}
          onClick={toggle}
        />
        <div className="grid grid-cols-2 gap-2">
          <MarketingKpiChip
            label="Exceptions"
            value={String(exceptions)}
            accent={exceptions > 0 ? 'amber' : 'emerald'}
            helpId="exceptions"
            purpose={exceptions > 0 ? 'Needs review' : 'All clear'}
          />
          <MarketingKpiChip
            label="Nurture"
            value="Email $0"
            accent="sky"
            helpId="nurture_active"
            purpose="Sequences wired"
          />
        </div>
        <div className="flex flex-col gap-2 justify-center">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={toggle}>
            {enabled ? 'Turn off' : 'Turn on'}
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={() => void runNow()}>
            {busy ? 'Running…' : 'Run tick now'}
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-automation')}>
            Full console
          </button>
        </div>
      </div>
      <p className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
        Purpose: keep find + nurture moving while you sleep — without surprise SMS cost.
      </p>
    </div>
  );
}
