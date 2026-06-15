import { getCommsSettings } from '../data/settingsRepo';

/** Public site origin for email links (client or comms appBaseUrl). */
export function getPublicSiteOrigin(): string {
  const appBase = (getCommsSettings().appBaseUrl || '').trim().replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return appBase || 'https://finelycred.com';
}

export function buildFunnelDownloadUrl(funnelPath: string): string {
  const path = funnelPath.startsWith('/') ? funnelPath : `/${funnelPath}`;
  return `${getPublicSiteOrigin()}${path}?step=download`;
}

export function buildFunnelSuccessUrl(funnelPath: string): string {
  const path = funnelPath.startsWith('/') ? funnelPath : `/${funnelPath}`;
  return `${getPublicSiteOrigin()}${path}?step=success`;
}

export function buildEnlightenmentSessionUrl(args?: {
  email?: string;
  name?: string;
  phone?: string;
  leadId?: string;
  focus?: 'personal' | 'debt' | 'business' | 'tradelines';
}): string {
  const params = new URLSearchParams();
  if (args?.email?.trim()) params.set('email', args.email.trim());
  if (args?.name?.trim()) params.set('name', args.name.trim());
  if (args?.phone?.trim()) params.set('phone', args.phone.trim());
  if (args?.leadId?.trim()) params.set('leadId', args.leadId.trim());
  if (args?.focus) params.set('focus', args.focus);
  const qs = params.toString();
  return `${getPublicSiteOrigin()}/enlightenment-session${qs ? `?${qs}` : ''}`;
}

export function focusFromFunnelId(funnelId: string): 'personal' | 'debt' | 'business' | 'tradelines' {
  if (funnelId === 'debt_freedom') return 'debt';
  if (funnelId === 'business_credit') return 'business';
  if (funnelId === 'tradeline_insider') return 'tradelines';
  return 'personal';
}
