/**
 * Typed helpers for `finelyMaterials.css` ("fcm-*"). These deliberately do
 * NOT duplicate any colour value — they only emit the class names and
 * `data-fcm-*` attributes that the CSS keys its Tier 2 tokens off of, so the
 * palette stays owned by one file. Spread the return value onto a JSX
 * element's props, e.g. `<div {...fcmDepth('violet', 'dark')}>`.
 */
import type { CSSProperties } from 'react';

/** The four rotating brand accents plus the metallic neutral. */
export type FcmAccent = 'emerald' | 'violet' | 'sky' | 'rose' | 'platinum';
export type FcmBed = 'light' | 'dark';
export type FcmFoilVariant = 'emerald' | 'platinum' | 'violet';
export type FcmMetalVariant = 'emerald' | 'violet' | 'graphite';
export type FcmPlateVariant = 'platinum' | 'graphite';

export interface FcmDivProps {
  className: string;
  'data-fcm-accent'?: FcmAccent;
  'data-bed'?: FcmBed;
  'data-fcm-motion'?: 'on';
  style?: CSSProperties;
}

/**
 * Non-adjacent brand rotation order (emerald -> violet -> sky -> rose).
 * Never place two same-family accents next to each other on a row/grid —
 * use `nextFcmAccent` when iterating a list of cards/tiles.
 */
export const FCM_ACCENT_ROTATION: readonly FcmAccent[] = ['emerald', 'violet', 'sky', 'rose'];

/** Returns the next accent in the brand rotation. Platinum has no rotation slot and wraps to emerald. */
export function nextFcmAccent(prev: FcmAccent): FcmAccent {
  const idx = FCM_ACCENT_ROTATION.indexOf(prev as (typeof FCM_ACCENT_ROTATION)[number]);
  if (idx === -1) return FCM_ACCENT_ROTATION[0];
  return FCM_ACCENT_ROTATION[(idx + 1) % FCM_ACCENT_ROTATION.length];
}

/**
 * Stacked radial colour depth (`.fcm-depth`). Default bed is light — the
 * workspace's native bed; pass `'dark'` for the ~2 dark moments per page.
 */
export function fcmDepth(accent: FcmAccent = 'emerald', bed: FcmBed = 'light'): FcmDivProps {
  return { className: 'fcm-depth', 'data-fcm-accent': accent, 'data-bed': bed };
}

/** Specular dome overlay (`.fcm-lacquer`). Host needs `position: relative; overflow: hidden`. */
export function fcmLacquer(bed: FcmBed = 'light'): FcmDivProps {
  return { className: 'fcm-lacquer', 'data-bed': bed };
}

/** background-clip:text foil (`.fcm-foil`). Use on a `<span>`, not a block container. */
export function fcmFoil(variant: FcmFoilVariant = 'emerald'): string {
  return `fcm-foil fcm-foil--${variant}`;
}

/**
 * The jewel orb (`.fcm-jewel`). Size clamps 40-96px — past that the pulse's
 * box-shadow animation gets expensive; swap to a transform-based glow instead.
 */
export function fcmJewel(accent: FcmAccent = 'emerald', size = 64): FcmDivProps {
  const clamped = Math.min(96, Math.max(40, size));
  return {
    className: 'fcm-jewel',
    'data-fcm-accent': accent,
    style: { '--fcm-jewel-size': `${clamped}px` } as CSSProperties,
  };
}

/** Brushed metal plate (`.fcm-plate`), platinum by default — never gold. */
export function fcmPlate(variant: FcmPlateVariant = 'platinum'): string {
  return variant === 'graphite' ? 'fcm-plate fcm-plate--graphite' : 'fcm-plate';
}

/** SVG grain overlay (`.fcm-grain`). Host needs `position: relative; overflow: hidden`. */
export function fcmGrain(): string {
  return 'fcm-grain';
}

/** Always-on accent glow ring (`.fcm-glow-ring`), 1:1 with FINELY_OS_GLOW's numbers. */
export function fcmGlowRing(accent: FcmAccent = 'violet'): FcmDivProps {
  return { className: 'fcm-glow-ring', 'data-fcm-accent': accent };
}

/** Blurred pedestal glow beneath a luminous object (`.fcm-pedestal`). Host needs `position: relative`. */
export function fcmPedestal(accent: FcmAccent = 'emerald'): FcmDivProps {
  return { className: 'fcm-pedestal', 'data-fcm-accent': accent };
}

/**
 * Traveling sheen (`.fcm-sheen`). `enabled` opts into the idle 9s loop via
 * `data-fcm-motion="on"` — budget max 2 concurrent enabled sheens per view.
 * Leave `enabled` false for every sheen beyond your two most important ones.
 */
export function fcmSheen(enabled: boolean): FcmDivProps {
  return enabled
    ? { className: 'fcm-sheen', 'data-fcm-motion': 'on' }
    : { className: 'fcm-sheen' };
}

/** Letter-studio corner radial wash (`.fcm-corner-wash`), panel-scaled by default for compact density. */
export function fcmCornerWash(accent: FcmAccent = 'emerald', scale: 'hero' | 'panel' = 'panel'): FcmDivProps {
  return {
    className: scale === 'panel' ? 'fcm-corner-wash fcm-corner-wash--panel' : 'fcm-corner-wash',
    'data-fcm-accent': accent,
  };
}

/** backdrop-filter glass (`.fcm-glass`). Cap: ~3 instances per view — it is the most expensive material here. */
export function fcmGlass(bed: FcmBed = 'light'): FcmDivProps {
  return { className: 'fcm-glass', 'data-bed': bed };
}

/**
 * Green (or violet/graphite) metallic primary button (`.fcm-btn-metal`).
 * Idle is static; the sheen only plays on hover, by design, to stay inside
 * the motion budget on a page full of buttons.
 */
export function fcmBtnMetal(variant: FcmMetalVariant = 'emerald'): string {
  return variant === 'emerald' ? 'fcm-btn-metal' : `fcm-btn-metal fcm-btn-metal--${variant}`;
}
