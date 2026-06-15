import React, { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight, Grid3X3, Layers, LayoutList, Search } from 'lucide-react';
import { FinelyOsIconBadge, type FinelyOsIconAccent } from './FinelyOsIconBadge';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_LUXURY_PAGINATION,
  FINELY_OS_LUXURY_PAGINATION_BTN,
  FINELY_OS_TOOLBAR,
} from './finelyOsLightUi';

export type FinelyOsCatalogBadge = {
  label: string;
  className?: string;
};

export type FinelyOsCatalogItem = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  badges?: FinelyOsCatalogBadge[];
  meta?: string[];
  groupKey?: string;
  accentIndex?: number;
  icon?: LucideIcon;
  iconAccent?: FinelyOsIconAccent;
};

export type FinelyOsCatalogViewMode = 'grid' | 'compact' | 'grouped';

const DEFAULT_PAGE_SIZE = 24;

function viewBtn(active: boolean) {
  return `inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
    active ? 'bg-violet-600 text-white shadow-sm' : 'text-white/55 hover:bg-white/[0.06]'
  }`;
}

export function FinelyOsCatalogBrowser({
  items,
  pageSize = DEFAULT_PAGE_SIZE,
  searchPlaceholder = 'Search catalog…',
  groupLabels,
  emptyMessage = 'Nothing matches your filters.',
  selectable = false,
  selectedIds,
  onToggleSelect,
  onItemClick,
  renderTrailing,
  initialView = 'grid',
  showViewToggle = true,
}: {
  items: FinelyOsCatalogItem[];
  pageSize?: number;
  searchPlaceholder?: string;
  groupLabels?: Record<string, string>;
  emptyMessage?: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onItemClick?: (id: string) => void;
  renderTrailing?: (item: FinelyOsCatalogItem) => React.ReactNode;
  initialView?: FinelyOsCatalogViewMode;
  showViewToggle?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [view, setView] = useState<FinelyOsCatalogViewMode>(initialView);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = [item.title, item.subtitle, item.description, ...(item.meta ?? []), ...(item.badges?.map((b) => b.label) ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const grouped = useMemo(() => {
    if (view !== 'grouped') return null;
    const map = new Map<string, FinelyOsCatalogItem[]>();
    for (const item of pageItems) {
      const key = item.groupKey ?? 'other';
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [pageItems, view]);

  const resetPage = (nextQuery: string) => {
    setQuery(nextQuery);
    setPage(0);
  };

  const renderCard = (item: FinelyOsCatalogItem, compact?: boolean) => {
    const accentIndex = item.accentIndex ?? item.title.length;
    const accent = FINELY_OS_KPI_ACCENTS[accentIndex % FINELY_OS_KPI_ACCENTS.length];
    const iconAccents: FinelyOsIconAccent[] = ['violet', 'emerald', 'sky', 'amber', 'rose', 'fuchsia'];
    const selected = selectedIds?.has(item.id);
    const inner = (
      <>
        <div className="flex flex-wrap items-start justify-between gap-3">
          {item.icon ? (
            <FinelyOsIconBadge
              icon={item.icon}
              accent={item.iconAccent ?? iconAccents[accentIndex % iconAccents.length]}
              size={compact ? 14 : 16}
              className={compact ? 'p-2 shrink-0' : 'p-2.5 shrink-0'}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className={`${FINELY_OS_ENTITY_VALUE} ${compact ? 'text-sm line-clamp-1' : 'text-base line-clamp-2'}`}>{item.title}</div>
            {item.subtitle ? <div className="text-[11px] text-violet-300/75 mt-1 font-medium font-mono">{item.subtitle}</div> : null}
          </div>
          {selectable ? (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onToggleSelect?.(item.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 shrink-0 rounded border-violet-400/40 bg-white/[0.07] text-violet-400"
            />
          ) : null}
        </div>
        {item.description && !compact ? <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-2 line-clamp-2`}>{item.description}</p> : null}
        {item.badges?.length ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.badges.map((b) => (
              <span
                key={b.label}
                className={`inline-flex text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  b.className ?? 'border-white/[0.08] bg-white/[0.07] text-white/60'
                }`}
              >
                {b.label}
              </span>
            ))}
          </div>
        ) : null}
        {item.meta?.length ? (
          <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono text-[10px] flex flex-wrap gap-x-2 gap-y-0.5`}>
            {item.meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        ) : null}
        {renderTrailing ? <div className="mt-2">{renderTrailing(item)}</div> : null}
      </>
    );

    const className = `text-left w-full rounded-2xl border transition-all shadow-sm hover:shadow-md backdrop-blur-sm ring-1 ring-inset ${
      compact ? 'p-4 min-h-[4.5rem]' : 'p-5 lg:p-6 min-h-[8.5rem]'
    } ${
      selected
        ? 'border-violet-500/40 bg-violet-500/12 ring-violet-400/25'
        : `${accent} ring-white/[0.08] hover:border-violet-400/35 hover:bg-white/[0.02]`
    } ${onItemClick || selectable ? 'cursor-pointer' : ''}`;

    if (selectable) {
      return (
        <label key={item.id} className={className}>
          {inner}
        </label>
      );
    }

    return (
      <button key={item.id} type="button" onClick={() => onItemClick?.(item.id)} className={className}>
        {inner}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className={FINELY_OS_TOOLBAR}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => resetPage(e.target.value)}
            placeholder={searchPlaceholder}
            className={`w-full pl-9 pr-3 py-2 ${FINELY_OS_ENTITY_INPUT} mt-0`}
          />
        </div>
        <span className={`${FINELY_OS_ENTITY_BODY} text-xs whitespace-nowrap`}>
          {filtered.length} item{filtered.length === 1 ? '' : 's'}
        </span>
        {showViewToggle ? (
          <div className="inline-flex gap-0.5 fc-light-glass-panel fc-light-chrome-panel rounded-xl p-0.5">
            <button type="button" onClick={() => setView('grid')} className={viewBtn(view === 'grid')} title="Grid">
              <Grid3X3 size={12} /> Grid
            </button>
            <button type="button" onClick={() => setView('compact')} className={viewBtn(view === 'compact')} title="Compact">
              <LayoutList size={12} /> Compact
            </button>
            <button type="button" onClick={() => setView('grouped')} className={viewBtn(view === 'grouped')} title="Grouped">
              <Layers size={12} /> Grouped
            </button>
          </div>
        ) : null}
      </div>

      {!filtered.length ? (
        <div className={FINELY_OS_LUXURY_EMPTY}>{emptyMessage}</div>
      ) : view === 'grouped' && grouped ? (
        <div className="space-y-5">
          {grouped.map(([key, groupItems]) => (
            <section key={key}>
              <h3 className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2 flex items-center gap-2`}>
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                {groupLabels?.[key] ?? key.replace(/_/g, ' ')}
                <span className="text-white/40 font-semibold">({groupItems.length})</span>
              </h3>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupItems.map((item) => renderCard(item))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={view === 'compact' ? 'space-y-2' : 'grid sm:grid-cols-2 xl:grid-cols-3 gap-4'}>
          {pageItems.map((item) => renderCard(item, view === 'compact'))}
        </div>
      )}

      {filtered.length > pageSize ? (
        <div className={`${FINELY_OS_LUXURY_PAGINATION} flex-wrap gap-3 px-4 py-3`}>
          <span className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
            Page {safePage + 1} of {totalPages} · showing {pageItems.length} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className={`${FINELY_OS_LUXURY_PAGINATION_BTN} gap-1 px-3 py-1.5 font-semibold`}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className={`${FINELY_OS_LUXURY_PAGINATION_BTN} gap-1 px-3 py-1.5 font-semibold`}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
