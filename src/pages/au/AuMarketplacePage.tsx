import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { TradelineMarketplace } from '../../components/landing';
import { AuBuyerCommandStrip } from '../../components/au/AuBuyerCommandStrip';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { computeRoleWorkflowProgress } from '../../lib/roleWorkflowProgress';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listAuBuyerOrdersByPartner } from '../../data/auBuyerOrdersRepo';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type AuMarketTab = 'browse' | 'workflow' | 'guide';

export default function AuMarketplacePage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<AuMarketTab>('browse');

  usePublicSeoMeta({
    title: 'AU tradeline marketplace',
    description: 'Browse authorized user tradelines, submit buyer intake, and track order fulfillment.',
    path: '/au/marketplace',
  });

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const orders = useMemo(() => (partner ? listAuBuyerOrdersByPartner(partner.id) : []), [partner?.id, version]);
  const auWorkflowProgress = useMemo(
    () => computeRoleWorkflowProgress('au_buyer', { partner, auOrdersCount: orders.length }),
    [partner, orders.length],
  );

  return (
    <PageShell
      badge="AU"
      title="AU Marketplace"
      subtitle="Browse authorized user tradelines, then run the guided buyer intake (eligibility, terms, documents, timeline)."
    >
      <div className={FINELY_OS_PAGE}>
        <AuBuyerCommandStrip />

        <FinelyUnifiedHubLayout
          eyebrow="AU buyer lane"
          title="Authorized user tradeline marketplace"
          subtitle="Browse inventory, track your buyer workflow, and start guided intake."
          accent="emerald"
          kpis={[
            { label: 'Orders', value: String(orders.length), accent: 'amber' },
            { label: 'Workflow', value: `${auWorkflowProgress.size}/6`, accent: 'emerald' },
          ]}
          tabs={[
            { id: 'browse', label: 'Browse' },
            { id: 'workflow', label: 'Workflow' },
            { id: 'guide', label: 'Buyer guide' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as AuMarketTab)}
          primaryAction={{ label: 'My orders', onClick: () => navigate('/au/orders') }}
          secondaryAction={{ label: 'Start intake', onClick: () => navigate('/au/request') }}
        >
          {tab === 'browse' && (
            <>
        <TradelineMarketplace
          onAddToCart={(line: any) => {
            const p = new URLSearchParams();
            p.set('bank', String(line.bank ?? ''));
            p.set('limit', String(line.limit ?? ''));
            p.set('age', String(line.age ?? ''));
            p.set('price', String(line.price ?? ''));
            navigate(`/au/request?${p.toString()}`);
          }}
        />
            </>
          )}

          {tab === 'workflow' && <RoleWorkflowPanel roleId="au_buyer" completedSteps={auWorkflowProgress} />}

          {tab === 'guide' && (
            <div className={`${finelyOsCatalogCard('fuchsia')} !p-6`} data-fc-accent="fuchsia">
              <div className="inline-flex items-center gap-2 text-fuchsia-700">
                <ShieldCheck size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Buyer flow</span>
              </div>
              <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} max-w-3xl`}>
                After you select a tradeline, we walk you through eligibility, terms, document upload, and review so operations can process the order quickly.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate('/au/orders')} className={FINELY_OS_SECONDARY_BTN}>
                  <ShoppingBag size={14} /> My orders <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => navigate('/au/request')} className={FINELY_OS_PRIMARY_BTN}>
                  Start buyer intake <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="finely_advisor"
          goal="tradelines"
          roleLabel="AU tradeline advisor"
          subline="Not sure which inventory fits your profile? Chat before you submit a buyer request."
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
