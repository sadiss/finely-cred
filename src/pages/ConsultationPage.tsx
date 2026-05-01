import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldAlert, Calendar, Phone, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';
import { createPublicAppointmentRequest } from '../data/calendarRepo';
import type { ConsultationTopic } from '../domain/calendar';
import { MarketingConsentBlock } from '../components/fields/MarketingConsentBlock';

type ConsultLane =
  | 'In‑House Financing (Primary Tradeline)'
  | 'Authorized Users (AU)'
  | 'Debt Kill (Debt & Legal)'
  | 'Personal Credit'
  | 'Business Credit'
  | 'Wealth Builder'
  | 'Other';

const LANES: ConsultLane[] = [
  'In‑House Financing (Primary Tradeline)',
  'Authorized Users (AU)',
  'Debt Kill (Debt & Legal)',
  'Personal Credit',
  'Business Credit',
  'Wealth Builder',
  'Other',
];

export default function ConsultationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillLane = useMemo(() => {
    const lane = searchParams.get('lane');
    const match = LANES.find((l) => l.toLowerCase().includes((lane || '').toLowerCase()));
    return match ?? 'In‑House Financing (Primary Tradeline)';
  }, [searchParams]);

  const [lane, setLane] = useState<ConsultLane>(prefillLane);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState('');
  const [timeline, setTimeline] = useState('');
  const [preferredSlotMinutes, setPreferredSlotMinutes] = useState<20 | 30 | 60>(30);
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const [consent, setConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState({ email: false, sms: false });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const laneToTopic = (l: ConsultLane): ConsultationTopic => {
    if (l.includes('Debt')) return 'debt_summons';
    if (l.includes('Personal')) return 'credit_restore';
    if (l.includes('Business')) return 'business_build';
    return 'other';
  };

  const canSend =
    fullName.trim().length > 1 &&
    email.trim().includes('@') &&
    availabilityNotes.trim().length > 0 &&
    consent &&
    status !== 'sending';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setStatus('sending');
    setStatusMsg(null);
    try {
      createPublicAppointmentRequest({
        topic: laneToTopic(lane),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        preferredSlotMinutes,
        availabilityNotes: availabilityNotes.trim(),
        notes: [goal.trim(), `Timeline: ${timeline.trim() || '—'}`].filter(Boolean).join('\n'),
      });
      window.dispatchEvent(new Event('finely:store'));

      const res = await submitLeadCapture({
        source: 'consultation',
        offer: 'consultation_booking',
        interest: lane,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
        consentEmailMarketing: marketingConsent.email,
        consentSmsMarketing: marketingConsent.sms,
      });

      addLeadNote(
        res.lead.id,
        [
          `Enlightenment session request`,
          `Lane: ${lane}`,
          `Phone: ${phone.trim() || '—'}`,
          `Marketing opt-in: email=${marketingConsent.email ? 'yes' : 'no'}, sms=${marketingConsent.sms ? 'yes' : 'no'}`,
          `Timeline: ${timeline.trim() || '—'}`,
          ``,
          `Goal:`,
          goal.trim() || '—',
        ].join('\n'),
      );

      setStatus('sent');
      setStatusMsg(
        res.remote === 'ok'
          ? 'Request received. Our team will reach out to schedule your enlightenment session.'
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
      title="Book a Free Enlightenment Session"
      subtitle="Education-first routing. We map the safest path for your goals — then you choose DIY or Done‑For‑You."
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <a href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Home
          </a>
        </div>

        <div className="fc-panel border-emerald-500/25 bg-emerald-500/10 p-5 text-sm text-emerald-100 flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 text-emerald-300" />
          <div>
            <div className="font-semibold text-white">In‑House Financing is education‑first</div>
            <p className="mt-1 text-white/70">
              We don’t treat financing as a shortcut. If it’s used, it should support a credit-building plan and help you
              qualify for better options over time. Terms vary and are disclosed inside your contract.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 fc-card p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Calendar size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Request a session</span>
            </div>

            {statusMsg && (
              <div
                className={`rounded-2xl border p-4 text-sm flex items-start gap-3 ${
                  status === 'sent'
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                    : status === 'error'
                      ? 'border-amber-500/25 bg-amber-500/10 text-amber-100'
                      : 'border-white/10 bg-black/30 text-white/70'
                }`}
              >
                {status === 'sent' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                <div>{statusMsg}</div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Session lane</label>
                <select
                  value={lane}
                  onChange={(e) => setLane(e.target.value as ConsultLane)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm outline-none focus:border-[rgba(var(--brand-primary-rgb),0.55)] transition-colors"
                >
                  {LANES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="fc-input"
                    placeholder="Your name"
                    maxLength={120}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="fc-input"
                    placeholder="you@email.com"
                    maxLength={180}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="fc-input"
                    placeholder="(555) 555-5555"
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Timeline (optional)</label>
                  <input
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="fc-input"
                    placeholder="ASAP, 30 days, 90 days…"
                    maxLength={80}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Preferred session length</label>
                <select
                  value={preferredSlotMinutes}
                  onChange={(e) => setPreferredSlotMinutes(Number(e.target.value) as 20 | 30 | 60)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm outline-none focus:border-[rgba(var(--brand-primary-rgb),0.55)] transition-colors"
                >
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                  Availability <span className="text-amber-400">(required)</span>
                </label>
                <textarea
                  value={availabilityNotes}
                  onChange={(e) => setAvailabilityNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm resize-y outline-none focus:border-[rgba(var(--brand-primary-rgb),0.55)] transition-colors"
                  placeholder="e.g. Weekday evenings, Tuesday/Thursday mornings, anytime after 3pm…"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                  What are you trying to accomplish?
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={5}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm resize-y outline-none focus:border-[rgba(var(--brand-primary-rgb),0.55)] transition-colors"
                  placeholder="Tell us your goal. Avoid sharing full SSNs or sensitive identifiers in this form."
                />
              </div>

              <label className="flex items-start gap-3 text-white/70 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  I consent to be contacted about this request (email/text/call). I understand this is educational and
                  workflow support, not legal or financial advice.
                </span>
              </label>

              <MarketingConsentBlock value={marketingConsent} onChange={setMarketingConsent} phone={phone} />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={!canSend}
                  className="fc-button-brand disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? 'Submitting…' : 'Request session'} <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/tradelines?focus=primary')}
                  className="fc-button-soft normal-case tracking-normal"
                >
                  View primary lane <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="fc-panel p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Phone size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">What happens next</span>
              </div>
              <ol className="text-white/60 text-sm space-y-2 list-decimal pl-5">
                <li>We review your request and confirm the right lane (AU vs Primary vs Debt Kill, etc.).</li>
                <li>We schedule your enlightenment session and map the safest plan for your goals.</li>
                <li>You choose DIY access or Done‑For‑You execution.</li>
              </ol>
            </div>

            <div className="fc-card p-6 space-y-3">
              <div className="text-white font-semibold">Quick links</div>
              <button
                type="button"
                onClick={() => navigate('/tradelines?focus=au')}
                className="w-full fc-button-soft justify-between text-sm normal-case tracking-normal"
              >
                AU Marketplace <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="w-full fc-button-soft justify-between text-sm normal-case tracking-normal"
              >
                Pricing <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="w-full fc-button-soft justify-between text-sm normal-case tracking-normal"
              >
                Contact <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

