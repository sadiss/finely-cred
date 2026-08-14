import React, { useMemo, useState } from 'react';
import { CalendarDays, Globe2, Zap } from 'lucide-react';
import type { SlotDuration } from '../../domain/calendar';
import { listCalendarEvents } from '../../data/calendarRepo';
import { getCalendarBookingSettings } from '../../data/calendarSettingsRepo';
import { BookingTimeSlotPicker } from './BookingTimeSlotPicker';
import {
  detectTimezoneLabel,
  findFirstAvailableDay,
  generateDaySlots,
  isoDayKey,
  type BookableSlot,
} from '../../lib/calendarSlots';
import { pickRecommendedSlots, type BookingUrgencySignal } from '../../lib/suggestBookingSlots';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowTile,
} from '../../features/os/finelyOsLightUi';

const DURATION_OPTIONS: SlotDuration[] = [20, 30, 60, 90];

type Props = {
  durationMinutes: SlotDuration;
  onDurationChange: (d: SlotDuration) => void;
  selectedDay: string | null;
  onDayChange: (day: string | null) => void;
  selectedSlot: BookableSlot | null;
  onSlotChange: (slot: BookableSlot | null) => void;
  /** Restrict the duration chip row to specific allowed durations (defaults to all four). */
  allowedDurations?: SlotDuration[];
  /** Urgency/lead-score signal used to badge "Recommended" slots (Phase 4 AI ranking). */
  urgencySignal?: BookingUrgencySignal;
};

/** Public-facing date + slot picker (enlightenment session, consultation) — Calendly-grade layout. */
export function PublicSessionSlotPicker({
  durationMinutes,
  onDurationChange,
  selectedDay,
  onDayChange,
  selectedSlot,
  onSlotChange,
  allowedDurations,
  urgencySignal,
}: Props) {
  const events = listCalendarEvents();
  const settings = getCalendarBookingSettings();
  const durations = allowedDurations?.length ? allowedDurations : DURATION_OPTIONS;
  const timezoneLabel = useMemo(() => detectTimezoneLabel(), []);
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

  const daySlots = useMemo(() => {
    if (!selectedDay) return [];
    return generateDaySlots({ dayKey: selectedDay, durationMinutes, existingEvents: events, settings });
  }, [selectedDay, durationMinutes, events, settings]);

  const recommendedStartAts = useMemo(
    () => pickRecommendedSlots(daySlots, urgencySignal),
    [daySlots, urgencySignal],
  );

  const jumpToFirstAvailable = () => {
    const found = findFirstAvailableDay({ fromDayKey: isoDayKey(new Date()), durationMinutes, existingEvents: events, settings });
    if (!found) return;
    onDayChange(found.dayKey);
    onSlotChange(found.slots[0] ?? null);
    const d = new Date(`${found.dayKey}T12:00:00`);
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  return (
    <div className={`space-y-4 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-violet-300">
          <CalendarDays size={18} />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Pick a time slot</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold text-white/50`}>
            <Globe2 size={12} /> {timezoneLabel}
          </div>
          <button type="button" onClick={jumpToFirstAvailable} className={`${FINELY_OS_SECONDARY_BTN} !px-3 !py-1.5`}>
            <Zap size={12} /> First available
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Duration</div>
        <div className="flex flex-wrap gap-2">
          {durations.map((d) => {
            const active = d === durationMinutes;
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  onDurationChange(d);
                  onSlotChange(null);
                }}
                className={`px-3 py-1.5 text-[11px] font-bold ${finelyOsGlowTile(active ? 'amber' : 'violet', active)} ${active ? 'text-amber-100' : 'text-white/70'}`}
              >
                {d} min
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-3 items-start">
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className={FINELY_OS_ENTITY_VALUE}>{monthLabel}</div>
            <div className="flex gap-1">
              <button type="button" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className={`${FINELY_OS_SECONDARY_BTN} !px-3 !py-1.5`}>
                Prev
              </button>
              <button
                type="button"
                onClick={() => {
                  const todayKey = isoDayKey(new Date());
                  onDayChange(todayKey);
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
              const beyondHorizon = (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dayStart = new Date(day);
                dayStart.setHours(0, 0, 0, 0);
                const daysOut = Math.round((dayStart.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
                return daysOut > settings.maxAdvanceDays;
              })();
              const selected = selectedDay === key;
              const hasSlots = !past && !beyondHorizon && generateDaySlots({ dayKey: key, durationMinutes, existingEvents: events, settings }).length > 0;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={past || !inMonth || beyondHorizon}
                  onClick={() => {
                    onDayChange(key);
                    onSlotChange(null);
                  }}
                  className={`min-h-[40px] border-t border-r border-violet-100/60 text-sm font-bold transition-all disabled:opacity-25 ${
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
          <div className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Slots offered up to {settings.maxAdvanceDays} days out.</div>
        </div>

        <div className="lg:col-span-7">
          <BookingTimeSlotPicker
            dayKey={selectedDay}
            durationMinutes={durationMinutes}
            existingEvents={events}
            settings={settings}
            selectedSlot={selectedSlot}
            onSelectSlot={onSlotChange}
            recommendedStartAts={recommendedStartAts}
          />
        </div>
      </div>
    </div>
  );
}
