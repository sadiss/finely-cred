import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Clock, FileUp, Plus, ShieldCheck } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listAuBuyerOrdersByPartner } from '../../data/auBuyerOrdersRepo';
import { AuBuyerCommandStrip } from '../../components/au/AuBuyerCommandStrip';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { computeRoleWorkflowProgress } from '../../lib/roleWorkflowProgress';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,

  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

function fmtUsd(cents: number) {
  return `$${(Math.max(0, Math.round(cents)) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function prettyStatus(s: string) {
  return String(s || '').replaceAll('_', ' ');
}

type AuOrdersTab = 'orders' | 'workflow';

export default function AuOrdersPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<AuOrdersTab>('orders');

  usePublicSeoMeta({
    title: 'My AU tradeline orders',
    description: 'Track authorized user tradeline order status, documents, and fulfillment timeline.',
    path: '/au/orders',
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

  if (!partner) {
    return (
      <PageShell badge="AU" title="My AU Orders" subtitle="Unable to load your profile.">
        <div className={FINELY_OS_PAGE}>
          <div className={FINELY_OS_ENTITY_EMPTY}>No partner profile found for this session.</div>
          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell badge="AU" title="My AU Orders" subtitle="Track your intake status, uploaded documents, and processing timeline.">
      <div className={FINELY_OS_PAGE}>
        <AuBuyerCommandStrip />

        <FinelyUnifiedHubLayout
          eyebrow="AU buyer lane"
          title="My tradeline orders"
          subtitle="Track intake status, documents, and fulfillment — or review your buyer workflow progress."
          accent="emerald"
          kpis={[
            { label: 'Active orders', value: String(orders.length), accent: 'amber' },
            { label: 'Workflow', value: `${auWorkflowProgress.size}/6`, accent: 'emerald' },
          ]}
          tabs={[
            { id: 'orders', label: 'Orders' },
            { id: 'workflow', label: 'Workflow' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as AuOrdersTab)}
          primaryAction={{ label: 'Browse marketplace', onClick: () => navigate('/au/marketplace') }}
          secondaryAction={{ label: 'Start intake', onClick: () => navigate('/au/request') }}
        >
          {tab === 'workflow' && <RoleWorkflowPanel roleId="au_buyer" completedSteps={auWorkflowProgress} />}

          {tab === 'orders' && (
            <>
        {orders.length === 0 ? (
          <div className={`${FINELY_OS_LUXURY_EMPTY} ${finelyOsCatalogCard('fuchsia')} !p-6 space-y-4 text-left`} data-fc-accent="fuchsia">
            <div className="inline-flex items-center gap-2 text-fuchsia-700">
              <ShieldCheck size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>No orders yet</span>
            </div>
            <p className={FINELY_OS_ENTITY_BODY}>Select a tradeline from the marketplace to begin your guided AU intake.</p>
            <button type="button" onClick={() => navigate('/au/marketplace')} className={FINELY_OS_PRIMARY_BTN}>
              Browse inventory <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <FinelyOsPaginatedStack
            items={orders}
            pageSize={6}
            itemSpacingClassName="grid lg:grid-cols-2 gap-6"
            emptyMessage="No orders yet."
            renderItem={(o, idx) => {
              const docs = o.evidence.length;
              const elig = o.eligibility.checked;
              const terms = Boolean(o.terms.acceptedAt);
              const ready = elig && terms && docs > 0;
              const accent = (['emerald', 'sky', 'violet', 'fuchsia'] as const)[idx % 4];
              return (
                <div key={o.id} className={`space-y-4 ${finelyOsCatalogCard(accent)} !p-6`} data-fc-accent={accent}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>
                        {o.listing.bank} • {o.listing.limit}
                      </div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>
                        {fmtUsd(o.listing.priceCents)} • {o.listing.age} • {o.id}
                      </div>
                    </div>
                    <span className={finelyOsStatusChip('warn')}>{prettyStatus(o.status)}</span>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-1`}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Eligibility</div>
                      <div className={FINELY_OS_ENTITY_BODY}>{elig ? 'Complete' : 'Pending'}</div>
                    </div>
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-1`}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Terms</div>
                      <div className={FINELY_OS_ENTITY_BODY}>{terms ? 'Accepted' : 'Pending'}</div>
                    </div>
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-1`}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Docs</div>
                      <div className={FINELY_OS_ENTITY_BODY}>{docs} uploaded</div>
                    </div>
                  </div>

                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      <Clock size={16} /> Latest
                    </div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                      {o.events?.[0]?.title ?? '—'}
                      {o.events?.[0]?.note ? <div className="mt-1 text-xs">{o.events[0].note}</div> : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className={`${FINELY_OS_ENTITY_BODY} text-xs inline-flex items-center gap-2`}>
                      {ready ? <BadgeCheck size={14} className="text-emerald-600" /> : <FileUp size={14} className="text-amber-600" />}
                      {ready ? 'Ready to submit (or already submitted).' : 'Continue intake to submit.'}
                    </div>
                    <button type="button" onClick={() => navigate(`/au/request?orderId=${encodeURIComponent(o.id)}`)} className={FINELY_OS_SUCCESS_BTN}>
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            }}
          />
        )}
            </>
          )}
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="finely_advisor"
          goal="tradelines"
          roleLabel="AU order specialist"
          subline="Questions about order status, documents, or fulfillment timeline?"
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
