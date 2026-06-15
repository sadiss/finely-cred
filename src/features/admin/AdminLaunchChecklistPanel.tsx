import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { buildLaunchChecklistSnapshot } from '../../lib/launchChecklistSnapshot';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_GLASS_CATALOG,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function AdminLaunchChecklistPanel() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', bump as EventListener);
    window.addEventListener('finely:platform-event', bump as EventListener);
    return () => {
      window.removeEventListener('finely:store', bump as EventListener);
      window.removeEventListener('finely:platform-event', bump as EventListener);
    };
  }, []);

  const items = useMemo(() => buildLaunchChecklistSnapshot(), [version]);

  return (
    <div className={`${FINELY_OS_GLASS_CATALOG} space-y-4`}>
      <div>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
          <ClipboardCheck size={16} />
          <span>Launch checklist</span>
        </div>
        <h3 className={FINELY_OS_ENTITY_TITLE}>Production readiness</h3>
        <p className={FINELY_OS_ENTITY_BODY}>
          Runtime snapshot — pair with <span className="font-mono text-xs">npm run predeploy:check</span> before go-live.
        </p>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3">
            <div className="min-w-0">
              <div className="font-semibold text-white/90">{item.label}</div>
              <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{item.detail}</div>
            </div>
            <span className={finelyOsStatusChip(item.status === 'ok' ? 'ok' : item.status === 'warn' ? 'warn' : 'blocked')}>
              {item.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
