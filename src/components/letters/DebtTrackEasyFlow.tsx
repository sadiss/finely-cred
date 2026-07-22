import React from 'react';
import { LetterStepPath, type LetterStepPathItem } from './LetterStepPath';
import { LetterDisclaimerFooter } from './LetterAddressSummary';
import type { DebtLetterStepId } from '../../lib/letterDebtFlow';
import { FINELY_OS_COMPACT_PAGE } from '../../features/os/finelyOsLightUi';
import { LETTER_L5_CHROME_COLLAPSE } from './letterEasyFlowTokens';

export function DebtTrackEasyFlow({
  trackLabel,
  steps,
  onStep,
  onContinue,
  children,
  uploadFooter,
}: {
  trackLabel: string;
  steps: LetterStepPathItem[];
  onStep: (id: DebtLetterStepId) => void;
  onContinue: () => void;
  children: React.ReactNode;
  uploadFooter?: React.ReactNode;
}) {
  return (
    <div className={`${FINELY_OS_COMPACT_PAGE} space-y-3`}>
      <LetterStepPath
        title={`${trackLabel} — what to do next`}
        steps={steps}
        onStep={(id) => onStep(id as DebtLetterStepId)}
        onContinue={onContinue}
      />
      {children}
      {uploadFooter ? (
        <section className={`space-y-2 ${LETTER_L5_CHROME_COLLAPSE}`}>{uploadFooter}</section>
      ) : null}
      <LetterDisclaimerFooter />
    </div>
  );
}
