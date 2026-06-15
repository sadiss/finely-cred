import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, Check, DollarSign, Smartphone, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { SellerNav } from '../../components/seller/SellerNav';
import { getOrCreateSellerForSession } from '../../seller/getOrCreateSellerForSession';
import { upsertAuSeller } from '../../data/auSellerRepo';
import type { AuSellerPayoutMethod } from '../../domain/auSeller';
import { PayoutCenterPanel } from '../../components/payouts/PayoutCenterPanel';
import { computeSellerListingEarningsProjection } from '../../data/payoutLedgerRepo';
import { formatUsdFromCents } from '../../domain/partnerEconomics';
import { AU_SELLER } from '../../config/auSellerProgram';
import { CalculatorField } from '../../components/calculators/CalculatorShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
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
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

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

export default function SellerPayoutsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const seller = useMemo(() => getOrCreateSellerForSession({ user: auth.user }), [auth.user]);

  const [method, setMethod] = useState<AuSellerPayoutMethod>('none');
  const [displayName, setDisplayName] = useState('');
  const [handleOrLast4, setHandleOrLast4] = useState('');
  const [taxLast4, setTaxLast4] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!seller) return;
    setMethod(seller.payouts.method ?? 'none');
    setDisplayName(seller.payouts.displayName ?? '');
    setHandleOrLast4(seller.payouts.handleOrAccountLast4 ?? '');
    setTaxLast4(seller.payouts.taxIdLast4 ?? '');
  }, [seller?.id]);

  const projection = useMemo(() => (seller ? computeSellerListingEarningsProjection(seller) : null), [seller]);

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

  if (!seller) {
    return (
      <PageShell badge="AU Seller" title="Payouts" subtitle="Configure payout preferences for seller disbursements.">
        <div className={FINELY_OS_PAGE}>
          <SellerNav />
          <div className={FINELY_OS_ENTITY_EMPTY}>No seller profile found.</div>
          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell badge="AU Seller" title="Payouts & earnings" subtitle="Configure how you get paid, preview listing revenue, and track disbursement history.">
      <div className={`${FINELY_OS_PAGE} max-w-5xl`}>
        <SellerNav />
        <PayoutCenterPanel
          role="seller"
          ownerId={seller.id}
          ownerEmail={seller.email}
          seller={seller}
        />

        {projection ? (
          <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-5`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Earnings calculator</div>
            <h3 className={`text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>If all active slots sell at list price</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                <p className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} uppercase`}>Gross</p>
                <p className={`text-2xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{formatUsdFromCents(projection.grossCents)}</p>
              </div>
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony border-emerald-500/25 bg-emerald-500/10`}>
                <p className="text-xs text-emerald-300 uppercase">You ({AU_SELLER.defaultCommissionPct}%)</p>
                <p className="text-2xl font-bold text-emerald-200">{formatUsdFromCents(projection.sellerShareCents)}</p>
              </div>
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                <p className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} uppercase`}>Listings / slots</p>
                <p className={`text-2xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{projection.listingCount} / {projection.slotCount}</p>
              </div>
            </div>
          </div>
        ) : null}

        <section className={`space-y-6 ${finelyOsCatalogCard('violet')} !p-5`}>
          <div>
            <div className="inline-flex items-center gap-2 text-fuchsia-300 border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Wallet size={14} /> Payout method
            </div>
            <h3 className={`mt-2 text-xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Where should we send your money?</h3>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>Choose a disbursement method. Payouts run weekly for verified sellers with approved listings.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {PAYOUT_METHODS.map((m) => {
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`text-left p-5 transition-all ${finelyOsListItem(active, 'fuchsia')}`}
                >
                  <div className="flex items-center justify-between">
                    <m.icon size={22} className={active ? 'text-fuchsia-300' : 'text-white/40'} />
                    {active ? <Check size={18} className="text-fuchsia-300" /> : null}
                  </div>
                  <p className={`mt-3 font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{m.label}</p>
                  <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{m.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <CalculatorField label="Legal / display name">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={seller.fullName || 'Name on account'} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} />
            </CalculatorField>
            <CalculatorField label="Handle or account last 4" hint="e.g. @cashapp or ···1234">
              <input value={handleOrLast4} onChange={(e) => setHandleOrLast4(e.target.value)} placeholder="@handle or 1234" className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} font-mono`} />
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
            {saved ? <span className="text-sm text-emerald-300 font-medium">Saved successfully.</span> : null}
            <button type="button" onClick={() => navigate('/seller/dashboard')} className={FINELY_OS_SECONDARY_BTN}>
              Back to dashboard
            </button>
          </div>
        </section>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
