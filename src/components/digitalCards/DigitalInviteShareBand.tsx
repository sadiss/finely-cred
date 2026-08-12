import React from 'react';
import { Gift, QrCode } from 'lucide-react';
import {
  digitalInviteFullTitle,
  getDigitalInviteDesign,
  getDigitalInviteIncentive,
} from '../../config/digitalInviteCardDesign';
import type { DigitalInviteCardRole } from '../../config/digitalInviteCards';
import { DigitalInviteCardShare } from './DigitalInviteCardShare';

export interface DigitalInviteShareBandProps {
  role: DigitalInviteCardRole;
  /** Inject a promoter/referral URL; defaults to the tracked registry URL. */
  inviteUrl?: string;
  /** Override the heading (defaults to the role's design-layer heading). */
  heading?: string;
  /** Override the supporting line. */
  blurb?: string;
  /** Cap the card preview width inside the band. */
  maxCardWidth?: number;
  /**
   * `ivory` = champagne band with navy ink for wealthy public shells.
   * Default stays the fixed dark band so dark copy never lands on a dark panel.
   */
  surface?: 'default' | 'ivory';
  className?: string;
}

/**
 * The mounted, always-visible home for an invite card on a public page.
 *
 * Default: fixed dark surface with plain utility classes. Pass `surface="ivory"`
 * on wealthy ivory shells so the band does not introduce black page chrome.
 */
export function DigitalInviteShareBand({
  role,
  inviteUrl,
  heading,
  blurb,
  maxCardWidth = 340,
  surface = 'default',
  className = '',
}: DigitalInviteShareBandProps) {
  const design = getDigitalInviteDesign(role);
  const incentive = getDigitalInviteIncentive(role);
  const isService = design.kind === 'service';
  const ivory = surface === 'ivory';

  const steps = isService
    ? [
        'Download or copy the invite link.',
        'Send it — the QR opens their intake.',
        `They start with ${incentive.label.toLowerCase()}.`,
      ]
    : [
        'Download or copy your invite link.',
        'Post, text, or print — QR opens the application.',
        `Joiners unlock ${incentive.label.toLowerCase()}.`,
      ];

  return (
    <section
      className={
        ivory
          ? `relative overflow-hidden rounded-2xl border border-amber-900/12 bg-[#f7f1e6] p-4 sm:p-5 ${className}`
          : `relative overflow-hidden rounded-2xl border border-white/12 bg-[#08070f] p-4 sm:p-5 ${className}`
      }
      style={{
        backgroundImage: ivory
          ? `radial-gradient(120% 90% at 0% 0%, rgba(${design.foil.accentRgb}, 0.14) 0%, transparent 58%), radial-gradient(100% 80% at 100% 100%, rgba(${design.foil.mixRgb}, 0.1) 0%, transparent 62%)`
          : `radial-gradient(120% 90% at 0% 0%, rgba(${design.foil.accentRgb}, 0.22) 0%, transparent 58%), radial-gradient(100% 80% at 100% 100%, rgba(${design.foil.mixRgb}, 0.18) 0%, transparent 62%)`,
      }}
      aria-label={`${digitalInviteFullTitle(role)} invite card`}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.24em]"
            style={{
              borderColor: ivory ? 'rgba(184,134,11,0.35)' : `rgba(${design.foil.haloRgb}, 0.4)`,
              color: ivory ? '#b8860b' : `rgb(${design.foil.haloRgb})`,
              backgroundColor: ivory ? 'rgba(184,134,11,0.08)' : `rgba(${design.foil.accentRgb}, 0.12)`,
            }}
          >
            <QrCode className="h-3 w-3" />
            {isService ? 'Invite someone' : 'Share & get credit'}
          </span>

          <div>
            <h3
              className={`text-lg font-semibold leading-snug sm:text-xl ${
                ivory ? 'text-[#0a1628]' : 'text-white'
              }`}
            >
              {heading ?? design.shareHeading}
            </h3>
            <p className={`mt-1.5 max-w-lg text-sm leading-relaxed ${ivory ? 'text-[#0a1628]/70' : 'text-white/65'}`}>
              {blurb ?? design.shareBlurb}
            </p>
          </div>

          <div
            className="flex items-start gap-2.5 rounded-xl border p-3"
            style={{
              borderColor: ivory ? 'rgba(10,22,40,0.12)' : `rgba(${design.foil.haloRgb}, 0.28)`,
              backgroundColor: ivory ? 'rgba(255,255,255,0.55)' : `rgba(${design.foil.accentRgb}, 0.1)`,
            }}
          >
            <Gift
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{ color: ivory ? '#b8860b' : `rgb(${design.foil.haloRgb})` }}
            />
            <p className={`text-xs leading-relaxed sm:text-sm ${ivory ? 'text-[#0a1628]/80' : 'text-white/85'}`}>
              <span className={`font-semibold ${ivory ? 'text-[#0a1628]' : 'text-white'}`}>
                {incentive.label}
              </span>{' '}
              — {incentive.description}
            </p>
          </div>

          <ol className="grid gap-1.5 sm:grid-cols-3 sm:gap-2">
            {steps.map((step, i) => (
              <li
                key={step}
                className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[11px] leading-snug sm:text-xs ${
                  ivory
                    ? 'border-[#0a1628]/10 bg-white/40 text-[#0a1628]/75'
                    : 'border-white/10 bg-white/[0.04] text-white/65'
                }`}
              >
                <span
                  className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-black"
                  style={{
                    backgroundColor: ivory ? 'rgba(184,134,11,0.14)' : `rgba(${design.foil.haloRgb}, 0.18)`,
                    color: ivory ? '#b8860b' : `rgb(${design.foil.haloRgb})`,
                  }}
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="w-full lg:w-[min(100%,var(--fcdc-band-card,340px))]" style={{ maxWidth: maxCardWidth }}>
          <DigitalInviteCardShare
            role={role}
            inviteUrl={inviteUrl}
            maxWidth={maxCardWidth}
            tone={ivory ? 'onIvory' : 'onDark'}
          />
        </div>
      </div>

      <p className={`mt-4 text-[10px] leading-relaxed ${ivory ? 'text-[#0a1628]/45' : 'text-white/40'}`}>
        Results vary · not legal advice · payouts subject to verification and program terms.
      </p>
    </section>
  );
}
