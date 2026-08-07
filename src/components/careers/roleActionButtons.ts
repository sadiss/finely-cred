/**
 * Per-role action treatments for the five public role pages.
 *
 * Three tiers must be tellable apart at a glance on every page:
 *  1. `roleJoinBtn`      — the commitment action (Join / Apply / Create workspace)
 *  2. `RoleGuideCta`     — the free read (its own silhouette, see `RoleGuideCta.tsx`)
 *  3. `roleSecondaryBtn` — supporting navigation (compare, browse, ask)
 *
 * Each role also gets a different silhouette from the other four so the pages do
 * not read as one template: RE = gold ledger slab, case help = ink stamp block,
 * specialist = holographic capsule, agency = gold plate, AU seller = gold tab + sky guide.
 */
import type { RolePageId } from '../../config/rolePartnerPrograms';

const BASE =
  'inline-flex max-w-full items-center justify-center gap-2 text-center leading-snug transition-all disabled:opacity-60 disabled:pointer-events-none';

/** Commitment action — filled, highest contrast on its page. */
const JOIN_BTN: Record<RolePageId, string> = {
  re: `${BASE} rounded-none border-y-2 border-amber-200 bg-[linear-gradient(100deg,#fde68a,#f59e0b_55%,#fbbf24)] px-7 py-3.5 text-[12px] font-black uppercase tracking-[0.2em] text-[#1a1205] shadow-[0_16px_38px_-20px_rgba(245,158,11,0.85)] hover:brightness-105 hover:tracking-[0.24em]`,
  case_help: `${BASE} rounded-sm border-2 border-stone-900 bg-stone-900 px-6 py-3 font-serif text-[15px] font-bold tracking-wide text-[#f6f1e4] shadow-[4px_4px_0_rgba(120,113,108,0.45)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(120,113,108,0.5)]`,
  cs: `${BASE} rounded-full bg-[linear-gradient(100deg,#fbbf24,#f59e0b_58%,#fcd34d)] px-7 py-3 text-[12px] font-black uppercase tracking-[0.18em] text-[#1c1206] shadow-[0_0_0_1px_rgba(253,230,138,0.5),0_18px_44px_-20px_rgba(245,158,11,0.85)] hover:brightness-105`,
  agency: `${BASE} rounded-xl border border-amber-100/60 bg-[linear-gradient(140deg,#fde68a,#f59e0b_60%,#d97706)] px-6 py-3.5 text-[12px] font-black uppercase tracking-[0.22em] text-[#140f04] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_20px_48px_-22px_rgba(245,158,11,0.9)] hover:brightness-105`,
  // Solid amber/gold commitment — never green; deliberately unlike sky→violet guide.
  au_seller: `${BASE} rounded-l-2xl rounded-r-md border border-amber-100/80 border-r-[6px] border-r-amber-50 bg-[linear-gradient(100deg,#fde68a,#f59e0b_48%,#fbbf24)] px-6 py-3.5 text-[12px] font-black uppercase tracking-[0.18em] text-[#1a1205] shadow-[0_18px_44px_-18px_rgba(245,158,11,0.95)] hover:brightness-105 hover:border-r-white`,
};

/** Supporting action — outlined in the page's own accent, never mistaken for the join button. */
const SECONDARY_BTN: Record<RolePageId, string> = {
  re: `${BASE} rounded-none border-b border-amber-300/45 bg-transparent px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-100/80 hover:border-amber-200 hover:text-amber-50`,
  case_help: `${BASE} rounded-sm border border-stone-500/50 bg-transparent px-5 py-2.5 font-serif text-sm font-semibold text-stone-700 hover:bg-stone-900/[0.06]`,
  cs: `${BASE} rounded-full border border-violet-200/35 bg-white/[0.05] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-100 hover:border-violet-100/60 hover:bg-white/[0.09]`,
  agency: `${BASE} rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70 hover:border-amber-200/45 hover:text-amber-100`,
  // Ghost hub link — cool sky outline so it never competes with gold signup.
  au_seller: `${BASE} rounded-l-2xl rounded-r-md border border-sky-300/40 bg-sky-400/[0.06] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-100 hover:bg-sky-400/[0.14] hover:border-sky-200/55`,
};

export function roleJoinBtn(role: RolePageId, extra = ''): string {
  return `${JOIN_BTN[role]} ${extra}`.trim();
}

export function roleSecondaryBtn(role: RolePageId, extra = ''): string {
  return `${SECONDARY_BTN[role]} ${extra}`.trim();
}

/** One-line legend so a guest can tell the three action tiers apart without guessing. */
export const ROLE_ACTION_LEGEND: Record<RolePageId, string> = {
  re: 'Gold bar = join the referral path · outlined bar = free readiness guide · underlined = supporting links',
  case_help: 'Ink block = apply to the case desk · stamped cream = free guide · outlined = compare files',
  cs: 'Gold capsule = join the program · holographic capsule = free guide · outlined = compare tiers',
  agency: 'Gold plate = create your workspace · obsidian plate = free Agency Guide · outlined = supporting links',
  au_seller: 'Gold tab = start seller signup · sky→violet tab = free AU guide · cool sky outline = open Seller Hub',
};
