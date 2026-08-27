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
  finelyOsGlassShell,
} from './finelyOsLightUi';
import {
  fcAdminCard,
  fcAdminOnSolidBody,
  fcAdminOnSolidMuted,
  fcAdminOnSolidSublabel,
  fcAdminOnSolidValue,
  type FcAdminTone,
} from './finelyOsAdminSurface';

/** Admin solid/glow cards — tones set per item (service type), with rotation fallback. */
export type FinelyOsCatalogCardSurface = 'default' | 'adminSolid';

const ADMIN_TONE_ROTATION: FcAdminTone[] = ['emerald', 'violet', 'sky', 'navy', 'fuchsia', 'rose'];

const ADMIN_SOLID_GLOW: Record<FcAdminTone, string> = {
  neutral:
    'shadow-[0_0_0_1px_rgba(148,163,184,0.32),0_16px_44px_-14px_rgba(15,23,42,0.4),0_0_32px_rgba(148,163,184,0.14)] hover:brightness-105',
  emerald:
    'shadow-[0_0_0_1px_rgba(52,211,153,0.42),0_16px_44px_-12px_rgba(16,185,129,0.58),0_0_36px_rgba(52,211,153,0.26)] hover:shadow-[0_0_0_1px_rgba(52,211,153,0.55),0_18px_48px_-10px_rgba(16,185,129,0.65)] hover:brightness-110',
  gold:
    'shadow-[0_0_0_1px_rgba(251,191,36,0.48),0_16px_44px_-12px_rgba(217,119,6,0.5),0_0_36px_rgba(251,191,36,0.26)] hover:shadow-[0_0_0_1px_rgba(251,191,36,0.6),0_18px_48px_-10px_rgba(217,119,6,0.55)] hover:brightness-105',
  sky:
    'shadow-[0_0_0_1px_rgba(56,189,248,0.42),0_16px_44px_-12px_rgba(14,165,233,0.55),0_0_36px_rgba(56,189,248,0.26)] hover:shadow-[0_0_0_1px_rgba(56,189,248,0.55),0_18px_48px_-10px_rgba(14,165,233,0.6)] hover:brightness-110',
  navy:
    'shadow-[0_0_0_1px_rgba(120,150,200,0.42),0_16px_44px_-12px_rgba(22,40,63,0.6),0_0_36px_rgba(58,86,128,0.32)] hover:shadow-[0_0_0_1px_rgba(140,170,220,0.55),0_18px_48px_-10px_rgba(22,40,63,0.65)] hover:brightness-110',
  teal:
    'shadow-[0_0_0_1px_rgba(45,212,191,0.42),0_16px_44px_-12px_rgba(13,148,136,0.55),0_0_36px_rgba(45,212,191,0.26)] hover:shadow-[0_0_0_1px_rgba(45,212,191,0.55),0_18px_48px_-10px_rgba(13,148,136,0.6)] hover:brightness-110',
  rose:
    'shadow-[0_0_0_1px_rgba(251,113,133,0.42),0_16px_44px_-12px_rgba(225,29,72,0.5),0_0_36px_rgba(251,113,133,0.24)] hover:shadow-[0_0_0_1px_rgba(251,113,133,0.55),0_18px_48px_-10px_rgba(225,29,72,0.55)] hover:brightness-110',
  violet:
    'shadow-[0_0_0_1px_rgba(167,139,250,0.42),0_16px_44px_-12px_rgba(124,58,237,0.5),0_0_36px_rgba(167,139,250,0.24)] hover:shadow-[0_0_0_1px_rgba(167,139,250,0.55),0_18px_48px_-10px_rgba(124,58,237,0.55)] hover:brightness-110',
  fuchsia:
    'shadow-[0_0_0_1px_rgba(217,70,239,0.42),0_16px_44px_-12px_rgba(192,38,211,0.5),0_0_36px_rgba(217,70,239,0.24)] hover:shadow-[0_0_0_1px_rgba(217,70,239,0.55),0_18px_48px_-10px_rgba(192,38,211,0.55)] hover:brightness-110',
};

