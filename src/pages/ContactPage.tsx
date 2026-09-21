import React, { useState } from 'react';
import { ArrowRight, Mail, Phone, Send, CheckCircle2, ShieldAlert, Calendar, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';
import { MarketingConsentBlock } from '../components/fields/MarketingConsentBlock';

const SUPPORT_EMAIL = 'partnersupport@finelycred.com';

export default function ContactPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState({ email: false, sms: false });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const canSend =
    fullName.trim().length > 1 &&
    email.trim().includes('@') &&
    subject.trim().length > 2 &&
    message.trim().length > 8 &&
    consent &&
    status !== 'sending';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setStatus('sending');
    setStatusMsg(null);
    try {
      const res = await submitLeadCapture({
        source: 'contact',
        offer: 'general_inquiry',
        interest: subject.trim(),
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
          `Contact form submission`,
          `Subject: ${subject.trim()}`,
          `Phone: ${phone.trim() || '—'}`,
          `Marketing opt-in: email=${marketingConsent.email ? 'yes' : 'no'}, sms=${marketingConsent.sms ? 'yes' : 'no'}`,
          ``,
          message.trim(),
        ].join('\n'),
      );
      setStatus('sent');
      setStatusMsg(
        res.remote === 'ok'
          ? 'Message received. Our team will respond shortly.'
          : res.remote === 'not_configured'
            ? 'Message saved locally on this device. Configure Supabase to receive submissions remotely.'
            : `Message saved locally. Remote submit failed: ${res.remoteError ?? 'unknown error'}`,
      );
      setSubject('');
      setMessage('');
      setMarketingConsent({ email: false, sms: false });
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(err?.message || 'Failed to submit. Please email support instead.');
    }
  };

  return (
    <PageShell
      badge="Contact"
      title="Talk to Finely Cred"
      subtitle="Support, affiliates, and new restore clients — pick email, book a session, or send a message. Forms stay above the chat widget on every screen size."
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-[10px] uppercase tracking-widest text-white/45">Email</div>
            <div className="mt-2 text-lg font-semibold text-white truncate">{SUPPORT_EMAIL}</div>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Finely%20Cred%20Support`}
              className="mt-3 inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
            >
              <Mail size={16} /> Send email
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-[10px] uppercase tracking-widest text-white/45">Partner line</div>
            <div className="mt-2 text-lg font-semibold text-white">Callback by request</div>
            <p className="mt-2 text-sm text-white/55">Include your phone in the form — we route by timezone and case type.</p>
            <a href="tel:+18005550199" className="mt-3 inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
              <Phone size={16} /> Request a call
            </a>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
            <div className="text-[10px] uppercase tracking-widest text-amber-200/80">Fastest start</div>
            <div className="mt-2 text-lg font-semibold text-white">Free enlightenment session</div>
            <button
              type="button"
              onClick={() => navigate('/enlightenment-session')}
              className="mt-3 fc-button-brand text-sm w-full justify-center"
            >
              <Calendar size={16} /> Book session
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-[10px] uppercase tracking-widest text-white/45">Apply</div>
            <div className="mt-2 text-lg font-semibold text-white">Start restore intake</div>
            <button type="button" onClick={() => navigate('/start')} className="mt-3 fc-button-soft text-sm w-full justify-center">
              Start restore <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <aside className="lg:col-span-4 order-2 lg:order-2 space-y-4">
            <div className="fc-panel p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <MessageSquare size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Before you write</span>
              </div>
              <ul className="text-sm text-white/60 space-y-2 list-disc pl-4">
                <li>Do not send full SSNs or account numbers in this form.</li>
                <li>Partners: sign in and use the portal inbox for case updates.</li>
                <li>Bureau letters: email attachments with your partner email in the subject.</li>
              </ul>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/faq')}
                  className="fc-button-soft justify-between text-sm normal-case tracking-normal"
                >
                  FAQ <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/portal/messages')}
                  className="fc-button-soft justify-between text-sm normal-case tracking-normal"
                >
                  Partner inbox <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8 order-1 lg:order-1 fc-card p-6 sm:p-8 space-y-5">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Send size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Send a message</span>
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
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Phone (optional)</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="fc-input"
                    placeholder="(555) 555-5555"
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="fc-input"
                    placeholder="Billing, disputes, affiliate, etc."
                    maxLength={140}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/30 text-sm resize-y outline-none focus:border-[rgba(var(--brand-primary-rgb),0.55)] transition-colors"
                  placeholder="Tell us what you need."
                  required
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
                  I consent to be contacted about this request (email/in-app). I understand this is not legal or financial
                  advice.
                </span>
              </label>

              <MarketingConsentBlock value={marketingConsent} onChange={setMarketingConsent} phone={phone} />

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!canSend}
                  className="fc-button-brand disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? 'Sending…' : 'Send message'} <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => navigate('/onboarding')} className="fc-button-soft">
                  Apply instead <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
