import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CreditMonitoringPartnerGrid, CREDIT_MONITORING_PARTNERS } from '../components/resources/CreditMonitoringPartnerGrid';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

export default function ResourcesCreditMonitoringPage() {
  const navigate = useNavigate();

  usePublicSeoMeta({
    title: 'Credit monitoring partners',
    description: 'Finely Cred credit monitoring partner links — prefer HTML exports for best portal parse quality.',
    path: '/resources/credit-monitoring',
  });

  return (
    <PageShell
      badge="Public"
      title="Credit monitoring"
      subtitle="Bureau pull partners with clean export tips — HTML-friendly sources parse best in the portal."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        <FinelyUnifiedHubLayout
          eyebrow="Monitoring tools"
          title="Credit monitoring partners"
          subtitle="Pick a partner, pull reports, export HTML when available, then upload in your partner portal."
          accent="sky"
          kpis={[
            { label: 'Partners', value: String(CREDIT_MONITORING_PARTNERS.length), accent: 'sky' },
            { label: 'Best format', value: 'HTML', accent: 'emerald' },
          ]}
          primaryAction={{ label: 'Open partner portal', onClick: () => navigate('/login') }}
          secondaryAction={{ label: 'Resource hub', onClick: () => navigate('/resources') }}
        >
          <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>
                  <ShieldCheck size={18} />
                  <span>Credit monitoring tools</span>
                </div>
                <p className={`mt-2 max-w-3xl text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Prefer an <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>HTML export</span> for best parse quality
                  in the portal.
                </p>
              </div>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources/guides')}>
                Free guides <ArrowRight size={14} />
              </button>
            </div>
            <CreditMonitoringPartnerGrid variant="resources" />
          </div>

          <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>
            Results vary · not legal advice · educational workflow only.
          </p>
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="nurture_concierge"
          goal="personal"
          roleLabel="welcome concierge"
          subline="Unsure which monitoring partner to use before uploading reports?"
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
