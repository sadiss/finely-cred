/** Light workspace preview — design tokens (beds, bands, roles, state). */

export type WlAccent = 'emerald' | 'violet' | 'sky' | 'fuchsia' | 'rose' | 'navy';

export type WlPageBed = {
  bg: string;
  mesh: string;
  ink: string;
  muted: string;
};

export const WL_PAGE_BEDS: Record<string, WlPageBed> = {
  hub: {
    bg: '#f7f9fc',
    mesh: 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(14,165,233,0.08), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 10%, rgba(139,92,246,0.1), transparent 50%)',
    ink: '#0a1628',
    muted: 'rgba(10,22,40,0.62)',
  },
  admin: {
    bg: '#f4f7fb',
    mesh: 'radial-gradient(ellipse 90% 55% at 0% 0%, rgba(139,92,246,0.07), transparent 52%)',
    ink: '#0a1628',
    muted: 'rgba(10,22,40,0.62)',
  },
  partner: {
    bg: '#f8faf8',
    mesh: 'radial-gradient(ellipse 85% 60% at 100% 0%, rgba(16,185,129,0.08), transparent 55%)',
    ink: '#0a1628',
    muted: 'rgba(10,22,40,0.62)',
  },
  business: {
    bg: '#eef1f8',
    mesh: 'radial-gradient(ellipse 75% 50% at 50% 0%, rgba(30,41,59,0.06), transparent 50%)',
    ink: '#0a1628',
    muted: 'rgba(10,22,40,0.62)',
  },
  seller: {
    bg: '#f9fafb',
    mesh: 'radial-gradient(ellipse 80% 55% at 80% 20%, rgba(217,70,239,0.07), transparent 50%)',
    ink: '#0a1628',
    muted: 'rgba(10,22,40,0.62)',
  },
};

export const WL_ROLE_HUB_ACCENTS: Record<string, WlAccent> = {
  hub: 'violet',
  admin: 'violet',
  partner: 'emerald',
  business: 'navy',
  seller: 'fuchsia',
};

export const WL_ADMIN_SECTIONS: Record<string, { accent: WlAccent; label: string; eyebrow: string }> = {
  overview: { accent: 'emerald', label: 'Overview', eyebrow: 'Growth & pulse' },
  ops: { accent: 'violet', label: 'Ops & growth', eyebrow: 'Command intel' },
  modules: { accent: 'sky', label: 'All modules', eyebrow: 'Launch pad' },
};

export const WL_ADMIN_MODULE_GROUPS: Record<string, { accent: WlAccent; eyebrow: string }> = {
  core: { accent: 'emerald', eyebrow: 'Daily control' },
  comms: { accent: 'sky', eyebrow: 'Publish & reach' },
  automation: { accent: 'violet', eyebrow: 'AI & autopilot' },
  platform: { accent: 'navy', eyebrow: 'System & access' },
};

export const WL_PARTNER_SECTIONS: Record<string, { accent: WlAccent; eyebrow: string }> = {
  'partner-admin-banner': { accent: 'violet', eyebrow: 'Admin view' },
  'partner-command': { accent: 'emerald', eyebrow: 'Restore command' },
  'partner-alerts': { accent: 'rose', eyebrow: 'Action needed' },
  'partner-overview': { accent: 'violet', eyebrow: 'Your file' },
  'partner-launcher': { accent: 'sky', eyebrow: 'Tools & lanes' },
  'partner-activity': { accent: 'navy', eyebrow: 'Recent activity' },
};

export const WL_STATE_ACCENTS = {
  blocking: 'fuchsia' as const,
  warning: 'sky' as const,
  success: 'emerald' as const,
  info: 'sky' as const,
};

export const WL_ACCENT_GLOW: Record<WlAccent, string> = {
  emerald: '0 20px 56px -4px rgba(16, 185, 129, 0.35)',
  violet: '0 20px 58px -4px rgba(139, 92, 246, 0.32)',
  sky: '0 20px 56px -4px rgba(14, 165, 233, 0.3)',
  fuchsia: '0 20px 58px -4px rgba(217, 70, 239, 0.3)',
  rose: '0 20px 58px -4px rgba(244, 63, 94, 0.28)',
  navy: '0 20px 56px -4px rgba(30, 41, 59, 0.25)',
};
