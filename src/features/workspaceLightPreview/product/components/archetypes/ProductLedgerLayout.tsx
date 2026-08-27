import React from 'react';
import { ArrowRight, Folder } from 'lucide-react';
import { ProductStatusPill } from '../ProductUi';
import { deriveLedgerHeaderStats } from './archetypeDerive';
import { ArchetypeEmptyState, ArchetypeSkeleton } from './archetypeChrome';
import type { LedgerColumnDef, ProductLedgerLayoutProps } from './archetypeTypes';

const DEFAULT_COLUMNS: LedgerColumnDef[] = [
  { id: 'meta', label: 'Detail' },
  { id: 'tags', label: 'Tags', hideOnCompact: true },
];

function renderDefaultCell(columnId: string, item: import('../ProductCollectionSurface').ProductCollectionItem) {
  if (columnId === 'tags') {
    return item.tags?.length ? (
      <span className="fc-wlp-arch-ledger-tags">{item.tags.slice(0, 3).map((tag) => <em key={tag}>{tag}</em>)}</span>
    ) : (
      <span className="fc-wlp-arch-ledger-muted">—</span>
    );
  }
  return <span>{item.meta}</span>;
}

/**
 * Ledger archetype — a strong header band over dense scannable rows. Deliberately row-based, but
 * with real column structure, hairline rhythm, and inline instruments instead of a bare bar list.
 */
export function ProductLedgerLayout({
  accent,
  items,
  emptyState,
  loading,
  onOpenItem,
  title = 'Ledger',
  columns = DEFAULT_COLUMNS,
  headerStats,
  onRowAction,
  rowActionLabel = 'Open',
}: ProductLedgerLayoutProps) {
  if (loading) return <ArchetypeSkeleton kind="ledger" accent={accent} />;

  if (!items.length) {
    return (
      <ArchetypeEmptyState
        accent={accent}
        title="No records yet"
        description="Rows will appear here the moment there is something to scan — status, detail, and an action stay inline."
        action={emptyState}
      />
    );
  }

  const stats = headerStats ?? deriveLedgerHeaderStats(items);

  return (
    <div className="fc-wlp-arch-ledger" data-fcm-accent={accent}>
      <div className="fc-wlp-arch-ledger-header fcm-depth fcm-specular" data-bed="dark" data-fcm-accent={accent}>
        <span className="fcm-grain" aria-hidden />
        <span className="fc-wlp-arch-ledger-header-title">{title}</span>
        <div className="fc-wlp-arch-ledger-header-stats">
          {stats.map((stat) => (
            <span key={stat.label} className="fc-wlp-arch-ledger-header-stat">
              <strong>{stat.value}</strong>
              <em>{stat.label}</em>
            </span>
          ))}
          <span className="fc-wlp-arch-ledger-header-stat fc-wlp-arch-ledger-header-stat--total">
            <strong>{items.length}</strong>
            <em>Total</em>
          </span>
        </div>
      </div>

      <div className="fc-wlp-arch-ledger-actionbar fcm-depth fcm-specular" data-bed="dark" data-fcm-accent={accent}>
        <span className="fcm-grain" aria-hidden />
        <span>
          Showing {items.length} record{items.length === 1 ? '' : 's'} · sorted by what needs attention first
        </span>
        {onRowAction ? (
          <button type="button" onClick={() => onRowAction(items[0])}>
            {rowActionLabel} top record
          </button>
        ) : null}
      </div>

      <div className="fc-wlp-arch-ledger-columns" aria-hidden>
        <span>Record</span>
        <span>Status</span>
        {columns.map((column) => (
          <span key={column.id} data-compact-hide={column.hideOnCompact ? 'true' : undefined}>
            {column.label}
          </span>
        ))}
        <span className="fc-wlp-arch-ledger-columns-action">Action</span>
      </div>

      <div className="fc-wlp-arch-ledger-rows">
        {items.map((item, index) => {
          const Icon = item.icon ?? Folder;
          return (
            <div key={item.id} className="fc-wlp-arch-ledger-row" style={{ ['--fc-arch-index' as string]: index }}>
              <button type="button" className="fc-wlp-arch-ledger-row-record" onClick={() => (onOpenItem ? onOpenItem(item) : item.onOpen())}>
                <span className="fc-wlp-arch-ledger-row-icon" data-accent={item.accent}>
                  <Icon size={15} strokeWidth={2} />
                </span>
                <span className="fc-wlp-arch-ledger-row-title">{item.title}</span>
              </button>
              <span className="fc-wlp-arch-ledger-row-status">
                <ProductStatusPill status={item.status} label={item.statusLabel} />
              </span>
              {columns.map((column) => (
                <span
                  key={column.id}
                  className="fc-wlp-arch-ledger-row-cell"
                  data-compact-hide={column.hideOnCompact ? 'true' : undefined}
                >
                  {column.render ? column.render(item) : renderDefaultCell(column.id, item)}
                </span>
              ))}
              <span className="fc-wlp-arch-ledger-row-action">
                <button
                  type="button"
                  onClick={() => (onRowAction ? onRowAction(item) : onOpenItem ? onOpenItem(item) : item.onOpen())}
                >
                  {item.actionLabel ?? rowActionLabel} <ArrowRight size={13} />
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
