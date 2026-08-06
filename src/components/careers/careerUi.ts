/**
 * Shared visual language for sellable public career pages (`src/components/careers/*`).
 *
 * Intentionally white/slate — NOT the dark violet "AI-slop" glass used by the older
 * Finely OS hub panels. Accents map to the real brand palette (gold / navy / emerald)
 * plus sky + rose for secondary signal. Every helper here returns Tailwind classes only
 * so callers can compose freely without extra CSS files.
 */

/** `amber` is kept as an alias of `gold` — some callers (and `CareerTierChooser`'s own
 * local accent type) spell the same brand color `amber`; accepting both avoids friction. */
export type CareerAccent = 'slate' | 'gold' | 'amber' | 'emerald' | 'navy' | 'sky' | 'rose';

export const CAREER_ACCENT_IDS: CareerAccent[] = ['slate', 'gold', 'emerald', 'navy', 'sky', 'rose'];

/** Deterministic accent per index — used when a list of options doesn't specify its own accent. */
export function careerAccentForIndex(index: number): CareerAccent {
  const rotation: CareerAccent[] = ['slate', 'gold', 'emerald', 'navy'];
  return rotation[index % rotation.length] ?? 'slate';
}

const RING: Record<CareerAccent, string> = {
  slate: 'ring-slate-300',
  gold: 'ring-amber-300',
  amber: 'ring-amber-300',
  emerald: 'ring-emerald-300',
  navy: 'ring-slate-400',
  sky: 'ring-sky-300',
  rose: 'ring-rose-300',
};

const BORDER: Record<CareerAccent, string> = {
  slate: 'border-slate-300',
  gold: 'border-amber-400',
  amber: 'border-amber-400',
  emerald: 'border-emerald-400',
  navy: 'border-[#0a1628]/60',
  sky: 'border-sky-400',
  rose: 'border-rose-400',
};

const BORDER_IDLE: Record<CareerAccent, string> = {
  slate: 'border-slate-200',
  gold: 'border-amber-200',
  amber: 'border-amber-200',
  emerald: 'border-emerald-200',
  navy: 'border-slate-200',
  sky: 'border-sky-200',
  rose: 'border-rose-200',
};

const TEXT: Record<CareerAccent, string> = {
  slate: 'text-slate-700',
  gold: 'text-amber-700',
  amber: 'text-amber-700',
  emerald: 'text-emerald-700',
  navy: 'text-[#0a1628]',
  sky: 'text-sky-700',
  rose: 'text-rose-700',
};

const CHIP: Record<CareerAccent, string> = {
  slate: 'border-slate-200 bg-slate-100 text-slate-700',
  gold: 'border-amber-200 bg-amber-50 text-amber-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  navy: 'border-slate-300 bg-slate-100 text-[#0a1628]',
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-800',
};

const BAR: Record<CareerAccent, string> = {
  slate: 'bg-slate-400',
  gold: 'bg-gradient-to-r from-amber-400 to-amber-600',
  amber: 'bg-gradient-to-r from-amber-400 to-amber-600',
  emerald: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
  navy: 'bg-gradient-to-r from-[#0a1628] to-slate-700',
  sky: 'bg-gradient-to-r from-sky-400 to-sky-600',
  rose: 'bg-gradient-to-r from-rose-400 to-rose-600',
};

const ICON_TILE: Record<CareerAccent, string> = {
  slate: 'border-slate-200 bg-slate-100 text-slate-600',
  gold: 'border-amber-200 bg-amber-50 text-amber-600',
  amber: 'border-amber-200 bg-amber-50 text-amber-600',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  navy: 'border-slate-300 bg-slate-100 text-[#0a1628]',
  sky: 'border-sky-200 bg-sky-50 text-sky-600',
  rose: 'border-rose-200 bg-rose-50 text-rose-600',
};

const SOLID_BTN: Record<CareerAccent, string> = {
  slate: 'bg-slate-800 text-white hover:bg-slate-900',
  gold: 'bg-gradient-to-r from-amber-500 to-amber-600 text-[#1c1206] hover:brightness-105',
  amber: 'bg-gradient-to-r from-amber-500 to-amber-600 text-[#1c1206] hover:brightness-105',
  emerald: 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:brightness-105',
  navy: 'bg-[#0a1628] text-white hover:bg-[#132339]',
  sky: 'bg-gradient-to-r from-sky-600 to-sky-700 text-white hover:brightness-105',
  rose: 'bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:brightness-105',
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/** Base white card shell — selected state adds a colored ring + border, idle stays quiet slate. */
export function careerCardClass(accent: CareerAccent = 'slate', selected = false, extra = ''): string {
  return cn(
    'relative rounded-2xl border-2 bg-white p-5 sm:p-6 text-left shadow-sm transition-all',
    selected ? `${BORDER[accent]} ring-4 ${RING[accent]} shadow-md` : `${BORDER_IDLE[accent]} hover:border-slate-300 hover:shadow-md`,
    extra,
  );
}

export function careerAccentText(accent: CareerAccent = 'slate'): string {
  return TEXT[accent];
}

export function careerAccentChip(accent: CareerAccent = 'slate', extra = ''): string {
  return cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', CHIP[accent], extra);
}

export function careerAccentBar(accent: CareerAccent = 'slate'): string {
  return BAR[accent];
}

export function careerIconTile(accent: CareerAccent = 'slate', extra = ''): string {
  return cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border', ICON_TILE[accent], extra);
}

export function careerSolidBtn(accent: CareerAccent = 'navy', extra = ''): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl px-6 text-[12px] font-black uppercase tracking-[0.14em] shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-60',
    SOLID_BTN[accent],
    extra,
  );
}

export const CAREER_OUTLINE_BTN =
  'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 text-[12px] font-black uppercase tracking-[0.14em] text-slate-800 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60';

export const CAREER_SECTION_KICKER = 'text-xs font-black uppercase tracking-[0.2em] text-slate-500';
export const CAREER_SECTION_TITLE = 'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900';
export const CAREER_SECTION_LEAD = 'text-base leading-relaxed text-slate-600 max-w-2xl';
export const CAREER_CARD_TITLE = 'text-lg sm:text-xl font-bold text-slate-900';
export const CAREER_CARD_BODY = 'text-sm leading-relaxed text-slate-600';
