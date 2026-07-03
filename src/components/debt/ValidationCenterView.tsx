import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DebtCase } from '../../domain/debt';
import type { DebtLetterType, DebtScenario } from '../../domain/debtLegal';
import type { ProcessedDocument } from '../../domain/documents';
import type { ParsedCreditReport } from '../../domain/creditReports';
import type { Partner } from '../../domain/partners';
import { DebtCreditorIntelPanel } from './DebtCreditorIntelPanel';
import { DebtProofCaptureStrip } from './DebtProofCaptureStrip';
import { ValidationAdvisorChat } from './ValidationAdvisorChat';
import { CollateralWorkstationSection, DebtVsDisputeExplainer } from './CollateralWorkstationSection';
import { LetterCatalogBrowser } from './LetterCatalogBrowser';
import { DEBT_LETTER_SPECS, SCENARIO_RECOMMENDATIONS } from '../../legal/debtLetterTemplates';
import { extractReportDebtSignals } from '../../lib/debtCreditorIntel';
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
}) {
  const specs = DEBT_LETTER_SPECS.filter(
    (s) =>
      !s.id.includes('summons') &&
      !s.id.includes('answer') &&
      !s.id.includes('affidavit') &&
      s.id !== 'post_suit_validation_demand',
  );
  const scenarioRec = SCENARIO_RECOMMENDATIONS.find((r) => r.scenario === recommendedScenario);
  const signals = React.useMemo(() => extractReportDebtSignals(reports), [reports]);
  const totalBalanceCents = signals.reduce((sum, s) => sum + (s.balanceCents ?? 0), 0);
  const totalBalanceLabel =
    totalBalanceCents > 0
      ? (totalBalanceCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
      : '—';

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      <DebtVsDisputeExplainer variant="debt" />

      {/* Single workstation header — neutral shell, track badge only */}
      <div className={finelyOsCatalogCardCompact('violet')}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
            <div>
              <span className={finelyOsMicroStat('emerald')}>Validation</span>
              <div className={`mt-1 ${FINELY_OS_ENTITY_TITLE}`}>FDCPA proof workstation</div>
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
            <Link to="/portal/escalations?tab=regulatory" className={FINELY_OS_SECONDARY_BTN}>
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
            { label: 'Letters', value: specs.length, accent: 'text-white/80' },
          ]}
        />

        <div className="mt-3 flex flex-wrap items-end gap-3">
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

      {partner ? <DebtProofCaptureStrip partner={partner} debtCaseId={debt?.id} accent="emerald" /> : null}

      {/* Intel: reported debts + collector mailing (sender block lives in draft modal) */}
      <DebtCreditorIntelPanel
        partnerId={debt?.partnerId || debtCases[0]?.partnerId || ''}
        debt={debt}
        reports={reports}
        processedDocuments={processedDocuments}
        mode="validation"
        senderFields={senderFields}
        onDebtChange={onDebtChange}
        onSenderPersist={onSenderPersist}
        compact
      />

      <LetterCatalogBrowser
        category="validation"
        accent="emerald"
        extraCategories={['negotiation', 'reporting']}
        onBuild={(id, entry) => {
          if (entry.letterType) onBuildDraft(entry.letterType);
          else onBuildCatalogDraft?.(id);
        }}
      />
      {!canSeeTemplates ? <div className="text-[10px] text-white/40">Full template bodies unlock on paid tiers.</div> : null}

      <CollateralWorkstationSection title="Validation coach" subtitle="Ask about 1692g proof demands, licensing, chain of title, and your next move — full width section." accent="emerald">
        <ValidationAdvisorChat scenario={recommendedScenario} debtName={debt?.name} stateJurisdiction={debt?.stateJurisdiction} />
      </CollateralWorkstationSection>
    </div>
  );
}
