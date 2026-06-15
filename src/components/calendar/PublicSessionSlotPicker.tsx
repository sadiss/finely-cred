import React, { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { SlotDuration } from '../../domain/calendar';
import { listCalendarEvents } from '../../data/calendarRepo';
import { getCalendarBookingSettings } from '../../data/calendarSettingsRepo';
import { BookingTimeSlotPicker } from './BookingTimeSlotPicker';
import { generateDaySlots, isoDayKey, type BookableSlot } from '../../lib/calendarSlots';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

type Props = {
  durationMinutes: SlotDuration;
  onDurationChange: (d: SlotDuration) => void;
  selectedDay: string | null;
  onDayChange: (day: string | null) => void;
  selectedSlot: BookableSlot | null;
  onSlotChange: (slot: BookableSlot | null) => void;
};

/** Public-facing date + slot picker (enlightenment session, consultation). */
export function PublicSessionSlotPicker({
  durationMinutes,
  onDurationChange,
  selectedDay,
  onDayChange,
  selectedSlot,
  onSlotChange,
}: Props) {
  const events = listCalendarEvents();
  const settings = getCalendarBookingSettings();
  const [cursor, setCursor] = useState(() => {
    const d = selectedDay ? new Date(`${selectedDay}T12:00:00`) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const dayGrid = useMemo(() => {
    const start = cursor;
    const firstDow = start.getDay();
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - firstDow);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [cursor]);

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className={`space-y-4 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-violet-300">
          <CalendarDays size={18} />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Pick a time slot</span>
        </div>
        <select
          value={durationMinutes}
          onChange={(e) => {
            onDurationChange(Number(e.target.value) as SlotDuration);
            onSlotChange(null);
          }}
          className={`${FINELY_OS_ENTITY_SELECT} !w-auto !py-2 !px-3`}
        >
          <option value={20}>20 min</option>
          <option value={30}>30 min</option>
          <option value={60}>60 min</option>
          <option value={90}>90 min</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className={FINELY_OS_ENTITY_VALUE}>{monthLabel}</div>
        <div className="flex gap-1">
          <button type="button" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className={`${FINELY_OS_SECONDARY_BTN} !px-3 !py-1.5`}>
            Prev
          </button>
          <button
            type="button"
            onClick={() => {
              const today = isoDayKey(new Date());
              onDayChange(today);
              setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
            }}
            className={`${FINELY_OS_SECONDARY_BTN} !px-3 !py-1.5`}
          >
            Today
          </button>
          <button type="button" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className={`${FINELY_OS_SECONDARY_BTN} !px-3 !py-1.5`}>
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0 border border-violet-100/80 rounded-xl overflow-hidden bg-white/50">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className={`py-2 text-center text-[10px] font-black ${FINELY_OS_ENTITY_SUBLABEL} bg-violet-50/60 border-b border-violet-100/70`}>
            {d}
          </div>
        ))}
        {dayGrid.map((day) => {
          const key = isoDayKey(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const past = day < new Date(new Date().toDateString());
          const selected = selectedDay === key;
          const hasSlots = generateDaySlots({ dayKey: key, durationMinutes, existingEvents: events, settings }).length > 0;
          return (
            <button
              key={key}
              type="button"
              disabled={past || !inMonth}
              onClick={() => {
                onDayChange(key);
                onSlotChange(null);
              }}
              className={`min-h-[44px] border-t border-r border-violet-100/60 text-sm font-bold transition-all disabled:opacity-25 ${
                selected
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : hasSlots && inMonth
                    ? 'bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/80'
                    : 'border-white/[0.08] bg-white/[0.05] text-white/70 hover:bg-violet-500/10 hover:border-violet-500/30'
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <BookingTimeSlotPicker
        dayKey={selectedDay}
        durationMinutes={durationMinutes}
        existingEvents={events}
        settings={settings}
        selectedSlot={selectedSlot}
        onSelectSlot={onSlotChange}
      />
    </div>
  );
}
