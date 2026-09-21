/**
 * Plain-language Find asks.
 * "BHPH near me" keeps the niche and uses browser/stored geo.
 * "tax pros South Florida" / "in Miami" / "near Tampa" pull a place out of the sentence.
 */
import type { LeadEngineLane } from '../leadIntel/leadEngineAutonomy';

export type MarketingFindFallbackMetro = {
  id: string;
  label: string;
  location: string;
};

/** Shown when the browser will not share a location. */
export const MARKETING_FIND_FALLBACK_METROS: MarketingFindFallbackMetro[] = [
  { id: 'miami', label: 'Miami', location: 'Miami, FL' },
  { id: 'broward', label: 'Broward', location: 'Broward, FL' },
  { id: 'palm-beach', label: 'Palm Beach', location: 'Palm Beach, FL' },
  { id: 'orlando', label: 'Orlando', location: 'Orlando, FL' },
  { id: 'atlanta', label: 'Atlanta', location: 'Atlanta, GA' },
  { id: 'tampa', label: 'Tampa', location: 'Tampa, FL' },
];

const PLACE_ALIASES: Array<{ re: RegExp; location: string }> = [
  { re: /\bfort\s+lauderdale\b/i, location: 'Fort Lauderdale, FL' },
  { re: /\bpalm\s+beach\b/i, location: 'Palm Beach, FL' },
  { re: /\bsouth\s+florida\b/i, location: 'South Florida, FL' },
  { re: /\bbroward\b/i, location: 'Broward, FL' },
  { re: /\bmiami\b/i, location: 'Miami, FL' },
  { re: /\borlando\b/i, location: 'Orlando, FL' },
  { re: /\btampa\b/i, location: 'Tampa, FL' },
  { re: /\bjax\b|\bjacksonville\b/i, location: 'Jacksonville, FL' },
  { re: /\batlanta\b/i, location: 'Atlanta, GA' },
  { re: /\bnew\s+york\b|\bnyc\b/i, location: 'New York, NY' },
  { re: /\blos\s+angeles\b/i, location: 'Los Angeles, CA' },
  { re: /\bdallas\b/i, location: 'Dallas, TX' },
  { re: /\bhouston\b/i, location: 'Houston, TX' },
  { re: /\bchicago\b/i, location: 'Chicago, IL' },
];

const LANE_RULES: Array<{ re: RegExp; lane: LeadEngineLane }> = [
  { re: /\b(bhph|buy[\s-]*here[\s-]*pay[\s-]*here|car\s+lot|auto\s+dealer|dealership)\b/i, lane: 'local_service' },
  { re: /\b(tax\s*pros?|cpa|accountant|bookkeep\w*|tax\s+prepar\w*|enrolled\s+agent)\b/i, lane: 'local_service' },
  { re: /\b(credit\s+repair|credit\s+dispute|dispute[sd]?)\b/i, lane: 'credit_restore' },
  { re: /\b(debt|collection|charge[\s-]?off|validation\s+letter)\b/i, lane: 'debt' },
  { re: /\b(affiliate|partner\s+program)\b/i, lane: 'agency_affiliates' },
  { re: /\b(business\s+credit|funding|fund(ed|ing)?|llc|ein)\b/i, lane: 'business_credit' },
];

const NEAR_ME_RE = /\b(?:near|around|by)\s+me\b|\bnearby\b|\bclose\s+to\s+me\b/gi;
const PREP_PLACE_RE =
  /\b(?:in|near|around|outside|across|throughout)\s+([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3})/i;

export type ParsedMarketingFindAsk = {
  raw: string;
  /** Search words with place and "near me" removed. */
  nicheQuery: string;
  /** Place named in the ask. Absent for "near me" and city-less asks. */
  location?: string;
  nearMe: boolean;
  lane?: LeadEngineLane;
};

function cleanupNiche(text: string): string {
  return text
    .replace(NEAR_ME_RE, ' ')
    .replace(PREP_PLACE_RE, ' ')
    .replace(/\b(?:in|near|around|outside|across|throughout)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();
}

function titlePlace(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}

export function parseMarketingFindAsk(raw: string): ParsedMarketingFindAsk {
  const text = (raw || '').replace(/\s+/g, ' ').trim();
  const nearMe = NEAR_ME_RE.test(text);
  NEAR_ME_RE.lastIndex = 0;

  let location: string | undefined;
  for (const alias of PLACE_ALIASES) {
    if (alias.re.test(text)) {
      location = alias.location;
      break;
    }
  }

  if (!location) {
    const prep = text.match(PREP_PLACE_RE);
    const captured = prep?.[1]?.trim();
    if (captured && !/^me$/i.test(captured)) {
      location = titlePlace(captured);
    }
  }

  let nicheQuery = text;
  if (location) {
    const alias = PLACE_ALIASES.find((row) => row.location === location);
    if (alias) nicheQuery = nicheQuery.replace(alias.re, ' ');
  }
  nicheQuery = cleanupNiche(nicheQuery);

  const lane = LANE_RULES.find((rule) => rule.re.test(text))?.lane;

  return {
    raw: text,
    nicheQuery,
    location,
    nearMe,
    lane,
  };
}

export function marketingFindAskPlaceholder(): string {
  return 'BHPH near me, tax pros South Florida';
}
