/**
 * Finely OS 400% — workspace chrome on forest-slate PageShell (CSS vars).
 * Workspace panels use accent catalog cards (fc-accent-card family).
 * Side rail + comms widgets use distinct obsidian / amber / emerald treatments.
 */

export const FINELY_OS_PAGE = 'space-y-4';

const DARK_RING = 'ring-1 ring-inset ring-white/[0.08]';

/** Workspace surfaces — accent catalog cards (light + dark via CSS vars) */
const FC_CATALOG_CORE =
  'fc-accent-card fc-luxury-glass fc-pop-surface fc-light-readable fc-surface-harmony rounded-2xl border backdrop-blur-md transition-all';
export const FINELY_OS_GLASS_PANEL = `${FC_CATALOG_CORE} border-violet-500/25 p-6 lg:p-8`;
export const FINELY_OS_GLASS_INNER = `${FC_CATALOG_CORE} border-sky-500/20 p-4 lg:p-5`;
export const FINELY_OS_GLASS_CATALOG = `${FC_CATALOG_CORE} border-emerald-500/25 p-5 lg:p-6`;

/** Light-theme ivory/silver chrome strips (Part CV — toolbars, tabs, pagination). */
const FC_LIGHT_CHROME_STRIP =
  'fc-light-chrome-strip rounded-2xl border backdrop-blur-md transition-all';
const FC_LIGHT_CHROME_PANEL = 'fc-light-chrome-panel rounded-2xl border backdrop-blur-md transition-all';
const FC_LIGHT_CHROME_BTN =
  'fc-light-chrome-btn inline-flex items-center gap-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60';

/** Light studio glass panels — ivory/silver chrome stacks (Part CW wave 50). */
const FC_LIGHT_GLASS_PANEL =
  'fc-light-glass-panel fc-light-chrome-panel rounded-2xl border backdrop-blur-md transition-all';
export const FINELY_OS_LIGHT_GLASS_PANEL = FC_LIGHT_GLASS_PANEL;

export function finelyOsLightGlassPanel(padding = 'p-4') {
  return `${FC_LIGHT_GLASS_PANEL} ${padding}`.trim();
}

/** Onboarding slider / step tooltips — light chrome bubble (Part CX). */
export const FINELY_OS_LIGHT_TOOLTIP =
  'fc-light-tooltip-shell fc-light-chrome-panel rounded-xl border shadow-xl backdrop-blur-md';

/** Airy inner cards — maps to fc-soft-surface (light CSS overrides) */
export const FINELY_OS_SOFT_SURFACE = 'fc-soft-surface fc-light-chrome-panel';
export const FINELY_OS_SOFT_SURFACE_LG = 'fc-soft-surface-lg fc-light-chrome-panel';
export const FINELY_OS_SOFT_BTN = `${FC_LIGHT_CHROME_BTN} px-4 py-2`;

export const FINELY_OS_ENTITY_PANEL = FINELY_OS_GLASS_PANEL;
export const FINELY_OS_ENTITY_PANEL_INNER = FINELY_OS_GLASS_INNER;

/** Top toolbar strip (filters, actions) */
export const FINELY_OS_TOOLBAR = `${FC_LIGHT_CHROME_STRIP} p-4 flex flex-wrap items-center gap-3`;

/** Board / kanban container */
export const FINELY_OS_BOARD_SHELL = `${FC_LIGHT_CHROME_PANEL} fc-luxury-glass fc-pop-surface p-4`;

/** Info / hero banner */
export const FINELY_OS_BANNER =
  'rounded-2xl border border-emerald-500/25 bg-[radial-gradient(900px_320px_at_0%_0%,rgba(16,185,129,0.12)_0%,transparent_60%)] p-4 flex items-start gap-3 backdrop-blur-md';

/** KPI tile accent fills — pair with ring/shadow via finelyOsKpiTile() */
export const FINELY_OS_KPI_ACCENTS = [
  'border-violet-500/20 bg-[radial-gradient(900px_320px_at_15%_0%,rgba(139,92,246,0.12)_0%,transparent_60%)]',
  'border-emerald-500/20 bg-[radial-gradient(900px_320px_at_15%_0%,rgba(16,185,129,0.12)_0%,transparent_60%)]',
  'border-sky-500/20 bg-[radial-gradient(900px_320px_at_15%_0%,rgba(14,165,233,0.12)_0%,transparent_60%)]',
  'border-fuchsia-500/20 bg-[radial-gradient(900px_320px_at_15%_0%,rgba(217,70,239,0.12)_0%,transparent_60%)]',
  'border-rose-500/20 bg-[radial-gradient(900px_320px_at_15%_0%,rgba(244,63,94,0.10)_0%,transparent_60%)]',
] as const;

