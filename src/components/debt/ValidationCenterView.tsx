import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DebtCase } from '../../domain/debt';
import type { DebtLetterType, DebtScenario } from '../../domain/debtLegal';
import type { ProcessedDocument } from '../../domain/documents';
import type { ParsedCreditReport } from '../../domain/creditReports';
import type { Partner } from '../../domain/partners';
import type { LetterRecord } from '../../domain/letters';
import { DebtCreditorIntelPanel } from './DebtCreditorIntelPanel';
import { DebtProofCaptureStrip } from './DebtProofCaptureStrip';
import {
  FinelyOsStudioWorkstationLauncherRow,
  FinelyOsStudioWorkstationModals,
  type StudioWorkstationModal,
} from '../os/FinelyOsStudioWorkstation';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { ValidationAdvisorChat } from './ValidationAdvisorChat';
import { DebtVsDisputeExplainer } from './CollateralWorkstationSection';
import { LetterCatalogBrowser } from './LetterCatalogBrowser';
import { PartnerDefenseKnowledgePanel } from './PartnerDefenseKnowledgePanel';
import { SCENARIO_RECOMMENDATIONS } from '../../legal/debtLetterTemplates';
import {
  letterCatalogPool,
  type DebtLetterCatalogEntry,
  type LetterCatalogCategory,
} from '../../legal/debtLetterCatalog';
import { extractReportDebtSignals } from '../../lib/debtCreditorIntel';
import { adminEmbeddedNavHref } from '../../lib/adminPartnerRoutes';
import { isValidationTrackLetter } from '../../lib/letterProductLabels';
import { buildIntelligentLetterSuggestions } from '../../lib/intelligentLetterSuggestions';
import { IntelligentLetterSuggestionsPanel } from '../letters/IntelligentLetterSuggestionsPanel';
import { LetterStudioSavedVaultStrip } from '../letters/LetterStudioSavedVaultStrip';
import { FinelyOsKpiGrid } from '../os/FinelyOsKpiGrid';
import { FdcpaPowerChips } from './FdcpaPowerChips';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_FIELD_WIDTH_SM,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowField,
  finelyOsMicroStat,
} from '../../features/os/finelyOsLightUi';

type ReportRow = { id: string; parsed?: ParsedCreditReport | null };

/** Stable so the catalog browser and the KPI count read the exact same categories. */
const VALIDATION_EXTRA_CATEGORIES: LetterCatalogCategory[] = ['negotiation', 'reporting'];

