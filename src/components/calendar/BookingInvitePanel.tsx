import React, { useMemo, useState } from 'react';
import { Copy, Link2, Plus, Trash2 } from 'lucide-react';
import type { ConsultationTopic, SlotDuration } from '../../domain/calendar';
import {
  buildBookingInvitePath,
  createBookingInvite,
  listBookingInvites,
  revokeBookingInvite,
} from '../../data/bookingInviteRepo';
import { getPublicSiteOrigin } from '../../lib/funnelPublicLinks';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

const TOPICS: Array<{ id: ConsultationTopic; label: string }> = [
  { id: 'enlightenment', label: 'Strategy call' },
  { id: 'credit_restore', label: 'Credit restore' },
  { id: 'business_build', label: 'Business build' },
  { id: 'debt_summons', label: 'Debt & summons' },
  { id: 'other', label: 'Other' },
];

type Props = {
  defaultGuestName?: string;
  defaultGuestEmail?: string;
  defaultGuestPhone?: string;
  crmRecordId?: string;
  leadId?: string;
  partnerId?: string;
  compact?: boolean;
};

export function BookingInvitePanel({
  defaultGuestEmail,
  defaultGuestName,
  defaultGuestPhone,
  crmRecordId,
  leadId,
  partnerId,
  compact,
}: Props) {
  const [tick, setTick] = useState(0);
  const [label, setLabel] = useState('');
  const [topic, setTopic] = useState<ConsultationTopic>('enlightenment');
  const [duration, setDuration] = useState<SlotDuration>(30);
  const [guestName, setGuestName] = useState(defaultGuestName || '');
  const [guestEmail, setGuestEmail] = useState(defaultGuestEmail || '');
  const [guestPhone, setGuestPhone] = useState(defaultGuestPhone || '');
  const [copied, setCopied] = useState<string | null>(null);

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

  const create = () => {
    createBookingInvite({
      label: label.trim() || undefined,
      topic,
      durationMinutes: duration,
      crmRecordId,
      leadId,
      partnerId,
      guestName: guestName.trim() || undefined,
      guestEmail: guestEmail.trim() || undefined,
      guestPhone: guestPhone.trim() || undefined,
      maxUses: 3,
    });
    setLabel('');
    setTick((t) => t + 1);
  };

  return (
    <div className={`${finelyOsCatalogCardCompact('violet')} space-y-3 ${compact ? '!p-3' : ''}`}>
      <div>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-200`}>
          <Link2 size={14} /> Self-book invite links
        </div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Share `/book/i/:token` — guests pick a slot without logging in. Alex can auto-send these to warm CRM leads.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <label className="block sm:col-span-2">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Label (internal)</span>
          <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Warm lead — Miami restore" />
        </label>
        <label className="block">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Topic</span>
          <select className={`${FINELY_OS_ENTITY_SELECT} mt-1`} value={topic} onChange={(e) => setTopic(e.target.value as ConsultationTopic)}>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Duration</span>
          <select className={`${FINELY_OS_ENTITY_SELECT} mt-1`} value={duration} onChange={(e) => setDuration(Number(e.target.value) as SlotDuration)}>
            {[20, 30, 60, 90].map((d) => (
              <option key={d} value={d}>{d} min</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Guest name</span>
          <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={guestName} onChange={(e) => setGuestName(e.target.value)} />
        </label>
        <label className="block">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Guest email</span>
          <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
        </label>
      </div>

      <button type="button" onClick={create} className={FINELY_OS_PRIMARY_BTN}>
        <Plus size={14} /> Create invite link
      </button>

      {invites.length ? (
        <div className="space-y-1.5">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent invites</div>
          {invites.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{inv.label || inv.guestEmail || inv.topic}</div>
                <div className="text-white/50">{inv.status} · {inv.useCount}/{inv.maxUses} uses</div>
              </div>
              <div className="flex gap-1">
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
