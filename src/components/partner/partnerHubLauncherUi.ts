/** Accent keys for partner hub launcher tiles — matches DASH_ACTION_TINT glow palette. */
export const PARTNER_HUB_LAUNCHER_ACCENTS = ['emerald', 'sky', 'violet', 'amber', 'fuchsia'] as const;

export type PartnerHubLauncherAccent = (typeof PARTNER_HUB_LAUNCHER_ACCENTS)[number];

export type PartnerHubLauncherId = 'restore' | 'disputes' | 'debt' | 'business' | 'documents' | 'activity';

/** Glow tiles on dark partner portal — solid accent bed + visible border glow */
export const PARTNER_HUB_ACTION_TINT: Record<PartnerHubLauncherAccent, string> = {
  emerald:
    'fc-partner-hub-glow-tile rounded-xl border-2 border-emerald-400/60 bg-gradient-to-br from-emerald-900 via-emerald-950 to-[#041510] shadow-[0_0_0_1px_rgba(52,211,153,0.45),0_0_40px_-8px_rgba(52,211,153,0.65),0_16px_40px_-12px_rgba(16,185,129,0.5)]',
  sky:
    'fc-partner-hub-glow-tile rounded-xl border-2 border-sky-400/60 bg-gradient-to-br from-sky-900 via-sky-950 to-[#041018] shadow-[0_0_0_1px_rgba(56,189,248,0.4),0_0_40px_-8px_rgba(56,189,248,0.6),0_16px_40px_-12px_rgba(14,165,233,0.48)]',
  violet:
    'fc-partner-hub-glow-tile rounded-xl border-2 border-violet-400/60 bg-gradient-to-br from-violet-900 via-violet-950 to-[#12041a] shadow-[0_0_0_1px_rgba(167,139,250,0.45),0_0_40px_-8px_rgba(167,139,250,0.65),0_16px_40px_-12px_rgba(139,92,246,0.5)]',
  amber:
    'fc-partner-hub-glow-tile rounded-xl border-2 border-amber-400/65 bg-gradient-to-br from-amber-900 via-amber-950 to-[#1a0c02] shadow-[0_0_0_1px_rgba(251,191,36,0.45),0_0_40px_-8px_rgba(251,191,36,0.62),0_16px_40px_-12px_rgba(245,158,11,0.5)]',
  fuchsia:
    'fc-partner-hub-glow-tile rounded-xl border-2 border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-900 via-fuchsia-950 to-[#18041a] shadow-[0_0_0_1px_rgba(232,121,249,0.4),0_0_40px_-8px_rgba(232,121,249,0.6),0_16px_40px_-12px_rgba(217,70,239,0.48)]',
};

export function partnerHubModuleCardClass(accent: PartnerHubLauncherAccent) {
  return `${PARTNER_HUB_ACTION_TINT[accent]} w-full text-left !p-4`;
}

const PARTNER_HUB_ICON_SHELL: Record<PartnerHubLauncherAccent, string> = {
  emerald: 'border-emerald-400/35 bg-emerald-500/20 text-emerald-200 group-hover:text-emerald-100',
  sky: 'border-sky-400/35 bg-sky-500/20 text-sky-200 group-hover:text-sky-100',
  violet: 'border-violet-400/35 bg-violet-500/20 text-violet-200 group-hover:text-violet-100',
  amber: 'border-amber-400/35 bg-amber-500/20 text-amber-200 group-hover:text-amber-100',
  fuchsia: 'border-fuchsia-400/35 bg-fuchsia-500/20 text-fuchsia-200 group-hover:text-fuchsia-100',
};

export function partnerHubIconShellClass(accent: PartnerHubLauncherAccent) {
  return PARTNER_HUB_ICON_SHELL[accent];
}
