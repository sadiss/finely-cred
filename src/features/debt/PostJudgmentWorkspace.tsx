import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Gavel,
  Landmark,
  Scale,
  ShieldAlert,
  Swords,
  Users,
} from 'lucide-react';
import type { DebtCase, PostJudgmentMechanism } from '../../domain/debt';
import { buildJudgmentAttackSteps } from '../../domain/judgmentAttackGuide';
import {
  describeClaimWindow,
  getStateExemptionProfile,
  PLACEHOLDER_LAST_VERIFIED,
} from '../../domain/stateExemptions';
import {
  describeExemptionAmountLine,
  getStateExemptionAmounts,
} from '../../domain/stateExemptionAmounts';
import {
  describeCollateralReview,
  describeJudgmentClock,
  getStateJudgmentClocks,
} from '../../domain/stateJudgmentClocks';
import { lettersForDebtCase } from '../../lib/debtCaseLetterLinkage';
import { upsertLetter } from '../../data/lettersRepo';
import { newId } from '../../utils/ids';
import { generateTextPdfToVault } from '../../letters/generateTextPdf';
import { stripLetterVendorBranding } from '../../lib/letterBodySafety';
import {
  getPostJudgmentLetterBody,
  POST_JUDGMENT_LETTER_SPECS,
  type PostJudgmentLetterType,
} from '../../legal/postJudgmentTemplates';
import { LAW_REFERENCES, REGULATORY_PORTALS } from '../../lib/legalResources';
import {
  computeLevyClaimDueAt,
  listPostJudgmentWorkflowTimers,
  type DebtWorkflowTimer,
} from '../../lib/debtWorkflowEngine';
import { letterDateDisplay } from '../../lib/letterSenderBlock';
import { downloadText, openUrlInNewTab } from '../../utils/download';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsCatalogCardCompact,
  finelyOsGlowField,
  type FinelyOsGlowAccent,
} from '../../features/os/finelyOsLightUi';
import { EcfrLiveCitePanel } from './EcfrLiveCitePanel';
import { LawHelpByZipHelper } from './LawHelpByZipHelper';
import './postJudgmentWorkspace.css';

const DISCLAIMER =
  'Educational process guidance only — not legal advice. Laws, deadlines, and exemption amounts vary by state and facts. Have a licensed attorney review your situation before sending letters or filing claims. Results vary.';

const MECHANISM_OPTIONS: {
  value: PostJudgmentMechanism;
  label: string;
  plainEnglish: string;
  accent: FinelyOsGlowAccent;
}[] = [
  {
    value: 'levy',
    label: 'Bank levy',
    plainEnglish:
      'A court writ or restraining notice reached your bank and funds are frozen or turned over.',
    accent: 'emerald',
  },
  {
    value: 'setoff',
    label: 'Deposit setoff',
    plainEnglish:
      'The same bank seized money from your checking or savings to pay a credit card or loan balance.',
    accent: 'violet',
  },
  {
    value: 'ach',
    label: 'ACH / electronic pull (Reg E)',
    plainEnglish:
      'An unexpected electronic debit or ACH withdrawal hit your account — you may have Reg E investigation rights.',
    accent: 'sky',
  },
];

const NON_PARTY_BRANCHES = [
  {
    id: 'sole_owner_minor' as const,
    title: 'Sole owner is a minor',
    body: 'The account is titled in a minor’s name or holds funds that belong to your child. A judgment against you generally cannot reach property owned solely by a non-party minor.',
    accent: 'emerald' as const,
  },
  {
    id: 'custodial' as const,
    title: 'Custodial / UTMA / 529-style account',
    body: 'Funds are held in a custodial or designated-benefit account where you manage but do not own the underlying property. Confirm titling before any turnover.',
    accent: 'violet' as const,
  },
  {
    id: 'joint_contribution' as const,
    title: 'Joint account — your contribution only',
    body: 'You share the account with a spouse, partner, or family member but not all deposited funds are yours. Levy rights may be limited to your proportionate interest.',
    accent: 'sky' as const,
  },
];

const SECTION_ACCENTS: FinelyOsGlowAccent[] = ['emerald', 'violet', 'sky', 'rose'];

