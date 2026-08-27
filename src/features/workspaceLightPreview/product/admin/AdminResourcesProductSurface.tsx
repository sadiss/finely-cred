import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Layers,
  Library,
  Sparkles,
  Video,
  GraduationCap,
  ShoppingBag,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listBookstoreProducts } from '../../../../data/bookstoreRepo';
import { listAllCourses } from '../../../../data/coursesRepo';
import { listResourceVideos } from '../../../../data/resourceVideosRepo';
import { ALL_FREE_GUIDES } from '../../../../resources/freeGuides';
import { TEMPLATE_BASES } from '../../../../templates';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { ProductDashboardSkeleton, type ProductMetric } from '../components/ProductUi';

type ResourceRoom = 'gallery' | 'playbook';

type ResourceSnapshot = {
  guides: number;
  courses: number;
  videos: number;
  templates: number;
  books: number;
};

const MOSAIC_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

function adminWorkspacePath(pathname: string, pageId: string, suffix = ''): string {
  const item = getWorkspaceProductNavItem('admin', pageId);
  const previewBase = item?.path ?? `/preview/workspace-light/admin/${pageId}`;
  const liveBase = item?.legacyPath ?? `/admin/${pageId === 'dashboard' ? '' : pageId}`;
  const base = pathname.startsWith('/preview/workspace-light') ? previewBase : liveBase || '/admin';
  return `${base}${suffix}`;
}

