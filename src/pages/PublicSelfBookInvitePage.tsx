import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { PublicSessionSlotPicker } from '../components/calendar/PublicSessionSlotPicker';
import {
  createPublicAppointmentRequest,
  scheduleEventFromPublicRequest,
} from '../data/calendarRepo';
import {
  buildBookingInvitePath,
  getBookingInviteByToken,
  markBookingInviteUsed,
} from '../data/bookingInviteRepo';
import { getCalendarBookingSettings } from '../data/calendarSettingsRepo';
import { formatSlotRange, isoDayKey, type BookableSlot } from '../lib/calendarSlots';
import type { SlotDuration } from '../domain/calendar';
import { buildGuestMeetingJoinPath } from '../lib/meetingUrls';
import { getPublicSiteOrigin } from '../lib/funnelPublicLinks';
import { sendMeetingInviteEmail } from '../lib/meetingInviteEmailSend';
import { isFeatureEnabled } from '../data/settingsRepo';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

/** Public self-schedule via admin invite token — `/book/i/:token` */
export default function PublicSelfBookInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agenda, setAgenda] = useState('');
  const [dayKey, setDayKey] = useState<string | null>(isoDayKey(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [joinPath, setJoinPath] = useState<string | null>(null);

  const invite = useMemo(() => {
    void version;
    return token ? getBookingInviteByToken(token) : null;
  }, [token, version]);

  const settings = useMemo(() => getCalendarBookingSettings(), [version]);
  const duration = (invite?.durationMinutes ?? settings.defaultDuration) as SlotDuration;

  useEffect(() => {
    if (!invite) return;
    if (invite.guestName) setFullName(invite.guestName);
    if (invite.guestEmail) setEmail(invite.guestEmail);
    if (invite.guestPhone) setPhone(invite.guestPhone);
  }, [invite?.id]);

  useEffect(() => {
    document.title = invite?.label ? `${invite.label} — Book session` : 'Book your session';
  }, [invite?.label]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite || busy) return;
    setErr(null);
    setOk(null);
    setJoinPath(null);

    if (!fullName.trim()) {
      setErr('Enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErr('Enter a valid email.');
      return;
    }
    if (!selectedSlot) {
      setErr('Pick a time slot.');
      return;
    }

    setBusy(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const req = createPublicAppointmentRequest({
        topic: invite.topic,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        preferredSlotMinutes: duration,
        availabilityNotes: `Self-book invite ${invite.token.slice(0, 8)}`,
        selectedSlotStartAt: selectedSlot.startAt,
        selectedSlotEndAt: selectedSlot.endAt,
        timezone: tz,
        meetingAgenda: agenda.trim() || undefined,
        notes: invite.label ? `Invite: ${invite.label}` : undefined,
      });

      const ev = scheduleEventFromPublicRequest({
        requestId: req.id,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
        slotDurationMinutes: duration,
        confirm: true,
      });
      if (!ev) throw new Error('Could not confirm that slot.');

      markBookingInviteUsed({ inviteId: invite.id, eventId: ev.id });
      const guestJoin = buildGuestMeetingJoinPath(ev.id);
      setJoinPath(guestJoin);
      setOk(`Confirmed — ${formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)}`);

      if (isFeatureEnabled('commsDelivery')) {
        const origin = getPublicSiteOrigin();
        await sendMeetingInviteEmail({
          partnerId: invite.partnerId || 'admin_growth',
          toEmail: email.trim(),
          toName: fullName.trim(),
          title: ev.title,
          joinUrl: `${origin}${guestJoin}?name=${encodeURIComponent(fullName.trim())}`,
          startAt: ev.startAt,
          endAt: ev.endAt,
          timezone: tz,
          agenda: agenda.trim() || undefined,
          hostName: 'Alex Rivera',
          hostRoleLabel: 'Session Coordinator',
          scheduleUrl: `${origin}${buildBookingInvitePath(invite.token)}`,
        });
      }
      setVersion((v) => v + 1);
    } catch (ex: unknown) {
      setErr((ex as Error)?.message || 'Booking failed.');
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <PageShell badge="Book" title="Invalid link" subtitle="No invite token provided.">
        <div className={FINELY_OS_PAGE}>
          <button type="button" onClick={() => navigate('/enlightenment-session')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={14} /> Book a session
          </button>
        </div>
      </PageShell>
    );
  }

  if (!invite || invite.status !== 'active') {
    return (
      <PageShell badge="Book" title="Invite unavailable" subtitle="This link expired or was revoked.">
        <div className={FINELY_OS_PAGE}>
          <div className={FINELY_OS_BANNER}>Ask your Finely specialist for a fresh booking link.</div>
          <button type="button" onClick={() => navigate('/enlightenment-session')} className={FINELY_OS_SUCCESS_BTN}>
            Open public booking
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge="Book session"
      title={invite.label || 'Pick your time'}
      subtitle="Self-schedule your strategy call — one free session per email on enlightenment topics."
    >
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={14} /> Home
        </button>

        {ok ? (
          <div className={`${FINELY_OS_NOTICE_SUCCESS} mt-4 flex items-start gap-2`}>
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">{ok}</div>
              {joinPath ? (
                <button
                  type="button"
                  className="mt-2 underline text-emerald-200"
                  onClick={() => navigate(joinPath)}
                >
                  Open audio-first join room
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        {err ? <div className={`${FINELY_OS_NOTICE_ERROR} mt-4`}>{err}</div> : null}

        {!ok ? (
          <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-4">
            <div className={finelyOsCatalogCard('sky')}>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-200`}>
                <Calendar size={14} /> Your details
              </div>
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <label className="block sm:col-span-2">
                  <span className={FINELY_OS_ENTITY_LABEL}>Full name</span>
                  <input className={FINELY_OS_ENTITY_INPUT} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </label>
                <label className="block">
                  <span className={FINELY_OS_ENTITY_LABEL}>Email</span>
                  <input type="email" className={FINELY_OS_ENTITY_INPUT} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label className="block">
                  <span className={FINELY_OS_ENTITY_LABEL}>Phone (optional)</span>
                  <input className={FINELY_OS_ENTITY_INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label className="block sm:col-span-2">
                  <span className={FINELY_OS_ENTITY_LABEL}>What should we cover?</span>
                  <textarea rows={2} className={FINELY_OS_ENTITY_INPUT} value={agenda} onChange={(e) => setAgenda(e.target.value)} placeholder="Goals, report status, timeline" />
                </label>
              </div>
            </div>

            <PublicSessionSlotPicker
              durationMinutes={duration}
              onDurationChange={() => {}}
              selectedDay={dayKey}
              onDayChange={setDayKey}
              selectedSlot={selectedSlot}
              onSlotChange={setSelectedSlot}
            />

            <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Results vary · not legal advice · funding subject to underwriting
            </p>

            <button type="submit" disabled={busy} className={FINELY_OS_SUCCESS_BTN}>
              {busy ? 'Confirming…' : 'Confirm session'}
            </button>
          </form>
        ) : null}
      </div>
    </PageShell>
  );
}
