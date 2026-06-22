import React, { useState } from 'react';
import { FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_LUXURY_EMPTY } from '../os/finelyOsLightUi';

/** Compact card grid instead of long paginated vertical lists. */
export function PartnerCompactGrid<T>({
  items,
  renderItem,
  initialShow = 6,
  columnsClassName = 'grid sm:grid-cols-2 xl:grid-cols-3 gap-3',
  emptyMessage = 'Nothing here.',
  getKey,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  initialShow?: number;
  columnsClassName?: string;
  emptyMessage?: string;
  getKey?: (item: T, index: number) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!items.length) {
    return <div className={FINELY_OS_LUXURY_EMPTY}>{emptyMessage}</div>;
  }

  const visible = expanded ? items : items.slice(0, initialShow);

  return (
    <div className="space-y-3">
      <div className={columnsClassName}>
        {visible.map((item, i) => (
          <React.Fragment key={getKey ? getKey(item, i) : i}>{renderItem(item, i)}</React.Fragment>
        ))}
      </div>
      {items.length > initialShow ? (
        <div className="flex items-center justify-between gap-3">
          <span className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>
            Showing {visible.length} of {items.length}
          </span>
          <button
            type="button"
            className="text-xs font-semibold text-violet-300 hover:text-violet-200 underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Show fewer' : `Show all ${items.length}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
