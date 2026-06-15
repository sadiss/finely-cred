/** Onboarding shell — step progress + lane context (Part AU). */
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, finelyOsInlineListItem } from '../../features/os/finelyOsLightUi';

const STEP_LABELS = ['Goal & lane', 'Profile', 'Account', 'Portal'];

type Props = {
  stepIndex: number;
  laneLabel?: string;
  children: React.ReactNode;
};

export function OnboardingExperienceShell({ stepIndex, laneLabel, children }: Props) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {STEP_LABELS.map((label, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div
              key={label}
              className={`${finelyOsInlineListItem()} px-3 py-2 text-center ${active ? 'ring-1 ring-fuchsia-500/40' : ''}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {done ? <CheckCircle2 size={14} className="text-emerald-400" /> : null}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-fuchsia-300' : FINELY_OS_ENTITY_SUBLABEL}`}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {laneLabel ? (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Selected lane: <span className="text-emerald-300 font-semibold">{laneLabel}</span> — we&apos;ll tailor your portal and automations.
          {' '}
          <a href="/fundability-readiness" className="text-fuchsia-300 hover:text-white underline underline-offset-2">
            Preview fundability hub →
          </a>
        </p>
      ) : null}
      {children}
    </div>
  );
}
