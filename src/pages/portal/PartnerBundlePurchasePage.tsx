import React, { useState } from 'react';
import { ArrowLeft, Layers, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { getBundleBySlug, resolveBundleProducts, bundleSavingsCents, bundleListPriceCents } from '../../lib/bookstoreCommerce';
import { completeBundlePurchase } from '../../lib/commerceHub';
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

type BundleTab = 'overview' | 'unlock';

export default function PartnerBundlePurchasePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const bundle = slug ? getBundleBySlug(slug) : null;
  const products = bundle ? resolveBundleProducts(bundle) : [];
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<BundleTab>('overview');

  if (!partner) {
    return (
      <PageShell badge="Library" title="Purchase bundle" subtitle="Sign in to unlock bundles in My Library.">
        <button type="button" onClick={() => navigate(`/onboarding?next=/portal/library/purchase/bundle/${slug ?? ''}`)} className={FINELY_OS_PRIMARY_BTN}>
          Start onboarding
        </button>
      </PageShell>
    );
  }

  if (!bundle) {
    return <PageShell badge="Library" title="Bundle not found" subtitle="Return to the bookstore." />;
  }

  const purchase = async () => {
    setBusy(true);
    try {
      const res = completeBundlePurchase({ partnerId: partner.id, bundle, force: bundle.priceAmount <= 0 });
      setMsg(res.message);
      setDone(res.ok);
      setTab('unlock');
    } catch (e: unknown) {
      setMsg((e as Error)?.message ?? 'Purchase failed.');
    } finally {
      setBusy(false);
    }
  };

  const save = bundleSavingsCents(bundle);

  return (
    <PageShell badge="Library" title="Unlock bundle" subtitle={bundle.title}>
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/bookstore')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Bookstore
        </button>

        <FinelyUnifiedHubLayout
          eyebrow="Bundle checkout"
          title={bundle.title}
          subtitle={`${products.length} titles · read + listen in My Library`}
          accent="violet"
          kpis={[
            { label: 'Titles', value: String(products.length), hint: 'In bundle', accent: 'violet' },
            { label: 'Price', value: formatPrice(bundle.priceAmount), hint: 'Bundle', accent: 'amber' },
            { label: 'Save', value: save > 0 ? formatPrice(save) : '—', hint: 'vs list', accent: 'emerald' },
            { label: 'Status', value: done ? 'Unlocked' : 'Preview', hint: 'Library', accent: done ? 'emerald' : 'sky' },
          ]}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'unlock', label: 'Unlock', badge: done ? '✓' : undefined },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as BundleTab)}
          primaryAction={{ label: 'My library', onClick: () => navigate('/portal/library') }}
          secondaryAction={{ label: 'Bookstore', onClick: () => navigate('/bookstore') }}
        >
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className={`${FINELY_OS_ENTITY_VALUE} text-xl font-bold flex items-center gap-2`}>
                <Layers size={20} className="text-violet-300" /> {bundle.title}
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>{bundle.description}</p>
              <ul className={`list-disc pl-5 text-sm ${FINELY_OS_ENTITY_BODY} space-y-1`}>
                {products.map((p) => (
                  <li key={p.slug}>{p.title}</li>
                ))}
              </ul>
              <div className="text-amber-300 font-black text-2xl">{formatPrice(bundle.priceAmount)}</div>
              {save > 0 ? (
                <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  List {formatPrice(bundleListPriceCents(bundle))} · you save {formatPrice(save)}
                </div>
              ) : null}
            </div>
          )}

          {tab === 'unlock' && (
            <div className="space-y-4">
              {done && msg ? <div className={FINELY_OS_NOTICE_SUCCESS}>{msg}</div> : null}
              <div className="flex flex-wrap gap-3">
                {!done ? (
                  <button type="button" disabled={busy} onClick={() => void purchase()} className={FINELY_OS_PRIMARY_BTN}>
                    {busy ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                    Unlock bundle
                  </button>
                ) : (
                  <button type="button" onClick={() => navigate('/portal/library')} className={FINELY_OS_PRIMARY_BTN}>
                    Open My Library
                  </button>
                )}
              </div>
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
