import React, { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import type { CalendarBookingSettings, ConsultationTopic, SlotDuration } from '../../domain/calendar';
import { bookPartnerConsultationSlot, createConsultationRequest, listCalendarEvents } from '../../data/calendarRepo';
import { BookingTimeSlotPicker } from './BookingTimeSlotPicker';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { isoDayKey, type BookableSlot, slotDurationOptions, formatSlotRange } from '../../lib/calendarSlots';

const TOPICS: Array<{ id: ConsultationTopic; label: string; desc: string }> = [
  { id: 'enlightenment', label: 'Strategy call', desc: 'Free 60-minute call — map your next moves.' },
  { id: 'credit_restore', label: 'Credit restore', desc: 'Disputes, tradelines, bureau strategy.' },
  { id: 'business_build', label: 'Business build', desc: 'Fundability, vendors, entity readiness.' },
  { id: 'debt_summons', label: 'Debt & summons', desc: 'Validation, SOL, summons workflow.' },
  { id: 'identity_theft', label: 'Identity theft', desc: 'Freezes, fraud alerts, blocking items.' },
  { id: 'billing', label: 'Billing', desc: 'Plan, agreements, entitlements.' },
  { id: 'affiliate', label: 'Affiliate', desc: 'Program onboarding and terms.' },
  { id: 'other', label: 'Other', desc: 'General support and guidance.' },
];

type Props = {
  partnerId: string;
  settings: CalendarBookingSettings;
  onBooked?: () => void;
};

export function MeetingBookingPanel({ partnerId, settings, onBooked }: Props) {
  const allEvents = listCalendarEvents();
  const durations = settings.allowedDurations.length ? settings.allowedDurations : slotDurationOptions();

  const [mode, setMode] = useState<'instant' | 'request'>('instant');
  const [topic, setTopic] = useState<ConsultationTopic>('enlightenment');
  const [duration, setDuration] = useState<SlotDuration>(settings.defaultDuration);
  const [dayKey, setDayKey] = useState<string | null>(isoDayKey(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [details, setDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [availability, setAvailability] = useState('');
  const [voiceNote, setVoiceNote] = useState<{ blobRef: string; mimeType: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickDay = (key: string) => {
    setDayKey(key);
    setSelectedSlot(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setBusy(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (mode === 'instant') {
        if (!selectedSlot) {
          setErr('Pick a time slot to confirm your session.');
          return;
        }
        if (!meetingAgenda.trim()) {
          setErr('Add a meeting agenda so your case team is prepared.');
          return;
        }
        bookPartnerConsultationSlot({
          partnerId,
          topic,
          slotStartAt: selectedSlot.startAt,
          slotEndAt: selectedSlot.endAt,
          slotDurationMinutes: duration,
          timezone: tz,
          meetingAgenda: meetingAgenda.trim(),
          notes: notes.trim() || undefined,
          details: details.trim() || undefined,
          voiceNoteBlobRef: voiceNote?.blobRef,
          voiceNoteMimeType: voiceNote?.mimeType,
        });
        setOk(`Confirmed! ${formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)} — video room is ready on your calendar.`);
        setMeetingAgenda('');
        setDetails('');
        setNotes('');
        setVoiceNote(null);
        setSelectedSlot(null);
        onBooked?.();
      } else {
        if (!availability.trim()) {
          setErr('Describe when you are available, or switch to instant booking.');
          return;
        }
        createConsultationRequest({
          partnerId,
          topic,
          availabilityNotes: availability.trim(),
          preferredDates: dayKey ? [dayKey] : undefined,
          timezone: tz,
          notes: notes.trim() || undefined,
          meetingAgenda: meetingAgenda.trim() || undefined,
          details: details.trim() || undefined,
          preferredSlotMinutes: duration,
          voiceNoteBlobRef: voiceNote?.blobRef,
          voiceNoteMimeType: voiceNote?.mimeType,
        });
        setOk('Request sent — your case team will confirm a slot.');
        setAvailability('');
        onBooked?.();
      }
    } catch (ex: unknown) {
      setErr((ex as Error)?.message || 'Could not book session.');
    } finally {
      setBusy(false);
    }
  };

  const monthStart = useMemo(() => {
    const d = dayKey ? new Date(`${dayKey}T12:00:00`) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [dayKey]);

  const dayGrid = useMemo(() => {
    const start = monthStart;
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
  }, [monthStart]);

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="inline-flex items-center gap-1 fc-light-glass-panel fc-light-chrome-panel p-1">
        <button
          type="button"
          onClick={() => setMode('instant')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === 'instant' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          Pick a time
        </button>
        <button
          type="button"
          onClick={() => setMode('request')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === 'request' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          Request custom
        </button>
      </div>

      {ok ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100 text-sm">{ok}</div>
      ) : null}
      {err ? (
        <div className="rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/10 p-4 text-fuchsia-100 text-sm">{err}</div>
      ) : null}

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
            <div className="inline-flex items-center gap-2 text-violet-400">
              <CalendarDays size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Select date</span>
            </div>
            <div className="text-sm text-white/60">{monthStart.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <div className="grid grid-cols-7 gap-0 border border-white/[0.08] rounded-xl overflow-hidden">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={`${d}-${i}`} className="px-1 py-2 text-[9px] uppercase tracking-widest text-white/40 text-center bg-fc-input border-b border-white/[0.08]">
                  {d}
                </div>
              ))}
              {dayGrid.map((day) => {
                const key = isoDayKey(day);
                const inMonth = day.getMonth() === monthStart.getMonth();
                const past = day < new Date(new Date().toDateString());
                const selected = dayKey === key;
                const isToday = key === isoDayKey(new Date());
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={past || !inMonth}
                    onClick={() => pickDay(key)}
                    className={`min-h-[44px] border-t border-r border-white/[0.08] text-sm font-semibold transition-all disabled:opacity-25 ${
                      selected ? 'bg-amber-500 text-black' : isToday ? 'bg-fuchsia-500/15 text-fuchsia-200' : inMonth ? 'bg-white/[0.05] text-white/75 hover:bg-white/[0.04]' : 'bg-white/[0.03] text-white/25'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {mode === 'instant' ? (
            <BookingTimeSlotPicker
              dayKey={dayKey}
              durationMinutes={duration}
              existingEvents={allEvents}
              settings={settings}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
          ) : null}
        </div>

        <div className="lg:col-span-7 fc-light-glass-panel fc-light-chrome-panel p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as ConsultationTopic)}
                className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                {TOPICS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-white/50 text-xs">{TOPICS.find((t) => t.id === topic)?.desc}</div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => {
                  setDuration(Number(e.target.value) as SlotDuration);
                  setSelectedSlot(null);
                }}
                className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                {durations.map((d) => (
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100 leading-relaxed">
            Booking rules: {settings.minNoticeHours}h minimum notice, no next-day booking after {settings.cutoffHourPreviousDay}:00,
            working hours {settings.startHour}:00–{settings.endHour}:00, and blocked internal slots are hidden automatically.
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
              Meeting agenda {mode === 'instant' ? '(required)' : ''}
            </label>
            <textarea
              value={meetingAgenda}
              onChange={(e) => setMeetingAgenda(e.target.value)}
              rows={3}
              placeholder="What should we cover? Dispute round, funding readiness, documents review…"
              className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">More details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              placeholder="Context, urgency, links to documents, bureau targets…"
              className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything else for your case manager"
              className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
            />
          </div>

          {mode === 'request' ? (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Availability</label>
              <textarea
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                rows={2}
                placeholder="Example: Mon–Wed after 2pm ET, or flexible mornings"
                className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
              />
            </div>
          ) : null}

          <VoiceNoteRecorder partnerId={partnerId} value={voiceNote} onChange={setVoiceNote} />

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-50"
          >
            {mode === 'instant' ? 'Confirm session' : 'Submit request'} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </form>
  );
}
