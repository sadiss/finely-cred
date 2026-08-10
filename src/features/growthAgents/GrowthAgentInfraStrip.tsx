import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { isSerperSearchMarkedOk } from './growthFindTest';
import {
  getLastGrowthWorkerProbe,
  runGrowthWorkerTickTest,
  workerModeChipTone,
  workerModeLabel,
  type GrowthWorkerTickResult,
} from './growthWorkerTick';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

function flagChip(on: boolean, label: string) {
  return <span className={finelyOsStatusChip(on ? 'ok' : 'warn')}>{label}</span>;
}

function workerStatusChip(mode: string | undefined) {
  const tone = workerModeChipTone(mode);
  const label = workerModeLabel(mode);
  return <span className={finelyOsStatusChip(tone)}>{label}</span>;
}

function formatWorkerJson(result: GrowthWorkerTickResult | null): string {
  if (!result) return '';
  const slice = {
    ok: result.ok,
    mode: result.mode,
    message: result.message,
    processed: result.processed,
    ...(result.payload?.resultCount != null ? { resultCount: result.payload.resultCount } : {}),
    ...(result.payload?.jobId ? { jobId: result.payload.jobId } : {}),
  };
  return JSON.stringify(slice);
}

type GrowthAgentInfraStripProps = {
  /** One-line worker hint in shell sidebars — no duplicate Test worker button */
  compactWorkerLine?: boolean;
};

export function GrowthAgentInfraStrip({ compactWorkerLine = false }: GrowthAgentInfraStripProps) {
  const [tick, setTick] = useState(0);
  const [workerTesting, setWorkerTesting] = useState(false);
  const [workerResult, setWorkerResult] = useState<GrowthWorkerTickResult | null>(null);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const serperOk = useMemo(() => {
    void tick;
    return isSerperSearchMarkedOk();
  }, [tick]);

  const leadIntelOn = useMemo(() => {
    void tick;
    return isFeatureEnabled('leadIntel');
  }, [tick]);

  const deskOn = useMemo(() => {
    void tick;
    return isFeatureEnabled('marketingDesk');
  }, [tick]);

  const lastWorkerProbe = useMemo(() => {
    void tick;
    return getLastGrowthWorkerProbe();
  }, [tick]);

  const workerMode = workerResult?.mode ?? lastWorkerProbe?.mode;

  const runWorkerTest = async () => {
    setWorkerTesting(true);
    try {
      const r = await runGrowthWorkerTickTest();
      setWorkerResult(r);
    } finally {
      setWorkerTesting(false);
      setTick((t) => t + 1);
    }
  };

  if (compactWorkerLine) {
    return (
      <li className="text-white/80">
        Nightly worker:{' '}
        {lastWorkerProbe ? (
          <>
            <span className="text-white/90">{workerModeLabel(lastWorkerProbe.mode)}</span>
            <span className="text-white/45"> · probed {new Date(lastWorkerProbe.at).toLocaleString()}</span>
          </>
        ) : (
          <span className="text-amber-200/90">not probed — use Test worker in Find infrastructure</span>
        )}
      </li>
    );
  }

  const jsonLine = formatWorkerJson(workerResult);

  return (
    <div className={finelyOsCatalogCardCompact('sky')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Find infrastructure</div>
        <Link to="/admin/settings" className={`${FINELY_OS_SECONDARY_BTN} !py-1 !px-2 text-[10px] inline-flex items-center gap-1`}>
          <Settings2 size={12} /> Settings
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {flagChip(serperOk, serperOk ? 'Serper tested' : 'Serper not tested')}
        {flagChip(leadIntelOn, leadIntelOn ? 'leadIntel on' : 'leadIntel off')}
        {flagChip(deskOn, deskOn ? 'marketingDesk on' : 'marketingDesk off')}
        {workerStatusChip(workerMode)}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${FINELY_OS_SECONDARY_BTN} !py-1 !px-2 text-[10px]`}
          disabled={workerTesting}
          onClick={() => void runWorkerTest()}
        >
          {workerTesting ? 'Testing worker…' : 'Test worker'}
        </button>
        {lastWorkerProbe && !workerResult ? (
          <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
            Last probe: {new Date(lastWorkerProbe.at).toLocaleString()} · processed {lastWorkerProbe.processed}
          </span>
        ) : null}
      </div>
      {workerResult ? (
        <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          <span className="text-white/90">{workerResult.message}</span>
          <code className="mt-1 block rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-sky-200/90 break-all">
            {jsonLine}
          </code>
        </p>
      ) : (
        <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Run Test search in the header after keys and flags are set. Use Test worker to read{' '}
          <code className="text-sky-200/80">lead-intel-worker-tick</code> JSON — simulation by default (no overnight counter inflation).
        </p>
      )}
    </div>
  );
}
