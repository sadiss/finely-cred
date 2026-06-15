import type { ProspectTarget } from '../../domain/crmProspects';

export type LeadIntelSourceId =
  | 'google_web'
  | 'linkedin_b2b'
  | 'meta_leads'
  | 'local_business'
  | 'csv_urls'
  | 'referral_network'
  | 'social_signals';

export type LeadIntelSource = {
  id: LeadIntelSourceId;
  label: string;
  description: string;
  icon: string;
  defaultTarget: ProspectTarget;
  queryTemplate: string;
  locationDefault?: string;
  enrichDefault?: boolean;
  complianceNote?: string;
};

export const LEAD_INTEL_SOURCES: LeadIntelSource[] = [
  {
    id: 'google_web',
    label: 'Google / Web search',
    description: 'Serper-powered web discovery with page enrichment.',
    icon: '🌐',
    defaultTarget: 'clients',
    queryTemplate: 'credit repair help consultation',
    locationDefault: 'United States',
    enrichDefault: true,
  },
  {
    id: 'linkedin_b2b',
    label: 'LinkedIn-style B2B',
    description: 'Agents, affiliates, AU sellers, and specialist partners.',
    icon: '💼',
    defaultTarget: 'agents',
    queryTemplate: 'credit repair sales agent remote opportunity',
    locationDefault: 'United States',
  },
  {
    id: 'meta_leads',
    label: 'Meta Lead Ads',
    description: 'Ingest from Facebook/Instagram lead forms (requires OAuth).',
    icon: '📱',
    defaultTarget: 'clients',
    queryTemplate: 'free credit guide lead',
    complianceNote: 'Connect Meta in Admin → Social Hub or Settings.',
  },
  {
    id: 'local_business',
    label: 'Local businesses',
    description: 'Geo + NAICS-style local business discovery.',
    icon: '📍',
    defaultTarget: 'b2b_partners',
    queryTemplate: 'auto dealer business credit partner program',
    locationDefault: 'United States',
  },
  {
    id: 'csv_urls',
    label: 'CSV / URL list',
    description: 'Paste URLs or upload a list for bulk enrichment.',
    icon: '📋',
    defaultTarget: 'clients',
    queryTemplate: '',
    enrichDefault: true,
    complianceNote: 'Paste one URL per line in the query field for now.',
  },
  {
    id: 'referral_network',
    label: 'Referral / affiliate network',
    description: 'Warm intros from existing partner network patterns.',
    icon: '🤝',
    defaultTarget: 'affiliates',
    queryTemplate: 'credit repair affiliate program partners',
    locationDefault: 'United States',
  },
  {
    id: 'social_signals',
    label: 'Social public signals',
    description: 'Keyword monitoring templates (compliance-safe).',
    icon: '📣',
    defaultTarget: 'clients',
    queryTemplate: 'need help fixing my credit score',
    complianceNote: 'Use publicly available signals only.',
  },
];

export function getLeadIntelSource(id: LeadIntelSourceId): LeadIntelSource | undefined {
  return LEAD_INTEL_SOURCES.find((s) => s.id === id);
}

/** AI-style query refinement suggestions before running search. */
export function suggestQueryRefinements(source: LeadIntelSource, baseQuery: string): string[] {
  const q = baseQuery.trim() || source.queryTemplate;
  const refinements = [
    `${q} consultation`,
    `${q} near me`,
    `${q} reviews`,
  ];
  if (source.defaultTarget === 'agents') refinements.push(`${q} commission remote`);
  if (source.defaultTarget === 'au_sellers') refinements.push(`${q} authorized user tradelines`);
  if (source.defaultTarget === 'affiliates') refinements.push(`${q} referral program`);
  return refinements.slice(0, 4);
}
