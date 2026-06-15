/** Finely Cred logo + header bands for HTML email (absolute URLs required). */
import { getPublicSiteOrigin } from '../lib/funnelPublicLinks';

export type FinelyEmailLogoVariant = 'dark' | 'light' | 'signature';

const LOGO_PATH: Record<FinelyEmailLogoVariant, string> = {
  dark: '/brand/finely-cred-logo-email-dark.png',
  light: '/brand/finely-cred-logo-email-light.png',
  signature: '/brand/finely-cred-logo-email-signature.png',
};

const DEFAULT_WIDTH: Record<FinelyEmailLogoVariant, number> = {
  dark: 168,
  light: 168,
  signature: 132,
};

export function finelyEmailLogoUrl(variant: FinelyEmailLogoVariant = 'dark', origin?: string): string {
  const base = (origin ?? getPublicSiteOrigin()).replace(/\/$/, '');
  return `${base}${LOGO_PATH[variant]}`;
}

export function buildFinelyEmailLogoHtml(args?: {
  variant?: FinelyEmailLogoVariant;
  width?: number;
  href?: string;
  origin?: string;
  alt?: string;
  align?: 'left' | 'center';
}): string {
  const variant = args?.variant ?? 'dark';
  const width = args?.width ?? DEFAULT_WIDTH[variant];
  const height = Math.round(width * (168 / 213));
  const src = finelyEmailLogoUrl(variant, args?.origin);
  const alt = args?.alt ?? 'Finely Cred';
  const align = args?.align ?? 'left';
  const img = `<img src="${src}" width="${width}" height="${height}" alt="${alt}" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:100%;" />`;
  const inner = args?.href
    ? `<a href="${args.href}" style="text-decoration:none;border:0;">${img}</a>`
    : img;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 ${variant === 'signature' ? '10' : '14'}px;">
  <tr><td align="${align}">${inner}</td></tr>
</table>`;
}

export type FinelyEmailHeaderTheme = 'emerald' | 'gold' | 'slate' | 'violet';

const HEADER_THEMES: Record<
  FinelyEmailHeaderTheme,
  { bg: string; logoVariant: FinelyEmailLogoVariant; headlineColor: string; subColor: string }
> = {
  emerald: {
    bg: 'linear-gradient(135deg,#0a100e 0%,#121a17 42%,#065f46 100%)',
    logoVariant: 'dark',
    headlineColor: '#ffffff',
    subColor: 'rgba(255,255,255,0.78)',
  },
  gold: {
    bg: 'linear-gradient(135deg,#1a1400 0%,#3d2e06 38%,#b45309 100%)',
    logoVariant: 'dark',
    headlineColor: '#fffef5',
    subColor: 'rgba(255,248,231,0.82)',
  },
  slate: {
    bg: 'linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#334155 100%)',
    logoVariant: 'dark',
    headlineColor: '#ffffff',
    subColor: 'rgba(226,232,240,0.78)',
  },
  violet: {
    bg: 'linear-gradient(135deg,#0a0612 0%,#1e1b4b 50%,#4c1d95 100%)',
    logoVariant: 'dark',
    headlineColor: '#ffffff',
    subColor: 'rgba(237,233,254,0.78)',
  },
};

export function buildFinelyEmailHeaderHtml(args: {
  headline: string;
  subheadline?: string;
  theme?: FinelyEmailHeaderTheme;
  origin?: string;
  siteHref?: string;
}): string {
  const theme = HEADER_THEMES[args.theme ?? 'emerald'];
  const sub = args.subheadline
    ? `<p style="margin:10px 0 0;font-size:16px;line-height:1.5;color:${theme.subColor};font-family:system-ui,-apple-system,sans-serif;">${args.subheadline}</p>`
    : '';
  const logo = buildFinelyEmailLogoHtml({
    variant: theme.logoVariant,
    origin: args.origin,
    href: args.siteHref ?? getPublicSiteOrigin(),
    width: 156,
  });

  return `<tr>
    <td style="padding:26px 32px 22px;background:${theme.bg};">
      ${logo}
      <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:700;color:${theme.headlineColor};font-family:system-ui,-apple-system,sans-serif;">${args.headline}</h1>
      ${sub}
    </td>
  </tr>`;
}