export default function AdminResourcesProductSurface({ role, pageId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'sky';
  const PageIcon = navItem?.icon ?? BookOpen;

  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<ResourceSnapshot | null>(null);
  const [activeRoom, setActiveRoom] = useState<ResourceRoom>('gallery');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    try {
      const videos = listResourceVideos();
      const courses = listAllCourses();
      const books = listBookstoreProducts({ includeUnpublished: true });

      if (!cancelled) {
        setSnapshot({
          guides: ALL_FREE_GUIDES.length,
          courses: courses.length,
          videos: videos.length,
          templates: TEMPLATE_BASES.length,
          books: books.length,
        });
        setLoading(false);
      }
    } catch {
      if (!cancelled) setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [dataMode]);

  const metrics: ProductMetric[] = useMemo(
    () => [
      {
        label: 'Guides',
        value: snapshot?.guides ?? 0,
        hint: 'Public partner education',
        accent: 'emerald',
        icon: BookOpen,
        onClick: () => setActiveRoom('playbook'),
      },
      {
        label: 'Courses',
        value: snapshot?.courses ?? 0,
        hint: 'Learning modules',
        accent: 'violet',
        icon: Library,
        onClick: () => navigate(adminWorkspacePath(pathname, 'courses')),
      },
      {
        label: 'Templates',
        value: snapshot?.templates ?? 0,
        hint: 'Dispute letter bases',
        accent: 'sky',
        icon: Layers,
        onClick: () => navigate(adminWorkspacePath(pathname, 'communications', '?workspaceRoom=studio&room=templates')),
      },
      {
        label: 'Videos',
        value: snapshot?.videos ?? 0,
        hint: 'Media studio projects',
        accent: 'rose',
        icon: Video,
        onClick: () => navigate(adminWorkspacePath(pathname, 'media-studio')),
      },
    ],
    [navigate, pathname, snapshot?.courses, snapshot?.guides, snapshot?.templates, snapshot?.videos],
  );

  const categoryTiles = useMemo(
    () => [
      {
        id: 'guides',
        title: 'Free guides',
        count: snapshot?.guides ?? 0,
        detail: 'Public partner education',
        icon: BookOpen,
        accent: 'emerald' as const,
        onClick: () => setActiveRoom('playbook'),
      },
      {
        id: 'courses',
        title: 'Courses',
        count: snapshot?.courses ?? 0,
        detail: 'Interactive learning modules',
        icon: GraduationCap,
        accent: 'violet' as const,
        onClick: () => navigate(adminWorkspacePath(pathname, 'courses')),
      },
      {
        id: 'videos',
        title: 'Videos',
        count: snapshot?.videos ?? 0,
        detail: 'Media studio library',
        icon: Video,
        accent: 'sky' as const,
        onClick: () => navigate(adminWorkspacePath(pathname, 'media-studio')),
      },
      {
        id: 'templates',
        title: 'Letter templates',
        count: snapshot?.templates ?? 0,
        detail: 'Dispute letter bases',
        icon: Layers,
        accent: 'rose' as const,
        onClick: () => navigate(adminWorkspacePath(pathname, 'communications', '?workspaceRoom=studio&room=templates')),
      },
      {
        id: 'books',
        title: 'Bookstore',
        count: snapshot?.books ?? 0,
        detail: 'Published and draft books',
        icon: ShoppingBag,
        accent: 'emerald' as const,
        onClick: () => navigate(adminWorkspacePath(pathname, 'bookstore')),
      },
    ],
    [navigate, pathname, snapshot?.books, snapshot?.courses, snapshot?.guides, snapshot?.templates, snapshot?.videos],
  );

  if (loading) {
    return <ProductDashboardSkeleton label="Loading resource library" />;
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Studio"
      title="Guides, templates, and the partner resource library."
      description="Large category tiles first — open a shelf or jump straight to the editor."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Library snapshot"
      metricDescription="Tap a count to open that category. Browse shelves or the featured guide below."
      metricsVariant="inline"
      primaryAction={<ProductPagePrimaryAction label="Open featured guide" onClick={() => setActiveRoom('playbook')} />}
      secondaryAction={
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/resources')}>
          Public library
        </button>
      }
    >
      <section className="space-y-8" data-surface-layout="catalog-mosaic">
        <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-5`} data-fc-accent="sky">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Library size={16} />
                <span>Catalog mosaic</span>
              </div>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {(snapshot?.guides ?? 0) + (snapshot?.courses ?? 0) + (snapshot?.videos ?? 0) + (snapshot?.templates ?? 0) + (snapshot?.books ?? 0)}{' '}
                resources across five categories
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Library views">
              {(
                [
                  { id: 'gallery' as ResourceRoom, label: 'Browse shelves' },
                  { id: 'playbook' as ResourceRoom, label: 'Featured guide' },
                ] as const
              ).map((tab) => {
                const active = activeRoom === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveRoom(tab.id)}
                    className={`rounded-full border px-4 py-2 text-xs font-extrabold transition ${
                      active
                        ? 'border-sky-400 bg-sky-500/15 text-sky-900'
                        : 'border-black/10 bg-white/60 text-slate-800 hover:border-sky-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categoryTiles.map((tile, idx) => {
              const Icon = tile.icon;
              const tileAccent = MOSAIC_ACCENTS[idx % MOSAIC_ACCENTS.length];
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={tile.onClick}
                  className={`${finelyOsCatalogCard(tileAccent)} p-6 lg:p-7 text-left min-h-[180px] flex flex-col gap-3 transition hover:shadow-lg`}
                  data-fc-accent={tileAccent}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.06]">
                      <Icon size={22} />
                    </span>
                    <span className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tile.count}</span>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold">{tile.title}</div>
                    <p className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>{tile.detail}</p>
                  </div>
                  <span className={`mt-auto inline-flex items-center gap-1 text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                    Open <ArrowRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {activeRoom === 'playbook' ? (
          <div
            className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center`}
            data-fc-accent="emerald"
          >
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700">
                <Sparkles size={14} /> Featured guide
              </span>
              <h2 className="mt-3 text-3xl font-extrabold">Complete Credit Restoration Master Guide</h2>
              <p className={`mt-3 max-w-2xl text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                Step-by-step partner playbook covering factual dispute findings, evidence exhibits, and FCRA validation rights.
              </p>
            </div>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/resources')}>
              Open guide <ArrowUpRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-lg font-extrabold">
                  <BookOpen size={18} className="text-emerald-600" /> Free guides shelf
                </span>
                <span className={`text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>{snapshot?.guides ?? 0} published guides</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {ALL_FREE_GUIDES.slice(0, 4).map((guide, idx) => {
                  const tileAccent = MOSAIC_ACCENTS[(idx + 1) % MOSAIC_ACCENTS.length];
                  return (
                    <button
                      key={guide.id}
                      type="button"
                      className={`${finelyOsCatalogCard(tileAccent)} p-5 text-left min-h-[140px] flex flex-col gap-2`}
                      data-fc-accent={tileAccent}
                      onClick={() => navigate(`/resources#${guide.id}`)}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Guide</span>
                      <strong className="text-base font-extrabold">{guide.title}</strong>
                      <span className={`text-sm font-semibold line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>{guide.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-lg font-extrabold">
                  <Layers size={18} className="text-violet-600" /> Dispute letter templates shelf
                </span>
                <span className={`text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>{snapshot?.templates ?? 0} template bases</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {TEMPLATE_BASES.slice(0, 4).map((tpl, idx) => {
                  const tileAccent = MOSAIC_ACCENTS[(idx + 2) % MOSAIC_ACCENTS.length];
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      className={`${finelyOsCatalogCard(tileAccent)} p-5 text-left min-h-[140px] flex flex-col gap-2`}
                      data-fc-accent={tileAccent}
                      onClick={() =>
                        navigate(adminWorkspacePath(pathname, 'communications', '?workspaceRoom=studio&room=templates'))
                      }
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-sky-700">{tpl.category}</span>
                      <strong className="text-base font-extrabold">{tpl.title}</strong>
                      <span className={`text-sm font-semibold line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>{tpl.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8`} data-fc-accent="rose">
          <h2 className="text-2xl font-extrabold">Keep partner resources current</h2>
          <p className={`mt-3 max-w-3xl text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
            Review guides and letter templates regularly so legal references and factual dispute standards stay accurate.
          </p>
          <ol className={`mt-5 space-y-2 list-decimal list-inside text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            <li>Review unpublished drafts or stale guides.</li>
            <li>Verify FCRA and FDCPA citations.</li>
            <li>Publish or refresh resources for the partner portal.</li>
          </ol>
        </div>

        <p className={`text-sm font-semibold opacity-80 ${FINELY_OS_ENTITY_BODY}`}>
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </section>
    </ProductHubScaffold>
  );
}
