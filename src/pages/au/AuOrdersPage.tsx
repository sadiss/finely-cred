import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Clock, FileUp, Plus, ShieldCheck } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listAuBuyerOrdersByPartner } from '../../data/auBuyerOrdersRepo';

function fmtUsd(cents: number) {
  return `$${(Math.max(0, Math.round(cents)) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function prettyStatus(s: string) {
  return String(s || '').replaceAll('_', ' ');
}

export default function AuOrdersPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const orders = useMemo(() => (partner ? listAuBuyerOrdersByPartner(partner.id) : []), [partner?.id, version]);

  if (!partner) {
    return (
      <PageShell badge="AU" title="My AU Orders" subtitle="Unable to load your profile.">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">No partner profile found for this session.</div>
      </PageShell>
    );
  }

  return (
    <PageShell badge="AU" title="My AU Orders" subtitle="Track your intake status, uploaded documents, and processing timeline.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/au/marketplace')} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> AU Marketplace
          </button>
          <button
            type="button"
            onClick={() => navigate('/au/marketplace')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <Plus size={14} /> Start new order
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/30 p-8">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <ShieldCheck size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">No orders yet</span>
            </div>
            <p className="mt-3 text-white/60 text-sm">Select a tradeline from the marketplace to begin your guided AU intake.</p>
            <button
              type="button"
              onClick={() => navigate('/au/marketplace')}
              className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Browse inventory <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {orders.slice(0, 24).map((o) => {
              const docs = o.evidence.length;
              const elig = o.eligibility.checked;
              const terms = Boolean(o.terms.acceptedAt);
              const ready = elig && terms && docs > 0;
              return (
                <div key={o.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">
                        {o.listing.bank} • {o.listing.limit}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                        {fmtUsd(o.listing.priceCents)} • {o.listing.age} • {o.id}
                      </div>
                    </div>
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-200">
                      {prettyStatus(o.status)}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Eligibility</div>
                      <div className="mt-2 text-white/70 text-sm">{elig ? 'Complete' : 'Pending'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Terms</div>
                      <div className="mt-2 text-white/70 text-sm">{terms ? 'Accepted' : 'Pending'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Docs</div>
                      <div className="mt-2 text-white/70 text-sm">{docs} uploaded</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center gap-2 text-white/60">
                      <Clock size={16} className="text-white/40" />
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Latest</div>
                    </div>
                    <div className="mt-2 text-white/70 text-sm">
                      {o.events?.[0]?.title ?? '—'}
                      {o.events?.[0]?.note ? <div className="mt-1 text-white/40 text-xs">{o.events[0].note}</div> : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-white/40 text-xs inline-flex items-center gap-2">
                      {ready ? <BadgeCheck size={14} className="text-emerald-400" /> : <FileUp size={14} className="text-amber-400" />}
                      {ready ? 'Ready to submit (or already submitted).' : 'Continue intake to submit.'}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/au/request?orderId=${encodeURIComponent(o.id)}`)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

