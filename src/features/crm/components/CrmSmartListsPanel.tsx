import React, { useMemo } from 'react';
import { Filter } from 'lucide-react';
import { CRM_SMART_LISTS } from '../smartLists/crmSmartLists';
import type { CrmRecord } from '../../../domain/crmRecords';
import {
  FINELY_OS_CATALOG_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_VIEW_TABS,
  finelyOsViewTab,
} from '../../os/finelyOsLightUi';

export function CrmSmartListsPanel({
  records,
  value,
  onChange,
}: {
  records: CrmRecord[];
  value: string;
  onChange: (id: string) => void;
}) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    map.set('all', records.length);
    for (const list of CRM_SMART_LISTS) {
      map.set(list.id, records.filter(list.filter).length);
    }
    return map;
  }, [records]);

  const activeMeta =
    value === 'all'
      ? { label: 'All records', description: 'Full pipeline — no smart filter' }
      : CRM_SMART_LISTS.find((l) => l.id === value) ?? { label: value, description: '' };

  return (
    <div className={`${FINELY_OS_CATALOG_SHELL} space-y-2`}>
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-violet-400 shrink-0" />
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Smart lists</span>
        <span className={`text-xs ml-auto ${FINELY_OS_ENTITY_BODY}`}>{activeMeta.description}</span>
      </div>
      <div className={FINELY_OS_VIEW_TABS}>
        <button type="button" onClick={() => onChange('all')} className={finelyOsViewTab(value === 'all', 'violet')}>
          All ({counts.get('all') ?? 0})
        </button>
        {CRM_SMART_LISTS.map((list) => {
          const count = counts.get(list.id) ?? 0;
          const active = value === list.id;
          return (
            <button
              key={list.id}
              type="button"
              onClick={() => onChange(list.id)}
              title={list.description}
              className={`${finelyOsViewTab(active, 'emerald')} ${count === 0 && !active ? 'opacity-50' : ''}`}
            >
              {list.label} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
