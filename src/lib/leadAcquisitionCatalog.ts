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

/** Content Studio / video workflow — `utm_content=video:{id}` on syndicated links. */
export const LEAD_UTM_VIDEO_CONTENT_PREFIX = 'video:';

export function buildVideoUtmContent(videoId: string): string {
  const id = videoId.trim();
  if (!id) return '';
  return `${LEAD_UTM_VIDEO_CONTENT_PREFIX}${id}`;
}

export function parseVideoIdFromUtmContent(utmContent?: string | null): string | undefined {
  const raw = utmContent?.trim();
  if (!raw?.startsWith(LEAD_UTM_VIDEO_CONTENT_PREFIX)) return undefined;
  const id = raw.slice(LEAD_UTM_VIDEO_CONTENT_PREFIX.length).trim();
  return id || undefined;
}

/** Promote step → Hannah: `videoId` or `utm_content=video:{id}`. */
export function resolvePromoteVideoIdFromSearch(search: string): string | undefined {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const direct = params.get('videoId')?.trim();
  if (direct) return direct;
  return parseVideoIdFromUtmContent(params.get('utm_content'));
}

export function buildLaneAcquisitionUrl(
  lane: LeadAcquisitionLane,
  args?: { referralCode?: string; utmSource?: string; utmMedium?: string; utmContent?: string },
): string {
  const path = lane.query ? `${lane.path}?${lane.query}` : lane.path;
  return buildPromotedUrl({
    path,
    referralCode: args?.referralCode,
    utmSource: args?.utmSource ?? 'syndication',
    utmMedium: args?.utmMedium ?? lane.utmMedium,
    utmCampaign: lane.utmCampaign,
    utmContent: args?.utmContent,
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
