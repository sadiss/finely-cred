import React, { useMemo } from 'react';
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import type { WorkStageDefinition } from '../../domain/settings';
import type { WorkBoardItem } from './types';
import { enabledStages } from './types';

function truncate(s: string, n: number) {
  const t = String(s || '');
  if (t.length <= n) return t;
  return `${t.slice(0, Math.max(0, n - 1))}…`;
}

export function WorkKanbanBoard({
  stages,
  items,
  onStageChange,
  onOpenItem,
  cardMeta,
  stageFallbackId,
  enableDnd = true,
}: {
  stages: WorkStageDefinition[];
  items: WorkBoardItem[];
  onStageChange?: (id: string, stageId: string) => void;
  onOpenItem?: (id: string) => void;
  cardMeta?: (it: WorkBoardItem) => React.ReactNode;
  stageFallbackId?: string;
  enableDnd?: boolean;
}) {
  const cols = useMemo(() => enabledStages(stages), [stages]);
  const colIds = useMemo(() => new Set(cols.map((c) => c.id)), [cols]);
  const firstCol = cols[0]?.id || stageFallbackId || 'intake';

  const byStage = useMemo(() => {
    const m = new Map<string, WorkBoardItem[]>();
    for (const c of cols) m.set(c.id, []);
    for (const it of items) {
      const st = it.stage && colIds.has(it.stage) ? it.stage : firstCol;
      (m.get(st) ?? m.get(firstCol) ?? [])?.push(it);
    }
    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
      m.set(k, arr);
    }
    return m;
  }, [cols, colIds, firstCol, items]);

  if (!cols.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
        No enabled stages. Go to Admin Settings → WorkBoard to enable columns.
      </div>
    );
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (e: DragEndEvent) => {
    if (!enableDnd || !onStageChange) return;
    const activeId = String(e.active?.id || '');
    if (!activeId.startsWith('item:')) return;
    const itemId = activeId.slice('item:'.length);

    const overId = String(e.over?.id || '');
    if (!overId) return;
    if (overId.startsWith('stage:')) {
      const stageId = overId.slice('stage:'.length);
      onStageChange(itemId, stageId);
      return;
    }
    if (overId.startsWith('item:')) {
      const overItemId = overId.slice('item:'.length);
      const overItem = items.find((x) => x.id === overItemId) ?? null;
      const stageId = overItem?.stage ?? firstCol;
      onStageChange(itemId, stageId);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-[980px]">
          {cols.map((c) => {
            const colItems = byStage.get(c.id) ?? [];
            return <KanbanColumn key={c.id} col={c} items={colItems} />;
          })}
        </div>
      </div>
    </DndContext>
  );

  function KanbanColumn({ col, items }: { col: WorkStageDefinition; items: WorkBoardItem[] }) {
    const droppableId = `stage:${col.id}`;
    const { setNodeRef, isOver } = useDroppable({ id: droppableId, data: { stageId: col.id } });
    return (
      <div className="w-[320px] shrink-0">
        <div
          ref={setNodeRef}
          className={`rounded-2xl border bg-black/30 backdrop-blur-xl p-4 transition-colors ${
            isOver ? 'border-amber-500/35' : 'border-white/10'
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full border border-white/10"
              style={{ backgroundColor: String((col as any).color || 'rgba(255,255,255,0.22)') }}
              title={String((col as any).color || '')}
            />
            <div className="text-[10px] uppercase tracking-widest text-white/35 font-mono">{col.id}</div>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-white font-semibold truncate">{col.label}</div>
              {col.hint ? <div className="mt-1 text-white/50 text-xs">{col.hint}</div> : null}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{items.length}</div>
          </div>

          <div className="mt-3 space-y-2">
            {items.length === 0 ? (
              <div className="text-white/40 text-sm">—</div>
            ) : (
              items.slice(0, 80).map((it) => <KanbanCard key={it.id} it={it} stageColor={String((col as any).color || '')} />)
            )}
          </div>
        </div>
      </div>
    );
  }

  function KanbanCard({ it, stageColor }: { it: WorkBoardItem; stageColor?: string }) {
    const draggableId = `item:${it.id}`;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: draggableId, data: { itemId: it.id } });
    const style: React.CSSProperties = transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : {};
    const allowDrag = Boolean(enableDnd && onStageChange);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2 ${isDragging ? 'opacity-70' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenItem?.(it.id)}
            className="w-full text-left min-w-0"
            title={it.title}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full border border-white/10"
                style={{ backgroundColor: stageColor || 'rgba(255,255,255,0.18)' }}
              />
              <div className="text-white/85 font-semibold text-sm">{truncate(it.title, 92)}</div>
            </div>
            {it.subtitle ? <div className="mt-1 text-white/55 text-xs">{truncate(it.subtitle, 120)}</div> : null}
          </button>
          {allowDrag ? (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="shrink-0 px-2 py-1 rounded-lg border border-white/10 bg-black/30 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.03]"
              title="Drag to move stage"
            >
              Drag
            </button>
          ) : null}
        </div>

        {cardMeta ? <div className="text-[11px] text-white/50">{cardMeta(it)}</div> : null}

        {onStageChange ? (
          <select
            value={it.stage ?? firstCol}
            onChange={(e) => onStageChange(it.id, e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
            title="Move stage"
          >
            {cols.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    );
  }
}

