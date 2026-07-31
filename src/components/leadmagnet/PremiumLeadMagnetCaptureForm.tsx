import React, { useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Mail, Phone, User } from 'lucide-react';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { submitLeadMagnetCapture } from '../../lib/submitLeadMagnetCapture';
import { addLeadNote } from '../../data/leadOpsRepo';
import { LeadMagnetGuidedSuccessPanel } from './LeadMagnetGuidedSuccessPanel';
import { getLeadMagnetPremiumProfile } from './leadMagnetPremiumProfiles';
import './leadMagnetLuxuryStage.css';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type Props = {
  funnelConfig: LeadMagnetFunnelConfig;
  accentClass?: string;
  buttonClass?: string;
  layout?: 'stack' | 'inline';
  submitLabel?: string;
  showBusinessName?: boolean;
  /** Boutique dark-glass fields (default). Pass false to keep legacy light inputs. */
  boutique?: boolean;
};

const DEFAULT_BUTTON =
  'lm-lux-btn lm-lux-cta-sheen group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-xl px-7 text-[12px] font-black uppercase tracking-[0.12em] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70';

const INPUT_LEGACY =
  'h-14 w-full rounded-xl border border-white/12 bg-white/[0.93] pl-11 pr-4 text-sm text-[#06101f] outline-none transition placeholder:text-slate-500 focus:ring-4';

export function PremiumLeadMagnetCaptureForm({
  funnelConfig,
  accentClass = 'focus:border-[#f4d273] focus:ring-[#d7a73f]/15',
  buttonClass = DEFAULT_BUTTON,
  layout = 'stack',
  submitLabel,
  showBusinessName = false,
  boutique = true,
}: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [captured, setCaptured] = useState<{ fullName: string; email: string; phone: string } | null>(null);

  const premiumProfile = getLeadMagnetPremiumProfile(funnelConfig);
  const ctaLabel = submitLabel ?? premiumProfile?.captureHeadline ?? 'Get My Free Guide';

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const phoneOk = useMemo(() => phone.replace(/\D/g, '').length >= 10, [phone]);

  const totalValue = useMemo(
    () => funnelConfig.valueStack.reduce((sum, v) => sum + parseInt(v.value.replace(/\D/g, ''), 10), 0),
    [funnelConfig.valueStack],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!firstName.trim()) {
      setStatus('error');
      setMessage('Please enter your first name.');
      return;
    }
    if (!lastName.trim()) {
      setStatus('error');
      setMessage('Please enter your last name.');
      return;
    }
    if (!emailOk) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    if (!phoneOk) {
      setStatus('error');
      setMessage('Please enter a valid phone number.');
      return;
    }
    if (!consent) {
      setStatus('error');
      setMessage('Please agree to be contacted about your download.');
      return;
    }

    setStatus('sending');
    try {
      const result = await submitLeadMagnetCapture({
        funnelConfig,
        firstName,
        lastName,
        email,
        phone,
        consentToContact: true,
        consentEmailMarketing: marketing,
        consentSmsMarketing: marketing && phoneOk,
      });
      if (businessName.trim()) {
        addLeadNote(result.leadId, `Business: ${businessName.trim()}`);
      }
      setLeadId(result.leadId);
      setCaptured({ fullName: result.fullName, email: result.email, phone: result.phone });
      setStatus('sent');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setBusinessName('');
      setConsent(false);
      setMarketing(false);
      queueMicrotask(() => {
        document.getElementById(`lm-success-${funnelConfig.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err: unknown) {
      setStatus('error');
      setMessage((err as Error)?.message || 'Something went wrong. Please try again.');
    }
  }

  const fieldClass = boutique ? 'lm-lux-field' : cn(INPUT_LEGACY, accentClass);
  const iconClass = boutique
    ? 'lm-lux-field-icon pointer-events-none absolute left-4 top-1/2 -translate-y-1/2'
    : 'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d7a73f]/75';
  const resolvedButton = boutique && buttonClass === DEFAULT_BUTTON
    ? DEFAULT_BUTTON
    : boutique && !buttonClass.includes('lm-lux-cta-sheen') && !buttonClass.includes('lm-lux-btn')
      ? cn(buttonClass, 'lm-lux-cta-sheen relative overflow-hidden')
      : buttonClass;

  if (status === 'sent' && leadId && captured) {
    return (
      <div id={`lm-success-${funnelConfig.id}`} className="scroll-mt-24">
        <LeadMagnetGuidedSuccessPanel
          funnelConfig={funnelConfig}
          leadId={leadId}
          fullName={captured.fullName}
          email={captured.email}
          phone={captured.phone}
        />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn('lm-lux-form grid gap-2.5', layout === 'inline' && 'md:grid-cols-2')}>
      <label className="relative block">
        <User className={iconClass} size={16} />
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          className={fieldClass}
          maxLength={80}
          autoComplete="given-name"
          required
        />
      </label>
      <label className="relative block">
        <User className={iconClass} size={16} />
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          className={fieldClass}
          maxLength={80}
          autoComplete="family-name"
          required
        />
      </label>
      <label className={cn('relative block', layout === 'inline' && 'md:col-span-2')}>
        <Mail className={iconClass} size={16} />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          type="email"
          className={fieldClass}
          maxLength={180}
          autoComplete="email"
          required
        />
      </label>
      <label className={cn('relative block', layout === 'inline' && 'md:col-span-2')}>
        <Phone className={iconClass} size={16} />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          type="tel"
          className={fieldClass}
          maxLength={24}
          autoComplete="tel"
          required
        />
      </label>
      {showBusinessName ? (
        <label className={cn('relative block', layout === 'inline' && 'md:col-span-2')}>
          <BriefcaseBusiness className={iconClass} size={16} />
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business Name (Optional)"
            className={fieldClass}
            maxLength={120}
          />
        </label>
      ) : null}

      <label className={cn('flex items-start gap-2 text-[11px] leading-snug text-white/70', layout === 'inline' && 'md:col-span-2')}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#d7a73f]" required />
        <span>
          I agree to be contacted about my free download and portal preview (required). Educational content only — not legal advice.
        </span>
      </label>
      <label className={cn('flex items-start gap-2 text-[11px] leading-snug text-white/55', layout === 'inline' && 'md:col-span-2')}>
        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 accent-[#d7a73f]" />
        <span>Send me credit tips and follow-ups by email or text (optional). Message/data rates may apply.</span>
      </label>

      <button type="submit" disabled={status === 'sending'} className={cn(resolvedButton, layout === 'inline' && 'md:col-span-2')}>
        <span className="relative z-10 flex items-center justify-center gap-2">
          {status === 'sending' ? 'Sending...' : ctaLabel} <ArrowRight size={16} />
        </span>
      </button>

      <p className={cn('text-center text-[10px] tracking-wide text-white/40', layout === 'inline' && 'md:col-span-2')}>
        ${totalValue}+ value · No credit card · Secure PDF delivery
      </p>

      {message ? (
        <div
          className={cn(
            layout === 'inline' && 'md:col-span-2',
            'rounded-xl border px-4 py-3 text-sm',
            status === 'sent'
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
              : 'border-amber-400/30 bg-amber-400/10 text-amber-100',
          )}
        >
          {message}
        </div>
      ) : null}
    </form>
  );
}