export function finelyOsKpiTile(index: number) {
  return `rounded-2xl border p-4 backdrop-blur-sm ${DARK_RING} ${FINELY_OS_KPI_ACCENTS[index % FINELY_OS_KPI_ACCENTS.length]}`;
}

export function finelyOsModuleAccentText(index: number) {
  const accents = [
    'text-violet-300',
    'text-emerald-300',
    'text-sky-300',
    'text-fuchsia-300',
    'text-rose-300',
    'text-cyan-300',
  ] as const;
  return accents[index % accents.length];
}

export const FINELY_OS_BADGE_LIVE =
  'px-3 py-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/15 text-[9px] font-bold text-emerald-200 uppercase tracking-wide whitespace-nowrap shrink-0';

export const FINELY_OS_BADGE_MUTED =
  'px-2 py-1 rounded-full border border-white/15 bg-white/[0.07] text-[9px] font-bold text-white/55 uppercase tracking-wide whitespace-nowrap';

export const FINELY_OS_BADGE_WARN =
  'px-2 py-1 rounded-full border border-fuchsia-500/35 bg-fuchsia-500/15 text-[9px] font-bold text-fuchsia-200 uppercase tracking-wide whitespace-nowrap';

export const FINELY_OS_DRAG_HINT =
  'text-[10px] font-semibold uppercase tracking-wider text-violet-300/80 mb-2 flex items-center gap-1.5';

/** Column header + drop zone accents — dark frosted glass (no white CRM/task columns) */
export const FINELY_OS_COLUMN_THEMES = [
  {
    header: 'border-white/12 bg-gradient-to-r from-white/[0.08] to-white/[0.04]',
    body: 'bg-white/[0.03]',
    drop: 'ring-2 ring-slate-400/50 bg-white/[0.06]',
    dot: 'bg-slate-400',
  },
  {
    header: 'border-blue-400/25 bg-gradient-to-r from-blue-500/12 to-sky-500/6',
    body: 'bg-blue-500/[0.04]',
    drop: 'ring-2 ring-blue-400/45 bg-blue-500/[0.08]',
    dot: 'bg-blue-400',
  },
  {
    header: 'border-cyan-400/25 bg-gradient-to-r from-cyan-500/12 to-teal-500/6',
    body: 'bg-cyan-500/[0.04]',
    drop: 'ring-2 ring-cyan-400/45 bg-cyan-500/[0.08]',
    dot: 'bg-cyan-400',
  },
  {
    header: 'border-violet-400/25 bg-gradient-to-r from-violet-500/12 to-fuchsia-500/6',
    body: 'bg-violet-500/[0.04]',
    drop: 'ring-2 ring-violet-400/45 bg-violet-500/[0.08]',
    dot: 'bg-violet-400',
  },
  {
    header: 'border-amber-400/25 bg-gradient-to-r from-amber-500/12 to-yellow-500/6',
    body: 'bg-amber-500/[0.04]',
    drop: 'ring-2 ring-amber-400/45 bg-amber-500/[0.08]',
    dot: 'bg-amber-400',
  },
  {
    header: 'border-emerald-400/25 bg-gradient-to-r from-emerald-500/12 to-green-500/6',
    body: 'bg-emerald-500/[0.04]',
    drop: 'ring-2 ring-emerald-400/45 bg-emerald-500/[0.08]',
    dot: 'bg-emerald-400',
  },
  {
    header: 'border-green-400/25 bg-gradient-to-r from-green-500/12 to-emerald-500/6',
    body: 'bg-green-500/[0.04]',
    drop: 'ring-2 ring-green-500/45 bg-green-500/[0.08]',
    dot: 'bg-green-500',
  },
  {
    header: 'border-rose-400/25 bg-gradient-to-r from-rose-500/12 to-red-500/6',
    body: 'bg-rose-500/[0.04]',
    drop: 'ring-2 ring-rose-400/45 bg-rose-500/[0.08]',
    dot: 'bg-rose-400',
  },
] as const;

