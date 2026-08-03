import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldAlert } from 'lucide-react';
import { LetterStepPath, type LetterStepPathItem } from './LetterStepPath';
import { LetterDisclaimerFooter } from './LetterAddressSummary';
import { LetterEscalationPanel } from './LetterEscalationPanel';
import {
  debtTrackEscalationTrack,
  debtTrackIntro,
  debtTrackLabel,
  type DebtLetterStepId,
  type DebtLetterTrack,
} from '../../lib/letterDebtFlow';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';
import { LETTER_L5_CHROME_COLLAPSE } from './letterEasyFlowTokens';

export function DebtTrackEasyFlow({
  track,
  steps,
  onStep,
  onContinue,
  children,
  uploadFooter,
  /** Court matter already decided into a monthly payment plan. */
  postCourtPlan = false,
  /** Court matter decided without a plan (dismissed / satisfied / case resolved). */
  postCourtDecided = false,
  /** Suppress the ladder when a richer one is already on screen (court outcome panel). */
  hideEscalationLadder = false,
}: {
  track: DebtLetterTrack;
  steps: LetterStepPathItem[];
  onStep: (id: DebtLetterStepId) => void;
  onContinue: () => void;
  children: React.ReactNode;
  uploadFooter?: React.ReactNode;
  postCourtPlan?: boolean;
  postCourtDecided?: boolean;
  hideEscalationLadder?: boolean;
}) {
  const label = debtTrackLabel(track);
  const mainSteps = steps.filter((s) => !s.optional);
  const nextStep = mainSteps.find((s) => !s.done && !s.disabled) ?? mainSteps.find((s) => !s.done) ?? null;
  const continueLabel = nextStep ? `Continue — ${nextStep.label}` : 'All steps done — review and mail';
  const escalationTrack = debtTrackEscalationTrack(track);
  const accent = track === 'court' ? 'fuchsia' : 'emerald';

  return (
    <div className={`${FINELY_OS_COMPACT_PAGE} space-y-3`}>
      <LetterStepPath
        title={`${label} — what to do next`}
        steps={steps}
        onStep={(id) => onStep(id as DebtLetterStepId)}
        onContinue={onContinue}
        continueLabel={continueLabel}
      />
      <p className={`px-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
        {debtTrackIntro(track, postCourtPlan, postCourtDecided)}
      </p>
      {children}

      <section id="fc-debt-step-mail" className={`${finelyOsCatalogCardCompact(accent)} space-y-2`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Mail size={14} className={track === 'court' ? 'text-fuchsia-300' : 'text-emerald-300'} />
            <div className="min-w-0">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>
                {track === 'court' ? 'File and serve' : 'Mail and track'}
              </div>
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                {track === 'court'
                  ? 'A filing only counts once the clerk has it and counsel is served'
                  : 'A letter only counts once you can prove it was sent'}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Link to="/portal/letters/vault" className={FINELY_OS_SECONDARY_BTN}>
              Letters vault
            </Link>
            <Link to="/portal/documents" className={FINELY_OS_SECONDARY_BTN}>
              Save the receipt
            </Link>
          </div>
        </div>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          {track === 'court'
            ? 'File the stamped copy with the court, serve plaintiff counsel, then upload the stamped filing and proof of service to your vault.'
            : 'Send certified mail with return receipt, then upload the mailing receipt and tracking number so the clock is provable later.'}
        </p>
      </section>

      <section id="fc-debt-step-escalate" className="space-y-2">
        {hideEscalationLadder ? (
          <div className={`${finelyOsCatalogCardCompact(accent)} space-y-1`}>
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-fuchsia-300" />
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Escalation</div>
            </div>
            <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
              This matter is on a payment plan — the plan escalation ladder (missed payment, wrong balance, missing
              close-out paperwork) is in the court outcome panel above.
            </p>
          </div>
        ) : (
          <LetterEscalationPanel track={escalationTrack} accent={accent} compact />
        )}
      </section>

      {uploadFooter ? (
        <section className={`space-y-2 ${LETTER_L5_CHROME_COLLAPSE}`}>{uploadFooter}</section>
      ) : null}
      <LetterDisclaimerFooter />
    </div>
  );
}
