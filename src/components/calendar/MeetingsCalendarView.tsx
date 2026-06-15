import React, { useMemo, useState } from 'react';
import type { CalendarEvent } from '../../domain/calendar';

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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Props = {
  events: CalendarEvent[];
  selectedDay?: string | null;
  onSelectDay?: (day: string | null) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
  compact?: boolean;
};

/** Month grid styled like Tasks/Projects WorkCalendarView for visual consistency. */
export function MeetingsCalendarView({ events, selectedDay, onSelectDay, onSelectEvent, compact }: Props) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const start = startOfMonth(cursor);
  const end = endOfMonth(cursor);

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.startAt);
      if (Number.isNaN(d.getTime()) || ev.status === 'cancelled') continue;
      if (d < start || d > end) continue;
      const k = isoDayKey(d);
      const arr = m.get(k) ?? [];
      arr.push(ev);
      m.set(k, arr);
    }
    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => a.startAt.localeCompare(b.startAt));
      m.set(k, arr);
    }
    return m;
  }, [events, start, end]);

  const weeks = useMemo(() => {
    const out: Array<{ day: Date; inMonth: boolean }> = [];
    const firstDow = start.getDay();
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - firstDow);
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      out.push({ day: d, inMonth: d.getMonth() === start.getMonth() });
    }
    return out;
  }, [start]);

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const todayKey = isoDayKey(new Date());
  const cellMinH = compact ? 'min-h-[80px]' : 'min-h-[120px]';

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
            onClick={() => setCursor(startOfMonth(new Date()))}
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
            const key = isoDayKey(day);
            const dayEvents = byDay.get(key) ?? [];
            const selected = selectedDay === key;
            const isToday = key === todayKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDay?.(selected ? null : key)}
                className={`${cellMinH} border-t border-r border-white/[0.08] p-3 text-left transition-all ${
                  !inMonth ? 'opacity-40' : selected ? 'bg-amber-500/15 ring-1 ring-inset ring-amber-500/40' : 'hover:bg-white/[0.03]'
                }`}
              >
                <div
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    isToday ? 'text-fuchsia-300' : inMonth ? 'text-white/70' : 'text-white/25'
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, compact ? 2 : 4).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent?.(ev);
                      }}
                      className="w-full rounded-lg fc-light-glass-panel fc-light-chrome-panel border px-2 py-1 text-[11px] text-white/75 truncate text-left"
                      style={{
                        borderLeftWidth: 3,
                        borderLeftStyle: 'solid',
                        borderLeftColor: ev.status === 'confirmed' ? '#f59e0b' : 'rgba(255,255,255,0.18)',
                      }}
                      title={ev.title}
                    >
                      {ev.title}
                    </button>
                  ))}
                  {dayEvents.length > (compact ? 2 : 4) ? (
                    <div className="text-[10px] text-white/40">+{dayEvents.length - (compact ? 2 : 4)} more</div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PreferredDatesPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (dates: string[]) => void;
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const start = startOfMonth(cursor);

  const weeks = useMemo(() => {
    const out: Date[] = [];
    const firstDow = start.getDay();
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - firstDow);
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      out.push(d);
    }
    return out;
  }, [start]);

  const toggle = (key: string) => {
    if (value.includes(key)) onChange(value.filter((x) => x !== key));
    else if (value.length < 6) onChange([...value, key].sort());
  };

  return (
    <div className="fc-light-glass-panel fc-light-chrome-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-white/50 font-black">Pick preferred dates</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setCursor((c) => addMonths(c, -1))} className="px-2 py-1 rounded border border-white/[0.08] text-white/50 text-xs">←</button>
          <button type="button" onClick={() => setCursor((c) => addMonths(c, 1))} className="px-2 py-1 rounded border border-white/[0.08] text-white/50 text-xs">→</button>
        </div>
      </div>
      <div className="text-sm text-white/70">{start.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((day) => {
          const key = isoDayKey(day);
          const picked = value.includes(key);
          const inMonth = day.getMonth() === start.getMonth();
          const past = day < new Date(new Date().toDateString());
          return (
            <button
              key={key}
              type="button"
              disabled={past || !inMonth}
              onClick={() => toggle(key)}
              className={`aspect-square rounded-lg text-xs font-semibold border transition-all disabled:opacity-25 ${
                picked ? 'bg-amber-500 text-black border-amber-300' : inMonth ? 'border-white/[0.08] text-white/70 hover:bg-white/5' : 'border-transparent text-white/30'
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      {value.length > 0 ? (
        <div className="text-xs text-white/50">Selected: {value.join(', ')}</div>
      ) : null}
    </div>
  );
}
