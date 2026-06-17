import type { ProspectTarget } from '../../domain/crmProspects';

export type IntelSearchMode = 'web' | 'news' | 'places' | 'mixed';
export type IntentTier = 'hot' | 'warm' | 'cold' | 'unknown';

export type IntelAiAnalysis = {
  summary?: string;
  outreachHook?: string;
  outreachEmail?: string;
  objection?: string;
  nextStep?: string;
};

export type IntelResult = {
  title: string;
  url: string;
  snippet: string;
  position: number | null;
  domain: string;
  robotsOk: boolean;
  emails: string[];
  phones: string[];
  meta?: { description?: string; h1?: string; ogTitle?: string };
  score: number;
  signupIntent?: boolean;
  recommendedFunnel?: string;
  searchMode?: IntelSearchMode;
  industry?: string;
  intentTier?: IntentTier;
  keywords?: string[];
  socialLinks?: { linkedin?: string; facebook?: string; twitter?: string; instagram?: string };
  confidence?: number;
  aiAnalysis?: IntelAiAnalysis;
  newsDate?: string | null;
  place?: { address?: string; rating?: number | null; reviews?: number | null } | null;
};

export type LeadIntelView = 'discover' | 'staging' | 'library' | 'copilot';

export type StagingLane = 'review' | 'qualified' | 'ready' | 'pass';

export type LeadIntelTemplate = { label: string; target: ProspectTarget; query: string; location?: string };

export const LEAD_INTEL_TEMPLATES: LeadIntelTemplate[] = [
  {
    label: 'Clients • Business credit readiness (US)',
    target: 'clients',
    query: 'business credit help funding readiness consult',
    location: 'United States',
  },
  {
    label: 'Clients • Credit repair demand (US)',
    target: 'clients',
    query: 'fix my credit help credit repair consultation',
    location: 'United States',
  },
  {
    label: 'Clients • Free guide / signup intent',
    target: 'clients',
    query: 'free credit dispute letter guide download email',
    location: 'United States',
  },
  {
    label: 'Affiliates • Finance/credit affiliate program',
    target: 'affiliates',
    query: 'credit repair affiliate program partners',
    location: 'United States',
  },
  {
    label: 'Agents • Credit repair sales agent opportunity',
    target: 'agents',
    query: 'credit repair sales agent remote',
    location: 'United States',
  },
  {
    label: 'Teams • Marketing partners (B2B)',
    target: 'teams',
    query: 'credit repair marketing agency partner',
    location: 'United States',
  },
  {
    label: 'AU Sellers • Tradeline sellers / inventory',
    target: 'au_sellers',
    query: 'authorized user tradelines seller inventory',
    location: 'United States',
  },
  {
    label: 'B2B Partners • Business funding partners',
    target: 'b2b_partners',
    query: 'business funding partner program merchant referral',
    location: 'United States',
  },
  {
    label: 'Clients • Metro2 / bureau dispute help',
    target: 'clients',
    query: 'credit bureau dispute letter help inaccurate reporting',
    location: 'United States',
  },
  {
    label: 'Affiliates • Referral / co-marketing partners',
    target: 'affiliates',
    query: 'financial literacy affiliate referral partner program',
    location: 'United States',
  },
];

export const STAGING_COLUMNS: Array<{ id: StagingLane; label: string; hint: string; accent: 'sky' | 'violet' | 'emerald' | 'fuchsia' }> = [
  { id: 'review', label: 'Review', hint: 'Needs manual scan', accent: 'sky' },
  { id: 'qualified', label: 'Qualified', hint: 'Good fit signals', accent: 'violet' },
  { id: 'ready', label: 'Ready to CRM', hint: 'Import queue', accent: 'emerald' },
  { id: 'pass', label: 'Pass', hint: 'Low fit / blocked', accent: 'fuchsia' },
];

export function clampIntelLimit(n: number) {
  return Math.max(1, Math.min(50, Math.round(n)));
}

export function defaultStagingLane(r: IntelResult): StagingLane {
  const contacts = (r.emails?.length ?? 0) + (r.phones?.length ?? 0);
  if (!r.robotsOk || (r.score ?? 0) < 15) return 'pass';
  if (r.intentTier === 'hot' && contacts > 0) return 'ready';
  if ((r.score ?? 0) >= 50 && contacts > 0) return 'ready';
  if ((r.score ?? 0) >= 38 && contacts > 0) return 'qualified';
  if ((r.score ?? 0) >= 55 || r.intentTier === 'warm') return 'qualified';
  return 'review';
}

export function buildStagingMap(results: IntelResult[]): Record<string, StagingLane> {
  const map: Record<string, StagingLane> = {};
  for (const r of results) map[r.url] = defaultStagingLane(r);
  return map;
}
