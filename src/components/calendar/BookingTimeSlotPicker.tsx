import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';
import type { CalendarBookingSettings, CalendarEvent, SlotDuration } from '../../domain/calendar';
import { generateDaySlots, type BookableSlot } from '../../lib/calendarSlots';
import { isoDayKey } from '../../lib/calendarSlots';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE_SUCCESS,
} from '../../features/os/finelyOsLightUi';

type Props = {
  dayKey: string | null;
  durationMinutes: SlotDuration;
  existingEvents: CalendarEvent[];
  settings?: CalendarBookingSettings;
  selectedSlot: BookableSlot | null;
  onSelectSlot: (slot: BookableSlot | null) => void;
};

export function BookingTimeSlotPicker({ dayKey, durationMinutes, existingEvents, settings, selectedSlot, onSelectSlot }: Props) {
  const slots = useMemo(() => {
    if (!dayKey) return [];
    return generateDaySlots({
      dayKey,
      durationMinutes,
      existingEvents,
      settings,
    });
  }, [dayKey, durationMinutes, existingEvents, settings]);

  if (!dayKey) {
    return <div className={FINELY_OS_ENTITY_EMPTY}>Select a date on the calendar to see available time slots.</div>;
  }

  const today = isoDayKey(new Date());
  const isWeekend = (() => {
    const d = new Date(`${dayKey}T12:00:00`);
    const dow = d.getDay();
    return !(settings?.allowedWeekdays ?? [1, 2, 3, 4, 5]).includes(dow);
  })();

  if (isWeekend) {
    return <div className={FINELY_OS_ENTITY_EMPTY}>This day is closed in calendar settings — pick an available day.</div>;
  }

  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-violet-300">
          <Clock size={16} />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Available times</span>
        </div>
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          {durationMinutes} min · {settings?.minNoticeHours ?? 0}h notice · {dayKey === today ? 'Today' : dayKey}
        </div>
      </div>

      {slots.length === 0 ? (
        <div className={FINELY_OS_ENTITY_BODY}>
          No open slots this day — existing meetings, blocked windows, same-day rules, or next-day cutoff may be closing it.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[280px] overflow-y-auto pr-1">
          {slots.map((slot) => {
            const active = selectedSlot?.startAt === slot.startAt;
            return (
              <button
                key={slot.startAt}
                type="button"
                onClick={() => onSelectSlot(active ? null : slot)}
                className={`px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-md'
                    : 'border-violet-500/30 bg-white/[0.07] text-white/75 hover:bg-violet-500/10 hover:border-violet-400/40'
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      )}

      {selectedSlot ? (
        <div className={FINELY_OS_NOTICE_SUCCESS}>
          Selected: <strong>{selectedSlot.label}</strong> ({durationMinutes} min)
        </div>
      ) : null}
    </div>
  );
}
