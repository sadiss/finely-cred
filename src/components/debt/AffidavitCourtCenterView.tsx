import React from 'react';
import { ArrowRight, Gavel } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DebtCase } from '../../domain/debt';
import type { DebtLetterType, DebtScenario } from '../../domain/debtLegal';
import type { ProcessedDocument } from '../../domain/documents';
import type { ParsedCreditReport } from '../../domain/creditReports';
import type { Partner } from '../../domain/partners';
import { DebtCreditorIntelPanel } from './DebtCreditorIntelPanel';
import { DebtProofCaptureStrip } from './DebtProofCaptureStrip';
import { CourtAdvisorChat } from './CourtAdvisorChat';
import { CollateralWorkstationSection, DebtVsDisputeExplainer } from './CollateralWorkstationSection';
import { LetterCatalogBrowser } from './LetterCatalogBrowser';
import { DEBT_LETTER_SPECS, SCENARIO_RECOMMENDATIONS } from '../../legal/debtLetterTemplates';
import { FinelyOsKpiGrid } from '../os/FinelyOsKpiGrid';
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
  const specs = DEBT_LETTER_SPECS.filter(
    (s) =>
      s.id.includes('summons') ||
      s.id.includes('answer') ||
      s.id.includes('affidavit') ||
      s.id === 'post_suit_validation_demand' ||
      s.id === 'assignment_chain_demand' ||
      s.id === 'defendant_discovery_requests' ||
      s.id === 'motion_to_compel_discovery',
  );
  const scenarioRec = SCENARIO_RECOMMENDATIONS.find((r) => r.scenario === recommendedScenario);
  const caseNumber = (debt as { courtCaseNumber?: string })?.courtCaseNumber;

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      <DebtVsDisputeExplainer variant="debt" />

      <div className={finelyOsCatalogCardCompact('violet')}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Gavel size={15} className="text-fuchsia-400 shrink-0" />
            <div>
              <span className={finelyOsMicroStat('fuchsia')}>Court</span>
              <div className={`mt-1 ${FINELY_OS_ENTITY_TITLE}`}>Affidavit & court workstation</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showPathSwitcher && onSwitchToValidation ? (
              <button type="button" onClick={onSwitchToValidation} className={FINELY_OS_SECONDARY_BTN}>
                Validation <ArrowRight size={12} />
              </button>
            ) : null}
            {showPathSwitcher && onSwitchToBankruptcy ? (
              <button type="button" onClick={onSwitchToBankruptcy} className={FINELY_OS_SECONDARY_BTN}>
                Bankruptcy <ArrowRight size={12} />
              </button>
            ) : null}
            <Link to="/portal/escalations?tab=regulatory" className={FINELY_OS_SECONDARY_BTN}>
              Escalations
            </Link>
          </div>
        </div>

        <FinelyOsKpiGrid
          dense
          glow="fuchsia"
          columns={4}
          items={[
            { label: 'Case #', value: (caseNumber || '—').slice(0, 12), accent: 'text-white/90' },
            { label: 'Summons', value: summonsDocCount ?? 0, accent: 'text-fuchsia-300' },
            { label: 'Filings', value: specs.length, accent: 'text-violet-300' },
            { label: 'Stage', value: String(recommendedScenario).replaceAll('_', ' ').slice(0, 10), accent: 'text-sky-300' },
          ]}
        />

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className={FINELY_OS_FIELD_WIDTH_SM}>
            <label className={FINELY_OS_ENTITY_SUBLABEL}>Case</label>
            <select value={debtId} onChange={(e) => onDebtIdChange(e.target.value)} className={`${finelyOsGlowField('fuchsia')} mt-1 w-full`}>
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
          <p className={`mt-2 text-[10px] ${FINELY_OS_ENTITY_BODY} rounded-lg border border-rose-500/25 bg-rose-500/10 px-2 py-1.5`}>
            {scenarioRec.legalWarning}
          </p>
        ) : null}
      </div>

      {partner ? <DebtProofCaptureStrip partner={partner} debtCaseId={debt?.id} accent="fuchsia" /> : null}

      <DebtCreditorIntelPanel
        partnerId={debt?.partnerId || debtCases[0]?.partnerId || ''}
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

      <div className={finelyOsCatalogCardCompact('violet')}>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Court & affidavit letters — pick & draft</div>
        <LetterCatalogBrowser
          category="court"
          accent="fuchsia"
          extraCategories={['securitization']}
          onBuild={(id, entry) => {
            if (entry.letterType) onBuildDraft(entry.letterType);
            else onBuildCatalogDraft?.(id);
          }}
        />
        {!canSeeTemplates ? <div className="mt-2 text-[10px] text-white/40">Full template bodies unlock on paid tiers.</div> : null}
      </div>

      <CollateralWorkstationSection title="Court coach" subtitle="Ask about answer deadlines, affidavits, discovery, and standing — full width section." accent="fuchsia">
        <CourtAdvisorChat
          scenario={recommendedScenario}
          debtName={debt?.name}
          caseNumber={caseNumber}
          stateJurisdiction={debt?.stateJurisdiction}
        />
      </CollateralWorkstationSection>
    </div>
  );
}
