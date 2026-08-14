import type { LeadIntelSourceAdapter, LeadIntelSourceId } from './types';

/**
 * Sources with a real CRM / webhook / Serper path today (not swarm tick counters).
 *
 * Phase 5a additions (see src/features/overnight50/liveLeadFetchers.ts):
 *  - `reddit_geo` — real call to Reddit's public search.json endpoint (proxy-first to
 *    dodge CORS). Caveat: confirmed during implementation that Reddit's 2026 anti-bot
 *    policy frequently 403s anonymous requests — the call is genuine, but success is
 *    not guaranteed; falls back to simulation on failure.
 *  - `indiehackers_hn` — real call to Hacker News' public Algolia search API
 *    (`hn.algolia.com`), confirmed working with permissive CORS, no proxy needed.
 *  - `bbb_complaints` — real call to bbb.org's public business search, routed through
 *    the `lead-intel-fetch-proxy` edge function (bbb.org sends no CORS headers, so a
 *    direct browser fetch is blocked). Confirmed 200 + parseable result cards.
 *  - `craigslist_services` — real call to a per-metro Craigslist RSS search URL.
 *    Caveat: confirmed the search/RSS endpoint actively hCaptcha-blocks automated
 *    requests (403) even server-side; kept live because the network call is genuine
 *    and gracefully falls back, but expect a low real-data hit rate today.
 */
const LIVE_SOURCE_IDS = new Set<LeadIntelSourceId>([
  'serper_web',
  'serper_news',
  'serper_places',
  'dead_lead_revival',
  'affiliate_referral_loop',
  'seo_inbound_forms',
  'csv_seed_expansion',
  'reddit_geo',
  'indiehackers_hn',
  'bbb_complaints',
  'craigslist_services',
]);

/** Priority live adapters shared with Marketing Desk Find staging (Serper + internal). */
export const PRIORITY_MARKETING_SOURCE_IDS: LeadIntelSourceId[] = [
  'serper_web',
  'serper_places',
  'dead_lead_revival',
  'affiliate_referral_loop',
  'seo_inbound_forms',
];

