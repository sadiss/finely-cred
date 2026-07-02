import type { LeadEngineCity, LeadEngineFunnel, LeadEngineSourcePlan } from './types';

export const DEFAULT_LEAD_ENGINE_CITIES: LeadEngineCity[] = [
  { id: 'dallas-tx', label: 'Dallas', state: 'TX', timezone: 'America/Chicago', priority: 100, zipFocus: ['75201', '75204', '75205', '75206', '75219'], offers: ['business_credit_eguide', 'funding_readiness_guide', 'credit_specialist_recruiting', 'agency_partner_recruiting'] },
  { id: 'houston-tx', label: 'Houston', state: 'TX', timezone: 'America/Chicago', priority: 96, zipFocus: ['77002', '77004', '77006', '77019', '77027'], offers: ['business_credit_eguide', 'tradeline_guide', 'au_seller_recruiting', 'affiliate_partner_recruiting'] },
  { id: 'atlanta-ga', label: 'Atlanta', state: 'GA', timezone: 'America/New_York', priority: 94, zipFocus: ['30303', '30305', '30308', '30309', '30318'], offers: ['personal_credit_repair_guide', 'business_credit_eguide', 'credit_specialist_recruiting'] },
  { id: 'phoenix-az', label: 'Phoenix', state: 'AZ', timezone: 'America/Phoenix', priority: 90, zipFocus: ['85003', '85004', '85012', '85016', '85018'], offers: ['funding_readiness_guide', 'business_credit_eguide', 'agency_partner_recruiting'] },
  { id: 'charlotte-nc', label: 'Charlotte', state: 'NC', timezone: 'America/New_York', priority: 88, zipFocus: ['28202', '28203', '28204', '28205', '28209'], offers: ['business_credit_eguide', 'funding_readiness_guide', 'affiliate_partner_recruiting'] },
  { id: 'miami-fl', label: 'Miami', state: 'FL', timezone: 'America/New_York', priority: 86, zipFocus: ['33130', '33131', '33132', '33137', '33139'], offers: ['tradeline_guide', 'personal_credit_repair_guide', 'au_seller_recruiting'] },
  { id: 'orlando-fl', label: 'Orlando', state: 'FL', timezone: 'America/New_York', priority: 82, zipFocus: ['32801', '32803', '32804', '32805', '32806'], offers: ['business_credit_eguide', 'credit_specialist_recruiting'] },
  { id: 'tampa-fl', label: 'Tampa', state: 'FL', timezone: 'America/New_York', priority: 80, zipFocus: ['33602', '33605', '33606', '33607', '33609'], offers: ['funding_readiness_guide', 'agency_partner_recruiting'] },
  { id: 'new-york-ny', label: 'New York', state: 'NY', timezone: 'America/New_York', priority: 78, zipFocus: ['10001', '10002', '10003', '10011', '11201'], offers: ['press_authority', 'event_webinar', 'affiliate_partner_recruiting'] },
  { id: 'los-angeles-ca', label: 'Los Angeles', state: 'CA', timezone: 'America/Los_Angeles', priority: 76, zipFocus: ['90012', '90015', '90017', '90028', '90036'], offers: ['press_authority', 'personal_credit_repair_guide', 'tradeline_guide'] },
  { id: 'chicago-il', label: 'Chicago', state: 'IL', timezone: 'America/Chicago', priority: 74, zipFocus: ['60601', '60605', '60607', '60611', '60614'], offers: ['business_credit_eguide', 'event_webinar'] },
  { id: 'detroit-mi', label: 'Detroit', state: 'MI', timezone: 'America/Detroit', priority: 72, zipFocus: ['48201', '48202', '48207', '48226', '48243'], offers: ['personal_credit_repair_guide', 'credit_specialist_recruiting'] },
  { id: 'philadelphia-pa', label: 'Philadelphia', state: 'PA', timezone: 'America/New_York', priority: 70, zipFocus: ['19102', '19103', '19104', '19106', '19107'], offers: ['business_credit_eguide', 'funding_readiness_guide'] },
  { id: 'washington-dc', label: 'Washington', state: 'DC', timezone: 'America/New_York', priority: 68, zipFocus: ['20001', '20002', '20003', '20005', '20009'], offers: ['press_authority', 'agency_partner_recruiting'] },
  { id: 'baltimore-md', label: 'Baltimore', state: 'MD', timezone: 'America/New_York', priority: 66, zipFocus: ['21201', '21202', '21205', '21210', '21218'], offers: ['personal_credit_repair_guide', 'affiliate_partner_recruiting'] },
  { id: 'las-vegas-nv', label: 'Las Vegas', state: 'NV', timezone: 'America/Los_Angeles', priority: 64, zipFocus: ['89101', '89102', '89104', '89109', '89119'], offers: ['business_credit_eguide', 'tradeline_guide'] },
  { id: 'san-antonio-tx', label: 'San Antonio', state: 'TX', timezone: 'America/Chicago', priority: 62, zipFocus: ['78205', '78209', '78212', '78215', '78229'], offers: ['business_credit_eguide', 'personal_credit_repair_guide'] },
  { id: 'austin-tx', label: 'Austin', state: 'TX', timezone: 'America/Chicago', priority: 60, zipFocus: ['78701', '78702', '78703', '78704', '78705'], offers: ['funding_readiness_guide', 'agency_partner_recruiting'] },
  { id: 'memphis-tn', label: 'Memphis', state: 'TN', timezone: 'America/Chicago', priority: 58, zipFocus: ['38103', '38104', '38105', '38111', '38117'], offers: ['credit_specialist_recruiting', 'personal_credit_repair_guide'] },
  { id: 'nashville-tn', label: 'Nashville', state: 'TN', timezone: 'America/Chicago', priority: 56, zipFocus: ['37201', '37203', '37204', '37206', '37208'], offers: ['business_credit_eguide', 'affiliate_partner_recruiting'] },
];

