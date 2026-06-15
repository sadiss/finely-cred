import React, { useMemo, useState } from 'react';
import type { WorkBoardItem } from './types';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}
function isoDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function WorkCalendarView({
  items,
  dateForItem,
  emptyHint,
  stageColorById,
}: {
  items: WorkBoardItem[];
  dateForItem: (it: WorkBoardItem) => string | undefined;
  emptyHint?: string;
  stageColorById?: Record<string, string>;
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const start = startOfMonth(cursor);
  const end = endOfMonth(cursor);

  const byDay = useMemo(() => {
    const m = new Map<string, WorkBoardItem[]>();
    for (const it of items) {
      const iso = dateForItem(it);
      if (!iso) continue;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) continue;
      if (d < start || d > end) continue;
      const k = isoDayKey(d);
      const arr = m.get(k) ?? [];
      arr.push(it);
      m.set(k, arr);
    }
    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
      m.set(k, arr);
    }
    return m;
  }, [dateForItem, end, items, start]);

  const weeks = useMemo(() => {
    const out: Array<{ day: Date; inMonth: boolean }> = [];
    const firstDow = start.getDay(); // 0..6 (Sun..Sat)
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - firstDow);
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      out.push({ day: d, inMonth: d.getMonth() === start.getMonth() });
    }
    return out;
  }, [start]);

  const monthLabel = useMemo(() => {
    try {
      return cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    } catch {
      return `${cursor.getFullYear()}-${cursor.getMonth() + 1}`;
    }
  }, [cursor]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-white font-semibold">{monthLabel}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            className="px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setCursor(() => startOfMonth(new Date()))}
            className="px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="px-3 py-2 rounded-xl border border-white/[0.08] bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
          >
            Next
          </button>
        </div>
      </div>

      <div className="fc-light-glass-panel fc-light-chrome-panel overflow-hidden">
        <div className="grid grid-cols-7 gap-0 border-b border-white/[0.08]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {weeks.map(({ day, inMonth }) => {
            const k = isoDayKey(day);
            const dayItems = byDay.get(k) ?? [];
            return (
              <div key={k} className="min-h-[120px] border-t border-white/[0.08] border-r border-white/[0.08] p-3">
                <div className={`text-[10px] font-black uppercase tracking-widest ${inMonth ? 'text-white/70' : 'text-white/25'}`}>
                  {day.getDate()}
                </div>
                <div className="mt-2 space-y-1">
                  {dayItems.slice(0, 4).map((it) => (
                    <div
                      key={it.id}
                      className="rounded-lg fc-light-glass-panel fc-light-chrome-panel border px-2 py-1 text-[11px] text-white/75 truncate"
                      style={{
                        borderLeftWidth: 3,
                        borderLeftStyle: 'solid',
                        borderLeftColor:
                          (stageColorById && it.stage && stageColorById[it.stage]) ? stageColorById[it.stage] : 'rgba(255,255,255,0.18)',
                      }}
                      title={it.title}
                    >
                      {it.title}
                    </div>
                  ))}
                  {dayItems.length > 4 ? (
                    <div className="text-[10px] text-white/40">+{dayItems.length - 4} more</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-white/45 text-sm">{emptyHint ?? 'No items.'}</div>
      ) : null}
    </div>
  );
}