function adminSolidMetaChipClass(m: string, cardTone: FcAdminTone, darkBed = false): string {
  const s = m.toLowerCase();
  if (s.includes('disputes: unlimited')) {
    return 'border-emerald-200/60 bg-emerald-600/50 text-white font-bold shadow-[0_0_18px_rgba(52,211,153,0.38)]';
  }
  if (s.includes('disputes: not')) {
    return 'border-rose-200/45 bg-rose-600/40 text-white font-semibold';
  }
  if (s.includes('disputes:')) {
    return 'border-sky-200/50 bg-sky-600/42 text-white font-semibold shadow-[0_0_14px_rgba(56,189,248,0.3)]';
  }
  if (s.includes('access:')) {
    return 'border-violet-200/50 bg-violet-600/38 text-white font-semibold';
  }
  if (s.includes('done-for-you') || s.includes('hybrid') || s.includes('diy partner')) {
    return 'border-fuchsia-200/45 bg-fuchsia-600/38 text-white font-semibold';
  }
  if (s.includes('financing')) {
    return 'border-violet-200/45 bg-violet-600/38 text-white font-semibold';
  }
  if (cardTone === 'gold' && !darkBed) {
    return 'border-black/22 bg-black/10 text-[#2b1d05]/88 font-medium';
  }
  return 'border-white/28 bg-black/22 text-white/90 font-medium';
}

export type FinelyOsCatalogBadge = {
  label: string;
  className?: string;
};

export type FinelyOsCatalogItem = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  /** Compact inclusion teasers shown on roomy / adminSolid cards. */
  highlights?: string[];
  badges?: FinelyOsCatalogBadge[];
  meta?: string[];
  groupKey?: string;
  accentIndex?: number;
  /** When cardSurface=adminSolid — differentiates packages by service type. */
  adminTone?: FcAdminTone;
  icon?: LucideIcon;
  iconAccent?: FinelyOsIconAccent;
};

export type FinelyOsCatalogViewMode = 'grid' | 'compact' | 'grouped';

const DEFAULT_PAGE_SIZE = 24;

