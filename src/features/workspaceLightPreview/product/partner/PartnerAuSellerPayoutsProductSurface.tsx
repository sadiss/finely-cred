import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  CircleHelp,
  DollarSign,
  PlayCircle,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { AU_SELLER } from '../../../../config/auSellerProgram';
import { getOrCreateSellerForSession } from '../../../../seller/getOrCreateSellerForSession';
import { upsertAuSeller } from '../../../../data/auSellerRepo';
import type { AuSeller, AuSellerPayoutMethod } from '../../../../domain/auSeller';
import {
  computeSellerListingEarningsProjection,
  ensureSellerPayoutSeed,
  listPayoutEntriesByOwner,
} from '../../../../data/payoutLedgerRepo';
import { formatUsdFromCents, formatUsdFromCentsPrecise } from '../../../../domain/partnerEconomics';
import { summarizePayoutEntries } from '../../../../domain/payoutLedger';
import { CalculatorField } from '../../../../components/calculators/CalculatorShell';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { useMappedPartnerNavigate, usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { SellerWorkstationNav } from './PartnerAuSellerProductSurface';
import './partnerWorkstationSurfaceTabs.css';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_ENTITY_INPUT,
  finelyOsPayoutStatusChip,
} from '../../../os/finelyOsLightUi';

const METRICS_VARIANT = 'inline' as const;

const PAYOUT_METHODS: {
  id: AuSellerPayoutMethod;
  label: string;
  desc: string;
  icon: typeof Wallet;
}[] = [
  { id: 'bank_transfer', label: 'Bank transfer', desc: 'ACH to your business checking — best for volume', icon: Building2 },
  { id: 'zelle', label: 'Zelle', desc: 'Fast disbursement to email or phone', icon: Smartphone },
  { id: 'cash_app', label: 'Cash App', desc: '$Cashtag or linked debit', icon: DollarSign },
];

