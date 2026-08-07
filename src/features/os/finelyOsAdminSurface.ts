/**
 * Finely OS — Admin Workspace surface ("Platinum Workspace").
 *
 * Additive, unconditionally-light token module for admin *entity detail* pages
 * (Partner Overview / Profile first — see docs/plans/partner-overview-profile-professional-ui.md).
 *
 * This module intentionally does NOT touch `finelyOsLightUi.ts`. CRM boards,
 * Communications Hub, Letter Studio, and the public marketing site keep their
 * existing dark/obsidian treatment — nothing there imports from here. Only
 * surfaces that explicitly opt in to the `.fc-admin-workspace` scope (see
 * `src/index.css`) render with this cool platinum/graphite palette, and that
 * scope is NOT gated by the public dark/light theme toggle — it is always
 * light, full stop.
 *
 * Palette (cool graphite, not cream/ivory — see plan §1):
 *   bg #F4F5F7 · surface #FFFFFF · sunken #F7F8FA · border #E2E5EA
 *   ink #141A22 · ink-muted #4B5563 · ink-faint #8A93A3 · accent #0F6B57 (deep emerald)
 *
 * Section tones (Finely gold/navy/emerald/black — never purple): section
 * cards, KPIs, and status chips can carry a `FcAdminTone` so the page reads
 * as clearly organized color blocks against the white shell instead of a
 * flat wash of near-identical white-on-white cards. One tone per *type of
 * thing* — pick a tone per section's meaning, not a decorative rotation.
 *
 * CONTRAST RULE (read this before touching text color on this surface):
 *   Never put dark text on `ink`/solid-dark; never put light text on `soft`.
 *   `fcAdminCard` / `fcAdminKpi` / `fcAdminScoreCell` already bake the
 *   correct text color into their returned class string — you do not need
 *   to add your own `text-*` override for the container. If a specific
 *   child element needs an explicit color (e.g. a value vs. a label), pull
 *   it from `fcAdminToneText(tone, variant)` (pass the SAME variant as the
 *   card it sits inside) rather than guessing `text-white` / `text-black`.
 */

/** Class that activates the `.fc-admin-workspace` CSS scope (see src/index.css). */
export const FC_ADMIN_WORKSPACE_SCOPE = 'fc-admin-workspace';

/** Outer shell for an admin-light tab body — opt-in wrapper, not a global page shell. */
export const FC_ADMIN_SURFACE_SHELL =
  `${FC_ADMIN_WORKSPACE_SCOPE} rounded-3xl border border-[var(--fc-admin-border)] bg-[var(--fc-admin-bg)] p-4 sm:p-6`;

/** Page background for the admin shell wrapper (EntityDetailShell `surface="admin"`). */
export const FC_ADMIN_SHELL_BG = 'bg-[var(--fc-admin-bg)] rounded-3xl';

/** Page rhythm inside the admin workspace scope. */
export const FC_ADMIN_PAGE = 'space-y-4';

/* ─── Section tones ───
 * emerald = primary / overall / success
 * gold    = evidence, financial/contract detail, secondary emphasis
 * sky     = scores, informational / improvement actions
 * navy    = identity, contact, letters/administrative detail
 * teal    = secondary score accent (paired with sky/emerald on 3-up score rows)
 * rose    = risk, danger, blockers
 */

export type FcAdminTone = 'neutral' | 'emerald' | 'gold' | 'sky' | 'navy' | 'teal' | 'rose';

const FC_ADMIN_TONE_VARS: Record<Exclude<FcAdminTone, 'neutral'>, { solid: string; ink: string }> = {
  emerald: { solid: '--fc-admin-tone-emerald', ink: '--fc-admin-tone-emerald-ink' },
  gold: { solid: '--fc-admin-tone-gold', ink: '--fc-admin-tone-gold-ink' },
  sky: { solid: '--fc-admin-tone-sky', ink: '--fc-admin-tone-sky-ink' },
  navy: { solid: '--fc-admin-tone-navy', ink: '--fc-admin-tone-navy-ink' },
  teal: { solid: '--fc-admin-tone-teal', ink: '--fc-admin-tone-teal-ink' },
  rose: { solid: '--fc-admin-tone-rose', ink: '--fc-admin-tone-rose-ink' },
};

/**
 * Text color for content sitting on a `solid` (saturated) fill or the `ink`
 * hero panel. White on every tone except gold, which stays on dark ink for
 * contrast (a pale-yellow-on-white failure otherwise).
 */
