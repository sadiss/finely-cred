import React, { useMemo } from 'react';
import { ArrowRight, BadgeCheck, DollarSign, ShieldAlert, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { SellerNav } from '../../components/seller/SellerNav';
import { getOrCreateSellerForSession } from '../../seller/getOrCreateSellerForSession';
import { computeSellerListingEarningsProjection, listPayoutEntriesByOwner } from '../../data/payoutLedgerRepo';
import { summarizePayoutEntries } from '../../domain/payoutLedger';
import { formatUsdFromCents } from '../../domain/partnerEconomics';
import { AU_SELLER } from '../../config/auSellerProgram';
import { RolePromoLinksPanel } from '../../components/promotions/RolePromoLinksPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsKpiTile,
} from '../../features/os/finelyOsLightUi';

export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const seller = useMemo(() => getOrCreateSellerForSession({ user: auth.user }), [auth.user]);
  const projection = useMemo(() => (seller ? computeSellerListingEarningsProjection(seller) : null), [seller]);
  const payoutSummary = useMemo(() => {
    if (!seller) return null;
    return summarizePayoutEntries(listPayoutEntriesByOwner(seller.id, 'seller'));
  }, [seller]);

  return (
    <PageShell
      badge="AU Seller"
      title="Seller Dashboard"
      subtitle="Manage your AU inventory supply: contracts, verification, listings, proof, and payouts."
    >
      <div className={FINELY_OS_PAGE}>
        <SellerNav />

        {!seller ? (
          <div className={FINELY_OS_ENTITY_EMPTY}>No seller profile found. Start onboarding and select the AU Seller lane.</div>
        ) : (
          <div className="space-y-6">
            {seller.contract.acceptedAt ? null : (
              <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3`}>
                <ShieldAlert size={18} className="text-fuchsia-300 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <div className={FINELY_OS_ENTITY_VALUE}>Contract not accepted</div>
                  <div className={FINELY_OS_ENTITY_BODY}>Accept the seller agreement to submit inventory for review and start selling.</div>
                  <button type="button" onClick={() => navigate('/seller/contracts')} className={FINELY_OS_PRIMARY_BTN}>
                    Review & accept <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={finelyOsKpiTile(0)}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Verification</div>
                <div className={`mt-2 capitalize ${FINELY_OS_ENTITY_VALUE}`}>{seller.verification.status.replace(/_/g, ' ')}</div>
                <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Submit listings with proof. Admin review will mark you verified.</div>
              </div>
              <div className={finelyOsKpiTile(1)}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Listings</div>
                <div className={`mt-2 text-3xl font-light text-amber-300 tabular-nums`}>{seller.listings.length}</div>
                <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Draft → submit → approval → live inventory.</div>
              </div>
              <div className={finelyOsKpiTile(2)}>
                <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
                  <DollarSign size={12} /> Earnings potential
                </div>
                <div className="mt-2 text-2xl font-light text-emerald-300 tabular-nums">
                  {projection ? formatUsdFromCents(projection.sellerShareCents) : '—'}
                </div>
                <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                  Your {AU_SELLER.defaultCommissionPct}% share if active slots sell at list price.
                </div>
              </div>
              <div className={finelyOsKpiTile(3)}>
                <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
                  <Wallet size={12} /> Pending payout
                </div>
                <div className="mt-2 text-2xl font-light text-violet-300 tabular-nums">
                  {payoutSummary ? formatUsdFromCents(payoutSummary.pendingCents) : '—'}
                </div>
                <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                  {payoutSummary?.nextScheduled ? `Next: ${payoutSummary.nextScheduled}` : 'Configure payout method to receive funds.'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate('/seller/listings')} className={FINELY_OS_PRIMARY_BTN}>
                <BadgeCheck size={14} /> Manage listings <ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => navigate('/seller/payouts')} className={FINELY_OS_SECONDARY_BTN}>
                Set payouts <ArrowRight size={14} />
              </button>
            </div>

            <RolePromoLinksPanel role="seller" title="AU Seller promo links: guides, ebooks, services" />
          </div>
        )}

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
