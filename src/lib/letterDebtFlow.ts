import type { LetterStepPathItem } from '../components/letters/LetterStepPath';
import type { EscalationTrack } from './letterEscalationPaths';

export type DebtLetterStepId =
  | 'case'
  | 'proof'
  | 'choose'
  | 'draft'
  | 'preview'
  | 'generate'
  | 'mail'
  | 'escalate';

/** Which debt workstation the rail is describing. */
export type DebtLetterTrack =
  | 'validation'
  | 'court'
  | 'foreclosure'
  | 'repossession'
  | 'bankruptcy'
  | 'debt';

/** Beginning → middle → end. Proof stays optional (see buildDebtLetterPathSteps). */
export const DEBT_LETTER_STEP_ORDER: DebtLetterStepId[] = [
  'case',
  'choose',
  'draft',
  'preview',
  'generate',
  'mail',
  'escalate',
];

export function debtTrackLabel(track: DebtLetterTrack): string {
  switch (track) {
    case 'validation':
      return 'Validation';
    case 'court':
      return 'Court';
    case 'foreclosure':
      return 'Foreclosure';
    case 'repossession':
      return 'Repossession';
    case 'bankruptcy':
      return 'Bankruptcy';
    default:
      return 'Debt letter';
  }
}

/** Escalation ladder that belongs at the end of each debt rail. */
export function debtTrackEscalationTrack(track: DebtLetterTrack): EscalationTrack {
  return track === 'court' ? 'debt_court' : 'debt_validation';
}

type TrackHints = {
  /** One-line "why this track exists" shown above the steps. */
  intro: string;
  caseLabel: string;
  casePrompt: string;
  chooseLabel: string;
  choosePrompt: string;
  mailLabel: string;
  mailPrompt: string;
  escalateLabel: string;
  escalatePrompt: string;
};

const TRACK_HINTS: Record<DebtLetterTrack, TrackHints> = {
  validation: {
    intro: 'Make them prove the debt in writing before you pay or negotiate anything.',
    caseLabel: 'Collection account',
    casePrompt: 'Pick the collector',
    chooseLabel: 'Choose validation letter',
    choosePrompt: 'Round 1, 2, or final demand',
    mailLabel: 'Mail certified',
    mailPrompt: 'Certified mail + keep the receipt',
    escalateLabel: 'Escalate',
    escalatePrompt: 'If validation never arrives',
  },
  court: {
    intro: 'Court deadlines are the risk. File on time, then keep every filing on paper.',
    caseLabel: 'Lawsuit',
    casePrompt: 'Pick the case',
    chooseLabel: 'Choose court filing',
    choosePrompt: 'Answer, affidavit, or discovery',
    mailLabel: 'File & serve',
    mailPrompt: 'File with the clerk, serve counsel',
    escalateLabel: 'Escalate',
    escalatePrompt: 'If the plaintiff ignores the rules',
  },
  foreclosure: {
    intro: 'Servicer duties are time-bound. Put every request in writing and track the clock.',
    caseLabel: 'Mortgage account',
    casePrompt: 'Pick the servicer',
    chooseLabel: 'Choose RESPA letter',
    choosePrompt: 'RFI, NOE, or loss mitigation',
    mailLabel: 'Mail certified',
    mailPrompt: 'Send to the designated RESPA address',
    escalateLabel: 'Escalate',
    escalatePrompt: 'If the servicer misses its deadline',
  },
  repossession: {
    intro: 'Notice and sale rules protect you after a repo. Demand the paperwork in writing.',
    caseLabel: 'Auto loan',
    casePrompt: 'Pick the lender',
    chooseLabel: 'Choose repo letter',
    choosePrompt: 'Notice, accounting, or deficiency',
    mailLabel: 'Mail certified',
    mailPrompt: 'Certified mail + keep the receipt',
    escalateLabel: 'Escalate',
    escalatePrompt: 'If the deficiency math never comes',
  },
  bankruptcy: {
    intro: 'Discharged and included debts must stop being collected and reported that way.',
    caseLabel: 'Discharged debt',
    casePrompt: 'Pick the account',
    chooseLabel: 'Choose bankruptcy letter',
    choosePrompt: 'Discharge notice or reporting fix',
    mailLabel: 'Mail certified',
    mailPrompt: 'Certified mail + keep the receipt',
    escalateLabel: 'Escalate',
    escalatePrompt: 'If they keep collecting post-discharge',
  },
  debt: {
    intro: 'Every debt letter follows the same spine: case, letter, draft, paper, proof of mailing.',
    caseLabel: 'Case',
    casePrompt: 'Pick case',
    chooseLabel: 'Choose letter',
    choosePrompt: 'Pick template',
    mailLabel: 'Mail & track',
    mailPrompt: 'Certified mail + keep the receipt',
    escalateLabel: 'Escalate',
    escalatePrompt: 'If they ignore you',
  },
};

