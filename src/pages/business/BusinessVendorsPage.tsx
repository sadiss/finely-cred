import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, ExternalLink, Landmark, Layers, Lock, Sparkles, Star } from 'lucide-react';
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
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
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
  finelyOsCatalogCardCompact,
  finelyOsDeckTile,
  finelyOsMicroStat,
  finelyOsStatusChip,
  type FinelyOsDeckAccent,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';
import {
  getAllFundingInstruments,
  getAllTierStrategies,
  getFundingInstrumentsByStage,
  type BusinessCreditBureauKey,
  type BusinessCreditTierStrategy,
  type BusinessFundingInstrument,
  type BusinessFundingInstrumentType,
  type BusinessStage,
} from '../../data/businessCreditDoctrineRepo';

const TIERS: VendorTier[] = [1, 2, 3, 4];
const VENDOR_ROW_ACCENTS: FinelyOsPublicAccent[] = ['emerald', 'sky', 'violet', 'amber', 'fuchsia'];
const VENDOR_PAGE_SIZE = 8;

function tierBadge(tier: VendorTier) {
  if (tier === 1) return { label: 'Tier 1', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' };
  if (tier === 2) return { label: 'Tier 2', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700' };
  if (tier === 3) return { label: 'Tier 3', cls: 'border-violet-500/30 bg-violet-500/10 text-violet-700' };
  return { label: 'Tier 4', cls: 'border-sky-500/30 bg-sky-500/10 text-sky-700' };
}

type VendorTab = 'vendors' | 'tier-ladder' | 'readiness';

const DOCTRINE_TIER_ACCENTS: Record<1 | 2 | 3 | 4 | 5, FinelyOsDeckAccent> = {
  1: 'emerald',
  2: 'amber',
  3: 'violet',
  4: 'sky',
  5: 'fuchsia',
};

const DOCTRINE_TIER_ROW_ACCENTS: FinelyOsPublicAccent[] = ['emerald', 'sky', 'violet', 'amber', 'fuchsia'];

const BUREAU_LABELS: Record<BusinessCreditBureauKey, string> = {
  dnb: 'D&B',
  experian_small_business: 'Experian Small Business',
  equifax_business: 'Equifax Business',
};

const BUSINESS_STAGE_OPTIONS: { id: BusinessStage; label: string; hint: string }[] = [
  { id: 'startup_0_6mo', label: 'Startup (0-6mo)', hint: 'Thin file — EIN-only, no-PG options' },
  { id: 'established_6_24mo', label: 'Established (6-24mo)', hint: 'Bank statements + light trade history' },
  { id: 'mature_2yr_plus', label: 'Mature (2yr+)', hint: 'Full financials, institutional scale' },
];

const FUNDING_INSTRUMENT_LABELS: Record<BusinessFundingInstrumentType, string> = {
  sba_7a: 'SBA 7(a) Loan',
  sba_504: 'SBA 504 Fixed-Asset Loan',
  business_line_of_credit: 'Business Line of Credit',
  equipment_financing: 'Equipment Financing',
  invoice_factoring: 'Invoice Factoring',
  merchant_cash_advance: 'Merchant Cash Advance',
  term_loan: 'Term Loan',
  commercial_real_estate: 'Commercial Real Estate Loan',
  business_credit_card_stacking: 'Business Credit Card Stacking',
};

function DoctrineVendorRow({
  vendor,
  accent,
}: {
  vendor: { name: string; reportingBureau: string; approvalCriteria: string };
  accent: FinelyOsPublicAccent;
}) {
  return (
    <div className={`${finelyOsCatalogCardCompact(accent)} !p-3`} data-fc-accent={accent}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{vendor.name}</div>
        <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono shrink-0`}>{vendor.reportingBureau}</span>
      </div>
      <div className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{vendor.approvalCriteria}</div>
    </div>
  );
}

function TierLadderTile({
  strategy,
  active,
  onSelect,
}: {
  strategy: BusinessCreditTierStrategy;
  active: boolean;
  onSelect: () => void;
}) {
  const accent = DOCTRINE_TIER_ACCENTS[strategy.tier];
  return (
    <button type="button" onClick={onSelect} className={finelyOsDeckTile(accent, active)} data-fc-accent={accent}>
      <div className="p-3 space-y-2">
        <span className={finelyOsMicroStat(accent)}>Tier {strategy.tier}</span>
        <div className="text-sm font-semibold text-white leading-snug line-clamp-2">{strategy.tierName}</div>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-white/55">
          <span>{strategy.minimumPaydexOrScore > 0 ? `Score ${strategy.minimumPaydexOrScore}+` : 'No score floor'}</span>
          <span>•</span>
          <span>{strategy.timeToNextTierWeeks > 0 ? `${strategy.timeToNextTierWeeks}w to next` : 'Top tier'}</span>
        </div>
      </div>
    </button>
  );
}

function FundingInstrumentCard({ instrument, accent }: { instrument: BusinessFundingInstrument; accent: FinelyOsPublicAccent }) {
  const isMca = instrument.instrumentType === 'merchant_cash_advance';
  return (
    <div className={`${finelyOsCatalogCardCompact(accent)} space-y-3`} data-fc-accent={accent}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className={FINELY_OS_ENTITY_VALUE}>{FUNDING_INSTRUMENT_LABELS[instrument.instrumentType]}</div>
        <span className={finelyOsMicroStat(accent)}>{instrument.fundingRangeLabel}</span>
      </div>

      {isMca ? (
        <div className={finelyOsAlertBanner('warning')}>
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>High-cost financing — factor-rate pricing can equal a triple-digit effective APR. Read the risks below before using.</span>
          </div>
        </div>
      ) : null}

      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Underwriting factors</div>
        <ul className={`mt-1 space-y-1 text-sm ${FINELY_OS_ENTITY_BODY} list-disc list-inside`}>
          {instrument.typicalUnderwritingFactors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Documentation checklist</div>
        <ul className={`mt-1 space-y-1 text-sm ${FINELY_OS_ENTITY_BODY} list-disc list-inside`}>
          {instrument.documentationNeeded.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Risks &amp; cautions</div>
        <ul className={`mt-1 space-y-1 text-sm ${FINELY_OS_ENTITY_BODY} list-disc list-inside`}>
          {instrument.risksAndCautions.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
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
  vendor,
  opened,
  skipped,
  recommended,
  accent,
  partnerId,
  tenantId,
  onChange,
}: {
  vendor: Vendor;
  opened: boolean;
  skipped: boolean;
  recommended?: boolean;
  accent: FinelyOsPublicAccent;
  partnerId: string;
  tenantId: string;
  onChange: () => void;
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
    <div className={`${finelyOsCatalogCardCompact(accent)} !p-3`} data-fc-accent={accent}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{vendor.name}</div>
            {recommended ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-amber-200">
                <Star size={10} /> Best fit
              </span>
            ) : null}
          </div>
          <div className={`mt-0.5 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
            Tier {vendor.tier} • {vendor.category}
          </div>
          {vendor.notes ? <div className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{vendor.notes}</div> : null}
          {vendor.prerequisites?.length ? (
            <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Prereqs: {vendor.prerequisites.slice(0, 2).join(' • ')}</div>
          ) : null}
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

export default function BusinessVendorsPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<VendorTab>('vendors');
  const [selectedDoctrineTier, setSelectedDoctrineTier] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedStage, setSelectedStage] = useState<BusinessStage>('startup_0_6mo');

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

  const tierStrategies = useMemo(() => getAllTierStrategies(), []);
  const activeStrategy = useMemo(
    () => tierStrategies.find((s) => s.tier === selectedDoctrineTier) ?? tierStrategies[0],
    [tierStrategies, selectedDoctrineTier],
  );
  const allFundingInstruments = useMemo(() => getAllFundingInstruments(), []);
  const stageFundingInstruments = useMemo(() => getFundingInstrumentsByStage(selectedStage), [selectedStage]);
  const totalDoctrineVendors = useMemo(
    () => tierStrategies.reduce((sum, s) => sum + s.vendorList.length, 0),
    [tierStrategies],
  );

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
            { id: 'tier-ladder', label: 'Tier Ladder' },
            { id: 'readiness', label: 'Readiness' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as VendorTab)}
          primaryAction={{ label: 'Business profile', onClick: () => navigate('/business/profile') }}
          secondaryAction={{ label: 'Lender logic', onClick: () => navigate('/business/lender-logic') }}
        >
          {tab === 'readiness' && <BusinessReadinessChecklist title="Sequencing + readiness (track progress)" compact />}

          {tab === 'tier-ladder' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <KpiCard label="Tiers mapped" value={tierStrategies.length} hint="Tier 1 → Tier 5" tone="emerald" />
                <KpiCard label="Vendors indexed" value={totalDoctrineVendors} hint="Named, real vendors" tone="sky" />
                <KpiCard label="Funding instruments" value={allFundingInstruments.length} hint="Across all stages" tone="violet" />
              </div>

              <div className={`${finelyOsCatalogCardCompact('violet')} space-y-3`} data-fc-accent="violet">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-violet-400" />
                  <div className={FINELY_OS_ENTITY_TITLE}>Vendor tier ladder</div>
                </div>
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  The full 5-tier vendor-credit matrix — general market education, not a guarantee. Select a tier to see bureaus, bank
                  rating, NAICS notes, vendors, PG-release strategy, and common mistakes.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {tierStrategies.map((strategy) => (
                    <TierLadderTile
                      key={strategy.tier}
                      strategy={strategy}
                      active={strategy.tier === selectedDoctrineTier}
                      onSelect={() => setSelectedDoctrineTier(strategy.tier)}
                    />
                  ))}
                </div>

                {activeStrategy ? (
                  <div className={`${finelyOsCatalogCardCompact(DOCTRINE_TIER_ACCENTS[activeStrategy.tier] as FinelyOsPublicAccent)} space-y-3`} data-fc-accent={DOCTRINE_TIER_ACCENTS[activeStrategy.tier]}>
                    <div className={FINELY_OS_ENTITY_VALUE}>{activeStrategy.tierName}</div>

                    <div className="flex flex-wrap gap-2">
                      {activeStrategy.targetBureaus.map((b) => (
                        <span key={b} className={FINELY_OS_ENTITY_CHIP}>
                          {BUREAU_LABELS[b]}
                        </span>
                      ))}
                      {activeStrategy.bankRatingRequired ? (
                        <span className={FINELY_OS_ENTITY_CHIP}>Bank rating: {activeStrategy.bankRatingRequired}</span>
                      ) : null}
                    </div>

                    <div>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>NAICS risk-bypass notes</div>
                      <ul className={`mt-1 space-y-1 text-sm ${FINELY_OS_ENTITY_BODY} list-disc list-inside`}>
                        {activeStrategy.naicsRiskBypass.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>
                        Vendor list ({activeStrategy.vendorList.length})
                      </div>
                      <div className="mt-2">
                        <FinelyOsPaginatedStack
                          items={activeStrategy.vendorList}
                          pageSize={5}
                          itemSpacingClassName="space-y-2"
                          emptyMessage="No vendors listed for this tier."
                          renderItem={(v, idx) => (
                            <DoctrineVendorRow
                              key={v.name}
                              vendor={v}
                              accent={DOCTRINE_TIER_ROW_ACCENTS[idx % DOCTRINE_TIER_ROW_ACCENTS.length]}
                            />
                          )}
                        />
                      </div>
                    </div>

                    {activeStrategy.pgReleaseStrategy ? (
                      <div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>PG release strategy</div>
                        <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{activeStrategy.pgReleaseStrategy}</p>
                      </div>
                    ) : null}

                    <div>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Common mistakes</div>
                      <ul className={`mt-1 space-y-1 text-sm ${FINELY_OS_ENTITY_BODY} list-disc list-inside`}>
                        {activeStrategy.commonMistakes.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={`${finelyOsCatalogCardCompact('sky')} space-y-3`} data-fc-accent="sky">
                <div className="flex items-center gap-2">
                  <Landmark size={16} className="text-sky-400" />
                  <div className={FINELY_OS_ENTITY_TITLE}>Funding instrument browser</div>
                </div>
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Pick your business stage to filter the corporate funding-instrument landscape you graduate into once a file is
                  established.
                </p>

                <div className="flex flex-wrap gap-2">
                  {BUSINESS_STAGE_OPTIONS.map((opt) => {
                    const active = opt.id === selectedStage;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedStage(opt.id)}
                        title={opt.hint}
                        className={
                          active
                            ? 'px-3 py-2 rounded-xl border border-amber-400/50 bg-amber-500/15 text-amber-100 text-[10px] font-black uppercase tracking-wide whitespace-normal text-center leading-snug transition-all'
                            : `${FINELY_OS_ENTITY_CHIP} hover:bg-white/10 cursor-pointer transition-all`
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {stageFundingInstruments.map((instrument, idx) => (
                    <FundingInstrumentCard
                      key={instrument.id}
                      instrument={instrument}
                      accent={DOCTRINE_TIER_ROW_ACCENTS[idx % DOCTRINE_TIER_ROW_ACCENTS.length]}
                    />
                  ))}
                  {!stageFundingInstruments.length ? (
                    <div className={FINELY_OS_NOTICE}>No funding instruments mapped to this stage yet.</div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

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
                            <div className="mt-4 space-y-3">
                              <p className={FINELY_OS_ENTITY_SUBLABEL}>
                                {recommended.length > 0
                                  ? `Best-fit vendors for ${BUSINESS_TYPE_OPTIONS.find((o) => o.id === businessType)?.label} appear first.`
                                  : `${items.length} vendor${items.length === 1 ? '' : 's'} in this tier.`}
                              </p>
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
                                      accent={VENDOR_ROW_ACCENTS[idx % VENDOR_ROW_ACCENTS.length]}
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
              )}
            </>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
