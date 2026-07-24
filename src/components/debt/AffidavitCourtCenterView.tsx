import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Gavel, Shield, Upload } from 'lucide-react';
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
  daysUntilHearing,
  defaultUrgentHearingIso,
  formatHearingCountdown,
  recommendLitigationStage,
  type LitigationStageId,
} from '../../lib/litigationHearingPlan';
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

const JOURNEY: Array<{
  id: LitigationStageId | 'letters' | 'evidence';
  n: number;
  title: string;
  plain: string;
  outcome: string;
}> = [
  { id: 'intake', n: 1, title: 'Upload papers', plain: 'Summons, affidavit, or docket PDF', outcome: 'Case facts scraped' },
  { id: 'answer', n: 2, title: 'Confirm parties', plain: 'Plaintiff, counsel, mailing address', outcome: 'Counsel address filled' },
  { id: 'affidavit', n: 3, title: 'Build answer & affidavit', plain: 'Your written defense for the court', outcome: 'Answer draft ready' },
  { id: 'discovery', n: 4, title: 'Add proof', plain: 'Photos / PDFs linked to this case', outcome: 'Defense file ready' },
  { id: 'hearing', n: 5, title: 'Hearing brief', plain: 'What to say on the 27th', outcome: 'Hearing brief ready' },
];

