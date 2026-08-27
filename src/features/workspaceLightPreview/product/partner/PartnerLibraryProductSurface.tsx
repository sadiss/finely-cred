import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CircleHelp,
  Headphones,
  Library,
  Lock,
  PlayCircle,
  Sparkles,
  Store,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { listBookstoreProducts } from '../../../../data/bookstoreRepo';
import { ensureDemoLibraryGrant, hasLibraryBook, listLibraryEntitlements } from '../../../../data/libraryRepo';
import { emitLibraryOpened } from '../../../../domain/platformEvents';
import { BookReaderPanel } from '../../../../components/library/BookReaderPanel';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';

const METRICS_VARIANT = 'grid' as const;

type ShelfZone = 'owned' | 'store' | 'overview';

const SHELF_TILES: Array<{
  id: ShelfZone;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: 'owned', label: 'Your shelf', hint: 'Titles you own', accent: 'emerald', icon: Library },
  { id: 'store', label: 'Bookstore', hint: 'Available to buy', accent: 'violet', icon: Store },
  { id: 'overview', label: 'Voice sync', hint: 'Read + listen modes', accent: 'sky', icon: Headphones },
];

export default function PartnerLibraryProductSurface({
  role,
  pageId,
  partnerId,
  entityId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const [searchParams] = useSearchParams();
  const listenMode = searchParams.get('mode') === 'listen';
  const { partner: sessionPartner } = usePartnerSession();
  const partner = partnerId ? sessionPartner : sessionPartner;
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Library;
  const accent = navItem?.accent ?? 'rose';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;
  const libraryBasePath = mapPortalHref('/portal/library');

  const [tick, setTick] = useState(0);
  const [zone, setZone] = useState<ShelfZone>('owned');

  useEffect(() => {
    if (partner?.id) ensureDemoLibraryGrant(partner.id);
    const onStore = () => setTick((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, [partner?.id]);

  const products = useMemo(() => listBookstoreProducts(), [tick]);
  const ownedSlugs = useMemo(
    () => new Set(partner?.id ? listLibraryEntitlements(partner.id).map((e) => e.bookSlug) : []),
    [partner?.id, tick],
  );

  const owned = products.filter((p) => ownedSlugs.has(p.slug));
  const store = products.filter((p) => !ownedSlugs.has(p.slug));
  const slug = entityId;
  const activeProduct = slug ? products.find((p) => p.slug === slug) : null;
  const canRead = activeProduct && partner?.id && hasLibraryBook(partner.id, activeProduct.slug);

  useEffect(() => {
    if (!canRead || !activeProduct || !partner?.id) return;
    emitLibraryOpened({
      tenantId: 'finely_cred',
      partnerId: partner.id,
      bookSlug: activeProduct.slug,
      mode: listenMode ? 'listen' : 'read',
    });
  }, [activeProduct?.slug, canRead, listenMode, partner?.id]);

  const askFinelyPrompt = 'Which book should I read for my current step?';

  const metrics: ProductMetric[] = [
    {
      label: 'Owned',
      value: isDemo ? 2 : owned.length,
      hint: 'On your shelf',
      accent: 'emerald',
      icon: Library,
      onClick: () => setZone('owned'),
    },
    {
      label: 'Store',
      value: isDemo ? 4 : store.length,
      hint: 'Available to buy',
      accent: 'violet',
      icon: BookOpen,
      onClick: () => setZone('store'),
    },
    {
      label: 'Catalog',
      value: products.length,
      hint: 'All titles',
      accent: 'sky',
      icon: BookOpen,
      onClick: () => setZone('overview'),
    },
    {
      label: 'Mode',
      value: 'Read + listen',
      hint: 'Voice Studio narration',
      accent: 'rose',
      icon: Headphones,
      onClick: () => owned[0] && navigate(`${libraryBasePath}/${owned[0].slug}?mode=listen`),
    },
  ];

  const renderBookTile = (
    p: (typeof products)[number],
    idx: number,
    mode: 'owned' | 'store',
  ) => {
    const cardAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
    return (
      <div
        key={p.id}
        className={`${finelyOsCatalogCard(cardAccent)} fc-surface-harmony flex flex-col justify-between min-h-[280px] p-6 lg:p-8`}
        data-fc-accent={cardAccent}
      >
        <div>
          {mode === 'store' ? (
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} mb-3`}>
              <Lock size={12} /> Not owned
            </div>
          ) : (
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} mb-3`}>
              <Sparkles size={12} className="text-emerald-400" /> On your shelf
            </div>
          )}
          <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{p.title}</div>
          <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY} line-clamp-3`}>{p.desc}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {mode === 'owned' ? (
            <>
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(`${libraryBasePath}/${p.slug}`)}>
                <BookOpen size={14} /> Read
              </button>
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => navigate(`${libraryBasePath}/${p.slug}?mode=listen`)}
              >
                <Headphones size={14} /> Listen
              </button>
            </>
          ) : (
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(mapPortalHref(`/bookstore/${p.slug}`))}>
              View in store
            </button>
          )}
        </div>
      </div>
    );
  };

  const mosaicBody = isDemo ? (
    <ProductEmptyState
      title="Sign in to open your library"
      description="Demo mode shows the shelf mosaic — sign in to read, listen, and sync chapters."
      action={
        <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
          Sign in
        </button>
      }
    />
  ) : !partner ? (
    <ProductEmptyState
      title="No partner session"
      description="Sign in to see books and guides you have access to."
      action={
        <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
          Sign in
        </button>
      }
    />
  ) : (
  <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="catalog-mosaic">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SHELF_TILES.map((tile) => {
          const Icon = tile.icon;
          const active = zone === tile.id;
          const count =
            tile.id === 'owned'
              ? owned.length
              : tile.id === 'store'
                ? store.length
                : products.length;
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => setZone(tile.id)}
              className={`text-left ${finelyOsCatalogCard(tile.accent)} p-6 lg:p-8 min-h-[180px] flex flex-col justify-between transition-all ${
                active ? 'ring-2 ring-white/25 scale-[1.01]' : 'opacity-90 hover:opacity-100'
              }`}
              data-fc-accent={tile.accent}
              data-active={active ? 'true' : undefined}
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Icon size={22} />
              </div>
              <div>
                <div className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{count}</div>
                <div className={`mt-1 text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>{tile.label}</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>{tile.hint}</div>
              </div>
            </button>
          );
        })}
      </div>

      {zone === 'overview' ? (
        <div className="space-y-6">
          <div className={`${finelyOsCatalogCard('sky')} fc-surface-harmony p-6 lg:p-8`} data-fc-accent="sky">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20">
                <Headphones size={28} className="text-sky-300" />
              </div>
              <div>
                <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Voice-synced chapters</div>
                <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  Open any owned title in read or listen mode — narration follows the chapter you are on.
                </p>
              </div>
            </div>
          </div>
          {owned.length > 0 ? (
            <FinelyOsPaginatedStack
              items={owned}
              pageSize={4}
              itemSpacingClassName="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
              renderItem={(p, idx) => renderBookTile(p, idx, 'owned')}
            />
          ) : null}
          {store.length > 0 ? (
            <div className="space-y-4">
              <div className="fc-wlp-eyebrow">Available in bookstore</div>
              <FinelyOsPaginatedStack
                items={store.slice(0, 6)}
                pageSize={6}
                itemSpacingClassName="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
                renderItem={(p, idx) => renderBookTile(p, idx, 'store')}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {zone === 'owned' ? (
        owned.length === 0 ? (
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8`} data-fc-accent="emerald">
            <ProductEmptyState
              title="No books yet"
              description="Purchase from the bookstore or ask your specialist for access. Demo partners receive Finely Blueprint automatically."
              action={
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/bookstore'))}>
                  Browse bookstore
                </button>
              }
            />
          </div>
        ) : (
          <FinelyOsPaginatedStack
            items={owned}
            pageSize={6}
            itemSpacingClassName="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
            renderItem={(p, idx) => renderBookTile(p, idx, 'owned')}
          />
        )
      ) : null}

      {zone === 'store' ? (
        store.length === 0 ? (
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="violet">
            You own every title in the catalog.
          </div>
        ) : (
          <FinelyOsPaginatedStack
            items={store}
            pageSize={6}
            itemSpacingClassName="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
            renderItem={(p, idx) => renderBookTile(p, idx, 'store')}
          />
        )
      ) : null}

      <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
        <div className="fc-wlp-eyebrow">What to do next</div>
        <h2 className="text-2xl font-extrabold">
          {owned.length ? 'Pick up where you left off' : 'Add your first book'}
        </h2>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          {owned.length
            ? 'Open a title in read or listen mode — narration follows the chapter you are on.'
            : 'Browse the bookstore or ask your specialist for access to premium playbooks.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Library' })}
          >
            <CircleHelp size={14} /> Ask Finely
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources#presenter-demo')}>
            <PlayCircle size={14} /> Watch how
          </button>
        </div>
      </div>
    </section>
  );

  if (canRead && activeProduct && partner?.id) {
    return (
      <ProductHubScaffold
        role={role}
        pageId="library"
        eyebrow="Library"
        title={activeProduct.title}
        description="Read or listen with Voice Studio narration synced to each chapter."
        status="Reading now · live data"
        freshness="ready now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={
          <ProductPagePrimaryAction
            label={listenMode ? 'Switch to read' : 'Switch to listen'}
            onClick={() =>
              navigate(
                listenMode
                  ? `${libraryBasePath}/${activeProduct.slug}`
                  : `${libraryBasePath}/${activeProduct.slug}?mode=listen`,
              )
            }
          />
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(libraryBasePath)}>
            Back to shelf
          </button>
        }
      >
        <section className="fc-wlp-section">
          <BookReaderPanel
            product={activeProduct}
            partnerId={partner.id}
            initialMode={listenMode ? 'listen' : 'read'}
            onBack={() => navigate(libraryBasePath)}
          />
        </section>
        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId="library"
      eyebrow="Library"
      title="Read and listen to your playbooks."
      description="Books and guides you own, with Voice Studio narration synced to each chapter."
      status={`${isDemo ? '2 owned' : `${owned.length} owned`} · ${isDemo ? 'demo' : 'live'} data`}
      freshness="ready now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant={METRICS_VARIANT}
      primaryAction={
        <ProductPagePrimaryAction label="Browse bookstore" onClick={() => navigate(mapPortalHref('/bookstore'))} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/portal/education'))}>
          Education hub
        </button>
      }
      metrics={metrics}
      metricTitle="Shelf summary"
      metricDescription="Owned titles, store availability, and read or listen mode."
    >
      {mosaicBody}
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