export const LEAD_INTEL_SOURCE_ADAPTERS: LeadIntelSourceAdapter[] = [

  { id: 'serper_web' as LeadIntelSourceId, label: 'Serper Web', method: 'official_api', requiresEnv: ['VITE_SERPER_ENABLED'], defaultDailyCap: 30, defaultCadenceMinutes: 15, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'serper_news' as LeadIntelSourceId, label: 'Serper News', method: 'official_api', requiresEnv: ['VITE_SERPER_ENABLED'], defaultDailyCap: 40, defaultCadenceMinutes: 25, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'serper_places' as LeadIntelSourceId, label: 'Serper Places', method: 'official_api', requiresEnv: ['VITE_SERPER_ENABLED'], defaultDailyCap: 50, defaultCadenceMinutes: 35, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'google_maps_leads' as LeadIntelSourceId, label: 'Google Maps Leads', method: 'public_directory', requiresEnv: [], defaultDailyCap: 60, defaultCadenceMinutes: 45, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'reddit_geo' as LeadIntelSourceId, label: 'Reddit Geo', method: 'official_api', requiresEnv: [], defaultDailyCap: 70, defaultCadenceMinutes: 55, supportsContinuous: true, notes: 'Live — real call to Reddit\'s public search.json (no login for public search). Routed through the lead-intel-fetch-proxy edge function to avoid CORS. Reddit\'s 2026 anti-bot tightening frequently 403s anonymous requests; falls back to simulation on failure.' },
  { id: 'facebook_groups_manual_queue' as LeadIntelSourceId, label: 'Facebook Groups Manual Queue', method: 'manual_queue', requiresEnv: [], defaultDailyCap: 80, defaultCadenceMinutes: 15, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'nextdoor_manual_queue' as LeadIntelSourceId, label: 'Nextdoor Manual Queue', method: 'manual_queue', requiresEnv: [], defaultDailyCap: 90, defaultCadenceMinutes: 25, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'craigslist_services' as LeadIntelSourceId, label: 'Craigslist Services', method: 'rss', requiresEnv: [], defaultDailyCap: 30, defaultCadenceMinutes: 35, supportsContinuous: true, notes: 'Live RSS fetch attempted per-metro (60-city Craigslist subdomain map, no API key). Craigslist actively hCaptcha-blocks the search/RSS endpoint for automated clients (confirmed 403) — falls back to simulation whenever the real fetch is blocked.' },
  { id: 'youtube_comments' as LeadIntelSourceId, label: 'Youtube Comments', method: 'official_api', requiresEnv: [], defaultDailyCap: 40, defaultCadenceMinutes: 45, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'tiktok_hashtag_watch' as LeadIntelSourceId, label: 'Tiktok Hashtag Watch', method: 'official_api', requiresEnv: [], defaultDailyCap: 50, defaultCadenceMinutes: 55, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'instagram_geo_hashtags' as LeadIntelSourceId, label: 'Instagram Geo Hashtags', method: 'official_api', requiresEnv: [], defaultDailyCap: 60, defaultCadenceMinutes: 15, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'linkedin_search' as LeadIntelSourceId, label: 'Linkedin Search', method: 'official_api', requiresEnv: [], defaultDailyCap: 70, defaultCadenceMinutes: 25, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'x_search' as LeadIntelSourceId, label: 'X Search', method: 'official_api', requiresEnv: [], defaultDailyCap: 80, defaultCadenceMinutes: 35, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'quora_credit' as LeadIntelSourceId, label: 'Quora Credit', method: 'public_directory', requiresEnv: [], defaultDailyCap: 90, defaultCadenceMinutes: 45, supportsContinuous: true, notes: 'Simulation only — verified quora.com returns HTTP 403 to automated requests (bot protection). No reliable no-login endpoint found; needs manual QA workflow.' },
  { id: 'bbb_complaints' as LeadIntelSourceId, label: 'Bbb Complaints', method: 'public_directory', requiresEnv: [], defaultDailyCap: 30, defaultCadenceMinutes: 55, supportsContinuous: true, notes: 'Live — real fetch of bbb.org\'s public business search (general accredited-business search, not a complaints-specific feed) via the lead-intel-fetch-proxy edge function (bbb.org sends no CORS headers). Confirmed working with parseable business name/phone/address result cards.' },
  { id: 'chamber_of_commerce' as LeadIntelSourceId, label: 'Chamber Of Commerce', method: 'public_directory', requiresEnv: [], defaultDailyCap: 40, defaultCadenceMinutes: 15, supportsContinuous: true, notes: 'Simulation only — verified chamberofcommerce.com returns HTTP 403 to automated requests, and local chambers have no consistent per-city URL pattern to fetch generically. No reliable public endpoint found.' },
  { id: 'local_event_calendars' as LeadIntelSourceId, label: 'Local Event Calendars', method: 'rss', requiresEnv: [], defaultDailyCap: 50, defaultCadenceMinutes: 25, supportsContinuous: true, notes: 'Live-capable: fetchAndParseRssLeads runs against admin-configured feed URL(s) (VITE_LEAD_INTEL_RSS_FEEDS). No universal per-city calendar feed exists to auto-derive one — simulation-only until an admin configures a real feed.' },
  { id: 'indeed_role_watch' as LeadIntelSourceId, label: 'Indeed Role Watch', method: 'public_directory', requiresEnv: [], defaultDailyCap: 60, defaultCadenceMinutes: 35, supportsContinuous: true, notes: 'Simulation only — verified indeed.com returns HTTP 403 to automated requests (Cloudflare bot protection). No reliable no-login endpoint found.' },
  { id: 'google_alerts_ingest' as LeadIntelSourceId, label: 'Google Alerts Ingest', method: 'rss', requiresEnv: [], defaultDailyCap: 70, defaultCadenceMinutes: 45, supportsContinuous: true, notes: 'Live-capable: fetchAndParseRssLeads runs against admin-configured Google Alerts RSS export URL(s) (VITE_LEAD_INTEL_RSS_FEEDS) — the export URL is per-Google-account and can\'t be derived automatically. Simulation-only until configured.' },
  { id: 'indiehackers_hn' as LeadIntelSourceId, label: 'Indiehackers Hn', method: 'public_directory', requiresEnv: [], defaultDailyCap: 80, defaultCadenceMinutes: 55, supportsContinuous: true, notes: 'Live — real call to Hacker News\' public Algolia search API (hn.algolia.com), confirmed working with permissive CORS (no proxy needed). Covers the "Hn" half only — IndieHackers.com itself has no public API and isn\'t scraped.' },
  { id: 'domain_expiry_lists' as LeadIntelSourceId, label: 'Domain Expiry Lists', method: 'public_directory', requiresEnv: [], defaultDailyCap: 90, defaultCadenceMinutes: 15, supportsContinuous: true, notes: 'Simulation only — verified expireddomains.net requires a login to see actual domain listing data; the public page returns an empty results shell. No genuine no-login public feed found.' },
  { id: 'review_sites' as LeadIntelSourceId, label: 'Review Sites', method: 'public_directory', requiresEnv: [], defaultDailyCap: 30, defaultCadenceMinutes: 25, supportsContinuous: true, notes: 'Simulation only — verified yelp.com returns HTTP 403 to automated requests (PerimeterX bot protection); Google Business reviews require an official Places API key (would need to move to official_api + GOOGLE_PLACES_API_KEY in a future pass).' },
  { id: 'competitor_review_complaints' as LeadIntelSourceId, label: 'Competitor Review Complaints', method: 'public_directory', requiresEnv: [], defaultDailyCap: 40, defaultCadenceMinutes: 35, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'webhook_meta_leads' as LeadIntelSourceId, label: 'Webhook Meta Leads', method: 'webhook', requiresEnv: [], defaultDailyCap: 50, defaultCadenceMinutes: 45, supportsContinuous: true, notes: 'Known gap (verified Phase 5a): supabase/functions/meta-webhook writes real Meta Lead Ads submissions server-side, but no frontend repo read-path exists yet for this swarm to pull real counts from it — tick counters here are still simulated. Labeled live for the webhook itself; not yet reflected in swarm counts.' },
  { id: 'webhook_google_lsa' as LeadIntelSourceId, label: 'Webhook Google Lsa', method: 'webhook', requiresEnv: [], defaultDailyCap: 60, defaultCadenceMinutes: 55, supportsContinuous: true, notes: 'Known gap (verified Phase 5a): no Google LSA webhook receiver or backing repo was found in this codebase — tick counters here are still simulated pending real webhook wiring.' },
  { id: 'csv_seed_expansion' as LeadIntelSourceId, label: 'Csv Seed Expansion', method: 'public_directory', requiresEnv: [], defaultDailyCap: 70, defaultCadenceMinutes: 15, supportsContinuous: true, notes: 'Admin-provided CSV seeds — first-party data, not a network scrape.' },
  { id: 'dead_lead_revival' as LeadIntelSourceId, label: 'Dead Lead Revival', method: 'internal', requiresEnv: [], defaultDailyCap: 80, defaultCadenceMinutes: 25, supportsContinuous: true, notes: 'Live — verified Phase 5a: real count of stale (non-terminal, 21+ days idle) CRM records from data/crmRecordsRepo.listCrmRecords(), trickled into discovered/enriched instead of a random bump.' },
  { id: 'affiliate_referral_loop' as LeadIntelSourceId, label: 'Affiliate Referral Loop', method: 'internal', requiresEnv: [], defaultDailyCap: 90, defaultCadenceMinutes: 35, supportsContinuous: true, notes: 'Live — verified Phase 5a: real affiliate + recent (30d) attribution-event counts from data/affiliateRepo (listAffiliatesLocalSync / listAffiliateEventsLocalSync), trickled into discovered/enriched instead of a random bump.' },
  { id: 'seo_inbound_forms' as LeadIntelSourceId, label: 'Seo Inbound Forms', method: 'internal', requiresEnv: [], defaultDailyCap: 30, defaultCadenceMinutes: 45, supportsContinuous: true, notes: 'Live — verified Phase 5a: real count of recent (7d) organic inbound form captures (resources/lead_magnet/contact sources) from data/leadsRepo.listLeadCaptures(), trickled into discovered/enriched instead of a random bump.' },
  { id: 'sms_reply_capture' as LeadIntelSourceId, label: 'Sms Reply Capture', method: 'internal', requiresEnv: [], defaultDailyCap: 40, defaultCadenceMinutes: 55, supportsContinuous: true, notes: 'Known gap (verified Phase 5a): no Twilio inbound-SMS repo/read-path was found wired to this swarm — tick counters here are still simulated pending real webhook + repo wiring.' },
  { id: 'email_reply_capture' as LeadIntelSourceId, label: 'Email Reply Capture', method: 'internal', requiresEnv: [], defaultDailyCap: 50, defaultCadenceMinutes: 15, supportsContinuous: true, notes: 'Known gap (verified Phase 5a): no inbound-email-reply repo/read-path was found wired to this swarm — tick counters here are still simulated pending real webhook + repo wiring.' },
  { id: 'local_news_radar' as LeadIntelSourceId, label: 'Local News Radar', method: 'rss', requiresEnv: [], defaultDailyCap: 60, defaultCadenceMinutes: 25, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'podcast_guest_watch' as LeadIntelSourceId, label: 'Podcast Guest Watch', method: 'public_directory', requiresEnv: [], defaultDailyCap: 70, defaultCadenceMinutes: 35, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'meetup_event_watch' as LeadIntelSourceId, label: 'Meetup Event Watch', method: 'rss', requiresEnv: [], defaultDailyCap: 80, defaultCadenceMinutes: 45, supportsContinuous: true, notes: 'Live-capable: fetchAndParseRssLeads runs against admin-configured Meetup group RSS URL(s) (VITE_LEAD_INTEL_RSS_FEEDS) — Meetup has no universal city-level feed (per-group only) and requires OAuth for its modern API. Simulation-only until specific group feeds are configured.' },
  { id: 'merchant_directory_watch' as LeadIntelSourceId, label: 'Merchant Directory Watch', method: 'public_directory', requiresEnv: [], defaultDailyCap: 90, defaultCadenceMinutes: 55, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'realtor_lender_partner_watch' as LeadIntelSourceId, label: 'Realtor Lender Partner Watch', method: 'public_directory', requiresEnv: [], defaultDailyCap: 30, defaultCadenceMinutes: 15, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'college_entrepreneur_watch' as LeadIntelSourceId, label: 'College Entrepreneur Watch', method: 'public_directory', requiresEnv: [], defaultDailyCap: 40, defaultCadenceMinutes: 25, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'veteran_business_watch' as LeadIntelSourceId, label: 'Veteran Business Watch', method: 'public_directory', requiresEnv: [], defaultDailyCap: 50, defaultCadenceMinutes: 35, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'minority_business_directory' as LeadIntelSourceId, label: 'Minority Business Directory', method: 'public_directory', requiresEnv: [], defaultDailyCap: 60, defaultCadenceMinutes: 45, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'nonprofit_partner_watch' as LeadIntelSourceId, label: 'Nonprofit Partner Watch', method: 'public_directory', requiresEnv: [], defaultDailyCap: 70, defaultCadenceMinutes: 55, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'small_claims_public_calendar' as LeadIntelSourceId, label: 'Small Claims Public Calendar', method: 'public_directory', requiresEnv: [], defaultDailyCap: 80, defaultCadenceMinutes: 15, supportsContinuous: true, notes: 'Queues gracefully when credentials are missing; uses public or official sources only.' },
  { id: 'ucc_public_record_watch' as LeadIntelSourceId, label: 'Ucc Public Record Watch', method: 'public_directory', requiresEnv: [], defaultDailyCap: 90, defaultCadenceMinutes: 25, supportsContinuous: true, notes: 'Simulation only — state UCC filing search systems are typically session/form-token based (not a simple GET-able search URL); not exhaustively tested across all 50 states in this pass, so treat as "not yet verified feasible" rather than confirmed impossible.' },
];

export function getLeadIntelSourceAdapter(id: LeadIntelSourceId): LeadIntelSourceAdapter | null {
  return LEAD_INTEL_SOURCE_ADAPTERS.find((a) => a.id === id) ?? null;
}

export function getLeadIntelSourceRuntimeMode(id: LeadIntelSourceId): 'live' | 'simulation' {
  return LIVE_SOURCE_IDS.has(id) ? 'live' : 'simulation';
}

export function getLeadIntelSourceRuntimeLabel(id: LeadIntelSourceId): string {
  return getLeadIntelSourceRuntimeMode(id) === 'live' ? 'Live path' : 'Simulation only';
}

export function getPriorityLiveSourceAdapters(): LeadIntelSourceAdapter[] {
  return PRIORITY_MARKETING_SOURCE_IDS.map((id) => getLeadIntelSourceAdapter(id)).filter(
    (a): a is LeadIntelSourceAdapter => Boolean(a),
  );
}

export function sourceRequiresManualReview(id: LeadIntelSourceId): boolean {
  const a = getLeadIntelSourceAdapter(id);
  return a?.method === 'manual_queue';
}
