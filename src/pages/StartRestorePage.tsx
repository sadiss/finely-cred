import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldAlert, Sparkles, XCircle } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import {
  START_RESTORE_PACKAGE_ID,
  startRestoreCopyEn,
  startRestoreOffer,
} from '../copy/startRestoreOffer';
import { formatPrice } from '../config/pricingCatalog';

function checkoutUrl() {
  const next = `/portal/checkout?package=${encodeURIComponent(START_RESTORE_PACKAGE_ID)}`;
  const qs = new URLSearchParams();
  qs.set('package', START_RESTORE_PACKAGE_ID);
  qs.set('next', next);
  return `/onboarding?${qs.toString()}`;
}

export default function StartRestorePage() {
  const navigate = useNavigate();
  const copy = startRestoreCopyEn;

  return (
    <PageShell
      badge="Consumer starter"
      title={copy.headline}
      subtitle={copy.subhead}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/10 to-black/40 p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-4xl font-light text-white">{formatPrice(startRestoreOffer.priceTodayCents)}</div>
              <div className="text-white/60 text-sm mt-1">today · one-time starter</div>
            </div>
            <div className="text-right text-white/50 text-xs max-w-xs">
              {copy.depositLine}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(checkoutUrl())}
            className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[11px] hover:brightness-110"
          >
            <Sparkles size={16} /> {copy.ctaPrimary} <ArrowRight size={16} />
          </button>
        </div>

        <section className="space-y-3">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" size={20} /> {copy.includesTitle}
          </h2>
          <ul className="space-y-2 text-white/75 text-sm">
            {copy.includes.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-amber-400">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <XCircle className="text-rose-300" size={20} /> {copy.notIncludedTitle}
          </h2>
          <ul className="space-y-2 text-white/65 text-sm">
            {copy.notIncluded.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-white/30">—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-2">
          <div className="text-amber-400/90 text-xs font-bold uppercase tracking-widest">{copy.creditTitle}</div>
          <p className="text-white/75 text-sm leading-relaxed">{copy.creditBody}</p>
          <p className="text-white/50 text-xs">
            Core Membership and Advanced Credit Restore tiers keep their existing pricing — this starter does not replace them.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 space-y-3 text-sm text-white/70">
          <p className="flex gap-2">
            <ShieldAlert size={18} className="text-amber-400 shrink-0" />
            {copy.honesty}
          </p>
          <p className="text-white/55 text-xs border-t border-white/10 pt-3">{copy.noraNote}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(checkoutUrl())}
            className="px-6 py-3 rounded-xl bg-amber-500 text-black font-semibold text-sm"
          >
            {copy.ctaPrimary}
          </button>
          <button
            type="button"
            onClick={() => navigate('/pricing?tab=personal_credit')}
            className="px-6 py-3 rounded-xl border border-white/15 text-white/80 text-sm hover:bg-white/5"
          >
            {copy.ctaSecondary}
          </button>
          <button
            type="button"
            onClick={() => navigate('/enlightenment-session')}
            className="px-6 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:text-white"
          >
            Free enlightenment session first
          </button>
        </div>

        <p className="text-white/40 text-[11px] leading-relaxed">
          Paste-ready sales note: offer ID <span className="font-mono text-white/55">{START_RESTORE_PACKAGE_ID}</span>.
          For $200 Core deposit, note on the partner record and apply at upgrade (see docs/START-RESTORE-147.md).
        </p>
      </div>
    </PageShell>
  );
}
