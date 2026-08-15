import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Globe2, Zap } from 'lucide-react';
import type { CalendarBookingSettings, SlotDuration } from '../../domain/calendar';
import { listCalendarEvents } from '../../data/calendarRepo';
import { getCalendarBookingSettings } from '../../data/calendarSettingsRepo';
import { BookingTimeSlotPicker } from './BookingTimeSlotPicker';
import {
  dayHasBookableSlots,
  detectTimezoneLabel,
  findFirstAvailableDay,
  generateDaySlots,
  getDayAvailability,
  isoDayKey,
  type BookableSlot,
} from '../../lib/calendarSlots';
import { pickRecommendedSlots, type BookingUrgencySignal } from '../../lib/suggestBookingSlots';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowTile,
} from '../../features/os/finelyOsLightUi';

const DURATION_OPTIONS: SlotDuration[] = [15, 30, 60, 90];

type Props = {
  durationMinutes: SlotDuration;
  onDurationChange: (d: SlotDuration) => void;
  selectedDay: string | null;
  onDayChange: (day: string | null) => void;
  selectedSlot: BookableSlot | null;
  onSlotChange: (slot: BookableSlot | null) => void;
  allowedDurations?: SlotDuration[];
  urgencySignal?: BookingUrgencySignal;
  /** Live settings draft for admin preview — defaults to saved booking settings. */
  settingsOverride?: CalendarBookingSettings;
  /** Hide duration chips when duration is controlled elsewhere (e.g. partner booking form). */
  showDurationPicker?: boolean;
};

/** Public-facing date + specific time slot picker — matches internal Calendar OS flow. */
export function PublicSessionSlotPicker({
  durationMinutes,
  onDurationChange,
  selectedDay,
  onDayChange,
  selectedSlot,
  onSlotChange,
  allowedDurations,
  urgencySignal,
  settingsOverride,
  showDurationPicker = true,
}: Props) {
  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const events = useMemo(() => {
    void storeVersion;
    return listCalendarEvents();
  }, [storeVersion]);

  const settings = useMemo(() => {
    void storeVersion;
    return settingsOverride ?? getCalendarBookingSettings();
  }, [settingsOverride, storeVersion]);

  const durations = allowedDurations?.length ? allowedDurations : settings.allowedDurations.length ? settings.allowedDurations : DURATION_OPTIONS;
  const timezoneLabel = useMemo(() => detectTimezoneLabel(), []);
  const [cursor, setCursor] = useState(() => {
    const d = selectedDay ? new Date(`${selectedDay}T12:00:00`) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    if (selectedDay) {
      const d = new Date(`${selectedDay}T12:00:00`);
      setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [selectedDay]);

  useEffect(() => {
    const slotArgs = { durationMinutes, existingEvents: events, settings };
    const resolveFirstAvailable = () =>
      findFirstAvailableDay({
        fromDayKey: isoDayKey(new Date()),
        ...slotArgs,
      });

    if (!selectedDay) {
      const found = resolveFirstAvailable();
      if (!found) return;
      onDayChange(found.dayKey);
      return;
    }

    if (dayHasBookableSlots({ dayKey: selectedDay, ...slotArgs })) return;

    const found = resolveFirstAvailable();
    if (!found || found.dayKey === selectedDay) return;
    onDayChange(found.dayKey);
    onSlotChange(null);
  }, [durationMinutes, events, settings, selectedDay, onDayChange, onSlotChange]);

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

  const todayKey = isoDayKey(new Date());

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-emerald-200/90">
          <CalendarDays size={16} />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Choose date &amp; time</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
            <Globe2 size={12} /> {timezoneLabel}
          </span>
          <button type="button" onClick={jumpToFirstAvailable} className={`${FINELY_OS_SECONDARY_BTN} !px-3 !py-1.5`}>
            <Zap size={12} /> Soonest open
          </button>
        </div>
      </div>

      <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
        Pick a specific time (e.g. 5:00 PM). Same-day and next-two-day booking are not offered — earliest dates open {settings.minAdvanceDays} calendar days out, with at least {settings.minNoticeHours}h notice.
      </p>

      {showDurationPicker && durations.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
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
                className={`px-2.5 py-1 text-[10px] font-bold ${finelyOsGlowTile(active ? 'emerald' : 'sky', active)}`}
              >
                {d} min
              </button>
            );
          })}
        </div>
      ) : null}

      <div className={`${finelyOsCatalogCard('sky')} !p-3 fc-surface-harmony bg-gradient-to-br from-sky-500/[0.08] via-violet-500/[0.04] to-transparent`}>
        <div className="grid md:grid-cols-12 gap-4 items-start">
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>{monthLabel}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className={`${FINELY_OS_SECONDARY_BTN} !px-2 !py-1 text-[10px]`}>
                  Prev
                </button>
                <button type="button" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className={`${FINELY_OS_SECONDARY_BTN} !px-2 !py-1 text-[10px]`}>
                  Next
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 rounded-xl border border-sky-400/25 bg-sky-950/20 p-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={`${d}-${i}`} className={`py-1 text-center text-[9px] font-black ${FINELY_OS_ENTITY_SUBLABEL} text-sky-200/70`}>
                  {d}
                </div>
              ))}
              {dayGrid.map((day) => {
                const key = isoDayKey(day);
                const inMonth = day.getMonth() === cursor.getMonth();
                const avail = getDayAvailability({ dayKey: key, durationMinutes, existingEvents: events, settings });
                const selected = selectedDay === key;
                const isToday = key === todayKey;
                const open = inMonth && avail.hasSlots;
                const unavailable = inMonth && !avail.hasSlots && avail.state !== 'past';

                let cellClass = 'min-h-[38px] text-xs font-semibold transition-all rounded-md border ';
                if (!inMonth || avail.state === 'past') {
                  cellClass += 'border-transparent text-white/20 bg-white/[0.02] cursor-not-allowed';
                } else if (selected && open) {
                  cellClass += 'border-emerald-300 bg-gradient-to-b from-emerald-500 to-teal-600 text-white shadow-[0_0_10px_rgba(52,211,153,0.4)]';
                } else if (open) {
                  cellClass += 'border-emerald-400/45 bg-emerald-500/18 text-emerald-50 hover:bg-emerald-500/28';
                } else if (isToday && unavailable) {
                  cellClass += 'border-amber-400/40 bg-amber-500/12 text-amber-100/90 cursor-not-allowed';
                } else if (unavailable) {
                  cellClass += 'border-violet-500/25 bg-violet-500/8 text-violet-200/45 cursor-not-allowed line-through decoration-violet-300/40';
                } else {
                  cellClass += 'border-transparent text-white/30';
                }

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!open}
                    title={open ? 'Open' : isToday ? 'Today — no openings' : 'Not available'}
                    onClick={() => {
                      if (!open) return;
                      onDayChange(key);
                      onSlotChange(null);
                    }}
                    className={cellClass}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 text-[9px] text-white/50">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500/60 border border-emerald-400/50" /> Open</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-violet-500/25 border border-violet-400/30" /> Unavailable</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-500/30 border border-amber-400/40" /> Today closed</span>
            </div>
          </div>

          <div className="md:col-span-7 min-w-0">
            <BookingTimeSlotPicker
              embedded
              dayKey={selectedDay}
              durationMinutes={durationMinutes}
              existingEvents={events}
              settings={settings}
              selectedSlot={selectedSlot}
              onSelectSlot={onSlotChange}
              recommendedStartAts={recommendedStartAts}
              onJumpNextAvailable={jumpToFirstAvailable}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
