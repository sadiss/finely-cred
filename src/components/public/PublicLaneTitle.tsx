/**
 * PublicLaneTitle — renders a lane-specific hero title (position + size + eyebrow
 * treatment) so major public pages get a distinct first-viewport silhouette instead
 * of the same centered glass hero everywhere. Wraps `LandingTypewriterTitle`.
 *
 * Also exports `publicLaneCardClass` for a matching card-motif shell.
 */
import React from 'react';
import {
  LandingTypewriterTitle,
  type LandingTitleTag,
} from '../landing/LandingTypewriterTitle';
import {
  getPublicLaneKit,
  type PublicLaneCardMotif,
  type PublicLaneId,
  type PublicLaneKit,
} from '../../config/publicLaneIdentity';
import { finelyOsCatalogCard, type FinelyOsPublicAccent } from '../../features/os/finelyOsLightUi';

export type PublicLaneTone = 'dark' | 'ivory';

const SIZE_CLASS: Record<PublicLaneKit['titleSize'], string> = {
  display: 'text-5xl sm:text-6xl lg:text-[4.25rem]',
  xl: 'text-4xl sm:text-5xl lg:text-[3.35rem]',
  lg: 'text-3xl sm:text-4xl lg:text-[2.75rem]',
};

const TONE_TITLE: Record<PublicLaneTone, string> = {
  dark: 'fc-light-contrast-title text-white font-black tracking-tight leading-[1.08]',
  ivory: 'text-[#0a1628] font-black tracking-tight leading-[1.08]',
};

function eyebrowColor(tone: PublicLaneTone): string {
  return tone === 'ivory' ? 'text-[#b8860b]' : 'text-amber-300';
}

