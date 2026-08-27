import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Folder,
  Search,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import type {
  WorkspaceProductAccent,
  WorkspaceProductStatus,
} from '../workspaceProductTokens';
import { ProductBoxSurface, ProductEmptyState, ProductStatusPill, toFcmAccent } from './ProductUi';
import type { ProductBoxEmphasis } from './ProductUi';
import {
  deriveProductCollectionActionLabel,
  type ProductCollectionActionKind,
} from './productCollectionActionLabel';
import './productBoxes.css';

export type ProductCollectionItem = {
  id: string;
  title: string;
  description: string;
  meta: string;
  status: WorkspaceProductStatus;
  statusLabel?: string;
  accent: WorkspaceProductAccent;
  icon?: LucideIcon;
  tags?: string[];
  priority?: number;
  /** Explicit CTA copy — when omitted, derived from `actionKind` + `title`. */
  actionLabel?: string;
  /** Drives "{verb} {title}" when `actionLabel` is not set. */
  actionKind?: ProductCollectionActionKind;
  /** Product route this row represents, for deep links and middle-click/open-in-new affordances. */
  target?: string;
  onOpen: () => void;
};

/** Rows are built before accents are arranged, so callers type the pre-arrangement array with this. */
export type ProductCollectionItemDraft = Omit<ProductCollectionItem, 'accent'>;

type CollectionFilter = 'all' | 'action' | 'active' | 'ready' | 'complete';

function matchesFilter(item: ProductCollectionItem, filter: CollectionFilter) {
  if (filter === 'all') return true;
  if (filter === 'action') return item.status === 'needs_action' || item.status === 'blocked';
  if (filter === 'active') return item.status === 'in_progress' || item.status === 'waiting';
  if (filter === 'ready') return item.status === 'ready';
  return item.status === 'complete';
}

export function ProductCollectionSurface({
  title,
  description,
  items,
  view = 'mosaic',
  pageSize = 6,
  action,
  intelligenceLabel = 'Prioritized by current action state and workspace urgency.',
}: {
  title: string;
  description: string;
  items: ProductCollectionItem[];
  view?: 'rows' | 'cards' | 'mosaic';
  pageSize?: number;
  action?: React.ReactNode;
  intelligenceLabel?: string;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CollectionFilter>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((item) => matchesFilter(item, filter))
      .filter((item) => {
        if (!normalized) return true;
        return [item.title, item.description, item.meta, ...(item.tags ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(normalized);
      })
      .sort((left, right) => {
        const byPriority = (right.priority ?? 0) - (left.priority ?? 0);
        return byPriority || left.title.localeCompare(right.title);
      });
  }, [filter, items, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => setPage(1), [filter, query]);

  return (
    <section className="fc-wlp-collection" data-view={view}>
      <header className="fc-wlp-collection-head">
        <div>
          <div className="fc-wlp-eyebrow">Intelligent collection</div>
          <h2 className="fc-wlp-section-title">{title}</h2>
          <p className="fc-wlp-section-description">{description}</p>
        </div>
        {action}
      </header>

      <div className="fc-wlp-collection-controls">
        <label className="fc-wlp-collection-search">
          <Search size={15} />
          <span className="sr-only">Search this collection</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this workspace…"
          />
        </label>
        <label className="fc-wlp-collection-filter">
          <SlidersHorizontal size={14} />
          <span className="sr-only">Filter collection</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as CollectionFilter)}>
            <option value="all">All work</option>
            <option value="action">Needs action</option>
            <option value="active">Active / waiting</option>
            <option value="ready">Ready</option>
            <option value="complete">Complete</option>
          </select>
        </label>
      </div>

      <div className="fc-wlp-collection-rationale">
        <span>{intelligenceLabel}</span>
        <strong>{filtered.length} result{filtered.length === 1 ? '' : 's'}</strong>
      </div>

      {visible.length ? (
        <div className="fc-wlp-collection-items">
          {visible.map((item, index) => {
            const Icon = item.icon ?? Folder;
            const featured = view === 'mosaic' && index === 0 && currentPage === 1;
            // Mosaic and card views render discrete objects, so they take the material
            // treatment and sit at the `raised` tier — without it they read as flat white
            // tiles that do not separate from the quiet panel behind them.
            // List view stays deliberately flat: an accent fill on every row would rebuild
            // the long coloured-bar layout the tier system exists to replace.
            const isObjectView = view === 'mosaic' || view === 'cards';
            const fcmAccent = toFcmAccent(item.accent);
            // Featured objects keep the stronger gradient/glow tier without falling onto a
            // black-heavy bed. This preserves hierarchy while bringing the accent color forward.
            const bed = 'light' as const;
            const tier: ProductBoxEmphasis = featured ? 'featured' : 'raised';
            const rowActionLabel = deriveProductCollectionActionLabel(item);
            return (
              <button
                key={item.id}
                type="button"
                className={`fc-wlp-collection-item${isObjectView ? ' pbx-object' : ''}`}
                data-accent={item.accent}
                data-fcm-accent={isObjectView ? fcmAccent : undefined}
                data-bed={isObjectView ? bed : undefined}
                data-pbx-tier={isObjectView ? tier : undefined}
                data-featured={featured ? 'true' : undefined}
                onClick={item.onOpen}
              >
                {isObjectView ? <ProductBoxSurface accent={fcmAccent} bed={bed} tier={tier} /> : null}
                <span className="fc-wlp-collection-icon">
                  <Icon size={featured ? 24 : 20} strokeWidth={2.05} />
                </span>
                <span className="fc-wlp-collection-copy">
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                  {item.tags?.length ? (
                    <span className="fc-wlp-collection-tags">
                      {item.tags.slice(0, featured ? 4 : 3).map((tag) => <em key={tag}>{tag}</em>)}
                    </span>
                  ) : null}
                </span>
                <span className="fc-wlp-collection-meta">
                  <ProductStatusPill status={item.status} label={item.statusLabel} />
                  <span>{item.meta}</span>
                </span>
                {rowActionLabel ? (
                  <span className="fc-wlp-collection-open">
                    {rowActionLabel} <ArrowRight size={14} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <ProductEmptyState
          title="Nothing matches this view"
          description="Clear the search or choose another status filter."
        />
      )}

      {pageCount > 1 ? (
        <footer className="fc-wlp-collection-pagination">
          <span>
            Page {currentPage} of {pageCount}
          </span>
          <div>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </footer>
      ) : null}
    </section>
  );
}
