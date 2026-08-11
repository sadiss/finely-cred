/** Accent keys for partner hub launcher tiles — matches DASH_ACTION_TINT glow palette. */
export const PARTNER_HUB_LAUNCHER_ACCENTS = ['emerald', 'sky', 'violet', 'amber', 'fuchsia'] as const;

export type PartnerHubLauncherAccent = (typeof PARTNER_HUB_LAUNCHER_ACCENTS)[number];

export type PartnerHubLauncherId = 'restore' | 'disputes' | 'debt' | 'business' | 'documents' | 'activity';

/** Soft accent wash + glow for ivory surfaces — color pops without nested white/gray cards. */
export const PARTNER_HUB_ACTION_TINT: Record<PartnerHubLauncherAccent, string> = {
  emerald:
    'rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-400/28 via-emerald-500/12 to-transparent shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_14px_36px_-10px_rgba(16,185,129,0.62),0_0_24px_-6px_rgba(16,185,129,0.28)]',
  sky:
    'rounded-xl border border-sky-500/50 bg-gradient-to-br from-sky-400/28 via-sky-500/12 to-transparent shadow-[0_0_0_1px_rgba(14,165,233,0.2),0_14px_36px_-10px_rgba(14,165,233,0.58),0_0_24px_-6px_rgba(14,165,233,0.26)]',
  violet:
    'rounded-xl border border-violet-500/50 bg-gradient-to-br from-violet-400/28 via-violet-500/12 to-transparent shadow-[0_0_0_1px_rgba(139,92,246,0.22),0_14px_36px_-10px_rgba(139,92,246,0.62),0_0_24px_-6px_rgba(139,92,246,0.28)]',
  amber:
    'rounded-xl border border-amber-500/55 bg-gradient-to-br from-amber-300/32 via-amber-500/14 to-transparent shadow-[0_0_0_1px_rgba(245,158,11,0.22),0_14px_36px_-10px_rgba(245,158,11,0.62),0_0_24px_-6px_rgba(245,158,11,0.28)]',
  fuchsia:
    'rounded-xl border border-fuchsia-500/50 bg-gradient-to-br from-fuchsia-400/28 via-fuchsia-500/12 to-transparent shadow-[0_0_0_1px_rgba(217,70,239,0.2),0_14px_36px_-10px_rgba(217,70,239,0.58),0_0_24px_-6px_rgba(217,70,239,0.26)]',
};