export function fcAdminOnSolidText(tone: FcAdminTone) {
  if (tone === 'neutral') return 'text-[var(--fc-admin-ink)]';
  if (tone === 'gold') return 'text-[var(--fc-ink-on-gold)]';
  return 'text-white';
}

/**
 * The ONE function to reach for when you need an explicit text color on
 * this surface — pass the SAME `variant` as the card/KPI/cell the text
 * sits inside and it always returns a contrast-safe class:
 *   - `variant: 'ink'`   → always light (white) — matches the always-dark ink hero panel.
 *   - `variant: 'solid'` → light on every deep tone, dark ink ONLY on gold
 *     (gold's fill is bright enough that white text fails contrast).
 *   - `variant: 'soft'` (default) → dark, tone-matched ink — the tint is
 *     always light, so text must stay dark.
 * Bare `fcAdminToneText(tone)` (no variant) keeps its original `soft`
 * (dark-text) behavior for existing call sites — always pass `variant`
 * explicitly for `solid`/`ink` content going forward.
 */
export function fcAdminToneText(tone: FcAdminTone, variant: FcAdminCardVariant = 'soft') {
  if (variant === 'ink') return 'text-white';
  if (variant === 'solid') return fcAdminOnSolidText(tone);
  if (tone === 'neutral') return 'text-[var(--fc-admin-ink)]';
  return `text-[var(${FC_ADMIN_TONE_VARS[tone].ink})]`;
}

/** Secondary/label text on a `solid` fill or the `ink` hero panel — dimmed but legible. */
export function fcAdminOnSolidMuted(tone: FcAdminTone) {
  if (tone === 'neutral') return 'text-[var(--fc-admin-ink-muted)]';
  if (tone === 'gold') return 'text-[#2b1d05]/80';
  return 'text-white/80';
}

/** Sublabel (uppercase, tracked) sized for a `solid`/`ink` panel — pairs with `fcAdminOnSolidMuted`. */
export function fcAdminOnSolidSublabel(tone: FcAdminTone) {
  return `text-[11px] font-semibold uppercase tracking-wide ${fcAdminOnSolidMuted(tone)}`;
}

/** Body copy sized for a `solid`/`ink` panel — pairs with `fcAdminOnSolidMuted`. */
export function fcAdminOnSolidBody(tone: FcAdminTone) {
  return `text-sm leading-relaxed ${fcAdminOnSolidMuted(tone)}`;
}

/** Value/headline text sized for a `solid`/`ink` panel — pairs with `fcAdminOnSolidText`. */
export function fcAdminOnSolidValue(tone: FcAdminTone) {
  return `font-semibold tracking-tight ${fcAdminOnSolidText(tone)}`;
}

/** Secondary/utility button (Refresh, Revert, Cancel) for use INSIDE a `solid`/`ink` panel — a graphite button would vanish there, so this is a frosted white-on-dark pill instead. */
export const FC_ADMIN_ON_SOLID_SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

/* ─── Card surfaces ───
 *
 * Three deliberate variants — pick ONE per box based on what it IS, never
 * decorate every box the same way:
 *
 *   'soft'  (default) — quiet, flat, clearly-tinted-but-calm. Lists, activity,
 *            nav shortcuts, secondary detail. Dark ink text (`fcAdminToneText`).
 *   'solid' — rich saturated fill, reserved for boxes that ARE the data:
 *            KPI numbers, score cells, status-critical counts. White text
 *            (`fcAdminOnSolidText` / `fcAdminOnSolidMuted`), gold uses dark ink.
 *   'ink'   — deep navy/black identity panel. Hero/identity only. White text.
 */
export type FcAdminCardVariant = 'soft' | 'solid' | 'ink';

/**
 * Returns BOTH background and text-color classes — every card produced
 * here is contrast-safe on its own, even if the caller forgets to add a
 * text color to a child element (ambient inherited color will already be
 * correct). Child elements MAY still set their own explicit `text-*`
 * class (e.g. via `fcAdminToneText(tone, variant)`) to fine-tune a
 * label vs. value — that explicit class always wins over the inherited
 * one, so this is purely additive/defensive, never a conflict.
 */
