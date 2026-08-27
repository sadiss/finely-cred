import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleHelp,
  ExternalLink,
  Landmark,
  Layers,
  Lock,
  PlayCircle,
  Sparkles,
  Star,
  Store,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import type { Vendor, VendorTier } from '../../../../domain/vendors';
import { BusinessReadinessChecklist } from '../../../../components/business/BusinessReadinessChecklist';
import { BusinessCommandStrip } from '../../../../components/business/BusinessCommandStrip';
import { hasEntitlement } from '../../../../data/billingRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { ensureVendorCatalogDefaultsOnce, listVendors } from '../../../../data/vendorsRepo';
import { listVendorProgress, setVendorProgress } from '../../../../data/vendorProgressRepo';
import { KpiCard } from '../../../../components/ui/KpiCards';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  BUSINESS_TYPE_OPTIONS,
  countOpenedByTier,
  evaluateFoundationSteps,
  normalizeBusinessType,
  recommendVendors,
  tierMeta,
  tierUnlockState,
} from '../../../../lib/businessVendorSequencing';
import {
  getAllTierStrategies,
  getFundingInstrumentsByStage,
  type BusinessCreditBureauKey,
  type BusinessCreditTierStrategy,
  type BusinessFundingInstrument,
  type BusinessFundingInstrumentType,
  type BusinessStage,
} from '../../../../data/businessCreditDoctrineRepo';
import type { Partner } from '../../../../domain/partners';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getPartnerServiceLine, getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_PAGE,
  finelyOsAlertBanner,
  finelyOsCatalogCard,
  finelyOsDeckTile,
  finelyOsMicroStat,
  finelyOsStatusChip,
  type FinelyOsDeckAccent,
  type FinelyOsPublicAccent,
} from '../../../os/finelyOsLightUi';

const SERVICE_LINE_ID = 'business' as const;
const TIERS: VendorTier[] = [1, 2, 3, 4];
const VENDOR_ROW_ACCENTS: FinelyOsPublicAccent[] = ['emerald', 'sky', 'violet', 'rose'];
const VENDOR_PAGE_SIZE = 8;
const JOURNEY_VIEWS = ['vendors', 'tier-ladder', 'readiness'] as const;
type JourneyView = (typeof JOURNEY_VIEWS)[number];

const DOCTRINE_TIER_ACCENTS: Record<1 | 2 | 3 | 4 | 5, FinelyOsDeckAccent> = {
  1: 'emerald', 2: 'sky', 3: 'violet', 4: 'sky', 5: 'fuchsia',
};
const DOCTRINE_TIER_ROW_ACCENTS: FinelyOsPublicAccent[] = ['emerald', 'sky', 'violet', 'rose'];
const BUREAU_LABELS: Record<BusinessCreditBureauKey, string> = {
  dnb: 'D&B', experian_small_business: 'Experian Small Business', equifax_business: 'Equifax Business',
};
const BUSINESS_STAGE_OPTIONS: { id: BusinessStage; label: string; hint: string }[] = [
  { id: 'startup_0_6mo', label: 'Startup (0-6mo)', hint: 'Thin file — EIN-only, no-PG options' },
  { id: 'established_6_24mo', label: 'Established (6-24mo)', hint: 'Bank statements + light trade history' },
  { id: 'mature_2yr_plus', label: 'Mature (2yr+)', hint: 'Full financials, institutional scale' },
];
const FUNDING_INSTRUMENT_LABELS: Record<BusinessFundingInstrumentType, string> = {
  sba_7a: 'SBA 7(a) Loan', sba_504: 'SBA 504 Fixed-Asset Loan', business_line_of_credit: 'Business Line of Credit',
  equipment_financing: 'Equipment Financing', invoice_factoring: 'Invoice Factoring', merchant_cash_advance: 'Merchant Cash Advance',
  term_loan: 'Term Loan', commercial_real_estate: 'Commercial Real Estate Loan', business_credit_card_stacking: 'Business Credit Card Stacking',
};

