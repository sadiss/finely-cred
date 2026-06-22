import manifest from '../data/leadAcquisitionManifest.json';
import { buildPromotedUrl, buildShortReferralUrl } from './leadAttribution';

export type LeadAcquisitionAudience =
  | 'consumer'
  | 'business'
  | 'affiliate'
  | 'specialist'
  | 'au_seller'
  | 'agency';

export type LeadAcquisitionLane = {
  id: string;
  label: string;
  audience: LeadAcquisitionAudience;
  path: string;
  query?: string;
  sequenceId?: string;
  utmCampaign: string;
  utmMedium: string;
  description: string;
};

export const LEAD_ACQUISITION_LANES = manifest.lanes as LeadAcquisitionLane[];

export function getPublicSiteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'https://finelycred.com';
}

export function buildLaneAcquisitionUrl(
  lane: LeadAcquisitionLane,
  args?: { referralCode?: string; utmSource?: string; utmMedium?: string },
): string {
  const path = lane.query ? `${lane.path}?${lane.query}` : lane.path;
  return buildPromotedUrl({
    path,
    referralCode: args?.referralCode,
    utmSource: args?.utmSource ?? 'syndication',
    utmMedium: args?.utmMedium ?? lane.utmMedium,
    utmCampaign: lane.utmCampaign,
    promoType: lane.audience === 'affiliate' ? 'signup' : 'guide',
    promoAsset: lane.id,
  });
}

export function buildLaneShortUrl(referralCode: string): string {
  return buildShortReferralUrl(referralCode);
}

export function lanesByAudience(audience: LeadAcquisitionAudience | 'all'): LeadAcquisitionLane[] {
  if (audience === 'all') return LEAD_ACQUISITION_LANES;
  return LEAD_ACQUISITION_LANES.filter((l) => l.audience === audience);
}

export const SYNDICATION_FEED_PATHS = {
  rss: '/feeds/leads.xml',
  json: '/feeds/leads.json',
} as const;

export function syndicationFeedUrl(kind: keyof typeof SYNDICATION_FEED_PATHS): string {
  return `${getPublicSiteOrigin()}${SYNDICATION_FEED_PATHS[kind]}`;
}

/** Pre-written syndication blurb — safe for directories, forums with disclosure. */
export function laneSyndicationMessage(lane: LeadAcquisitionLane, url: string): string {
  return `${lane.label} — ${lane.description} Educational only; results vary. ${url}`;
}
