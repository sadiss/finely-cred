import React, { useMemo } from 'react';
import { ArrowRight, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getLightThemeGoLiveReadiness,
  LIGHT_THEME_PRIORITY_ROUTES,
} from '../../lib/lightThemeGoLiveOps';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from './finelyOsLightUi';

export function LightThemeGoLivePanel({
  onTogglePublicLight,
  lightThemePublic,
}: {
  lightThemePublic?: boolean;
  onTogglePublicLight?: (next: boolean) => void;
}) {
  const navigate = useNavigate();
  const readiness = useMemo(() => getLightThemeGoLiveReadiness(), [lightThemePublic]);

  return (
    <div className={`${finelyOsCatalogCard('amber')} !p-5 space-y-4`} data-fc-accent="amber">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-amber-300`}>
            <Sun size={16} /> Light theme go-live checklist
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm max-w-2xl`}>{readiness.hint}</p>
        </div>
        <span className={finelyOsStatusChip(readiness.publicEnabled ? 'ok' : 'warn')}>
          Public: {readiness.publicEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
        Automated gate: <code className="font-mono">{readiness.auditCommand}</code> (npm run theme:audit) — run before flipping public light.
      </div>

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {LIGHT_THEME_PRIORITY_ROUTES.map((route) => (
          <li key={route.path}>
            <button
              type="button"
              className={`w-full text-left rounded-xl border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.04] transition-all`}
              onClick={() => navigate(route.path)}
            >
              <span className="font-semibold text-white/90">{route.label}</span>
              <span className="block opacity-60 mt-0.5">{route.path}</span>
              <span className="block opacity-45 mt-0.5 capitalize">{route.lane}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {onTogglePublicLight ? (
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => onTogglePublicLight(!lightThemePublic)}
          >
            <Sun size={14} /> {lightThemePublic ? 'Hide from public' : 'Enable for everyone'}
          </button>
        ) : null}
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/launch-os#go-live')}>
          Go-live center <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
