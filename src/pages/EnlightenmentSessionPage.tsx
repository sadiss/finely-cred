import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Phone, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { createPublicAppointmentRequest, getPublicEnlightenmentSessionQuote, markPublicSessionPaid } from '../data/calendarRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { MarketingConsentBlock } from '../components/fields/MarketingConsentBlock';
import { PublicSessionSlotPicker } from '../components/calendar/PublicSessionSlotPicker';
import { formatSlotRange, type BookableSlot } from '../lib/calendarSlots';
import type { SlotDuration } from '../domain/calendar';
import { captureLeadAttributionFromUrl } from '../lib/leadAttribution';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { createPublicSessionCheckout, verifyPublicSessionCheckout } from '../lib/publicSessionCheckoutClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,

  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsLeadMagnetPanel,
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

type SessionHubTab = 'book' | 'prep';

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');
const formSelect = FINELY_OS_ENTITY_SELECT;

export default function EnlightenmentSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  usePublicSeoMeta({
    title: 'Book a strategy call',
    description: 'Free consultation for personal credit, business credit, debt strategy, tradelines, and funding readiness.',
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
      setStatus('sent');
      setStatusMsg('Payment received — your additional strategy call is pending calendar confirmation.');
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
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const [consent, setConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState({ email: false, sms: false });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [hubTab, setHubTab] = useState<SessionHubTab>('book');
  const sessionQuote = useMemo(() => getPublicEnlightenmentSessionQuote(email), [email, status]);

  const canSend =
    fullName.trim().length > 1 &&
    email.trim().includes('@') &&
    Boolean(selectedSlot) &&
    consent &&
    status !== 'sending';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setStatus('sending');
    setStatusMsg(null);
    try {
      const pubReq = createPublicAppointmentRequest({
        topic: 'enlightenment',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        preferredSlotMinutes,
        availabilityNotes: selectedSlot
          ? `Preferred slot: ${formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)}`
          : availabilityNotes.trim(),
        selectedSlotStartAt: selectedSlot?.startAt,
        selectedSlotEndAt: selectedSlot?.endAt,
        freeSessionApplied: sessionQuote.freeSessionApplied,
        sessionPriceCents: sessionQuote.sessionPriceCents,
        paymentRequired: sessionQuote.paymentRequired,
        meetingAgenda: meetingAgenda.trim() || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: [
          `Focus: ${focus}`,
          goal.trim() ? `Goal:\n${goal.trim()}` : '',
          `Timeline: ${timeline.trim() || '—'}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      });
      window.dispatchEvent(new Event('finely:store'));

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

      addLeadNote(
        res.lead.id,
        [
          `Strategy call request`,
          `Focus: ${focus}`,
          `Phone: ${phone.trim() || '—'}`,
          `Marketing opt-in: email=${marketingConsent.email ? 'yes' : 'no'}, sms=${marketingConsent.sms ? 'yes' : 'no'}`,
          `Timeline: ${timeline.trim() || '—'}`,
          ``,
          `Goal:`,
          goal.trim() || '—',
          ``,
          `Availability:`,
          availabilityNotes.trim(),
        ].join('\n'),
      );

      if (
        sessionQuote.paymentRequired &&
        isFeatureEnabled('stripeEnabled') &&
        isSupabaseConfigured &&
        pubReq.sessionPriceCents
      ) {
        try {
          const checkout = await createPublicSessionCheckout({
            requestId: pubReq.id,
            email: email.trim(),
            fullName: fullName.trim(),
            amountCents: pubReq.sessionPriceCents,
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
              slotLabel: selectedSlot
                ? formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)
                : availabilityNotes.trim() || 'Pending scheduling',
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
          slotLabel: selectedSlot
            ? formatSlotRange(selectedSlot.startAt, selectedSlot.endAt)
            : availabilityNotes.trim() || 'Pending scheduling',
          fullName: fullName.trim(),
          email: email.trim(),
          paymentRequired: sessionQuote.paymentRequired,
          agentPersonaId: 'appointment_setter',
        },
      });

      setStatus('sent');
      setStatusMsg(
        res.remote === 'ok'
          ? sessionQuote.paymentRequired
            ? 'Slot request received. Enable Stripe or our team will send the payment link before confirming.'
            : 'Free strategy call slot received. Our team will confirm the calendar invite.'
          : res.remote === 'not_configured'
            ? 'Request saved locally on this device. Configure Supabase to receive submissions remotely.'
            : `Request saved locally. Remote submit failed: ${res.remoteError ?? 'unknown error'}`,
      );
      setGoal('');
      setTimeline('');
      setMarketingConsent({ email: false, sms: false });
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(err?.message || 'Failed to submit. Please try again or use the Contact page.');
    }
  };

  return (
    <PageShell
      badge="Public"
      title="Book a strategy call"
      subtitle="Education-first routing. We map the safest path for your goals — then you choose DIY or Done‑For‑You."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Back
          </button>
          <a href="/" className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Home
          </a>
        </div>

        <MarketingStaffChatStrip
          roleId="appointment_setter"
          goal="not_sure"
          roleLabel="session coordinator"
          subline="Questions before booking? Chat now — we confirm slots and send calendar details after you request."
          buttonTone="secondary"
        />

        <FinelyUnifiedHubLayout
          eyebrow="Public booking"
          title="Strategy call"
          subtitle="Education-first routing — map the safest path, then choose DIY or Done-For-You."
          accent="emerald"
          kpis={[
            { label: 'First session', value: 'Free', accent: 'emerald' },
            { label: 'Follow-up', value: '$100', accent: 'amber' },
          ]}
          tabs={[
            { id: 'book', label: 'Book' },
            { id: 'prep', label: 'What to expect' },
          ]}
          activeTab={hubTab}
          onTabChange={(id) => setHubTab(id as SessionHubTab)}
          primaryAction={{ label: 'Pricing', onClick: () => navigate('/pricing') }}
          secondaryAction={{ label: 'Personal credit', onClick: () => navigate('/personal-credit') }}
        >
          {hubTab === 'prep' && (
            <>
              <div className={FINELY_OS_BANNER}>
                <Sparkles size={18} className="mt-0.5 text-emerald-700 shrink-0" />
                <div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-emerald-200`}>This session is designed to clarify your next steps</div>
                  <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                    Your first strategy call is free. Additional calls are $100 and use the same protected slot calendar.
                  </p>
                </div>
              </div>
              <div className={`${finelyOsLeadMagnetPanel('emerald')} !p-6 space-y-4`} data-fc-accent="emerald">
                <div className="inline-flex items-center gap-2 text-violet-700">
                  <Phone size={18} />
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>What happens next</span>
                </div>
                <ol className={`${FINELY_OS_ENTITY_BODY} space-y-2 list-decimal pl-5`}>
                  <li>We review your request and confirm the right lane.</li>
                  <li>We schedule your strategy call and map the safest plan for your goals.</li>
                  <li>You choose DIY access or Done‑For‑You execution.</li>
                </ol>
              </div>
            </>
          )}

          {hubTab === 'book' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
            <div className="inline-flex items-center gap-2 text-violet-700">
              <Calendar size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Request a session</span>
            </div>

            {statusMsg && (
              <div
                className={`flex items-start gap-3 ${
                  status === 'sent' ? FINELY_OS_NOTICE_SUCCESS : status === 'error' ? FINELY_OS_NOTICE_ERROR : FINELY_OS_NOTICE_WARN
                }`}
              >
                {status === 'sent' ? <CheckCircle2 size={18} className="shrink-0" /> : <ShieldAlert size={18} className="shrink-0" />}
                <div>{statusMsg}</div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className={formLabel}>Session focus</label>
                <select value={focus} onChange={(e) => setFocus(e.target.value as FocusLane)} className={formSelect}>
                  {FOCUS_LANES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={formLabel}>Full name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={formInput} placeholder="Your name" maxLength={120} required />
                </div>
                <div>
                  <label className={formLabel}>Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className={formInput} placeholder="you@email.com" maxLength={180} required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={formLabel}>Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={formInput} placeholder="(555) 555-5555" maxLength={40} />
                </div>
                <div>
                  <label className={formLabel}>Timeline (optional)</label>
                  <input value={timeline} onChange={(e) => setTimeline(e.target.value)} className={formInput} placeholder="ASAP, 30 days, 90 days…" maxLength={80} />
                </div>
              </div>

              <PublicSessionSlotPicker
                durationMinutes={preferredSlotMinutes}
                onDurationChange={setPreferredSlotMinutes}
                selectedDay={selectedDay}
                onDayChange={setSelectedDay}
                selectedSlot={selectedSlot}
                onSlotChange={setSelectedSlot}
              />

              <div className={sessionQuote.paymentRequired ? FINELY_OS_NOTICE_WARN : FINELY_OS_NOTICE_SUCCESS}>
                {sessionQuote.paymentRequired
                  ? 'This email already used the free strategy call. Additional calls are $100.'
                  : 'This email is eligible for one free strategy call.'}
              </div>

              <div>
                <label className={formLabel}>Meeting agenda</label>
                <textarea value={meetingAgenda} onChange={(e) => setMeetingAgenda(e.target.value)} rows={3} className={`${formInput} resize-y min-h-[88px]`} placeholder="What should we cover on the call?" />
              </div>

              <div>
                <label className={formLabel}>
                  Additional availability notes <span className="text-slate-400 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <textarea value={availabilityNotes} onChange={(e) => setAvailabilityNotes(e.target.value)} rows={3} className={`${formInput} resize-y min-h-[88px]`} placeholder="e.g. Weekday evenings, Tuesday mornings…" />
              </div>

              <div>
                <label className={formLabel}>What are you trying to accomplish?</label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={5}
                  className={`${formInput} resize-y min-h-[120px]`}
                  placeholder="Tell us your goal. Avoid sharing full SSNs or sensitive identifiers in this form."
                />
              </div>

              <label className={`flex items-start gap-3 ${FINELY_OS_ENTITY_BODY} cursor-pointer`}>
                <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>
                  I consent to be contacted about this request (email/text/call). I understand this is educational and
                  workflow support, not legal or financial advice.
                </span>
              </label>

              <MarketingConsentBlock value={marketingConsent} onChange={setMarketingConsent} phone={phone} />

              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={!canSend} className={`${FINELY_OS_SUCCESS_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}>
                  {status === 'sending' ? 'Submitting…' : sessionQuote.paymentRequired ? 'Request $100 session' : 'Request free session'}{' '}
                  <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => navigate('/contact')} className={FINELY_OS_SECONDARY_BTN}>
                  Contact instead <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