/** Post-court plan overrides — the matter is decided, so the rail is compliance, not defense. */
const POST_COURT_PLAN_HINTS: TrackHints = {
  intro: 'This matter ended in a payment plan. The job now is proof: order on file, receipts, and a clean close-out.',
  caseLabel: 'Plan case',
  casePrompt: 'Pick the decided case',
  chooseLabel: 'Choose plan letter',
  choosePrompt: 'Payment history, hardship, or satisfaction',
  mailLabel: 'Mail & log',
  mailPrompt: 'Certified mail + file it with your receipts',
  escalateLabel: 'Plan escalation',
  escalatePrompt: 'Missed payment, wrong balance, or no close-out',
};

/** Decided without a payment plan (dismissed, satisfied, judgment on file, case resolved). */
const POST_COURT_CLOSEOUT_HINTS: TrackHints = {
  intro:
    'This matter is decided. The job now is closure proof: signed order in your vault, correct balance, and accurate reporting.',
  caseLabel: 'Decided case',
  casePrompt: 'Pick the closed case',
  chooseLabel: 'Choose close-out letter',
  choosePrompt: 'Balance confirmation, satisfaction, or reporting fix',
  mailLabel: 'Mail & log',
  mailPrompt: 'Certified mail + file it with your receipts',
  escalateLabel: 'Close-out escalation',
  escalatePrompt: 'Wrong balance, missing order, or stale reporting',
};

function debtTrackHints(
  track: DebtLetterTrack,
  opts?: { postCourtPlan?: boolean; postCourtDecided?: boolean },
): TrackHints {
  if (track === 'court' && opts?.postCourtPlan) return POST_COURT_PLAN_HINTS;
  if (track === 'court' && opts?.postCourtDecided) return POST_COURT_CLOSEOUT_HINTS;
  return TRACK_HINTS[track];
}

export function debtTrackIntro(track: DebtLetterTrack, postCourtPlan = false, postCourtDecided = false): string {
  return debtTrackHints(track, { postCourtPlan, postCourtDecided }).intro;
}

export function buildDebtLetterPathSteps(opts: {
  hasCase: boolean;
  proofCount: number;
  hasChosenLetter: boolean;
  hasDraftBody: boolean;
  savedToVault?: boolean;
  /** Letters already mailed/sent for this partner on this track. */
  mailedCount?: number;
  track?: DebtLetterTrack;
  /** Court matter already resolved into a monthly payment plan. */
  postCourtPlan?: boolean;
  /** Court matter decided without a plan (dismissed / satisfied / case resolved). */
  postCourtDecided?: boolean;
}): LetterStepPathItem[] {
  const {
    hasCase,
    proofCount,
    hasChosenLetter,
    hasDraftBody,
    savedToVault,
    mailedCount = 0,
    track = 'debt',
    postCourtPlan = false,
    postCourtDecided = false,
  } = opts;
  const hints = debtTrackHints(track, { postCourtPlan, postCourtDecided });

  return [
    {
      id: 'case',
      label: hints.caseLabel,
      meta: hasCase ? 'Selected' : hints.casePrompt,
      done: hasCase,
    },
    {
      id: 'choose',
      label: hints.chooseLabel,
      meta: hasChosenLetter ? 'Ready' : hints.choosePrompt,
      done: hasChosenLetter,
      disabled: !hasCase,
      disabledReason: `Select a ${hints.caseLabel.toLowerCase()} first`,
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
      label: 'Save PDF',
      meta: savedToVault ? 'In vault' : 'Save PDF',
      done: Boolean(savedToVault),
      disabled: !hasDraftBody,
      disabledReason: 'Complete your draft first',
    },
    {
      id: 'mail',
      label: hints.mailLabel,
      meta: mailedCount > 0 ? `${mailedCount} sent` : hints.mailPrompt,
      done: mailedCount > 0,
      disabled: !savedToVault,
      disabledReason: 'Save the PDF to your vault first',
    },
    {
      id: 'escalate',
      label: hints.escalateLabel,
      meta: hints.escalatePrompt,
      done: false,
      optional: true,
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

export function runDebtLetterStep(
  id: DebtLetterStepId,
  opts?: { openDraft?: () => void; openVault?: () => void },
) {
  if (id === 'draft' || id === 'preview' || id === 'generate') {
    opts?.openDraft?.();
  }
  if (id === 'mail' && !document.getElementById('fc-debt-step-mail')) {
    opts?.openVault?.();
    return;
  }
  highlightDebtStepElement(id);
}