export function fcAdminCard(padding = 'p-5', tone: FcAdminTone = 'neutral', variant: FcAdminCardVariant = 'soft') {
  if (variant === 'ink') {
    return `fc-admin-ink-panel rounded-2xl border ${fcAdminToneText(tone, 'ink')} ${padding}`;
  }
  if (tone === 'neutral') {
    return `rounded-2xl border border-[var(--fc-admin-border-strong)] bg-[var(--fc-admin-surface)] shadow-[0_1px_3px_rgba(16,24,40,0.06)] text-[var(--fc-admin-ink)] ${padding}`;
  }
  if (variant === 'solid') {
    return `fc-admin-solid-${tone} rounded-2xl border ${fcAdminToneText(tone, 'solid')} ${padding}`;
  }
  return `fc-admin-soft-${tone} rounded-2xl border ${fcAdminToneText(tone, 'soft')} ${padding}`;
}

/** Recessed / nested tile inside a card — always quiet/neutral so it reads as "inside", never competing with the parent box. */
export function fcAdminInnerTile(padding = 'p-3', tone: FcAdminTone = 'neutral') {
  if (tone === 'neutral') {
    return `rounded-xl border border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface-sunken)] text-[var(--fc-admin-ink)] ${padding}`;
  }
  return `fc-admin-soft-${tone} rounded-xl border ${fcAdminToneText(tone, 'soft')} ${padding}`;
}

/**
 * Frosted inner tile for content nested INSIDE a `solid`/`ink` panel (e.g. a
 * grant-access card sitting on a navy authority panel, or a field-guide tile
 * sitting on a gold invite panel). Gold gets a dark-on-gold recess since gold
 * itself takes dark ink text; every other tone gets white-on-dark — avoids
 * "card inside an identical card".
 */
export function fcAdminOnSolidInnerTile(padding = 'p-4', tone: FcAdminTone = 'navy') {
  if (tone === 'gold') return `rounded-xl border border-black/15 bg-black/[0.08] text-[var(--fc-ink-on-gold)] ${padding}`;
  return `rounded-xl border border-white/15 bg-white/[0.07] text-white ${padding}`;
}

/** Secondary/utility button (Refresh, Revert, Cancel, Copy link) for use INSIDE a `solid`/`ink` panel — tone-aware (gold needs dark ink, not white; a graphite button would vanish on a dark panel). */
export function fcAdminOnSolidSecondaryBtn(tone: FcAdminTone = 'navy') {
  if (tone === 'gold') {
    return 'inline-flex items-center justify-center gap-2 rounded-lg border border-black/25 bg-black/10 px-3.5 py-2 text-xs font-semibold text-[var(--fc-ink-on-gold)] hover:bg-black/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  }
  return 'inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
}

/** KPI tile — the number IS the point, so it defaults to a rich `solid` fill. Pass `variant="soft"` for lower-priority KPIs. */
export function fcAdminKpi(tone: FcAdminTone = 'neutral', variant: FcAdminCardVariant = 'solid') {
  return fcAdminCard('p-4', tone, tone === 'neutral' ? 'soft' : variant);
}

/** @deprecated use `fcAdminKpi` */
export const fcAdminKpiTile = fcAdminKpi;

/* ─── Typography ─── */

export const FC_ADMIN_TITLE = 'text-xl font-semibold tracking-tight text-[var(--fc-admin-ink)]';
export const FC_ADMIN_SUBLABEL = 'text-[11px] font-semibold uppercase tracking-wide text-[var(--fc-admin-ink-faint)]';
export const FC_ADMIN_LABEL = 'text-[11px] font-semibold uppercase tracking-wide text-[var(--fc-admin-ink-faint)]';
export const FC_ADMIN_BODY = 'text-sm leading-relaxed text-[var(--fc-admin-ink-muted)]';
export const FC_ADMIN_VALUE = 'font-semibold tracking-tight text-[var(--fc-admin-ink)]';
export const FC_ADMIN_EMPTY =
  'rounded-xl border border-dashed border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface-sunken)] p-4 text-sm text-[var(--fc-admin-ink-muted)]';
export const FC_ADMIN_ACCENT_LINK =
  'text-[var(--fc-admin-accent)] hover:underline underline-offset-4 font-medium transition-colors';

/* ─── Ink-panel typography — hero/identity panel only (`fcAdminCard(..., 'ink')`). ─── */

export const FC_ADMIN_INK_TITLE = 'text-xl font-semibold tracking-tight text-white';
export const FC_ADMIN_INK_SUBLABEL = 'text-[11px] font-semibold uppercase tracking-wide text-white/60';
export const FC_ADMIN_INK_BODY = 'text-sm leading-relaxed text-white/70';
export const FC_ADMIN_INK_VALUE = 'font-semibold tracking-tight text-white';
export const FC_ADMIN_INK_DIVIDER = 'fc-admin-ink-divider border-t';

/* ─── Inputs ─── */

export const FC_ADMIN_INPUT =
  'mt-1.5 w-full rounded-lg border border-[var(--fc-admin-border)] bg-white px-3 py-2 text-sm text-[var(--fc-admin-ink)] placeholder:text-[var(--fc-admin-ink-faint)] focus:outline-none focus:border-[var(--fc-admin-accent)] focus:ring-2 focus:ring-[var(--fc-admin-accent)]/15 transition-colors';

/* ─── Status chips — 3 semantic states, now SOLID fills (not a 10% ghost) ─── */

export function fcAdminStatusChip(tone: 'ok' | 'warn' | 'blocked') {
  const styles: Record<typeof tone, string> = {
    ok: 'border-[var(--fc-admin-tone-emerald)] bg-[var(--fc-admin-tone-emerald)] text-white',
    warn: 'border-[var(--fc-admin-tone-gold)] bg-[var(--fc-admin-tone-gold)] text-[var(--fc-ink-on-gold)]',
    blocked: 'border-[var(--fc-admin-tone-rose)] bg-[var(--fc-admin-tone-rose)] text-white',
  } as any;
  return `inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest shadow-sm ${styles[tone]}`;
}

/* ─── Buttons — three pop colors (emerald/gold/black), never a faint outline
 * by default. Gold is reserved for invite/findable CTAs so it stays a
 * distinctive signal instead of a generic "secondary" color. ─── */

/** Primary CTA — rich emerald gradient fill, white text, always solid. */
export const FC_ADMIN_PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg fc-admin-solid-emerald border px-3.5 py-2 text-xs font-semibold text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

/** Secondary / neutral utility action (Cancel, Reset, Refresh) — solid graphite/black, never invisible on white. */
export const FC_ADMIN_SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--fc-admin-border-strong)] bg-[var(--fc-admin-ink)] px-3.5 py-2 text-xs font-semibold text-white hover:brightness-125 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

