import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Phone, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import {
  createPublicAppointmentRequest,
  getPublicAppointmentRequest,
  getPublicEnlightenmentSessionQuote,
  markPublicSessionPaid,
} from '../data/calendarRepo';
import { submitLeadCapture, findLeadCapturesByEmail } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { MarketingConsentBlock } from '../components/fields/MarketingConsentBlock';
import { PublicSessionSlotPicker } from '../components/calendar/PublicSessionSlotPicker';
import { VoiceDictationChooser } from '../components/calendar/VoiceDictationChooser';
import { confirmPublicSlotBooking, confirmScheduledEventForRequest } from '../lib/confirmPublicSlotBooking';
import { draftBookingAgenda } from '../lib/aiDraftAgenda';
import { scoreLead } from '../lib/leadScoring';
import type { BookingUrgencySignal } from '../lib/suggestBookingSlots';
import { formatSlotRange, type BookableSlot } from '../lib/calendarSlots';
import type { SlotDuration } from '../domain/calendar';
import { captureLeadAttributionFromUrl } from '../lib/leadAttribution';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { createPublicSessionCheckout, verifyPublicSessionCheckout } from '../lib/publicSessionCheckoutClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsGlowTile,
} from '../features/os/finelyOsLightUi';

type FocusLane =
  | 'In‑House Financing (Primary Tradeline)'
  | 'Authorized Users (AU)'
  | 'Debt Kill (Debt & Legal)'
  | 'Personal Credit'
  | 'Business Credit'
  | 'Wealth Builder'
  | 'Other';

const FOCUS_LANES: FocusLane[] = [
  'In‑House Financing (Primary Tradeline)',
  'Authorized Users (AU)',
  'Debt Kill (Debt & Legal)',
  'Personal Credit',
  'Business Credit',
  'Wealth Builder',
  'Other',
];


const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');

