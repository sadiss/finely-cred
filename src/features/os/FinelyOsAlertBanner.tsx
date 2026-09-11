import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { finelyOsAlertBanner } from './finelyOsLightUi';
import { alertToneToVisibleTint, finelyOsVisibleTintIcon, finelyOsVisibleTintShell } from './finelyOsVisibleTint';

type Props = {
  tone?: 'info' | 'warning' | 'success' | 'blocking';
  message: string;
  className?: string;
  surface?: 'dark' | 'light';
};

export function FinelyOsAlertBanner({ tone = 'info', message, className = '', surface = 'light' }: Props) {
  const Icon = tone === 'warning' || tone === 'blocking' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;

  if (surface === 'light') {
    const tint = alertToneToVisibleTint(tone);
    return (
      <div
        className={`fc-os-alert fc-wlp-signal ${finelyOsVisibleTintShell(tint)} flex items-start gap-3 text-sm font-bold ${className}`}
        data-fc-os-alert="light"
        data-fc-os-alert-tone={tone}
        data-fc-visible-tint={tint}
      >
        <Icon size={18} className={`fc-os-alert-copy mt-0.5 shrink-0 ${finelyOsVisibleTintIcon(tint)}`} />
        <p className="fc-os-alert-copy">{message}</p>
      </div>
    );
  }

  const cls =
    tone === 'blocking'
      ? 'rounded-xl border border-rose-500/45 bg-rose-500/15 px-4 py-3 text-sm text-rose-100'
      : finelyOsAlertBanner(tone);
  return (
    <div
      className={`fc-os-alert fc-wlp-signal ${cls} flex items-start gap-3 ${className}`}
      data-fc-os-alert="dark"
      data-fc-os-alert-tone={tone}
    >
      <Icon size={18} className="fc-os-alert-copy mt-0.5 shrink-0 opacity-90" />
      <p className="fc-os-alert-copy">{message}</p>
    </div>
  );
}
