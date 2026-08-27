import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Eye, Package, Search, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  allPackages,
  categoryLabels,
  categoryDescriptions,
  formatPrice,
  type PricingCategory,
  type PricingPackage,
} from '../../../../config/pricingCatalog';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminProductsProductSurface.css';

const MOSAIC_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

function groupLabel(cat: string) {
  return (categoryLabels as Record<string, string>)?.[cat] || cat;
}

function groupDescription(cat: string) {
  return (categoryDescriptions as Record<string, string>)?.[cat] || '';
}

export default function AdminProductsProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'sky';
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PricingCategory | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<PricingCategory>();
    for (const p of allPackages) set.add(p.category);
    return Array.from(set).sort((a, b) => groupLabel(a).localeCompare(groupLabel(b)));
  }, []);

  const packages = useMemo(() => {
    const q = query.trim().toLowerCase();
    let pkgs = allPackages
      .slice()
      .sort(
        (a, b) =>
          (a.category || '').localeCompare(b.category || '') || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
    if (categoryFilter !== 'all') pkgs = pkgs.filter((p) => p.category === categoryFilter);
    if (!q) return pkgs;
    return pkgs.filter((p) => {
      const hay = [p.id, p.category, p.name, p.tagline, p.description, ...(p.highlights || [])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [query, categoryFilter]);

  const selected: PricingPackage | null = useMemo(() => {
    if (!packages.length) return null;
    if (selectedId) return packages.find((p) => p.id === selectedId) ?? packages[0] ?? null;
    return packages[0] ?? null;
  }, [packages, selectedId]);

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected?.id]);

  const publicCount = packages.filter((p) => p.isPublic).length;

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Finance"
      title="Products & packages"
      description="Audit what is sellable and public from the pricing catalog."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="View public pricing" onClick={() => navigate('/pricing')} />}
      metrics={[
        { label: 'Packages', value: String(packages.length), hint: 'In catalog', accent: 'emerald' },
        { label: 'Public', value: String(publicCount), hint: 'On pricing page', accent: 'violet' },
        { label: 'Categories', value: String(categories.length), hint: 'Product families', accent: 'sky' },
        { label: 'DIY', value: String(packages.filter((p) => p.delivery === 'DIY').length), hint: 'Self-serve plans', accent: 'rose' },
      ]}
      metricTitle="Catalog snapshot"
      metricDescription="Pick a tile in the mosaic — package detail opens in the inspector."
      metricsVariant="inline"
    >
      <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Package size={16} />
              <span>Pricing catalog</span>
            </div>
            <p className={`mt-2 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
              {packages.length} package{packages.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
            <Search size={16} className="text-sky-500 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search packages…"
              className={`bg-transparent outline-none text-base min-w-[220px] ${FINELY_OS_ENTITY_VALUE} placeholder:opacity-40`}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={categoryFilter === 'all' ? finelyOsStatusChip('ok') : FINELY_OS_ENTITY_CHIP}
          >
            All categories
          </button>
          {categories.map((cat, idx) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={categoryFilter === cat ? finelyOsStatusChip('ok') : FINELY_OS_ENTITY_CHIP}
              data-fc-accent={MOSAIC_ACCENTS[idx % MOSAIC_ACCENTS.length]}
            >
              {groupLabel(cat)}
            </button>
          ))}
        </div>
      </section>

      {packages.length === 0 ? (
        <div className={`${finelyOsCatalogCard('rose')} p-8 text-center`} data-fc-accent="rose">
          <p className={FINELY_OS_ENTITY_BODY}>No packages match your search or category filter.</p>
        </div>
      ) : (
        <div className="fc-admin-products-layout" data-surface-layout="catalog-mosaic">
          <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-5`} data-fc-accent="emerald">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-3xl font-extrabold">Package mosaic</h2>
              <span className={`font-mono text-sm ${FINELY_OS_ENTITY_SUBLABEL}`}>{packages.length} tiles</span>
            </div>

            <div className="fc-admin-products-mosaic">
              {packages.map((p, idx) => {
                const tileAccent = MOSAIC_ACCENTS[idx % MOSAIC_ACCENTS.length];
                const active = p.id === selected?.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-selected={active ? 'true' : undefined}
                    onClick={() => setSelectedId(p.id)}
                    className={`fc-admin-products-tile fc-wlp-control-room-family ${finelyOsCatalogCard(tileAccent)}`}
                    data-fc-accent={tileAccent}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-bold uppercase ${FINELY_OS_ENTITY_SUBLABEL}`}>{groupLabel(p.category)}</span>
                      {p.isPublic ? (
                        <span className={finelyOsStatusChip('ok')}>Public</span>
                      ) : (
                        <span className={FINELY_OS_ENTITY_CHIP}>Hidden</span>
                      )}
                    </div>
                    <div className={`text-lg font-extrabold leading-tight ${FINELY_OS_ENTITY_VALUE}`}>{p.name}</div>
                    {p.tagline ? <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{p.tagline}</div> : null}
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      <span className={FINELY_OS_ENTITY_CHIP}>{p.delivery}</span>
                      <span className={FINELY_OS_ENTITY_CHIP}>{p.rail}</span>
                    </div>
                    <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                      {p.isCustomQuote ? 'Quote' : formatPrice(p.priceAmount)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="fc-admin-products-inspector">
            <section className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-5`} data-fc-accent="violet">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Eye size={16} />
                <span>Package inspector</span>
              </div>

              {!selected ? (
                <div className={FINELY_OS_LUXURY_EMPTY}>Select a package from the mosaic.</div>
              ) : (
                <>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 ${FINELY_OS_ENTITY_CHIP}`}>
                        <Tag size={12} /> {groupLabel(selected.category)}
                      </span>
                      {selected.badge ? <span className={finelyOsStatusChip('ok')}>{selected.badge}</span> : null}
                    </div>
                    <h2 className="mt-3 text-3xl font-extrabold">{selected.name}</h2>
                    {selected.tagline ? <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{selected.tagline}</p> : null}
                    <p className={`mt-1 font-mono text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{selected.id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className={`${finelyOsCatalogCard('sky')} fc-surface-harmony p-4`} data-fc-accent="sky">
                      <div className={FINELY_OS_ENTITY_LABEL}>Price</div>
                      <div className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                        {selected.isCustomQuote ? 'Custom quote' : formatPrice(selected.priceAmount)}
                      </div>
                    </div>
                    <div className={`${finelyOsCatalogCard('rose')} fc-surface-harmony p-4`} data-fc-accent="rose">
                      <div className={FINELY_OS_ENTITY_LABEL}>Visibility</div>
                      <div className={`mt-1 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                        {selected.isPublic ? 'Public' : 'Admin only'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={FINELY_OS_ENTITY_CHIP}>{selected.delivery}</span>
                    <span className={FINELY_OS_ENTITY_CHIP}>{selected.interval ?? 'one_time'}</span>
                    <span className={FINELY_OS_ENTITY_CHIP}>{selected.rail}</span>
                  </div>

                  {groupDescription(selected.category) ? (
                    <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>{groupDescription(selected.category)}</p>
                  ) : null}

                  {selected.description ? (
                    <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>{selected.description}</p>
                  ) : null}

                  {selected.highlights?.length ? (
                    <div className="space-y-2">
                      <div className={FINELY_OS_ENTITY_LABEL}>Highlights</div>
                      <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
                        {selected.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2 text-base font-semibold">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/pricing')}>
                      Preview on site <ArrowRight size={14} />
                    </button>
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/billing')}>
                      Billing plans
                    </button>
                  </div>
                </>
              )}
            </section>
          </aside>
        </div>
      )}
    </ProductHubScaffold>
  );
}
