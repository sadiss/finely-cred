import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  Copy,
  Loader2,
  Mail,
  Search,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import type { ConsultationTopic, SlotDuration } from '../../domain/calendar';
import type { Partner } from '../../domain/partners';
import {
  bookPartnerConsultationSlot,
  createCalendarEvent,
  createPublicAppointmentRequest,
  scheduleEventFromPublicRequest,
} from '../../data/calendarRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { getCalendarBookingSettings } from '../../data/calendarSettingsRepo';
import { listPartners } from '../../data/partnersRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { PublicSessionSlotPicker } from './PublicSessionSlotPicker';
import { sendMeetingInviteEmail } from '../../lib/meetingInviteEmailSend';
import { getPublicSiteOrigin } from '../../lib/funnelPublicLinks';
import { buildGuestMeetingJoinPath } from '../../lib/meetingUrls';
import { assertSlotBookable } from '../../lib/meetingEmailGuards';
import { formatSlotRange, isoDayKey, type BookableSlot } from '../../lib/calendarSlots';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowTile,
} from '../../features/os/finelyOsLightUi';

type MeetingScope = 'external' | 'internal';
type ExternalRecipient = 'partner' | 'guest';

const TOPICS: Array<{ id: ConsultationTopic; label: string }> = [
  { id: 'enlightenment', label: 'Strategy call' },
  { id: 'credit_restore', label: 'Credit restore' },
  { id: 'business_build', label: 'Business build' },
  { id: 'debt_summons', label: 'Debt & summons' },
  { id: 'other', label: 'Other' },
];

type Props = {
  /** Pre-select partner when opened from a partner file or chat focus. */
  defaultPartnerId?: string;
  defaultGuestName?: string;
  defaultGuestEmail?: string;
  hostName?: string;
  hostRoleLabel?: string;
  compact?: boolean;
  onScheduled?: () => void;
};

