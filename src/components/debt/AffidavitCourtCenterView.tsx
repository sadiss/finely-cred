import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Gavel, Mail, Shield, Upload } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import type { DebtCase } from '../../domain/debt';
import type { DebtLetterType, DebtScenario } from '../../domain/debtLegal';
import type { ProcessedDocument } from '../../domain/documents';
import type { ParsedCreditReport } from '../../domain/creditReports';
import type { Partner } from '../../domain/partners';
import { upsertDebt } from '../../data/debtRepo';
import { DebtCreditorIntelPanel } from './DebtCreditorIntelPanel';
import { DebtProofCaptureStrip } from './DebtProofCaptureStrip';
import { CourtAdvisorChat } from './CourtAdvisorChat';
import { LetterCatalogBrowser } from './LetterCatalogBrowser';
import { PartnerDefenseKnowledgePanel } from './PartnerDefenseKnowledgePanel';
import { LitigationDocScraperChat } from './LitigationDocScraperChat';
import { SCENARIO_RECOMMENDATIONS } from '../../legal/debtLetterTemplates';
import { buildSummonsAffidavitContext } from '../../lib/debtCreditorIntel';
import {
  LITIGATION_STAGES,
  ROOSEVELT_COURT_HEARING_ISO,
  daysUntilHearing,
  defaultUrgentHearingIso,
  formatHearingCountdown,
  recommendLitigationStage,
  type LitigationStageId,
} from '../../lib/litigationHearingPlan';
import { isRooseveltCourtPartner } from '../../data/rooseveltCourtPartnerSeed';
import { getDebtBuyerCaseIntel } from '../../legal/litigation/debtBuyerCaseIntelligence';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_FIELD_WIDTH_SM,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowField,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type ReportRow = { id: string; parsed?: ParsedCreditReport | null };

const PIPELINE: Array<{
  id: LitigationStageId | 'letters' | 'evidence';
  n: number;
  title: string;
  plain: string;
  outcome: string;
  continueLabel: string;
}> = [
  {
    id: 'intake',
    n: 1,
    title: 'Drop your papers',
    plain: 'Summons, docket, affidavit, or collector PDF',
    outcome: 'Case facts filled',
    continueLabel: 'I dropped a file — Continue',
  },
  {
    id: 'answer',
    n: 2,
    title: 'Confirm parties',
    plain: 'Check plaintiff, firm, and mailing address only',
    outcome: 'Counsel address ready',
    continueLabel: 'Parties look good — Continue',
  },
  {
    id: 'affidavit',
    n: 3,
    title: 'Build answer & affidavit',
    plain: 'One tap each — then open vault to mail',
    outcome: 'Defense drafts ready',
    continueLabel: 'Drafts ready — Continue',
  },
  {
    id: 'discovery',
    n: 4,
    title: 'Add proof',
    plain: 'Photos / PDFs linked to this case (optional)',
    outcome: 'Defense file ready',
    continueLabel: 'Proof done — Continue',
  },
  {
    id: 'hearing',
    n: 5,
    title: 'Hearing + mail-ready',
    plain: 'Countdown, court-day kit, send via Finely Mail',
    outcome: 'Mail-ready defense',
    continueLabel: 'Build hearing kit',
  },
];

/**
 * Litigation Defense Command — foolproof 1→N pipeline for non-technical partners.
 * One screen, one step, giant Continue, hearing countdown always visible.
 */