const CRM_COLOR_MAP: Record<string, (typeof FINELY_OS_COLUMN_THEMES)[number]> = {
  slate: FINELY_OS_COLUMN_THEMES[0],
  blue: FINELY_OS_COLUMN_THEMES[1],
  cyan: FINELY_OS_COLUMN_THEMES[2],
  violet: FINELY_OS_COLUMN_THEMES[3],
  amber: FINELY_OS_COLUMN_THEMES[4],
  emerald: FINELY_OS_COLUMN_THEMES[5],
  green: FINELY_OS_COLUMN_THEMES[6],
  rose: FINELY_OS_COLUMN_THEMES[7],
};

export function finelyOsColumnTheme(index: number) {
  return FINELY_OS_COLUMN_THEMES[index % FINELY_OS_COLUMN_THEMES.length];
}

export function finelyOsColumnThemeByColor(color: string) {
  return CRM_COLOR_MAP[color] ?? FINELY_OS_COLUMN_THEMES[0];
}

export function finelyOsCardDragging(isDragging: boolean) {
  return isDragging ? 'opacity-45 scale-[0.98] ring-2 ring-amber-400 shadow-lg cursor-grabbing' : 'cursor-grab active:cursor-grabbing';
}

export const FINELY_OS_CATALOG_SHELL = FINELY_OS_GLASS_CATALOG;

/** View tab strip (List / Calendar / Board) — workspace chrome */
export const FINELY_OS_VIEW_TABS =
  `fc-view-tabs ${FC_LIGHT_CHROME_STRIP} inline-flex flex-wrap gap-1 p-1`;

export function finelyOsViewTab(active: boolean, accent: 'emerald' | 'violet' | 'sky' | 'fuchsia' | 'amber' = 'emerald') {
  const activeStyles = {
    emerald: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md ring-1 ring-emerald-400/30',
    violet: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md ring-1 ring-violet-400/30',
    sky: 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md ring-1 ring-sky-400/30',
    fuchsia: 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-md ring-1 ring-fuchsia-400/30',
    amber: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-md ring-1 ring-amber-400/40',
  };
  return `inline-flex items-center justify-center gap-1.5 min-w-0 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide whitespace-normal text-center leading-snug transition-all ${
    active ? activeStyles[accent] : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'
  }`;
}

export type FinelyOsGlassAccent = 'violet' | 'emerald' | 'sky' | 'amber' | 'rose' | 'fuchsia';

const GLASS_FILLS: Record<FinelyOsGlassAccent, string> = {
  violet: 'fc-elevated-card',
  emerald: 'fc-elevated-card',
  sky: 'fc-elevated-card',
  amber: 'fc-elevated-card',
  rose: 'fc-elevated-card',
  fuchsia: 'fc-elevated-card',
};

export function finelyOsGlassFill(accent: FinelyOsGlassAccent = 'violet') {
  return GLASS_FILLS[accent];
}

export const FINELY_OS_ENTITY_LABEL = 'text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300/70';

export const FINELY_OS_ENTITY_SUBLABEL = 'text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60';

export const FINELY_OS_ENTITY_TITLE = 'text-xl font-semibold tracking-tight text-white';

export const FINELY_OS_ENTITY_BODY = 'text-sm leading-relaxed text-white/75';

export const FINELY_OS_ENTITY_VALUE = 'font-semibold tracking-tight text-white/90';

export const FINELY_OS_ENTITY_INPUT = 'fc-input mt-2';

export const FINELY_OS_ENTITY_CHIP =
  'px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-white/70 text-[10px] font-black uppercase tracking-wide whitespace-normal text-center leading-snug';

export const FINELY_OS_ENTITY_EMPTY =
  'mt-4 rounded-xl border border-dashed border-white/12 bg-white/[0.03] p-4 text-sm text-white/55';

export const FINELY_OS_ENTITY_ACCENT_LINK =
  'text-amber-300 hover:text-amber-100 underline underline-offset-4 decoration-amber-500/40 transition-colors';

export const FINELY_OS_ENTITY_ACTION = 'fc-button-soft';

export const FINELY_OS_LUXURY_PAGINATION =
  `${FC_LIGHT_CHROME_STRIP} flex items-center justify-between px-3 py-2`;

export const FINELY_OS_LUXURY_EMPTY =
  `${FC_LIGHT_CHROME_PANEL} border-dashed p-8 text-center text-sm backdrop-blur-sm`;

export const FINELY_OS_LUXURY_PAGINATION_BTN =
  `${FC_LIGHT_CHROME_BTN} px-2 py-1 text-xs normal-case tracking-normal font-semibold`;

