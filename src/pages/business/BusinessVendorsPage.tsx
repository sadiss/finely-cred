import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, ExternalLink, Lock, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessReadinessChecklist } from '../../components/business/BusinessReadinessChecklist';
import { BusinessNav } from '../../components/business/BusinessNav';
import { BusinessCommandStrip } from '../../components/business/BusinessCommandStrip';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { ensureVendorCatalogDefaultsOnce, listVendors } from '../../data/vendorsRepo';
import { listVendorProgress, setVendorProgress } from '../../data/vendorProgressRepo';
import { KpiCard } from '../../components/ui/KpiCards';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import type { Vendor, VendorTier } from '../../domain/vendors';
import {
  BUSINESS_TYPE_OPTIONS,
  countOpenedByTier,
  evaluateFoundationSteps,
  normalizeBusinessType,
  recommendVendors,
  tierMeta,
  tierUnlockState,
} from '../../lib/businessVendorSequencing';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_PAGE,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

const TIERS: VendorTier[] = [1, 2, 3, 4];

function tierBadge(tier: VendorTier) {
  if (tier === 1) return { label: 'Tier 1', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' };
  if (tier === 2) return { label: 'Tier 2', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700' };
  if (tier === 3) return { label: 'Tier 3', cls: 'border-violet-500/30 bg-violet-500/10 text-violet-700' };
  return { label: 'Tier 4', cls: 'border-sky-500/30 bg-sky-500/10 text-sky-700' };
}

type VendorTab = 'vendors' | 'readiness';

function VendorCard({
  vendor,
  opened,
  skipped,
  recommended,
  partnerId,
  tenantId,
  onChange,
}: {
  vendor: Vendor;
  opened: boolean;
  skipped: boolean;
  recommended?: boolean;
  partnerId: string;
  tenantId: string;
  onChange: () => void;
}) {
  return (
    <div className={`${finelyOsCatalogCard(recommended ? 'amber' : 'emerald')} !p-4 space-y-3`} data-fc-accent={recommended ? 'amber' : 'emerald'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{vendor.name}</div>
            {recommended ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-amber-800">
                <Star size={10} /> Best fit
              </span>
            ) : null}
          </div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
            Tier {vendor.tier} • {vendor.category}
          </div>
        </div>
        <span className={finelyOsStatusChip(opened ? 'ok' : skipped ? 'blocked' : 'warn')}>
          {opened ? 'Opened' : skipped ? 'Skipped' : 'New'}
        </span>
      </div>

      {vendor.notes ? <div className={FINELY_OS_ENTITY_BODY}>{vendor.notes}</div> : null}
      {vendor.prerequisites?.length ? (
        <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
          Prereqs: {vendor.prerequisites.slice(0, 3).join(' • ')}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {vendor.website ? (
          <a href={vendor.website} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SECONDARY_BTN}>
            Open <ExternalLink size={14} />
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setVendorProgress({ partnerId, vendorId: vendor.id, status: opened ? 'recommended' : 'opened', tenantId });
            onChange();
          }}
          className={opened ? FINELY_OS_SECONDARY_BTN : FINELY_OS_SUCCESS_BTN}
        >
          {opened ? <Circle size={14} /> : <CheckCircle2 size={14} />} {opened ? 'Undo' : 'Opened'}
        </button>
        {!opened ? (
          <button
            type="button"
            onClick={() => {
              setVendorProgress({ partnerId, vendorId: vendor.id, status: skipped ? 'recommended' : 'skipped', tenantId });
              onChange();
            }}
            className={FINELY_OS_SECONDARY_BTN}
          >
            Skip
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function BusinessVendorsPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<VendorTab>('vendors');

  useEffect(() => {
    ensureVendorCatalogDefaultsOnce();
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const vendors = useMemo(() => listVendors({ tenantId }), [tenantId, version]);
  const progress = useMemo(() => (partner ? listVendorProgress({ partnerId: partner.id, tenantId }) : []), [partner?.id, tenantId, version]);
  const progressByVendorId = useMemo(() => new Map(progress.map((r) => [r.vendorId, r])), [progress]);
  const openedIds = useMemo(() => new Set(progress.filter((r) => r.status === 'opened').map((r) => r.vendorId)), [progress]);

  const business = useMemo(() => {
    const r: Record<string, unknown> = (partner?.routes?.business_build as { business?: Record<string, unknown> })?.business ?? {};
    return r;
  }, [partner]);

  const businessType = normalizeBusinessType(String(business.businessType || 'general'));
  const foundation = useMemo(
    () => evaluateFoundationSteps({ business, partnerId: partner?.id }),
    [business, partner?.id, version],
  );

  const openedByTier = useMemo(() => countOpenedByTier(vendors, openedIds), [vendors, openedIds]);
  const unlocked = useMemo(() => tierUnlockState({ foundationComplete: foundation.complete, openedByTier }), [foundation.complete, openedByTier]);
  const maxUnlockedTier = unlocked[4] ? 4 : unlocked[3] ? 3 : unlocked[2] ? 2 : unlocked[1] ? 1 : 0;

  const vendorsByTier = useMemo(() => {
    const by: Record<string, Vendor[]> = { '1': [], '2': [], '3': [], '4': [] };
    for (const v of vendors) by[String(v.tier)]?.push(v);
    return by as Record<'1' | '2' | '3' | '4', Vendor[]>;
  }, [vendors]);

  const refresh = () => setVersion((x) => x + 1);

  return (
    <PageShell
      badge="Business Portal"
      title="Vendor Center"
      subtitle="Tier 1 → 4 sequencing with foundation gates — recommended vendors match your business type."
      back={{ to: -1 }}
    >
      <div className={FINELY_OS_PAGE}>
        <BusinessNav />
        <BusinessCommandStrip partner={partner ?? null} />

        <FinelyUnifiedHubLayout
          eyebrow="Business credit OS"
          title="Vendor sequencing center"
          subtitle={`${BUSINESS_TYPE_OPTIONS.find((o) => o.id === businessType)?.label ?? 'General'} · foundation ${foundation.percent}% · Tier ${maxUnlockedTier || 'locked'}`}
          accent="amber"
          kpis={[
            { label: 'Foundation', value: `${foundation.percent}%`, accent: foundation.complete ? 'emerald' : 'amber' },
            { label: 'Unlocked tier', value: maxUnlockedTier ? `Tier ${maxUnlockedTier}` : 'Locked', accent: maxUnlockedTier ? 'emerald' : 'amber' },
            { label: 'Tier 1 opened', value: String(openedByTier[1]), accent: 'emerald' },
            { label: 'Tier 4 ready', value: unlocked[4] ? 'Yes' : 'No', accent: unlocked[4] ? 'sky' : 'violet' },
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
                <div className={FINELY_OS_NOTICE}>Sign in as a partner to see your vendor sequencing.</div>
              ) : (
                <>
                  <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`} data-fc-accent="violet">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-violet-400" />
                      <div className={FINELY_OS_ENTITY_VALUE}>Foundation gate — required before Tier 1 vendors appear</div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-400 transition-all" style={{ width: `${foundation.percent}%` }} />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {foundation.steps.map((step) => (
                        <div key={step.id} className={`${finelyOsCatalogCard(step.done ? 'emerald' : 'fuchsia')} !p-3 flex gap-2`} data-fc-accent={step.done ? 'emerald' : 'fuchsia'}>
                          {step.done ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" /> : <Circle size={16} className="text-fuchsia-400 shrink-0 mt-0.5" />}
                          <div>
                            <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{step.title}</p>
                            <p className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{step.hint}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!foundation.complete ? (
                      <button type="button" onClick={() => navigate('/business/profile')} className={FINELY_OS_PRIMARY_BTN}>
                        Complete foundation on business profile
                      </button>
                    ) : (
                      <p className={`text-sm ${FINELY_OS_ENTITY_BODY} text-emerald-700`}>Foundation complete — Tier 1 vendors are unlocked.</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    {TIERS.map((t) => (
                      <KpiCard
                        key={t}
                        label={`Tier ${t} opened`}
                        value={openedByTier[t]}
                        hint={unlocked[t] ? 'Unlocked' : tierMeta(t).unlockHint}
                        tone={t === 1 ? 'emerald' : t === 2 ? 'amber' : t === 3 ? 'violet' : 'sky'}
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    {TIERS.map((tier) => {
                      const meta = tierMeta(tier);
                      const isUnlocked = unlocked[tier];
                      const items = vendorsByTier[String(tier) as '1' | '2' | '3' | '4'] ?? [];
                      const recommended = isUnlocked
                        ? recommendVendors({ vendors, businessType, tier, limit: 6 })
                        : [];
                      const recommendedIds = new Set(recommended.map((v) => v.id));
                      const b = tierBadge(tier);

                      return (
                        <details key={tier} open={tier <= Math.max(1, maxUnlockedTier)} className={`${finelyOsCatalogCard(meta.accent)} !p-6`} data-fc-accent={meta.accent}>
                          <summary className="cursor-pointer select-none flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${b.cls}`}>{b.label}</span>
                              <span className={FINELY_OS_ENTITY_VALUE}>{meta.label}</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isUnlocked ? 'text-emerald-700' : 'text-fuchsia-700'}`}>
                              {isUnlocked ? 'Unlocked' : 'Locked'}
                            </span>
                          </summary>
                          <p className={`mt-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>{meta.desc}</p>

                          {!isUnlocked ? (
                            <div className={`mt-4 ${finelyOsCatalogCard('fuchsia')} !p-5`} data-fc-accent="fuchsia">
                              <div className="flex items-start gap-3">
                                <Lock size={18} className="text-fuchsia-400 mt-0.5 shrink-0" />
                                <div>
                                  <div className={FINELY_OS_ENTITY_VALUE}>Tier {tier} locked</div>
                                  <div className={FINELY_OS_ENTITY_BODY}>{meta.unlockHint}</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-5 space-y-5">
                              {recommended.length > 0 ? (
                                <div>
                                  <p className={`mb-3 ${FINELY_OS_ENTITY_SUBLABEL} font-black uppercase tracking-wide`}>
                                    Recommended for {BUSINESS_TYPE_OPTIONS.find((o) => o.id === businessType)?.label}
                                  </p>
                                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {recommended.map((v) => {
                                      const pr = progressByVendorId.get(v.id) ?? null;
                                      return (
                                        <VendorCard
                                          key={v.id}
                                          vendor={v}
                                          opened={pr?.status === 'opened'}
                                          skipped={pr?.status === 'skipped'}
                                          recommended
                                          partnerId={partner.id}
                                          tenantId={tenantId}
                                          onChange={refresh}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}

                              <details className={`${finelyOsCatalogCard('sky')} !p-4`} data-fc-accent="sky">
                                <summary className={`cursor-pointer ${FINELY_OS_ENTITY_VALUE}`}>All Tier {tier} vendors ({items.length})</summary>
                                <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {items
                                    .filter((v) => !recommendedIds.has(v.id))
                                    .map((v) => {
                                      const pr = progressByVendorId.get(v.id) ?? null;
                                      return (
                                        <VendorCard
                                          key={v.id}
                                          vendor={v}
                                          opened={pr?.status === 'opened'}
                                          skipped={pr?.status === 'skipped'}
                                          partnerId={partner.id}
                                          tenantId={tenantId}
                                          onChange={refresh}
                                        />
                                      );
                                    })}
                                </div>
                              </details>
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
