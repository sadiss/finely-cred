import React, { useMemo } from 'react';
import { ArrowRight, Rocket, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getGoLivePillars } from '../../lib/goLiveCommandOps';
import { LightThemeGoLivePanel } from '../os/LightThemeGoLivePanel';
import { LaunchWaveRollupPanel } from './LaunchWaveRollupPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

const OPS_COMMANDS = [
  'npm run launch:ops',
  'npm run launch:waves:audit',
  'npm run env:bootstrap:audit',
  'npm run senior:qa:signoff:audit',
  'npm run launch:senior:qa',
  'npm run production:launch:audit',
  'npm run env:dev-supabase',
  'npm run launch:preflight',
  'npm run launch:go-live',
  'npm run launch:complete',
  'npm run launch:production:ops',
  'npm run production:ops:runner:audit',
  'npm run launch:handoff:audit',
  'npm run launch:closure:full:audit',
  'npm run deploy:go-live:audit',
  'npm run deploy:functions',
  'npm run theme:audit',
  'npm run tour:voice:prerender -- --all',
];

export function AdminGoLiveCommandPanel() {
  const navigate = useNavigate();
  const pillars = useMemo(() => getGoLivePillars(), []);
  const blocked = pillars.filter((p) => p.tone === 'blocked').length;
  const warn = pillars.filter((p) => p.tone === 'warn').length;

  return (
    <div id="go-live" className={`${FINELY_OS_GLASS_CATALOG} space-y-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
            <Rocket size={16} />
            <span>Go-live command center</span>
          </div>
          <h3 className={FINELY_OS_ENTITY_TITLE}>Production readiness pillars</h3>
          <p className={FINELY_OS_ENTITY_BODY}>
            Runtime snapshot for ops — pair with <span className="font-mono text-xs">npm run launch:ops</span> before deploy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {blocked ? finelyOsStatusChip('blocked') : null}
          {warn ? finelyOsStatusChip('warn') : null}
          {!blocked && !warn ? finelyOsStatusChip('ok') : null}
        </div>
      </div>

      <ul className="space-y-2">
        {pillars.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-start justify-between gap-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white/90">{p.label}</div>
              <div className={`text-xs ${FINELY_OS_ENTITY_BODY} mt-0.5`}>{p.hint}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className={finelyOsStatusChip(p.tone === 'ok' ? 'ok' : p.tone === 'warn' ? 'warn' : 'blocked')}>
                {p.tone}
              </span>
              {p.actionPath && p.actionLabel ? (
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 ${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-3 text-xs`}
                  onClick={() => navigate(p.actionPath!)}
                >
                  {p.actionLabel} <ArrowRight size={12} />
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <LaunchWaveRollupPanel />

      <LightThemeGoLivePanel />

      <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl px-4 py-3 space-y-2">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>
          <Terminal size={12} /> Terminal commands
        </div>
        <ul className={`font-mono text-[11px] space-y-1 ${FINELY_OS_ENTITY_BODY}`}>
          {OPS_COMMANDS.map((cmd) => (
            <li key={cmd}>{cmd}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