/** Gold CTA — reserved for invite / signup-outreach actions so gold stays a distinctive, findable signal. Dark ink text (contrast). */
export const FC_ADMIN_GOLD_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg fc-admin-solid-gold border px-3.5 py-2 text-xs font-semibold text-[var(--fc-ink-on-gold)] hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

/** Danger — solid rose gradient fill, white text, always solid (not hover-only). */
export const FC_ADMIN_DANGER_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg fc-admin-solid-rose border px-3.5 py-2 text-xs font-semibold text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

/** Danger zone panel — solid rose fill (not a pale tint). Use `FC_ADMIN_INK_ON_ROSE_*`-style helpers (`fcAdminOnSolidText('rose')` etc.) for text on top. */
export const FC_ADMIN_DANGER_PANEL = 'fc-admin-solid-rose rounded-2xl border p-5';

/* ─── Tabs (underline style, semantic per family) — reserved for a future PR ─── */

export type FcAdminTabFamily = 'neutral' | 'navy' | 'sky' | 'amber' | 'emerald' | 'rose';

export function fcAdminTab(active: boolean, family: FcAdminTabFamily = 'neutral') {
  const underline: Record<FcAdminTabFamily, string> = {
    neutral: 'border-[var(--fc-admin-ink)]',
    navy: 'border-[var(--fc-admin-tone-navy)]',
    sky: 'border-[var(--fc-admin-tone-sky)]',
    amber: 'border-[var(--fc-admin-tone-gold)]',
    emerald: 'border-[var(--fc-admin-accent)]',
    rose: 'border-[var(--fc-admin-tone-rose)]',
  };
  return `inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
    active
      ? `${underline[family]} text-[var(--fc-admin-ink)]`
      : 'border-transparent text-[var(--fc-admin-ink-faint)] hover:text-[var(--fc-admin-ink-muted)]'
  }`;
}

/* ─── Score cell — unify EXP/EQF/TUC display everywhere it appears.
 * This IS the data — always a rich `solid` fill, never a pale wash. */

export function fcAdminScoreCell(tone: FcAdminTone = 'sky') {
  if (tone === 'neutral') return fcAdminInnerTile('px-3 py-3 text-center', tone);
  return `fc-admin-solid-${tone} rounded-xl border px-3 py-3 text-center ${fcAdminToneText(tone, 'solid')}`;
}
