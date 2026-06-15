import type { ProspectTarget } from '../../domain/crmProspects';

export type IntelResult = {
  title: string;
  url: string;
  snippet: string;
  position: number | null;
  domain: string;
  robotsOk: boolean;
  emails: string[];
  phones: string[];
  meta?: { description?: string; h1?: string };
  score: number;
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
];

export const STAGING_COLUMNS: Array<{ id: StagingLane; label: string; hint: string; accent: 'sky' | 'violet' | 'emerald' | 'fuchsia' }> = [
  { id: 'review', label: 'Review', hint: 'Needs manual scan', accent: 'sky' },
  { id: 'qualified', label: 'Qualified', hint: 'Good fit signals', accent: 'violet' },
  { id: 'ready', label: 'Ready to CRM', hint: 'Import queue', accent: 'emerald' },
  { id: 'pass', label: 'Pass', hint: 'Low fit / blocked', accent: 'fuchsia' },
];

export function clampIntelLimit(n: number) {
  return Math.max(1, Math.min(20, Math.round(n)));
}

export function defaultStagingLane(r: IntelResult): StagingLane {
  const contacts = (r.emails?.length ?? 0) + (r.phones?.length ?? 0);
  if (!r.robotsOk || (r.score ?? 0) < 15) return 'pass';
  if ((r.score ?? 0) >= 55 && contacts > 0) return 'ready';
  if ((r.score ?? 0) >= 40) return 'qualified';
  return 'review';
}

export function buildStagingMap(results: IntelResult[]): Record<string, StagingLane> {
  const map: Record<string, StagingLane> = {};
  for (const r of results) map[r.url] = defaultStagingLane(r);
  return map;
}
