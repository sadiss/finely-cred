import React, { useMemo } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import type { CalendarBookingSettings, CalendarEvent, SlotDuration } from '../../domain/calendar';
import {
  DAYPART_LABELS,
  formatSlotRange,
  generateDaySlots,
  getDayAvailability,
  groupSlotsByDaypart,
  findFirstAvailableDay,
  type BookableSlot,
} from '../../lib/calendarSlots';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { ArrowRight, CalendarX2 } from 'lucide-react';

type Props = {
  dayKey: string | null;
  durationMinutes: SlotDuration;
  existingEvents: CalendarEvent[];
  settings?: CalendarBookingSettings;
  selectedSlot: BookableSlot | null;
  onSelectSlot: (slot: BookableSlot | null) => void;
  recommendedStartAts?: Set<string>;
  embedded?: boolean;
  onJumpNextAvailable?: () => void;
};

export function BookingTimeSlotPicker({
  dayKey,
  durationMinutes,
  existingEvents,
  settings,
  selectedSlot,
  onSelectSlot,
  recommendedStartAts,
  embedded,
  onJumpNextAvailable,
}: Props) {
  const slots = useMemo(() => {
    if (!dayKey) return [];
    return generateDaySlots({ dayKey, durationMinutes, existingEvents, settings });
  }, [dayKey, durationMinutes, existingEvents, settings]);

  const groups = useMemo(() => groupSlotsByDaypart(slots), [slots]);

  const availability = dayKey
    ? getDayAvailability({ dayKey, durationMinutes, existingEvents, settings })
    : null;

  if (!dayKey) {
    return <div className={FINELY_OS_ENTITY_EMPTY}>Select a date to see available time slots.</div>;
  }

  if (availability && !availability.hasSlots) {
    const reason =
      availability.state === 'closed_weekday'
        ? 'This weekday is closed for booking.'
        : availability.state === 'today_closed'
          ? 'Today has no open times — we need at least 24h notice.'
          : availability.state === 'past'
            ? 'This date has passed.'
            : availability.state === 'too_far'
              ? 'This date is outside our booking window.'
              : 'This day is fully booked or blocked.';
    return (
      <div className={`rounded-xl border border-sky-500/35 bg-gradient-to-br from-sky-500/12 via-violet-500/8 to-transparent p-4 space-y-3`}>
        <div className="flex items-start gap-2">
          <CalendarX2 size={18} className="text-sky-300 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-sky-100">No times available this day</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{reason}</p>
          </div>
        </div>
        {onJumpNextAvailable ? (
          <button type="button" onClick={onJumpNextAvailable} className={`${FINELY_OS_SECONDARY_BTN} !text-sky-100 border-sky-400/40`}>
            Jump to next open day <ArrowRight size={12} />
          </button>
        ) : null}
      </div>
    );
  }

  const isWeekend = (() => {
    const d = new Date(`${dayKey}T12:00:00`);
    const dow = d.getDay();
    return !(settings?.allowedWeekdays ?? [1, 2, 3, 4, 5]).includes(dow);
  })();

  if (isWeekend) {
    return (
      <div className={`rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-xs ${FINELY_OS_ENTITY_BODY}`}>
        Weekends are closed — pick a weekday with open slots.
        {onJumpNextAvailable ? (
          <button type="button" onClick={onJumpNextAvailable} className={`mt-2 ${FINELY_OS_SECONDARY_BTN}`}>
            Next open day <ArrowRight size={12} />
          </button>
        ) : null}
      </div>
    );
  }

  const body = (
    <>
      {!embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-violet-300">
            <Clock size={16} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Available times</span>
          </div>
          <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {durationMinutes} min · {settings?.minNoticeHours ?? 24}h notice
          </div>
        </div>
      ) : (
        <div className={`flex flex-wrap items-center justify-between gap-2 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Pick a time</span>
          <span>{settings?.minNoticeHours ?? 24}h lead time · {durationMinutes} min</span>
        </div>
      )}

      {slots.length === 0 ? (
        <div className={FINELY_OS_ENTITY_BODY}>No open slots — same-day booking is not offered. Try another day.</div>
      ) : (
        <div className={`space-y-3 ${embedded ? 'max-h-[280px]' : 'max-h-[340px]'} overflow-y-auto pr-1`}>
          {groups.map(({ daypart, slots: daypartSlots }) => (
            <div key={daypart} className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/45">{DAYPART_LABELS[daypart]}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {daypartSlots.map((slot) => {
                  const active = selectedSlot?.startAt === slot.startAt;
                  const recommended = Boolean(recommendedStartAts?.has(slot.startAt));
                  return (
                    <button
                      key={slot.startAt}
                      type="button"
                      onClick={() => onSelectSlot(active ? null : slot)}
                      className={`relative min-h-[40px] px-2 py-2 rounded-lg border text-[10px] sm:text-[11px] font-semibold whitespace-normal text-center leading-snug transition-all ${
                        active
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                          : recommended
                            ? 'border-emerald-400/55 bg-emerald-500/15 text-emerald-50 hover:bg-emerald-500/22'
                            : 'border-sky-400/35 bg-sky-500/10 text-sky-50 hover:bg-sky-500/18 hover:border-sky-300/50'
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
        <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/12 px-3 py-2 text-xs text-emerald-50">
          Selected: <strong>{formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)}</strong>
        </div>
      ) : dayKey && slots.length > 0 ? (
        <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Tap a time above to confirm your session.</div>
      ) : null}
    </>
  );

  if (embedded) return <div className="space-y-3">{body}</div>;

  return <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>{body}</div>;
}
