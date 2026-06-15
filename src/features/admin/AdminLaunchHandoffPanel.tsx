import React, { useMemo, useState } from 'react';
import { Check, ClipboardCopy, Flag } from 'lucide-react';
import { LAUNCH_CLOSURE_META_AUDITS, LAUNCH_PLAN_HANDOFF } from '../../lib/launchHandoffOps';
import { getLaunchFinalReadiness } from '../../lib/launchFinalReadinessOps';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function AdminLaunchHandoffPanel() {
  const readiness = useMemo(() => getLaunchFinalReadiness(), []);
  const [copied, setCopied] = useState<string | null>(null);

  async function copyText(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div id="plan-handoff" className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`} data-fc-accent="violet">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
            <Flag size={16} />
            <span>Plan handoff — code track complete</span>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm max-w-2xl`}>
            {LAUNCH_PLAN_HANDOFF.planId} waves {LAUNCH_PLAN_HANDOFF.waves.from}–{LAUNCH_PLAN_HANDOFF.waves.to} automated
            gates pass. Run the full closure audit stack locally, then complete production ops when Supabase keys are set.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {finelyOsStatusChip('ok')}
          <span className={finelyOsStatusChip(readiness.productionReady ? 'ok' : 'warn')}>
            {readiness.productionReady ? 'Production ready' : 'Ops pending'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => copyText('full', LAUNCH_PLAN_HANDOFF.fullClosureAudit)}
        >
          {copied === 'full' ? <Check size={14} /> : <ClipboardCopy size={14} />}
          {copied === 'full' ? 'Copied' : 'Copy full closure audit'}
        </button>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => copyText('handoff', LAUNCH_PLAN_HANDOFF.handoffAudit)}
        >
          {copied === 'handoff' ? <Check size={14} /> : <ClipboardCopy size={14} />}
          {copied === 'handoff' ? 'Copied' : 'Copy handoff audit'}
        </button>
      </div>

      <ul className={`space-y-1 font-mono text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
        <li>npm run launch:waves:audit — feature waves 54–59</li>
        {LAUNCH_CLOSURE_META_AUDITS.map((a) => (
          <li key={a.wave}>
            {a.command} — wave {a.wave} {a.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
