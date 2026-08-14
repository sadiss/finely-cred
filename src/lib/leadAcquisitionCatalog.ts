import manifest from '../data/leadAcquisitionManifest.json';
import { buildPromotedUrl, buildShortReferralUrl } from './leadAttribution';
import {
  resolveFinelyCtaPath,
  type FinelyCtaIntentId,
  type FinelyCtaIntentOptions,
} from './finelyCtaIntent';

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

const LANE_CTA_INTENT: Partial<
  Record<string, { intent: FinelyCtaIntentId; options?: FinelyCtaIntentOptions }>
> = {
  credit_restore: { intent: 'personal_free_trial' },
  score_roadmap: { intent: 'score_roadmap_intake' },
  debt_relief: { intent: 'debt_intake' },
  business_credit: { intent: 'business_intake' },
  tradeline_au: { intent: 'tradeline_intake' },
  agency_white_label: { intent: 'business_intake' },
  credit_specialist: { intent: 'agent_intake' },
  affiliate: { intent: 'affiliate_intake' },
  affiliate_program: { intent: 'affiliate_intake' },
  au_seller: { intent: 'au_seller_intake' },
  strategy_call: { intent: 'consultation', options: { consultationLane: 'General' } },
};

export type LaneCtaIntentMeta = {
  intent: FinelyCtaIntentId;
  path: string;
  intentLabel: string;
};

const INTENT_LABELS: Record<FinelyCtaIntentId, string> = {
  personal_free_guide: 'Start free guide',
  personal_free_trial: 'Start free trial',
  personal_intake: 'Personal intake',
  personal_package: 'Package checkout',
  business_intake: 'Business intake',
  debt_intake: 'Debt intake',
  funding_intake: 'Funding intake',
  consultation: 'Book a session',
  career_track: 'Career track',
  lead_magnet: 'Lead magnet',
  affiliate_intake: 'Affiliate signup',
  au_seller_intake: 'AU seller signup',
  au_buyer_intake: 'AU buyer intake',
  tradeline_intake: 'Tradeline intake',
  agent_intake: 'Agent signup',
  score_roadmap_intake: 'Score roadmap intake',
  heta_intake: 'HETA Society intake',
};

/** Hannah CTA factory — intent + resolved path for each lane magnet. */
export function resolveLaneCtaIntentMeta(lane: LeadAcquisitionLane): LaneCtaIntentMeta {
  const mapped = LANE_CTA_INTENT[lane.id];
  const intent: FinelyCtaIntentId = mapped?.intent ?? 'lead_magnet';
  return {
    intent,
    path: resolveLaneAcquisitionPath(lane),
    intentLabel: INTENT_LABELS[intent],
  };
}

/** Resolve lane landing path via finelyCtaIntent spine — lane query preserved when set. */
export function resolveLaneAcquisitionPath(lane: LeadAcquisitionLane): string {
  const mapped = LANE_CTA_INTENT[lane.id];
  if (mapped) {
    const base = resolveFinelyCtaPath(mapped.intent, mapped.options ?? {});
    if (lane.query) {
      const [pathOnly] = base.split('?');
      return `${pathOnly}?${lane.query}`;
    }
    return base;
  }
  return lane.query ? `${lane.path}?${lane.query}` : lane.path;
}

export function buildLaneAcquisitionUrl(
  lane: LeadAcquisitionLane,
  args?: { referralCode?: string; utmSource?: string; utmMedium?: string; utmContent?: string },
): string {
  return buildPromotedUrl({
    path: resolveLaneAcquisitionPath(lane),
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