export function ValidationCenterView({
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
  onSwitchToCourt,
  onSwitchToBankruptcy,
  showPathSwitcher,
  onBuildDraft,
  onBuildCatalogDraft,
  canSeeTemplates,
  partner,
  storeVersion = 0,
  onOpenLettersVault,
  generateBusy = false,
  generateError = null,
  vaultHighlightLetterId = null,
  canMailLetters = false,
  onMailLetter,
  adminPartnerId,
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
  onSwitchToCourt?: () => void;
  onSwitchToBankruptcy?: () => void;
  showPathSwitcher?: boolean;
  onBuildDraft: (specId: DebtLetterType) => void;
  onBuildCatalogDraft?: (catalogId: string) => void;
  canSeeTemplates: boolean;
  partner?: Partner;
  storeVersion?: number;
  onOpenLettersVault?: () => void;
  generateBusy?: boolean;
  generateError?: string | null;
  vaultHighlightLetterId?: string | null;
  canMailLetters?: boolean;
  onMailLetter?: (letter: LetterRecord) => void;
  /** When set, `/portal/*` links resolve to admin partner workspace routes. */
  adminPartnerId?: string;
}) {
  const nav = (href: string) => adminEmbeddedNavHref(adminPartnerId, href);
  const [workModal, setWorkModal] = React.useState<StudioWorkstationModal>(null);
  const [proofVersion, setProofVersion] = React.useState(0);
  const screenshotEvidence = React.useMemo(() => {
    void proofVersion;
    if (!partner?.id) return [];
    return listEvidenceByPartner(partner.id).filter((e) => e.type === 'screenshot');
  }, [partner?.id, proofVersion]);
  const vaultEvidence = React.useMemo(() => {
    if (!partner?.id) return [];
    return listEvidenceByPartner(partner.id);
  }, [partner?.id, storeVersion, proofVersion]);

  const scenarioRec = SCENARIO_RECOMMENDATIONS.find((r) => r.scenario === recommendedScenario);
  const signals = React.useMemo(() => extractReportDebtSignals(reports), [reports]);

  /**
   * Validation lane = validation-classified products only. Affidavits, court answers,
   * discovery, and hearing kits are blocked here — they live on the Court lane.
   */
  const caseIsLitigation =
    debt?.type === 'summons' ||
    recommendedScenario === 'summons_served' ||
    recommendedScenario === 'post_35_days';

  const validationEntryFilter = React.useCallback(
    (entry: DebtLetterCatalogEntry) =>
      isValidationTrackLetter({
        letterType: entry.letterType,
        catalogId: entry.id,
        category: entry.category,
        caseIsLitigation,
      }),
    [caseIsLitigation],
  );

  // Same pool the browser renders — so the KPI count can never drift from the visible list.
  const visibleLetterPool = React.useMemo(
    () =>
      letterCatalogPool({
        categories: ['validation', ...VALIDATION_EXTRA_CATEGORIES],
        hub: 'debt',
        filter: validationEntryFilter,
      }),
    [validationEntryFilter],
  );

  const letterSuggestions = React.useMemo(
    () =>
      buildIntelligentLetterSuggestions({
        track: 'validation',
        debt,
        partner,
        recommendedScenario,
      }),
    [debt, partner, recommendedScenario],
  );
  const totalBalanceCents = signals.reduce((sum, s) => sum + (s.balanceCents ?? 0), 0);
  const totalBalanceLabel =
    totalBalanceCents > 0
      ? (totalBalanceCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
      : '—';

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      <DebtVsDisputeExplainer variant="debt" />

      <div className={finelyOsCatalogCardCompact('violet')}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
            <div>
              <span className={finelyOsMicroStat('emerald')}>Validation</span>
              <div className={`mt-1 ${FINELY_OS_ENTITY_TITLE}`}>
                {caseIsLitigation
                  ? 'Validation letters — court work stays on the Court lane'
                  : 'Step 1 — Validation letter track'}
              </div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-sm mt-1`}>
                {caseIsLitigation
                  ? 'This lane only drafts FDCPA validation and dispute letters. Answers, affidavits, and discovery are on Court.'
                  : 'Pick a case, choose a letter, draft — proof is optional at the bottom.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showPathSwitcher && onSwitchToCourt ? (
              <button type="button" onClick={onSwitchToCourt} className={FINELY_OS_SECONDARY_BTN}>
                Court <ArrowRight size={12} />
              </button>
            ) : null}
            {showPathSwitcher && onSwitchToBankruptcy ? (
              <button type="button" onClick={onSwitchToBankruptcy} className={FINELY_OS_SECONDARY_BTN}>
                Bankruptcy <ArrowRight size={12} />
              </button>
            ) : null}
            <Link to={nav('/portal/escalations?tab=regulatory')} className={FINELY_OS_SECONDARY_BTN}>
              Escalations
            </Link>
          </div>
        </div>

        <FinelyOsKpiGrid
          dense
          glow="emerald"
          columns={4}
          items={[
            { label: 'Reported', value: signals.length, accent: 'text-violet-300' },
            { label: 'Balance', value: totalBalanceLabel, accent: 'text-sky-300' },
            { label: 'Scenario', value: scenarioRec?.label?.split(' ').slice(0, 2).join(' ') || '—', accent: 'text-white/80' },
            { label: 'Validation letters', value: visibleLetterPool.length, accent: 'text-emerald-300' },
          ]}
        />

        {debt ? (
          <div className="mt-3">
            <FdcpaPowerChips debt={debt} />
          </div>
        ) : null}

        <div id="fc-debt-step-case" className="mt-3 flex flex-wrap items-end gap-3 scroll-mt-3">
          <div className={FINELY_OS_FIELD_WIDTH_SM}>
            <label className={FINELY_OS_ENTITY_SUBLABEL}>Case</label>
            <select value={debtId} onChange={(e) => onDebtIdChange(e.target.value)} className={`${finelyOsGlowField('emerald')} mt-1 w-full`}>
              {debtCases.length === 0 ? <option value="">No cases</option> : null}
              {debtCases.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} • {d.type}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="text-[10px] text-white/55 underline pb-2" onClick={onOpenDebtCenter}>
            Debt center
          </button>
        </div>
        {scenarioRec?.legalWarning ? (
          <p className={`mt-2 text-[10px] ${FINELY_OS_ENTITY_BODY} rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1.5`}>
            {scenarioRec.legalWarning}
          </p>
        ) : null}
      </div>

      <FinelyOsStudioWorkstationLauncherRow
        escalationLabel="Validation escalation ladder"
        onScreenshots={() => setWorkModal('screenshots')}
        onUploads={() => setWorkModal('uploads')}
        onEscalation={() => setWorkModal('escalation')}
      />

      <DebtCreditorIntelPanel
        partnerId={debt?.partnerId || partner?.id || debtCases[0]?.partnerId || ''}
        adminPartnerId={adminPartnerId}
        debt={debt}
        reports={reports}
        processedDocuments={processedDocuments}
        mode="validation"
        senderFields={senderFields}
        onDebtChange={onDebtChange}
        onSenderPersist={onSenderPersist}
        compact
      />

      <div id="fc-debt-step-choose" className="scroll-mt-3 space-y-3">
        {letterSuggestions.crossLink?.track === 'litigation' ? (
          <div className="rounded-2xl border border-fuchsia-400/35 bg-fuchsia-500/10 px-3 py-2.5 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-200/90">
                Litigation detected — deadlines live on Court
              </div>
              <p className={`mt-1 text-xs max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>{letterSuggestions.crossLink.reason}</p>
            </div>
            {onSwitchToCourt ? (
              <button
                type="button"
                onClick={onSwitchToCourt}
                className={`${FINELY_OS_SECONDARY_BTN} border-fuchsia-400/45 text-fuchsia-100`}
              >
                {letterSuggestions.crossLink.label} <ArrowRight size={12} />
              </button>
            ) : (
              <Link
                to={nav('/portal/debt?tab=court')}
                className={`${FINELY_OS_SECONDARY_BTN} border-fuchsia-400/45 text-fuchsia-100`}
              >
                Open Court lane <ArrowRight size={12} />
              </Link>
            )}
          </div>
        ) : null}
        <IntelligentLetterSuggestionsPanel
          suggestions={letterSuggestions}
          accent="emerald"
          busy={generateBusy}
          error={generateError}
          onBuild={({ letterType, catalogId }) => {
            if (catalogId && onBuildCatalogDraft) onBuildCatalogDraft(catalogId);
            else if (letterType) onBuildDraft(letterType);
          }}
        />
        <LetterCatalogBrowser
          category="validation"
          accent="emerald"
          extraCategories={VALIDATION_EXTRA_CATEGORIES}
          letterHub="debt"
          filterEntry={validationEntryFilter}
          onBuild={(id, entry) => {
            if (onBuildCatalogDraft) onBuildCatalogDraft(id);
            else if (entry.letterType) onBuildDraft(entry.letterType);
          }}
        />
      </div>
      {!canSeeTemplates ? <div className="text-[10px] text-white/40">Full template bodies unlock on paid tiers.</div> : null}

      <PartnerDefenseKnowledgePanel mode="both" trackFilter="validation" compact adminPartnerId={adminPartnerId} />

      {partner ? (
        <LetterStudioSavedVaultStrip
          partnerId={partner.id}
          types={['validation']}
          storeVersion={storeVersion}
          evidence={vaultEvidence}
          accent="emerald"
          title="Your validation letters (vault)"
          subtitle="Saved as soon as you generate — draft or PDF. Preview, mail, or delete here; full archive opens separately."
          onOpenFullVault={onOpenLettersVault}
          highlightLetterId={vaultHighlightLetterId}
          canMail={canMailLetters}
          onMailLetter={onMailLetter}
        />
      ) : null}

      <ValidationAdvisorChat scenario={recommendedScenario} debtName={debt?.name} stateJurisdiction={debt?.stateJurisdiction} />

      {partner ? (
        <div id="fc-debt-step-proof" className="scroll-mt-3 rounded-xl border border-emerald-400/20 bg-black/20 !p-3">
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Proof and collector documents live in pop-up workstations — use <span className="text-emerald-200 font-semibold">Proof & uploads</span> above.
          </p>
        </div>
      ) : null}

      {partner ? (
        <FinelyOsStudioWorkstationModals
          partner={partner}
          open={workModal}
          onClose={() => setWorkModal(null)}
          screenshotEvidence={screenshotEvidence}
          escalationTrack="debt_validation"
          uploadContext="validation"
          onUploaded={() => setProofVersion((v) => v + 1)}
        />
      ) : null}
    </div>
  );
}
