import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Wallet,
} from 'lucide-react';
import type { PayoutRole } from '../../domain/payoutLedger';
import { summarizePayoutEntries } from '../../domain/payoutLedger';
import type { AuSeller, AuSellerPayoutMethod } from '../../domain/auSeller';
import {
  computeSellerListingEarningsProjection,
  ensureSellerPayoutSeed,
  ensureAffiliatePayoutSeed,
  ensureAgentPayoutSeed,
  listPayoutEntriesByOwner,
} from '../../data/payoutLedgerRepo';
import { formatUsdFromCents, formatUsdFromCentsPrecise } from '../../domain/partnerEconomics';
import { AU_SELLER } from '../../config/auSellerProgram';
import { CalculatorBarChart } from '../calculators/CalculatorBarChart';
import {
  FINELY_OS_CALC_INNER,
  FINELY_OS_CALC_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_INFO,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCalcMetricTile,
  finelyOsPayoutStatusChip,
} from '../../features/os/finelyOsLightUi';

const METHOD_LABELS: Record<AuSellerPayoutMethod, string> = {
  none: 'Not configured',
  bank_transfer: 'Bank transfer (ACH)',
  cash_app: 'Cash App',
  zelle: 'Zelle',
};

type Props = {
  role: PayoutRole;
  ownerId: string;
  ownerEmail?: string;
  seller?: AuSeller | null;
  onConfigurePayouts?: () => void;
};

