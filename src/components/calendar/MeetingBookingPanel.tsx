import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { CalendarBookingSettings, ConsultationTopic, SlotDuration } from '../../domain/calendar';
import { bookPartnerConsultationSlot, createConsultationRequest } from '../../data/calendarRepo';
import { PublicSessionSlotPicker } from './PublicSessionSlotPicker';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { VoiceTranscriptField } from './VoiceTranscriptField';
import { type BookableSlot, slotDurationOptions, formatSlotRange } from '../../lib/calendarSlots';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsGlowTile,
} from '../../features/os/finelyOsLightUi';

const BOOKING_TIME_BOX = `${finelyOsCatalogCard('sky')} !p-5 sm:!p-6 lg:!p-7 min-w-0 overflow-hidden fc-surface-harmony`;
const BOOKING_DETAILS_BOX = `${finelyOsCatalogCard('violet')} !p-5 sm:!p-6 lg:!p-7 min-w-0 overflow-hidden fc-surface-harmony`;

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
  const durations = settings.allowedDurations.length ? settings.allowedDurations : slotDurationOptions();

  const [mode, setMode] = useState<'instant' | 'request'>('instant');
  const [topic, setTopic] = useState<ConsultationTopic>('enlightenment');
  const [duration, setDuration] = useState<SlotDuration>(settings.defaultDuration);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [details, setDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [availability, setAvailability] = useState('');
  const [voiceNote, setVoiceNote] = useState<{ blobRef: string; mimeType: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  return (
    <form onSubmit={submit} className="space-y-6 min-w-0 overflow-x-clip">
      <div className="flex flex-col sm:flex-row items-stretch gap-1 fc-light-glass-panel fc-light-chrome-panel p-1 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setMode('instant')}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-normal text-center leading-snug ${
            mode === 'instant' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          Pick a time
        </button>
        <button
          type="button"
          onClick={() => setMode('request')}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-normal text-center leading-snug ${
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 items-start w-full min-w-0">
        <section className={`${BOOKING_TIME_BOX} space-y-5`} aria-labelledby="booking-time-heading">
          <header className="space-y-1.5 border-b border-white/10 pb-4">
            <h3 id="booking-time-heading" className={FINELY_OS_ENTITY_VALUE}>
              {mode === 'instant' ? 'Pick date & time' : 'Preferred date'}
            </h3>
            <p className={`text-sm leading-relaxed ${FINELY_OS_ENTITY_SUBLABEL}`}>
              {mode === 'instant'
                ? 'Choose an open day, then select a specific time slot. Your session locks instantly.'
                : 'Optional: pick a preferred day. Describe your availability in the session details box.'}
            </p>
          </header>

          <div className="space-y-4 min-w-0">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Duration</label>
              <div className="flex flex-wrap gap-2">
                {durations.map((d) => {
                  const active = d === duration;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDuration(d);
                        setSelectedSlot(null);
                      }}
                      className={`px-3 py-2 min-h-[44px] text-[10px] font-bold ${finelyOsGlowTile(active ? 'amber' : 'sky', active)} ${active ? 'text-amber-100' : 'text-white/70'}`}
                    >
                      {d} min
                    </button>
                  );
                })}
              </div>
            </div>

            <PublicSessionSlotPicker
              durationMinutes={duration}
              onDurationChange={(d) => {
                setDuration(d);
                setSelectedSlot(null);
              }}
              selectedDay={dayKey}
              onDayChange={setDayKey}
              selectedSlot={selectedSlot}
              onSlotChange={setSelectedSlot}
              allowedDurations={durations}
              settingsOverride={settings}
              showDurationPicker={false}
              embeddedInPanel
            />

            {mode === 'instant' && selectedSlot ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 leading-relaxed break-words">
                Selected: <strong>{formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)}</strong>
              </div>
            ) : null}
          </div>
        </section>

        <section className={`${BOOKING_DETAILS_BOX} space-y-5`} aria-labelledby="booking-details-heading">
          <header className="space-y-1.5 border-b border-white/10 pb-4">
            <h3 id="booking-details-heading" className={FINELY_OS_ENTITY_VALUE}>
              Session details
            </h3>
            <p className={`text-sm leading-relaxed ${FINELY_OS_ENTITY_SUBLABEL}`}>
              Topic, agenda, and context so your case team is prepared before the call.
            </p>
          </header>

        <div className="space-y-5 min-w-0">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Topic</label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => {
                const active = t.id === topic;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopic(t.id)}
                    className={`px-2.5 py-2 min-h-[44px] text-[10px] font-bold whitespace-normal text-left leading-snug ${finelyOsGlowTile(active ? 'violet' : 'sky', active)} ${active ? 'text-violet-100' : 'text-white/70'}`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-white/55 text-xs leading-relaxed">{TOPICS.find((t) => t.id === topic)?.desc}</div>
          </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100 leading-relaxed break-words">
          Booking rules: {settings.minNoticeHours}h minimum notice, {settings.minAdvanceDays} day minimum advance, no next-day booking after {settings.cutoffHourPreviousDay}:00,
          working hours {settings.startHour}:00–{settings.endHour}:00, and blocked internal slots are hidden automatically.
        </div>

        <VoiceTranscriptField
          label={`Meeting agenda ${mode === 'instant' ? '(required)' : ''}`}
          value={meetingAgenda}
          onChange={setMeetingAgenda}
          rows={3}
          accent="violet"
          placeholder="What should we cover? Dispute round, funding readiness, documents review…"
        />

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">More details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            placeholder="Context, urgency, links to documents, bureau targets…"
            className="w-full min-w-0 bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 resize-y"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Anything else for your case manager"
            className="w-full min-w-0 bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 resize-y"
          />
        </div>

        {mode === 'request' ? (
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Availability</label>
            <textarea
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              rows={3}
              placeholder="Example: Mon–Wed after 2pm ET, or flexible mornings"
              className="w-full min-w-0 bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 resize-y"
            />
          </div>
        ) : null}

        <VoiceNoteRecorder partnerId={partnerId} value={voiceNote} onChange={setVoiceNote} />

        <button
          type="submit"
          disabled={busy || (mode === 'instant' && !selectedSlot)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] whitespace-normal text-center leading-snug hover:brightness-110 transition-all disabled:opacity-50"
        >
          {mode === 'instant' ? 'Confirm session' : 'Submit request'} <ArrowRight size={14} />
        </button>
        </div>
        </section>
      </div>
    </form>
  );
}
