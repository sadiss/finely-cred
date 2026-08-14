import React, { useMemo, useState } from 'react';
import { Loader2, Mail, Video } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { listEventsByPartner, createCalendarEvent } from '../../data/calendarRepo';
import { createInstantVideoCall } from '../../data/videoCallsRepo';
import { sendMeetingInviteEmail, listMeetingInvitesByPartner } from '../../lib/meetingInviteEmailSend';
import { getPublicSiteOrigin } from '../../lib/funnelPublicLinks';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partner: Partner | null;
  partnerId: string;
  hostName?: string;
  hostRoleLabel?: string;
  /** Pre-fill from chat / care team */
  defaultTitle?: string;
  compact?: boolean;
  onSent?: () => void;
};

/**
 * Extremely easy: Schedule & email invite OR email an instant video join link.
 * One primary CTA — fires premium HTML meeting email via commsDelivery.
 */
export function SendMeetingInvitePanel({
  partner,
  partnerId,
  hostName = 'Finely Cred care team',
  hostRoleLabel = 'Counsel / specialist',
  defaultTitle = 'Case strategy video meeting',
  compact,
  onSent,
}: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [agenda, setAgenda] = useState('');
  const [toEmail, setToEmail] = useState(partner?.profile.email || '');
  const [startLocal, setStartLocal] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const recent = useMemo(() => listMeetingInvitesByPartner(partnerId).slice(0, 3), [partnerId, tick]);
  const upcoming = useMemo(() => {
    const now = Date.now();
    return listEventsByPartner(partnerId)
      .filter((e) => Date.parse(e.endAt) >= now && e.status !== 'cancelled')
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 4);
  }, [partnerId, tick]);

  const run = async (mode: 'schedule' | 'instant' | 'existing', eventId?: string) => {
    if (busy || !partnerId) return;
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const origin = getPublicSiteOrigin();
      let joinUrl = '';
      let startAt: string | undefined;
      let endAt: string | undefined;
      let meetingTitle = title.trim() || defaultTitle;

      if (mode === 'existing' && eventId) {
        const ev = listEventsByPartner(partnerId).find((e) => e.id === eventId);
        if (!ev) throw new Error('Meeting not found.');
        meetingTitle = ev.title || meetingTitle;
        startAt = ev.startAt;
        endAt = ev.endAt;
        joinUrl = ev.meetingUrl || `${origin}/portal/meeting/${ev.id}`;
      } else if (mode === 'schedule') {
        if (!startLocal) throw new Error('Pick a start date & time.');
        const start = new Date(startLocal);
        if (Number.isNaN(start.getTime())) throw new Error('Invalid start time.');
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        startAt = start.toISOString();
        endAt = end.toISOString();
        const ev = createCalendarEvent({
          partnerId,
          type: 'consultation',
          status: 'confirmed',
          title: meetingTitle,
          description: agenda.trim() || undefined,
          meetingAgenda: agenda.trim() || undefined,
          startAt,
          endAt,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        joinUrl = ev.meetingUrl || `${origin}/portal/meeting/${ev.id}`;
      } else {
        const call = createInstantVideoCall({
          partnerId,
          title: meetingTitle,
          createdBy: { displayName: hostName, role: 'admin' },
          participants: [
            { role: 'admin', label: hostName },
            { role: 'partner', label: partner?.profile.fullName || 'Partner' },
          ],
        });
        joinUrl = `${origin}/portal/video/${call.id}`;
        startAt = new Date().toISOString();
        endAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      }

      const res = await sendMeetingInviteEmail({
        partnerId,
        partner,
        toEmail: toEmail.trim() || undefined,
        title: meetingTitle,
        joinUrl,
        startAt,
        endAt,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        agenda: agenda.trim() || undefined,
        hostName,
        hostRoleLabel,
        scheduleUrl: `${origin}/portal/calendar`,
        intent: 'manual',
      });
      if (!res.ok) throw new Error(res.error || 'Email failed.');
      setOk(`Meeting email sent to ${toEmail.trim() || partner?.profile.email}.`);
      setTick((t) => t + 1);
      onSent?.();
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Could not send meeting email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${finelyOsCatalogCardCompact('sky')} space-y-3 ${compact ? '!p-3' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-200/90`}>
            <Mail size={14} /> Meeting email
          </div>
          <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            One button emails a premium invite with Join meeting + calendar links. Needs Comms Delivery ON.
          </p>
        </div>
      </div>

      <label className="block">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>To email</span>
        <input
          className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
          placeholder="partner@email.com"
        />
      </label>
      <label className="block">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Meeting title</span>
        <input
          className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="block">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Start (schedule mode)</span>
        <input
          type="datetime-local"
          className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
          value={startLocal}
          onChange={(e) => setStartLocal(e.target.value)}
        />
      </label>
      <label className="block">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Agenda (optional)</span>
        <textarea
          rows={2}
          className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          placeholder="Court answer review · validation packet · next filings"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run('schedule')}
          className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          Schedule &amp; email invite
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run('instant')}
          className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60`}
        >
          <Video size={14} /> Instant room + email
        </button>
      </div>

      {upcoming.length ? (
        <div className="space-y-1.5">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Email an upcoming session</div>
          {upcoming.map((ev) => (
            <button
              key={ev.id}
              type="button"
              disabled={busy}
              onClick={() => void run('existing', ev.id)}
              className="w-full text-left rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/80 hover:border-sky-400/40"
            >
              {ev.title} · {new Date(ev.startAt).toLocaleString()}
            </button>
          ))}
        </div>
      ) : null}

      {err ? <div className="text-xs text-rose-200">{err}</div> : null}
      {ok ? <div className="text-xs text-emerald-200 font-semibold">{ok}</div> : null}
      {recent.length ? (
        <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
          Last sent: {recent[0]!.toEmail} · {new Date(recent[0]!.sentAt).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
