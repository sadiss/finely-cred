import React, { useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { buildErrorOpsSnapshot, listClientErrors } from '../../lib/errorReportingBridge';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function AdminErrorOpsPanel() {
  const [version, setVersion] = useState(0);
  const snap = useMemo(() => {
    void version;
    return buildErrorOpsSnapshot();
  }, [version]);
  const errors = useMemo(() => {
    void version;
    return listClientErrors(6);
  }, [version]);

  return (
    <div className={`${FINELY_OS_GLASS_CATALOG} space-y-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-rose-300`}>
            <AlertTriangle size={16} />
            <span>Customer /errors</span>
          </div>
          <h3 className={FINELY_OS_ENTITY_TITLE}>Error ops (24h)</h3>
          <p className={FINELY_OS_ENTITY_BODY}>Captured in-browser — wire Sentry DSN in production for server-side alerts.</p>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setVersion((v) => v + 1)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-white/90">{snap.total24h}</span>
        <span className={FINELY_OS_ENTITY_BODY}>errors in last 24h</span>
        {snap.total24h > 0 ? finelyOsStatusChip('warn') : finelyOsStatusChip('ok')}
      </div>

      {errors.length === 0 ? (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>No client errors recorded in this browser.</p>
      ) : (
        <ul className={`space-y-2 text-xs font-mono ${FINELY_OS_ENTITY_BODY}`}>
          {errors.map((e) => (
            <li key={e.id} className="rounded-lg fc-light-glass-panel fc-light-chrome-panel border px-3 py-2 truncate">
              {e.at} · {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