function viewBtn(active: boolean, ivoryChrome: boolean, restoreChrome = false) {
  if (restoreChrome) {
    return `inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
      active
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-[#0a1628]/65 hover:bg-[#0a1628]/06'
    }`;
  }
  if (ivoryChrome) {
    return `inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
      active
        ? 'bg-[#0a1628] text-[#faf6ee] shadow-sm'
        : 'text-[#0a1628]/55 hover:bg-[#0a1628]/06'
    }`;
  }
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
  titleClassName,
  /** `roomy` = larger pricing-style cards (2-col, taller). */
  density = 'default',
  /** `adminSolid` = fc-admin-solid tones + glow (seeable on ivory/dark shells). */
  cardSurface = 'default',
  /** Personal Credit Restore: light toolbar + no ivory “tent” on catalog chrome. */
  restorePricingChrome = false,
  /** Solid black catalog bed — dark toolbar + colored admin-solid cards (no ivory/white chrome). */
  catalogDarkBed = false,
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
  titleClassName?: string;
  density?: 'default' | 'roomy';
  cardSurface?: FinelyOsCatalogCardSurface;
  restorePricingChrome?: boolean;
  catalogDarkBed?: boolean;
}) {
  const roomy = density === 'roomy';
  const adminSolid = cardSurface === 'adminSolid';
  const darkBed = catalogDarkBed && adminSolid;
  const ivoryChrome = adminSolid && !restorePricingChrome && !darkBed;
  const restoreChrome = restorePricingChrome && adminSolid && !darkBed;
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [view, setView] = useState<FinelyOsCatalogViewMode>(initialView);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = [
        item.title,
        item.subtitle,
        item.description,
        ...(item.highlights ?? []),
        ...(item.meta ?? []),
        ...(item.badges?.map((b) => b.label) ?? []),
      ]
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
    const iconAccents: FinelyOsIconAccent[] = ['violet', 'emerald', 'sky', 'rose', 'fuchsia', 'navy'];
    const adminTone: FcAdminTone =
      item.adminTone ?? ADMIN_TONE_ROTATION[accentIndex % ADMIN_TONE_ROTATION.length];
    const selected = selectedIds?.has(item.id);
    const onDarkSolid = adminSolid && darkBed;
    const titleToneClass = onDarkSolid
      ? 'font-semibold tracking-tight text-white'
      : adminSolid
        ? fcAdminOnSolidValue(adminTone)
        : FINELY_OS_ENTITY_VALUE;
    const bodyToneClass = onDarkSolid
      ? 'text-sm leading-relaxed text-white/82'
      : adminSolid
        ? fcAdminOnSolidBody(adminTone)
        : FINELY_OS_ENTITY_BODY;
    const metaToneClass = onDarkSolid
      ? 'text-[11px] font-semibold uppercase tracking-wide text-white/72'
      : adminSolid
        ? fcAdminOnSolidSublabel(adminTone)
        : FINELY_OS_ENTITY_SUBLABEL;
    const subtitleToneClass = onDarkSolid
      ? 'font-medium font-mono text-white/88'
      : adminSolid
        ? `${fcAdminOnSolidMuted(adminTone)} font-medium font-mono`
        : 'font-medium font-mono text-violet-300/75';
    const defaultBadgeClass = adminSolid
      ? adminTone === 'gold' && !darkBed
        ? 'border-black/20 bg-black/10 text-[#2b1d05]/85'
        : 'border-white/25 bg-white/15 text-white/90'
      : 'border-white/[0.08] bg-white/[0.07] text-white/60';
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
            <div
              className={`${titleToneClass} ${titleClassName ?? ''} ${
                compact ? 'text-sm line-clamp-1' : roomy ? 'text-lg sm:text-xl line-clamp-2' : 'text-base line-clamp-2'
              }`}
            >
              {item.title}
            </div>
            {item.subtitle ? (
              <div className={`${roomy ? 'text-sm' : 'text-[11px]'} mt-1 ${subtitleToneClass}`}>
                {item.subtitle}
              </div>
            ) : null}
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
        {item.description && !compact ? (
          <p className={`${bodyToneClass} ${roomy ? 'text-sm mt-2 line-clamp-2' : 'text-xs mt-2 line-clamp-2'}`}>
            {item.description}
          </p>
        ) : null}
        {item.badges?.length ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.badges.map((b) => (
              <span
                key={b.label}
                className={`inline-flex text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  adminSolid ? defaultBadgeClass : b.className ?? defaultBadgeClass
                }`}
              >
                {b.label}
              </span>
            ))}
          </div>
        ) : null}
        {item.highlights?.length && !compact ? (
          <div
            className={`mt-2.5 rounded-xl border px-2.5 py-2 ${
              adminSolid
                ? adminTone === 'gold' && !darkBed
                  ? 'border-black/18 bg-black/[0.08]'
                  : 'border-white/20 bg-black/25'
                : 'border-white/[0.08] bg-white/[0.03]'
            }`}
          >
            <div
              className={`mb-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${
                onDarkSolid
                  ? 'text-white/90'
                  : adminSolid
                    ? adminTone === 'gold' && !darkBed
                      ? 'text-[#2b1d05]/70'
                      : 'text-white/90'
                    : 'text-violet-300/80'
              }`}
            >
              Included for partners
            </div>
            <ul className={`space-y-1 ${bodyToneClass}`}>
              {item.highlights.slice(0, adminSolid || roomy ? 5 : 4).map((h) => (
                <li key={h} className="flex items-start gap-1.5 text-[11px] sm:text-xs leading-snug">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      adminSolid
                        ? adminTone === 'gold' && !darkBed
                          ? 'bg-[#2b1d05]/55'
                          : 'bg-white/80'
                        : 'bg-violet-400/80'
                    }`}
                    aria-hidden
                  />
                  <span className={`line-clamp-2 ${onDarkSolid ? 'text-white/92' : ''}`}>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {item.meta?.length ? (
          <div className={`mt-2.5 flex flex-wrap gap-1.5 ${adminSolid ? '' : `font-mono text-[10px] ${metaToneClass}`}`}>
            {item.meta.map((m) => (
              <span
                key={m}
                className={`rounded-lg border px-2 py-1 text-[10px] leading-snug ${
                  adminSolid
                    ? adminSolidMetaChipClass(m, adminTone, darkBed)
                    : 'rounded-md border-current/15 opacity-90 px-1.5 py-0.5'
                }`}
              >
                {m}
              </span>
            ))}
          </div>
        ) : null}
        {renderTrailing ? <div className={roomy ? 'mt-3' : 'mt-2'}>{renderTrailing(item)}</div> : null}
      </>
    );

    const padClass = compact
      ? 'p-4 min-h-[4.5rem]'
      : roomy
        ? adminSolid
          ? '!p-4 sm:!p-5 min-h-0'
          : 'p-5 sm:p-6 min-h-[11rem]'
        : 'p-5 lg:p-6 min-h-[8.5rem]';

    const className = adminSolid
      ? `text-left w-full transition-all ${fcAdminCard(padClass, adminTone, 'solid')} ${ADMIN_SOLID_GLOW[adminTone]} ${
          darkBed ? '!text-white' : ''
        } ${selected ? 'ring-2 ring-white/50 brightness-110' : ''} ${onItemClick || selectable ? 'cursor-pointer' : ''}`
      : `text-left w-full rounded-2xl border transition-all shadow-sm hover:shadow-md backdrop-blur-sm ring-1 ring-inset ${padClass} ${
          selected
            ? 'border-violet-500/40 bg-violet-500/12 ring-violet-400/25'
            : `${accent} ring-white/[0.08] hover:border-violet-400/35 hover:bg-white/[0.02]`
        } ${onItemClick || selectable ? 'cursor-pointer' : ''}`;

    if (selectable) {
      return (
        <label key={item.id} className={className} data-catalog-item-id={darkBed ? item.id : undefined}>
          {inner}
        </label>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onItemClick?.(item.id)}
        className={className}
        data-catalog-item-id={darkBed ? item.id : undefined}
      >
        {inner}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div
        className={`${FINELY_OS_TOOLBAR} ${
          darkBed
            ? 'fc-restore-catalog-toolbar !border-white/12 !bg-white/[0.04]'
            : restoreChrome
            ? 'fc-restore-catalog-toolbar !border-[#0a1628]/12 !bg-white/92'
            : ivoryChrome
              ? finelyOsGlassShell('catalog', 'violet')
              : ''
        }`}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              restoreChrome ? 'text-[#0a1628]/45' : ivoryChrome ? 'text-[#0a1628]/40' : 'text-white/40'
            }`}
          />
          <input
            value={query}
            onChange={(e) => resetPage(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className={`w-full pl-9 pr-3 py-2 mt-0 ${
              restoreChrome
                ? 'rounded-lg border border-[#0a1628]/15 bg-white text-[#0a1628] placeholder:text-[#0a1628]/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
                : ivoryChrome
                ? 'rounded-lg border border-violet-300/35 bg-white/70 text-[#0a1628] placeholder:text-[#0a1628]/40 focus:outline-none focus:ring-2 focus:ring-violet-500/25'
                : `${FINELY_OS_ENTITY_INPUT}`
            }`}
          />
        </div>
        <span
          className={`text-xs whitespace-nowrap ${
            restoreChrome ? 'text-[#0a1628]/70' : ivoryChrome ? 'text-[#0a1628]/65' : FINELY_OS_ENTITY_BODY
          }`}
        >
          {filtered.length} item{filtered.length === 1 ? '' : 's'}
        </span>
        {showViewToggle ? (
          <div
            className={`inline-flex gap-0.5 rounded-xl p-0.5 ${
              restoreChrome
                ? 'border border-[#0a1628]/10 bg-[#0a1628]/04'
                : ivoryChrome
                  ? finelyOsGlassShell('inner', 'violet')
                  : 'fc-light-glass-panel fc-light-chrome-panel'
            }`}
          >
            <button
              type="button"
              onClick={() => setView('grid')}
              className={viewBtn(view === 'grid', ivoryChrome, restoreChrome)}
              title="Grid"
            >
              <Grid3X3 size={12} /> Grid
            </button>
            <button
              type="button"
              onClick={() => setView('compact')}
              className={viewBtn(view === 'compact', ivoryChrome, restoreChrome)}
              title="Compact"
            >
              <LayoutList size={12} /> Compact
            </button>
            <button
              type="button"
              onClick={() => setView('grouped')}
              className={viewBtn(view === 'grouped', ivoryChrome, restoreChrome)}
              title="Grouped"
            >
              <Layers size={12} /> Grouped
            </button>
          </div>
        ) : null}
      </div>

      {!filtered.length ? (
        <div className={`${FINELY_OS_LUXURY_EMPTY} ${ivoryChrome ? `${finelyOsGlassShell('catalog', 'violet')} text-[#0a1628]/70` : ''}`}>
          {emptyMessage}
        </div>
      ) : view === 'grouped' && grouped ? (
        <div className="space-y-5">
          {grouped.map(([key, groupItems]) => (
            <section key={key}>
              <h3
                className={`mb-2 flex items-center gap-2 ${
                  restoreChrome
                    ? 'text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0a1628]/60'
                    : ivoryChrome
                      ? 'text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0a1628]/55'
                      : FINELY_OS_ENTITY_SUBLABEL
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${ivoryChrome ? 'bg-violet-500/80' : 'bg-violet-400'}`} />
                {groupLabels?.[key] ?? key.replace(/_/g, ' ')}
                <span className={`font-semibold ${ivoryChrome ? 'text-[#0a1628]/40' : 'text-white/40'}`}>
                  ({groupItems.length})
                </span>
              </h3>
              <div className={roomy ? 'grid sm:grid-cols-1 lg:grid-cols-2 gap-5' : 'grid sm:grid-cols-2 xl:grid-cols-3 gap-4'}>
                {groupItems.map((item) => renderCard(item))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div
          className={
            view === 'compact'
              ? 'space-y-2'
              : roomy
                ? 'grid sm:grid-cols-1 lg:grid-cols-2 gap-5'
                : 'grid sm:grid-cols-2 xl:grid-cols-3 gap-4'
          }
        >
          {pageItems.map((item) => renderCard(item, view === 'compact'))}
        </div>
      )}

      {filtered.length > pageSize ? (
        <div
          className={`${FINELY_OS_LUXURY_PAGINATION} flex-wrap gap-3 px-4 py-3 ${
            darkBed
              ? 'fc-restore-catalog-toolbar !border-white/12 !bg-white/[0.04]'
              : restoreChrome
              ? 'fc-restore-catalog-toolbar !border-[#0a1628]/12 !bg-white/92'
              : ivoryChrome
                ? finelyOsGlassShell('catalog', 'violet')
                : ''
          }`}
        >
          <span className={`text-xs ${restoreChrome || ivoryChrome ? 'text-[#0a1628]/65' : FINELY_OS_ENTITY_BODY}`}>
            Page {safePage + 1} of {totalPages} · showing {pageItems.length} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className={`${FINELY_OS_LUXURY_PAGINATION_BTN} gap-1 px-3 py-1.5 font-semibold ${
                restoreChrome
                  ? '!border-[#0a1628]/15 !bg-white/80 !text-[#0a1628]'
                  : ivoryChrome
                    ? '!border-violet-300/35 !bg-white/55 !text-[#0a1628]'
                    : ''
              }`}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className={`${FINELY_OS_LUXURY_PAGINATION_BTN} gap-1 px-3 py-1.5 font-semibold ${
                restoreChrome
                  ? '!border-[#0a1628]/15 !bg-white/80 !text-[#0a1628]'
                  : ivoryChrome
                    ? '!border-violet-300/35 !bg-white/55 !text-[#0a1628]'
                    : ''
              }`}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
