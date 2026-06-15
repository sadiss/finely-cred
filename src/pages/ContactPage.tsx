import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Mail, Phone, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';
import { MarketingConsentBlock } from '../components/fields/MarketingConsentBlock';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
} from '../features/os/finelyOsLightUi';

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');

export default function ContactPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Contact Finely Cred',
    description: 'Reach support, sales, or partnerships — we respond within one business day.',
    path: '/contact',
  });
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState({ email: false, sms: false });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [contactTab, setContactTab] = useState<'inquiry' | 'links'>('inquiry');

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
        funnelPath: '/contact',
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
      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="Support"
          title="Contact Finely Cred"
          subtitle="Support, affiliate inquiries, or help starting your credit and funding journey."
          accent="fuchsia"
          tabs={[
            { id: 'inquiry', label: 'Send message' },
            { id: 'links', label: 'Quick links' },
          ]}
          activeTab={contactTab}
          onTabChange={(id) => setContactTab(id as 'inquiry' | 'links')}
          primaryAction={{ label: 'Book strategy call', onClick: () => navigate('/consultation') }}
          secondaryAction={{ label: 'FAQ', onClick: () => navigate('/faq') }}
        >
        {contactTab === 'inquiry' ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className="inline-flex items-center gap-2 text-fuchsia-400">
              <Send size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Send a message</span>
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
                  <label className={formLabel}>Phone (optional)</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={formInput} placeholder="(555) 555-5555" maxLength={40} />
                </div>
                <div>
                  <label className={formLabel}>Subject</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} className={formInput} placeholder="Billing, disputes, affiliate, etc." maxLength={140} required />
                </div>
              </div>

              <div>
                <label className={formLabel}>Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className={`${formInput} resize-y min-h-[140px]`}
                  placeholder="Tell us what you need. Avoid sharing full SSNs or sensitive identifiers in this form."
                  required
                />
              </div>

              <label className={`flex items-start gap-3 ${FINELY_OS_ENTITY_BODY} cursor-pointer`}>
                <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>
                  I consent to be contacted about this request (email/in-app). I understand this is not legal or financial advice.
                </span>
              </label>

              <MarketingConsentBlock value={marketingConsent} onChange={setMarketingConsent} phone={phone} />

              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={!canSend} className={FINELY_OS_SUCCESS_BTN}>
                  {status === 'sending' ? 'Sending…' : 'Send'} <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_SECONDARY_BTN}>
                  Apply instead <ArrowRight size={14} />
                </button>
              </div>
            </form>
        </div>
        ) : (
        <div className="space-y-4">
          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
            <div className="inline-flex items-center gap-2 text-fuchsia-400">
              <Mail size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Email</span>
            </div>
            <p className={FINELY_OS_ENTITY_BODY}>
              For bureau letters or large attachments, email support and reference your partner email if you have one.
            </p>
            <a href="mailto:partnersupport@finelycred.com?subject=Finely%20Cred%20Support" className={FINELY_OS_SUCCESS_BTN}>
              Email support <ArrowRight size={14} />
            </a>
          </div>
          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
            <div className="inline-flex items-center gap-2 text-fuchsia-400">
              <Phone size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Helpful links</span>
            </div>
            <div className="space-y-2">
              <button type="button" onClick={() => navigate('/faq')} className={`w-full justify-between ${FINELY_OS_SECONDARY_BTN}`}>
                FAQ <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => navigate('/login')} className={`w-full justify-between ${FINELY_OS_SECONDARY_BTN}`}>
                Partner sign in <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => navigate('/affiliate')} className={`w-full justify-between ${FINELY_OS_SECONDARY_BTN}`}>
                Affiliate program <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
        )}
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="support_specialist"
          goal="not_sure"
          roleLabel="partner success specialist"
          subline="Prefer live chat over the form? We typically respond within one business day."
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