const MECHANISM_SELECTED: Record<FinelyOsGlowAccent, string> = {
  emerald: 'border-emerald-400/55 bg-emerald-500/12 ring-1 ring-emerald-400/25',
  violet: 'border-violet-400/55 bg-violet-500/12 ring-1 ring-violet-400/25',
  sky: 'border-sky-400/55 bg-sky-500/12 ring-1 ring-sky-400/25',
  fuchsia: 'border-fuchsia-400/55 bg-fuchsia-500/12 ring-1 ring-fuchsia-400/25',
  amber: 'border-fuchsia-400/55 bg-fuchsia-500/12 ring-1 ring-fuchsia-400/25',
  rose: 'border-rose-400/55 bg-rose-500/12 ring-1 ring-rose-400/25',
};

const BRANCH_SELECTED: Record<(typeof NON_PARTY_BRANCHES)[number]['accent'], string> = {
  emerald: 'border-emerald-400/55 bg-emerald-500/10',
  violet: 'border-violet-400/55 bg-violet-500/10',
  sky: 'border-sky-400/55 bg-sky-500/10',
};

function resolveProfileState(debt: DebtCase): string | undefined {
  return debt.accountState ?? debt.judgmentState ?? debt.stateJurisdiction;
}

function mechanismLetterPriority(mechanism: PostJudgmentMechanism | undefined): PostJudgmentLetterType[] {
  if (mechanism === 'ach') {
    return ['reg_e_unauthorized_transfer_stop', 'records_signature_card_request', 'cfr_212_protected_benefits_notice'];
  }
  if (mechanism === 'setoff') {
    return ['reg_z_card_offset_demand', 'records_signature_card_request', 'cfr_212_protected_benefits_notice'];
  }
  return ['records_signature_card_request', 'cfr_212_protected_benefits_notice', 'non_party_minor_account_demand'];
}

export type PostJudgmentWorkspaceProps = {
  debt: DebtCase;
  debtorName: string;
  canonicalAddress?: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  onUpdateDebt: (updates: Partial<DebtCase>) => void;
  onSavedToVault?: (saved: { id: string; title: string }) => void;
};

