import React, { useMemo, useState } from 'react';
import { ArrowRight, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { SellerNav } from '../../components/seller/SellerNav';
import { getOrCreateSellerForSession } from '../../seller/getOrCreateSellerForSession';
import { upsertAuSeller } from '../../data/auSellerRepo';
import type { AuSellerPayoutMethod } from '../../domain/auSeller';

export default function SellerPayoutsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const seller = useMemo(() => getOrCreateSellerForSession({ user: auth.user }), [auth.user]);

  const [method, setMethod] = useState<AuSellerPayoutMethod>('none');
  const [displayName, setDisplayName] = useState('');
  const [handleOrLast4, setHandleOrLast4] = useState('');
  const [taxLast4, setTaxLast4] = useState('');

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
    navigate('/seller/dashboard');
  };

  if (!seller) {
    return (
      <PageShell badge="AU Seller" title="Payouts" subtitle="Configure payout preferences for seller disbursements.">
        <SellerNav />
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">No seller profile found.</div>
      </PageShell>
    );
  }

  return (
    <PageShell badge="AU Seller" title="Payouts" subtitle="Configure payout preferences for seller disbursements.">
      <SellerNav />
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <DollarSign size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Payout method</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as AuSellerPayoutMethod)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm"
              >
                <option value="none">None</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="cash_app">Cash App</option>
                <option value="zelle">Zelle</option>
              </select>
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={seller.fullName || 'Name'}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm"
              />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider">Handle / account last4</label>
              <input
                value={handleOrLast4}
                onChange={(e) => setHandleOrLast4(e.target.value)}
                placeholder="@cashapp or 1234"
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase tracking-wider">Tax ID last4 (optional)</label>
              <input
                value={taxLast4}
                onChange={(e) => setTaxLast4(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                placeholder="1234"
                inputMode="numeric"
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm font-mono"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[color:var(--brand-primary)] text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            Save payouts <ArrowRight size={14} />
          </button>
          <div className="text-white/40 text-xs">
            Payout details are stored with your seller profile. For larger volumes, use a dedicated payouts processor + compliance workflow.
          </div>
        </div>
      </div>
    </PageShell>
  );
}

