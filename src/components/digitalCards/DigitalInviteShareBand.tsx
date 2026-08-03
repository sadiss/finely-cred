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
  className?: string;
}

/**
 * The mounted, always-visible home for an invite card on a public page.
 *
 * Renders on its own fixed dark surface with plain utility classes — no theme
 * tokens — so the band looks identical on ivory role pages and dark service
 * pages, and dark copy can never land on a dark panel.
 */
export function DigitalInviteShareBand({
  role,
  inviteUrl,
  heading,
  blurb,
  maxCardWidth = 460,
  className = '',
}: DigitalInviteShareBandProps) {
  const design = getDigitalInviteDesign(role);
  const incentive = getDigitalInviteIncentive(role);
  const isService = design.kind === 'service';

  const steps = isService
    ? [
        'Download the card or copy the invite link.',
        'Send it to the person you are helping — the QR opens their intake.',
        `They start with ${incentive.label.toLowerCase()}, and the visit is tagged to you.`,
      ]
    : [
        'Download the card or copy your invite link.',
        'Post it, text it, or print it — the QR opens the application.',
        `Anyone who joins through it unlocks ${incentive.label.toLowerCase()}.`,
      ];

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-white/12 bg-[#08070f] p-5 sm:p-7 ${className}`}
      style={{
        backgroundImage: `radial-gradient(120% 90% at 0% 0%, rgba(${design.foil.accentRgb}, 0.22) 0%, transparent 58%), radial-gradient(100% 80% at 100% 100%, rgba(${design.foil.mixRgb}, 0.18) 0%, transparent 62%)`,
      }}
      aria-label={`${digitalInviteFullTitle(role)} invite card`}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
        <div className="min-w-0 space-y-4">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]"
            style={{
              borderColor: `rgba(${design.foil.haloRgb}, 0.4)`,
              color: `rgb(${design.foil.haloRgb})`,
              backgroundColor: `rgba(${design.foil.accentRgb}, 0.12)`,
            }}
          >
            <QrCode className="h-3.5 w-3.5" />
            {isService ? 'Invite someone' : 'Share & get credit'}
          </span>

          <h3 className="text-xl sm:text-2xl font-semibold leading-tight text-white">
            {heading ?? design.shareHeading}
          </h3>
          <p className="max-w-xl text-sm leading-relaxed text-white/70">{blurb ?? design.shareBlurb}</p>

          <div
            className="flex items-start gap-3 rounded-2xl border p-3.5"
            style={{
              borderColor: `rgba(${design.foil.haloRgb}, 0.28)`,
              backgroundColor: `rgba(${design.foil.accentRgb}, 0.1)`,
            }}
          >
            <Gift className="mt-0.5 h-4 w-4 shrink-0" style={{ color: `rgb(${design.foil.haloRgb})` }} />
            <p className="text-sm leading-relaxed text-white/85">
              <span className="font-semibold text-white">Invite bonus — {incentive.label}.</span>{' '}
              {incentive.description}
            </p>
          </div>

          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                <span
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black"
                  style={{
                    backgroundColor: `rgba(${design.foil.haloRgb}, 0.18)`,
                    color: `rgb(${design.foil.haloRgb})`,
                  }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="w-full lg:w-[var(--fcdc-band-card,460px)]" style={{ maxWidth: maxCardWidth }}>
          <DigitalInviteCardShare role={role} inviteUrl={inviteUrl} maxWidth={maxCardWidth} tone="onDark" />
        </div>
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-white/45">
        Results vary · not legal advice · payouts subject to verification and program terms.
      </p>
    </section>
  );
}