export function AdminMeetingComposer({
  defaultPartnerId,
  defaultGuestName,
  defaultGuestEmail,
  hostName = 'Finely Cred care team',
  hostRoleLabel = 'Counsel / specialist',
  compact,
  onScheduled,
}: Props) {
  const tenantId = getActiveTenantId();
  const settings = useMemo(() => getCalendarBookingSettings(), []);

  const [scope, setScope] = useState<MeetingScope>('external');
  const [recipientMode, setRecipientMode] = useState<ExternalRecipient>(defaultPartnerId ? 'partner' : 'guest');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnerQuery, setPartnerQuery] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | undefined>(defaultPartnerId);
  const [guestName, setGuestName] = useState(defaultGuestName || '');
  const [guestEmail, setGuestEmail] = useState(defaultGuestEmail || '');
  const [internalName, setInternalName] = useState('');
  const [internalEmail, setInternalEmail] = useState('');

  const [topic, setTopic] = useState<ConsultationTopic>('enlightenment');
  const [title, setTitle] = useState('Partner case video meeting');
  const [agenda, setAgenda] = useState('');
  const [duration, setDuration] = useState<SlotDuration>(settings.defaultDuration);
  const [selectedDay, setSelectedDay] = useState<string | null>(isoDayKey(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);

  const [sendEmailNow, setSendEmailNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ joinUrl: string; label: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scope !== 'external' || recipientMode !== 'partner' || partners.length) return;
    setPartnersLoading(true);
    listPartners()
      .then(setPartners)
      .catch(() => setPartners([]))
      .finally(() => setPartnersLoading(false));
  }, [scope, recipientMode, partners.length]);

  useEffect(() => {
    if (!defaultPartnerId) return;
    setSelectedPartnerId(defaultPartnerId);
    setRecipientMode('partner');
    setScope('external');
  }, [defaultPartnerId]);

  const selectedPartner = useMemo(
    () => (selectedPartnerId ? partners.find((p) => p.id === selectedPartnerId) : undefined),
    [partners, selectedPartnerId],
  );

  const partnerMatches = useMemo(() => {
    const q = partnerQuery.trim().toLowerCase();
    const pool = partners.slice(0, 400);
    const filtered = q
      ? pool.filter(
          (p) =>
            p.profile.fullName.toLowerCase().includes(q) ||
            (p.profile.email || '').toLowerCase().includes(q),
        )
      : pool;
    return filtered.slice(0, 8);
  }, [partners, partnerQuery]);

  const recipientEmail = useMemo(() => {
    if (scope === 'internal') return internalEmail.trim();
    if (recipientMode === 'partner') return (selectedPartner?.profile.email || guestEmail).trim();
    return guestEmail.trim();
  }, [scope, recipientMode, selectedPartner, guestEmail, internalEmail]);

  const recipientLabel = useMemo(() => {
    if (scope === 'internal') return internalName.trim() || internalEmail.trim() || 'Teammate';
    if (recipientMode === 'partner') return selectedPartner?.profile.fullName || guestName.trim() || 'Partner';
    return guestName.trim() || guestEmail.trim() || 'Guest';
  }, [scope, recipientMode, selectedPartner, guestName, guestEmail, internalName, internalEmail]);

  const pickPartner = (p: Partner) => {
    setSelectedPartnerId(p.id);
    setGuestName(p.profile.fullName || '');
    setGuestEmail(p.profile.email || '');
    setPartnerQuery('');
  };

  const copyJoinUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const schedule = async () => {
    if (busy) return;
    setErr(null);
    setResult(null);

    if (!selectedSlot) {
      setErr('Pick a date and time slot.');
      return;
    }

    if (scope === 'external' && recipientMode === 'partner' && !selectedPartnerId) {
      setErr('Search and select a partner, or switch to Guest email.');
      return;
    }

    if (scope === 'external' && recipientMode === 'guest' && !guestEmail.trim().includes('@')) {
      setErr('Enter a valid guest email.');
      return;
    }

    if (scope === 'internal' && !internalEmail.trim().includes('@')) {
      setErr('Enter a teammate email for internal meetings.');
      return;
    }

    if (!agenda.trim()) {
      setErr('Add a short agenda so everyone knows what to cover.');
      return;
    }

    setBusy(true);
    try {
      assertSlotBookable(selectedSlot, duration);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const origin = getPublicSiteOrigin();
      const meetingTitle = title.trim() || TOPICS.find((t) => t.id === topic)?.label || 'Video meeting';
      let joinUrl = '';
      let eventPartnerId = '';

      if (scope === 'internal') {
        eventPartnerId = `internal:${tenantId}`;
        const ev = createCalendarEvent({
          partnerId: eventPartnerId,
          type: 'ops',
          status: 'confirmed',
          title: meetingTitle,
          description: [`Internal · ${recipientLabel}`, agenda.trim()].filter(Boolean).join('\n\n'),
          meetingAgenda: agenda.trim(),
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
          slotDurationMinutes: duration,
          timezone: tz,
        });
        joinUrl = `${origin}/portal/meeting/${ev.id}`;
      } else if (recipientMode === 'partner' && selectedPartnerId) {
        const { event } = bookPartnerConsultationSlot({
          partnerId: selectedPartnerId,
          topic,
          slotStartAt: selectedSlot.startAt,
          slotEndAt: selectedSlot.endAt,
          slotDurationMinutes: duration,
          timezone: tz,
          meetingAgenda: agenda.trim(),
        });
        eventPartnerId = selectedPartnerId;
        joinUrl = event.meetingUrl || `${origin}/portal/meeting/${event.id}`;
      } else {
        const req = createPublicAppointmentRequest({
          topic,
          fullName: guestName.trim() || 'Guest',
          email: guestEmail.trim(),
          preferredSlotMinutes: duration,
          availabilityNotes: `Admin-scheduled: ${formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)}`,
          selectedSlotStartAt: selectedSlot.startAt,
          selectedSlotEndAt: selectedSlot.endAt,
          timezone: tz,
          meetingAgenda: agenda.trim(),
        });
        const ev = scheduleEventFromPublicRequest({
          requestId: req.id,
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
          slotDurationMinutes: duration,
          confirm: true,
        });
        if (!ev) throw new Error('Could not confirm that slot — pick another time.');
        eventPartnerId = ev.partnerId;
        joinUrl = `${origin}${buildGuestMeetingJoinPath(ev.id)}?name=${encodeURIComponent(guestName.trim() || 'Guest')}`;
      }

      if (sendEmailNow && recipientEmail.includes('@')) {
        const res = await sendMeetingInviteEmail({
          partnerId: eventPartnerId || selectedPartnerId || `admin:${tenantId}`,
          partner: selectedPartner ?? null,
          toEmail: recipientEmail,
          toName: recipientLabel,
          title: meetingTitle,
          joinUrl,
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
          timezone: tz,
          agenda: agenda.trim(),
          hostName,
          hostRoleLabel,
          scheduleUrl: scope === 'internal' ? `${origin}/admin/calendar` : `${origin}/portal/calendar`,
          intent: 'manual',
        });
        if (!res.ok) throw new Error(res.error || 'Meeting scheduled, but email failed.');
      }

      setResult({
        joinUrl,
        label: `Scheduled ${formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)}${sendEmailNow && recipientEmail.includes('@') ? ' · email sent' : ''}`,
      });
      setSelectedSlot(null);
      onScheduled?.();
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Could not schedule meeting.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${finelyOsCatalogCardCompact('violet')} space-y-3 ${compact ? '!p-3' : ''}`}>
      <div>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-200`}>
          <CalendarDays size={14} /> Schedule a meeting
        </div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Pick who, when, and internal vs external — same slot picker as public strategy-call booking. Generates a join link and optionally emails it.
        </p>
      </div>

      <div className="space-y-1.5">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Meeting type</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setScope('external')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold ${finelyOsGlowTile(scope === 'external' ? 'violet' : 'sky', scope === 'external')} ${scope === 'external' ? 'text-violet-100' : 'text-white/70'}`}
          >
            <Users size={12} /> External (partner / guest)
          </button>
          <button
            type="button"
            onClick={() => setScope('internal')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold ${finelyOsGlowTile(scope === 'internal' ? 'emerald' : 'sky', scope === 'internal')} ${scope === 'internal' ? 'text-emerald-100' : 'text-white/70'}`}
          >
            <Building2 size={12} /> Internal team
          </button>
        </div>
      </div>

      {scope === 'external' ? (
        <>
          <div className="space-y-1.5">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Send to</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setRecipientMode('partner')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold ${finelyOsGlowTile(recipientMode === 'partner' ? 'violet' : 'sky', recipientMode === 'partner')} ${recipientMode === 'partner' ? 'text-violet-100' : 'text-white/70'}`}
              >
                <Users size={12} /> Existing partner
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecipientMode('guest');
                  setSelectedPartnerId(undefined);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold ${finelyOsGlowTile(recipientMode === 'guest' ? 'violet' : 'sky', recipientMode === 'guest')} ${recipientMode === 'guest' ? 'text-violet-100' : 'text-white/70'}`}
              >
                <UserPlus size={12} /> Guest email
              </button>
            </div>
          </div>

          {recipientMode === 'partner' ? (
            <div className="space-y-1.5">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Search partners</span>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className={`${FINELY_OS_ENTITY_INPUT} pl-8`}
                  value={partnerQuery}
                  onChange={(e) => setPartnerQuery(e.target.value)}
                  placeholder={partnersLoading ? 'Loading partners…' : 'Type a name or email…'}
                />
              </div>
              {selectedPartner ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-emerald-100 truncate">{selectedPartner.profile.fullName}</div>
                    <div className="text-emerald-200/70 truncate">{selectedPartner.profile.email || 'No email on file'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPartnerId(undefined);
                      setGuestName('');
                      setGuestEmail('');
                    }}
                    className="text-emerald-200/70 hover:text-white text-[10px] font-black uppercase tracking-widest"
                  >
                    Change
                  </button>
                </div>
              ) : partnerQuery.trim() && partnerMatches.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {partnerMatches.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pickPartner(p)}
                      className="w-full text-left rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs hover:border-violet-400/40 hover:bg-violet-500/10 transition-all"
                    >
                      <div className="font-semibold text-white truncate">{p.profile.fullName}</div>
                      <div className="text-white/50 truncate">{p.profile.email || 'No email on file'}</div>
                    </button>
                  ))}
                </div>
              ) : partnerQuery.trim() && !partnersLoading ? (
                <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>No matching partners — use Guest email instead.</div>
              ) : null}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Guest name</span>
                <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={guestName} onChange={(e) => setGuestName(e.target.value)} />
              </label>
              <label className="block">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Guest email</span>
                <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="name@email.com" />
              </label>
            </div>
          )}
        </>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          <label className="block">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Teammate name</span>
            <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={internalName} onChange={(e) => setInternalName(e.target.value)} />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Teammate email</span>
            <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={internalEmail} onChange={(e) => setInternalEmail(e.target.value)} placeholder="name@finelycred.com" />
          </label>
        </div>
      )}

      <div className="space-y-1.5">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Topic</span>
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map((t) => {
            const active = t.id === topic;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTopic(t.id)}
                className={`px-2.5 py-1.5 text-[10px] font-bold ${finelyOsGlowTile(active ? 'violet' : 'sky', active)} ${active ? 'text-violet-100' : 'text-white/70'}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Meeting title</span>
        <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label className="block">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Agenda (required)</span>
        <textarea
          rows={2}
          className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          placeholder="Court answer review · validation packet · next filings"
        />
      </label>

      <PublicSessionSlotPicker
        durationMinutes={duration}
        onDurationChange={(d) => {
          setDuration(d);
          setSelectedSlot(null);
        }}
        selectedDay={selectedDay}
        onDayChange={setSelectedDay}
        selectedSlot={selectedSlot}
        onSlotChange={setSelectedSlot}
        allowedDurations={settings.allowedDurations.length ? settings.allowedDurations : undefined}
      />

      <label className="inline-flex items-center gap-2 text-xs text-white/70 cursor-pointer">
        <input type="checkbox" checked={sendEmailNow} onChange={(e) => setSendEmailNow(e.target.checked)} className="accent-amber-500" />
        Email invite now (Finely Comms)
      </label>

      {err ? <div className="text-xs text-rose-200">{err}</div> : null}
      {result ? (
        <div className={`${FINELY_OS_NOTICE_SUCCESS} space-y-2`}>
          <div className="text-xs">{result.label}</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyJoinUrl(result.joinUrl)} className={FINELY_OS_SECONDARY_BTN}>
              <Copy size={12} /> {copied ? 'Copied' : 'Copy join link'}
            </button>
            <a href={result.joinUrl} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SECONDARY_BTN}>
              <Video size={12} /> Open room
            </a>
          </div>
        </div>
      ) : null}

      <button type="button" disabled={busy} onClick={() => void schedule()} className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
        Schedule &amp; {sendEmailNow && isFeatureEnabled('commsDelivery') ? 'send invite' : 'get link'}
      </button>
    </div>
  );
}
