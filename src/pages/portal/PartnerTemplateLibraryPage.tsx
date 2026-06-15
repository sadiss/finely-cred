import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { TemplateLibraryHub } from '../../components/templates/TemplateLibraryHub';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildTemplatesNoticedItems } from '../../lib/finelyProactiveSignals';
import { listSavedReasonsByPartner } from '../../data/partnerReasonPacksRepo';
import { listVisibleTemplateVaultItemsForPartner } from '../../data/templateVaultRepo';
import { getFactualDisputeReasonsLibrary } from '../../creditReports/disputeReasons';
import { TEMPLATE_BASES } from '../../templates';
import { FINELY_TENANT_ID } from '../../domain/partners';
import { FINELY_OS_BACK_LINK, FINELY_OS_PAGE } from '../../features/os/finelyOsLightUi';

type HubSection = 'overview' | 'vault' | 'reasons' | 'bases';

export default function PartnerTemplateLibraryPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { partner } = usePartnerSession();
  const section = ((params.get('section') as HubSection) || 'overview') as HubSection;

  const vaultCount = useMemo(() => {
    if (!partner) return 0;
    return listVisibleTemplateVaultItemsForPartner({
      tenantId: partner.tenantId || FINELY_TENANT_ID,
      partnerId: partner.id,
    }).length;
  }, [partner]);

  const savedReasonCount = useMemo(() => (partner ? listSavedReasonsByPartner(partner.id).length : 0), [partner]);
  const builtInReasonCount = useMemo(
    () => Object.values(getFactualDisputeReasonsLibrary()).reduce((a, b) => a + b.reasons.length, 0),
    [],
  );

  if (!partner) {
    return (
      <PageShell badge="Template Library" title="Sign in required" subtitle="Partner profile required.">
        <button type="button" onClick={() => navigate('/portal/dashboard')} className="fc-button-brand">
          <ArrowLeft size={14} /> Dashboard
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge="Template Library"
      title="Letter building hub"
      subtitle="Templates, saved reasons, and starter bases — then open Letter Studio to draft, preview, and save PDFs."
    >
      <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.templates]}>
        <div className={FINELY_OS_PAGE}>
          <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Partner Dashboard
          </button>

          <FinelyNoticedStrip
            items={buildTemplatesNoticedItems({
              vaultCount,
              savedReasonCount,
              section,
            })}
          />

          <FinelyNowDoThisStrip currentIndex={section === 'reasons' ? 1 : section === 'bases' ? 2 : 0} />

          <FinelyUnifiedHubLayout
            eyebrow="Template library"
            title="Build every letter from one hub"
            subtitle="Vault templates, Reasons OS, and starter bases — then execute in Letter Studio."
            accent="violet"
            kpis={[
              { label: 'Vault', value: String(vaultCount), hint: 'Saved templates', accent: 'violet' },
              { label: 'Saved reasons', value: String(savedReasonCount), hint: 'Custom snippets', accent: 'emerald' },
              { label: 'Starter bases', value: String(TEMPLATE_BASES.length), hint: 'Scaffolds', accent: 'amber' },
              { label: 'Built-in', value: String(builtInReasonCount), hint: 'Reason library', accent: 'sky' },
            ]}
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'vault', label: 'My templates', badge: vaultCount || undefined },
              { id: 'reasons', label: 'Reasons library' },
              { id: 'bases', label: 'Starter bases' },
            ]}
            activeTab={section}
            onTabChange={(id) => setParams({ section: id })}
            primaryAction={{ label: 'Letter Studio', onClick: () => navigate('/portal/letters') }}
            secondaryAction={{ label: 'Reasons OS', onClick: () => setParams({ section: 'reasons' }) }}
          >
            <TemplateLibraryHub partner={partner} unifiedShell />
          </FinelyUnifiedHubLayout>

          <FinelyOsPageFooter />
        </div>
      </EntitlementGate>
    </PageShell>
  );
}