export function finelyOsEntityKpi(index: number) {
  return finelyOsKpiTile(index);
}

export function finelyOsOverviewStatTile(accent: FinelyOsGlassAccent = 'violet') {
  void accent;
  return 'fc-spotlight-panel min-h-[7.5rem] lg:min-h-[8.5rem] p-5 lg:p-6';
}

/** White stat cards with dark text + colorful icon — for Work/CRM boards on dark shells */
export function finelyOsContrastStatTile() {
  return 'rounded-2xl border border-white/25 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-[0_10px_32px_-14px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/90 min-h-[7.5rem]';
}

export const FINELY_OS_CONTRAST_LABEL =
  'text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600';

export const FINELY_OS_CONTRAST_VALUE = 'font-bold tracking-tight text-slate-900 tabular-nums';

export const FINELY_OS_COLUMN_HEADER_LABEL =
  'text-xs font-black uppercase tracking-wider text-slate-900';

export const FINELY_OS_COLUMN_HEADER_HINT = 'text-[10px] font-semibold text-slate-700';

export const FINELY_OS_COLUMN_HEADER_COUNT =
  'text-xs font-bold text-slate-900 bg-white/85 px-2 py-0.5 rounded-full border border-slate-300/70 shadow-sm';

export const FINELY_OS_COMMS_BANNER =
  'rounded-2xl border border-fuchsia-500/25 bg-[radial-gradient(900px_320px_at_0%_0%,rgba(217,70,239,0.12)_0%,transparent_60%)] p-5 backdrop-blur-md';

export const FINELY_OS_BACK_LINK = 'inline-flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors';

export const FINELY_OS_PRIMARY_BTN = 'fc-button-brand';

export const FINELY_OS_SUCCESS_BTN =
  'inline-flex items-center justify-center gap-2 min-w-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 sm:px-4 py-2 text-[10px] font-black uppercase tracking-wide whitespace-normal text-center leading-snug text-white shadow-md ring-1 ring-emerald-400/30 hover:brightness-110 transition-all disabled:opacity-60';

export const FINELY_OS_DANGER_BTN =
  'inline-flex items-center justify-center gap-2 min-w-0 rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-600 to-rose-700 px-3 sm:px-4 py-2 text-[10px] font-black uppercase tracking-wide whitespace-normal text-center leading-snug text-white shadow-md ring-1 ring-rose-400/40 hover:brightness-110 transition-all disabled:opacity-60';

export const FINELY_OS_DANGER_PANEL =
  'rounded-2xl border border-rose-500/35 bg-[radial-gradient(900px_320px_at_0%_0%,rgba(244,63,94,0.16)_0%,transparent_60%)] p-5 backdrop-blur-md ring-1 ring-inset ring-rose-400/15';

export const FINELY_OS_NOTICE_INFO =
  'rounded-xl border border-fuchsia-500/30 bg-[radial-gradient(900px_240px_at_0%_0%,rgba(217,70,239,0.12)_0%,transparent_60%)] p-4 text-sm text-white/85 backdrop-blur-md';

export const FINELY_OS_CALC_SHELL = 'fc-spotlight-panel p-6 sm:p-8 space-y-6';
export const FINELY_OS_CALC_INNER = 'fc-soft-surface-lg p-5';
export const FINELY_OS_CALC_INPUT = FINELY_OS_ENTITY_INPUT;
export const FINELY_OS_CALC_LABEL = FINELY_OS_ENTITY_LABEL;

export function finelyOsPayoutStatusChip(status: string) {
  const styles: Record<string, string> = {
    pending: 'border-amber-500/35 bg-amber-500/15 text-amber-200',
    processing: 'border-sky-500/35 bg-sky-500/15 text-sky-200',
    paid: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200',
    failed: 'border-rose-500/50 bg-rose-600/30 text-white',
    cancelled: 'border-white/15 bg-white/[0.07] text-white/55',
  };
  return `px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${styles[status] ?? styles.pending}`;
}

export function finelyOsCalcMetricTile(highlight = false, accent: 'violet' | 'fuchsia' | 'emerald' | 'sky' = 'violet') {
  if (highlight) {
    const map = {
      violet: 'border-violet-500/35 bg-violet-500/10 ring-1 ring-violet-400/20',
      fuchsia: 'border-fuchsia-500/35 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/20',
      emerald: 'border-emerald-500/35 bg-emerald-500/10 ring-1 ring-emerald-400/20',
      sky: 'border-sky-500/35 bg-sky-500/10 ring-1 ring-sky-400/20',
    };
    return `rounded-2xl border p-4 ${map[accent]}`;
  }
  return 'fc-soft-surface-lg p-4';
}

