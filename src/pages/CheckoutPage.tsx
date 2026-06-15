import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Trash2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { getPricingControls } from '../data/settingsRepo';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,

  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsInlineListItem,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';

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
  usePublicSeoMeta({
    title: 'Checkout — tradeline cart',
    description: 'Review your tradeline selections and complete checkout securely with Finely Cred.',
    path: '/checkout',
  });
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
      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="AU checkout"
          title="Review your cart"
          subtitle="Verify tradeline selections before AU request intake."
          accent="emerald"
          kpis={[
            { label: 'Items', value: String(normalizedCart.length), accent: 'amber' },
            { label: 'Subtotal', value: fmtUsd(subtotalCents), accent: 'emerald' },
          ]}
          tabs={[{ id: 'cart', label: 'Cart' }]}
          activeTab="cart"
          primaryAction={{ label: 'Continue AU request', onClick: () => navigate(`/onboarding?next=${encodeURIComponent('/au/request')}`) }}
          secondaryAction={cart.length > 0 ? { label: 'Clear cart', onClick: clear } : { label: 'Browse inventory', onClick: () => navigate('/tradelines?focus=au') }}
        >
        {cart.length === 0 ? (
          <div className={`${FINELY_OS_LUXURY_EMPTY} space-y-4`}>
            <p>Your cart is empty. Browse the AU Marketplace inventory to secure a seat.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button type="button" onClick={() => navigate('/tradelines?focus=au')} className={FINELY_OS_PRIMARY_BTN}>
                Browse AU inventory <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => navigate('/consultation?lane=Authorized%20Users%20(AU)')} className={FINELY_OS_SECONDARY_BTN}>
                Get matched <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 min-w-0">
              <FinelyOsPaginatedStack
                items={normalizedCart}
                pageSize={6}
                itemSpacingClassName="space-y-3"
                renderItem={(item, idx) => (
                  <div key={`${item.id ?? idx}`} className={`flex flex-wrap items-center justify-between gap-4 ${finelyOsCatalogCard((['emerald', 'sky', 'amber', 'violet'] as const)[idx % 4])} !p-4`} data-fc-accent={(['emerald', 'sky', 'amber', 'violet'] as const)[idx % 4]}>
                    <div className="min-w-0">
                      <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{itemLabel(item)}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                        {item.price ? `Price: ${item.price}` : 'Price shown at checkout'}
                        {item.date ? ` • Posts around: ${item.date}` : ''}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeAt(idx)} className={FINELY_OS_DANGER_BTN}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                )}
              />
            </div>

            <div className="lg:col-span-4 min-w-0 space-y-4">
              <div className={`space-y-3 ${FINELY_OS_NOTICE_WARN}`}>
                <div className={FINELY_OS_ENTITY_VALUE}>Next step</div>
                <div className={FINELY_OS_ENTITY_BODY}>
                  AU inventory requires an account + quick intake so we can verify identity, confirm fit, and schedule posting.
                  Continue to the AU Request flow to submit your details and documents. After review, you’ll receive secure payment instructions.
                </div>
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className={FINELY_OS_ENTITY_BODY}>Subtotal</span>
                    <span className={FINELY_OS_ENTITY_VALUE}>{fmtUsd(subtotalCents)}</span>
                  </div>
                  <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    Pricing controls applied: {pricing.tradelineAuMarkupPct}% markup • {pricing.tradelineAuDiscountPct}% discount
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button type="button" onClick={() => navigate(`/onboarding?next=${encodeURIComponent('/au/request')}`)} className={`justify-center ${FINELY_OS_SUCCESS_BTN}`}>
                    Continue AU request <ArrowRight size={16} />
                  </button>
                  <button type="button" onClick={() => navigate('/consultation?lane=Authorized%20Users%20(AU)')} className={`justify-center ${FINELY_OS_SECONDARY_BTN}`}>
                    Not sure? Get matched <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('violet')} !p-5 flex items-start gap-3`}>
                <ShieldAlert size={18} className="mt-0.5 text-fuchsia-400 shrink-0" />
                <div className={FINELY_OS_ENTITY_BODY}>
                  Inventory availability and posting timelines vary. We do not promise score outcomes. If your goal is
                  lender readiness, book a free strategy call and we’ll pick the safest lane.
                </div>
              </div>
            </div>
          </div>
        )}
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="finely_advisor"
          goal="tradelines"
          roleLabel="tradeline advisor"
          subline="Cart questions, AU fit, or posting timelines — chat with our on-duty advisor before you submit."
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
