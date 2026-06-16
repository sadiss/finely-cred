import React, { type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { FINELY_OS_ENTITY_INPUT } from '../../features/os/finelyOsLightUi';

export type FunnelLeadCaptureFormProps = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  consent: boolean;
  marketing: boolean;
  busy: boolean;
  err: string | null;
  submitLabel?: string;
  totalValue?: number;
  trustLabel?: string;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onConsentChange: (v: boolean) => void;
  onMarketingChange: (v: boolean) => void;
  onSubmit: (e: FormEvent) => void;
};

export function FunnelLeadCaptureForm({
  id = 'fg-capture',
  firstName,
  lastName,
  email,
  phone,
  consent,
  marketing,
  busy,
  err,
  submitLabel = 'Get the free kit',
  totalValue = 297,
  trustLabel = '10k+',
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPhoneChange,
  onConsentChange,
  onMarketingChange,
  onSubmit,
}: FunnelLeadCaptureFormProps) {
  return (
    <div id={id} className="fg-capture-card scroll-mt-24 rounded-[1.65rem] border border-sky-200/15 bg-white/[0.055] p-4 sm:p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Free access pass</p>
          <h3 className="mt-1 text-xl font-black leading-tight text-white">Unlock the guide and portal preview.</h3>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-200/30 bg-sky-200/10 text-sky-100">
          <Mail className="h-5 w-5" />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {['PDF guide', 'Portal preview', '$0 today'].map((item) => (
          <div key={item} className="rounded-xl border border-white/[0.08] bg-slate-200/[0.07] px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-white/75">
            {item}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-2.5">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <input
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="First name"
            className={FINELY_OS_ENTITY_INPUT}
            autoComplete="given-name"
            required
          />
          <input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Last name"
            className={FINELY_OS_ENTITY_INPUT}
            autoComplete="family-name"
            required
          />
        </div>
        <input
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Email"
          type="email"
          className={FINELY_OS_ENTITY_INPUT}
          autoComplete="email"
          required
        />
        <input
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="Phone"
          type="tel"
          className={FINELY_OS_ENTITY_INPUT}
          autoComplete="tel"
          required
        />
        <label className="flex items-start gap-2 text-[11px] leading-snug text-white/55">
          <input type="checkbox" checked={consent} onChange={(e) => onConsentChange(e.target.checked)} className="mt-0.5" />
          I agree to be contacted about my download (required).
        </label>
        <label className="flex items-start gap-2 text-[11px] leading-snug text-white/45">
          <input type="checkbox" checked={marketing} onChange={(e) => onMarketingChange(e.target.checked)} className="mt-0.5" />
          Send me credit tips by email (optional).
        </label>
        {err ? <div className="text-sm text-rose-300">{err}</div> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full fg-cta-primary py-4 rounded-xl font-black uppercase tracking-wider text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {busy ? 'Sending…' : submitLabel} <ArrowRight className="w-4 h-4" />
        </button>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-white/45">
          <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1.5">
            <Lock className="w-3 h-3" /> No credit card
          </span>
          <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1.5">
            <ShieldCheck className="w-3 h-3" /> Secure delivery
          </span>
        </div>
      </form>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-white/40">
        <CheckCircle2 className="h-3 w-3 text-sky-200" /> ${totalValue} value · trusted by {trustLabel} partners
      </p>
    </div>
  );
}
