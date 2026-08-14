import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { PublicSessionSlotPicker } from '../calendar/PublicSessionSlotPicker';
import { VoiceTranscriptField } from '../calendar/VoiceTranscriptField';
import { getPublicEnlightenmentSessionQuote } from '../../data/calendarRepo';
import { addLeadNote } from '../../data/leadOpsRepo';
import { syncInboundLeadSessionBooked } from '../../lib/crmLeadSync';
import { getLeadCaptureById } from '../../data/leadsRepo';
import { resolveStaffOnDuty } from '../../data/staffRoster';
import { confirmPublicSlotBooking } from '../../lib/confirmPublicSlotBooking';
import { draftBookingAgenda } from '../../lib/aiDraftAgenda';
import { formatSlotRange, type BookableSlot } from '../../lib/calendarSlots';
import { emitPlatformEvent } from '../../domain/platformEvents';
import type { SlotDuration } from '../../domain/calendar';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

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

/** Phase 4 — instant-confirm inline enlightenment session booking on funnel success (no page hop, no "team will follow up"). */
export function FunnelInlineSessionBook({ config, leadId, fullName, email, phone }: Props) {
  const focus = focusForFunnel(config);
  const [durationMinutes, setDurationMinutes] = useState<SlotDuration>(30);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [agenda, setAgenda] = useState('');
  const [aiDrafting, setAiDrafting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [confirmedLabel, setConfirmedLabel] = useState<string | null>(null);
  const [joinPath, setJoinPath] = useState<string | null>(null);

  const quote = useMemo(() => getPublicEnlightenmentSessionQuote(email), [email]);
  const assignedStaff = useMemo(() => resolveStaffOnDuty(config.agentPersonaId), [config.agentPersonaId]);
  const agentLabel = assignedStaff ? `${assignedStaff.firstName} ${assignedStaff.lastName}` : config.agentDisplayName;
  const canBook = fullName.trim().length > 1 && email.includes('@') && Boolean(selectedSlot) && !busy && !done;

  const aiDraftAgenda = async () => {
    if (aiDrafting) return;
    setAiDrafting(true);
    try {
      const lead = getLeadCaptureById(leadId);
      const res = await draftBookingAgenda({
        focusLabel: focus,
        goalText: agenda || `${config.heroHighlight}`,
        crmNotes: lead ? [lead.interest ?? '', lead.offer ?? ''].filter(Boolean) : undefined,
      });
      setAgenda(res.text);
    } finally {
      setAiDrafting(false);
    }
  };

  const book = async () => {
    if (!canBook || !selectedSlot) return;
    setBusy(true);
    setErr(null);
    try {
      const finalAgenda = agenda.trim() || `Funnel follow-up — ${config.heroHighlight.trim()} guide`;
      const { event, joinPath: guestJoinPath, confirmedLabel: label } = await confirmPublicSlotBooking({
        topic: 'enlightenment',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone?.trim() || undefined,
        agenda: finalAgenda,
        notes: [`Focus: ${focus}`, `Funnel: ${config.funnelId}`, `Lead: ${leadId}`].join('\n'),
        selectedSlot,
        durationMinutes,
        freeSessionApplied: quote.freeSessionApplied,
        sessionPriceCents: quote.sessionPriceCents,
        paymentRequired: quote.paymentRequired,
        hostName: agentLabel,
        hostRoleLabel: config.agentRole,
      });

      const lead = getLeadCaptureById(leadId);
      if (lead) syncInboundLeadSessionBooked(lead, config.funnelId);
      addLeadNote(
        leadId,
        [
          'Inline strategy call confirmed instantly from funnel success',
          `Focus: ${focus}`,
          `Slot: ${label}`,
          `Event: ${event.id}`,
          quote.paymentRequired ? 'Payment required — follow up before call' : 'Free session applied',
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
          requestId: event.sourceRequestId ?? '',
          focus,
          slotLabel: formatSlotRange(selectedSlot.startAt, selectedSlot.endAt),
          fullName: fullName.trim(),
          email: email.trim(),
          paymentRequired: quote.paymentRequired,
          agentPersonaId: config.agentPersonaId,
        },
      });
      setConfirmedLabel(label);
      setJoinPath(guestJoinPath);
      setDone(true);
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? 'Could not confirm session. Try the full booking page.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className={`${FINELY_OS_NOTICE_SUCCESS} flex items-start gap-3`}>
        <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Confirmed{confirmedLabel ? ` — ${confirmedLabel}` : ''}</div>
          <p className={`${FINELY_OS_ENTITY_BODY} mt-1`}>
            {agentLabel} is on your calendar
            {quote.paymentRequired ? ' — a payment link will follow before the call.' : '.'}
          </p>
          {joinPath ? (
            <a href={joinPath} className="mt-2 inline-block underline text-emerald-200 text-sm">
              Open audio-first join room
            </a>
          ) : null}
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
        Pick a time — it's confirmed instantly, no waiting on a callback.
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
      <VoiceTranscriptField
        label="What should we cover? (optional)"
        value={agenda}
        onChange={setAgenda}
        rows={2}
        accent="violet"
        placeholder={`e.g. ${config.heroHighlight}`}
        rightSlot={
          <button
            type="button"
            onClick={() => void aiDraftAgenda()}
            disabled={aiDrafting}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500/15 disabled:opacity-50"
          >
            <Sparkles size={11} /> {aiDrafting ? 'Drafting…' : 'AI-draft'}
          </button>
        }
      />
      {err ? <p className="text-sm text-rose-200">{err}</p> : null}
      <button type="button" disabled={!canBook} onClick={() => void book()} className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : null}
        {busy ? 'Confirming…' : 'Confirm this time'}
      </button>
    </div>
  );
}
