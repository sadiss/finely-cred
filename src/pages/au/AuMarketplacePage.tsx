import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { TradelineMarketplace } from '../../components/landing';

export default function AuMarketplacePage() {
  const navigate = useNavigate();
  return (
    <PageShell
      badge="AU"
      title="AU Marketplace"
      subtitle="Browse authorized user tradelines, then run the guided buyer intake (eligibility, terms, documents, timeline)."
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-400">
                <ShieldCheck size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Buyer flow</span>
              </div>
              <p className="mt-2 text-white/60 text-sm max-w-3xl">
                After you select a tradeline, we’ll walk you through a structured checklist and document upload so operations can process the order.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/au/orders')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.09] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                <ShoppingBag size={14} /> My orders <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <TradelineMarketplace
          onAddToCart={(line: any) => {
            const p = new URLSearchParams();
            p.set('bank', String(line.bank ?? ''));
            p.set('limit', String(line.limit ?? ''));
            p.set('age', String(line.age ?? ''));
            p.set('priceCents', String(Number(line.finalPriceCents ?? 0)));
            if (line.sellerId) p.set('sellerId', String(line.sellerId));
            if (line.listingId) p.set('listingId', String(line.listingId));
            p.set('source', String(line.source ?? 'demo'));
            navigate(`/au/request?${p.toString()}`);
          }}
        />
      </div>
    </PageShell>
  );
}

