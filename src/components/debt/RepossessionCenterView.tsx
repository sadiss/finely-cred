import React, { useEffect, useMemo, useState } from 'react';
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
import { catalogForCategory, type LetterCatalogHub } from '../../legal/debtLetterCatalog';
import { extractCollateralSignals } from '../../lib/debtCreditorIntel';
import { adminEmbeddedNavHref } from '../../lib/adminPartnerRoutes';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_FIELD_WIDTH_SM,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowField,
} from '../../features/os/finelyOsLightUi';

import type { ProcessedDocument } from '../../domain/documents';
import type { ParsedCreditReport } from '../../domain/creditReports';

type ReportRow = { id: string; parsed?: ParsedCreditReport | null };

const DEBT_PLAYBOOK: CollateralPlaybookStep[] = [
  { id: 'wrongful', label: 'Wrongful repo', detail: 'Breach of peace / no default', law: 'UCC § 9-609' },
  { id: 'reinstate', label: 'Reinstate / redeem', detail: 'Recover vehicle pre-sale', law: 'UCC § 9-623' },
  { id: 'suit', label: 'Claim & delivery', detail: 'Answer replevin lawsuit', law: 'Civil procedure' },
  { id: 'sale', label: 'Sale notice', detail: 'Commercially reasonable sale', law: 'UCC § 9-610' },
  { id: 'deficiency', label: 'Deficiency fight', detail: 'Challenge balance after sale', law: 'UCC § 9-615' },
  { id: 'report', label: 'Credit cleanup', detail: 'Use Credit Letters for bureau track', law: 'FCRA § 611' },
];

