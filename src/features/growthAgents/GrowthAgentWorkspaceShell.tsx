import React from 'react';
import { Link } from 'react-router-dom';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';
import type { GrowthAgentAccent } from './growthAgentRegistry';
import { FinelyOsAlertBanner } from '../os/FinelyOsAlertBanner';
import { GrowthAgentResultsStrip } from './GrowthAgentResultsStrip';
import { MarketingHelpButton } from '../marketingDepartment/MarketingHelpModal';
import { marketingVividShell } from '../marketingDepartment/marketingHubUi';

const ACCENT_RING: Record<GrowthAgentAccent, string> = {
  emerald: 'border-emerald-500/35 bg-emerald-500/5',
  amber: 'border-amber-500/35 bg-amber-500/5',
  sky: 'border-sky-500/35 bg-sky-500/5',
  violet: 'border-violet-500/35 bg-violet-500/5',
  fuchsia: 'border-fuchsia-500/35 bg-fuchsia-500/5',
  rose: 'border-rose-500/35 bg-rose-500/5',
};

export function GrowthAgentWorkspaceShell({
  accent,
  name,
  roleTitle,
  mission,
  maturityPercent,
  maturityLabel,
  alertMessage,
  alertTone,
  primaryAction,
  secondaryAction,
  setupBlock,
  lastRunBlock,
  statusBlock,
  nextStep,
  headerAside,
  children,
}: {
  accent: GrowthAgentAccent;
  name: string;
  roleTitle: string;
  mission: string;
  maturityPercent: number;
  maturityLabel: string;
  alertMessage?: string;
  alertTone?: 'warning' | 'info' | 'success';
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void };
  setupBlock?: React.ReactNode;
  lastRunBlock?: React.ReactNode;
  statusBlock?: React.ReactNode;
  nextStep?: string;
  /** Sits under the readiness % — e.g. Caleb command guide launcher */
  headerAside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const ring = ACCENT_RING[accent];
  return (
    <div className="space-y-3">
      <div className={`rounded-2xl border p-4 ${ring}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Growth specialist</div>
            <h2 className={`${FINELY_OS_ENTITY_TITLE} text-white`}>{name}</h2>
            <p className="text-sm font-semibold text-white/80">{roleTitle}</p>
            <p className={`mt-2 text-sm max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>{mission}</p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 min-w-[160px] max-w-[220px]">
            <div className={`${marketingVividShell(maturityPercent >= 70 ? 'emerald' : maturityPercent >= 40 ? 'amber' : 'rose')} !p-3 text-right relative`}>
              <div className="absolute top-2 left-2">
                <MarketingHelpButton helpId="agent_readiness" />
              </div>
              <div className="text-2xl font-black">{maturityPercent}%</div>
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-90">ready</div>
              <p className={`mt-1 text-xs max-w-[140px] ml-auto opacity-90`}>{maturityLabel}</p>
            </div>
            {headerAside}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {primaryAction ? (
            <button
              type="button"
              disabled={primaryAction.disabled}
              onClick={primaryAction.onClick}
              className={FINELY_OS_PRIMARY_BTN}
            >
              {primaryAction.label}
            </button>
          ) : null}
          {secondaryAction ? (
            <button type="button" onClick={secondaryAction.onClick} className={FINELY_OS_SECONDARY_BTN}>
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      </div>

      {alertMessage ? <FinelyOsAlertBanner tone={alertTone || 'info'} message={alertMessage} /> : null}

      <GrowthAgentResultsStrip accent={accent} />

      {nextStep ? (
        <div className={finelyOsCatalogCardCompact(accent)}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>What to do next</div>
          <p className={`mt-1 text-sm font-medium text-white ${FINELY_OS_ENTITY_BODY}`}>{nextStep}</p>
        </div>
      ) : null}

      <div className="grid md:grid-cols-3 gap-3">
        <div className={finelyOsCatalogCardCompact('sky')}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Setup</div>
          <div className="mt-2 text-sm text-white/85">{setupBlock || '—'}</div>
        </div>
        <div className={finelyOsCatalogCardCompact('amber')}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Last run</div>
          <div className="mt-2 text-sm text-white/85">{lastRunBlock || 'Nothing yet'}</div>
        </div>
        <div className={finelyOsCatalogCardCompact('emerald')}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Working or not</div>
          <div className="mt-2 text-sm text-white/85">{statusBlock || '—'}</div>
        </div>
      </div>

      {children}
    </div>
  );
}

export function GrowthAgentBreadcrumb({
  agentName,
  section,
}: {
  agentName?: string;
  section?: string;
}) {
  return (
    <nav className={`text-xs ${FINELY_OS_ENTITY_BODY} flex flex-wrap items-center gap-1`}>
      <Link to="/admin/growth-agents" className="text-emerald-300/90 hover:underline">
        Growth Agents
      </Link>
      {agentName ? (
        <>
          <span className="text-white/30">›</span>
          <span className="text-white/70">{agentName}</span>
        </>
      ) : null}
      {section ? (
        <>
          <span className="text-white/30">›</span>
          <span className="text-white/90">{section}</span>
        </>
      ) : null}
    </nav>
  );
}

export function AgentStatusChip({ ready }: { ready: 'ready' | 'setup' | 'soon' }) {
  if (ready === 'ready') return <span className={finelyOsStatusChip('ok')}>Ready</span>;
  if (ready === 'setup') return <span className={finelyOsStatusChip('warn')}>Needs setup</span>;
  return <span className={finelyOsStatusChip('blocked')}>Coming soon</span>;
}
