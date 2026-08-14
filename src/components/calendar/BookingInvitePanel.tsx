import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Copy, Link2, Loader2, Mail, Plus, Search, Trash2, UserPlus, Users } from 'lucide-react';
import type { BookingInviteAudience, ConsultationTopic, SlotDuration } from '../../domain/calendar';
import {
  buildBookingInvitePath,
  createBookingInvite,
  listBookingInvites,
  revokeBookingInvite,
} from '../../data/bookingInviteRepo';
import { sendBookingInviteEmailNow } from '../../lib/bookingInviteEmailSend';
import { listPartners } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import { getPublicSiteOrigin } from '../../lib/funnelPublicLinks';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowTile,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

const DURATIONS: SlotDuration[] = [20, 30, 60, 90];

const TOPICS: Array<{ id: ConsultationTopic; label: string }> = [
  { id: 'enlightenment', label: 'Strategy call' },
  { id: 'credit_restore', label: 'Credit restore' },
  { id: 'business_build', label: 'Business build' },
  { id: 'debt_summons', label: 'Debt & summons' },
  { id: 'other', label: 'Other' },
];

const RECIPIENT_MODES: Array<{ id: BookingInviteAudience; label: string; icon: typeof Users }> = [
  { id: 'partner', label: 'Existing partner', icon: Users },
  { id: 'guest', label: 'New contact', icon: UserPlus },
  { id: 'internal', label: 'Internal team', icon: Building2 },
];

type Props = {
  defaultGuestName?: string;
  defaultGuestEmail?: string;
  defaultGuestPhone?: string;
  crmRecordId?: string;
  leadId?: string;
  partnerId?: string;
  /** Pre-loaded accessible partners for the search picker — avoids a duplicate fetch when the host page already has them. */
  partners?: Partner[];
  compact?: boolean;
};