export function AffidavitCourtCenterView({
  debt,
  debtId,
  debtCases,
  reports,
  processedDocuments,
  recommendedScenario,
  senderFields,
  onDebtChange,
  onSenderPersist,
  onDebtIdChange,
  onOpenDebtCenter,
  onSwitchToValidation,
  onSwitchToBankruptcy,
  showPathSwitcher,
  onBuildDraft,
  onBuildCatalogDraft,
  canSeeTemplates,
  selectedSummonsDocId,
  onSummonsDocChange,
  summonsDocCount,
  partner,
}: {
  debt: DebtCase | null;
  debtId: string;
  debtCases: DebtCase[];
  reports: ReportRow[];
  processedDocuments: ProcessedDocument[];
  recommendedScenario: DebtScenario;
  senderFields: Parameters<typeof DebtCreditorIntelPanel>[0]['senderFields'];
  onDebtChange: (d: DebtCase) => void;
  onSenderPersist: () => void;
  onDebtIdChange: (id: string) => void;
  onOpenDebtCenter: () => void;
  onSwitchToValidation?: () => void;
  onSwitchToBankruptcy?: () => void;
  showPathSwitcher?: boolean;
  onBuildDraft: (specId: DebtLetterType) => void;
  onBuildCatalogDraft?: (catalogId: string) => void;
  canSeeTemplates: boolean;
  selectedSummonsDocId?: string | null;
  onSummonsDocChange?: (id: string | null) => void;
  summonsDocCount?: number;
  partner?: Partner;
}) {
  const [params] = useSearchParams();
  const defaultHearing = defaultUrgentHearingIso();
  const rooseveltMatter = isRooseveltCourtPartner(partner);
  const scenarioRec = SCENARIO_RECOMMENDATIONS.find((r) => r.scenario === recommendedScenario);
  const caseNumber = debt?.courtCaseNumber;
  const summonsCtx = buildSummonsAffidavitContext({ debt, documents: processedDocuments });
  const buyerIntel = getDebtBuyerCaseIntel({
    partner,
    debt,
    plaintiff: debt?.name || summonsCtx.plaintiffName,
  });

  const hearingIso = (
    debt?.hearingDate ||
    params.get('hearing') ||
    (rooseveltMatter ? ROOSEVELT_COURT_HEARING_ISO : '') ||
    ''
  ).slice(0, 10);
  const daysLeft = hearingIso ? daysUntilHearing(hearingIso) : 999;
  const countdown = hearingIso ? formatHearingCountdown(daysLeft) : 'Set hearing date';
  const urgent = Boolean(hearingIso) && daysLeft >= 0 && daysLeft <= 14;

  const hasSummonsDoc = (summonsDocCount ?? 0) > 0 || processedDocuments.some((d) => d.docType === 'summons');
  const hasAddress = Boolean(debt?.recipientAddress || debt?.plaintiffLawFirmAddress || summonsCtx.collectorName);
  const stageFromQuery = params.get('stage') as LitigationStageId | null;
  const suggested = recommendLitigationStage({ hasSummonsDoc, daysLeft });
  const [step, setStep] = useState<number>(() => {
    const id = stageFromQuery || suggested;
    const hit = PIPELINE.findIndex((j) => j.id === id);
    return hit >= 0 ? hit : 0;
  });
  const [scrapedOnce, setScrapedOnce] = useState(false);
  const [appliedOnce, setAppliedOnce] = useState(false);
  const [builtAnswer, setBuiltAnswer] = useState(false);
  const [builtAffidavit, setBuiltAffidavit] = useState(false);

  useEffect(() => {
    if (!stageFromQuery) return;
    const hit = PIPELINE.findIndex((j) => j.id === stageFromQuery);
    if (hit >= 0) setStep(hit);
  }, [stageFromQuery]);

  const amountLabel = debt?.amountCents
    ? (debt.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : summonsCtx.amountClaimed || '—';

  const active = PIPELINE[step] || PIPELINE[0]!;
  const stageMeta = LITIGATION_STAGES.find((s) => s.id === active.id) || LITIGATION_STAGES[0]!;

  const doneFlags = useMemo(
    () => [
      appliedOnce || scrapedOnce || hasSummonsDoc || Boolean(caseNumber || summonsCtx.caseNumber),
      hasAddress || Boolean(debt?.recipientName || debt?.plaintiffLawFirm),
      builtAnswer || builtAffidavit,
      Boolean(debt?.linkedEvidenceIds?.length),
      daysLeft <= 3 || (builtAnswer && builtAffidavit),
    ],
    [
      appliedOnce,
      scrapedOnce,
      hasSummonsDoc,
      caseNumber,
      summonsCtx.caseNumber,
      hasAddress,
      debt?.recipientName,
      debt?.plaintiffLawFirm,
      debt?.linkedEvidenceIds?.length,
      builtAnswer,
      builtAffidavit,
      daysLeft,
    ],
  );

  const setHearingDate = (iso: string) => {
    if (!debt) return;
    onDebtChange(upsertDebt({ ...debt, hearingDate: iso.slice(0, 10) }));
  };

  const buildAnswer = () => {
    onBuildDraft('courtroom_written_answer');
    onBuildCatalogDraft?.('court_courtroom_written_answer');
    setBuiltAnswer(true);
  };

  const buildAffidavit = () => {
    const priority =
      (buyerIntel.letterPriorities.find((p) => String(p).includes('affidavit')) as DebtLetterType | undefined) ||
      'affidavit_of_dispute';
    onBuildDraft(priority);
    onBuildCatalogDraft?.('court_affidavit_dispute');
    setBuiltAffidavit(true);
  };

  const buildHearingKit = () => {
    onBuildDraft('courtroom_day_kit');
    onBuildCatalogDraft?.('court_courtroom_day_kit');
  };

  const goNext = () => {
    if (step < PIPELINE.length - 1) setStep((s) => s + 1);
    else buildHearingKit();
  };

  const runPrimaryContinue = () => {
    if (step === 0) {
      if (appliedOnce || doneFlags[0]) {
        setStep(1);
        return;
      }
      document.getElementById('fc-lit-drop')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (step === 1) {
      onSenderPersist();
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!builtAnswer) buildAnswer();
      if (!builtAffidavit) buildAffidavit();
      setStep(3);
      return;
    }
    if (step === 3) {
      setStep(4);
      return;
    }
    buildHearingKit();
  };

  const primaryLabel =
    step === 0
      ? appliedOnce || doneFlags[0]
        ? 'Continue → Confirm parties'
        : 'Drop a file below first'
      : step === 2
        ? builtAnswer && builtAffidavit
          ? 'Continue → Add proof'
          : 'Build answer + affidavit, then Continue'
        : active.continueLabel;

  const nextActionPlain =
    step === 0
      ? appliedOnce
        ? 'Facts applied — confirm parties next'
        : 'Drop summons / docket → Apply fills empty fields'
      : step === 1
        ? hasAddress
          ? 'Address ready — continue to build drafts'
          : 'Confirm firm mailing address, then Continue'
        : step === 2
          ? 'Tap Build written answer + Build affidavit'
          : step === 3
            ? 'Add optional proof, or skip with Continue'
            : 'Build court-day kit → open vault → Mail';

  return (
    <div className={`${FINELY_OS_COMPACT_PAGE} relative`}>
      <style>{`
        @keyframes fcLitGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.85; }
        }
        @keyframes fcLitIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fc-lit-glow { animation: fcLitGlow 4.5s ease-in-out infinite; }
        .fc-lit-in { animation: fcLitIn 0.4s ease-out both; }
        .fc-lit-giant {
          min-height: 3.25rem;
          font-size: 1rem;
          font-weight: 800;
          padding-left: 1.25rem;
          padding-right: 1.25rem;
        }
      `}</style>

      {/* Always-visible HUD — hearing + next action */}
      <section
        className={`sticky top-0 z-30 fc-lit-in rounded-2xl border px-4 py-3 backdrop-blur-md shadow-[0_12px_40px_-16px_rgba(0,0,0,0.85)] ${
          urgent
            ? 'border-amber-400/55 bg-black/85'
            : 'border-white/15 bg-black/80'
        }`}
        aria-label="Hearing countdown and next action"
      >
        <div className="fc-lit-glow pointer-events-none absolute -top-16 right-4 h-40 w-40 rounded-full blur-3xl bg-amber-400/25" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/90">
              <Gavel size={13} /> Litigation Command · Step {active.n} of {PIPELINE.length}
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-black tracking-tight text-white">{countdown}</span>
              <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Hearing <span className="text-white/90 font-semibold">{hearingIso || 'not set'}</span>
                {buyerIntel.patternId !== 'unknown' ? ` · ${buyerIntel.label}` : ''}
              </span>
            </div>
            <p className={`mt-1 text-sm font-semibold text-amber-100/95`}>Next: {nextActionPlain}</p>
            <p className={`mt-1 text-xs max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>{buyerIntel.doNowOneLiner}</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className={FINELY_OS_FIELD_WIDTH_SM}>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Hearing date</label>
              <input
                type="date"
                value={hearingIso}
                disabled={!debt}
                onChange={(e) => setHearingDate(e.target.value)}
                className={`${finelyOsGlowField('amber')} mt-1 w-full`}
              />
            </div>
            {rooseveltMatter ? (
              <button
                type="button"
                disabled={!debt}
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => setHearingDate(defaultHearing)}
              >
                Use Jul 27
              </button>
            ) : null}
          </div>
        </div>
        <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            ['Case #', (caseNumber || summonsCtx.caseNumber || 'Drop file').slice(0, 18)],
            ['Amount', amountLabel.slice(0, 14)],
            ['Plaintiff', (debt?.name || summonsCtx.plaintiffName || '—').slice(0, 16)],
            ['Docs', String(summonsDocCount ?? 0)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
              <div className="text-[9px] uppercase tracking-widest text-white/40">{k}</div>
              <div className="text-xs font-semibold text-white/90 truncate">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Numbered path — tap to jump; only current step body below */}
      <div className="fc-lit-in space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-white/45 px-1">Your easy path (do in order)</div>
        <div className="grid grid-cols-5 gap-1.5">
          {PIPELINE.map((j, idx) => {
            const on = idx === step;
            const done = doneFlags[idx];
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => setStep(idx)}
                className={`rounded-xl border px-1.5 py-2 text-center transition-all ${
                  on
                    ? 'border-amber-400/70 bg-amber-500/20 shadow-[0_0_22px_-8px_rgba(251,191,36,0.55)]'
                    : done
                      ? 'border-emerald-400/40 bg-emerald-500/10'
                      : 'border-white/10 bg-black/25 hover:border-white/25'
                }`}
              >
                <span
                  className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                    on ? 'bg-amber-400 text-black' : done ? 'bg-emerald-400 text-black' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {done && !on ? <CheckCircle2 size={13} /> : j.n}
                </span>
                <div className="mt-1 text-[10px] font-semibold text-white/90 leading-tight line-clamp-2">{j.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active step card — only one at a time */}
      <section className={`${finelyOsCatalogCardCompact('fuchsia')} !p-4 fc-lit-in space-y-4 border-amber-400/25`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className={`${FINELY_OS_ENTITY_TITLE} text-white`}>
              {active.n}. {active.title}
            </h2>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              {active.plain} → <span className="text-emerald-200/90">{active.outcome}</span>
            </p>
            <p className="mt-1 text-[10px] text-white/40">Educational · not legal advice · results vary</p>
          </div>
          <span className={finelyOsStatusChip(doneFlags[step] ? 'ok' : 'warn')}>
            {doneFlags[step] ? 'Done' : 'Do this now'}
          </span>
        </div>

        {/* STEP 1 — Drop / scrape */}
        {step === 0 ? (
          <div id="fc-lit-drop" className="space-y-3 scroll-mt-28">
            {!appliedOnce && !hasSummonsDoc && !caseNumber ? (
              <div className="rounded-2xl border-2 border-dashed border-amber-400/45 bg-amber-500/10 px-4 py-6 text-center space-y-2">
                <Upload className="mx-auto text-amber-300" size={28} />
                <p className="text-base font-bold text-white">No court file yet — start here</p>
                <p className={`text-sm max-w-md mx-auto ${FINELY_OS_ENTITY_BODY}`}>
                  Drop the summons, docket PDF, affidavit, or collector letter below. Finely scrapes the fields, then{' '}
                  <strong className="text-white/90">Apply</strong> fills every empty case field. You only confirm what matters.
                </p>
              </div>
            ) : null}
            <LitigationDocScraperChat
              debt={debt}
              partnerId={debt?.partnerId || debtCases[0]?.partnerId || partner?.id || ''}
              reports={reports}
              onDebtChange={(d) => {
                onDebtChange(d);
                if (d.id && d.id !== debtId) onDebtIdChange(d.id);
              }}
              defaultHearingIso={defaultHearing}
              autoApplyOnHighConfidence
              onScrapeComplete={() => setScrapedOnce(true)}
              onScrapeApplied={() => {
                setScrapedOnce(true);
                setAppliedOnce(true);
                setStep(1);
              }}
            />
            {/* Plain English for Midland/Citi, PRA, bank, and unknown — always on */}
            <div className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-2.5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-widest text-fuchsia-200/90">{buyerIntel.label}</div>
                <span className={finelyOsStatusChip('warn')}>What to do now</span>
              </div>
              <p className="text-sm font-semibold text-white/95 leading-snug">{buyerIntel.doNowOneLiner}</p>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{buyerIntel.whatMatters}</p>
              <ol className={`list-decimal pl-4 text-xs space-y-0.5 ${FINELY_OS_ENTITY_BODY}`}>
                {buyerIntel.nextSteps.slice(0, 3).map((s) => (
                  <li key={s.slice(0, 40)}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        {/* STEP 2 — Confirm parties only */}
        {step === 1 ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-sky-400/25 bg-sky-500/10 px-3 py-2.5 flex items-start gap-2">
              <Shield size={16} className="text-sky-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Confirm only these — then Continue</p>
                <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{buyerIntel.doNowOneLiner}</p>
                <ul className={`mt-1 text-xs list-disc pl-4 space-y-0.5 ${FINELY_OS_ENTITY_BODY}`}>
                  <li>Plaintiff / creditor name</li>
                  <li>Law firm + mailing address (for certificate of service) — never leave blank if scrape found one</li>
                  <li>Case number & hearing date (if scrape missed them)</li>
                </ul>
              </div>
            </div>
            <DebtCreditorIntelPanel
              partnerId={debt?.partnerId || debtCases[0]?.partnerId || partner?.id || ''}
              debt={debt}
              reports={reports}
              processedDocuments={processedDocuments}
              mode="court"
              senderFields={senderFields}
              onDebtChange={onDebtChange}
              onSenderPersist={onSenderPersist}
              selectedSummonsDocId={selectedSummonsDocId ?? undefined}
              onSummonsDocChange={onSummonsDocChange}
              compact
            />
          </div>
        ) : null}

        {/* STEP 3 — One-tap answer + affidavit */}
        {step === 2 ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-2 space-y-1">
              <p className="text-sm font-semibold text-white">{buyerIntel.label}</p>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{buyerIntel.doNowOneLiner}</p>
              {buyerIntel.courtSafePhrases[0] ? (
                <p className="text-[11px] text-emerald-100/85">Court-safe: “{buyerIntel.courtSafePhrases[0]}”</p>
              ) : null}
            </div>
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
              {stageMeta.nextAction} Tap both big buttons. Edit admissions carefully before mailing or filing.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                className={`${FINELY_OS_PRIMARY_BTN} fc-lit-giant w-full justify-center`}
                onClick={buildAnswer}
              >
                <FileText size={18} /> {builtAnswer ? 'Rebuild written answer' : 'Build written answer'}
              </button>
              <button
                type="button"
                className={`${FINELY_OS_PRIMARY_BTN} fc-lit-giant w-full justify-center !bg-fuchsia-500/20`}
                onClick={buildAffidavit}
              >
                <Shield size={18} /> {builtAffidavit ? 'Rebuild affidavit' : 'Build affidavit'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/portal/letters/vault" className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-1.5`}>
                <Mail size={14} /> Open vault (mail-ready)
              </Link>
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => {
                  onBuildDraft('defendant_discovery_requests');
                  onBuildCatalogDraft?.('court_discovery_full');
                }}
              >
                Also build discovery
              </button>
            </div>
            <details className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
              <summary className="cursor-pointer select-none text-xs font-semibold text-white/80">
                More court letters (advanced catalog)
              </summary>
              <div className="mt-3">
                <LetterCatalogBrowser
                  category="court"
                  accent="fuchsia"
                  extraCategories={['securitization']}
                  onBuild={(id, entry) => {
                    if (entry.letterType) onBuildDraft(entry.letterType);
                    else onBuildCatalogDraft?.(id);
                  }}
                />
                {!canSeeTemplates ? (
                  <div className="text-[10px] text-white/40 mt-2">Full letter bodies unlock on paid debt access.</div>
                ) : null}
              </div>
            </details>
          </div>
        ) : null}

        {/* STEP 4 — Proof */}
        {step === 3 ? (
          <div className="space-y-3">
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Optional but powerful — link screenshots, payment proof, or the scrape PDF to this case. Skip with Continue if you already have papers.
            </p>
            {partner ? (
              <DebtProofCaptureStrip partner={partner} debtCaseId={debt?.id} accent="fuchsia" uploadContext="court" />
            ) : (
              <p className={FINELY_OS_ENTITY_BODY}>Sign in as partner to attach proof.</p>
            )}
          </div>
        ) : null}

        {/* STEP 5 — Hearing + mail-ready */}
        {step === 4 ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-amber-200/85">Day-of hearing card</div>
              <ol className={`list-decimal pl-4 space-y-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                <li>Recognize the original account only if true — do not admit plaintiff ownership or the lawsuit balance.</li>
                <li>Ask five gates: named plaintiff · transfer chain · account-level match · amount math · witness knowledge.</li>
                <li>If new papers appear first at hearing: ask for time to review before answering.</li>
                <li>Bring your answer, affidavit, and scrape summary — not internet theories.</li>
              </ol>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <button type="button" className={`${FINELY_OS_PRIMARY_BTN} fc-lit-giant w-full justify-center`} onClick={buildHearingKit}>
                Build court-day kit <ArrowRight size={16} />
              </button>
              <Link
                to="/portal/letters/vault"
                className={`${FINELY_OS_PRIMARY_BTN} fc-lit-giant w-full justify-center inline-flex items-center gap-2`}
              >
                <Mail size={16} /> Mail-ready → Vault
              </Link>
            </div>
            <details className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
              <summary className="cursor-pointer select-none text-xs font-semibold text-white/80">
                Ask court coach (optional)
              </summary>
              <div className="mt-3">
                <CourtAdvisorChat
                  scenario={recommendedScenario}
                  debtName={debt?.name}
                  caseNumber={caseNumber}
                  stateJurisdiction={debt?.stateJurisdiction}
                />
              </div>
            </details>
          </div>
        ) : null}

        {/* Giant primary Continue */}
        <div className="pt-1 space-y-2">
          <button
            type="button"
            className={`${FINELY_OS_PRIMARY_BTN} fc-lit-giant w-full sm:w-auto justify-center shadow-[0_0_36px_-8px_rgba(251,191,36,0.65)]`}
            onClick={runPrimaryContinue}
          >
            {primaryLabel} <ArrowRight size={18} />
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {step > 0 ? (
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Back
              </button>
            ) : null}
            {step < PIPELINE.length - 1 && step !== 0 ? (
              <button type="button" className="text-[11px] text-white/45 underline" onClick={goNext}>
                Skip this step
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Case picker — compact, not competing */}
      <div className="flex flex-wrap items-end gap-3 px-1">
        <div className={FINELY_OS_FIELD_WIDTH_SM}>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Active case</label>
          <select
            value={debtId}
            onChange={(e) => onDebtIdChange(e.target.value)}
            className={`${finelyOsGlowField('fuchsia')} mt-1 w-full`}
          >
            {debtCases.length === 0 ? <option value="">No cases yet</option> : null}
            {debtCases.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.type}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="text-[10px] text-white/50 underline pb-2" onClick={onOpenDebtCenter}>
          All debt cases
        </button>
        {showPathSwitcher && onSwitchToValidation ? (
          <button type="button" className="text-[10px] text-white/50 underline pb-2" onClick={onSwitchToValidation}>
            Validation lane
          </button>
        ) : null}
        {showPathSwitcher && onSwitchToBankruptcy ? (
          <button type="button" className="text-[10px] text-white/50 underline pb-2" onClick={onSwitchToBankruptcy}>
            Bankruptcy lane
          </button>
        ) : null}
        {scenarioRec?.legalWarning ? (
          <p className="text-[10px] text-rose-100/80 max-w-md">{scenarioRec.legalWarning}</p>
        ) : null}
      </div>

      {/* Defense book — secondary accordion only */}
      <details className={`${finelyOsCatalogCardCompact('violet')} !p-3`}>
        <summary className="cursor-pointer select-none text-xs font-semibold text-white/85">
          Defense Book & laws (secondary — open only if you need deeper reading)
        </summary>
        <div className="mt-3">
          <PartnerDefenseKnowledgePanel
            mode="both"
            trackFilter="court"
            compact
            defaultOpen={false}
            partner={partner}
            hearingIso={hearingIso || undefined}
          />
        </div>
      </details>

      {/* Sticky bottom Continue — impossible to miss */}
      <div className="sticky bottom-2 z-20 fc-lit-in">
        <div className="rounded-2xl border border-amber-400/50 bg-black/90 backdrop-blur-md px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_10px_48px_-12px_rgba(0,0,0,0.9)]">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-amber-200/80">Do this next</div>
            <div className="text-sm font-bold text-white truncate">
              Step {active.n}: {active.title}
            </div>
            <div className={`text-[11px] truncate ${FINELY_OS_ENTITY_BODY}`}>{nextActionPlain}</div>
          </div>
          <button type="button" className={`${FINELY_OS_PRIMARY_BTN} fc-lit-giant`} onClick={runPrimaryContinue}>
            {primaryLabel.includes('Drop') ? 'Drop file' : 'Continue'} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <p className="text-center text-[9px] text-white/30">
        <Link to="/portal/escalations?tab=regulatory" className="underline hover:text-white/50">
          Escalations
        </Link>
        {' · '}Educational self-help · not legal advice · results vary
      </p>
    </div>
  );
}
