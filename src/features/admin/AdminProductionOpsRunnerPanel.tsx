import React, { useState } from 'react';
import { Check, ClipboardCopy, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LAUNCH_PLAN_SEAL,
  LAUNCH_PRODUCTION_OPS_COMMAND,
  LAUNCH_PRODUCTION_OPS_STEPS,
} from '../../lib/productionOpsRunnerOps';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function AdminProductionOpsRunnerPanel() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(LAUNCH_PRODUCTION_OPS_COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div id="production-ops-runner" className={`${finelyOsCatalogCard('amber')} !p-5 space-y-4`} data-fc-accent="amber">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-amber-300`}>
            <Terminal size={16} />
            <span>Production ops runner</span>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm max-w-2xl`}>
            {LAUNCH_PLAN_SEAL.message} Entry command:{' '}
            <code className="font-mono text-xs">{LAUNCH_PRODUCTION_OPS_COMMAND}</code>
          </p>
        </div>
        {finelyOsStatusChip('ok')}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SUCCESS_BTN} onClick={copyCommand}>
          {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
          {copied ? 'Copied' : 'Copy ops runner cmd'}
        </button>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => navigate('/admin/launch-os#production-sequencer')}
        >
          Open sequencer
        </button>
      </div>

      <ul className={`space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
        {LAUNCH_PRODUCTION_OPS_STEPS.map((step) => (
          <li key={step.id}>
            {step.command ? (
              <code className="font-mono">{step.command}</code>
            ) : (
              <span>{step.path}</span>
            )}{' '}
            — {step.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
