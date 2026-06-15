import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Lock, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessReadinessChecklist } from '../../components/business/BusinessReadinessChecklist';
import { BusinessNav } from '../../components/business/BusinessNav';
import { BusinessCommandStrip } from '../../components/business/BusinessCommandStrip';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { listVendors } from '../../data/vendorsRepo';
import { listVendorProgress, setVendorProgress } from '../../data/vendorProgressRepo';
import { KpiCard } from '../../components/ui/KpiCards';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import type { Vendor, VendorTier } from '../../domain/vendors';
import {
  FINELY_OS_ENTITY_BODY,

  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

function tierBadge(tier: VendorTier) {
  if (tier === 1) return { label: 'Tier 1', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' };
  if (tier === 2) return { label: 'Tier 2', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700' };
  return { label: 'Tier 3', cls: 'border-violet-500/30 bg-violet-500/10 text-violet-700' };
}

type VendorTab = 'vendors' | 'readiness';

export default function BusinessVendorsPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<VendorTab>('vendors');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const vendors = useMemo(() => listVendors({ tenantId }), [tenantId, version]);
  const progress = useMemo(() => (partner ? listVendorProgress({ partnerId: partner.id, tenantId }) : []), [partner?.id, tenantId, version]);
  const progressByVendorId = useMemo(() => new Map(progress.map((r) => [r.vendorId, r])), [progress]);

  const openedIds = useMemo(() => new Set(progress.filter((r) => r.status === 'opened').map((r) => r.vendorId)), [progress]);

  const openedTier1 = useMemo(() => vendors.filter((v) => v.tier === 1 && openedIds.has(v.id)).length, [vendors, openedIds]);
  const openedTier2 = useMemo(() => vendors.filter((v) => v.tier === 2 && openedIds.has(v.id)).length, [vendors, openedIds]);
  const openedTier3 = useMemo(() => vendors.filter((v) => v.tier === 3 && openedIds.has(v.id)).length, [vendors, openedIds]);

  const business = useMemo(() => {
    const r: any = partner?.routes?.business_build ?? {};
    return r.business ?? {};
  }, [partner]);

  const hasTier1Basics = Boolean(String(business.businessName || '').trim()) && Boolean(String(business.entityState || '').trim());
  const tier1Unlocked = hasTier1Basics;
  const tier2Unlocked = tier1Unlocked && openedTier1 >= 3;
  const tier3Unlocked = tier2Unlocked && openedTier2 >= 3;
  const unlockedTier: 0 | VendorTier = tier3Unlocked ? 3 : tier2Unlocked ? 2 : tier1Unlocked ? 1 : 0;

  const vendorsByTier = useMemo(() => {
    const by: Record<string, Vendor[]> = { '1': [], '2': [], '3': [] };
    for (const v of vendors) by[String(v.tier)]?.push(v);
    return by as Record<'1' | '2' | '3', Vendor[]>;
  }, [vendors]);

  const groupedByCategory = (arr: Vendor[]) => {
    const m = new Map<string, Vendor[]>();
    for (const v of arr) m.set(v.category, [...(m.get(v.category) ?? []), v]);
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  return (
    <PageShell
      badge="Business Portal"
      title="Vendor Center"
      subtitle="Sequenced vendors and accounts that build business credit the right way — aligned to fundability signals and reporting."
      back={{ to: -1 }}
    >
      <div className={FINELY_OS_PAGE}>
        <BusinessNav />
        <BusinessCommandStrip partner={partner ?? null} />

        <FinelyUnifiedHubLayout
          eyebrow="Business credit OS"
          title="Vendor sequencing center"
          subtitle="Tier 1 → 2 → 3 vendor stack that builds fundability signals the right way."
          accent="amber"
          kpis={[
            { label: 'Unlocked tier', value: unlockedTier ? `Tier ${unlockedTier}` : 'Locked', accent: unlockedTier ? 'emerald' : 'amber' },
            { label: 'Tier 1 opened', value: String(openedTier1), accent: 'emerald' },
          ]}
          tabs={[
            { id: 'vendors', label: 'Vendors' },
            { id: 'readiness', label: 'Readiness' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as VendorTab)}
          primaryAction={{ label: 'Business profile', onClick: () => navigate('/business/profile') }}
          secondaryAction={{ label: 'Lender logic', onClick: () => navigate('/business/lender-logic') }}
        >
          {tab === 'readiness' && <BusinessReadinessChecklist title="Sequencing + readiness (track progress)" compact />}

          {tab === 'vendors' && (
            <>
        {!partner ? (
          <div className={FINELY_OS_NOTICE}>Sign in as a partner to see your vendor sequencing and track which accounts you've opened.</div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4">
              <KpiCard label="Unlocked tier" value={unlockedTier ? `Tier ${unlockedTier}` : 'Locked'} hint="Sequencing access" tone={unlockedTier ? 'emerald' : 'amber'} />
              <KpiCard label="Tier 1 opened" value={openedTier1} hint="Starter accounts" tone="emerald" />
              <KpiCard label="Tier 2 opened" value={openedTier2} hint="Scaling accounts" tone="amber" />
              <KpiCard label="Tier 3 opened" value={openedTier3} hint="Mature approvals" tone="violet" />
            </div>

            {!tier1Unlocked ? (
              <div className={FINELY_OS_NOTICE_WARN}>
                <div className="flex items-start gap-3">
                  <Lock size={18} className="text-fuchsia-400 mt-0.5 shrink-0" />
                  <div>
                    <div className={FINELY_OS_ENTITY_VALUE}>Tier 1 is locked</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                      Complete your business basics first (business legal name + entity state). That unlocks Tier 1 sequencing.
                    </div>
                    <div className="mt-3">
                      <button type="button" onClick={() => navigate('/business/profile')} className={FINELY_OS_PRIMARY_BTN}>
                        Go to Business Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              {[1, 2, 3].map((tier) => {
                const t = tier as VendorTier;
                const unlocked = t === 1 ? tier1Unlocked : t === 2 ? tier2Unlocked : tier3Unlocked;
                const items = vendorsByTier[String(t) as '1' | '2' | '3'] ?? [];
                const b = tierBadge(t);
                return (
                  <details key={t} open={t === 1} className={`${finelyOsCatalogCard(t === 1 ? 'emerald' : t === 2 ? 'amber' : 'violet')} !p-6`} data-fc-accent={t === 1 ? 'emerald' : t === 2 ? 'amber' : 'violet'}>
                    <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${b.cls}`}>{b.label}</span>
                        <span className={FINELY_OS_ENTITY_VALUE}>Vendors</span>
                        <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-sm`}>({items.length})</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${unlocked ? 'text-emerald-700' : 'text-fuchsia-700'}`}>
                        {unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </summary>

                    {!unlocked ? (
                      <div className={`mt-4 ${finelyOsCatalogCard('fuchsia')} !p-5`} data-fc-accent="fuchsia">
                        <div className="flex items-start gap-3">
                          <Lock size={18} className="text-fuchsia-400 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <div className={FINELY_OS_ENTITY_VALUE}>Complete Tier {t - 1} first</div>
                            <div className={FINELY_OS_ENTITY_BODY}>
                              Unlock rule: open at least <strong>3 vendors</strong> in Tier {t - 1}.
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 space-y-4">
                        <div className={`${finelyOsCatalogCard('sky')} !p-4 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                          Tip: These are curated starters. Availability + reporting behavior can change — always confirm terms and keep sequencing clean.
                        </div>
                        {groupedByCategory(items).map(([cat, catItems]) => (
                          <details key={cat} className={`${finelyOsCatalogCard('emerald')} !p-5`} data-fc-accent="emerald">
                            <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>
                              {cat} <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-normal`}>({catItems.length})</span>
                            </summary>
                            <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {catItems.map((v) => {
                                const pr = progressByVendorId.get(v.id) ?? null;
                                const opened = pr?.status === 'opened';
                                const skipped = pr?.status === 'skipped';
                                return (
                                  <div key={v.id} className={`${finelyOsCatalogCard('amber')} !p-4 space-y-3`} data-fc-accent="amber">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{v.name}</div>
                                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                                          Tier {v.tier} • {v.category}
                                        </div>
                                      </div>
                                      <span className={finelyOsStatusChip(opened ? 'ok' : skipped ? 'blocked' : 'warn')}>
                                        {opened ? 'Opened' : skipped ? 'Skipped' : 'New'}
                                      </span>
                                    </div>

                                    {v.notes ? <div className={FINELY_OS_ENTITY_BODY}>{v.notes}</div> : null}

                                    {Array.isArray(v.prerequisites) && v.prerequisites.length ? (
                                      <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
                                        <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>Prereqs:</span> {v.prerequisites.slice(0, 4).join(' • ')}
                                      </div>
                                    ) : null}

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                      {v.website ? (
                                        <a href={v.website} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SECONDARY_BTN}>
                                          Open <ExternalLink size={14} />
                                        </a>
                                      ) : null}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!partner) return;
                                          setVendorProgress({ partnerId: partner.id, vendorId: v.id, status: opened ? 'recommended' : 'opened', tenantId });
                                          setVersion((x) => x + 1);
                                        }}
                                        className={opened ? FINELY_OS_SECONDARY_BTN : FINELY_OS_SUCCESS_BTN}
                                        title={opened ? 'Mark as not opened' : 'Mark as opened'}
                                      >
                                        {opened ? <Circle size={14} /> : <CheckCircle2 size={14} />} {opened ? 'Undo' : 'Opened'}
                                      </button>

                                      {!opened ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!partner) return;
                                            setVendorProgress({ partnerId: partner.id, vendorId: v.id, status: skipped ? 'recommended' : 'skipped', tenantId });
                                            setVersion((x) => x + 1);
                                          }}
                                          className={FINELY_OS_SECONDARY_BTN}
                                          title={skipped ? 'Unskip vendor' : 'Skip vendor'}
                                        >
                                          Skip
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          </>
        )}
            </>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
