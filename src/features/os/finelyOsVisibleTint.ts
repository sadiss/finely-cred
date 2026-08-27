/**
 * Visible transparent tints — Finely Cred light-surface standard.
 *
 * Transparent fills that still read as the intended color on ivory/white beds.
 * NOT washed pink/sky wash: stronger fill (24–32%), saturated border, dark ink text.
 *
 * Use on: alerts, errors, noticed rows, validation, info strips on light workspace.
 */

export type FinelyOsVisibleTintTone =
  | 'rose'
  | 'blocking'
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'violet'
  | 'fuchsia';

const SHELL: Record<FinelyOsVisibleTintTone, string> = {
  rose: 'rounded-xl border border-rose-400/60 bg-rose-500/[0.28] text-rose-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
  blocking:
    'rounded-xl border border-rose-500/70 bg-rose-600/[0.32] text-rose-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]',
  emerald:
    'rounded-xl border border-emerald-400/58 bg-emerald-500/[0.26] text-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
  sky: 'rounded-xl border border-sky-400/58 bg-sky-500/[0.26] text-sky-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
  amber:
    'rounded-xl border border-amber-400/58 bg-amber-400/[0.30] text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
  violet:
    'rounded-xl border border-violet-400/55 bg-violet-500/[0.24] text-violet-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
  fuchsia:
    'rounded-xl border border-fuchsia-400/55 bg-fuchsia-500/[0.24] text-fuchsia-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
};

const ICON: Record<FinelyOsVisibleTintTone, string> = {
  rose: 'text-rose-600',
  blocking: 'text-rose-700',
  emerald: 'text-emerald-600',
  sky: 'text-sky-600',
  amber: 'text-amber-700',
  violet: 'text-violet-600',
  fuchsia: 'text-fuchsia-600',
};

const MUTED: Record<FinelyOsVisibleTintTone, string> = {
  rose: 'text-rose-800/75',
  blocking: 'text-rose-900/80',
  emerald: 'text-emerald-800/75',
  sky: 'text-sky-800/75',
  amber: 'text-amber-900/75',
  violet: 'text-violet-800/75',
  fuchsia: 'text-fuchsia-800/75',
};

/** Shell classes for a visible transparent tint block on light beds. */
export function finelyOsVisibleTintShell(tone: FinelyOsVisibleTintTone, extra = '') {
  return `${SHELL[tone]} ${extra}`.trim();
}

export function finelyOsVisibleTintIcon(tone: FinelyOsVisibleTintTone) {
  return ICON[tone];
}

export function finelyOsVisibleTintMuted(tone: FinelyOsVisibleTintTone) {
  return MUTED[tone];
}

export function finelyOsVisibleTintBody(tone: FinelyOsVisibleTintTone) {
  return `text-sm font-medium ${tone === 'blocking' || tone === 'rose' ? 'text-rose-950' : MUTED[tone].replace('/75', '')}`;
}

/** Map alert tones → visible tint tone */
export function alertToneToVisibleTint(tone: 'info' | 'warning' | 'success' | 'blocking'): FinelyOsVisibleTintTone {
  if (tone === 'blocking') return 'blocking';
  if (tone === 'warning') return 'amber';
  if (tone === 'success') return 'emerald';
  return 'sky';
}
