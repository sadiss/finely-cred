import React, { useMemo } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import type { CalendarBookingSettings, CalendarEvent, SlotDuration } from '../../domain/calendar';
import { DAYPART_LABELS, generateDaySlots, groupSlotsByDaypart, type BookableSlot } from '../../lib/calendarSlots';
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
  /** Slot startAt ISO strings to badge as "Recommended" (Phase 4 AI ranking). */
  recommendedStartAts?: Set<string>;
};

export function BookingTimeSlotPicker({ dayKey, durationMinutes, existingEvents, settings, selectedSlot, onSelectSlot, recommendedStartAts }: Props) {
  const slots = useMemo(() => {
    if (!dayKey) return [];
    return generateDaySlots({
      dayKey,
      durationMinutes,
      existingEvents,
      settings,
    });
  }, [dayKey, durationMinutes, existingEvents, settings]);

  const groups = useMemo(() => groupSlotsByDaypart(slots), [slots]);

  if (!dayKey) {
    return <div className={FINELY_OS_ENTITY_EMPTY}>Select a date to see available time slots.</div>;
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
    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
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
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {groups.map(({ daypart, slots: daypartSlots }) => (
            <div key={daypart} className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/45">{DAYPART_LABELS[daypart]}</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {daypartSlots.map((slot) => {
                  const active = selectedSlot?.startAt === slot.startAt;
                  const recommended = Boolean(recommendedStartAts?.has(slot.startAt));
                  return (
                    <button
                      key={slot.startAt}
                      type="button"
                      onClick={() => onSelectSlot(active ? null : slot)}
                      className={`relative px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                        active
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-md'
                          : recommended
                            ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15'
                            : 'border-violet-500/30 bg-white/[0.07] text-white/75 hover:bg-violet-500/10 hover:border-violet-400/40'
                      }`}
                    >
                      {recommended && !active ? (
                        <span className="absolute -top-2 -right-1.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-black shadow">
                          <Sparkles size={7} /> Top
                        </span>
                      ) : null}
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
