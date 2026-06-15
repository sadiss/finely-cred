import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Layers, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { getBookstoreProductBySlug } from '../../data/bookstoreRepo';
import { completeBookPurchase } from '../../lib/commerceHub';
import { formatPrice } from '../../config/pricingCatalog';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_PAGE,
} from '../../features/os/finelyOsLightUi';

type BookTab = 'overview' | 'unlock';

export default function PartnerBookPurchasePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const product = slug ? getBookstoreProductBySlug(slug) : null;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<BookTab>('overview');

  React.useEffect(() => {
    if (partner && product && product.priceAmount <= 0 && !done) {
      setBusy(true);
      const res = completeBookPurchase({ partnerId: partner.id, product, force: true });
      setMsg(res.message);
      setDone(true);
      setBusy(false);
      setTab('unlock');
    }
  }, [partner, product, done]);

  if (!partner) {
    return (
      <PageShell badge="Library" title="Purchase book" subtitle="Sign in to unlock titles in My Library.">
        <button type="button" onClick={() => navigate(`/onboarding?next=/portal/library/purchase/${slug ?? ''}`)} className={FINELY_OS_PRIMARY_BTN}>
          Start onboarding
        </button>
      </PageShell>
    );
  }

  if (!product) {
    return <PageShell badge="Library" title="Book not found" subtitle="Return to the bookstore." />;
  }

  const purchase = async () => {
    setBusy(true);
    try {
      const res = completeBookPurchase({
        partnerId: partner.id,
        product,
        force: product.priceAmount <= 0,
      });
      setMsg(res.message);
      setDone(true);
      setTab('unlock');
    } catch (e: unknown) {
      setMsg((e as Error)?.message ?? 'Purchase failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell badge="Library" title="Unlock book" subtitle={product.title}>
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/bookstore')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Bookstore
        </button>

        <FinelyUnifiedHubLayout
          eyebrow="Bookstore checkout"
          title={product.title}
          subtitle="Unlock read + listen mode in My Library after purchase."
          accent="amber"
          kpis={[
            { label: 'Price', value: formatPrice(product.priceAmount), hint: 'One-time', accent: 'amber' },
            { label: 'Format', value: 'Read + listen', hint: 'Voice Studio', accent: 'violet' },
            { label: 'Status', value: done ? 'Unlocked' : 'Preview', hint: 'Library', accent: done ? 'emerald' : 'sky' },
            { label: 'Slug', value: product.slug.slice(0, 12), hint: 'Catalog id', accent: 'emerald' },
          ]}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'unlock', label: 'Unlock', badge: done ? '✓' : undefined },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as BookTab)}
          primaryAction={{ label: 'My library', onClick: () => navigate('/portal/library') }}
          secondaryAction={{ label: 'Education hub', onClick: () => navigate('/portal/education') }}
        >
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className={`${FINELY_OS_ENTITY_VALUE} text-xl font-bold flex items-center gap-2`}>
                <BookOpen size={20} className="text-amber-300" /> {product.title}
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>{product.desc}</p>
              <div className="text-amber-300 font-black text-2xl">{formatPrice(product.priceAmount)}</div>
              {product.priceAmount > 0 ? (
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY} text-white/50`}>
                  Demo mode grants library access locally. Production uses Stripe checkout + webhook verification.
                </p>
              ) : null}
            </div>
          )}

          {tab === 'unlock' && (
            <div className="space-y-4">
              {done ? (
                <div className={FINELY_OS_NOTICE_SUCCESS}>
                  {msg ?? 'Added to My Library.'}
                  <button type="button" onClick={() => navigate(`/portal/library/${product.slug}`)} className={`${FINELY_OS_PRIMARY_BTN} mt-4`}>
                    Open in My Library
                  </button>
                </div>
              ) : (
                <button type="button" disabled={busy} onClick={() => void purchase()} className={FINELY_OS_PRIMARY_BTN}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                  {product.priceAmount <= 0 ? 'Add free book to library' : 'Purchase & unlock (demo)'}
                </button>
              )}
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
