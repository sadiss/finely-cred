/**
 * Shared layout classes — see docs/LAYOUT-CARD-RULE.md
 * Use these instead of nesting bordered panels inside bordered panels.
 */

/** Page-level vertical rhythm + horizontal gutters */
export const FC_PAGE_SECTION = 'max-w-7xl mx-auto px-4 sm:px-6 space-y-6 md:space-y-8';

/** Standard grid for sibling cards (never gap-0) */
export const FC_CARD_GRID = 'grid gap-4 md:gap-6';

/** Single card on section background */
export const FC_SURFACE_CARD = 'rounded-2xl border border-white/15 bg-[#0b1110] p-5 sm:p-6';

/** Optional hero / chapter shell (one per section — children are cards, not nested boxes) */
export const FC_SECTION_SHELL =
  'rounded-2xl border border-[#fbbf24]/25 bg-gradient-to-br from-[#0b1110] to-[#060908] p-6 sm:p-8 space-y-6';

/** Marketing gold accent card */
export const FC_SURFACE_CARD_GOLD = 'rounded-2xl border border-[#fbbf24]/30 bg-[#0b1110] p-5 sm:p-6';
