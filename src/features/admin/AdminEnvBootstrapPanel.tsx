import React, { useMemo, useState } from 'react';
import { Check, ClipboardCopy, ExternalLink, KeyRound } from 'lucide-react';
import { getEnvBootstrapSteps } from '../../lib/envBootstrapOps';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

export function AdminEnvBootstrapPanel() {
  const steps = useMemo(() => getEnvBootstrapSteps(), []);
  const supabaseReady = isSupabaseConfigured;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyText(stepId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(stepId);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div id="env-bootstrap" className={`${finelyOsCatalogCard('amber')} !p-5 space-y-4`} data-fc-accent="amber">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-amber-300`}>
            <KeyRound size={16} />
            <span>Supabase env bootstrap</span>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm max-w-2xl`}>
            Production go-live starts here. Use a separate dev Supabase project locally — paste keys into{' '}
            <code className="font-mono text-xs">.env.local</code> and restart the dev server.
          </p>
        </div>
        <span className={finelyOsStatusChip(supabaseReady ? 'ok' : 'blocked')}>
          Supabase {supabaseReady ? 'ready' : 'pending'}
        </span>
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
              <span className={finelyOsStatusChip(step.done ? 'ok' : 'warn')}>{step.done ? 'done' : 'todo'}</span>
              {step.copyText ? (
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 ${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-2 text-xs`}
                  onClick={() => copyText(step.id, step.copyText!)}
                >
                  {copiedId === step.id ? <Check size={12} /> : <ClipboardCopy size={12} />}
                  {copiedId === step.id ? 'Copied' : 'Copy'}
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
              {step.externalUrl ? (
                <a
                  href={step.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 ${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-2 text-xs`}
                >
                  Open <ExternalLink size={12} />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