function tierBadge(tier: VendorTier) {
  if (tier === 1) return { label: 'Tier 1', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' };
  if (tier === 2) return { label: 'Tier 2', cls: 'border-sky-500/30 bg-sky-500/10 text-sky-700' };
  if (tier === 3) return { label: 'Tier 3', cls: 'border-violet-500/30 bg-violet-500/10 text-violet-700' };
  return { label: 'Tier 4', cls: 'border-sky-500/30 bg-sky-500/10 text-sky-700' };
}

function DoctrineVendorRow({ vendor, accent }: { vendor: { name: string; reportingBureau: string; approvalCriteria: string }; accent: FinelyOsPublicAccent }) {
  return (
    <div className={finelyOsCatalogCard(accent)} data-fc-accent={accent}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{vendor.name}</div>
        <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono shrink-0`}>{vendor.reportingBureau}</span>
      </div>
      <div className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{vendor.approvalCriteria}</div>
    </div>
  );
}

function TierLadderTile({ strategy, active, onSelect }: { strategy: BusinessCreditTierStrategy; active: boolean; onSelect: () => void }) {
  const accent = DOCTRINE_TIER_ACCENTS[strategy.tier];
  return (
    <button type="button" onClick={onSelect} className={finelyOsDeckTile(accent, active)} data-fc-accent={accent}>
      <div className="p-3 space-y-2">
        <span className={finelyOsMicroStat(accent)}>Tier {strategy.tier}</span>
        <div className="text-sm font-bold leading-snug line-clamp-2">{strategy.tierName}</div>
      </div>
    </button>
  );
}

function FundingInstrumentCard({ instrument, accent }: { instrument: BusinessFundingInstrument; accent: FinelyOsPublicAccent }) {
  const isMca = instrument.instrumentType === 'merchant_cash_advance';
  return (
    <div className={`${finelyOsCatalogCard(accent)} space-y-3`} data-fc-accent={accent}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className={FINELY_OS_ENTITY_VALUE}>{FUNDING_INSTRUMENT_LABELS[instrument.instrumentType]}</div>
        <span className={finelyOsMicroStat(accent)}>{instrument.fundingRangeLabel}</span>
      </div>
      {isMca ? (
        <div className={finelyOsAlertBanner('warning')}>
          <AlertTriangle size={16} className="shrink-0" />
          <span>High-cost financing — read risks before using.</span>
        </div>
      ) : null}
      <ul className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY} list-disc list-inside`}>
        {instrument.typicalUnderwritingFactors.slice(0, 3).map((f) => <li key={f}>{f}</li>)}
      </ul>
    </div>
  );
}

function sortTierVendors(items: Vendor[], recommendedIds: Set<string>) {
  return [...items].sort((a, b) => {
    const aRec = recommendedIds.has(a.id) ? 0 : 1;
    const bRec = recommendedIds.has(b.id) ? 0 : 1;
    if (aRec !== bRec) return aRec - bRec;
    return a.name.localeCompare(b.name);
  });
}

