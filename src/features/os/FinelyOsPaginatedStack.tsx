import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_LUXURY_PAGINATION,
  FINELY_OS_LUXURY_PAGINATION_BTN,
  FINELY_OS_ENTITY_SUBLABEL,
} from './finelyOsLightUi';

export function FinelyOsPaginatedStack<T>({
  items,
  pageSize = 8,
  renderItem,
  emptyMessage = 'Nothing here.',
  itemSpacingClassName = 'space-y-2',
}: {
  items: T[];
  pageSize?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  itemSpacingClassName?: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = items.slice(safePage * pageSize, safePage * pageSize + pageSize);

  if (!items.length) {
    return <div className={FINELY_OS_LUXURY_EMPTY}>{emptyMessage}</div>;
  }

  return (
    <div className="space-y-3">
      <div className={itemSpacingClassName}>{slice.map((item, i) => renderItem(item, safePage * pageSize + i))}</div>
      {items.length > pageSize ? (
        <div className={FINELY_OS_LUXURY_PAGINATION}>
          <span className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal font-mono`}>
            Page {safePage + 1} of {totalPages} · {items.length} total
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={safePage <= 0} onClick={() => setPage((p) => p - 1)} className={FINELY_OS_LUXURY_PAGINATION_BTN}>
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className={FINELY_OS_LUXURY_PAGINATION_BTN}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
