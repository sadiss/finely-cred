import { newId } from '../../utils/ids';
import { DEFAULT_LEAD_ENGINE_CITIES, FUNNEL_LABELS } from './citySourceVault';
import type { LeadEngineFunnel, LeadEngineSourceKind, TrackedShortLink } from './types';

export const FUNNEL_DESTINATIONS: Record<LeadEngineFunnel, string> = {
  business_credit_eguide: '/resources?guide=business-sequence-ladder',
  tradeline_guide: '/tradelines?source=lead-engine',
  personal_credit_repair_guide: '/pricing/personal-credit-restore',
  funding_readiness_guide: '/business/funding',
  credit_specialist_recruiting: '/agents',
  agency_partner_recruiting: '/agency/signup',
  affiliate_partner_recruiting: '/affiliate',
  au_seller_recruiting: '/au/seller/apply',
  consultation_booking: '/consultation',
  event_webinar: '/events',
  press_authority: '/contact?interest=press',
  book_course_buyer: '/bookstore',
};

function slugify(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function destinationForFunnel(funnel: LeadEngineFunnel, args?: { cityId?: string; source?: LeadEngineSourceKind; campaign?: string }) {
  const base = FUNNEL_DESTINATIONS[funnel] ?? '/consultation';
  const city = DEFAULT_LEAD_ENGINE_CITIES.find((c) => c.id === args?.cityId);
  const params = new URLSearchParams();
  params.set('utm_source', args?.source ?? 'lead_engine');
  params.set('utm_medium', 'lead_intel_action_center');
  params.set('utm_campaign', args?.campaign ?? slugify(FUNNEL_LABELS[funnel]));
  if (city) {
    params.set('city', city.label);
    params.set('state', city.state);
  }
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}${params.toString()}`;
}

export function createTrackedShortLink(args: {
  funnel: LeadEngineFunnel;
  cityId?: string;
  source?: LeadEngineSourceKind;
  campaign?: string;
  destinationUrl?: string;
}): TrackedShortLink {
  const cityPart = args.cityId ? slugify(args.cityId.replace(/-/g, ' ')).slice(0, 12) : 'all';
  const funnelPart = slugify(args.funnel).split('-').slice(0, 3).join('-');
  const campaignPart = slugify(args.campaign ?? 'lead').slice(0, 12) || 'lead';
  const id = newId('slink');
  const slug = `${cityPart}-${funnelPart}-${campaignPart}-${id.slice(-5)}`;
  return {
    id,
    slug,
    createdAt: new Date().toISOString(),
    destinationUrl: args.destinationUrl ?? destinationForFunnel(args.funnel, args),
    funnel: args.funnel,
    cityId: args.cityId,
    source: args.source,
    campaign: args.campaign,
    medium: 'lead_intel_action_center',
    clicks: 0,
    leads: 0,
    bookings: 0,
    meta: {
      generatedBy: 'LeadIntelActionCenter',
      safety: 'tracked-shortlink-no-spam',
    },
  };
}

export function publicShortUrl(link: TrackedShortLink, origin = '') {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/go/${link.slug}`;
}

export function recordShortLinkClick(link: TrackedShortLink): TrackedShortLink {
  return {
    ...link,
    clicks: (link.clicks ?? 0) + 1,
    lastClickAt: new Date().toISOString(),
  };
}

export function explainShortLink(link: TrackedShortLink) {
  const city = DEFAULT_LEAD_ENGINE_CITIES.find((c) => c.id === link.cityId);
  const label = FUNNEL_LABELS[link.funnel];
  return `${label}${city ? ` for ${city.label}, ${city.state}` : ''} via ${link.source ?? 'lead engine'}`;
}
