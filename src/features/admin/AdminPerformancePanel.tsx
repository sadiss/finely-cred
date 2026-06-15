import React, { useMemo, useState } from 'react';
import { Gauge, RefreshCw, Smartphone, Database } from 'lucide-react';
import { getEdgeCacheStats, clearEdgeAssetCache } from '../../lib/edgeAssetCache';
import { loadJson } from '../../data/localJsonStore';
import { requestPushPermission } from '../../lib/pushNotificationBridge';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

function reportCacheCount(): number {
  const store = loadJson<{ entries: unknown[] }>('finely.reportParseCache.v1', { entries: [] }, 1);
  return store.entries?.length ?? 0;
}

export function AdminPerformancePanel() {
  const [version, setVersion] = useState(0);
  const stats = useMemo(() => {
    void version;
    return {
      edge: getEdgeCacheStats(),
      reportCache: reportCacheCount(),
      sw: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
      push: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
      standalone: typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
    };
  }, [version]);

  return (
    <div className={`${FINELY_OS_GLASS_CATALOG} space-y-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
            <Gauge size={16} />
            <span>Performance & edge</span>
          </div>
          <h3 className={FINELY_OS_ENTITY_TITLE}>Cache & PWA health</h3>
          <p className={FINELY_OS_ENTITY_BODY}>Voice URL memo cache, report parse cache, and installable PWA status.</p>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setVersion((v) => v + 1)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Metric label="Voice cache entries" value={String(stats.edge.voiceEntries)} hint={`TTL ${stats.edge.ttlHours}h · ${stats.edge.totalHits} hits`} />
        <Metric label="Report parse cache" value={String(stats.reportCache)} hint="Local parsed report memo" icon={<Database size={14} />} />
        <Metric label="Service worker" value={stats.sw ? 'Supported' : 'Unavailable'} chip={stats.sw ? 'ok' : 'warn'} />
        <Metric label="PWA installed" value={stats.standalone ? 'Yes' : 'Browser tab'} chip={stats.standalone ? 'ok' : 'warn'} icon={<Smartphone size={14} />} />
        <Metric label="Push permission" value={stats.push} chip={stats.push === 'granted' ? 'ok' : stats.push === 'denied' ? 'blocked' : 'warn'} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => void requestPushPermission().then(() => setVersion((v) => v + 1))}>
          Enable push alerts
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => { clearEdgeAssetCache(); setVersion((v) => v + 1); }}>
          Clear voice cache
        </button>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  chip,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  chip?: 'ok' | 'warn' | 'blocked';
  icon?: React.ReactNode;
}) {
  return (
    <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3">
      <div className={`flex items-center gap-2 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
        {icon}
        {label}
        {chip ? finelyOsStatusChip(chip) : null}
      </div>
      <div className="mt-1 text-lg font-semibold text-white/90">{value}</div>
      {hint ? <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{hint}</div> : null}
    </div>
  );
}