const CREDIT_PLAYBOOK: CollateralPlaybookStep[] = [
  { id: 'tradeline', label: 'Bureau tradeline', detail: 'Repo status / DOFD / charge-off', law: 'FCRA § 611' },
  { id: 'deficiency', label: 'Deficiency reporting', detail: 'Dispute inflated bureau balance', law: 'FCRA § 611' },
  { id: 'wrongful', label: 'Wrongful repo reporting', detail: 'Inaccurate repo remark on file', law: 'FCRA § 611' },
  { id: 'specialty', label: 'Specialty CRA', detail: 'ChexSystems / LexisNexis / auto CRA', law: 'FCRA § 611' },
  { id: 'furnisher', label: '§ 623 furnisher', detail: 'Direct reporting-accuracy dispute', law: 'FCRA § 623' },
  { id: 'mov', label: 'Method of verification', detail: 'After thin “verified” results', law: '§ 611(a)(6)' },
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
  letterHub = 'debt',
  adminPartnerId,
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
  letterHub?: LetterCatalogHub;
  adminPartnerId?: string;
}) {
  const nav = (href: string) => adminEmbeddedNavHref(adminPartnerId, href);
  const isCredit = letterHub === 'credit';
  const playbook = isCredit ? CREDIT_PLAYBOOK : DEBT_PLAYBOOK;
  const [activeStep, setActiveStep] = useState(isCredit ? 'tradeline' : 'wrongful');
  useEffect(() => {
    setActiveStep(isCredit ? 'tradeline' : 'wrongful');
  }, [isCredit]);
  const letterCount =
    catalogForCategory('repossession', letterHub).length +
    (isCredit ? catalogForCategory('reporting', letterHub).length : 0);
  const repoSignals = useMemo(() => extractCollateralSignals(reports, 'repossession'), [reports]);

  const stepFilter = useMemo(() => {
    if (isCredit) {
      const map: Record<string, string[]> = {
        tradeline: ['tradeline', 'status', 'dofd', 'charge-off', 'metro', 'bureau'],
        deficiency: ['deficiency', 'balance', 'sale'],
        wrongful: ['wrongful', 'repo', 'reporting', 'fcr'],
        specialty: ['specialty', 'chex', 'lexis', 'cra'],
        furnisher: ['furnisher', '623', '§ 623'],
        mov: ['method', 'verification', 'mofv', 'verified'],
      };
      return map[activeStep] ?? [];
    }
    const map: Record<string, string[]> = {
      wrongful: ['wrongful', 'breach', 'privacy', 'gps'],
      reinstate: ['reinstate', 'redemption', 'turn'],
      suit: ['claim', 'delivery', 'replevin', 'answer'],
      sale: ['sale', 'notice', 'surplus', 'title'],
      deficiency: ['deficiency', 'collector', 'lease', 'trust'],
      report: ['reporting', 'credit', 'furnisher', 'bureau'],
    };
    return map[activeStep] ?? [];
  }, [activeStep, isCredit]);
  const activeStepMeta = playbook.find((s) => s.id === activeStep);

  return (
    <CollateralDefenseShell
      theme="repossession"
      icon={Car}
      eyebrow={isCredit ? 'Bureau cleanup' : 'Collateral defense'}
      title={isCredit ? 'Repossession credit letters' : 'Repossession command center'}
      subtitle={
        isCredit
          ? 'Powerful FCRA § 611 / Metro 2 disputes to Experian, Equifax, TransUnion, and specialty CRAs — repo status, deficiency reporting, and furnisher accuracy.'
          : 'UCC Article 9 reinstatement, wrongful repo demands, claim-and-delivery answers, and deficiency accounting. Bureau disputes live under Credit Letters.'
      }
      steps={playbook}
      activeStepId={activeStep}
      onStepClick={setActiveStep}
      stats={[
        { label: 'Letters', value: String(letterCount) },
        { label: 'Repo tradelines', value: repoSignals.length ? String(repoSignals.length) : '—' },
        { label: 'Stage', value: playbook.find((s) => s.id === activeStep)?.label || '—' },
      ]}
      headerActions={
        isCredit ? (
          <Link to={nav('/portal/debt?tab=repossession')} className={FINELY_OS_SECONDARY_BTN} title="UCC repo, sale notice, and deficiency letters to the lender">
            Debt repo letters →
          </Link>
        ) : (
          <Link to={nav('/portal/letters?tab=repossession')} className={FINELY_OS_SECONDARY_BTN} title="Bureau / specialty CRA repossession reporting disputes">
            Credit repo letters →
          </Link>
        )
      }
    >
      <DebtVsDisputeExplainer variant="repossession" hub={letterHub === 'both' ? 'debt' : letterHub} />

      <CollateralWorkstationSection
        title={isCredit ? 'Account context for merge fields' : 'Your auto / lease case'}
        subtitle={
          isCredit
            ? 'Select the related auto/lease case so drafts pull account names — this track still sends to the bureau/CRA, not the lender as primary recipient.'
            : 'Select a debt case for this lender — separate from bureau dispute tracking.'
        }
        accent="rose"
      >
        <div id="fc-debt-step-case" className={`${FINELY_OS_FIELD_WIDTH_SM} scroll-mt-3`}>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>
            {isCredit ? 'Related auto / lease case (merge fields)' : 'Auto / lease case'}
          </label>
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

      <CollateralWorkstationSection
        title={isCredit ? 'Bureau / CRA recipient' : 'Lender mailing info'}
        subtitle={
          isCredit
            ? 'Set the bureau or specialty CRA dispute address (or § 623 furnisher for furnisher letters). Pull from tradeline when available.'
            : 'Pull from auto loan or lease tradeline on your report, or type manually.'
        }
        accent="rose"
      >
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
            letterHub={letterHub === 'both' ? undefined : letterHub}
            onBuild={(id) => onBuildCatalogDraft(id)}
            extraCategories={isCredit ? ['reporting'] : undefined}
            searchHint={stepFilter.join(' ')}
            compactHeader
          />
        </div>
      </CollateralWorkstationSection>

      <CollateralWorkstationSection
        title="Repossession coach"
        subtitle={
          isCredit
            ? 'Ask about FCRA § 611, Metro 2 repo fields, deficiency reporting, and specialty CRAs.'
            : 'Ask about UCC Article 9, wrongful repo, redemption, deficiency, and claim-and-delivery — full width section.'
        }
        accent="rose"
      >
        <RepossessionAdvisorChat debtName={debt?.name} stateJurisdiction={debt?.stateJurisdiction} />
      </CollateralWorkstationSection>

      {partner ? (
        <div id="fc-debt-step-proof" className="scroll-mt-3">
          <DebtProofCaptureStrip
            partner={partner}
            debt={debt}
            debtCaseId={debt?.id}
            accent="rose"
            uploadContext="repossession"
            reports={reports}
            onDebtChange={onDebtChange}
          />
        </div>
      ) : null}
    </CollateralDefenseShell>
  );
}
