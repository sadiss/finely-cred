import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Trash2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { Button } from '../components/ui';
import { getPricingControls } from '../data/settingsRepo';

type CartItem = {
  id?: string | number;
  bank?: string;
  limit?: string;
  age?: string;
  price?: string;
  date?: string;
  basePriceCents?: number;
  finalPriceCents?: number;
};

function itemLabel(i: CartItem) {
  const bank = i.bank ?? 'Tradeline';
  const limit = i.limit ? ` • ${i.limit}` : '';
  const age = i.age ? ` • ${i.age}` : '';
  return `${bank}${limit}${age}`;
}

export default function CheckoutPage({
  cart,
  setCart,
}: {
  cart: any[];
  setCart: (next: any[]) => void;
}) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const pricing = useMemo(() => getPricingControls(), [version]);

  const fmtUsd = (cents: number) =>
    `$${(Math.round(cents) / 100).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const recompute = (baseCents: number) => {
    const markup = Number.isFinite(pricing.tradelineAuMarkupPct) ? pricing.tradelineAuMarkupPct : 0;
    const discount = Number.isFinite(pricing.tradelineAuDiscountPct) ? pricing.tradelineAuDiscountPct : 0;
    const markedUp = Math.round(baseCents * (1 + markup / 100));
    const discounted = Math.round(markedUp * (1 - discount / 100));
    return Math.max(0, discounted);
  };

  const normalizedCart = useMemo(() => {
    return cart.map((raw) => {
      const item = raw as CartItem;
      const base = typeof item.basePriceCents === 'number' ? item.basePriceCents : null;
      if (!base) return item;
      const final = recompute(base);
      return {
        ...item,
        finalPriceCents: final,
        price: fmtUsd(final),
      } as CartItem;
    });
  }, [cart, pricing.tradelineAuDiscountPct, pricing.tradelineAuMarkupPct]);

  const subtotalCents = useMemo(() => {
    return normalizedCart.reduce((sum, item) => sum + (item.finalPriceCents || 0), 0);
  }, [normalizedCart]);

  const removeAt = (idx: number) => {
    const next = cart.slice();
    next.splice(idx, 1);
    setCart(next);
  };

  const clear = () => setCart([]);

  return (
    <PageShell
      badge="Public"
      title="Checkout"
      subtitle="Review your secured assets. For AU inventory, you can proceed to checkout or request a match if you’re unsure."
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          {cart.length > 0 && (
            <button
              onClick={clear}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
              <Trash2 size={14} />
              Clear cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-white/60">
            Your cart is empty. Browse the AU Marketplace inventory to secure a seat.
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => navigate('/tradelines?focus=au')} size="sm">
                Browse AU inventory <ArrowRight size={16} />
              </Button>
              <Button variant="outline" onClick={() => navigate('/consultation?lane=Authorized%20Users%20(AU)')} size="sm">
                Get matched <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-3">
              {normalizedCart.map((item, idx) => {
                return (
                  <div
                    key={`${item.id ?? idx}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{itemLabel(item)}</div>
                      <div className="mt-1 text-white/50 text-sm">
                        {item.price ? `Price: ${item.price}` : 'Price shown at checkout'} {item.date ? ` • Posts around: ${item.date}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => removeAt(idx)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-6 space-y-3">
                <div className="text-white font-semibold">Next step</div>
                <div className="text-white/70 text-sm leading-relaxed">
                  AU inventory requires an account + quick intake so we can verify identity, confirm fit, and schedule posting.
                  Continue to the AU Request flow to submit your details and documents. After review, you’ll receive secure payment instructions.
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Subtotal</span>
                    <span className="text-white font-semibold">{fmtUsd(subtotalCents)}</span>
                  </div>
                  <div className="text-white/45 text-xs">
                    Pricing controls applied: {pricing.tradelineAuMarkupPct}% markup • {pricing.tradelineAuDiscountPct}% discount
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button onClick={() => navigate(`/onboarding?next=${encodeURIComponent('/au/request')}`)} size="sm">
                    Continue AU request <ArrowRight size={16} />
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/consultation?lane=Authorized%20Users%20(AU)')} size="sm">
                    Not sure? Get matched <ArrowRight size={16} />
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm flex items-start gap-3">
                <ShieldAlert size={18} className="mt-0.5 text-white/50" />
                <div className="text-white/60 leading-relaxed">
                  Inventory availability and posting timelines vary. We do not promise score outcomes. If your goal is
                  lender readiness, book a free enlightenment session and we’ll pick the safest lane.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

