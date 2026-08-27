import React, { useMemo, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listCreditAnalysisReportsByPartner } from '../../data/creditAnalysisReportsRepo';
import type { Partner } from '../../domain/partners';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PAGE,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { CfpbCompanyComplaintStrip } from '../intel/CfpbCompanyComplaintStrip';
import { CreditAnalysisDeliverableStrip } from './CreditAnalysisDeliverableCard';
import { ReportIntelligenceFindings } from './ReportIntelligenceFindings';

export type StrategyReportsVaultTab = 'overview' | 'reports';

export type PartnerStrategyReportsNavigation = {
  reportsPath: string;
  documentsPath: string;
};

/**
 * Saved strategy-report workstation shared by the established portal and workspace preview.
 * Evidence exhibits deliberately do not live here; they have their own Evidence Vault route.
 */
export function PartnerStrategyReportsWorkspace({
  partner,
  navigation,
  embedded = false,
  tab: externalTab,
  onTabChange,
}: {
  partner: Partner;
  navigation: PartnerStrategyReportsNavigation;
  embedded?: boolean;
  tab?: StrategyReportsVaultTab;
  onTabChange?: (tab: StrategyReportsVaultTab) => void;
}) {
  const navigate = useNavigate();
  const [internalTab, setInternalTab] = useState<StrategyReportsVaultTab>('reports');
  const tab = externalTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;
  const [version, setVersion] = useState(0);

  const items = useMemo(
    () => listCreditAnalysisReportsByPartner(partner.id),
    [partner.id, version],
  );

  React.useEffect(() => {
    const onStore = () => setVersion((value) => value + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const sourceReportCount = useMemo(
    () => new Set(items.map((item) => item.reportId).filter(Boolean)).size,
    [items],
  );

  const tabBody = (
    <>
      {tab === 'overview' ? (
        <div className={`${finelyOsCatalogCard('sky')} !p-6 lg:!p-8 fc-surface-harmony ${FINELY_OS_ENTITY_BODY} space-y-3`}>
          <ReportIntelligenceFindings
            partnerId={partner.id}
            partnerState={partner.routes[partner.primaryRoute || 'personal_restore']?.personal?.state}
          />
          <CfpbCompanyComplaintStrip
            partnerId={partner.id}
            state={partner.routes[partner.primaryRoute || 'personal_restore']?.personal?.state}
            accentIndex={2}
          />
          <p>
            Upload and parse a bureau report in Credit Reports, then generate a strategy PDF. Each version is
            stored here with open and download actions.
          </p>
          <p>
            Screenshots, bureau replies, and source proof belong in Evidence Vault—not in this strategy-report
            library.
          </p>
          <button type="button" onClick={() => navigate(navigation.reportsPath)} className={FINELY_OS_SUCCESS_BTN}>
            Open Credit Reports
          </button>
        </div>
      ) : null}

      {tab === 'reports' ? (
        items.length === 0 ? (
          <FinelyOsEmptyState
            icon={FileText}
            title="No strategy reports yet"
            description="Generate a credit analysis PDF from Credit Reports after you upload and parse a credit file."
            primaryAction={{ label: 'Open Credit Reports', onClick: () => navigate(navigation.reportsPath) }}
          />
        ) : (
          <CreditAnalysisDeliverableStrip items={items} />
        )
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div data-surface-kind="strategy-reports" data-embedded="true">
        {tabBody}
      </div>
    );
  }

  return (
    <div className={FINELY_OS_PAGE} data-surface-kind="strategy-reports">
      <button type="button" onClick={() => navigate(navigation.reportsPath)} className={FINELY_OS_BACK_LINK}>
        <ArrowLeft size={16} /> Back to Credit Reports
      </button>

      <FinelyUnifiedHubLayout
        eyebrow="Strategy reports"
        title="Your credit analysis library"
        subtitle="Generate from Credit Reports after uploading a report. Open or download every saved PDF version here."
        accent="violet"
        kpis={[
          { label: 'Saved', value: String(items.length), hint: 'PDF reports', accent: 'violet' },
          { label: 'Sources', value: String(sourceReportCount), hint: 'Credit reports', accent: 'sky' },
          {
            label: 'Latest',
            value: items[0]
              ? new Date(items[0].createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : '—',
            hint: 'Most recent',
            accent: 'rose',
          },
          { label: 'Format', value: 'PDF', hint: 'Open or download', accent: 'emerald' },
        ]}
        tabs={[
          { id: 'overview', label: 'How this works' },
          { id: 'reports', label: 'Saved reports', badge: items.length || undefined },
        ]}
        activeTab={tab}
        onTabChange={(id) => setTab(id as StrategyReportsVaultTab)}
        primaryAction={{ label: 'Open Credit Reports', onClick: () => navigate(navigation.reportsPath) }}
        secondaryAction={{ label: 'Open Documents', onClick: () => navigate(navigation.documentsPath) }}
      >
        {tabBody}
      </FinelyUnifiedHubLayout>

      <FinelyOsPageFooter />
    </div>
  );
}
