export type MarketingDeskTab = 'desk';

export type MarketingDeskHelperId = 'find' | 'draft' | 'qualify';

export type PartnerVerticalId =
  | 'bhph'
  | 'tax'
  | 'realtor'
  | 'mortgage'
  | 'church'
  | 'haitian'
  | 'general';

export const DEFAULT_RADIUS_MI = 25;

export type DeskHelperDef = {
  id: MarketingDeskHelperId;
  label: string;
  tagline: string;
  placeholder: string;
  exampleChips: string[];
};

export const DESK_HELPERS: DeskHelperDef[] = [
  {
    id: 'find',
    label: 'Find',
    tagline: 'Local partners & POIs — OSM / Overpass first, no API key.',
    placeholder: 'BHPH partners near me, tax pros South Florida, churches in Little Haiti…',
    exampleChips: ['BHPH dealers near me', 'tax pros in Broward', 'churches near Little Haiti'],
  },
  {
    id: 'draft',
    label: 'Draft',
    tagline: 'One ask → partner outreach snippet (manual send only).',
    placeholder: 'Warm intro to a BHPH owner after lot tour…',
    exampleChips: ['Intro email after tax season consult', 'SMS for realtor open house partner'],
  },
  {
    id: 'qualify',
    label: 'Qualify',
    tagline: 'Quick fit checklist from a plain-language description.',
    placeholder: 'Multi-location BHPH group, wants co-marketing, no delete promises…',
    exampleChips: ['Church credit workshop host', 'Immigration-adjacent tax prep shop'],
  },
];

export function helperFromParam(raw: string | null): MarketingDeskHelperId {
  const id = (raw ?? 'find').toLowerCase();
  if (id === 'draft' || id === 'qualify' || id === 'find') return id;
  return 'find';
}

export type OsmVerticalSpec = {
  vertical: PartnerVerticalId;
  overpassFilter: string;
  nominatimBias: string;
};

const VERTICAL_RULES: { match: RegExp; spec: OsmVerticalSpec }[] = [
  {
    match: /\b(bhph|buy here pay here|auto dealer|car lot|second.?chance)\b/i,
    spec: { vertical: 'bhph', overpassFilter: '["shop"="car"]', nominatimBias: 'car dealership' },
  },
  {
    match: /\b(tax|cpa|accountant|enrolled agent|bookkeep)\b/i,
    spec: { vertical: 'tax', overpassFilter: '["office"="accountant"]', nominatimBias: 'tax preparation' },
  },
  {
    match: /\b(realtor|real estate|broker|mls)\b/i,
    spec: { vertical: 'realtor', overpassFilter: '["office"="estate_agent"]', nominatimBias: 'real estate agency' },
  },
  {
    match: /\b(mortgage|lender|loan officer|mlo)\b/i,
    spec: { vertical: 'mortgage', overpassFilter: '["office"="financial"]', nominatimBias: 'mortgage broker' },
  },
  {
    match: /\b(church|ministry|pastor|congregation|worship)\b/i,
    spec: { vertical: 'church', overpassFilter: '["amenity"="place_of_worship"]', nominatimBias: 'church' },
  },
  {
    match: /\b(haitian|kreyol|creole|immigration|notary)\b/i,
    spec: { vertical: 'haitian', overpassFilter: '["office"="notary"]', nominatimBias: 'immigration services' },
  },
];

export function detectVertical(query: string): OsmVerticalSpec {
  for (const rule of VERTICAL_RULES) {
    if (rule.match.test(query)) return rule.spec;
  }
  return {
    vertical: 'general',
    overpassFilter: '',
    nominatimBias: 'business',
  };
}

export function milesToMeters(mi: number) {
  return Math.round(mi * 1609.34);
}
