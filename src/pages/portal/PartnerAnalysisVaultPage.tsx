import React, { useMemo, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listCreditAnalysisReportsByPartner } from '../../data/creditAnalysisReportsRepo';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { CreditAnalysisDeliverableStrip } from '../../components/reports/CreditAnalysisDeliverableCard';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_SUCCESS_BTN,
} from '../../features/os/finelyOsLightUi';

type VaultTab = 'overview' | 'reports';

export default function PartnerAnalysisVaultPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [tab, setTab] = useState<VaultTab>('reports');
  const [version, setVersion] = useState(0);

  const items = useMemo(() => {
    if (!partner) return [];
    return listCreditAnalysisReportsByPartner(partner.id);
  }, [partner, version]);

  React.useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const sourceReportCount = useMemo(() => new Set(items.map((x) => x.reportId).filter(Boolean)).size, [items]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Strategy Reports"
      subtitle="Your saved credit analysis PDFs — a separate deliverable from dispute evidence."
    >
      {!partner ? (
        <FinelyOsEmptyState
          icon={FileText}
          title="No partner profile"
          description="Sign in with a partner account to view saved strategy reports."
          primaryAction={{ label: 'Back to dashboard', onClick: () => navigate('/dashboard') }}
        />
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.reports]}>
          <div className={FINELY_OS_PAGE}>
            <button type="button" onClick={() => navigate('/portal/reports')} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Back to Reports
            </button>

            <FinelyUnifiedHubLayout
              eyebrow="Strategy reports"
              title="Your credit analysis library"
              subtitle="Generate from Credit Intel after uploading a report — open or download any version here."
              accent="violet"
              kpis={[
                { label: 'Saved', value: String(items.length), hint: 'PDF reports', accent: 'violet' },
                { label: 'Sources', value: String(sourceReportCount), hint: 'Upload reports', accent: 'amber' },
                { label: 'Latest', value: items[0] ? new Date(items[0].createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—', hint: 'Most recent', accent: 'sky' },
                { label: 'Format', value: 'PDF', hint: 'Open or download', accent: 'emerald' },
              ]}
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'reports', label: 'Saved reports', badge: items.length || undefined },
              ]}
              activeTab={tab}
              onTabChange={(id) => setTab(id as VaultTab)}
              primaryAction={{ label: 'Credit intel', onClick: () => navigate('/portal/reports') }}
              secondaryAction={{ label: 'Documents vault', onClick: () => navigate('/portal/documents') }}
            >
              {tab === 'overview' && (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY} space-y-3`}>
                  <p>After you upload and parse a credit report, generate a strategy PDF from the Reports hub. Each version is saved here with open and download actions.</p>
                  <button type="button" onClick={() => navigate('/portal/reports')} className={FINELY_OS_SUCCESS_BTN}>
                    Open Reports
                  </button>
                </div>
              )}

              {tab === 'reports' && (
                <>
                  {items.length === 0 ? (
                    <FinelyOsEmptyState
                      icon={FileText}
                      title="No strategy reports yet"
                      description="Generate a credit analysis PDF from Reports after you upload and parse a credit file."
                      primaryAction={{ label: 'Open Reports', onClick: () => navigate('/portal/reports') }}
                    />
                  ) : (
                    <CreditAnalysisDeliverableStrip items={items} />
                  )}
                </>
              )}
            </FinelyUnifiedHubLayout>

            <FinelyOsPageFooter />
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
