import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_TITLE,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

/** L1 Paper — letter-width hero preview (US Letter); surrounding section cards use full hub width */
export const LETTER_L1_PAPER_WRAP = 'w-full max-w-[612px]';
export const LETTER_L1_PAPER_SURFACE =
  'rounded-2xl border border-white/10 bg-white overflow-hidden shadow-lg shadow-black/20';

/** L2 Path — numbered steps + Continue */
export const LETTER_L2_PATH_CARD = finelyOsCatalogCardCompact('amber');
export const LETTER_L2_PATH_TITLE = 'text-lg font-semibold text-white';
export const LETTER_L2_PATH_HINT = `${FINELY_OS_ENTITY_BODY} text-sm`;
export const LETTER_L2_STEP_ROW = 'flex flex-wrap items-center gap-x-1 gap-y-2 max-w-full';
export const LETTER_L2_STEP_ARROW = 'shrink-0 text-amber-300/90';
export const LETTER_L2_STEP_ARROW_MUTED = 'shrink-0 text-white/25';
export const LETTER_L2_STEP_BTN =
  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 sm:px-3.5 sm:py-2.5 min-h-[44px] text-sm font-semibold transition-all max-w-full';
export const LETTER_L2_STEP_NUM =
  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-bold';

/** L3 Context — round / case / track chooser */
export const LETTER_L3_CONTEXT_CARD = finelyOsCatalogCardCompact('fuchsia');
export const LETTER_L3_CONTEXT_TITLE = FINELY_OS_ENTITY_TITLE;
export const LETTER_L3_CONTEXT_BODY = `${FINELY_OS_ENTITY_BODY} text-sm`;

/** L4 Work — address summary, bureau tabs, compact controls */
export const LETTER_L4_WORK_CARD = finelyOsCatalogCardCompact('sky');
export const LETTER_L4_ADDRESS_TITLE = 'text-sm font-semibold text-white';

/** L5 Chrome — upload, coach, disclaimers (bottom, never competes with path) */
export const LETTER_L5_CHROME_COLLAPSE =
  'rounded-xl border border-white/10 bg-black/25 !p-3';
export const LETTER_L5_DISCLAIMER = 'text-xs text-white/45 text-center px-2';

/** Bureau tabs (L4) */
export const LETTER_L4_BUREAU_TAB =
  'min-h-[52px] rounded-2xl border px-4 py-3 text-left transition-all';
export const LETTER_L4_BUREAU_NAME = 'text-base font-semibold leading-tight';
export const LETTER_L4_BUREAU_META = 'mt-0.5 text-sm text-white/60';

/** Track tabs (hub-level) */
export const LETTER_TRACK_TAB =
  'inline-flex items-center gap-2 min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all';
export const LETTER_TRACK_TAB_ACTIVE = 'border-amber-400/55 bg-amber-500/20 text-white shadow-[0_0_20px_-6px_rgba(251,191,36,0.5)]';
export const LETTER_TRACK_TAB_IDLE =
  'border-white/12 bg-black/30 text-white/75 hover:border-white/20 hover:bg-white/5';