export const FINELY_OS_SECONDARY_BTN = FINELY_OS_ENTITY_ACTION;

export const FINELY_OS_NOTICE =
  `${FC_LIGHT_CHROME_PANEL} p-4 text-sm whitespace-pre-wrap`;

export const FINELY_OS_NOTICE_SUCCESS =
  'rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100 flex items-start gap-3';

export const FINELY_OS_NOTICE_ERROR =
  'rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100 flex items-start gap-3';

export const FINELY_OS_NOTICE_WARN =
  'rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-100';

/** Selected / active / granted state on dark OS surfaces */
export const FINELY_OS_ACTIVE_CHIP =
  'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';

export const FINELY_OS_ENTITY_SELECT = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');

export function finelyOsListItem(selected: boolean, accent: 'violet' | 'amber' | 'fuchsia' | 'emerald' = 'violet') {
  const selectedStyles = {
    violet: 'border-violet-500/35 bg-violet-500/10 ring-1 ring-violet-400/20',
    amber: 'border-amber-500/35 bg-amber-500/10 ring-1 ring-amber-400/20',
    fuchsia: 'border-fuchsia-500/35 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/20',
    emerald: 'border-emerald-500/35 bg-emerald-500/10 ring-1 ring-emerald-400/20',
  };
  return `w-full text-left rounded-2xl border p-4 transition-all ${
    selected ? selectedStyles[accent] : 'border-white/[0.08] bg-white/[0.035] hover:bg-white/[0.06] hover:border-white/14'
  }`;
}

export function finelyOsInlineListItem(selected = false) {
  return `rounded-2xl border p-4 transition-all ${
    selected
      ? 'border-fuchsia-500/35 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/20'
      : 'border-white/[0.08] bg-white/[0.035] hover:bg-white/[0.06]'
  }`;
}

export function finelyOsMessageBubble(role: 'assistant' | 'user') {
  return role === 'assistant'
    ? 'rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 ring-1 ring-inset ring-emerald-400/10'
    : 'fc-soft-surface p-4';
}

export function finelyOsStatusChip(tone: 'ok' | 'warn' | 'blocked') {
  const styles = {
    ok: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    warn: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100',
    blocked: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  };
  return `inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${styles[tone]}`;
}

/* ─── Chrome layers (distinct from workspace fc-panel) ─── */

/** Admin / ops left rail — obsidian + multi-color spotlight glow */
export const FINELY_OS_SIDE_RAIL_SHELL =
  'relative rounded-[34px] border border-white/[0.08] bg-fc-chrome/95 backdrop-blur-xl p-4 flex flex-col gap-4 shadow-[0_28px_70px_-38px_rgba(0,0,0,0.65)] ring-1 ring-inset ring-white/[0.08] overflow-hidden max-h-[calc(100vh-7rem)]';

export const FINELY_OS_SIDE_RAIL_GLOW =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(900px_360px_at_12%_0%,rgba(139,92,246,0.14)_0%,transparent_58%),radial-gradient(700px_280px_at_88%_20%,rgba(56,189,248,0.10)_0%,transparent_55%),radial-gradient(600px_240px_at_50%_100%,rgba(16,185,129,0.08)_0%,transparent_50%)]';

export const FINELY_OS_SIDE_RAIL_GROUP = 'rounded-2xl border border-white/[0.08] bg-fc-elevated/35 overflow-hidden';

export const FINELY_OS_SIDE_RAIL_LABEL = 'text-[10px] uppercase tracking-[0.34em] text-violet-300/80 font-black';

export const FINELY_OS_SIDE_RAIL_TITLE = 'text-white font-semibold text-sm';

export const FINELY_OS_SIDE_RAIL_HINT = 'text-[11px] text-white/55';

export const FINELY_OS_SIDE_RAIL_BADGE =
  'px-2.5 py-1 rounded-full border border-white/[0.08] bg-fc-elevated/40 text-[10px] font-black uppercase tracking-widest text-white/65';