/**
 * Litigation Defense Command — single home for court defense (elevated Court tab).
 * First-timer journey: Upload → Scrape → Confirm → Letters → Hearing brief.
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
  const scenarioRec = SCENARIO_RECOMMENDATIONS.find((r) => r.scenario === recommendedScenario);
  const caseNumber = debt?.courtCaseNumber;
  const summonsCtx = buildSummonsAffidavitContext({ debt, documents: processedDocuments });
  const hearingIso = (debt?.hearingDate || params.get('hearing') || defaultHearing).slice(0, 10);
  const daysLeft = daysUntilHearing(hearingIso);
  const countdown = formatHearingCountdown(daysLeft);
  const urgent = daysLeft >= 0 && daysLeft <= 14;

  const hasSummonsDoc = (summonsDocCount ?? 0) > 0 || processedDocuments.some((d) => d.docType === 'summons');
  const hasAddress = Boolean(debt?.recipientAddress || summonsCtx.collectorName);
  const stageFromQuery = params.get('stage') as LitigationStageId | null;
  const suggested = recommendLitigationStage({ hasSummonsDoc, daysLeft });
  const [step, setStep] = useState<number>(() => {
    const id = stageFromQuery || suggested;
    const hit = JOURNEY.findIndex((j) => j.id === id);
    return hit >= 0 ? hit : 0;
  });
  const [scrapedOnce, setScrapedOnce] = useState(false);

  useEffect(() => {
    if (!stageFromQuery) return;
    const hit = JOURNEY.findIndex((j) => j.id === stageFromQuery);
    if (hit >= 0) setStep(hit);
  }, [stageFromQuery]);

  useEffect(() => {
    if (!debt?.id || debt.hearingDate) return;
    onDebtChange(upsertDebt({ ...debt, hearingDate: hearingIso }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debt?.id]);

  const amountLabel = debt?.amountCents
    ? (debt.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : summonsCtx.amountClaimed || '—';

  const active = JOURNEY[step] || JOURNEY[0]!;
  const stageMeta = LITIGATION_STAGES.find((s) => s.id === active.id) || LITIGATION_STAGES[0]!;

  const doneFlags = useMemo(
    () => [
      scrapedOnce || hasSummonsDoc || Boolean(caseNumber || summonsCtx.caseNumber),
      hasAddress || Boolean(debt?.recipientName),
      false,
      Boolean(debt?.linkedEvidenceIds?.length),
      daysLeft <= 3,
    ],
    [scrapedOnce, hasSummonsDoc, caseNumber, summonsCtx.caseNumber, hasAddress, debt?.recipientName, debt?.linkedEvidenceIds?.length, daysLeft],
  );

  const setHearingDate = (iso: string) => {
    if (!debt) return;
    onDebtChange(upsertDebt({ ...debt, hearingDate: iso.slice(0, 10) }));
  };

  const buildPrimaryLetter = () => {
    if (step <= 2) {
      onBuildDraft('courtroom_written_answer');
      onBuildCatalogDraft?.('court_courtroom_written_answer');
      return;
    }
    if (step === 2 || active.id === 'affidavit') {
      onBuildDraft('affidavit_of_dispute');
      onBuildCatalogDraft?.('court_affidavit_dispute');
      return;
    }
    if (active.id === 'discovery') {
      onBuildDraft('defendant_discovery_requests');
      onBuildCatalogDraft?.('court_discovery_full');
      return;
    }
    onBuildDraft('courtroom_day_kit');
    onBuildCatalogDraft?.('court_courtroom_day_kit');
  };

  const primaryLabel =
    step === 0
      ? 'Scroll to upload ↓'
      : step === 1
        ? 'Save parties & continue'
        : step === 2
          ? 'Build my written answer'
          : step === 3
            ? 'Build discovery requests'
            : 'Build hearing day kit';

  return (
    <div className={`${FINELY_OS_COMPACT_PAGE} relative`}>
      <style>{`
        @keyframes fcLitGlow {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.7; }
        }
        @keyframes fcLitIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fcLitBar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .fc-lit-glow { animation: fcLitGlow 5.5s ease-in-out infinite; }
        .fc-lit-in { animation: fcLitIn 0.5s ease-out both; }
        .fc-lit-bar { transform-origin: left; animation: fcLitBar 0.7s ease-out both; }
      `}</style>

      {/* Cinematic hero — where / what / next */}
      <section
        className={`${finelyOsCatalogCardCompact('fuchsia')} !p-4 overflow-hidden relative fc-lit-in border-amber-400/30`}
        aria-label="Litigation Command"
      >
        <div
          className="fc-lit-glow pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.28), transparent 68%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-8 h-44 w-44 rounded-full blur-3xl opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(232,121,249,0.22), transparent 70%)' }}
        />

        <div className="relative space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/90">
                <Gavel size={14} /> Where you are · Litigation Command
              </div>
              <h2 className={`mt-1 ${FINELY_OS_ENTITY_TITLE} text-white`}>Court defense for your hearing</h2>
              <p className={`mt-1 text-sm max-w-xl ${FINELY_OS_ENTITY_BODY}`}>
                Follow the numbered steps. Each one ends with a clear result. Educational · not legal advice · results vary.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {showPathSwitcher && onSwitchToValidation ? (
                <button type="button" onClick={onSwitchToValidation} className={FINELY_OS_SECONDARY_BTN}>
                  Validation <ArrowRight size={12} />
                </button>
              ) : null}
              {showPathSwitcher && onSwitchToBankruptcy ? (
                <button type="button" onClick={onSwitchToBankruptcy} className={FINELY_OS_SECONDARY_BTN}>
                  Bankruptcy
                </button>
              ) : null}
            </div>
          </div>

          {/* What matters now — hearing */}
          <div
            className={`rounded-xl border px-4 py-3 ${
              urgent
                ? 'border-amber-400/55 bg-gradient-to-r from-amber-500/20 via-black/40 to-fuchsia-500/15 shadow-[0_0_32px_-10px_rgba(251,191,36,0.55)]'
                : 'border-white/10 bg-black/35'
            }`}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-amber-100/85">What matters now</div>
                <div className="text-3xl font-black tracking-tight text-white">{countdown}</div>
                <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  Hearing date <span className="text-white/90 font-semibold">{hearingIso}</span>
                  {urgent ? ' · focus on answer + affidavit first' : ''}
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className={FINELY_OS_FIELD_WIDTH_SM}>
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Set hearing date</label>
                  <input
                    type="date"
                    value={hearingIso}
                    disabled={!debt}
                    onChange={(e) => setHearingDate(e.target.value)}
                    className={`${finelyOsGlowField('amber')} mt-1 w-full`}
                  />
                </div>
                <button type="button" disabled={!debt} className={FINELY_OS_SECONDARY_BTN} onClick={() => setHearingDate(defaultHearing)}>
                  Use Jul 27
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                ['Case #', (caseNumber || summonsCtx.caseNumber || 'Add via upload').slice(0, 16)],
                ['Amount', amountLabel.slice(0, 14)],
                ['Plaintiff', (debt?.name || summonsCtx.plaintiffName || '—').slice(0, 14)],
                ['Docs', String(summonsDocCount ?? 0)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-white/10 bg-black/30 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-widest text-white/40">{k}</div>
                  <div className="text-xs font-semibold text-white/90 truncate">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress 1→5 */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/45 mb-2">Your path (tap any step)</div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-3">
              <div
                className="fc-lit-bar h-full rounded-full bg-gradient-to-r from-amber-400 via-fuchsia-400 to-sky-400"
                style={{ width: `${((step + 1) / JOURNEY.length) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {JOURNEY.map((j, idx) => {
                const on = idx === step;
                const done = doneFlags[idx];
                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => setStep(idx)}
                    className={`rounded-xl border px-2.5 py-2.5 text-left transition-all ${
                      on
                        ? 'border-amber-400/60 bg-amber-500/15 shadow-[0_0_22px_-8px_rgba(251,191,36,0.5)]'
                        : done
                          ? 'border-emerald-400/35 bg-emerald-500/10'
                          : 'border-white/10 bg-black/25 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                          on ? 'bg-amber-400 text-black' : done ? 'bg-emerald-400 text-black' : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {done && !on ? <CheckCircle2 size={12} /> : j.n}
                      </span>
                      <span className="text-[11px] font-semibold text-white/90 truncate">{j.title}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-white/45 line-clamp-2">{j.outcome}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* What do I do next */}
          <div className="rounded-xl border border-fuchsia-400/25 bg-black/35 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-fuchsia-200/80">What do I do next</div>
              <div className="text-sm font-semibold text-white">
                Step {active.n}: {active.title}
              </div>
              <p className={`text-xs mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>
                {active.plain} → <span className="text-emerald-200/90">{active.outcome}</span>
              </p>
            </div>
            <button
              type="button"
              className={FINELY_OS_PRIMARY_BTN}
              onClick={() => {
                if (step === 0) {
                  document.getElementById('fc-lit-upload')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  return;
                }
                if (step === 1) {
                  document.getElementById('fc-lit-parties')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setStep(2);
                  return;
                }
                buildPrimaryLetter();
              }}
            >
              {primaryLabel} <ArrowRight size={14} />
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-3">
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
            {scenarioRec?.legalWarning ? (
              <p className="text-[10px] text-rose-100/80 max-w-md">{scenarioRec.legalWarning}</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Step 1 — Upload + scrape (always visible when on step 0–1) */}
      {(step <= 1 || scrapedOnce) && (
        <section id="fc-lit-upload" className="fc-lit-in scroll-mt-3 space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Upload size={14} className="text-amber-300" />
            <span className="text-xs font-semibold text-white">1 · Upload summons / affidavit / docket</span>
            <span className={finelyOsStatusChip(scrapedOnce || hasSummonsDoc ? 'ok' : 'warn')}>
              {scrapedOnce || hasSummonsDoc ? 'Facts in' : 'Start here'}
            </span>
          </div>
          <LitigationDocScraperChat
            debt={debt}
            partnerId={debt?.partnerId || debtCases[0]?.partnerId || partner?.id || ''}
            onDebtChange={(d) => {
              onDebtChange(d);
              if (d.id && d.id !== debtId) onDebtIdChange(d.id);
            }}
            defaultHearingIso={defaultHearing}
            onScrapeApplied={() => {
              setScrapedOnce(true);
              setStep(1);
            }}
          />
        </section>
      )}

      {/* Step 2 — Parties / auto-fill */}
      {(step >= 1 || hasAddress) && (
        <section id="fc-lit-parties" className="fc-lit-in scroll-mt-3 space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Shield size={14} className="text-sky-300" />
            <span className="text-xs font-semibold text-white">2 · Confirm plaintiff & counsel mailing</span>
            <span className={finelyOsStatusChip(hasAddress ? 'ok' : 'warn')}>
              {hasAddress ? 'Address filled' : 'Needs address'}
            </span>
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
          <div className="flex justify-end">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setStep(2)}>
              Parties look good — build letters <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* Step 3 — Letters (open when active) */}
      {step >= 2 && (
        <section id="fc-lit-letters" className={`${finelyOsCatalogCardCompact('violet')} fc-lit-in scroll-mt-3 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-fuchsia-300" />
              <span className="text-xs font-semibold text-white">3 · Build answer & affidavit</span>
            </div>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={buildPrimaryLetter}>
              {step >= 4 ? 'Build hearing day kit' : 'Build written answer'} <ArrowRight size={14} />
            </button>
          </div>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {stageMeta.nextAction} Outcome: <span className="text-emerald-200/90">{active.outcome}</span>
          </p>
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
            <div className="text-[10px] text-white/40">Full letter bodies unlock on paid debt access.</div>
          ) : null}
        </section>
      )}

      {/* Step 4 — Evidence */}
      {step >= 3 && partner ? (
        <section id="fc-lit-proof" className="fc-lit-in scroll-mt-3 space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold text-white">4 · Add proof to this defense file</span>
            <span className={finelyOsStatusChip('info')}>Links to case</span>
          </div>
          <DebtProofCaptureStrip partner={partner} debtCaseId={debt?.id} accent="fuchsia" uploadContext="court" />
          <div className="flex justify-end">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setStep(4)}>
              Proof added — hearing brief <ArrowRight size={14} />
            </button>
          </div>
        </section>
      ) : null}

      {/* Step 5 — Hearing brief + defense book (open on last step) */}
      {step >= 4 && (
        <section className="fc-lit-in space-y-3">
          <div className={`${finelyOsCatalogCardCompact('amber')} space-y-2`}>
            <div className="text-[10px] uppercase tracking-widest text-amber-200/80">5 · Day-of hearing brief</div>
            <ol className={`list-decimal pl-4 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              <li>Recognize the original account only if true — do not admit plaintiff ownership or the lawsuit balance.</li>
              <li>Ask five gates: named plaintiff · transfer chain · account-level match · amount math · witness knowledge.</li>
              <li>If new papers appear first at hearing: ask for time to review before answering.</li>
              <li>Bring your answer, affidavit, and this scrape summary — not internet theories.</li>
            </ol>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => onBuildDraft('courtroom_day_kit')}>
              Build court-day kit <ArrowRight size={14} />
            </button>
            <p className="text-[9px] text-white/40">Educational · not legal advice · results vary by facts and court</p>
          </div>
          <PartnerDefenseKnowledgePanel mode="both" trackFilter="court" compact defaultOpen />
          <div className={`${finelyOsCatalogCardCompact('fuchsia')} space-y-2`}>
            <div className={`text-xs font-semibold text-white`}>Ask the court coach</div>
            <CourtAdvisorChat
              scenario={recommendedScenario}
              debtName={debt?.name}
              caseNumber={caseNumber}
              stateJurisdiction={debt?.stateJurisdiction}
            />
          </div>
        </section>
      )}

      {/* Sticky next CTA */}
      <div className="sticky bottom-2 z-20 fc-lit-in">
        <div className="rounded-xl border border-amber-400/40 bg-black/80 backdrop-blur-md px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8)]">
          <div className="text-[11px] text-white/70">
            <span className="text-amber-200 font-semibold">Next:</span> {active.title} → {active.outcome}
          </div>
          <div className="flex gap-2">
            {step > 0 ? (
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Back
              </button>
            ) : null}
            <button
              type="button"
              className={FINELY_OS_PRIMARY_BTN}
              onClick={() => {
                if (step < JOURNEY.length - 1) setStep((s) => s + 1);
                else buildPrimaryLetter();
              }}
            >
              {step < JOURNEY.length - 1 ? 'Continue' : 'Build hearing kit'} <ArrowRight size={14} />
            </button>
          </div>
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