function VendorRow({
  vendor, opened, skipped, recommended, accent, partnerId, tenantId, onChange,
}: {
  vendor: Vendor; opened: boolean; skipped: boolean; recommended?: boolean; accent: FinelyOsPublicAccent;
  partnerId: string; tenantId: string; onChange: () => void;
}) {
  const markOpened = () => {
    setVendorProgress({ partnerId, vendorId: vendor.id, status: 'opened', tenantId });
    onChange();
  };
  const primaryAction = () => {
    if (vendor.website) {
      window.open(vendor.website, '_blank', 'noopener,noreferrer');
      if (!opened) markOpened();
      return;
    }
    if (opened) {
      setVendorProgress({ partnerId, vendorId: vendor.id, status: 'recommended', tenantId });
      onChange();
      return;
    }
    markOpened();
  };
  const ctaLabel = vendor.website ? (opened ? 'Revisit vendor' : 'Open vendor') : opened ? 'Undo opened' : 'Mark opened';
  return (
    <div className={finelyOsCatalogCard(accent)} data-fc-accent={accent}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{vendor.name}</div>
            {recommended ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700">
                <Star size={10} /> Best fit
              </span>
            ) : null}
          </div>
          <div className={`mt-0.5 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>Tier {vendor.tier} • {vendor.category}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className={finelyOsStatusChip(opened ? 'ok' : skipped ? 'blocked' : 'warn')}>
            {opened ? 'Opened' : skipped ? 'Skipped' : 'New'}
          </span>
          <button type="button" onClick={primaryAction} className={opened ? FINELY_OS_SECONDARY_BTN : FINELY_OS_PRIMARY_BTN}>
            {vendor.website ? <ExternalLink size={14} /> : opened ? <Circle size={14} /> : <CheckCircle2 size={14} />} {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function partnerOwnsBusinessLine(partnerId: string): boolean {
  const line = getPartnerServiceLine(SERVICE_LINE_ID);
  if (line.entitlementAnyOf.length === 0) return true;
  return line.entitlementAnyOf.some((key) => hasEntitlement(partnerId, key));
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'locked' }
  | { status: 'ready'; partner: Partner };

export default function PartnerBusinessVendorsProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Store;
  const scaffoldAccent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const serviceLine = getPartnerServiceLine(SERVICE_LINE_ID);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [version, setVersion] = useState(0);
  const [journeyView, setJourneyView] = useState<JourneyView>('vendors');
  const [selectedDoctrineTier, setSelectedDoctrineTier] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedStage, setSelectedStage] = useState<BusinessStage>('startup_0_6mo');

  useEffect(() => {
    ensureVendorCatalogDefaultsOnce();
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      if (!partnerOwnsBusinessLine(partnerId!)) {
        if (!cancelled) setState({ status: 'locked' });
        return;
      }
      const loaded = getPartnerSync(partnerId!);
      if (!loaded) throw new Error('Partner profile not found.');
      if (!cancelled) setState({ status: 'ready', partner: loaded });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your vendor plan right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => { cancelled = true; };
  }, [isDemo, partnerId, retryToken, version]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);
  const partner = state.status === 'ready' ? state.partner : sessionPartner;
  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const vendors = useMemo(() => listVendors({ tenantId }), [tenantId, version]);
  const progress = useMemo(() => (partner ? listVendorProgress({ partnerId: partner.id, tenantId }) : []), [partner?.id, tenantId, version]);
  const progressByVendorId = useMemo(() => new Map(progress.map((r) => [r.vendorId, r])), [progress]);
  const openedIds = useMemo(() => new Set(progress.filter((r) => r.status === 'opened').map((r) => r.vendorId)), [progress]);
  const business = useMemo(() => ((partner?.routes as { business_build?: { business?: Record<string, unknown> } })?.business_build?.business ?? {}) as Record<string, unknown>, [partner]);
  const businessType = normalizeBusinessType(String(business.businessType || 'general'));
  const foundation = useMemo(() => evaluateFoundationSteps({ business, partnerId: partner?.id }), [business, partner?.id, version]);
  const openedByTier = useMemo(() => countOpenedByTier(vendors, openedIds), [vendors, openedIds]);
  const unlocked = useMemo(() => tierUnlockState({ foundationComplete: foundation.complete, openedByTier }), [foundation.complete, openedByTier]);
  const maxUnlockedTier = unlocked[4] ? 4 : unlocked[3] ? 3 : unlocked[2] ? 2 : unlocked[1] ? 1 : 0;
  const vendorsByTier = useMemo(() => {
    const by: Record<string, Vendor[]> = { '1': [], '2': [], '3': [], '4': [] };
    for (const v of vendors) by[String(v.tier)]?.push(v);
    return by as Record<'1' | '2' | '3' | '4', Vendor[]>;
  }, [vendors]);
  const tierStrategies = useMemo(() => getAllTierStrategies(), []);
  const activeStrategy = tierStrategies.find((s) => s.tier === selectedDoctrineTier) ?? tierStrategies[0];
  const stageFundingInstruments = useMemo(() => getFundingInstrumentsByStage(selectedStage), [selectedStage]);
  const refresh = () => setVersion((x) => x + 1);

  const metrics: ProductMetric[] = [
    { label: 'Foundation', value: `${foundation.percent}%`, hint: foundation.complete ? 'Unlocked' : 'Complete profile', accent: 'emerald', icon: Target, onClick: () => navigate(mapPortalHref('/business/profile')) },
    { label: 'Unlocked tier', value: maxUnlockedTier ? `Tier ${maxUnlockedTier}` : 'Locked', hint: maxUnlockedTier ? 'Vendor ladder' : 'Complete foundation', accent: maxUnlockedTier ? 'emerald' : 'rose', icon: Landmark, onClick: () => navigate(mapPortalHref('/business/vendors')) },
    { label: 'Tier 1 opened', value: String(openedByTier[1]), hint: 'Starter vendors', accent: 'sky', icon: Store, onClick: () => navigate(mapPortalHref('/business/vendors')) },
    { label: 'Tier 4 ready', value: unlocked[4] ? 'Yes' : 'No', hint: 'Premium stack', accent: 'violet', icon: Layers, onClick: () => navigate(mapPortalHref('/business/vendors')) },
  ];

  const journeyBody = (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="journey-runway">
      <BusinessCommandStrip partner={partner ?? null} />

      <div className="relative flex flex-wrap items-center gap-2 md:gap-0 md:flex-nowrap">
        {([
          { id: 'vendors' as const, label: 'Your vendors', accent: 'emerald' },
          { id: 'tier-ladder' as const, label: 'Tier ladder', accent: 'sky' },
          { id: 'readiness' as const, label: 'Readiness', accent: 'violet' },
        ]).map((node, index, arr) => {
          const active = journeyView === node.id;
          return (
            <React.Fragment key={node.id}>
              <button
                type="button"
                onClick={() => setJourneyView(node.id)}
                className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold border transition-all ${active ? 'ring-2 ring-white/20 scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
                data-fcm-accent={node.accent}
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black">{index + 1}</span>
                {node.label}
              </button>
              {index < arr.length - 1 ? (
                <div className="hidden md:block h-1 flex-1 min-w-[40px] mx-2 rounded-full bg-gradient-to-r from-emerald-500/40 via-violet-500/40 to-sky-500/40" aria-hidden />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      {journeyView === 'readiness' ? <BusinessReadinessChecklist title="Sequencing + readiness" compact /> : null}

      {journeyView === 'tier-ladder' ? (
        <div className="space-y-4">
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <div className="flex items-center gap-2">
              <Layers size={18} />
              <div className={FINELY_OS_ENTITY_TITLE}>Vendor tier ladder</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {tierStrategies.map((strategy) => (
                <TierLadderTile key={strategy.tier} strategy={strategy} active={strategy.tier === selectedDoctrineTier} onSelect={() => setSelectedDoctrineTier(strategy.tier)} />
              ))}
            </div>
            {activeStrategy ? (
              <div className={`${finelyOsCatalogCard(DOCTRINE_TIER_ACCENTS[activeStrategy.tier] as FinelyOsPublicAccent)} p-6 space-y-3`} data-fc-accent={DOCTRINE_TIER_ACCENTS[activeStrategy.tier]}>
                <div className={FINELY_OS_ENTITY_VALUE}>{activeStrategy.tierName}</div>
                <div className="flex flex-wrap gap-2">
                  {activeStrategy.targetBureaus.map((b) => <span key={b} className={FINELY_OS_ENTITY_CHIP}>{BUREAU_LABELS[b]}</span>)}
                </div>
                <FinelyOsPaginatedStack
                  items={activeStrategy.vendorList}
                  pageSize={5}
                  itemSpacingClassName="space-y-2"
                  emptyMessage="No vendors listed."
                  renderItem={(v, idx) => <DoctrineVendorRow key={v.name} vendor={v} accent={DOCTRINE_TIER_ROW_ACCENTS[idx % 4]} />}
                />
              </div>
            ) : null}
          </div>
          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
            <div className="flex items-center gap-2"><Landmark size={16} /><div className={FINELY_OS_ENTITY_TITLE}>Funding instrument browser</div></div>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_STAGE_OPTIONS.map((opt) => (
                <button key={opt.id} type="button" onClick={() => setSelectedStage(opt.id)} className={opt.id === selectedStage ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN} title={opt.hint}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {stageFundingInstruments.map((instrument, idx) => (
                <FundingInstrumentCard key={instrument.id} instrument={instrument} accent={DOCTRINE_TIER_ROW_ACCENTS[idx % 4]} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {journeyView === 'vendors' ? (
        !partner ? (
          <div className={FINELY_OS_NOTICE}>Sign in as a partner to see your vendor sequencing.</div>
        ) : (
          <>
            <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
              <div className="flex items-center gap-2"><Sparkles size={16} /><div className={FINELY_OS_ENTITY_VALUE}>Foundation gate</div></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-400 transition-all" style={{ width: `${foundation.percent}%` }} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {foundation.steps.map((step) => (
                  <div key={step.id} className={`${finelyOsCatalogCard(step.done ? 'emerald' : 'rose')} flex gap-3 p-4`} data-fc-accent={step.done ? 'emerald' : 'rose'}>
                    {step.done ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <Circle size={16} className="text-fuchsia-400 shrink-0" />}
                    <div>
                      <p className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>{step.title}</p>
                      <p className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{step.hint}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!foundation.complete ? (
                <button type="button" onClick={() => navigate(mapPortalHref('/business/profile'))} className={FINELY_OS_PRIMARY_BTN}>
                  Complete foundation on business profile
                </button>
              ) : null}
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {TIERS.map((t) => (
                <KpiCard key={t} label={`Tier ${t} opened`} value={openedByTier[t]} hint={unlocked[t] ? 'Unlocked' : tierMeta(t).unlockHint} tone={t === 1 ? 'emerald' : t === 2 ? 'sky' : t === 3 ? 'violet' : 'sky'} />
              ))}
            </div>

            <div className="space-y-4">
              {TIERS.map((tier) => {
                const meta = tierMeta(tier);
                const isUnlocked = unlocked[tier];
                const items = vendorsByTier[String(tier) as '1' | '2' | '3' | '4'] ?? [];
                const recommended = isUnlocked ? recommendVendors({ vendors, businessType, tier, limit: 6 }) : [];
                const recommendedIds = new Set(recommended.map((v) => v.id));
                const b = tierBadge(tier);
                return (
                  <details key={tier} open={tier <= Math.max(1, maxUnlockedTier)} className={`${finelyOsCatalogCard(meta.accent)} p-6 lg:p-8`} data-fc-accent={meta.accent}>
                    <summary className="cursor-pointer select-none flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${b.cls}`}>{b.label}</span>
                        <span className={FINELY_OS_ENTITY_VALUE}>{meta.label}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isUnlocked ? 'text-emerald-700' : 'text-fuchsia-700'}`}>
                        {isUnlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </summary>
                    <p className={`mt-3 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{meta.desc}</p>
                    {!isUnlocked ? (
                      <div className={`mt-4 ${finelyOsCatalogCard('rose')} p-4`} data-fc-accent="rose">
                        <div className="flex items-start gap-3">
                          <Lock size={18} className="text-fuchsia-400 shrink-0" />
                          <div>
                            <div className={FINELY_OS_ENTITY_VALUE}>Tier {tier} locked</div>
                            <div className={FINELY_OS_ENTITY_BODY}>{meta.unlockHint}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <FinelyOsPaginatedStack
                          items={sortTierVendors(items, recommendedIds)}
                          pageSize={VENDOR_PAGE_SIZE}
                          itemSpacingClassName="space-y-2"
                          emptyMessage={`No Tier ${tier} vendors yet.`}
                          renderItem={(v, idx) => {
                            const pr = progressByVendorId.get(v.id) ?? null;
                            return (
                              <VendorRow
                                key={v.id}
                                vendor={v}
                                opened={pr?.status === 'opened'}
                                skipped={pr?.status === 'skipped'}
                                recommended={recommendedIds.has(v.id)}
                                accent={VENDOR_ROW_ACCENTS[idx % 4]}
                                partnerId={partner.id}
                                tenantId={tenantId}
                                onChange={refresh}
                              />
                            );
                          }}
                        />
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          </>
        )
      ) : null}
    </section>
  );

  const askFinelyPrompt = 'Which vendor should I apply to next for my tier?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Vendor tiers' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow={demoSpec?.eyebrow ?? 'Vendor tiers'} title={demoSpec?.title ?? 'Vendor center'} description={demoSpec?.description ?? 'Tier 1–4 sequencing with foundation gates.'} status="demo data" freshness="demo snapshot" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} metrics={metrics} metricTitle="Vendor progress" metricDescription="Sequenced net-30 reporting." primaryAction={<ProductPagePrimaryAction label="Open vendor center" onClick={() => navigate(mapPortalHref('/business/vendors'))} />}>
        {journeyBody}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') return <ProductDashboardSkeleton label="Loading your vendor plan" />;
  if (state.status === 'error') {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow="Vendor tiers" title="Vendor center" description="Tier sequencing." status="Error" freshness="just now" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}>
        <ProductEmptyState title="Could not load vendor plan" description={state.message} action={<button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>Try again</button>} />
      </ProductHubScaffold>
    );
  }
  if (state.status === 'locked') {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow="Vendor tiers" title="Vendor center" description="Tier sequencing." status="Not started" freshness="just now" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} metrics={metrics} primaryAction={<ProductPagePrimaryAction label="Explore business credit" onClick={() => navigate(serviceLine.upsellPath)} />}>
        <ProductEmptyState title="Not started yet" description={serviceLine.upsellHeadline} action={<button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(serviceLine.upsellPath)}>See business options</button>} />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Vendor tiers"
      title="Vendor center"
      description={`${BUSINESS_TYPE_OPTIONS.find((o) => o.id === businessType)?.label ?? 'General'} · foundation ${foundation.percent}% — Tier 1 → 4 sequencing with foundation gates.`}
      status={`Tier ${maxUnlockedTier || 'locked'} · live data`}
      freshness="just now"
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Vendor progress"
      metricDescription="Only accounts that report to business bureaus count toward a tier."
      primaryAction={<ProductPagePrimaryAction label="Business profile" onClick={() => navigate(mapPortalHref('/business/profile'))} />}
      secondaryAction={<button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/business/lender-logic'))}>Lender logic</button>}
    >
      {journeyBody}
      <aside className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 mt-6 space-y-3`} data-fc-accent="emerald">
        <div className="fc-wlp-eyebrow">What to do next</div>
        <h2 className="text-2xl font-extrabold">{foundation.complete ? 'Apply where you qualify' : 'Complete foundation first'}</h2>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Vendor tiers unlock as foundation completes and lower tiers season.</p>
        {guideActions}
      </aside>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