export function PostJudgmentWorkspace({
  debt,
  debtorName,
  canonicalAddress,
  onUpdateDebt,
  onSavedToVault,
}: PostJudgmentWorkspaceProps) {
  const [nonPartyBranch, setNonPartyBranch] = useState<(typeof NON_PARTY_BRANCHES)[number]['id'] | null>(null);
  const [letterBusy, setLetterBusy] = useState<string | null>(null);
  const [vaultNotice, setVaultNotice] = useState<string | null>(null);
  const [doneSteps, setDoneSteps] = useState<Set<string>>(new Set());
  const [timers, setTimers] = useState<DebtWorkflowTimer[]>([]);
  const [timersReady, setTimersReady] = useState(false);

  const profileState = resolveProfileState(debt);
  const profile = useMemo(() => getStateExemptionProfile(profileState), [profileState]);
  const profileUnverified = profile?.lastVerified === PLACEHOLDER_LAST_VERIFIED;
  const levyDueAtEstimate = useMemo(() => computeLevyClaimDueAt(debt), [debt]);
  const attackSteps = useMemo(() => buildJudgmentAttackSteps(debt), [debt]);
  const judgmentClocks = useMemo(
    () => getStateJudgmentClocks(debt.judgmentState ?? debt.stateJurisdiction ?? debt.accountState ?? profileState),
    [debt.judgmentState, debt.stateJurisdiction, debt.accountState, profileState],
  );
  const exemptionAmounts = useMemo(() => getStateExemptionAmounts(profileState), [profileState]);
  const vaultedSpecIds = useMemo(() => {
    const ids = new Set<string>();
    for (const letter of lettersForDebtCase(debt.partnerId, debt.id)) {
      const specId = (letter.meta as { letterSpecId?: string } | undefined)?.letterSpecId;
      if (specId) ids.add(specId);
    }
    return ids;
  }, [debt.partnerId, debt.id, vaultNotice]);

  const timerKey = [
    debt.id,
    debt.type,
    debt.mechanism ?? '',
    debt.accountState ?? '',
    debt.judgmentState ?? '',
    debt.stateJurisdiction ?? '',
    debt.firstContactDate ?? '',
    debt.dateServed ?? '',
    debt.hearingDate ?? '',
    debt.judgmentEnteredAt ?? '',
    debt.postTrialMotionFiledAt ?? '',
    debt.didNotParticipateInHearing ? '1' : '',
    debt.billOfReviewNotedAt ?? '',
    debt.createdAt,
  ].join('|');

  useEffect(() => {
    let cancelled = false;
    setTimersReady(false);
    listPostJudgmentWorkflowTimers(debt)
      .then((next) => {
        if (!cancelled) setTimers(next);
      })
      .finally(() => {
        if (!cancelled) setTimersReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [timerKey]);

  const escalationLinks = useMemo(() => {
    const lawHelp = LAW_REFERENCES.find((l) => l.id === 'lawhelp');
    const occ = REGULATORY_PORTALS.find((l) => l.id === 'occ-helpwithmybank');
    const cfpb = REGULATORY_PORTALS.find((l) => l.id === 'cfpb');
    return [lawHelp, occ, cfpb].filter(Boolean);
  }, []);

  const letterArgs = useMemo(
    () => ({
      creditorName: debt.recipientName || debt.name,
      debtorName,
      date: letterDateDisplay(),
      debtorAddress1: canonicalAddress?.address1,
      debtorAddress2: canonicalAddress?.address2,
      debtorCity: canonicalAddress?.city,
      debtorState: canonicalAddress?.state,
      debtorPostalCode: canonicalAddress?.postalCode,
      recipientName: debt.accountBank || debt.recipientName || debt.name,
      recipientAddress: debt.recipientAddress,
      accountNumber: debt.accountNumberMasked,
      accountBank: debt.accountBank,
      mechanism: debt.mechanism,
      judgmentState: debt.judgmentState,
      accountState: debt.accountState,
      nonPartyInvolved: debt.nonPartyInvolved,
    }),
    [debt, debtorName, canonicalAddress],
  );

  const priorityLetters = mechanismLetterPriority(debt.mechanism);
  const sortedSpecs = useMemo(() => {
    const order = new Map(priorityLetters.map((id, i) => [id, i]));
    return [...POST_JUDGMENT_LETTER_SPECS].sort((a, b) => {
      const ai = order.get(a.id) ?? 99;
      const bi = order.get(b.id) ?? 99;
      return ai - bi;
    });
  }, [priorityLetters]);

  const handleLetter = async (letterType: PostJudgmentLetterType, mode: 'download' | 'open' | 'vault') => {
    setLetterBusy(letterType);
    setVaultNotice(null);
    try {
      const body = stripLetterVendorBranding(getPostJudgmentLetterBody(letterType, letterArgs));
      const safeName = (debt.name || 'debt').replace(/[^\w.-]+/g, '_').slice(0, 40);
      const filename = `PostJudgment_${letterType}_${safeName}.txt`;
      if (mode === 'download') {
        downloadText({ text: body, filename });
        return;
      }
      if (mode === 'open') {
        const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        openUrlInNewTab({ url, revoke: () => URL.revokeObjectURL(url) });
        return;
      }
      const spec = POST_JUDGMENT_LETTER_SPECS.find((s) => s.id === letterType);
      const title = `${spec?.title ?? 'Post-judgment letter'} • ${debt.name}`;
      const pdf = await generateTextPdfToVault({
        text: body,
        filename: `PostJudgment_${letterType}_${safeName}.pdf`,
        meta: { partnerId: debt.partnerId, debtId: debt.id, type: 'court', letterSpecId: letterType },
      });
      const saved = upsertLetter({
        id: newId('letter'),
        partnerId: debt.partnerId,
        type: 'court',
        title,
        createdAt: new Date().toISOString(),
        body,
        status: 'generated',
        pdfBlobRef: pdf.pdfBlobRef ?? undefined,
        pdfFilename: pdf.filename,
        meta: {
          context: 'debt',
          debtId: debt.id,
          letterSpecId: letterType,
          courtCaseNumber: debt.courtCaseNumber,
          jurisdictionState: debt.judgmentState ?? debt.stateJurisdiction,
        },
      });
      try {
        window.dispatchEvent(new CustomEvent('finely:store'));
      } catch {
        // ignore
      }
      setVaultNotice(`Saved “${saved.title}” to Letters Vault. Review with counsel before mailing.`);
      onSavedToVault?.({ id: saved.id, title: saved.title });
    } finally {
      setLetterBusy(null);
    }
  };

  const handleRecordsFirst = () => handleLetter('records_signature_card_request', 'open');

  const toggleStep = (id: string) => {
    setDoneSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className={`post-judgment-workspace ${FINELY_OS_PAGE}`} aria-label="Post-judgment and levy workspace">
      <div className={finelyOsCatalogCard('rose')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} flex items-center gap-2`}>
              <ShieldAlert size={18} className="text-rose-300" />
              Escalation resources
            </div>
            <p className="mt-2 text-lg font-semibold text-white/90">
              Free help and bank regulators when a levy, setoff, or ACH pull feels wrong.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {escalationLinks.map((link) => (
              <a
                key={link!.id}
                href={link!.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${FINELY_OS_SECONDARY_BTN} text-sm font-bold inline-flex items-center gap-1.5`}
              >
                {link!.label}
                <ExternalLink size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className={FINELY_OS_NOTICE_ERROR}>
        <AlertTriangle size={20} className="shrink-0 mt-0.5 text-rose-300" />
        <div>
          <div className="text-lg font-extrabold text-rose-100">Not legal advice</div>
          <p className="mt-2 text-base text-rose-100/90">{DISCLAIMER}</p>
        </div>
      </div>

      <div className={`${finelyOsCatalogCard(SECTION_ACCENTS[0])} space-y-6`}>
        <div className="flex items-center gap-3">
          <Gavel size={26} className="text-emerald-300" />
          <div>
            <h2 className={FINELY_OS_ENTITY_TITLE}>What happened to your money?</h2>
            <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
              Name the collection mechanism first — this shapes which letters and deadlines matter.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {MECHANISM_OPTIONS.map((opt) => {
            const selected = debt.mechanism === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdateDebt({ mechanism: opt.value })}
                className={`text-left rounded-2xl border p-6 transition-all ${
                  selected ? MECHANISM_SELECTED[opt.accent] : 'border-white/10 bg-black/25 hover:border-white/20'
                } ${finelyOsGlowField(opt.accent, 'p-6')}`}
              >
                <div className="text-lg font-extrabold text-white">{opt.label}</div>
                <p className="mt-3 text-base text-white/75 leading-relaxed">{opt.plainEnglish}</p>
              </button>
            );
          })}
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-2`}>Bank / institution</label>
            <input
              type="text"
              value={debt.accountBank ?? ''}
              onChange={(e) => onUpdateDebt({ accountBank: e.target.value || undefined })}
              placeholder="e.g. Chase, Capital One, Wells Fargo"
              className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} ${finelyOsGlowField('sky')}`}
            />
          </div>
          <div>
            <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-2`}>Account state</label>
            <input
              type="text"
              value={debt.accountState ?? ''}
              onChange={(e) => onUpdateDebt({ accountState: e.target.value?.toUpperCase() || undefined })}
              placeholder="e.g. NJ, NY"
              maxLength={2}
              className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} ${finelyOsGlowField('violet')}`}
            />
          </div>
          <div>
            <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-2`}>Judgment state</label>
            <input
              type="text"
              value={debt.judgmentState ?? ''}
              onChange={(e) => onUpdateDebt({ judgmentState: e.target.value?.toUpperCase() || undefined })}
              placeholder="e.g. NJ"
              maxLength={2}
              className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} ${finelyOsGlowField('emerald')}`}
            />
          </div>
          <div>
            <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-2`}>Judgment entered (for vacate / appeal clocks)</label>
            <input
              type="date"
              value={debt.judgmentEnteredAt ?? ''}
              onChange={(e) => onUpdateDebt({ judgmentEnteredAt: e.target.value || undefined })}
              className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} ${finelyOsGlowField('rose')}`}
            />
          </div>
          <div>
            <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-2`}>
              Post-trial motion filed (optional — only if already filed)
            </label>
            <input
              type="date"
              value={debt.postTrialMotionFiledAt ?? ''}
              onChange={(e) => onUpdateDebt({ postTrialMotionFiledAt: e.target.value || undefined })}
              className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} ${finelyOsGlowField('violet')}`}
            />
            <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
              Unlocks an extended appeal timer only when this state encodes one (for example Texas 90 days from the
              judgment date). Do not enter a date unless a motion is already on the case.
            </p>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-5 py-4 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(debt.nonPartyInvolved)}
              onChange={(e) => onUpdateDebt({ nonPartyInvolved: e.target.checked || undefined })}
              className="h-5 w-5 rounded border-white/30"
            />
            <span className="text-base font-bold text-white/90">Non-party owner involved (minor, spouse, business)</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-5 py-4 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(debt.didNotParticipateInHearing)}
              onChange={(e) => onUpdateDebt({ didNotParticipateInHearing: e.target.checked || undefined })}
              className="h-5 w-5 rounded border-white/30"
            />
            <span className="text-base font-bold text-white/90">
              Did not participate in the hearing (restricted-appeal gate — only if already true)
            </span>
          </label>
          <div>
            <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-2`}>
              Residual review opened (optional — only if a 2-1401 / bill-of-review track is already open)
            </label>
            <input
              type="date"
              value={debt.billOfReviewNotedAt ?? ''}
              onChange={(e) => onUpdateDebt({ billOfReviewNotedAt: e.target.value || undefined })}
              className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} ${finelyOsGlowField('sky')}`}
            />
            <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
              Unlocks a residual-review timer only when this state encodes one (for example Illinois 2-1401 or a Texas
              bill of review). Do not enter a date unless that track is already open.
            </p>
          </div>
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('rose')} space-y-6`}>
        <div className="flex items-center gap-3">
          <Swords size={26} className="text-rose-300" />
          <div>
            <h2 className={FINELY_OS_ENTITY_TITLE}>Judgment-attack path for this case</h2>
            <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
              One guided sequence for {debt.name || 'this judgment'} — not a second account list. Mark a
              step when you have started it. Results vary · not legal advice.
            </p>
          </div>
        </div>
        <ol className="space-y-4">
          {attackSteps.map((step, idx) => {
            const done = doneSteps.has(step.id);
            return (
              <li key={step.id} className={`${finelyOsCatalogCardCompact(step.accent)} space-y-3`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>
                      Step {idx + 1} of {attackSteps.length}
                    </div>
                    <h3 className="mt-1 text-2xl font-extrabold text-white">{step.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleStep(step.id)}
                    className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
                  >
                    <CheckCircle2 size={16} className={done ? 'text-emerald-300' : 'text-white/40'} />
                    {done ? 'Started' : 'Mark started'}
                  </button>
                </div>
                <p className="text-base text-white/80 leading-relaxed">{step.whyNow}</p>
                <ul className="list-disc pl-6 space-y-2 text-base text-white/85">
                  {step.doThis.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="text-base text-white/60">{step.watchFor}</p>
              </li>
            );
          })}
        </ol>
      </div>

      <div className={`${finelyOsCatalogCard(SECTION_ACCENTS[1])} space-y-6`}>
        <div className="flex items-center gap-3">
          <Landmark size={26} className="text-violet-300" />
          <div>
            <h2 className={FINELY_OS_ENTITY_TITLE}>
              {profileState ? `${profileState} exemption profile` : 'State exemption profile'}
            </h2>
            <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
              Bank levy procedure and claim deadlines for the account or judgment state.
            </p>
          </div>
        </div>

        {!profile ? (
          <p className="text-base text-white/70">
            Add an account state or judgment state above so we can show levy procedure and claim deadlines.
          </p>
        ) : (
          <>
            {profileUnverified ? (
              <div className={`${FINELY_OS_NOTICE_ERROR} !border-fuchsia-500/35 !bg-fuchsia-500/10`}>
                <Scale size={18} className="shrink-0 text-fuchsia-300" />
                <div>
                  <div className="text-base font-bold text-fuchsia-100">Profile not fully verified for {profile.state}</div>
                  <p className="mt-1 text-base text-fuchsia-100/90">
                    This state entry is a placeholder — confirm all deadlines, forms, and exemption amounts with licensed
                    counsel before relying on it.{' '}
                    <a
                      href="https://www.lawhelp.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-fuchsia-200"
                    >
                      Find free legal help (LawHelp.org)
                    </a>
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className={finelyOsCatalogCardCompact('sky')}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Levy procedure</div>
                <p className="mt-2 text-base text-white/85 leading-relaxed">{profile.levyProcedure}</p>
              </div>
              <div className={finelyOsCatalogCardCompact('emerald')}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Claim window</div>
                <p className={`mt-2 text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                  {describeClaimWindow(profile)}
                </p>
                {levyDueAtEstimate ? (
                  <p className="mt-2 text-base text-white/65">
                    Weekend-adjusted estimate: {levyDueAtEstimate}
                  </p>
                ) : null}
              </div>
              <div className={finelyOsCatalogCardCompact('violet')}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Wage cap note</div>
                <p className="mt-2 text-base text-white/85">{profile.wageCapNote}</p>
              </div>
              <div className={finelyOsCatalogCardCompact('rose')}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Personal property / homestead</div>
                {exemptionAmounts ? (
                  <div className="mt-2 space-y-2 text-base text-white/90">
                    <p>
                      <span className="font-extrabold text-white">Homestead: </span>
                      {describeExemptionAmountLine(exemptionAmounts.homestead)}
                    </p>
                    {exemptionAmounts.wildcard ? (
                      <p>
                        <span className="font-extrabold text-white">Wildcard: </span>
                        {describeExemptionAmountLine(exemptionAmounts.wildcard)}
                      </p>
                    ) : null}
                    {exemptionAmounts.personalProperty ? (
                      <p>
                        <span className="font-extrabold text-white">Listed personal property: </span>
                        {describeExemptionAmountLine(exemptionAmounts.personalProperty)}
                      </p>
                    ) : null}
                    <p className="text-white/70">{exemptionAmounts.verifyNote}</p>
                  </div>
                ) : null}
                <p className="mt-3 text-base text-white/85">{profile.personalPropertyNote}</p>
              </div>
            </div>
            <div className="text-base text-white/55">
              Form: <span className="text-white/80">{profile.formName}</span> · Citation: {profile.citation} · Verified:{' '}
              {profile.lastVerified}
            </div>
          </>
        )}

        {judgmentClocks ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-extrabold text-white">Vacate, appeal, and confession clocks</h3>
              <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
                Separate from the levy claim window. Count from the judgment-entered date when you have it.
                Results vary · not legal advice.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {(
                [
                  { clock: judgmentClocks.vacate, accent: 'emerald' as const, title: 'Vacate / set aside' },
                  { clock: judgmentClocks.appeal, accent: 'violet' as const, title: 'Notice of appeal' },
                  { clock: judgmentClocks.coj, accent: 'sky' as const, title: 'Confession of judgment' },
                ] as const
              ).map((row) => (
                <article key={row.clock.kind} className={finelyOsCatalogCardCompact(row.accent)}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>{row.title}</div>
                  <p className={`mt-2 text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                    {describeJudgmentClock(row.clock)}
                  </p>
                  <p className="mt-3 text-base text-white/80 leading-relaxed">{row.clock.note}</p>
                  {row.clock.kind === 'appeal' && judgmentClocks.appealExtension ? (
                    <p className="mt-3 text-base text-violet-100/90 leading-relaxed">
                      Extended track: {describeJudgmentClock(judgmentClocks.appealExtension)} from the judgment date if a
                      qualifying motion is already on the case. {judgmentClocks.appealExtension.citation}.
                      {debt.postTrialMotionFiledAt
                        ? ' A second timer is active because a motion date is on this case.'
                        : ' No second timer yet — add the motion date above only if it was actually filed.'}
                    </p>
                  ) : null}
                  <p className="mt-3 text-base text-white/55">{row.clock.citation}</p>
                </article>
              ))}
            </div>
            {judgmentClocks.restrictedAppeal || judgmentClocks.billOfReview ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {judgmentClocks.restrictedAppeal ? (
                  <article className={finelyOsCatalogCardCompact('rose')}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Restricted appeal</div>
                    <p className={`mt-2 text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                      {describeCollateralReview(judgmentClocks.restrictedAppeal)}
                    </p>
                    <p className="mt-3 text-base text-white/80 leading-relaxed">{judgmentClocks.restrictedAppeal.note}</p>
                    <p className="mt-3 text-base text-white/55">{judgmentClocks.restrictedAppeal.citation}</p>
                    <p className="mt-3 text-base text-white/70">
                      {debt.didNotParticipateInHearing && debt.judgmentEnteredAt && !debt.postTrialMotionFiledAt
                        ? 'A timer is active because non-participation is marked and a judgment date is on this case.'
                        : 'No timer yet — mark non-participation and add the judgment date only if those facts already exist.'}
                    </p>
                  </article>
                ) : null}
                {judgmentClocks.billOfReview ? (
                  <article className={finelyOsCatalogCardCompact('violet')}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Residual review / bill of review</div>
                    <p className={`mt-2 text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                      {describeCollateralReview(judgmentClocks.billOfReview)}
                    </p>
                    <p className="mt-3 text-base text-white/80 leading-relaxed">{judgmentClocks.billOfReview.note}</p>
                    <p className="mt-3 text-base text-white/55">{judgmentClocks.billOfReview.citation}</p>
                    <p className="mt-3 text-base text-white/70">
                      {debt.billOfReviewNotedAt && debt.judgmentEnteredAt
                        ? 'A timer is active because a bill-of-review date is on this case.'
                        : 'No timer yet — add the bill-of-review date only if that track is already open.'}
                    </p>
                  </article>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={`${finelyOsCatalogCard(SECTION_ACCENTS[2])} space-y-4`}>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} flex items-center gap-2`}>
          <Clock size={18} className="text-sky-300" />
          Post-judgment deadlines
        </div>
        {!timersReady ? (
          <p className="text-base text-white/65">Adjusting weekends and U.S. federal holidays…</p>
        ) : timers.length === 0 ? (
          <p className="text-base text-white/65">
            Add a judgment or levy date and a state above to estimate a claim window. Confirm every date with counsel.
          </p>
        ) : (
          <ul className="space-y-3">
            {timers.map((t) => (
              <li
                key={t.kind}
                className={`rounded-2xl border px-5 py-4 text-base ${
                  t.tone === 'blocking'
                    ? 'border-rose-500/35 bg-rose-500/10 text-rose-100'
                    : t.tone === 'warning'
                      ? 'border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-100'
                      : 'border-sky-500/25 bg-sky-500/10 text-sky-100'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-lg font-extrabold">{t.label}</span>
                  <span className="text-base font-bold">
                    {t.daysRemaining <= 0
                      ? 'Past deadline — act now'
                      : `${t.daysRemaining} day${t.daysRemaining === 1 ? '' : 's'} left`}
                  </span>
                </div>
                <div className="mt-2 text-base text-white/70">
                  Due {t.dueAt.slice(0, 10)}
                  {t.holidayAdjusted ? ' · holiday-adjusted' : ''}
                </div>
                {t.windowLabel ? <div className="mt-1 text-base text-white/60">{t.windowLabel}</div> : null}
              </li>
            ))}
          </ul>
        )}
        <p className="text-base text-white/50">
          Timers skip weekends. When holiday data loads through the public-data proxy, U.S. federal holidays
          roll the last day forward. Not legal advice.
        </p>
      </div>

      {debt.nonPartyInvolved ? (
        <div className={`${finelyOsCatalogCard(SECTION_ACCENTS[3])} space-y-6`}>
          <div className="flex items-center gap-3">
            <Users size={26} className="text-rose-300" />
            <div>
              <h2 className={FINELY_OS_ENTITY_TITLE}>Non-party account — pick your situation</h2>
              <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
                A levy generally reaches only the judgment debtor&apos;s interest. Choose the branch that fits, then request
                account records first.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {NON_PARTY_BRANCHES.map((branch) => {
              const selected = nonPartyBranch === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => setNonPartyBranch(branch.id)}
                  className={`text-left rounded-2xl border p-6 transition-all ${
                    selected ? BRANCH_SELECTED[branch.accent] : 'border-white/10 bg-black/25 hover:border-white/20'
                  }`}
                >
                  <div className="text-lg font-extrabold text-white">{branch.title}</div>
                  <p className="mt-3 text-base text-white/75 leading-relaxed">{branch.body}</p>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRecordsFirst}
              disabled={letterBusy === 'records_signature_card_request'}
              className={FINELY_OS_SUCCESS_BTN}
            >
              <FileText size={16} />
              {letterBusy === 'records_signature_card_request' ? 'Opening…' : 'First action: request account records'}
            </button>
            {nonPartyBranch ? (
              <span className="text-base text-white/60">
                Selected: {NON_PARTY_BRANCHES.find((b) => b.id === nonPartyBranch)?.title}
              </span>
            ) : (
              <span className="text-base text-rose-200/80">Select a branch above to tailor your strategy.</span>
            )}
          </div>
        </div>
      ) : null}

      <div className={`${finelyOsCatalogCard('emerald')} space-y-6`}>
        <div className="flex items-center gap-3">
          <Banknote size={26} className="text-emerald-300" />
          <div>
            <h2 className={FINELY_OS_ENTITY_TITLE}>Post-judgment letter drafts</h2>
            <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
              Educational drafts for Reg E, Reg Z, 31 CFR 212, non-party demands, and records requests. Save into Letters
              Vault (same vault as other debt letters) after counsel review — not a second list.
            </p>
          </div>
        </div>
        {vaultNotice ? (
          <div className={FINELY_OS_NOTICE_SUCCESS}>
            <FileText size={18} className="shrink-0" />
            <p className="text-base">{vaultNotice}</p>
          </div>
        ) : null}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSpecs.map((spec, idx) => {
            const accent = SECTION_ACCENTS[idx % SECTION_ACCENTS.length];
            const isPriority = priorityLetters.includes(spec.id);
            return (
              <article
                key={spec.id}
                className={`${finelyOsCatalogCardCompact(accent)} flex flex-col gap-3 min-h-[12rem]`}
              >
                {isPriority ? (
                  <span className="text-sm font-extrabold uppercase tracking-widest text-emerald-300/90">
                    Recommended for your mechanism
                  </span>
                ) : null}
                {vaultedSpecIds.has(spec.id) ? (
                  <span className="text-sm font-extrabold uppercase tracking-widest text-sky-300/90">
                    Already in Letters Vault
                  </span>
                ) : null}
                <h3 className="text-xl font-extrabold text-white leading-snug">{spec.title}</h3>
                <p className="text-base text-white/75 flex-1">{spec.shortDescription}</p>
                <p className="text-base text-white/50">{spec.keyPrinciple}</p>
                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                  <button
                    type="button"
                    disabled={letterBusy === spec.id}
                    onClick={() => handleLetter(spec.id, 'open')}
                    className={`${FINELY_OS_SECONDARY_BTN} text-sm font-bold`}
                  >
                    {letterBusy === spec.id ? 'Working…' : 'Open text'}
                  </button>
                  <button
                    type="button"
                    disabled={letterBusy === spec.id}
                    onClick={() => handleLetter(spec.id, 'download')}
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    Download .txt
                  </button>
                  <button
                    type="button"
                    disabled={letterBusy === spec.id}
                    onClick={() => handleLetter(spec.id, 'vault')}
                    className={FINELY_OS_SUCCESS_BTN}
                  >
                    {letterBusy === spec.id ? 'Saving…' : 'Save to Letters Vault'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <EcfrLiveCitePanel />

      <LawHelpByZipHelper
        defaultZip={canonicalAddress?.postalCode}
        fallbackState={profileState ?? canonicalAddress?.state}
      />

      <p className="text-base text-white/55 max-w-3xl leading-relaxed">{DISCLAIMER}</p>
    </section>
  );
}
