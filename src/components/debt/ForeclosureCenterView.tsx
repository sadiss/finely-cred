import React, { useEffect, useMemo, useState } from 'react';
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
  { id: 'mitigate', label: 'Loss mitigation', detail: 'Request workout before sale', law: 'RESPA / investor guides' },
  { id: 'qwr', label: 'RESPA QWR', detail: 'Demand loan & escrow history', law: '12 U.S.C. § 2605' },
  { id: 'dual', label: 'Stop dual-track', detail: 'Halt sale during mod review', law: 'CFPB servicing' },
  { id: 'chain', label: 'Note & assignments', detail: 'Challenge standing', law: 'UCC § 3-308' },
  { id: 'answer', label: 'Foreclosure answer', detail: 'Deny & preserve defenses', law: 'Civil procedure' },
  { id: 'report', label: 'FCRA cleanup', detail: 'Use Credit Letters for bureau track', law: 'FCRA § 611' },
];

const CREDIT_PLAYBOOK: CollateralPlaybookStep[] = [
  { id: 'tradeline', label: 'Bureau tradeline', detail: 'Status / balance / DOFD / Metro 2', law: 'FCRA § 611' },
  { id: 'postfc', label: 'Post-FC reporting', detail: 'Dispute after sale or judgment', law: 'FCRA § 611' },
  { id: 'public', label: 'Public record', detail: 'FC remark / land-record mismatch', law: 'FCRA § 605' },
  { id: 'specialty', label: 'Specialty CRA', detail: 'Housing / public-record vendors', law: 'FCRA § 611' },
  { id: 'furnisher', label: '§ 623 furnisher', detail: 'Direct reporting-accuracy dispute', law: 'FCRA § 623' },
  { id: 'mov', label: 'Method of verification', detail: 'After thin “verified” results', law: '§ 611(a)(6)' },
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
  onSwitchToRepossession?: () => void;
  onBuildCatalogDraft: (catalogId: string) => void;
  letterHub?: LetterCatalogHub;
  adminPartnerId?: string;
}) {
  const nav = (href: string) => adminEmbeddedNavHref(adminPartnerId, href);
  const isCredit = letterHub === 'credit';
  const playbook = isCredit ? CREDIT_PLAYBOOK : DEBT_PLAYBOOK;
  const [activeStep, setActiveStep] = useState(isCredit ? 'tradeline' : 'mitigate');
  useEffect(() => {
    setActiveStep(isCredit ? 'tradeline' : 'mitigate');
  }, [isCredit]);
  const letterCount =
    catalogForCategory('foreclosure', letterHub).length +
    (isCredit ? catalogForCategory('reporting', letterHub).length : 0);
  const foreclosureSignals = useMemo(() => extractCollateralSignals(reports, 'foreclosure'), [reports]);

  const stepFilter = useMemo(() => {
    if (isCredit) {
      const map: Record<string, string[]> = {
        tradeline: ['tradeline', 'status', 'dofd', 'metro', 'bureau'],
        postfc: ['post-foreclosure', 'post', 'fcr', 'reporting'],
        public: ['public', 'remark', 'record'],
        specialty: ['specialty', 'lexis', 'housing', 'cra'],
        furnisher: ['furnisher', '623', '§ 623'],
        mov: ['method', 'verification', 'mofv', 'verified'],
      };
      return map[activeStep] ?? [];
    }
    const map: Record<string, string[]> = {
      mitigate: ['loss', 'mitigation', 'forbearance', 'mediation', 'disaster'],
      qwr: ['qualified', 'qwr', 'escrow', 'history'],
      dual: ['dual', 'cease'],
      chain: ['assignment', 'note', 'standing', 'mers'],
      answer: ['answer', 'acceleration', 'bankruptcy', 'scra'],
      report: ['reporting', 'fcr', 'bureau', 'furnisher', 'credit'],
    };
    return map[activeStep] ?? [];
  }, [activeStep, isCredit]);
  const activeStepMeta = playbook.find((s) => s.id === activeStep);

  return (
    <CollateralDefenseShell
      theme="foreclosure"
      icon={Home}
      eyebrow={isCredit ? 'Bureau cleanup' : 'Mortgage defense'}
      title={isCredit ? 'Foreclosure credit letters' : 'Foreclosure command center'}
      subtitle={
        isCredit
          ? 'Powerful FCRA § 611 / Metro 2 disputes to Experian, Equifax, TransUnion, and specialty CRAs — foreclosure tradeline, public-record, and furnisher reporting accuracy.'
          : 'Servicer accountability, loss mitigation, dual-track stops, and standing challenges. Bureau disputes live under Credit Letters.'
      }
      steps={playbook}
      activeStepId={activeStep}
      onStepClick={setActiveStep}
      stats={[
        { label: 'Letters', value: String(letterCount) },
        { label: 'FC tradelines', value: foreclosureSignals.length ? String(foreclosureSignals.length) : '—' },
        { label: 'Stage', value: playbook.find((s) => s.id === activeStep)?.label || '—' },
      ]}
      headerActions={
        isCredit ? (
          <Link to={nav('/portal/debt?tab=foreclosure')} className={FINELY_OS_SECONDARY_BTN} title="Servicer QWR, dual-track, and foreclosure answer letters">
            Debt FC letters →
          </Link>
        ) : (
          <Link to={nav('/portal/letters?tab=foreclosure')} className={FINELY_OS_SECONDARY_BTN} title="Bureau / specialty CRA foreclosure reporting disputes">
            Credit FC letters →
          </Link>
        )
      }
    >
      <DebtVsDisputeExplainer variant="foreclosure" hub={letterHub === 'both' ? 'debt' : letterHub} />

      <CollateralWorkstationSection
        title={isCredit ? 'Account context for merge fields' : 'Your mortgage case'}
        subtitle={
          isCredit
            ? 'Select the related mortgage case so drafts pull account/servicer names — this track still sends to the bureau/CRA, not the servicer as primary recipient.'
            : 'Select or create a debt case for this servicer — this is not a bureau dispute case.'
        }
        accent="amber"
      >
        <div id="fc-debt-step-case" className={`${FINELY_OS_FIELD_WIDTH_SM} scroll-mt-3`}>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>
            {isCredit ? 'Related mortgage case (merge fields)' : 'Mortgage / servicer case'}
          </label>
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

      <CollateralWorkstationSection
        title={isCredit ? 'Bureau / CRA recipient' : 'Servicer mailing info'}
        subtitle={
          isCredit
            ? 'Set the bureau or specialty CRA dispute address (or § 623 furnisher for furnisher letters). Auto-fill from report when available.'
            : 'Auto-fill from your credit report mortgage tradeline, or enter manually.'
        }
        accent="amber"
      >
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
        <div id="fc-debt-step-choose" className="scroll-mt-3">
          <LetterCatalogBrowser
            category="foreclosure"
            accent="amber"
            letterHub={letterHub === 'both' ? undefined : letterHub}
            onBuild={(id) => onBuildCatalogDraft(id)}
            extraCategories={isCredit ? ['reporting'] : undefined}
            searchHint={stepFilter.join(' ')}
            compactHeader
          />
        </div>
      </CollateralWorkstationSection>

      <CollateralWorkstationSection
        title="Foreclosure coach"
        subtitle={
          isCredit
            ? 'Ask about FCRA § 611, Metro 2 foreclosure fields, specialty CRAs, and method of verification.'
            : 'Ask about RESPA, dual-track, note demands, SCRA, and your next move — full width, no side panel.'
        }
        accent="amber"
      >
        <ForeclosureAdvisorChat debtName={debt?.name} stateJurisdiction={debt?.stateJurisdiction} />
      </CollateralWorkstationSection>

      {partner ? (
        <div id="fc-debt-step-proof" className="scroll-mt-3">
          <DebtProofCaptureStrip
            partner={partner}
            debt={debt}
            debtCaseId={debt?.id}
            accent="amber"
            uploadContext="foreclosure"
            reports={reports}
            onDebtChange={onDebtChange}
          />
        </div>
      ) : null}
    </CollateralDefenseShell>
  );
}
