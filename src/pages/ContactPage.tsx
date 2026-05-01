import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Mail, Phone, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';
import { MarketingConsentBlock } from '../components/fields/MarketingConsentBlock';

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
      badge="Public"
      title="Contact"
      subtitle="Get in touch for support, affiliate inquiries, or to start your credit and funding journey."
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

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 fc-card p-6 space-y-4">
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
                  placeholder="Tell us what you need. Avoid sharing full SSNs or sensitive identifiers in this form."
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
                  I consent to be contacted about this request (email/in-app). I understand this is not legal or financial advice.
                </span>
              </label>

              <MarketingConsentBlock value={marketingConsent} onChange={setMarketingConsent} phone={phone} />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={!canSend}
                  className="fc-button-brand disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? 'Sending…' : 'Send'} <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  className="fc-button-soft"
                >
                  Apply instead <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="fc-panel p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Mail size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Email</span>
              </div>
              <p className="text-white/60 text-sm">
                For bureau letters or large attachments, email support and reference your partner email if you have one.
              </p>
              <a
                href="mailto:partnersupport@finelycred.com?subject=Finely%20Cred%20Support"
                className="fc-button-brand"
              >
                Email support <ArrowRight size={14} />
              </a>
            </div>

            <div className="fc-card p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Phone size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Quick links</span>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/faq')}
                  className="w-full fc-button-soft justify-between text-sm normal-case tracking-normal"
                >
                  FAQ <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/portal/messages')}
                  className="w-full fc-button-soft justify-between text-sm normal-case tracking-normal"
                >
                  Partner support inbox <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/affiliate')}
                  className="w-full fc-button-soft justify-between text-sm normal-case tracking-normal"
                >
                  Affiliate program <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