function fmtWhen(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function PartnerAuSellerPayoutsProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const mappedNavigate = useMappedPartnerNavigate();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Wallet;
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;
  const demoSpec = getWorkspaceProductPageSpec('partner', pageId);

  const [version, setVersion] = useState(0);
  const seller = useMemo(() => {
    if (isDemo) return null;
    return getOrCreateSellerForSession({ user: auth.user }) as AuSeller | null;
  }, [auth.user, isDemo, version]);

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [method, setMethod] = useState<AuSellerPayoutMethod>('none');
  const [displayName, setDisplayName] = useState('');
  const [handleOrLast4, setHandleOrLast4] = useState('');
  const [taxLast4, setTaxLast4] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (!seller) return;
    ensureSellerPayoutSeed(seller);
    setMethod(seller.payouts.method ?? 'none');
    setDisplayName(seller.payouts.displayName ?? '');
    setHandleOrLast4(seller.payouts.handleOrAccountLast4 ?? '');
    setTaxLast4(seller.payouts.taxIdLast4 ?? '');
  }, [seller?.id]);

  const entries = useMemo(
    () => (seller ? listPayoutEntriesByOwner(seller.id, 'seller') : []),
    [seller?.id, version],
  );
  const summary = useMemo(() => summarizePayoutEntries(entries), [entries]);
  const projection = useMemo(() => (seller ? computeSellerListingEarningsProjection(seller) : null), [seller]);

  const selectedEntry = useMemo(() => {
    if (!entries.length) return null;
    if (selectedEntryId) return entries.find((e) => e.id === selectedEntryId) ?? entries[0];
    return entries[0];
  }, [entries, selectedEntryId]);

  const metrics: ProductMetric[] = [
    {
      label: 'Pending',
      value: formatUsdFromCents(summary.pendingCents),
      hint: 'Awaiting disbursement',
      accent: 'rose',
      icon: Wallet,
    },
    {
      label: 'Processing',
      value: formatUsdFromCents(summary.processingCents),
      hint: 'In flight',
      accent: 'sky',
      icon: DollarSign,
    },
    {
      label: 'Paid (30d)',
      value: formatUsdFromCents(summary.paidLast30Cents),
      hint: 'Last 30 days',
      accent: 'emerald',
      icon: Check,
    },
    {
      label: 'Entries',
      value: summary.entryCount,
      hint: 'Ledger rows',
      accent: 'violet',
      icon: Building2,
    },
  ];

  const save = () => {
    if (!seller) return;
    upsertAuSeller({
      ...seller,
      payouts: {
        method,
        displayName: displayName.trim() || undefined,
        handleOrAccountLast4: handleOrLast4.trim() || undefined,
        taxIdLast4: taxLast4.trim() || undefined,
      },
    });
    window.dispatchEvent(new Event('finely:store'));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const dashboardPath = mapPortalHref(AU_SELLER.dashboardPath);
  const askFinelyPrompt = 'How do AU seller payouts work and when do I get paid?';

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow={demoSpec?.eyebrow ?? 'Seller payouts'}
        title={demoSpec?.title ?? 'Track disbursements and set your payout method.'}
        description={demoSpec?.description ?? 'Timeline rail on the left, payout method studio in the center, entry inspector on the right.'}
        status={demoSpec?.status ?? 'Demo ledger'}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant={METRICS_VARIANT}
        metrics={metrics}
        metricTitle="Payout ledger"
        metricDescription="Sign in as a seller to view payout history and configure disbursement."
        primaryAction={
          <ProductPagePrimaryAction
            label="Ask Finely"
            onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: 'Seller payouts' })}
          />
        }
      >
        <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="control-room">
          <SellerWorkstationNav active="payouts" mapHref={mapPortalHref} onNavigate={mappedNavigate} />
          <ProductEmptyState
            title="Seller payouts"
            description="Sign in with a seller profile to view payout history and configure disbursement."
          />
        </section>
      </ProductHubScaffold>
    );
  }

  if (!seller) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Seller payouts"
        title="Configure payout preferences for seller disbursements."
        description="Sign in with a seller profile to view payout history and configure disbursement."
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Seller hub" onClick={() => mappedNavigate(mapPortalHref(AU_SELLER.hubPath))} />}
      >
        <div className={FINELY_OS_PAGE}>
          <SellerWorkstationNav active="payouts" mapHref={mapPortalHref} onNavigate={mappedNavigate} />
          <div className={FINELY_OS_ENTITY_EMPTY}>No seller profile found.</div>
        </div>
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow={demoSpec?.eyebrow ?? 'Seller payouts'}
      title={demoSpec?.title ?? 'Track disbursements and set your payout method.'}
      description={
        demoSpec?.description ??
        'Timeline rail on the left, payout method studio in the center, entry inspector on the right.'
      }
      status={`${entries.length} payout row${entries.length === 1 ? '' : 's'} · live data`}
      freshness="just now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant={METRICS_VARIANT}
      metrics={metrics}
      metricTitle="Disbursement status"
      metricDescription="Pending, processing, and paid totals update as placements fulfill."
      primaryAction={
        <button type="button" className="fc-wlp-btn-primary" onClick={save}>
          Save payout settings <ArrowRight size={14} />
        </button>
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => mappedNavigate(dashboardPath)}>
          Dashboard
        </button>
      }
    >
      <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="control-room">
        <SellerWorkstationNav active="payouts" mapHref={mapPortalHref} onNavigate={mappedNavigate} />

        {projection ? (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony p-6 lg:p-8`} data-fc-accent="emerald">
              <p className={`text-xs font-black uppercase ${FINELY_OS_ENTITY_SUBLABEL}`}>Gross inventory</p>
              <p className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{formatUsdFromCents(projection.grossCents)}</p>
            </div>
            <div className={`${finelyOsCatalogCard('violet')} fc-surface-harmony p-6 lg:p-8`} data-fc-accent="violet">
              <p className={`text-xs font-black uppercase ${FINELY_OS_ENTITY_SUBLABEL}`}>
                Your share ({AU_SELLER.defaultCommissionPct}%)
              </p>
              <p className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                {formatUsdFromCents(projection.sellerShareCents)}
              </p>
            </div>
            <div className={`${finelyOsCatalogCard('sky')} fc-surface-harmony p-6 lg:p-8`} data-fc-accent="sky">
              <p className={`text-xs font-black uppercase ${FINELY_OS_ENTITY_SUBLABEL}`}>Listings / slots</p>
              <p className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                {projection.listingCount} / {projection.slotCount}
              </p>
            </div>
          </div>
        ) : null}

        <div className="fc-wlp-seller-payout-control">
          <div className="fc-wlp-seller-payout-rail" data-fc-accent="rose">
            <div className="fc-wlp-seller-payout-rail-head">Disbursement timeline</div>
            {entries.length === 0 ? (
              <div className={`p-8 text-center ${FINELY_OS_ENTITY_BODY}`}>
                No payout entries yet. Approve listings and fulfill placements to accrue earnings.
              </div>
            ) : (
              entries.map((entry, index) => {
                const rowAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[index % 4];
                const active = selectedEntry?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedEntryId(entry.id)}
                    className="fc-wlp-seller-payout-timeline-row"
                    data-active={active ? 'true' : undefined}
                    data-fcm-accent={rowAccent}
                  >
                    <span className="fc-wlp-seller-payout-timeline-dot" />
                    <div className="min-w-0">
                      <div className={`font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>{entry.source}</div>
                      <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                        {new Date(entry.createdAt).toLocaleDateString()} · {formatUsdFromCentsPrecise(entry.amountCents)}
                      </div>
                      <span className={finelyOsPayoutStatusChip(entry.status)}>{entry.status}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className={`fc-wlp-seller-payout-stage ${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-5`} data-fc-accent="sky">
            <div>
              <div className="inline-flex items-center gap-2 text-sky-600 border border-sky-500/25 bg-sky-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Wallet size={14} /> Payout method
              </div>
              <h3 className={`mt-3 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Where should we send your money?</h3>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Payouts run weekly for verified sellers with approved listings.
              </p>
            </div>

            <div className="grid gap-3">
              {PAYOUT_METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      active
                        ? 'border-sky-400/50 bg-sky-500/15 ring-2 ring-sky-400/20'
                        : 'border-slate-200/80 bg-white/80 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <m.icon size={22} className={active ? 'text-sky-600' : 'text-slate-400'} />
                      {active ? <Check size={18} className="text-sky-600" /> : null}
                    </div>
                    <p className={`mt-2 font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{m.label}</p>
                    <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{m.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <CalculatorField label="Legal / display name">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={seller.fullName || 'Name on account'}
                  className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
                />
              </CalculatorField>
              <CalculatorField label="Handle or account last 4" hint="e.g. @cashapp or ···1234">
                <input
                  value={handleOrLast4}
                  onChange={(e) => setHandleOrLast4(e.target.value)}
                  placeholder="@handle or 1234"
                  className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} font-mono`}
                />
              </CalculatorField>
              <CalculatorField label="Tax ID last 4 (optional)">
                <input
                  value={taxLast4}
                  onChange={(e) => setTaxLast4(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                  placeholder="1234"
                  inputMode="numeric"
                  className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} font-mono`}
                />
              </CalculatorField>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={save} className={FINELY_OS_PRIMARY_BTN}>
                Save payout settings <ArrowRight size={14} />
              </button>
              {saved ? <span className="text-sm text-emerald-600 font-extrabold">Saved successfully.</span> : null}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <div className={`p-6 lg:p-8 space-y-4 ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
              <div className="inline-flex items-center gap-2">
                <Wallet size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Entry inspector</span>
              </div>
              {selectedEntry ? (
                <>
                  <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedEntry.source}</h2>
                  <div className="space-y-2 text-sm font-bold">
                    <div className="flex justify-between gap-3">
                      <span className={FINELY_OS_ENTITY_BODY}>Amount</span>
                      <span className={FINELY_OS_ENTITY_VALUE}>{formatUsdFromCentsPrecise(selectedEntry.amountCents)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={FINELY_OS_ENTITY_BODY}>Status</span>
                      <span className={finelyOsPayoutStatusChip(selectedEntry.status)}>{selectedEntry.status}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={FINELY_OS_ENTITY_BODY}>Created</span>
                      <span className={FINELY_OS_ENTITY_VALUE}>{fmtWhen(selectedEntry.createdAt)}</span>
                    </div>
                    {selectedEntry.scheduledFor ? (
                      <div className="flex justify-between gap-3">
                        <span className={FINELY_OS_ENTITY_BODY}>Scheduled</span>
                        <span className={FINELY_OS_ENTITY_VALUE}>{selectedEntry.scheduledFor}</span>
                      </div>
                    ) : null}
                    {selectedEntry.paidAt ? (
                      <div className="flex justify-between gap-3">
                        <span className={FINELY_OS_ENTITY_BODY}>Paid</span>
                        <span className={FINELY_OS_ENTITY_VALUE}>{fmtWhen(selectedEntry.paidAt)}</span>
                      </div>
                    ) : null}
                    {selectedEntry.referenceId ? (
                      <div className="flex justify-between gap-3">
                        <span className={FINELY_OS_ENTITY_BODY}>Reference</span>
                        <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{selectedEntry.referenceId}</span>
                      </div>
                    ) : null}
                    {selectedEntry.notes ? <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>{selectedEntry.notes}</p> : null}
                  </div>
                </>
              ) : (
                <p className={FINELY_OS_ENTITY_BODY}>Select a timeline entry to inspect full disbursement detail.</p>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-6 space-y-3`} data-fc-accent="emerald">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Totals</div>
              <div className="flex justify-between gap-3">
                <span className={FINELY_OS_ENTITY_BODY}>Pending</span>
                <span className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{formatUsdFromCents(summary.pendingCents)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className={FINELY_OS_ENTITY_BODY}>Paid total</span>
                <span className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{formatUsdFromCents(summary.paidCents)}</span>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="fc-wlp-btn-secondary"
            onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: 'Seller payouts' })}
          >
            <CircleHelp size={14} /> Ask Finely
          </button>
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/resources#presenter-demo')}>
            <PlayCircle size={14} /> Watch how
          </button>
        </div>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
