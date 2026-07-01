import React, { useMemo, useState } from 'react';
import { Building2, CheckCircle2, Lock, Mail, Phone, User } from 'lucide-react';

type StepProps = {
  next: () => void;
  prev?: () => void;
  data: any;
  update: (data: any) => void;
};

export { AgentOperatingModelStep, AgentTierStep } from './AgentOperatingModelStep';

export function ProfileAndAccountStep({
  prev,
  data,
  update,
  onSubmit,
  isBusy = false,
  error,
  isConfigured = true,
  lockedEmail = false,
}: Omit<StepProps, 'next'> & {
  onSubmit: () => void;
  isBusy?: boolean;
  error?: string | null;
  isConfigured?: boolean;
  lockedEmail?: boolean;
}) {
  const role = data.role || 'client';
  const showMailing = role === 'client';
  const [useMailing, setUseMailing] = useState(
    Boolean((data.address1 || '').trim() || (data.city || '').trim()),
  );
  const confirmPassword = data.confirmPassword || '';
  const passwordsMatch = !data.password || data.password === confirmPassword;
  const passwordOk = (data.password || '').length >= 8;

  return (
    <div className="space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 text-left min-w-0">
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-[0.35em] sm:tracking-[0.6em] text-fuchsia-400 uppercase">Profile & account</p>
        <h2 className="fc-onboarding-step-title">
          Your details in <span className="text-fuchsia-400">one place</span>
        </h2>
        <p className="text-white/45 text-base sm:text-lg font-light max-w-2xl">
          Name, contact, login, and optional mailing address — saved to your profile and synced with your partner file.
          Update anytime under Account settings after sign-in.
        </p>
        <div className="rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/5 p-4 max-w-2xl text-sm text-white/55 leading-relaxed">
          <strong className="text-fuchsia-200">You choose your password here</strong> (minimum 8 characters). Finely does not email a temporary password.
          After signup, you may receive a Supabase confirmation email (if enabled) plus a welcome email when our comms system is active.
        </div>
      </div>

      {!isConfigured && (
        <div className="p-4 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30">
          <p className="text-xs text-fuchsia-200/90 leading-relaxed">
            Supabase is not configured — local demo mode will still create a test account in this browser.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-5xl min-w-0">
        <div className="fc-light-glass-panel fc-light-chrome-panel p-4 sm:p-6 space-y-4 min-w-0">
          <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
            <User size={14} className="text-fuchsia-300" /> Personal
          </div>
          <label className="block space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Full legal name</span>
            <input
              value={data.name || ''}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Jane Doe"
              className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Phone</span>
            <div className="relative">
              <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={data.phone || ''}
                onChange={(e) => update({ phone: e.target.value })}
                placeholder="(555) 555-5555"
                className="w-full bg-fc-input border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"
                inputMode="tel"
              />
            </div>
          </label>
        </div>

        <div className="fc-light-glass-panel fc-light-chrome-panel p-4 sm:p-6 space-y-4 min-w-0">
          <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
            <Lock size={14} className="text-fuchsia-300" /> Login
          </div>
          <label className="block space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40">
              Email{lockedEmail ? <span className="ml-2 text-fuchsia-300/80">(pre-filled · cannot change)</span> : null}
            </span>
            <div className="relative">
              <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={data.email || ''}
                onChange={lockedEmail ? undefined : (e) => update({ email: e.target.value.trim() })}
                readOnly={lockedEmail}
                placeholder="you@email.com"
                className={`w-full bg-fc-input border rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none ${
                  lockedEmail
                    ? 'border-fuchsia-500/40 bg-fuchsia-500/10 cursor-not-allowed opacity-80'
                    : 'border-white/[0.08] focus:border-violet-500'
                }`}
                autoComplete="email"
              />
            </div>
          </label>
          <label className="block space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Password</span>
            <input
              type="password"
              value={data.password || ''}
              onChange={(e) => update({ password: e.target.value })}
              placeholder="At least 8 characters"
              className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"
              autoComplete="new-password"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => update({ confirmPassword: e.target.value })}
              placeholder="Repeat password"
              className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"
              autoComplete="new-password"
            />
            {confirmPassword && !passwordsMatch ? (
              <div className="text-red-300 text-xs">Passwords do not match.</div>
            ) : null}
            {data.password && !passwordOk ? (
              <div className="text-fuchsia-200/80 text-xs">Use at least 8 characters.</div>
            ) : null}
          </label>
        </div>
      </div>

      {role === 'client' ? (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-6 space-y-4 max-w-5xl">
          <div className="text-[10px] font-black uppercase tracking-widest text-sky-300">Funding goal (optional)</div>
          <p className="text-white/45 text-sm">Sets your capital target on the dashboard — tied to readiness progress, not a guarantee.</p>
          <div className="flex flex-wrap items-center gap-3 max-w-md">
            <span className="text-white/50">$</span>
            <input
              value={data.fundingTarget || ''}
              onChange={(e) => update({ fundingTarget: e.target.value.replace(/[^\d]/g, '') })}
              placeholder="50000"
              className="flex-1 min-w-[120px] bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-sky-500"
              inputMode="numeric"
            />
          </div>
        </div>
      ) : null}

      {showMailing ? (
        <div className="fc-light-glass-panel fc-light-chrome-panel p-6 space-y-4 max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
              <Building2 size={14} className="text-fuchsia-300" /> Mailing address (for letters)
            </div>
            <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
              <input type="checkbox" checked={useMailing} onChange={(e) => setUseMailing(e.target.checked)} />
              Add now
            </label>
          </div>
          {useMailing ? (
            <div className="grid md:grid-cols-2 gap-4">
              <input
                value={data.address1 || ''}
                onChange={(e) => update({ address1: e.target.value })}
                placeholder="Address line 1"
                className="md:col-span-2 w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"
              />
              <input
                value={data.address2 || ''}
                onChange={(e) => update({ address2: e.target.value })}
                placeholder="Apt / Unit (optional)"
                className="md:col-span-2 w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"
              />
              <input
                value={data.city || ''}
                onChange={(e) => update({ city: e.target.value })}
                placeholder="City"
                className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"
              />
              <input
                value={data.state || ''}
                onChange={(e) => update({ state: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="State"
                className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 font-mono"
              />
              <input
                value={data.postalCode || ''}
                onChange={(e) => update({ postalCode: e.target.value.replace(/[^\d\-]/g, '').slice(0, 10) })}
                placeholder="ZIP"
                className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>
          ) : (
            <p className="text-white/45 text-sm">Optional — you can add this later in Account settings or when generating letters.</p>
          )}
        </div>
      ) : null}

      {error ? (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-sm text-red-200">{error}</div>
      ) : null}
    </div>
  );
}
