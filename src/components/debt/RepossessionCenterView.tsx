import React, { useMemo, useState } from 'react';
import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DebtCase } from '../../domain/debt';
import type { Partner } from '../../domain/partners';
import { DebtCreditorIntelPanel } from './DebtCreditorIntelPanel';
import { DebtProofCaptureStrip } from './DebtProofCaptureStrip';
import { LetterCatalogBrowser } from './LetterCatalogBrowser';
import { RepossessionAdvisorChat } from './RepossessionAdvisorChat';
import { CollateralDefenseShell, type CollateralPlaybookStep } from './CollateralDefenseShell';
import { CollateralWorkstationSection, DebtVsDisputeExplainer } from './CollateralWorkstationSection';
import { catalogForCategory } from '../../legal/debtLetterCatalog';
import { extractCollateralSignals } from '../../lib/debtCreditorIntel';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_FIELD_WIDTH_SM,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowField,
} from '../../features/os/finelyOsLightUi';

import type { ProcessedDocument } from '../../domain/documents';
import type { ParsedCreditReport } from '../../domain/creditReports';

type ReportRow = { id: string; parsed?: ParsedCreditReport | null };

const PLAYBOOK: CollateralPlaybookStep[] = [
  { id: 'wrongful', label: 'Wrongful repo', detail: 'Breach of peace / no default', law: 'UCC § 9-609' },
  { id: 'reinstate', label: 'Reinstate / redeem', detail: 'Recover vehicle pre-sale', law: 'UCC § 9-623' },
  { id: 'suit', label: 'Claim & delivery', detail: 'Answer replevin lawsuit', law: 'Civil procedure' },
  { id: 'sale', label: 'Sale notice', detail: 'Commercially reasonable sale', law: 'UCC § 9-610' },
  { id: 'deficiency', label: 'Deficiency fight', detail: 'Challenge balance after sale', law: 'UCC § 9-615' },
  { id: 'report', label: 'Credit cleanup', detail: 'FCRA on repo tradeline', law: 'FCRA § 611' },
];

export function RepossessionCenterView({
  debt,
  debtCases,
  debtId,
  reports,
  processedDocuments,
  senderFields,
  partner,
  onDebtChange,
  onSenderPersist,
  onDebtIdChange,
  onBuildCatalogDraft,
}: {
  debt: DebtCase | null;
  debtCases: DebtCase[];
  debtId: string;
  reports: ReportRow[];
  processedDocuments: ProcessedDocument[];
  senderFields: Parameters<typeof DebtCreditorIntelPanel>[0]['senderFields'];
  partner?: Partner;
  onDebtChange: (d: DebtCase) => void;
  onSenderPersist: () => void;
  onDebtIdChange: (id: string) => void;
  onSwitchToValidation?: () => void;
  onSwitchToForeclosure?: () => void;
  onBuildCatalogDraft: (catalogId: string) => void;
}) {
  const [activeStep, setActiveStep] = useState('wrongful');
  const letterCount = catalogForCategory('repossession').length;
  const repoSignals = useMemo(() => extractCollateralSignals(reports, 'repossession'), [reports]);

  const stepFilter = useMemo(() => {
    const map: Record<string, string[]> = {
      wrongful: ['wrongful', 'breach', 'privacy', 'gps'],
      reinstate: ['reinstate', 'redemption', 'turn'],
      suit: ['claim', 'delivery', 'replevin', 'answer'],
      sale: ['sale', 'notice', 'surplus', 'title'],
      deficiency: ['deficiency', 'collector', 'lease', 'trust'],
      report: ['reporting', 'credit', 'furnisher'],
    };
    return map[activeStep] ?? [];
  }, [activeStep]);
  const activeStepMeta = PLAYBOOK.find((s) => s.id === activeStep);

  return (
    <CollateralDefenseShell
      theme="repossession"
      icon={Car}
      eyebrow="Collateral defense"
      title="Repossession command center"
      subtitle="UCC Article 9 reinstatement, wrongful repo demands, claim-and-delivery answers, deficiency accounting, and credit cleanup when reporting is wrong."
      steps={PLAYBOOK}
      activeStepId={activeStep}
      onStepClick={setActiveStep}
      stats={[
        { label: 'Letters', value: String(letterCount) },
        { label: 'Repo tradelines', value: repoSignals.length ? String(repoSignals.length) : '—' },
        { label: 'Stage', value: PLAYBOOK.find((s) => s.id === activeStep)?.label || '—' },
      ]}
      headerActions={
        <Link to="/portal/letters?tab=dispute" className={FINELY_OS_SECONDARY_BTN} title="Only if the repo tradeline on your credit report is inaccurate">
          Fix credit report →
        </Link>
      }
    >
      <DebtVsDisputeExplainer variant="repossession" />

      <CollateralWorkstationSection title="Your auto / lease case" subtitle="Select a debt case for this lender — separate from bureau dispute tracking." accent="rose">
        <div id="fc-debt-step-case" className={`${FINELY_OS_FIELD_WIDTH_SM} scroll-mt-3`}>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Auto / lease case</label>
          <select value={debtId} onChange={(e) => onDebtIdChange(e.target.value)} className={`${finelyOsGlowField('rose')} mt-1 w-full`}>
            {debtCases.length === 0 ? <option value="">Add a case from Debt Center → Cases</option> : null}
            {debtCases.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} • {d.type}
              </option>
            ))}
          </select>
        </div>
      </CollateralWorkstationSection>

      <CollateralWorkstationSection title="Lender mailing info" subtitle="Pull from auto loan or lease tradeline on your report, or type manually." accent="rose">
        <DebtCreditorIntelPanel
          partnerId={debt?.partnerId || debtCases[0]?.partnerId || ''}
          debt={debt}
          reports={reports}
          processedDocuments={processedDocuments}
          mode="court"
          workstation="repossession"
          senderFields={senderFields}
          onDebtChange={onDebtChange}
          onSenderPersist={onSenderPersist}
          compact
        />
      </CollateralWorkstationSection>

      <CollateralWorkstationSection
        title="Letter library"
        subtitle={
          activeStepMeta
            ? `${activeStepMeta.label} — ${activeStepMeta.detail}${activeStepMeta.law ? ` (${activeStepMeta.law})` : ''}. Letters filtered to this step.`
            : 'Filtered by your selected action step.'
        }
        accent="rose"
      >
        <div id="fc-debt-step-choose" className="scroll-mt-3">
        <LetterCatalogBrowser
          category="repossession"
          accent="rose"
          onBuild={(id) => onBuildCatalogDraft(id)}
          extraCategories={['reporting']}
          searchHint={stepFilter.join(' ')}
          compactHeader
        />
        </div>
      </CollateralWorkstationSection>

      <CollateralWorkstationSection title="Repossession coach" subtitle="Ask about UCC Article 9, wrongful repo, redemption, deficiency, and claim-and-delivery — full width section." accent="rose">
        <RepossessionAdvisorChat debtName={debt?.name} stateJurisdiction={debt?.stateJurisdiction} />
      </CollateralWorkstationSection>

      {partner ? (
        <div id="fc-debt-step-proof" className="scroll-mt-3">
          <DebtProofCaptureStrip partner={partner} debtCaseId={debt?.id} accent="rose" uploadContext="repossession" />
        </div>
      ) : null}
    </CollateralDefenseShell>
  );
}
