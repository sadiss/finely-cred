import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { PhysicalEbook } from '../components/landing';
import { useAuth } from '../auth/AuthProvider';
import { isAdminEmail } from '../auth/admin';
import { listBookstoreProducts } from '../data/bookstoreRepo';
import { formatPrice } from '../config/pricingCatalog';
import { CommsWorkspaceActions } from '../components/comms/CommsWorkspaceActions';
import {
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';
import { BookstoreBundlesPanel } from '../components/bookstore/BookstoreBundlesPanel';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { splitBookIntoChapters } from '../domain/libraryEntitlements';

type BookTab = 'catalog' | 'bundles';

export default function BookstorePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<BookTab>('catalog');
  usePublicSeoMeta({
    title: 'Finely Cred bookstore',
    description: 'Credit mastery bundles, ebooks with listen mode, and chapter previews.',
    path: '/bookstore',
  });
  const auth = useAuth();
  const isAdmin = isAdminEmail(auth.user?.email);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const products = useMemo(() => listBookstoreProducts({ includeUnpublished: isAdmin }), [isAdmin, version]);
  const publishedCount = products.filter((p) => p.published).length;

  return (
    <PageShell badge="Store" title="Bookstore" subtitle="Premium resources and playbooks.">
      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="Finely bookstore"
          title="Credit mastery ebooks & bundles"
          subtitle="Browse titles, compare bundles, and open listen-mode previews before you buy."
          accent="fuchsia"
          kpis={[
            { label: 'Titles', value: String(products.length), accent: 'amber' },
            { label: 'Published', value: String(publishedCount), accent: 'emerald' },
          ]}
          tabs={[
            { id: 'catalog', label: 'Catalog' },
            { id: 'bundles', label: 'Bundles' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as BookTab)}
          primaryAction={{ label: 'Personal credit lane', onClick: () => navigate('/personal-credit') }}
          secondaryAction={{ label: 'Resources hub', onClick: () => navigate('/resources') }}
        >
          {tab === 'catalog' && (
            <>
        <div className={`flex flex-wrap items-start justify-between gap-4 ${finelyOsCatalogCard('amber')} !p-6`} data-fc-accent="amber">
          <div>
            <div className="inline-flex items-center gap-2 text-fuchsia-400">
              <BookOpen size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Featured titles</span>
            </div>
            <p className={`mt-3 ${FINELY_OS_ENTITY_BODY} text-sm`}>
              Browse details, outcomes, and delivery notes. Admins can publish and edit titles instantly.
            </p>
          </div>
          {isAdmin && (
            <button type="button" onClick={() => navigate('/admin/bookstore')} className={FINELY_OS_PRIMARY_BTN}>
              Manage bookstore <ArrowRight size={14} />
            </button>
          )}
        </div>

        {auth.user ? <CommsWorkspaceActions calendarLabel="Book strategy call" /> : null}

        <FinelyOsPaginatedStack
          items={products}
          pageSize={6}
          itemSpacingClassName="grid grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center"
          emptyMessage="No bookstore titles yet."
          renderItem={(p) => (
              <div key={p.id} className={`w-full max-w-[340px] space-y-4 ${finelyOsCatalogCard('fuchsia')} !p-5 hover:border-fuchsia-500/30 transition-all`} data-fc-accent="fuchsia">
                <PhysicalEbook
                  title={p.title}
                  sub={p.sub}
                  vol={p.vol || '01'}
                  price={formatPrice(p.priceAmount)}
                  accentColor={p.accentColor}
                />
                <p className={`${FINELY_OS_ENTITY_BODY} text-xs line-clamp-3 min-h-[3rem]`}>{p.desc}</p>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px]`}>
                  {splitBookIntoChapters(p.contentMarkdown ?? '', p.slug).length} chapters · {p.bullets?.length ?? 0} outcomes
                </div>
                <button type="button" onClick={() => navigate(`/bookstore/${p.slug}`)} className={`w-full justify-center ${FINELY_OS_SECONDARY_BTN}`}>
                  View details <ArrowRight size={14} />
                </button>
              </div>
            )}
          />
            </>
          )}

          {tab === 'bundles' && <BookstoreBundlesPanel />}
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="education_coach"
          goal="personal"
          roleLabel="education coach"
          subline="Ask which ebook or course fits your restore lane before you buy."
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
