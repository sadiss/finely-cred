import type { LetterStepPathItem } from '../components/letters/LetterStepPath';

export type DebtLetterStepId = 'case' | 'proof' | 'choose' | 'draft' | 'preview' | 'generate';

/** Main path — proof is optional (see buildDebtLetterPathSteps). */
export const DEBT_LETTER_STEP_ORDER: DebtLetterStepId[] = [
  'case',
  'choose',
  'draft',
  'preview',
  'generate',
];

export function buildDebtLetterPathSteps(opts: {
  hasCase: boolean;
  proofCount: number;
  hasChosenLetter: boolean;
  hasDraftBody: boolean;
  savedToVault?: boolean;
}): LetterStepPathItem[] {
  const { hasCase, proofCount, hasChosenLetter, hasDraftBody, savedToVault } = opts;
  return [
    {
      id: 'case',
      label: 'Case',
      meta: hasCase ? 'Selected' : 'Pick case',
      done: hasCase,
    },
    {
      id: 'choose',
      label: 'Choose letter',
      meta: hasChosenLetter ? 'Ready' : 'Pick template',
      done: hasChosenLetter,
      disabled: !hasCase,
      disabledReason: 'Select a case first',
    },
    {
      id: 'draft',
      label: 'Draft',
      meta: hasDraftBody ? 'Edited' : 'Build',
      done: hasDraftBody,
      disabled: !hasChosenLetter,
      disabledReason: 'Choose a letter type first',
    },
    {
      id: 'preview',
      label: 'Preview',
      meta: 'Paper',
      done: hasDraftBody,
      disabled: !hasChosenLetter,
      disabledReason: 'Open a draft first',
    },
    {
      id: 'generate',
      label: 'Save → Mail',
      meta: savedToVault ? 'In vault — mail next' : 'Save PDF',
      done: Boolean(savedToVault),
      disabled: !hasDraftBody,
      disabledReason: 'Complete your draft first',
    },
    {
      id: 'proof',
      label: 'Proof',
      meta: proofCount > 0 ? `${proofCount} file${proofCount === 1 ? '' : 's'}` : 'Optional',
      done: proofCount > 0,
      optional: true,
      disabled: !hasCase,
      disabledReason: 'Select a case first',
    },
  ];
}

export function highlightDebtStepElement(stepId: DebtLetterStepId) {
  const el = document.getElementById(`fc-debt-step-${stepId}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.classList.add('ring-2', 'ring-amber-400/60', 'ring-offset-2', 'ring-offset-black');
  window.setTimeout(() => {
    el.classList.remove('ring-2', 'ring-amber-400/60', 'ring-offset-2', 'ring-offset-black');
  }, 1500);
}

export function runDebtLetterStep(id: DebtLetterStepId, opts?: { openDraft?: () => void }) {
  if (id === 'draft' || id === 'preview' || id === 'generate') {
    opts?.openDraft?.();
  }
  highlightDebtStepElement(id);
}
