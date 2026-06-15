import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { PublicSessionSlotPicker } from '../calendar/PublicSessionSlotPicker';
import { createPublicAppointmentRequest, getPublicEnlightenmentSessionQuote } from '../../data/calendarRepo';
import { addLeadNote } from '../../data/leadOpsRepo';
import { resolveStaffOnDuty } from '../../data/staffRoster';
import { formatSlotRange, type BookableSlot } from '../../lib/calendarSlots';
import { emitPlatformEvent } from '../../domain/platformEvents';
import type { SlotDuration } from '../../domain/calendar';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_PANEL,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCard,} from '../../features/os/finelyOsLightUi';

type FocusLane =
  | 'In‑House Financing (Primary Tradeline)'
  | 'Authorized Users (AU)'
  | 'Debt Kill (Debt & Legal)'
  | 'Personal Credit'
  | 'Business Credit'
  | 'Wealth Builder'
  | 'Other';

function focusForFunnel(config: LeadMagnetFunnelConfig): FocusLane {
  if (config.id === 'debt') return 'Debt Kill (Debt & Legal)';
  if (config.id === 'business') return 'Business Credit';
  if (config.id === 'tradeline') return 'In‑House Financing (Primary Tradeline)';
  return 'Personal Credit';
}

type Props = {
  config: LeadMagnetFunnelConfig;
  leadId: string;
  fullName: string;
  email: string;
  phone?: string;
};

/** Phase 11 — inline enlightenment session booking on funnel success (no page hop). */
export function FunnelInlineSessionBook({ config, leadId, fullName, email, phone }: Props) {
  const focus = focusForFunnel(config);
  const [durationMinutes, setDurationMinutes] = useState<SlotDuration>(30);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const quote = useMemo(() => getPublicEnlightenmentSessionQuote(email), [email]);
  const assignedStaff = useMemo(() => resolveStaffOnDuty(config.agentPersonaId), [config.agentPersonaId]);
  const agentLabel = assignedStaff ? `${assignedStaff.firstName} ${assignedStaff.lastName}` : config.agentDisplayName;
  const canBook = fullName.trim().length > 1 && email.includes('@') && Boolean(selectedSlot) && !busy && !done;

  const book = async () => {
    if (!canBook || !selectedSlot) return;
    setBusy(true);
    setErr(null);
    try {
      const pubReq = createPublicAppointmentRequest({
        topic: 'enlightenment',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone?.trim() || undefined,
        preferredSlotMinutes: durationMinutes,
        availabilityNotes: `Preferred slot: ${formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)}`,
        selectedSlotStartAt: selectedSlot.startAt,
        selectedSlotEndAt: selectedSlot.endAt,
        freeSessionApplied: quote.freeSessionApplied,
        sessionPriceCents: quote.sessionPriceCents,
        paymentRequired: quote.paymentRequired,
        meetingAgenda: `Funnel follow-up — ${config.heroHighlight.trim()} guide`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: [`Focus: ${focus}`, `Funnel: ${config.funnelId}`, `Lead: ${leadId}`].join('\n'),
      });
      window.dispatchEvent(new Event('finely:store'));
      addLeadNote(
        leadId,
        [
          'Inline strategy call booked from funnel success',
          `Focus: ${focus}`,
          `Slot: ${formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)}`,
          `Request: ${pubReq.id}`,
          quote.paymentRequired ? 'Payment required before confirmation' : 'Free session applied',
        ].join('\n'),
      );
      emitPlatformEvent({
        type: 'automation.triggered',
        tenantId: 'finely_cred',
        leadId,
        entityType: 'lead',
        entityId: leadId,
        payload: {
          kind: 'funnel_session_booked',
          funnelId: config.funnelId,
          requestId: pubReq.id,
          focus,
          slotLabel: formatSlotRange(selectedSlot.startAt, selectedSlot.endAt),
          fullName: fullName.trim(),
          email: email.trim(),
          paymentRequired: quote.paymentRequired,
          agentPersonaId: config.agentPersonaId,
        },
      });
      setDone(true);
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? 'Could not book session. Try the full booking page.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className={`${FINELY_OS_NOTICE_SUCCESS} flex items-start gap-3`}>
        <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Session request sent</div>
          <p className={`${FINELY_OS_ENTITY_BODY} mt-1`}>
            We received your preferred time. {agentLabel} will confirm by email
            {quote.paymentRequired ? ' after payment is completed' : ''}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4 text-left`}>
      <div className="flex items-center gap-3">
        {assignedStaff ? (
          <StaffPortraitImg staff={assignedStaff} className="w-11 h-11 rounded-full border border-emerald-400/30 shrink-0" />
        ) : null}
        <div>
          <div className="flex items-center gap-2 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
            <Calendar size={14} /> Book your free strategy call
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm mt-1`}>
            With {agentLabel} · {config.agentRole}
          </p>
        </div>
      </div>
      <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
        Pick a time now — {agentLabel} will follow up to confirm.
        {quote.freeSessionApplied ? ' Your first session is free.' : ''}
      </p>
      <PublicSessionSlotPicker
        durationMinutes={durationMinutes}
        onDurationChange={setDurationMinutes}
        selectedDay={selectedDay}
        onDayChange={setSelectedDay}
        selectedSlot={selectedSlot}
        onSlotChange={setSelectedSlot}
      />
      {err ? <p className="text-sm text-rose-200">{err}</p> : null}
      <button type="button" disabled={!canBook} onClick={() => void book()} className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : null}
        {busy ? 'Sending request…' : 'Request this time slot'}
      </button>
    </div>
  );
}
