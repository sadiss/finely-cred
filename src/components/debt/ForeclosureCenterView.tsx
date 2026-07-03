import React, { useMemo, useState } from 'react';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DebtCase } from '../../domain/debt';
import type { Partner } from '../../domain/partners';
import { DebtCreditorIntelPanel } from './DebtCreditorIntelPanel';
import { DebtProofCaptureStrip } from './DebtProofCaptureStrip';
import { LetterCatalogBrowser } from './LetterCatalogBrowser';
import { ForeclosureAdvisorChat } from './ForeclosureAdvisorChat';
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
  { id: 'mitigate', label: 'Loss mitigation', detail: 'Request workout before sale', law: 'RESPA / investor guides' },
  { id: 'qwr', label: 'RESPA QWR', detail: 'Demand loan & escrow history', law: '12 U.S.C. § 2605' },
  { id: 'dual', label: 'Stop dual-track', detail: 'Halt sale during mod review', law: 'CFPB servicing' },
  { id: 'chain', label: 'Note & assignments', detail: 'Challenge standing', law: 'UCC § 3-308' },
  { id: 'answer', label: 'Foreclosure answer', detail: 'Deny & preserve defenses', law: 'Civil procedure' },
  { id: 'report', label: 'FCRA cleanup', detail: 'Dispute post-FC reporting', law: 'FCRA § 611' },
];

export function ForeclosureCenterView({
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
  onSwitchToRepossession?: () => void;
  onBuildCatalogDraft: (catalogId: string) => void;
}) {
  const [activeStep, setActiveStep] = useState('mitigate');
  const letterCount = catalogForCategory('foreclosure').length + catalogForCategory('reporting').length;
  const foreclosureSignals = useMemo(() => extractCollateralSignals(reports, 'foreclosure'), [reports]);

  const stepFilter = useMemo(() => {
    const map: Record<string, string[]> = {
      mitigate: ['loss', 'mitigation', 'forbearance', 'mediation', 'disaster'],
      qwr: ['qualified', 'qwr', 'escrow', 'history'],
      dual: ['dual', 'cease'],
      chain: ['assignment', 'note', 'standing', 'mers'],
      answer: ['answer', 'acceleration', 'bankruptcy', 'scra'],
      report: ['reporting', 'fcr', 'bureau', 'furnisher'],
    };
    return map[activeStep] ?? [];
  }, [activeStep]);
  const activeStepMeta = PLAYBOOK.find((s) => s.id === activeStep);

  return (
    <CollateralDefenseShell
      theme="foreclosure"
      icon={Home}
      eyebrow="Mortgage defense"
      title="Foreclosure command center"
      subtitle="Servicer accountability, loss mitigation, dual-track stops, and standing challenges — plus credit-report cleanup when the foreclosure tradeline is wrong."
      steps={PLAYBOOK}
      activeStepId={activeStep}
      onStepClick={setActiveStep}
      stats={[
        { label: 'Letters', value: String(letterCount) },
        { label: 'FC tradelines', value: foreclosureSignals.length ? String(foreclosureSignals.length) : '—' },
        { label: 'Stage', value: PLAYBOOK.find((s) => s.id === activeStep)?.label || '—' },
      ]}
      headerActions={
        <Link to="/portal/letters?tab=dispute" className={FINELY_OS_SECONDARY_BTN} title="Only if the foreclosure tradeline on your credit report is inaccurate">
          Fix credit report →
        </Link>
      }
    >
      <DebtVsDisputeExplainer variant="foreclosure" />

      <CollateralWorkstationSection title="Your mortgage case" subtitle="Select or create a debt case for this servicer — this is not a bureau dispute case." accent="amber">
        <div className={FINELY_OS_FIELD_WIDTH_SM}>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Mortgage / servicer case</label>
          <select value={debtId} onChange={(e) => onDebtIdChange(e.target.value)} className={`${finelyOsGlowField('amber')} mt-1 w-full`}>
            {debtCases.length === 0 ? <option value="">Add a case from Debt Center → Cases</option> : null}
            {debtCases.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} • {d.type}
              </option>
            ))}
          </select>
        </div>
      </CollateralWorkstationSection>

      {partner ? (
        <CollateralWorkstationSection title="Scan & upload proof" subtitle="ID, SSN, servicer letters, court filings — camera auto-detects document type." accent="amber">
          <DebtProofCaptureStrip partner={partner} debtCaseId={debt?.id} accent="amber" uploadContext="foreclosure" />
        </CollateralWorkstationSection>
      ) : null}

      <CollateralWorkstationSection title="Servicer mailing info" subtitle="Auto-fill from your credit report mortgage tradeline, or enter manually." accent="amber">
        <DebtCreditorIntelPanel
          partnerId={debt?.partnerId || debtCases[0]?.partnerId || ''}
          debt={debt}
          reports={reports}
          processedDocuments={processedDocuments}
          mode="validation"
          workstation="foreclosure"
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
            : 'Filtered by your selected action step — build, edit, save to vault.'
        }
        accent="amber"
      >
        <LetterCatalogBrowser
          category="foreclosure"
          accent="amber"
          onBuild={(id) => onBuildCatalogDraft(id)}
          extraCategories={['reporting']}
          searchHint={stepFilter.join(' ')}
          compactHeader
        />
      </CollateralWorkstationSection>

      <CollateralWorkstationSection title="Foreclosure coach" subtitle="Ask about RESPA, dual-track, note demands, SCRA, and your next move — full width, no side panel." accent="amber">
        <ForeclosureAdvisorChat debtName={debt?.name} stateJurisdiction={debt?.stateJurisdiction} />
      </CollateralWorkstationSection>
    </CollateralDefenseShell>
  );
}
