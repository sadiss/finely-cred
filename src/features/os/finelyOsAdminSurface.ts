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
 * Anti-goals: no radial-gradient glows, no backdrop-blur glass, no 5-color KPI
 * rotation. One accent per *type of thing* (status = semantic color, data = neutral).
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

/* ─── Card surfaces (flat, hairline border, no blur/glow) ─── */

/** Primary white card on graphite bg — visible separation without heavy borders. */
export function fcAdminCard(padding = 'p-5') {
  return `rounded-2xl border border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface)] shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${padding}`;
}

/** Recessed / nested tile inside a white card (KPI cells, score cells). */
export function fcAdminInnerTile(padding = 'p-3') {
  return `rounded-xl border border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface-sunken)] ${padding}`;
}

/** Neutral KPI tile — no per-index color rotation (plan §1 anti-goal). */
export function fcAdminKpi() {
  return 'rounded-2xl border border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface)] p-4';
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

/* ─── Inputs ─── */

export const FC_ADMIN_INPUT =
  'mt-1.5 w-full rounded-lg border border-[var(--fc-admin-border)] bg-white px-3 py-2 text-sm text-[var(--fc-admin-ink)] placeholder:text-[var(--fc-admin-ink-faint)] focus:outline-none focus:border-[var(--fc-admin-accent)] focus:ring-2 focus:ring-[var(--fc-admin-accent)]/15 transition-colors';

/* ─── Status chips — 3 semantic states only (never a 4th/5th decorative hue) ─── */

export function fcAdminStatusChip(tone: 'ok' | 'warn' | 'blocked') {
  const styles: Record<typeof tone, string> = {
    ok: 'border-[var(--fc-admin-status-ok)]/25 bg-[var(--fc-admin-status-ok)]/10 text-[var(--fc-admin-status-ok)]',
    warn: 'border-[var(--fc-admin-status-warn)]/25 bg-[var(--fc-admin-status-warn)]/10 text-[var(--fc-admin-status-warn)]',
    blocked: 'border-[var(--fc-admin-status-risk)]/25 bg-[var(--fc-admin-status-risk)]/10 text-[var(--fc-admin-status-risk)]',
  } as any;
  return `inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${styles[tone]}`;
}

/* ─── Buttons ─── */

export const FC_ADMIN_PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--fc-admin-accent)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

export const FC_ADMIN_SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--fc-admin-border-strong)] bg-[var(--fc-admin-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--fc-admin-ink)] hover:bg-[var(--fc-admin-surface-sunken)] transition-all disabled:opacity-50 disabled:cursor-not-allowed';

export const FC_ADMIN_DANGER_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--fc-admin-status-risk)]/40 bg-[var(--fc-admin-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--fc-admin-status-risk)] hover:bg-[var(--fc-admin-status-risk)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed';

export const FC_ADMIN_DANGER_PANEL =
  'rounded-2xl border border-[var(--fc-admin-status-risk)]/30 bg-[var(--fc-admin-status-risk)]/[0.05] p-5';

/* ─── Tabs (underline style, semantic per family) — reserved for a future PR ─── */

export type FcAdminTabFamily = 'neutral' | 'violet' | 'sky' | 'amber' | 'emerald' | 'rose';

export function fcAdminTab(active: boolean, family: FcAdminTabFamily = 'neutral') {
  const underline: Record<FcAdminTabFamily, string> = {
    neutral: 'border-[var(--fc-admin-ink)]',
    violet: 'border-violet-500',
    sky: 'border-sky-500',
    amber: 'border-amber-500',
    emerald: 'border-[var(--fc-admin-accent)]',
    rose: 'border-rose-500',
  };
  return `inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
    active
      ? `${underline[family]} text-[var(--fc-admin-ink)]`
      : 'border-transparent text-[var(--fc-admin-ink-faint)] hover:text-[var(--fc-admin-ink-muted)]'
  }`;
}

/* ─── Score cell — unify EXP/EQF/TUC display everywhere it appears ─── */

export function fcAdminScoreCell() {
  return 'rounded-xl border border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface-sunken)] px-3 py-3 text-center';
}