export function finelyOsSideRailNavItem(active: boolean) {
  return `w-full text-left inline-flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all ${
    active
      ? 'bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 text-white border-violet-400/40 shadow-md ring-1 ring-violet-400/25'
      : 'bg-fc-section/70 text-white/78 border-white/[0.08] hover:bg-fc-elevated/50 hover:text-white hover:border-white/20'
  }`;
}

/** Partner horizontal nav — cyan + violet obsidian strip */
export const FINELY_OS_PORTAL_NAV_STRIP =
  'inline-flex flex-wrap gap-1 fc-light-glass-panel fc-light-chrome-panel p-1.5 shadow-md ring-1 ring-inset ring-violet-500/10';

/** Communication Hub — fuchsia / violet / sky spotlight dock (not brown amber) */
export const FINELY_OS_COMMS_SHELL =
  'rounded-[28px] border border-white/[0.08] bg-fc-chrome/96 backdrop-blur-xl shadow-[0_26px_70px_-32px_rgba(0,0,0,0.65)] ring-1 ring-inset ring-fuchsia-500/15 overflow-hidden flex flex-col';

export const FINELY_OS_COMMS_HEADER =
  'shrink-0 sticky top-0 z-30 border-b border-white/[0.08] bg-fc-chrome/98 backdrop-blur-xl';

export const FINELY_OS_COMMS_HEADER_INNER =
  'p-4 flex items-center justify-between gap-3 border-b border-white/5 bg-[radial-gradient(900px_320px_at_0%_0%,rgba(217,70,239,0.14)_0%,transparent_55%),radial-gradient(700px_280px_at_100%_0%,rgba(56,189,248,0.10)_0%,transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_100%)]';

export const FINELY_OS_COMMS_LAUNCHER =
  'group rounded-[26px] border border-fuchsia-500/30 px-5 py-4 shadow-[0_22px_60px_-36px_rgba(192,38,211,0.4)] transition-all hover:border-sky-400/40 hover:scale-[1.02] bg-[radial-gradient(ellipse_at_84%_18%,rgba(255,255,255,0.10)_0%,transparent_55%),linear-gradient(145deg,rgba(139,92,246,0.16)_0%,rgba(30,41,38,0.92)_48%,rgba(26,38,35,0.88)_100%)] backdrop-blur-xl';

export const FINELY_OS_COMMS_LABEL = 'text-[10px] uppercase tracking-[0.34em] text-fuchsia-300/90 font-black';

export const FINELY_OS_COMMS_ICON =
  'w-11 h-11 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center shrink-0';

export function finelyOsCommsTab(active: boolean) {
  return `flex-1 min-w-[88px] px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
    active
      ? 'text-fuchsia-200 border-b-2 border-fuchsia-400 bg-fuchsia-500/10'
      : 'text-white/50 hover:text-white/75 hover:bg-white/[0.03]'
  }`;
}

/** Finely AI floater — emerald + violet spotlight accent */
export const FINELY_OS_AI_WIDGET =
  'fc-spotlight-panel p-5 space-y-4 border-emerald-500/20 ring-1 ring-inset ring-emerald-400/10 shadow-[0_24px_60px_-30px_rgba(16,185,129,0.25)]';

export const FINELY_OS_AI_WIDGET_HEADER = 'flex items-center gap-3 border-b border-white/[0.08] pb-4';

export const FINELY_OS_AI_WIDGET_ICON =
  'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/25 to-violet-500/20 flex items-center justify-center ring-1 ring-emerald-400/30';

/** Public marketing — compliance footnote (stats, testimonials, AI). */
export const FINELY_OS_COMPLIANCE_FOOTNOTE =
  'text-[10px] sm:text-xs text-white/40 leading-relaxed text-center max-w-3xl mx-auto';

/** Public marketing — rich accent catalog surface (harmonizes with mesh + nested content). */
export type FinelyOsPublicAccent = 'violet' | 'emerald' | 'amber' | 'fuchsia' | 'sky';

const PUBLIC_ACCENT: Record<FinelyOsPublicAccent, string> = {
  violet: 'border-violet-500/25 bg-[radial-gradient(900px_280px_at_12%_0%,rgba(139,92,246,0.14)_0%,transparent_58%)] hover:border-violet-400/40',
  emerald: 'border-emerald-500/25 bg-[radial-gradient(900px_280px_at_12%_0%,rgba(16,185,129,0.14)_0%,transparent_58%)] hover:border-emerald-400/40',
  amber: 'border-amber-500/25 bg-[radial-gradient(900px_280px_at_12%_0%,rgba(245,158,11,0.12)_0%,transparent_58%)] hover:border-amber-400/40',
  fuchsia: 'border-fuchsia-500/25 bg-[radial-gradient(900px_280px_at_12%_0%,rgba(217,70,239,0.12)_0%,transparent_58%)] hover:border-fuchsia-400/40',
  sky: 'border-sky-500/25 bg-[radial-gradient(900px_280px_at_12%_0%,rgba(14,165,233,0.12)_0%,transparent_58%)] hover:border-sky-400/40',
};

