/** Distinct button fills for /personal-credit — never duplicate adjacent CTAs. */
export const PC_RESTORE_BTN = {
  gold: 'pc-restore-btn pc-restore-btn--emerald',
  platinum: 'pc-restore-btn pc-restore-btn--sky',
  emerald: 'pc-restore-btn pc-restore-btn--emerald',
  sky: 'pc-restore-btn pc-restore-btn--sky',
  violet: 'pc-restore-btn pc-restore-btn--violet',
  ghost: 'pc-restore-btn pc-restore-btn--ghost',
  ghostLight: 'pc-restore-btn pc-restore-btn--ghost-light',
  roseLink: 'pc-restore-btn pc-restore-btn--link-rose',
} as const;

export function pcRestoreCardClass(
  accent: 'amber' | 'emerald' | 'sky' | 'violet' | 'rose',
  glass = false,
) {
  const base = glass ? 'pc-restore-card pc-restore-card--glass' : 'pc-restore-card';
  return `${base} pc-restore-card--${accent}`;
}
