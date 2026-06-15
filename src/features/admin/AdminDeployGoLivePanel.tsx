import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, ClipboardCopy, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDeployGoLiveSteps, type DeployGoLiveStepStatus } from '../../lib/deployGoLiveOps';
import { getDeployEnvironmentLabel } from '../../lib/deployEnvironment';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

function statusChipTone(status: DeployGoLiveStepStatus): 'ok' | 'warn' | 'blocked' {
  if (status === 'ok') return 'ok';
  if (status === 'blocked') return 'blocked';
  return 'warn';
}

export function AdminDeployGoLivePanel() {
  const navigate = useNavigate();
  const steps = useMemo(() => getDeployGoLiveSteps(), []);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const blocked = steps.filter((s) => s.status === 'blocked').length;
  const warn = steps.filter((s) => s.status === 'warn').length;

  async function copyText(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div id="deploy-go-live" className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4`} data-fc-accent="sky">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
            <Rocket size={16} />
            <span>Deploy & host go-live</span>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm max-w-2xl`}>
            SQL → edge functions → Twilio → build → host env vars → feature flags. Current environment:{' '}
            <strong>{getDeployEnvironmentLabel()}</strong>. See docs/PRODUCTION_DEPLOY.md.
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
              {step.copyText ? (
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 ${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-2 text-xs`}
                  onClick={() => copyText(step.id, step.copyText!)}
                >
                  {copiedId === step.id ? <Check size={12} /> : <ClipboardCopy size={12} />}
                  Copy
                </button>
              ) : null}
              {step.command ? (
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 ${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-2 text-xs`}
                  onClick={() => copyText(`${step.id}-cmd`, step.command!)}
                >
                  {copiedId === `${step.id}-cmd` ? <Check size={12} /> : <ClipboardCopy size={12} />}
                  Cmd
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
