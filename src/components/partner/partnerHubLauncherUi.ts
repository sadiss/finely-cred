/** Accent keys for partner hub launcher tiles — rotate emerald → violet → sky → rose. */
export const PARTNER_HUB_LAUNCHER_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export type PartnerHubLauncherAccent = (typeof PARTNER_HUB_LAUNCHER_ACCENTS)[number] | 'fuchsia';

export type PartnerHubLauncherId = 'restore' | 'disputes' | 'debt' | 'business' | 'documents' | 'activity';

/** Glow tiles on dark partner portal — solid accent bed + visible border glow */
export const PARTNER_HUB_ACTION_TINT: Record<PartnerHubLauncherAccent, string> = {
  emerald:
    'fc-partner-hub-glow-tile rounded-2xl border-2 border-emerald-400/60 bg-gradient-to-br from-emerald-900 via-emerald-950 to-[#041510] shadow-[0_0_0_1px_rgba(52,211,153,0.45),0_0_40px_-8px_rgba(52,211,153,0.65),0_16px_40px_-12px_rgba(16,185,129,0.5)]',
  sky:
    'fc-partner-hub-glow-tile rounded-2xl border-2 border-sky-400/60 bg-gradient-to-br from-sky-900 via-sky-950 to-[#041018] shadow-[0_0_0_1px_rgba(56,189,248,0.4),0_0_40px_-8px_rgba(56,189,248,0.6),0_16px_40px_-12px_rgba(14,165,233,0.48)]',
  violet:
    'fc-partner-hub-glow-tile rounded-2xl border-2 border-violet-400/60 bg-gradient-to-br from-violet-900 via-violet-950 to-[#12041a] shadow-[0_0_0_1px_rgba(167,139,250,0.45),0_0_40px_-8px_rgba(167,139,250,0.65),0_16px_40px_-12px_rgba(139,92,246,0.5)]',
  rose:
    'fc-partner-hub-glow-tile rounded-2xl border-2 border-rose-400/60 bg-gradient-to-br from-rose-900 via-rose-950 to-[#140308] shadow-[0_0_0_1px_rgba(244,63,94,0.4),0_0_40px_-8px_rgba(244,63,94,0.55),0_16px_40px_-12px_rgba(225,29,72,0.45)]',
  fuchsia:
    'fc-partner-hub-glow-tile rounded-2xl border-2 border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-900 via-fuchsia-950 to-[#18041a] shadow-[0_0_0_1px_rgba(232,121,249,0.4),0_0_40px_-8px_rgba(232,121,249,0.6),0_16px_40px_-12px_rgba(217,70,239,0.48)]',
};

export function partnerHubModuleCardClass(accent: PartnerHubLauncherAccent) {
  return `${PARTNER_HUB_ACTION_TINT[accent]} w-full text-left p-6 lg:p-8`;
}

const PARTNER_HUB_ICON_SHELL: Record<PartnerHubLauncherAccent, string> = {
  emerald: 'bg-emerald-500 text-white shadow-[0_10px_18px_-12px_rgba(16,185,129,0.95)]',
  violet: 'bg-violet-500 text-white shadow-[0_10px_18px_-12px_rgba(139,92,246,0.95)]',
  sky: 'bg-sky-500 text-white shadow-[0_10px_18px_-12px_rgba(14,165,233,0.95)]',
  rose: 'bg-rose-500 text-white shadow-[0_10px_18px_-12px_rgba(244,63,94,0.95)]',
  fuchsia: 'bg-fuchsia-500 text-white shadow-[0_10px_18px_-12px_rgba(217,70,239,0.95)]',
};

export function partnerHubIconShellClass(accent: PartnerHubLauncherAccent) {
  return PARTNER_HUB_ICON_SHELL[accent];
}
