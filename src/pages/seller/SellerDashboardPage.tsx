import React, { useMemo } from 'react';
import { ArrowRight, BadgeCheck, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { SellerNav } from '../../components/seller/SellerNav';
import { getOrCreateSellerForSession } from '../../seller/getOrCreateSellerForSession';

export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const seller = useMemo(() => getOrCreateSellerForSession({ user: auth.user }), [auth.user]);

  return (
    <PageShell
      badge="AU Seller"
      title="Seller Dashboard"
      subtitle="Manage your AU inventory supply: contracts, verification, listings, proof, and payouts."
    >
      <SellerNav />

      {!seller ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">
          No seller profile found. Start onboarding and select the AU Seller lane.
        </div>
      ) : (
        <div className="space-y-6">
          {seller.contract.acceptedAt ? null : (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-6 text-white/75">
              <div className="flex items-start gap-3">
                <ShieldAlert size={18} className="text-amber-300 mt-0.5" />
                <div className="space-y-2">
                  <div className="text-white font-semibold">Contract not accepted</div>
                  <div className="text-white/65 text-sm">
                    Accept the seller agreement to submit inventory for review and start selling.
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/seller/contracts')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[color:var(--brand-primary)] text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                  >
                    Review & accept <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Verification</div>
              <div className="mt-2 text-white font-semibold capitalize">{seller.verification.status.replace(/_/g, ' ')}</div>
              <div className="mt-2 text-white/60 text-sm">
                Submit listings with proof. Admin review will mark you verified.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Listings</div>
              <div className="mt-2 text-3xl font-light text-white">{seller.listings.length}</div>
              <div className="mt-2 text-white/60 text-sm">Draft → submit → approval → live inventory.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Payout method</div>
              <div className="mt-2 text-white font-semibold">{seller.payouts.method}</div>
              <div className="mt-2 text-white/60 text-sm">Set your payout preferences before going live.</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/seller/listings')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[color:var(--brand-primary)] text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              <BadgeCheck size={14} /> Manage listings <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/seller/payouts')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
            >
              Set payouts <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