export function PayoutCenterPanel({ role, ownerId, ownerEmail, seller, onConfigurePayouts }: Props) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore);
    return () => window.removeEventListener('finely:store', onStore);
  }, []);

  useEffect(() => {
    if (seller && role === 'seller') ensureSellerPayoutSeed(seller);
    if (role === 'affiliate') ensureAffiliatePayoutSeed(ownerId, ownerEmail);
    if (role === 'agent') ensureAgentPayoutSeed(ownerId, ownerEmail);
  }, [seller?.id, role, ownerId, ownerEmail]);

  const entries = useMemo(() => listPayoutEntriesByOwner(ownerId, role), [ownerId, role, version]);
  const summary = useMemo(() => summarizePayoutEntries(entries), [entries]);

  const sellerProjection = useMemo(
    () => (seller ? computeSellerListingEarningsProjection(seller) : null),
    [seller],
  );

  const chartBars = useMemo(() => {
    const pending = entries.filter((e) => e.status === 'pending').reduce((a, e) => a + e.amountCents, 0);
    const processing = entries.filter((e) => e.status === 'processing').reduce((a, e) => a + e.amountCents, 0);
    const paid = entries.filter((e) => e.status === 'paid').reduce((a, e) => a + e.amountCents, 0);
    return [
      { label: 'Pending', value: pending, color: 'linear-gradient(180deg, #fbbf24, #d97706)' },
      { label: 'Processing', value: processing, color: 'linear-gradient(180deg, #38bdf8, #0284c7)' },
      { label: 'Paid', value: paid, color: 'linear-gradient(180deg, #34d399, #059669)' },
    ];
  }, [entries]);

  const metricTiles = [
    { label: 'Pending', value: summary.pendingCents, icon: Clock, accent: 'fuchsia' as const },
    { label: 'Processing', value: summary.processingCents, icon: Loader2, accent: 'sky' as const },
    { label: 'Paid (all time)', value: summary.paidCents, icon: CheckCircle2, accent: 'emerald' as const },
    { label: 'Paid (30 days)', value: summary.paidLast30Cents, icon: Banknote, accent: 'violet' as const },
  ];

  return (
    <div className={`${FINELY_OS_CALC_SHELL} overflow-hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-violet-200 bg-violet-500/15 border border-violet-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Wallet size={14} /> Payout center
          </div>
          <h3 className={`mt-2 text-xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Earnings & disbursements</h3>
          <p className={`mt-1 text-sm max-w-xl ${FINELY_OS_ENTITY_BODY}`}>
            Track pending, processing, and paid payouts.{' '}
            {role === 'seller'
              ? `Seller share: ${AU_SELLER.defaultCommissionPct}% of AU placement gross.`
              : 'Commissions accrue when referrals convert.'}
          </p>
        </div>
        {onConfigurePayouts ? (
          <button type="button" onClick={onConfigurePayouts} className={FINELY_OS_PRIMARY_BTN}>
            Configure method <ArrowRight size={14} />
          </button>
        ) : null}
      </div>

      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricTiles.map((m) => (
            <div key={m.label} className={finelyOsCalcMetricTile(true, m.accent)}>
              <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <m.icon size={14} /> {m.label}
              </div>
              <div className={`text-2xl font-bold mt-2 tabular-nums ${FINELY_OS_ENTITY_VALUE}`}>
                {formatUsdFromCents(m.value)}
              </div>
            </div>
          ))}
        </div>

        {summary.nextScheduled ? (
          <div className={`${FINELY_OS_NOTICE_INFO} flex items-center gap-2`}>
            <Calendar size={16} className="text-sky-300 shrink-0" />
            Next scheduled payout: <strong className="text-white">{summary.nextScheduled}</strong>
          </div>
        ) : null}

        {sellerProjection && sellerProjection.listingCount > 0 ? (
          <div className={`${finelyOsCalcMetricTile(true, 'emerald')} space-y-4`}>
            <div className={`flex items-center gap-2 font-semibold text-sm ${FINELY_OS_ENTITY_VALUE}`}>
              <DollarSign size={16} className="text-emerald-300" /> Listing earnings potential
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300/80`}>Gross inventory</span>
                <p className={`font-bold ${FINELY_OS_ENTITY_VALUE}`}>{formatUsdFromCents(sellerProjection.grossCents)}</p>
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  {sellerProjection.slotCount} slot(s) · {sellerProjection.listingCount} listing(s)
                </p>
              </div>
              <div>
                <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300/80`}>
                  Your share ({AU_SELLER.defaultCommissionPct}%)
                </span>
                <p className={`font-bold ${FINELY_OS_ENTITY_VALUE}`}>{formatUsdFromCents(sellerProjection.sellerShareCents)}</p>
              </div>
              <div>
                <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300/80`}>Platform</span>
                <p className={`font-bold ${FINELY_OS_ENTITY_VALUE}`}>{formatUsdFromCents(sellerProjection.platformShareCents)}</p>
              </div>
            </div>
          </div>
        ) : null}

        {entries.length > 0 ? (
          <div className={`${FINELY_OS_CALC_INNER}`}>
            <div className={`text-sm font-semibold mb-4 ${FINELY_OS_ENTITY_VALUE}`}>Balance breakdown</div>
            <CalculatorBarChart bars={chartBars} formatValue={(n) => formatUsdFromCents(n)} height={120} />
          </div>
        ) : null}

        <div className="space-y-2">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Payout history</div>
          {entries.length === 0 ? (
            <div className={FINELY_OS_LUXURY_EMPTY}>
              No payout entries yet.{' '}
              {role === 'seller'
                ? 'Approve listings and fulfill AU placements to accrue earnings.'
                : 'Referrals that convert will appear here.'}
            </div>
          ) : (
            <div className="divide-y divide-white/10 rounded-xl border border-white/[0.08] overflow-hidden">
              {entries.slice(0, 12).map((e) => (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white/[0.05] hover:bg-white/[0.03] transition-colors"
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${FINELY_OS_ENTITY_VALUE}`}>{e.source}</p>
                    <p className={`text-xs mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>
                      {new Date(e.createdAt).toLocaleDateString()}
                      {e.scheduledFor ? ` · scheduled ${e.scheduledFor}` : ''}
                      {e.paidAt ? ` · paid ${new Date(e.paidAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={finelyOsPayoutStatusChip(e.status)}>{e.status}</span>
                    <span className={`text-sm font-bold tabular-nums ${FINELY_OS_ENTITY_VALUE}`}>
                      {formatUsdFromCentsPrecise(e.amountCents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {seller?.payouts.method && seller.payouts.method !== 'none' ? (
          <div className={`${FINELY_OS_CALC_INNER} text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Payout method:{' '}
            <strong className={FINELY_OS_ENTITY_VALUE}>{METHOD_LABELS[seller.payouts.method]}</strong>
            {seller.payouts.handleOrAccountLast4 ? ` · ${seller.payouts.handleOrAccountLast4}` : ''}
          </div>
        ) : seller && role === 'seller' && onConfigurePayouts ? (
          <button type="button" onClick={onConfigurePayouts} className={FINELY_OS_SECONDARY_BTN}>
            Set up payout method
          </button>
        ) : null}
      </div>
    </div>
  );
}
