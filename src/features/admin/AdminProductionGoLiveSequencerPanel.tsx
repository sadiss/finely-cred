import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, ClipboardCopy, ListOrdered } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getGoLivePhaseLabels,
  getProductionGoLiveSequence,
  type GoLivePhase,
  type GoLiveSequenceStep,
} from '../../lib/productionGoLiveSequencer';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

function statusChipTone(status: GoLiveSequenceStep['status']): 'ok' | 'warn' | 'blocked' {
  if (status === 'ok') return 'ok';
  if (status === 'blocked') return 'blocked';
  return 'warn';
}

export function AdminProductionGoLiveSequencerPanel() {
  const navigate = useNavigate();
  const steps = useMemo(() => getProductionGoLiveSequence(), []);
  const phaseLabels = useMemo(() => getGoLivePhaseLabels(), []);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const blocked = steps.filter((s) => s.status === 'blocked').length;

  const byPhase = useMemo(() => {
    const map = new Map<GoLivePhase, GoLiveSequenceStep[]>();
    for (const step of steps) {
      const list = map.get(step.phase) ?? [];
      list.push(step);
      map.set(step.phase, list);
    }
    return map;
  }, [steps]);

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
    <div id="production-sequencer" className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4`} data-fc-accent="sky">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
            <ListOrdered size={16} />
            <span>Production go-live sequencer</span>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm max-w-2xl`}>
            One ordered playbook — credentials through sign-off. Follow phases in order after the code track (waves
            54–68) passes.
          </p>
        </div>
        <span className={finelyOsStatusChip(blocked ? 'blocked' : 'warn')}>
          {blocked ? `${blocked} blocked` : 'In progress'}
        </span>
      </div>

      {(Object.keys(phaseLabels) as GoLivePhase[]).map((phase) => {
        const phaseSteps = byPhase.get(phase);
        if (!phaseSteps?.length) return null;
        return (
          <div key={phase} className="space-y-2">
            <div className={`text-xs font-semibold ${FINELY_OS_ENTITY_SUBLABEL}`}>{phaseLabels[phase]}</div>
            <ul className="space-y-2">
              {phaseSteps.map((step) => (
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
                        onClick={() => copyText(step.id, step.command!)}
                      >
                        {copiedId === step.id ? <Check size={12} /> : <ClipboardCopy size={12} />}
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
      })}
    </div>
  );
}
