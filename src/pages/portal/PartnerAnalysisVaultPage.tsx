import React from 'react';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import {
  PartnerStrategyReportsWorkspace,
  type PartnerStrategyReportsNavigation,
} from '../../components/reports/PartnerStrategyReportsWorkspace';

const PORTAL_STRATEGY_REPORTS_NAVIGATION: PartnerStrategyReportsNavigation = {
  reportsPath: '/portal/reports',
  documentsPath: '/portal/documents',
};

export default function PartnerAnalysisVaultPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();

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
          <PartnerStrategyReportsWorkspace
            partner={partner}
            navigation={PORTAL_STRATEGY_REPORTS_NAVIGATION}
          />
        </EntitlementGate>
      )}
    </PageShell>
  );
}
