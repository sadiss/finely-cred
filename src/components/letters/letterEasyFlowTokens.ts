import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

/** L1 Paper — letter-width hero preview (US Letter); surrounding section cards use full hub width */
export const LETTER_L1_PAPER_WRAP = 'w-full max-w-[612px]';
export const LETTER_L1_PAPER_SURFACE =
  'rounded-2xl border border-violet-400/30 bg-white overflow-hidden shadow-lg shadow-violet-950/10';

/** L2 Path — numbered steps + Continue */
export const LETTER_L2_PATH_CARD = finelyOsCatalogCardCompact('violet');
export const LETTER_L2_PATH_TITLE = `text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`;
export const LETTER_L2_PATH_HINT = `${FINELY_OS_ENTITY_BODY} text-sm`;
export const LETTER_L2_STEP_ROW = 'flex flex-wrap items-center gap-x-1 gap-y-2 max-w-full';
export const LETTER_L2_STEP_ARROW = 'shrink-0 text-violet-500';
export const LETTER_L2_STEP_ARROW_MUTED = `shrink-0 ${FINELY_OS_ENTITY_BODY}`;
export const LETTER_L2_STEP_BTN =
  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 sm:px-3.5 sm:py-2.5 min-h-[44px] text-sm font-semibold transition-all max-w-full';
export const LETTER_L2_STEP_NUM =
  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet-400/35 text-xs font-bold';

/** L3 Context — round / case / track chooser */
export const LETTER_L3_CONTEXT_CARD = finelyOsCatalogCardCompact('rose');
export const LETTER_L3_CONTEXT_TITLE = FINELY_OS_ENTITY_TITLE;
export const LETTER_L3_CONTEXT_BODY = `${FINELY_OS_ENTITY_BODY} text-sm`;

/** L4 Work — address summary, bureau tabs, compact controls */
export const LETTER_L4_WORK_CARD = finelyOsCatalogCardCompact('sky');
export const LETTER_L4_ADDRESS_TITLE = `text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`;

/** L5 Chrome — upload, coach, disclaimers (bottom, never competes with path) */
export const LETTER_L5_CHROME_COLLAPSE = `${finelyOsCatalogCardCompact('emerald')} !p-3`;
export const LETTER_L5_DISCLAIMER = `text-xs ${FINELY_OS_ENTITY_BODY} text-center px-2`;

/** Bureau tabs (L4) */
export const LETTER_L4_BUREAU_TAB =
  'min-h-[52px] rounded-2xl border px-4 py-3 text-left transition-all';
export const LETTER_L4_BUREAU_NAME = 'text-base font-semibold leading-tight';
export const LETTER_L4_BUREAU_META = `mt-0.5 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`;

/** Track tabs (hub-level) */
export const LETTER_TRACK_TAB =
  'inline-flex items-center gap-2 min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all';
export const LETTER_TRACK_TAB_ACTIVE = `border-violet-400/70 bg-violet-500/16 ${FINELY_OS_ENTITY_VALUE} shadow-[0_0_20px_-6px_rgba(139,92,246,0.35)]`;
export const LETTER_TRACK_TAB_IDLE = `border-violet-400/20 ${FINELY_OS_ENTITY_BODY} hover:border-violet-400/40`;