export default function EnlightenmentSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  usePublicSeoMeta({
    title: 'Book an Enlightenment session',
    description: 'Free Enlightenment session for personal credit, business credit, debt strategy, tradelines, and funding readiness.',
    path: '/enlightenment-session',
  });

  useEffect(() => {
    captureLeadAttributionFromUrl(window.location.search, window.location.pathname);
  }, []);

  useEffect(() => {
    const preEmail = (searchParams.get('email') || '').trim();
    const preName = (searchParams.get('name') || searchParams.get('fullName') || '').trim();
    const prePhone = (searchParams.get('phone') || '').trim();
    const preFocus = (searchParams.get('focus') || '').trim().toLowerCase();
    if (preEmail) setEmail(preEmail);
    if (preName) setFullName(preName);
    if (prePhone) setPhone(prePhone);
    if (preFocus === 'debt') setFocus('Debt Kill (Debt & Legal)');
    else if (preFocus === 'business') setFocus('Business Credit');
    else if (preFocus === 'tradelines' || preFocus === 'tradeline') setFocus('In‑House Financing (Primary Tradeline)');
    else if (preFocus === 'personal') setFocus('Personal Credit');
  }, [searchParams]);

  useEffect(() => {
    const paid = searchParams.get('paid');
    const requestId = (searchParams.get('requestId') || '').trim();
    const sessionId = (searchParams.get('session_id') || '').trim();
    if (paid !== '1' || !requestId) return;

    const finish = async () => {
      if (sessionId && isSupabaseConfigured) {
        const verified = await verifyPublicSessionCheckout({ sessionId, requestId });
        if (!verified.ok || !verified.paid) {
          setStatus('error');
          setStatusMsg('Payment could not be verified. Contact support if you were charged.');
          return;
        }
      }
      markPublicSessionPaid({ requestId, stripeSessionId: sessionId || undefined });

      const req = getPublicAppointmentRequest(requestId);
      if (req?.selectedSlotStartAt && req.selectedSlotEndAt) {
        try {
          const confirmed = await confirmScheduledEventForRequest({
            requestId,
            startAt: req.selectedSlotStartAt,
            endAt: req.selectedSlotEndAt,
            durationMinutes: req.preferredSlotMinutes,
            fullName: req.fullName,
            email: req.email,
            agenda: req.meetingAgenda,
            timezone: req.timezone,
          });
          setStatus('sent');
          setStatusMsg(`Payment received — confirmed for ${confirmed.confirmedLabel}. Check your email for the join link.`);
          return;
        } catch {
          // fall through to pending-confirmation message below
        }
      }
      setStatus('sent');
      setStatusMsg('Payment received — your additional Enlightenment session is pending calendar confirmation.');
    };

    void finish();
  }, [searchParams]);

  const [focus, setFocus] = useState<FocusLane>('In‑House Financing (Primary Tradeline)');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState('');
  const [timeline, setTimeline] = useState('');
  const [preferredSlotMinutes, setPreferredSlotMinutes] = useState<SlotDuration>(30);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [moreDetails, setMoreDetails] = useState('');
  const [aiDrafting, setAiDrafting] = useState(false);
  const [consent, setConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState({ email: false, sms: false });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [joinPath, setJoinPath] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const sessionQuote = useMemo(() => getPublicEnlightenmentSessionQuote(email), [email, status]);

  const urgencySignal: BookingUrgencySignal = useMemo(() => {
    const existing = email.trim().includes('@') ? findLeadCapturesByEmail(email.trim())[0] : undefined;
    return {
      band: existing ? scoreLead(existing).band : undefined,
      urgencyText: `${timeline} ${goal}`,
    };
  }, [email, timeline, goal]);

  const aiDraftAgenda = async () => {
    if (aiDrafting) return;
    setAiDrafting(true);
    try {
      const existing = email.trim().includes('@') ? findLeadCapturesByEmail(email.trim())[0] : undefined;
      const res = await draftBookingAgenda({
        focusLabel: focus,
        goalText: goal || meetingAgenda,
        crmNotes: existing ? [existing.interest ?? '', existing.offer ?? ''].filter(Boolean) : undefined,
      });
      setMeetingAgenda(res.text);
    } finally {
      setAiDrafting(false);
    }
  };

  const canSend =
    fullName.trim().length > 1 &&
    email.trim().includes('@') &&
    Boolean(selectedSlot) &&
    consent &&
    status !== 'sending';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || !selectedSlot) return;
    setStatus('sending');
    setStatusMsg(null);
    setJoinPath(null);
    try {
      const notes = [
        `Focus: ${focus}`,
        goal.trim() ? `Goal:\n${goal.trim()}` : '',
        `Timeline: ${timeline.trim() || '—'}`,
        moreDetails.trim() ? `Details:\n${moreDetails.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const res = await submitLeadCapture({
        source: 'consultation',
        offer: 'enlightenment_session',
        interest: focus,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
        funnelPath: '/enlightenment-session',
        consentEmailMarketing: marketingConsent.email,
        consentSmsMarketing: marketingConsent.sms,
      });

      if (sessionQuote.paymentRequired && isFeatureEnabled('stripeEnabled') && isSupabaseConfigured) {
        // Paid follow-up session — create the pending request, then route to Stripe.
        // The event is confirmed automatically once payment succeeds (see finish() above).
        const pubReq = createPublicAppointmentRequest({
          topic: 'enlightenment',
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          preferredSlotMinutes,
          availabilityNotes: `Preferred slot: ${formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)}`,
          selectedSlotStartAt: selectedSlot.startAt,
          selectedSlotEndAt: selectedSlot.endAt,
          freeSessionApplied: sessionQuote.freeSessionApplied,
          sessionPriceCents: sessionQuote.sessionPriceCents,
          paymentRequired: sessionQuote.paymentRequired,
          meetingAgenda: meetingAgenda.trim() || undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notes,
        });
        window.dispatchEvent(new Event('finely:store'));
        addLeadNote(
          res.lead.id,
          [`Enlightenment session request (paid follow-up)`, `Focus: ${focus}`, `Phone: ${phone.trim() || '—'}`, `Timeline: ${timeline.trim() || '—'}`, ``, `Goal:`, goal.trim() || '—'].join('\n'),
        );

        try {
          const checkout = await createPublicSessionCheckout({
            requestId: pubReq.id,
            email: email.trim(),
            fullName: fullName.trim(),
            amountCents: pubReq.sessionPriceCents!,
            topic: 'enlightenment',
          });
          emitPlatformEvent({
            type: 'automation.triggered',
            tenantId: 'finely_cred',
            leadId: res.lead.id,
            entityType: 'lead',
            entityId: res.lead.id,
            payload: {
              kind: 'funnel_session_booked',
              funnelId: 'enlightenment_session',
              requestId: pubReq.id,
              focus,
              slotLabel: formatSlotRange(selectedSlot.startAt, selectedSlot.endAt),
              fullName: fullName.trim(),
              email: email.trim(),
              paymentRequired: true,
              agentPersonaId: 'appointment_setter',
            },
          });
          window.location.href = checkout.url;
          return;
        } catch (checkoutErr: any) {
          setStatus('sent');
          setStatusMsg(
            `Request saved. Stripe checkout unavailable (${checkoutErr?.message || 'error'}) — our team will send a manual payment link.`,
          );
          return;
        }
      }

      // Default path — free session, instant confirm (Phase 4 "Booking overhaul").
      const { event, joinPath: guestJoinPath, confirmedLabel } = await confirmPublicSlotBooking({
        topic: 'enlightenment',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        agenda: meetingAgenda.trim() || undefined,
        notes,
        selectedSlot,
        durationMinutes: preferredSlotMinutes,
        freeSessionApplied: sessionQuote.freeSessionApplied,
        sessionPriceCents: sessionQuote.sessionPriceCents,
        paymentRequired: sessionQuote.paymentRequired,
      });

      addLeadNote(
        res.lead.id,
        [
          `Enlightenment session confirmed instantly`,
          `Focus: ${focus}`,
          `Phone: ${phone.trim() || '—'}`,
          `Slot: ${confirmedLabel}`,
          `Marketing opt-in: email=${marketingConsent.email ? 'yes' : 'no'}, sms=${marketingConsent.sms ? 'yes' : 'no'}`,
          `Timeline: ${timeline.trim() || '—'}`,
          ``,
          `Goal:`,
          goal.trim() || '—',
        ].join('\n'),
      );

      emitPlatformEvent({
        type: 'automation.triggered',
        tenantId: 'finely_cred',
        leadId: res.lead.id,
        entityType: 'lead',
        entityId: res.lead.id,
        payload: {
          kind: 'funnel_session_booked',
          funnelId: 'enlightenment_session',
          requestId: event.sourceRequestId ?? '',
          focus,
          slotLabel: confirmedLabel,
          fullName: fullName.trim(),
          email: email.trim(),
          paymentRequired: false,
          agentPersonaId: 'appointment_setter',
        },
      });

      setJoinPath(guestJoinPath);
      setStatus('sent');
      setStatusMsg(
        res.remote === 'ok'
          ? `Confirmed — ${confirmedLabel}. Check your email for the calendar invite and join link.`
          : res.remote === 'not_configured'
            ? `Confirmed locally — ${confirmedLabel}. Configure Supabase to sync submissions remotely.`
            : `Confirmed — ${confirmedLabel}. Remote sync failed: ${res.remoteError ?? 'unknown error'}`,
      );
      setGoal('');
      setTimeline('');
      setMoreDetails('');
      setMarketingConsent({ email: false, sms: false });
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(err?.message || 'Failed to submit. Please try again or use the Contact page.');
    }
  };

  return (
    <PageShell
      badge="Public"
      title="Book an Enlightenment session"
      subtitle="Pick a date and time — first Enlightenment session free, confirmed instantly."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Back
          </button>
          <a href="/" className={FINELY_OS_BACK_LINK}>
            Home
          </a>
        </div>

        <MarketingStaffChatStrip
          roleId="appointment_setter"
          goal="not_sure"
          roleLabel="session coordinator"
          subline="Questions before booking? Chat now — we confirm real time slots instantly."
          buttonTone="secondary"
        />

        <div className={FINELY_OS_BANNER}>
          <Sparkles size={16} className="mt-0.5 text-emerald-300 shrink-0" />
          <p className={FINELY_OS_ENTITY_BODY}>
            First Enlightenment session is free · follow-ups $100 · pick a specific time (e.g. 5:00 PM) · calendar invite + reminder after you confirm.
          </p>
        </div>

        <div className="space-y-6 w-full min-w-0">
          {statusMsg ? (
            <div
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                status === 'sent' ? FINELY_OS_NOTICE_SUCCESS : status === 'error' ? FINELY_OS_NOTICE_ERROR : FINELY_OS_NOTICE_WARN
              }`}
            >
              {status === 'sent' ? <CheckCircle2 size={18} className="shrink-0" /> : <ShieldAlert size={18} className="shrink-0" />}
              <div className="min-w-0 break-words">
                <div>{statusMsg}</div>
                {status === 'sent' && joinPath ? (
                  <button type="button" onClick={() => navigate(joinPath)} className="mt-2 underline text-emerald-200 text-sm">
                    Open audio-first join room
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-6 min-w-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 items-start w-full min-w-0">
              <section className={`${finelyOsCatalogCard('sky')} !p-5 sm:!p-6 lg:!p-7 min-w-0 overflow-hidden fc-surface-harmony space-y-5`} aria-labelledby="enlightenment-time-heading">
                <header className="space-y-1.5 border-b border-white/10 pb-4">
                  <h2 id="enlightenment-time-heading" className={FINELY_OS_ENTITY_VALUE}>Date &amp; time</h2>
                  <p className={`text-sm leading-relaxed ${FINELY_OS_ENTITY_SUBLABEL}`}>Your contact info and the slot you want — confirmed instantly when eligible.</p>
                </header>

                <div className="space-y-4 min-w-0">
                  <div className="grid sm:grid-cols-2 xl:grid-cols-1 gap-4">
                    <div className="min-w-0">
                      <label className={formLabel}>Full name</label>
                      <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={formInput} placeholder="Your name" maxLength={120} required />
                    </div>
                    <div className="min-w-0">
                      <label className={formLabel}>Email</label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} className={formInput} placeholder="you@email.com" maxLength={180} required />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label className={formLabel}>Phone (optional)</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={formInput} placeholder="(555) 555-5555" maxLength={40} />
                  </div>

                  <PublicSessionSlotPicker
                    durationMinutes={preferredSlotMinutes}
                    onDurationChange={setPreferredSlotMinutes}
                    selectedDay={selectedDay}
                    onDayChange={setSelectedDay}
                    selectedSlot={selectedSlot}
                    onSlotChange={setSelectedSlot}
                    urgencySignal={urgencySignal}
                    embeddedInPanel
                  />

                  {selectedSlot ? (
                    <div className={FINELY_OS_NOTICE_SUCCESS}>
                      Your session: <strong>{formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)}</strong>
                    </div>
                  ) : selectedDay ? (
                    <div className={FINELY_OS_NOTICE_WARN}>Select a time above before confirming.</div>
                  ) : null}
                </div>
              </section>

              <section className={`${finelyOsCatalogCard('violet')} !p-5 sm:!p-6 lg:!p-7 min-w-0 overflow-hidden fc-surface-harmony space-y-5`} aria-labelledby="enlightenment-details-heading">
                <header className="space-y-1.5 border-b border-white/10 pb-4">
                  <h2 id="enlightenment-details-heading" className={FINELY_OS_ENTITY_VALUE}>Session details</h2>
                  <p className={`text-sm leading-relaxed ${FINELY_OS_ENTITY_SUBLABEL}`}>Meeting agenda, goals, and consent — tell us what to cover on the call.</p>
                </header>

                <div className="space-y-5 min-w-0">
                <VoiceDictationChooser
                  agenda={meetingAgenda}
                  details={moreDetails}
                  onAgendaChange={setMeetingAgenda}
                  onDetailsChange={setMoreDetails}
                  agendaRightSlot={
                    <button
                      type="button"
                      onClick={() => void aiDraftAgenda()}
                      disabled={aiDrafting}
                      className="inline-flex items-center gap-1 rounded-lg border border-violet-400/40 bg-violet-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-violet-100 hover:bg-violet-500/15 disabled:opacity-50"
                    >
                      <Sparkles size={11} /> {aiDrafting ? 'Drafting…' : 'AI-draft'}
                    </button>
                  }
                />

                <div className={sessionQuote.paymentRequired ? FINELY_OS_NOTICE_WARN : FINELY_OS_NOTICE_SUCCESS}>
                  {sessionQuote.paymentRequired
                    ? 'This email already used the free Enlightenment session. Additional sessions are $100 — confirmed when payment clears.'
                    : 'Eligible for one free Enlightenment session — confirmed the instant you submit.'}
                </div>

                <label className={`flex items-start gap-3 ${FINELY_OS_ENTITY_BODY} cursor-pointer`}>
                  <input type="checkbox" className="mt-1 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span className="min-w-0 break-words">
                    I consent to be contacted about this request. Educational workflow support only — not legal or financial advice.
                  </span>
                </label>

                <details className="group" open={moreOpen} onToggle={(e) => setMoreOpen((e.target as HTMLDetailsElement).open)}>
                  <summary className={`flex cursor-pointer list-none items-center gap-1.5 ${FINELY_OS_ENTITY_SUBLABEL} text-white/55 hover:text-white/80 select-none`}>
                    <ChevronDown size={13} className="transition-transform group-open:rotate-180" />
                    Focus, timeline &amp; goals (optional)
                  </summary>
                  <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                    <div className="space-y-1.5">
                      <span className={FINELY_OS_ENTITY_LABEL}>Session focus</span>
                      <div className="flex flex-wrap gap-1.5">
                        {FOCUS_LANES.map((l) => {
                          const active = l === focus;
                          return (
                            <button
                              key={l}
                              type="button"
                              onClick={() => setFocus(l)}
                              className={`px-2.5 py-1.5 text-[10px] font-bold ${finelyOsGlowTile(active ? 'violet' : 'sky', active)}`}
                            >
                              {l}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className={formLabel}>Timeline</label>
                      <input value={timeline} onChange={(e) => setTimeline(e.target.value)} className={formInput} placeholder="ASAP, 30 days…" maxLength={80} />
                    </div>
                    <div>
                      <label className={formLabel}>Goal (optional)</label>
                      <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} className={`${formInput} resize-y`} placeholder="What are you trying to accomplish?" />
                    </div>
                    <MarketingConsentBlock value={marketingConsent} onChange={setMarketingConsent} phone={phone} />
                  </div>
                </details>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
                  <button type="submit" disabled={!canSend} className={`${FINELY_OS_SUCCESS_BTN} min-h-[44px] disabled:opacity-60`}>
                    {status === 'sending' ? 'Confirming…' : sessionQuote.paymentRequired ? 'Continue to $100 payment' : 'Book an Enlightenment session'}{' '}
                    <ArrowRight size={14} />
                  </button>
                  <button type="button" onClick={() => navigate('/contact')} className={`${FINELY_OS_SECONDARY_BTN} min-h-[44px]`}>
                    Contact instead
                  </button>
                </div>
                </div>
              </section>
            </div>
          </form>

          <div className={`flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 ${FINELY_OS_ENTITY_BODY}`}>
            <Phone size={14} className="mt-0.5 shrink-0 text-sky-300" />
            <p className="text-[11px] leading-relaxed break-words">
              What happens next: your slot locks instantly → calendar invite by email → reminder before your Enlightenment session → map your plan live together.
            </p>
          </div>
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
