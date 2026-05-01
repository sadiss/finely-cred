import React, { useMemo, useState } from 'react';
import { ArrowRight, FileText, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { SellerNav } from '../../components/seller/SellerNav';
import { getOrCreateSellerForSession } from '../../seller/getOrCreateSellerForSession';
import { upsertAuSeller } from '../../data/auSellerRepo';
import { nowIso } from '../../domain/auSeller';

export default function SellerContractsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const seller = useMemo(() => getOrCreateSellerForSession({ user: auth.user }), [auth.user]);
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState(false);

  const accept = () => {
    if (!seller) return;
    if (!accepted) return;
    const sig = (name || seller.fullName || '').trim();
    if (!sig) return;
    upsertAuSeller({
      ...seller,
      contract: {
        acceptedAt: nowIso(),
        acceptedName: sig,
        version: 'v1',
      },
      status: seller.status === 'pending' ? 'active' : seller.status,
    });
    window.dispatchEvent(new Event('finely:store'));
    navigate('/seller/dashboard');
  };

  return (
    <PageShell badge="AU Seller" title="Seller Contracts" subtitle="Review and accept the seller agreement to submit inventory for approval.">
      <SellerNav />

      {!seller ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">No seller profile found.</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <FileText size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Seller agreement (summary)</span>
            </div>
            <ul className="list-disc pl-5 text-white/70 text-sm space-y-2">
              <li>Listings must be accurate and supported with proof artifacts.</li>
              <li>Posting windows and refund policy depend on verification and compliance.</li>
              <li>No misleading claims; documentation is required for age/limit and ownership.</li>
            </ul>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-white/70 text-sm">
              Signature acceptance is recorded here. A downloadable PDF + full e‑sign workflow can be enabled as part of the seller compliance rollout.
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
              <div>
                <div className="text-white font-semibold">I accept the seller agreement</div>
                <div className="text-white/60 text-sm">You can’t submit listings for approval without acceptance.</div>
              </div>
            </div>
            <div className="max-w-xl">
              <label className="text-white/60 text-xs uppercase tracking-wider">Signature name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={seller.fullName || 'Full name'}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[rgba(var(--brand-primary-rgb),0.55)]"
              />
            </div>
            <button
              type="button"
              onClick={accept}
              disabled={!accepted || !(name || seller.fullName)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[color:var(--brand-primary)] text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
            >
              <ShieldCheck size={14} /> Accept & continue <ArrowRight size={14} />
            </button>
          </div>

          {seller.contract.acceptedAt ? (
            <div className="text-white/50 text-sm">
              Accepted {new Date(seller.contract.acceptedAt).toLocaleString()} as{' '}
              <span className="text-white/70 font-mono">{seller.contract.acceptedName}</span>.
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}

