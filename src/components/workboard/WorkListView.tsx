import React from 'react';
import type { WorkStageDefinition } from '../../domain/settings';
import type { WorkBoardItem } from './types';
import { enabledStages } from './types';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';

function fmtWhen(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function WorkListView({
  stages,
  items,
  onStageChange,
  onOpenItem,
}: {
  stages: WorkStageDefinition[];
  items: WorkBoardItem[];
  onStageChange?: (id: string, stageId: string) => void;
  onOpenItem?: (id: string) => void;
}) {
  const cols = enabledStages(stages);
  const firstCol = cols[0]?.id || 'intake';
  const stageColorById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const s of cols) {
      const c = String((s as any).color || '').trim();
      if (c) m.set(s.id, c);
    }
    return m;
  }, [cols]);

  return (
    <div className="fc-light-glass-panel fc-light-chrome-panel overflow-hidden">
      <div className="grid grid-cols-12 gap-0 px-5 py-3 border-b border-white/[0.08] text-[10px] uppercase tracking-widest text-white/40 font-mono">
        <div className="col-span-4">Item</div>
        <div className="col-span-2">Stage</div>
        <div className="col-span-1">Priority</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Due</div>
        <div className="col-span-1 text-right">Open</div>
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-white/60">No items.</div>
      ) : (
        <FinelyOsPaginatedStack
          items={items}
          pageSize={12}
          emptyMessage="No items."
          itemSpacingClassName="divide-y divide-white/10"
          renderItem={(it) => (
            <div key={it.id} className="px-5 py-4">
              <div className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-4 min-w-0">
                  <div className="text-white font-semibold truncate">{it.title}</div>
                  {it.subtitle ? <div className="mt-1 text-white/60 text-sm truncate">{it.subtitle}</div> : null}
                  <div className="mt-1 flex flex-wrap gap-2">
                    {it.kind ? (
                      <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono">{it.kind}</span>
                    ) : null}
                    {it.tags?.length ? (
                      <span className="text-[9px] uppercase tracking-widest text-white/35 font-mono truncate">
                        {it.tags.join(' • ')}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full border border-white/[0.08]"
                      style={{
                        backgroundColor: stageColorById.get(String(it.stage ?? firstCol)) || 'rgba(255,255,255,0.18)',
                      }}
                      title={stageColorById.get(String(it.stage ?? firstCol)) || ''}
                    />
                  {onStageChange ? (
                    <select
                      value={it.stage ?? firstCol}
                      onChange={(e) => onStageChange(it.id, e.target.value)}
                      className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-[11px]"
                      title="Move stage"
                    >
                      {cols.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-white/70 text-sm">{it.stage ?? '—'}</div>
                  )}
                  </div>
                </div>

                <div className="col-span-1 text-[10px] uppercase font-mono text-white/55">{it.priority ?? '—'}</div>

                <div className="col-span-2 text-white/70 text-sm">{it.status ?? '—'}</div>
                <div className="col-span-2 text-white/60 text-sm">{fmtWhen(it.dueAt)}</div>
                <div className="col-span-1 flex justify-end">
                  {onOpenItem ? (
                    <button
                      type="button"
                      onClick={() => onOpenItem(it.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    >
                      Open
                    </button>
                  ) : (
                    <div className="text-white/40 text-sm">—</div>
                  )}
                </div>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}

