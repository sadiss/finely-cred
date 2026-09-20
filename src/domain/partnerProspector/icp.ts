import type { PartnerVertical, ProspectorSearchQuery } from './types.ts';

export type MetroPack = {
  id: string;
  label: string;
  cities: string[];
  /** Serper / search location string */
  location: string;
  corridor: 'sfl' | 'other';
};

export const SFL_METROS: MetroPack[] = [
  {
    id: 'miami',
    label: 'Miami',
    cities: ['Miami', 'Little Haiti', 'Little Haiti / Miami'],
    location: 'Miami, Florida, United States',
    corridor: 'sfl',
  },
  {
    id: 'north_miami',
    label: 'North Miami',
    cities: ['North Miami', 'North Miami Beach'],
    location: 'North Miami, Florida, United States',
    corridor: 'sfl',
  },
  {
    id: 'miami_gardens',
    label: 'Miami Gardens',
    cities: ['Miami Gardens', 'Opa-locka'],
    location: 'Miami Gardens, Florida, United States',
    corridor: 'sfl',
  },
  {
    id: 'hollywood',
    label: 'Hollywood',
    cities: ['Hollywood'],
    location: 'Hollywood, Florida, United States',
    corridor: 'sfl',
  },
  {
    id: 'fort_lauderdale',
    label: 'Fort Lauderdale',
    cities: ['Fort Lauderdale', 'Lauderhill', 'Plantation'],
    location: 'Fort Lauderdale, Florida, United States',
    corridor: 'sfl',
  },
  {
    id: 'miramar',
    label: 'Miramar / Pembroke Pines',
    cities: ['Miramar', 'Pembroke Pines'],
    location: 'Miramar, Florida, United States',
    corridor: 'sfl',
  },
  {
    id: 'homestead',
    label: 'Homestead / Kendall',
    cities: ['Homestead', 'Florida City', 'Kendall', 'Cutler Bay'],
    location: 'Homestead, Florida, United States',
    corridor: 'sfl',
  },
  {
    id: 'west_palm',
    label: 'West Palm / Delray',
    cities: ['West Palm Beach', 'Lake Worth', 'Delray Beach', 'Boynton Beach'],
    location: 'West Palm Beach, Florida, United States',
    corridor: 'sfl',
  },
];

export const DEFAULT_METRO_IDS = SFL_METROS.map((m) => m.id);

export const VERTICAL_LABELS: Record<PartnerVertical, string> = {
  tax: 'tax / accounting',
  bhph: 'BHPH / used-car',
  realtor: 'realtor',
  mortgage: 'mortgage / loan officer',
  immigration: 'immigration / notary / multiservice',
  community: 'community desk',
};

export const VERTICAL_SEARCH_TEMPLATES: Record<PartnerVertical, string[]> = {
  tax: [
    'CPA tax preparer {city} FL',
    'Haitian tax accountant {city} Florida',
    'income tax office {city} FL -credit -repair',
  ],
  bhph: [
    'buy here pay here dealer {city} FL',
    'in house financing used cars {city} Florida',
    'BHPH auto dealer {city} FL',
  ],
  realtor: [
    'real estate agent {city} FL',
    'realtor office {city} Florida Haitian',
    'residential realtor {city} FL -credit -repair',
  ],
  mortgage: [
    'mortgage broker {city} FL',
    'loan officer {city} Florida',
    'mortgage lender {city} FL -hard -money',
  ],
  immigration: [
    'immigration attorney {city} FL',
    'notary immigration multiservice {city} Florida',
    'Haitian immigration notary {city} FL',
  ],
  community: [
    'Haitian money transfer {city} FL',
    'cam transfer money gram {city} Florida',
    'community multiservice desk {city} FL',
  ],
};

export function metroById(id: string): MetroPack | undefined {
  return SFL_METROS.find((m) => m.id === id);
}

export function resolveMetros(ids?: string[]): MetroPack[] {
  const wanted = (ids ?? DEFAULT_METRO_IDS).map((x) => x.trim().toLowerCase()).filter(Boolean);
  const found = SFL_METROS.filter((m) => wanted.includes(m.id));
  return found.length ? found : SFL_METROS;
}

export function resolveVerticals(ids?: string[]): PartnerVertical[] {
  const allowed = new Set<string>(['tax', 'bhph', 'realtor', 'mortgage', 'immigration', 'community']);
  const wanted = (ids ?? []).map((x) => x.trim().toLowerCase()).filter((x) => allowed.has(x)) as PartnerVertical[];
  return wanted.length ? wanted : (['tax', 'bhph', 'realtor', 'mortgage', 'immigration'] as PartnerVertical[]);
}

export function buildSearchQueries(args?: { metros?: string[]; verticals?: PartnerVertical[] }): ProspectorSearchQuery[] {
  const metros = resolveMetros(args?.metros);
  const verticals = resolveVerticals(args?.verticals);
  const out: ProspectorSearchQuery[] = [];
  for (const vertical of verticals) {
    for (const metro of metros) {
      const city = metro.cities[0] ?? metro.label;
      for (const tmpl of VERTICAL_SEARCH_TEMPLATES[vertical]) {
        out.push({
          vertical,
          metro: metro.id,
          city,
          query: tmpl.replaceAll('{city}', city),
          location: metro.location,
        });
      }
    }
  }
  return out;
}

export function verticalFromCategory(category: string): PartnerVertical | null {
  const c = category.toLowerCase();
  if (c.includes('tax') || c.includes('account')) return 'tax';
  if (c.includes('bhph') || c.includes('used-car') || c.includes('dealer')) return 'bhph';
  if (c.includes('realtor') || c.includes('real estate')) return 'realtor';
  if (c.includes('mortgage') || c.includes('loan officer')) return 'mortgage';
  if (c.includes('immigration') || c.includes('notary') || c.includes('multiservice')) return 'immigration';
  if (c.includes('community') || c.includes('transfer') || c.includes('money')) return 'community';
  return null;
}
