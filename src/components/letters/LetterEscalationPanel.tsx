import React, { useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react';
import { escalationStepsForTrack, type EscalationTrack } from '../../lib/letterEscalationPaths';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

export function LetterEscalationPanel({
  track,
  accent = 'amber',
}: {
  track: EscalationTrack;
  accent?: 'amber' | 'violet' | 'sky';
}) {
  const steps = escalationStepsForTrack(track);
  const [openLevel, setOpenLevel] = useState<number>(1);

  const headline =
    track === 'bureau_dispute'
      ? 'Bureau dispute escalation ladder'
      : track === 'debt_court'
        ? 'Court / summons escalation ladder'
        : 'Debt validation escalation ladder';

  const sub =
    track === 'bureau_dispute'
      ? 'If the bureau or furnisher will not correct inaccurate reporting, climb this ladder in order. Each step builds your paper trail.'
      : track === 'debt_court'
        ? 'Summons and active litigation need court deadlines first — then regulatory complaints and counsel.'
        : 'If the collector ignores FDCPA validation, licensing, or accounting demands, escalate in this order for maximum effect.';

  return (
    <div className={`${finelyOsCatalogCard(accent)} !p-5 space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <ShieldAlert size={14} className="text-amber-300" />
            Non-compliance playbook
          </div>
          <div className={`mt-2 text-xl font-black ${FINELY_OS_ENTITY_VALUE}`}>{headline}</div>
          <p className={`mt-2 max-w-3xl ${FINELY_OS_ENTITY_BODY}`}>{sub}</p>
        </div>
        <span className={finelyOsStatusChip('warn')}>Educational — not legal advice</span>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const open = openLevel === step.level;
          return (
            <div key={step.level} className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenLevel(open ? 0 : step.level)}
                className="w-full text-left px-4 py-4 flex items-start justify-between gap-3 hover:bg-white/[0.03] transition"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300/90">Level {step.level}</span>
                    {step.timing ? <span className="text-[10px] text-white/40">{step.timing}</span> : null}
                  </div>
                  <div className={`mt-1 font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{step.title}</div>
                  <div className={`mt-0.5 text-sm ${FINELY_OS_ENTITY_BODY}`}>{step.subtitle}</div>
                </div>
                <span className="text-white/50 shrink-0 mt-1">{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
              </button>
              {open ? (
                <div className="px-4 pb-4 pt-0 space-y-4 border-t border-white/10">
                  <div className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                    <strong className="text-white/80">When:</strong> {step.when}
                  </div>
                  <div>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Action steps</div>
                    <ol className={`mt-2 list-decimal pl-5 space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                      {step.actions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Escalate to</div>
                      <div className={`mt-1 text-sm ${FINELY_OS_ENTITY_VALUE}`}>{step.escalateTo}</div>
                      {step.externalUrl ? (
                        <a
                          href={step.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200"
                        >
                          Open filing portal <ArrowUpRight size={12} />
                        </a>
                      ) : null}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Evidence checklist</div>
                      <ul className={`mt-2 list-disc pl-4 text-xs space-y-1 ${FINELY_OS_ENTITY_BODY}`}>
                        {step.evidenceChecklist.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
