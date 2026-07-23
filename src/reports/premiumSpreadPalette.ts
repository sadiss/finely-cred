import { rgb, type RGB } from 'pdf-lib';

/** Finely Cred report palette: forest, obsidian, ivory, amber, emerald, and controlled multicolor accents. */
export const SPREAD_PALETTE = {
  gold: rgb(0.86, 0.62, 0.16),
  goldLight: rgb(0.98, 0.74, 0.22),
  amber: rgb(0.96, 0.48, 0.12),
  amberSoft: rgb(1, 0.78, 0.36),
  green: rgb(0.08, 0.72, 0.43),
  greenDark: rgb(0.02, 0.24, 0.16),
  forest: rgb(0.03, 0.14, 0.1),
  forestSoft: rgb(0.06, 0.23, 0.17),
  emerald: rgb(0.07, 0.78, 0.52),
  violet: rgb(0.48, 0.32, 0.88),
  fuchsia: rgb(0.86, 0.2, 0.66),
  rose: rgb(0.92, 0.24, 0.34),
  sky: rgb(0.18, 0.62, 0.92),
  ink: rgb(0.07, 0.08, 0.07),
  cream: rgb(0.976, 0.949, 0.886),
  ivory: rgb(0.992, 0.976, 0.94),
  ivorySoft: rgb(0.946, 0.914, 0.846),
  dark: rgb(0.025, 0.036, 0.032),
  darkPanel: rgb(0.045, 0.065, 0.058),
  obsidian: rgb(0.012, 0.018, 0.016),
  white: rgb(1, 1, 1),
  soft: rgb(0.38, 0.4, 0.37),
  muted: rgb(0.58, 0.54, 0.46),
} as const satisfies Record<string, RGB>;

export type SpreadColorKey = keyof typeof SPREAD_PALETTE;