export function BookingInvitePanel({
  defaultGuestEmail,
  defaultGuestName,
  defaultGuestPhone,
  crmRecordId,
  leadId,
  partnerId,
  partners: partnersProp,
  compact,
}: Props) {
  const [tick, setTick] = useState(0);
  const [label, setLabel] = useState('');
  const [topic, setTopic] = useState<ConsultationTopic>('enlightenment');
  const [duration, setDuration] = useState<SlotDuration>(30);
  const [recipientMode, setRecipientMode] = useState<BookingInviteAudience>(
    partnerId ? 'partner' : 'guest',
  );
  const [guestName, setGuestName] = useState(defaultGuestName || '');
  const [guestEmail, setGuestEmail] = useState(defaultGuestEmail || '');
  const [guestPhone, setGuestPhone] = useState(defaultGuestPhone || '');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | undefined>(partnerId);
  const [partnerQuery, setPartnerQuery] = useState('');
  const [loadedPartners, setLoadedPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [sendEmailNow, setSendEmailNow] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [createOk, setCreateOk] = useState<string | null>(null);

  const partners = partnersProp ?? loadedPartners;

  useEffect(() => {
    if (recipientMode !== 'partner' || partnersProp || loadedPartners.length || partnersLoading) return;
    setPartnersLoading(true);
    listPartners()
      .then(setLoadedPartners)
      .catch(() => setLoadedPartners([]))
      .finally(() => setPartnersLoading(false));
  }, [recipientMode, partnersProp, loadedPartners.length, partnersLoading]);

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

  const selectedPartner = useMemo(
    () => (selectedPartnerId ? partners.find((p) => p.id === selectedPartnerId) : undefined),
    [partners, selectedPartnerId],
  );

  const invites = useMemo(() => {
    void tick;
    return listBookingInvites().slice(0, 8);
  }, [tick]);

  const origin = getPublicSiteOrigin();

  const copyLink = async (token: string) => {
    const url = `${origin}${buildBookingInvitePath(token)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const pickPartner = (p: Partner) => {
    setSelectedPartnerId(p.id);
    setGuestName(p.profile.fullName || '');
    setGuestEmail(p.profile.email || '');
    setGuestPhone(p.profile.phone || '');
    setPartnerQuery('');
  };

  const switchMode = (mode: BookingInviteAudience) => {
    setRecipientMode(mode);
    setCreateErr(null);
    setCreateOk(null);
    if (mode !== 'partner') {
      setSelectedPartnerId(undefined);
    }
  };

  const create = async () => {
    setCreateErr(null);
    setCreateOk(null);
    if (recipientMode === 'partner' && !selectedPartnerId) {
      setCreateErr('Search and select an existing partner, or switch to New contact.');
      return;
    }
    const emailTrimmed = guestEmail.trim();
    if (sendEmailNow && !emailTrimmed) {
      setCreateErr('Add a contact email to send the invite, or turn off "Send email now".');
      return;
    }

    const inv = createBookingInvite({
      label: label.trim() || undefined,
      topic,
      durationMinutes: duration,
      crmRecordId,
      leadId,
      partnerId: recipientMode === 'partner' ? selectedPartnerId : partnerId,
      guestName: guestName.trim() || undefined,
      guestEmail: emailTrimmed || undefined,
      guestPhone: guestPhone.trim() || undefined,
      audience: recipientMode,
      maxUses: 3,
    });
    setLabel('');
    setTick((t) => t + 1);

    if (sendEmailNow && emailTrimmed) {
      setSendingId(inv.id);
      const res = await sendBookingInviteEmailNow({ invite: inv, toEmail: emailTrimmed, toName: guestName.trim() || undefined });
      setSendingId(null);
      setTick((t) => t + 1);
      if (res.ok) {
        setCreateOk(`Invite emailed to ${emailTrimmed}.`);
      } else {
        setCreateErr(res.error || 'Invite created, but the email failed to send — use "Send email" below to retry.');
      }
    } else {
      setCreateOk('Invite link created — copy it below or send the email separately.');
    }
  };

  const resend = async (id: string) => {
    const inv = invites.find((i) => i.id === id);
    if (!inv) return;
    if (!inv.guestEmail) {
      setCreateErr('This invite has no contact email on file — copy the link instead.');
      return;
    }
    setSendingId(id);
    setCreateErr(null);
    const res = await sendBookingInviteEmailNow({ invite: inv });
    setSendingId(null);
    setTick((t) => t + 1);
    if (!res.ok) setCreateErr(res.error || 'Invite email failed.');
  };

  return (
    <div className={`${finelyOsCatalogCardCompact('violet')} space-y-3 ${compact ? '!p-3' : ''}`}>
      <div>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-200`}>
          <Link2 size={14} /> Send a meeting invite
        </div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Pick an existing partner, a new contact, or an internal teammate — guests choose their own slot at `/book/i/:token`,
          no login needed. Email sends through the same Finely Comms pipe as everything else.
        </p>
      </div>

      <div className="space-y-1.5">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Send to</span>
        <div className="flex flex-wrap gap-1.5">
          {RECIPIENT_MODES.map((m) => {
            const active = m.id === recipientMode;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => switchMode(m.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold ${finelyOsGlowTile(active ? 'violet' : 'sky', active)} ${active ? 'text-violet-100' : 'text-white/70'}`}
              >
                <Icon size={12} /> {m.label}
              </button>
            );
          })}
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
                  setGuestPhone('');
                }}
                className="text-emerald-200/70 hover:text-white text-[10px] font-black uppercase tracking-widest"
              >
                Change
              </button>
            </div>
          ) : partnerQuery.trim() && partnerMatches.length > 0 ? (
            <div className="space-y-1 max-h-48 overflow-y-auto">
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
            <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>No matching partners — switch to "New contact" to invite someone new.</div>
          ) : null}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          <label className="block">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>{recipientMode === 'internal' ? 'Teammate name' : 'Guest name'}</span>
            <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>{recipientMode === 'internal' ? 'Teammate email' : 'Guest email'}</span>
            <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="name@email.com" />
          </label>
        </div>
      )}

      <label className="block">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Label (internal)</span>
        <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Warm lead — Miami restore" />
      </label>

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

      <div className="space-y-1.5">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Duration</span>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map((d) => {
            const active = d === duration;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`px-3 py-1.5 text-[10px] font-bold ${finelyOsGlowTile(active ? 'amber' : 'sky', active)} ${active ? 'text-amber-100' : 'text-white/70'}`}
              >
                {d} min
              </button>
            );
          })}
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-xs text-white/70 cursor-pointer">
        <input type="checkbox" checked={sendEmailNow} onChange={(e) => setSendEmailNow(e.target.checked)} className="accent-amber-500" />
        Email the invite now (uses Finely Comms)
      </label>

      {createErr ? <div className="rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-2 text-xs text-fuchsia-100">{createErr}</div> : null}
      {createOk ? <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">{createOk}</div> : null}

      <button type="button" onClick={() => void create()} disabled={sendingId !== null} className={FINELY_OS_PRIMARY_BTN}>
        {sendingId ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {sendEmailNow ? 'Create & send invite' : 'Create invite link'}
      </button>

      {invites.length ? (
        <div className="space-y-1.5">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent invites</div>
          {invites.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{inv.label || inv.guestEmail || inv.topic}</div>
                <div className="text-white/50 flex flex-wrap items-center gap-1.5">
                  <span>{inv.status} · {inv.useCount}/{inv.maxUses} uses</span>
                  {inv.audience ? <span className="capitalize">· {inv.audience}</span> : null}
                  {inv.emailStatus === 'sent' ? (
                    <span className={finelyOsStatusChip('ok')}>Emailed</span>
                  ) : inv.emailStatus === 'failed' ? (
                    <span className={finelyOsStatusChip('blocked')} title={inv.emailError}>Email failed</span>
                  ) : inv.emailStatus === 'sending' ? (
                    <span className={finelyOsStatusChip('warn')}>Sending…</span>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-1">
                {inv.guestEmail ? (
                  <button
                    type="button"
                    className={FINELY_OS_SECONDARY_BTN}
                    disabled={sendingId === inv.id}
                    onClick={() => void resend(inv.id)}
                    title={inv.guestEmail}
                  >
                    {sendingId === inv.id ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                    {inv.emailStatus === 'sent' ? 'Resend' : 'Send email'}
                  </button>
                ) : null}
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyLink(inv.token)}>
                  <Copy size={12} /> {copied === inv.token ? 'Copied' : 'Copy'}
                </button>
                {inv.status === 'active' ? (
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => { revokeBookingInvite(inv.id); setTick((t) => t + 1); }}>
                    <Trash2 size={12} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
