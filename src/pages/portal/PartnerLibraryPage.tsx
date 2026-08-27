import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Headphones, Library, Lock } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';
import { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listBookstoreProducts } from '../../data/bookstoreRepo';
import { ensureDemoLibraryGrant, hasLibraryBook, listLibraryEntitlements } from '../../data/libraryRepo';
import { emitLibraryOpened } from '../../domain/platformEvents';
import { BookReaderPanel } from '../../components/library/BookReaderPanel';
import { usePageMeta } from '../../hooks/usePageMeta';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type LibraryTab = 'overview' | 'owned' | 'store';

export default function PartnerLibraryPage({ embedded = false }: PartnerEmbeddablePageProps = {}) {
  usePageMeta('My Library', 'Read and listen to your purchased Finely Cred playbooks.');
  const navigate = useMappedPartnerNavigate();
  const { slug } = useParams();
  const { partner } = usePartnerSession();
  const partnerId = partner?.id;
  const [searchParams] = useSearchParams();
  const listenMode = searchParams.get('mode') === 'listen';
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState<LibraryTab>('owned');

  useEffect(() => {
    if (partnerId) ensureDemoLibraryGrant(partnerId);
    const onStore = () => setTick((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, [partnerId]);

  const products = useMemo(() => listBookstoreProducts(), [tick]);
  const ownedSlugs = useMemo(
    () => new Set(partnerId ? listLibraryEntitlements(partnerId).map((e) => e.bookSlug) : []),
    [partnerId, tick],
  );

  const owned = products.filter((p) => ownedSlugs.has(p.slug));
  const store = products.filter((p) => !ownedSlugs.has(p.slug));

  const activeProduct = slug ? products.find((p) => p.slug === slug) : null;
  const canRead = activeProduct && partnerId && hasLibraryBook(partnerId, activeProduct.slug);

  useEffect(() => {
    if (!canRead || !activeProduct || !partnerId) return;
    emitLibraryOpened({
      tenantId: 'finely_cred',
      partnerId,
      bookSlug: activeProduct.slug,
      mode: listenMode ? 'listen' : 'read',
    });
  }, [activeProduct?.slug, canRead, listenMode, partnerId]);

  if (activeProduct && canRead && partnerId) {
    return (
      <PartnerWorkstationFrame
        embedded={embedded}
        kind="library-workstation"
        badge="Library"
        title={activeProduct.title}
        subtitle="Read + listen with Finely Voice Studio"
      >
        <BookReaderPanel product={activeProduct} partnerId={partnerId} initialMode={listenMode ? 'listen' : 'read'} onBack={() => navigate('/portal/library')} />
      </PartnerWorkstationFrame>
    );
  }

  return (
    <PartnerWorkstationFrame
      embedded={embedded}
      kind="library-workstation"
      badge="Library"
      title="My Library"
      subtitle="The books and guides you have access to, with audio if you prefer to listen."
    >
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Partner Dashboard
        </button>

        <FinelyUnifiedHubLayout
          eyebrow="Book library"
          title="Read + listen to your playbooks"
          subtitle="Finely Voice Studio narration syncs with each chapter — browse owned titles or discover more in the bookstore."
          accent="emerald"
          kpis={[
            { label: 'Owned', value: String(owned.length), hint: 'Your shelf', accent: 'emerald' },
            { label: 'Store', value: String(store.length), hint: 'Available', accent: 'violet' },
            { label: 'Catalog', value: String(products.length), hint: 'All titles', accent: 'sky' },
            { label: 'Mode', value: 'Read + listen', hint: 'Voice Studio', accent: 'rose' },
          ]}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'owned', label: 'Your books', badge: owned.length || undefined },
            { id: 'store', label: 'Bookstore', badge: store.length || undefined },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as LibraryTab)}
          primaryAction={{ label: 'Browse bookstore', onClick: () => navigate('/bookstore') }}
          secondaryAction={{ label: 'Education hub', onClick: () => navigate('/portal/education') }}
        >
          {tab === 'overview' && (
            <div className={`${finelyOsCatalogCard('emerald')} flex flex-wrap items-center justify-between gap-3`} data-fc-accent="emerald">
              <div className="flex items-center gap-3">
                <Library className="text-emerald-700" size={22} />
                <div>
                  <div className={FINELY_OS_ENTITY_VALUE}>Voice-synced chapters</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>Open any owned title in read or listen mode — narration follows the chapter you are on.</div>
                </div>
              </div>
            </div>
          )}

          {(tab === 'owned' || tab === 'overview') && (
            <section className="space-y-3">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Your books ({owned.length})</div>
              {owned.length === 0 ? (
                <div className={FINELY_OS_LUXURY_EMPTY}>
                  No books yet. Purchase from the bookstore or ask admin for a grant. Demo partners receive Finely Blueprint automatically.
                </div>
              ) : (
                <FinelyOsPaginatedStack
                  items={owned}
                  pageSize={4}
                  itemSpacingClassName="grid md:grid-cols-2 gap-4"
                  renderItem={(p, idx) => (
                    <div key={p.id} className={finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}>
                      <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{p.title}</div>
                      <div className={`${FINELY_OS_ENTITY_BODY} text-sm mt-1`}>{p.desc}</div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button type="button" onClick={() => navigate(`/portal/library/${p.slug}`)} className={FINELY_OS_PRIMARY_BTN}>
                          <BookOpen size={14} /> Read
                        </button>
                        <button type="button" onClick={() => navigate(`/portal/library/${p.slug}?mode=listen`)} className={FINELY_OS_SECONDARY_BTN}>
                          <Headphones size={14} /> Listen
                        </button>
                      </div>
                    </div>
                  )}
                />
              )}
            </section>
          )}

          {(tab === 'store' || (tab === 'overview' && store.length > 0)) && store.length > 0 ? (
            <section className="space-y-3">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Available in bookstore</div>
              <FinelyOsPaginatedStack
                items={tab === 'store' ? store : store.slice(0, 4)}
                pageSize={4}
                itemSpacingClassName="grid md:grid-cols-2 gap-4"
                renderItem={(p, idx) => (
                  <div key={p.id} className={finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}>
                    <div className="flex items-center gap-2 opacity-55 text-xs uppercase tracking-wider mb-2">
                      <Lock size={12} /> Not owned
                    </div>
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{p.title}</div>
                    <button type="button" onClick={() => navigate(`/bookstore/${p.slug}`)} className={`${FINELY_OS_SECONDARY_BTN} mt-3`}>
                      View in store
                    </button>
                  </div>
                )}
              />
            </section>
          ) : null}
        </FinelyUnifiedHubLayout>

        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
    </PartnerWorkstationFrame>
  );
}
