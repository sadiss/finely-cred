import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LAUNCH_WAVE_REGISTRY } from '../../lib/launchWaveRegistry';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../os/finelyOsLightUi';

export function LaunchWaveRollupPanel() {
  const navigate = useNavigate();

  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4`} id="launch-waves">
      <div>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
          <Layers size={16} /> Launch wave rollup (54–70)
        </div>
        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
          One command runs every closure-track audit: <code className="font-mono text-xs">npm run launch:waves:audit</code>
        </p>
      </div>
      <ul className="space-y-2">
        {LAUNCH_WAVE_REGISTRY.map((w) => (
          <li
            key={w.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"
          >
            <div>
              <span className="font-semibold text-white/90">Wave {w.wave}</span>
              <span className="opacity-80"> · {w.label}</span>
              <div className="font-mono text-[10px] opacity-60 mt-0.5">{w.auditCommand}</div>
            </div>
            {w.hubPath ? (
              <button
                type="button"
                className={`inline-flex items-center gap-1 ${FINELY_OS_SECONDARY_BTN} !py-1 !px-2 text-xs`}
                onClick={() => navigate(w.hubPath!)}
              >
                Open <ArrowRight size={10} />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