function renderEyebrow(kit: PublicLaneKit, eyebrow: string, icon: React.ReactNode | undefined, tone: PublicLaneTone) {
  const color = eyebrowColor(tone);

  if (kit.eyebrowStyle === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${
          tone === 'ivory'
            ? 'border-amber-800/20 bg-amber-500/10 text-[#0a1628]'
            : 'border-white/15 bg-white/5 text-amber-300'
        }`}
      >
        {icon}
        {eyebrow}
      </span>
    );
  }

  if (kit.eyebrowStyle === 'rule') {
    return (
      <div className="space-y-1.5">
        <span className={`text-[11px] font-black uppercase tracking-[0.28em] ${color}`}>{eyebrow}</span>
        {kit.divider ? (
          <span className="block h-[2px] w-16 bg-gradient-to-r from-amber-400 via-amber-300/60 to-transparent" aria-hidden />
        ) : null}
      </div>
    );
  }

  // 'plain' and 'vertical' (vertical is rendered inline by the stack layout below)
  return <span className={`text-[11px] font-black uppercase tracking-[0.28em] ${color}`}>{eyebrow}</span>;
}

export interface PublicLaneTitleProps {
  /** Which lane kit to pull position/size/motif from. */
  lane: PublicLaneId;
  /** Light (ivory/champagne band) vs dark (contrast band) title ink. Default 'dark'. */
  tone?: PublicLaneTone;
  eyebrow: string;
  /** Icon shown in `pill` eyebrows only. */
  icon?: React.ReactNode;
  text: string;
  accentText?: string;
  highlight?: string | string[];
  subtitle?: React.ReactNode;
  as?: LandingTitleTag;
  /** Only used by the `split` position — badge/stat block on the right. */
  rightSlot?: React.ReactNode;
  actions?: React.ReactNode;
  immediate?: boolean;
  speedMs?: number;
  delayMs?: number;
  /** Extra classes on the outer wrapper. */
  className?: string;
  /** Override the computed title className entirely. */
  titleClassName?: string;
  /** Escape hatch — override individual kit fields for one instance. */
  kitOverride?: Partial<PublicLaneKit>;
}

export function PublicLaneTitle({
  lane,
  tone = 'dark',
  eyebrow,
  icon,
  text,
  accentText,
  highlight,
  subtitle,
  as = 'h1',
  rightSlot,
  actions,
  immediate,
  speedMs = 38,
  delayMs = 120,
  className,
  titleClassName,
  kitOverride,
}: PublicLaneTitleProps) {
  const kit: PublicLaneKit = { ...getPublicLaneKit(lane), ...kitOverride };
  const sizeCls = SIZE_CLASS[kit.titleSize];
  const toneCls = TONE_TITLE[tone];
  const highlightCls = tone === 'ivory' ? 'fc-landing-ivory-accent' : 'text-amber-400 font-semibold';
  const titleCls = titleClassName || `${sizeCls} ${toneCls}`;

  const titleNode = (
    <LandingTypewriterTitle
      as={as}
      text={text}
      accentText={accentText}
      highlight={highlight}
      className={titleCls}
      highlightClassName={highlightCls}
      immediate={immediate}
      speedMs={speedMs}
      delayMs={delayMs}
    />
  );

  const eyebrowNode = renderEyebrow(kit, eyebrow, icon, tone);

  if (kit.titlePosition === 'split') {
    return (
      <div className={`flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 ${className ?? ''}`}>
        <div className="max-w-2xl space-y-4 min-w-0">
          {eyebrowNode}
          {titleNode}
          {subtitle}
          {actions ? <div className="flex flex-wrap gap-3 pt-1">{actions}</div> : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    );
  }

  if (kit.titlePosition === 'stack') {
    return (
      <div className={`flex items-stretch gap-4 sm:gap-6 max-w-5xl ${className ?? ''}`}>
        <div className="hidden sm:flex shrink-0 items-center">
          <span
            className={`[writing-mode:vertical-rl] rotate-180 text-[11px] font-black uppercase tracking-[0.32em] py-2 ${eyebrowColor(tone)}`}
          >
            {eyebrow}
          </span>
        </div>
        <div className="flex-1 min-w-0 space-y-4">
          <div className="sm:hidden">{eyebrowNode}</div>
          {titleNode}
          {subtitle}
          {actions ? <div className="flex flex-wrap gap-3 pt-1">{actions}</div> : null}
        </div>
      </div>
    );
  }

  const alignCls = kit.titlePosition === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl text-left';

  return (
    <div className={`relative ${alignCls} space-y-4 ${className ?? ''}`}>
      {kit.stamp ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-8 right-0 select-none text-[6rem] font-black leading-none text-white/[0.04] sm:text-[8rem]"
        >
          {kit.stamp}
        </span>
      ) : null}
      <div className={kit.titlePosition === 'center' ? 'flex justify-center' : ''}>{eyebrowNode}</div>
      {titleNode}
      {subtitle}
      {actions ? (
        <div className={`flex flex-wrap gap-3 pt-1 ${kit.titlePosition === 'center' ? 'justify-center' : ''}`}>{actions}</div>
      ) : null}
    </div>
  );
}

const RAIL_BORDER: Record<FinelyOsPublicAccent, string> = {
  violet: 'border-l-violet-400',
  emerald: 'border-l-emerald-400',
  amber: 'border-l-amber-400',
  fuchsia: 'border-l-fuchsia-400',
  sky: 'border-l-sky-400',
  rose: 'border-l-rose-400',
};

/** Card shell matching a lane's motif — reuse instead of inventing new card chrome. */
export function publicLaneCardClass(motif: PublicLaneCardMotif, accent: FinelyOsPublicAccent = 'violet'): string {
  switch (motif) {
    case 'panel':
      return finelyOsCatalogCard(accent);
    case 'rail':
      return `rounded-2xl border border-white/10 border-l-4 ${RAIL_BORDER[accent]} bg-black/20 backdrop-blur-sm p-5`;
    case 'deck':
      return 'rounded-xl border border-white/10 bg-black/25 p-4';
    case 'soft':
    default:
      return 'rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5';
  }
}

/** Convenience — resolve card motif + accent straight from a lane id. */
export function publicLaneCardClassForLane(lane: PublicLaneId): string {
  const kit = getPublicLaneKit(lane);
  return publicLaneCardClass(kit.cardMotif, kit.accent);
}
