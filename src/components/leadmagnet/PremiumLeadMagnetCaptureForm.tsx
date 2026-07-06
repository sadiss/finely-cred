import React, { useMemo, useState } from 'react';
import { ArrowRight, Mail, Phone, User } from 'lucide-react';
import { submitLeadCapture } from '../../data/leadsRepo';
import type { LeadGoal, LeadOffer } from '../../domain/leads';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type Props = {
  offer: LeadOffer;
  interest: string;
  funnelPath: string;
  funnelId: string;
  goal: LeadGoal;
  guideId: string;
  accentClass?: string;
  buttonClass?: string;
  layout?: 'stack' | 'inline';
};

const DEFAULT_BUTTON =
  'group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-xl border border-[#ffe7a3]/60 bg-[linear-gradient(135deg,#8c5b16_0%,#d7a73f_42%,#ffe7a3_68%,#b8791d_100%)] px-7 text-[12px] font-black uppercase tracking-[0.12em] text-[#06101f] shadow-[0_18px_55px_rgba(215,167,63,0.30),inset_0_1px_0_rgba(255,255,255,0.45)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70';

const INPUT =
  'h-14 w-full rounded-xl border border-white/12 bg-white/[0.93] pl-11 pr-4 text-sm text-[#06101f] outline-none transition placeholder:text-slate-500 focus:ring-4';

export function PremiumLeadMagnetCaptureForm({
  offer,
  interest,
  funnelPath,
  funnelId,
  goal,
  guideId,
  accentClass = 'focus:border-[#f4d273] focus:ring-[#d7a73f]/15',
  buttonClass = DEFAULT_BUTTON,
  layout = 'stack',
}: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const phoneOk = useMemo(() => phone.replace(/\D/g, '').length >= 10, [phone]);

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

    setStatus('sending');
    try {
      const result = await submitLeadCapture({
        source: 'lead_magnet',
        offer,
        interest,
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
        consentEmailMarketing: true,
        consentSmsMarketing: true,
        funnelPath,
        funnelId,
        goal,
        guideId,
      });
      setStatus('sent');
      setMessage(
        result?.remote === 'ok'
          ? 'You are in. Your free guide request was received.'
          : 'You are in. The request was captured.',
      );
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
    } catch (err: unknown) {
      setStatus('error');
      setMessage((err as Error)?.message || 'Something went wrong. Please try again.');
    }
  }

  const fieldClass = cn(INPUT, accentClass);

  return (
    <form
      onSubmit={onSubmit}
      className={cn('grid gap-3', layout === 'inline' && 'md:grid-cols-2')}
    >
      <label className="relative block">
        <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d7a73f]/75" size={16} />
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          className={fieldClass}
          maxLength={80}
          required
        />
      </label>
      <label className="relative block">
        <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d7a73f]/75" size={16} />
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          className={fieldClass}
          maxLength={80}
          required
        />
      </label>
      <label className="relative block">
        <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d7a73f]/75" size={16} />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          type="email"
          className={fieldClass}
          maxLength={180}
          required
        />
      </label>
      <label className="relative block">
        <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d7a73f]/75" size={16} />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          type="tel"
          className={fieldClass}
          maxLength={24}
          required
        />
      </label>
      <button type="submit" disabled={status === 'sending'} className={cn(buttonClass, layout === 'inline' && 'md:col-span-2')}>
        <span className="relative z-10 flex items-center justify-center gap-2">
          {status === 'sending' ? 'Sending...' : 'Get My Free Guide'} <ArrowRight size={16} />
        </span>
      </button>
      {message && (
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
      )}
    </form>
  );
}