export function finelyOsCatalogCard(accent: FinelyOsPublicAccent = 'violet') {
  return `fc-accent-card fc-luxury-glass fc-pop-surface fc-light-readable fc-surface-harmony rounded-2xl border backdrop-blur-md p-6 lg:p-8 transition-all ${PUBLIC_ACCENT[accent]}`;
}

/** Glass shell helper — delegates to accent catalog cards (Part CT token unification). */
export function finelyOsGlassShell(variant: 'panel' | 'inner' | 'catalog', accent: FinelyOsGlassAccent = 'violet') {
  const pad = variant === 'inner' ? '!p-4' : variant === 'catalog' ? '!p-5' : '!p-6';
  const harmony = variant === 'inner' ? 'fc-surface-harmony' : '';
  return `${finelyOsCatalogCard(accent as FinelyOsPublicAccent)} ${pad} ${harmony}`.trim();
}

/** Landing sections — black contrast band on light, original fc-band on dark */
export function finelyOsLandingContrastSection(bandClass = 'fc-band-violet') {
  return `${bandClass} fc-light-contrast-band fc-section-pop border-y border-white/5`;
}

/** Ivory-mesh sections — black primary / silver nested cards in light theme (Part CU). */
export function finelyOsLightMeshSection(bandClass = 'fc-band-dark') {
  return `${bandClass} fc-light-mesh-section fc-light-black-scope fc-section-pop fc-light-readable`;
}

/** Dark platinum / affiliate bands — contrast on light, original band on dark */
export function finelyOsLandingPlatinumSection(bandClass = 'fc-band-ribbon') {
  return `${bandClass} fc-light-contrast-band fc-section-pop fc-affiliate-band border-y border-white/5`;
}

/** Light-theme black contrast band — punchy section breaks on aurora shell */
export function finelyOsLightContrastBand(padding = 'py-12 px-6 sm:px-8 lg:px-10') {
  return `fc-light-contrast-band -mx-4 sm:-mx-6 lg:-mx-8 2xl:-mx-10 ${padding}`;
}

/** Light-theme hero panel with dual accent wash */
export function finelyOsLightHeroPanel() {
  return 'fc-light-hero-panel fc-pop-surface fc-light-readable rounded-3xl border p-6 sm:p-8 lg:p-10';
}

/** Lead magnet / promo panel on contrast bands */
export function finelyOsLeadMagnetPanel(accent: FinelyOsPublicAccent = 'emerald') {
  return `${finelyOsCatalogCard(accent)} fc-lead-magnet-panel rounded-[2rem] sm:rounded-[2.5rem]`;
}

export const FINELY_OS_PLATINUM_BTN = 'fc-button-platinum';

/** Modal / overlay shells (Tier 239). */
export const FINELY_OS_FIXED_OVERLAY = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm';
export const FINELY_OS_MODAL_OVERLAY = 'absolute inset-0 bg-black/80 backdrop-blur-sm';
export const FINELY_OS_MODAL_SHELL = `${FINELY_OS_ENTITY_PANEL} !p-0 overflow-hidden shadow-2xl flex flex-col max-h-[min(92vh,900px)]`;

/** AI draft button styling (Letter Studio). */
export const FINELY_OS_AI_DRAFT_BTN =
  'inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-100 hover:bg-fuchsia-500/15 transition-all disabled:opacity-60 disabled:cursor-not-allowed';
export const FINELY_OS_AI_DRAFT_BTN_SM =
  'inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-100 hover:bg-fuchsia-500/15 transition-all disabled:opacity-60';

/** Public alert banner variants (amber / emerald / sky). */
export function finelyOsAlertBanner(tone: 'info' | 'warning' | 'success' = 'info') {
  if (tone === 'warning') return 'rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100';
  if (tone === 'success') return 'rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100';
  return 'rounded-xl border border-sky-500/35 bg-sky-500/10 px-4 py-3 text-sm text-sky-100';
}
