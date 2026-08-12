import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Download, Link2, Share2 } from 'lucide-react';
import {
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import {
  digitalInviteFullTitle,
  getDigitalInviteDesign,
  getDigitalInviteIncentive,
} from '../../config/digitalInviteCardDesign';
import type { DigitalInviteCardRole } from '../../config/digitalInviteCards';
import { DigitalInviteCard } from './DigitalInviteCard';
import {
  canShareInviteCardImage,
  copyInviteLink,
  downloadInviteCardPng,
  shareInviteCardImage,
} from './downloadInviteCard';
import { resolveInviteUrl } from './inviteCardUrl';

export interface DigitalInviteCardShareProps {
  role: DigitalInviteCardRole;
  /** Inject a promoter/referral URL; defaults to the tracked registry URL. */
  inviteUrl?: string;
  /** Override the on-card incentive sentence. */
  incentiveText?: string;
  /** Cap the preview width so the card sits inside a column. */
  maxWidth?: number;
  /** Clicking the card opens the invite URL. Off inside an existing link. */
  clickable?: boolean;
  /**
   * `onDark` pins the controls to explicit light-on-dark styling. Use it inside
   * a fixed dark surface so the theme's light mode can never paint dark text
   * onto a dark panel. `onIvory` pins navy-on-champagne controls for wealthy
   * ivory shells.
   */
  tone?: 'auto' | 'onDark' | 'onIvory';
  className?: string;
}

const ON_DARK_PRIMARY_BTN =
  'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-200/40 bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[#1a1400] shadow-md shadow-black/30 transition-all hover:brightness-105 disabled:opacity-60 sm:w-auto';

const ON_DARK_SECONDARY_BTN =
  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white transition-colors hover:bg-white/15 disabled:opacity-60 sm:flex-none';

const ON_IVORY_PRIMARY_BTN =
  'inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-800/25 bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[#1a1400] shadow-sm shadow-amber-900/10 transition-all hover:brightness-105 disabled:opacity-60 sm:w-auto';

const ON_IVORY_SECONDARY_BTN =
  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#0a1628]/12 bg-white/70 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[#0a1628] transition-colors hover:bg-white disabled:opacity-60 sm:flex-none';

/**
 * Mountable share block: the invite card plus download / copy / native-share
 * actions. Drop this on a careers or program page — everything else (silhouette,
 * copy, foil, QR payload) comes from the role registry.
 */
export function DigitalInviteCardShare({
  role,
  inviteUrl,
  incentiveText,
  maxWidth,
  clickable = true,
  tone = 'auto',
  className = '',
}: DigitalInviteCardShareProps) {
  const design = getDigitalInviteDesign(role);
  const fullTitle = digitalInviteFullTitle(role);
  const url = inviteUrl ?? resolveInviteUrl(role, { absolute: true });
  // The card prints the short bonus label; the long unlock sentence belongs on
  // the landing page the invite opens.
  const incentive = incentiveText ?? getDigitalInviteIncentive(role).label;

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState<null | 'download' | 'share'>(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => setCanShare(canShareInviteCardImage()), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setBusy('download');
    try {
      await downloadInviteCardPng(cardRef.current, role);
    } finally {
      setBusy(null);
    }
  }, [role]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    setBusy('share');
    try {
      const shared = await shareInviteCardImage(cardRef.current, role, {
        title: `Finely Cred — ${fullTitle} invite`,
        text: design.valueProp,
        url,
      });
      if (!shared) await downloadInviteCardPng(cardRef.current, role);
    } finally {
      setBusy(null);
    }
  }, [design.valueProp, fullTitle, role, url]);

  const handleCopy = useCallback(async () => {
    setCopied(await copyInviteLink(url));
  }, [url]);

  const cap = Math.min(maxWidth ?? design.width, design.width);
  const displayWidth = width > 0 ? Math.min(width, cap) : cap;
  const primaryBtn =
    tone === 'onDark' ? ON_DARK_PRIMARY_BTN : tone === 'onIvory' ? ON_IVORY_PRIMARY_BTN : FINELY_OS_PRIMARY_BTN;
  const secondaryBtn =
    tone === 'onDark' ? ON_DARK_SECONDARY_BTN : tone === 'onIvory' ? ON_IVORY_SECONDARY_BTN : FINELY_OS_SECONDARY_BTN;
  const labelTone =
    tone === 'onIvory' ? 'text-[#0a1628]/55' : tone === 'onDark' ? 'text-white/50' : 'text-white/45';
  const footnoteTone =
    tone === 'onIvory' ? 'text-[#0a1628]/40' : tone === 'onDark' ? 'text-white/45' : 'text-white/40';

  const card = (
    <DigitalInviteCard
      role={role}
      inviteUrl={url}
      incentiveText={incentive}
      displayWidth={displayWidth}
      cardRef={cardRef}
    />
  );

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <div ref={containerRef} className="w-full">
        {clickable ? (
          <a
            className="fcdc-studio-link mx-auto block"
            href={url}
            aria-label={`Open the ${fullTitle} invite`}
            style={{ width: displayWidth, maxWidth: '100%' }}
          >
            {card}
          </a>
        ) : (
          card
        )}
      </div>

      <div className="space-y-2" data-no-capture="true">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${labelTone}`}>Download or share</p>

        <button type="button" onClick={handleDownload} disabled={busy !== null} className={primaryBtn}>
          <Download className="h-3.5 w-3.5 shrink-0" />
          {busy === 'download' ? 'Rendering…' : 'Download card'}
        </button>

        <div className="flex flex-wrap gap-1.5">
          {canShare ? (
            <button type="button" onClick={handleShare} disabled={busy !== null} className={secondaryBtn}>
              <Share2 className="h-3.5 w-3.5 shrink-0" />
              {busy === 'share' ? 'Preparing…' : 'Share'}
            </button>
          ) : null}

          <button type="button" onClick={handleCopy} className={secondaryBtn}>
            {copied ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Link2 className="h-3.5 w-3.5 shrink-0" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      <p className={`text-[10px] leading-snug ${footnoteTone}`}>
        Print-ready PNG · {design.width * 2}×{design.height * 2}px · visits attributed to you
      </p>
    </div>
  );
}
