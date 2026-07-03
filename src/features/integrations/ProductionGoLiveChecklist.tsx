import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTION_GO_LIVE_STEPS } from '../../data/productionGoLiveChecklist';
import { countAutoVerifiedRequiredSteps, verifyProductionDeployStep } from '../../lib/productionDeployVerifier';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';

const STORAGE_KEY = 'finely.productionGoLive.checked.v1';

function loadChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveChecked(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function ProductionGoLiveChecklist() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState<Set<string>>(() => loadChecked());
  const [copied, setCopied] = useState<string | null>(null);

  const required = PRODUCTION_GO_LIVE_STEPS.filter((s) => s.required);
  const doneRequired = required.filter((s) => checked.has(s.id)).length;
  const autoVerified = useMemo(() => countAutoVerifiedRequiredSteps(), []);

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
    saveChecked(next);
  };

  const copyCmd = async (id: string, cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={FINELY_OS_ENTITY_BODY}>
          {doneRequired} / {required.length} manually checked · {autoVerified.verified} / {autoVerified.required} auto-verified required
        </p>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => { setChecked(new Set(PRODUCTION_GO_LIVE_STEPS.map((s) => s.id))); saveChecked(new Set(PRODUCTION_GO_LIVE_STEPS.map((s) => s.id))); }}>
          Mark all done
        </button>
      </div>
      <div className="space-y-2">
        {PRODUCTION_GO_LIVE_STEPS.map((step) => {
          const done = checked.has(step.id);
          const verify = verifyProductionDeployStep(step.id);
          return (
            <div key={step.id} className={`rounded-xl border p-4 ${done ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-white/10 bg-black/25'}`}>
              <div className="flex items-start gap-3">
                <button type="button" onClick={() => toggle(step.id)} className="mt-0.5 shrink-0 text-white/50 hover:text-emerald-300">
                  {done ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Circle size={18} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white text-sm">{step.title}</span>
                    {verify.autoOk === true ? (
                      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-emerald-300/90 font-bold">
                        <Sparkles size={10} /> Auto-verified
                      </span>
                    ) : null}
                    {step.required ? (
                      <span className="text-[9px] uppercase tracking-widest text-amber-300/80 font-bold">Required</span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-widest text-white/35">Optional</span>
                    )}
                  </div>
                  <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{step.detail}</p>
                  {verify.autoDetail ? (
                    <p className={`${FINELY_OS_ENTITY_BODY} text-[11px] mt-1 text-white/45`}>{verify.autoDetail}</p>
                  ) : null}
                  {step.command ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <code className="text-[11px] text-white/55 bg-black/40 px-2 py-1 rounded-lg">{step.command}</code>
                      <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyCmd(step.id, step.command!)}>
                        <Copy size={12} /> {copied === step.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ) : null}
                  {step.href ? (
                    <button type="button" className={`${FINELY_OS_PRIMARY_BTN} mt-2`} onClick={() => navigate(step.href!)}>
                      <ExternalLink size={12} /> Open
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
