import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, ClipboardCopy, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProductionLaunchSteps, type ProductionLaunchStepStatus } from '../../lib/productionLaunchOps';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

function statusChipTone(status: ProductionLaunchStepStatus): 'ok' | 'warn' | 'blocked' {
  if (status === 'ok') return 'ok';
  if (status === 'blocked') return 'blocked';
  return 'warn';
}

export function AdminProductionLaunchPanel() {
  const navigate = useNavigate();
  const steps = useMemo(() => getProductionLaunchSteps(), []);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const blocked = steps.filter((s) => s.status === 'blocked').length;
  const warn = steps.filter((s) => s.status === 'warn').length;

  async function copyCommand(stepId: string, command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedId(stepId);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div id="production-ops" className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`} data-fc-accent="violet">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
            <Terminal size={16} />
            <span>Production launch ops</span>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm max-w-2xl`}>
            Executable go-live checklist with live runtime status. Run terminal commands locally — this panel tracks
            what is ready vs blocked.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {blocked ? finelyOsStatusChip('blocked') : null}
          {warn ? finelyOsStatusChip('warn') : null}
          {!blocked && !warn ? finelyOsStatusChip('ok') : null}
        </div>
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-white/90">{step.label}</div>
              <div className={`text-xs ${FINELY_OS_ENTITY_BODY} mt-0.5`}>{step.hint}</div>
              {step.command ? (
                <code className="font-mono text-[10px] opacity-60 mt-1 block">{step.command}</code>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className={finelyOsStatusChip(statusChipTone(step.status))}>{step.status}</span>
              {step.command ? (
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 ${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-2 text-xs`}
                  onClick={() => copyCommand(step.id, step.command!)}
                  title="Copy command"
                >
                  {copiedId === step.id ? <Check size={12} /> : <ClipboardCopy size={12} />}
                  {copiedId === step.id ? 'Copied' : 'Copy'}
                </button>
              ) : null}
              {step.path ? (
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 ${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-2 text-xs`}
                  onClick={() => navigate(step.path!)}
                >
                  Open <ArrowRight size={12} />
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