export const LEAD_ENGINE_SOURCE_PLANS: LeadEngineSourcePlan[] = [
  { id: 'serper_web', label: 'Serper Web Intent Search', enabledByDefault: true, requiresApiKey: 'SERPER_API_KEY', officialOnly: true, dailyBudgetCents: 160, maxJobsPerHour: 30, maxResultsPerJob: 10, routingHint: ['business_credit_eguide', 'personal_credit_repair_guide', 'funding_readiness_guide'], complianceNote: 'Search API only. No restricted platform scraping.' },
  { id: 'serper_news', label: 'Local News Radar', enabledByDefault: true, requiresApiKey: 'SERPER_API_KEY', officialOnly: true, dailyBudgetCents: 40, maxJobsPerHour: 12, maxResultsPerJob: 8, routingHint: ['press_authority', 'event_webinar'], complianceNote: 'Uses news search for public local business angles.' },
  { id: 'serper_places', label: 'Places and Local Business Finder', enabledByDefault: true, requiresApiKey: 'SERPER_API_KEY', officialOnly: true, dailyBudgetCents: 80, maxJobsPerHour: 18, maxResultsPerJob: 10, routingHint: ['business_credit_eguide', 'funding_readiness_guide', 'agency_partner_recruiting'], complianceNote: 'API-backed places discovery. Review before outreach.' },
  { id: 'reddit_geo', label: 'Reddit City Intent Watch', enabledByDefault: false, requiresApiKey: 'REDDIT_CLIENT_ID', officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 8, maxResultsPerJob: 15, routingHint: ['personal_credit_repair_guide', 'funding_readiness_guide'], complianceNote: 'Official API only. Draft helpful public replies; never spam communities.' },
  { id: 'youtube_comments', label: 'YouTube Comment Watch', enabledByDefault: false, requiresApiKey: 'YOUTUBE_API_KEY', officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 6, maxResultsPerJob: 20, routingHint: ['personal_credit_repair_guide', 'business_credit_eguide'], complianceNote: 'Official API. Draft replies for approval.' },
  { id: 'tiktok_hashtag_watch', label: 'TikTok Hashtag Watch', enabledByDefault: false, requiresApiKey: 'TIKTOK_ACCESS_TOKEN', officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 4, maxResultsPerJob: 12, routingHint: ['credit_specialist_recruiting', 'affiliate_partner_recruiting'], complianceNote: 'Official/OAuth only. Manual approval for replies.' },
  { id: 'instagram_geo_hashtags', label: 'Instagram Geo Hashtag Watch', enabledByDefault: false, requiresApiKey: 'META_ACCESS_TOKEN', officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 4, maxResultsPerJob: 12, routingHint: ['tradeline_guide', 'personal_credit_repair_guide'], complianceNote: 'Meta Graph/OAuth only.' },
  { id: 'linkedin_search', label: 'LinkedIn B2B Partner Search', enabledByDefault: false, requiresApiKey: 'LINKEDIN_ACCESS_TOKEN', officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 4, maxResultsPerJob: 12, routingHint: ['agency_partner_recruiting', 'affiliate_partner_recruiting', 'funding_readiness_guide'], complianceNote: 'Official/OAuth only; no automated unsolicited messaging.' },
  { id: 'x_search', label: 'X Intent Watch', enabledByDefault: false, requiresApiKey: 'X_BEARER_TOKEN', officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 4, maxResultsPerJob: 12, routingHint: ['business_credit_eguide', 'personal_credit_repair_guide'], complianceNote: 'Official API only.' },
  { id: 'quora_credit', label: 'Quora Question Watch', enabledByDefault: false, officialOnly: false, dailyBudgetCents: 0, maxJobsPerHour: 2, maxResultsPerJob: 8, routingHint: ['personal_credit_repair_guide', 'business_credit_eguide'], complianceNote: 'Public pages only; manual answer drafting.' },
  { id: 'bbb_complaints', label: 'BBB Complaint Pattern Watch', enabledByDefault: true, officialOnly: false, dailyBudgetCents: 0, maxJobsPerHour: 4, maxResultsPerJob: 10, routingHint: ['business_credit_eguide', 'funding_readiness_guide'], complianceNote: 'Public pages only; no deceptive competitor targeting.' },
  { id: 'chamber_directory', label: 'Chamber Directory Partner Scout', enabledByDefault: true, officialOnly: false, dailyBudgetCents: 0, maxJobsPerHour: 6, maxResultsPerJob: 15, routingHint: ['agency_partner_recruiting', 'affiliate_partner_recruiting'], complianceNote: 'Directory-level public business data; respectful rate limits.' },
  { id: 'local_event_calendar', label: 'Local Event Calendar Watch', enabledByDefault: true, officialOnly: false, dailyBudgetCents: 0, maxJobsPerHour: 6, maxResultsPerJob: 10, routingHint: ['event_webinar', 'press_authority'], complianceNote: 'RSS/ICS/public calendar sources where allowed.' },
  { id: 'google_alerts', label: 'Google Alerts RSS Ingest', enabledByDefault: true, officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 6, maxResultsPerJob: 10, routingHint: ['press_authority', 'business_credit_eguide'], complianceNote: 'RSS ingest from configured alert feeds.' },
  { id: 'review_sites', label: 'Review Site Sentiment Watch', enabledByDefault: true, officialOnly: false, dailyBudgetCents: 0, maxJobsPerHour: 4, maxResultsPerJob: 10, routingHint: ['business_credit_eguide', 'personal_credit_repair_guide'], complianceNote: 'Public review pages only, no fake engagement.' },
  { id: 'csv_seed_expansion', label: 'CSV Seed Expansion', enabledByDefault: true, officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 10, maxResultsPerJob: 20, routingHint: ['business_credit_eguide', 'agency_partner_recruiting'], complianceNote: 'First-party/admin-provided seeds only.' },
  { id: 'dead_lead_revival', label: 'Dead Lead Revival Scan', enabledByDefault: true, officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 10, maxResultsPerJob: 25, routingHint: ['consultation_booking', 'event_webinar'], complianceNote: 'Requires consent before any SMS/email send.' },
  { id: 'affiliate_referral_loop', label: 'Affiliate Referral Loop', enabledByDefault: true, officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 8, maxResultsPerJob: 20, routingHint: ['affiliate_partner_recruiting'], complianceNote: 'Internal/owned partner program data.' },
  { id: 'seo_inbound_forms', label: 'SEO Inbound Form Attribution', enabledByDefault: true, officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 12, maxResultsPerJob: 30, routingHint: ['business_credit_eguide', 'tradeline_guide', 'personal_credit_repair_guide'], complianceNote: 'First-party site analytics and forms.' },
  { id: 'sms_reply_capture', label: 'SMS Reply Capture', enabledByDefault: true, requiresApiKey: 'TWILIO_AUTH_TOKEN', officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 20, maxResultsPerJob: 30, routingHint: ['consultation_booking'], complianceNote: 'Only inbound replies and consented conversations.' },
  { id: 'email_reply_capture', label: 'Email Reply Capture', enabledByDefault: true, requiresApiKey: 'RESEND_API_KEY', officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 20, maxResultsPerJob: 30, routingHint: ['consultation_booking'], complianceNote: 'Inbound/reply processing only.' },
  { id: 'manual_community_queue', label: 'Manual Community Reply Queue', enabledByDefault: true, officialOnly: true, dailyBudgetCents: 0, maxJobsPerHour: 6, maxResultsPerJob: 15, routingHint: ['personal_credit_repair_guide', 'business_credit_eguide'], complianceNote: 'Creates drafts and links for human-approved community conversations.' },
];

export const FUNNEL_LABELS: Record<LeadEngineFunnel, string> = {
  business_credit_eguide: 'Business Credit E-Guide',
  tradeline_guide: 'Tradeline Guide',
  personal_credit_repair_guide: 'Personal Credit Repair Guide',
  funding_readiness_guide: 'Funding Readiness Guide',
  credit_specialist_recruiting: 'Credit Specialist Recruiting',
  agency_partner_recruiting: 'Agency Partner Recruiting',
  affiliate_partner_recruiting: 'Affiliate Partner Recruiting',
  au_seller_recruiting: 'AU Seller Recruiting',
  consultation_booking: 'Consultation Booking',
  event_webinar: 'Event/Webinar',
  press_authority: 'Press/Authority',
  book_course_buyer: 'Book/Course Buyer',
};

export function findCity(cityId: string) {
  return DEFAULT_LEAD_ENGINE_CITIES.find((c) => c.id === cityId) ?? DEFAULT_LEAD_ENGINE_CITIES[0];
}

export function findSource(sourceId: string) {
  return LEAD_ENGINE_SOURCE_PLANS.find((s) => s.id === sourceId) ?? LEAD_ENGINE_SOURCE_PLANS[0];
}
