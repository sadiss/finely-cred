/** Onboarding shell — dynamic step progress + lane context. */
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { getOnboardingStepLabel } from '../../onboarding/pipeline';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, finelyOsInlineListItem } from '../../features/os/finelyOsLightUi';

type Props = {
  stepIndex: number;
  stepKeys?: string[];
  currentKey?: string;
  laneLabel?: string;
  children: React.ReactNode;
};

export function OnboardingExperienceShell({ stepIndex, stepKeys, currentKey, laneLabel, children }: Props) {
  const labels = (stepKeys?.length ? stepKeys : ['role', 'profile']).map((key) => getOnboardingStepLabel(key));
  const activeIndex = currentKey && stepKeys?.length ? Math.max(0, stepKeys.indexOf(currentKey)) : stepIndex;

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className={`grid gap-1.5 sm:gap-2 ${labels.length <= 3 ? 'grid-cols-3' : labels.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
        {labels.map((label, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <div
              key={`${label}-${i}`}
              className={`${finelyOsInlineListItem()} px-2 sm:px-3 py-2 text-center min-h-[40px] sm:min-h-[44px] flex items-center justify-center ${active ? 'ring-1 ring-fuchsia-500/40 bg-fuchsia-500/5' : ''}`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 min-w-0">
                {done ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> : null}
                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wide sm:tracking-wider truncate ${active ? 'text-fuchsia-300' : FINELY_OS_ENTITY_SUBLABEL}`}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {laneLabel ? (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY} break-words`}>
          Selected lane: <span className="text-emerald-300 font-semibold">{laneLabel}</span> — we&apos;ll tailor your portal and automations.
        </p>
      ) : null}
      {children}
    </div>
  );
}
