import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Download, Link2, Share2 } from 'lucide-react';
import {
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import {
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
  className?: string;
}

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
  className = '',
}: DigitalInviteCardShareProps) {
  const design = getDigitalInviteDesign(role);
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
        title: `Finely Cred — ${design.roleTitle} invite`,
        text: design.valueProp,
        url,
      });
      if (!shared) await downloadInviteCardPng(cardRef.current, role);
    } finally {
      setBusy(null);
    }
  }, [design.roleTitle, design.valueProp, role, url]);

  const handleCopy = useCallback(async () => {
    setCopied(await copyInviteLink(url));
  }, [url]);

  const cap = Math.min(maxWidth ?? design.width, design.width);
  const displayWidth = width > 0 ? Math.min(width, cap) : cap;

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
    <div className={`flex flex-col gap-3 ${className}`}>
      <div ref={containerRef} className="w-full">
        {clickable ? (
          <a
            className="fcdc-studio-link"
            href={url}
            aria-label={`Open the ${design.roleTitle} invite`}
            style={{ width: displayWidth }}
          >
            {card}
          </a>
        ) : (
          card
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2" data-no-capture="true">
        <button type="button" onClick={handleDownload} disabled={busy !== null} className={FINELY_OS_PRIMARY_BTN}>
          <Download className="h-3.5 w-3.5" />
          {busy === 'download' ? 'Rendering…' : 'Download card'}
        </button>

        {canShare ? (
          <button type="button" onClick={handleShare} disabled={busy !== null} className={FINELY_OS_SECONDARY_BTN}>
            <Share2 className="h-3.5 w-3.5" />
            {busy === 'share' ? 'Preparing…' : 'Share'}
          </button>
        ) : null}

        <button type="button" onClick={handleCopy} className={FINELY_OS_SECONDARY_BTN}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          {copied ? 'Link copied' : 'Copy invite link'}
        </button>
      </div>

      <p className="text-[11px] leading-relaxed text-white/45">
        Saves a print-ready PNG at {design.width * 2} × {design.height * 2}. Every scan and click through this
        card is attributed to the partner who shared it.
      </p>
    </div>
  );
}
