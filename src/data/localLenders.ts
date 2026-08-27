import {
  geocodeAddress,
  lookupZip,
  searchFdicInstitutions,
  searchNcuaNearby,
  type FdicInstitution,
  type NcuaNearbyResult,
} from '../lib/publicDataClient';

export type LenderCategory = 'national' | 'credit_union' | 'local' | 'private' | 'fintech' | 'cdfi';

export type LenderMatchWhy = 'NCUA nearby' | 'FDIC in state' | 'curated preset';

/** Higher = better for credit stacking / high-limit relationship lanes. */
export type LimitBias = 'high' | 'mid' | 'low';

export type StackingTier = 'primary' | 'secondary' | 'national_low';

export type LenderPreset = {
  id: string;
  bank: string;
  product: string;
  projectedLimit: string;
  category: LenderCategory;
  relationshipFriendly?: boolean;
  noDocFriendly?: boolean;
  limitBias?: LimitBias;
  stackingTier?: StackingTier;
  color: string;
  accent: string;
};

export type LenderMatch = LenderPreset & { why: LenderMatchWhy; matchCity?: string };

/** Parse upper bound from projected limit string for ranking (e.g. "$25k - $250k" → 250000). */
export function parseProjectedLimitHigh(projectedLimit: string): number {
  const s = String(projectedLimit || '').toLowerCase();
  if (s.includes('no preset') || s.includes('no pre-set')) return 500_000;
  const nums = [...s.matchAll(/([\d.]+)\s*k?/g)].map((m) => {
    const n = Number(m[1]);
    if (!Number.isFinite(n)) return 0;
    return m[0].includes('k') || (n < 1000 && s.includes('k')) ? n * 1000 : n;
  });
  return nums.length ? Math.max(...nums) : 0;
}

export function stackingSortScore(p: LenderPreset): number {
  let score = parseProjectedLimitHigh(p.projectedLimit);
  if (p.stackingTier === 'primary') score += 50_000;
  else if (p.stackingTier === 'secondary') score += 20_000;
  else if (p.stackingTier === 'national_low') score -= 30_000;
  if (p.limitBias === 'high') score += 40_000;
  else if (p.limitBias === 'low') score -= 25_000;
  if (p.category === 'credit_union') score += 35_000;
  else if (p.category === 'local' || p.category === 'cdfi') score += 30_000;
  else if (p.category === 'private') score += 15_000;
  else if (p.category === 'fintech') score += 5_000;
  else if (p.category === 'national') score -= 5_000;
  if (p.relationshipFriendly) score += 10_000;
  return score;
}

/**
 * Curated credit-stacking list — credit unions, relationship local banks, and high-limit regionals first.
 * Big-box nationals with low business limits are de-prioritized (national_low).
 */
export const BASE_LENDER_PRESETS: LenderPreset[] = [
  {
    id: 'nf_flagship',
    bank: 'NAVY FEDERAL',
    product: 'Business / Flagship Rewards (relationship)',
    projectedLimit: '$25k - $100k+',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-indigo-900/40 to-slate-900/80',
    accent: 'text-indigo-400',
  },
  {
    id: 'penfed_biz',
    bank: 'PENTAGON FEDERAL (PENFED)',
    product: 'Business Rewards + LOC stack',
    projectedLimit: '$20k - $75k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-blue-900/30 to-slate-900/80',
    accent: 'text-blue-300',
  },
  {
    id: 'becu_biz',
    bank: 'BECU',
    product: 'Business Visa + member relationship LOC',
    projectedLimit: '$15k - $80k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-emerald-900/25 to-slate-900/80',
    accent: 'text-emerald-300',
  },
  {
    id: 'alliant_biz',
    bank: 'ALLIANT CREDIT UNION',
    product: 'Business Visa + deposits lane',
    projectedLimit: '$10k - $60k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-teal-900/25 to-slate-900/80',
    accent: 'text-teal-300',
  },
  {
    id: 'dfcu_biz',
    bank: 'DIGITAL FEDERAL (DCU)',
    product: 'Business card + unsecured LOC',
    projectedLimit: '$15k - $70k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-cyan-900/25 to-slate-900/80',
    accent: 'text-cyan-300',
  },
  {
    id: 'firsttech_biz',
    bank: 'FIRST TECH FEDERAL',
    product: 'Business Rewards + relationship review',
    projectedLimit: '$10k - $65k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-violet-900/25 to-slate-900/80',
    accent: 'text-violet-300',
  },
  {
    id: 'americafirst_biz',
    bank: 'AMERICA FIRST CU',
    product: 'Business Visa + LOC (deposits)',
    projectedLimit: '$10k - $55k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-orange-900/20 to-slate-900/80',
    accent: 'text-orange-300',
  },
  {
    id: 'schoolsfirst_biz',
    bank: 'SCHOOLSFIRST FEDERAL',
    product: 'Business card + member LOC',
    projectedLimit: '$10k - $50k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-rose-900/20 to-slate-900/80',
    accent: 'text-rose-300',
  },
  {
    id: 'golden1_biz',
    bank: 'GOLDEN 1 CREDIT UNION',
    product: 'Business Visa + relationship line',
    projectedLimit: '$10k - $45k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-amber-900/20 to-slate-900/80',
    accent: 'text-amber-300',
  },
  {
    id: 'suncoast_biz',
    bank: 'SUNCOAST CREDIT UNION',
    product: 'Business LOC / Visa (FL stack)',
    projectedLimit: '$10k - $50k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-lime-900/15 to-slate-900/80',
    accent: 'text-lime-300',
  },
  {
    id: 'rbfcu_biz',
    bank: 'RANDOLPH-BROOKS FCU',
    product: 'Business Visa + LOC (TX)',
    projectedLimit: '$10k - $60k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-red-900/15 to-slate-900/80',
    accent: 'text-red-300',
  },
  {
    id: 'usaa_biz',
    bank: 'USAA',
    product: 'Business card (eligible members)',
    projectedLimit: '$15k - $75k',
    category: 'credit_union',
    relationshipFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-sky-900/25 to-slate-900/80',
    accent: 'text-sky-300',
  },
  {
    id: 'stateemployees_cu',
    bank: 'STATE EMPLOYEES CU',
    product: 'Business card + deposits relationship',
    projectedLimit: '$10k - $40k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-green-900/20 to-slate-900/80',
    accent: 'text-green-300',
  },
  {
    id: 'redwood_cu',
    bank: 'REDWOOD CREDIT UNION',
    product: 'Business Visa + LOC (CA)',
    projectedLimit: '$10k - $55k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-emerald-900/20 to-slate-900/80',
    accent: 'text-emerald-400',
  },
  {
    id: 'elan_cu_backed',
    bank: 'ELAN / CU-BACKED ISSUER',
    product: 'Business card via member credit union',
    projectedLimit: '$10k - $50k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-indigo-900/20 to-slate-900/80',
    accent: 'text-indigo-300',
  },
  {
    id: 'local_community_bank',
    bank: 'COMMUNITY BANK (local)',
    product: 'Relationship business LOC / term line',
    projectedLimit: '$25k - $250k',
    category: 'local',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-violet-900/20 to-slate-900/80',
    accent: 'text-violet-300',
  },
  {
    id: 'local_cu_relationship',
    bank: 'LOCAL CREDIT UNION',
    product: 'Member business card + LOC stack',
    projectedLimit: '$10k - $100k',
    category: 'local',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-emerald-900/20 to-slate-900/80',
    accent: 'text-emerald-300',
  },
  {
    id: 'wintrust_biz',
    bank: 'WINTRUST / LOCAL BANK SUBS',
    product: 'Business LOC (relationship, Midwest)',
    projectedLimit: '$25k - $150k',
    category: 'local',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-blue-900/20 to-slate-900/80',
    accent: 'text-blue-400',
  },
  {
    id: 'frost_biz',
    bank: 'FROST BANK',
    product: 'Business line + card (TX relationship)',
    projectedLimit: '$20k - $125k',
    category: 'local',
    relationshipFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-sky-900/20 to-slate-900/80',
    accent: 'text-sky-400',
  },
  {
    id: 'synovus_biz',
    bank: 'SYNOVUS BANK',
    product: 'Business LOC + Visa (Southeast)',
    projectedLimit: '$15k - $100k',
    category: 'local',
    relationshipFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-teal-900/20 to-slate-900/80',
    accent: 'text-teal-400',
  },
  {
    id: 'zions_biz',
    bank: 'ZIONS / CALIFORNIA BANK & TRUST',
    product: 'Business line (Western US relationship)',
    projectedLimit: '$20k - $120k',
    category: 'local',
    relationshipFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-amber-900/15 to-slate-900/80',
    accent: 'text-amber-400',
  },
  {
    id: 'cadence_biz',
    bank: 'CADENCE BANK',
    product: 'Business LOC (Gulf / South)',
    projectedLimit: '$15k - $90k',
    category: 'local',
    relationshipFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-orange-900/15 to-slate-900/80',
    accent: 'text-orange-400',
  },
  {
    id: 'key_biz',
    bank: 'KEYBANK',
    product: 'Business Rewards + LOC',
    projectedLimit: '$15k - $75k',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'high',
    stackingTier: 'secondary',
    color: 'from-red-900/15 to-slate-900/80',
    accent: 'text-red-400',
  },
  {
    id: 'huntington_biz',
    bank: 'HUNTINGTON BANK',
    product: 'Business credit + LOC',
    projectedLimit: '$10k - $60k',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'mid',
    stackingTier: 'secondary',
    color: 'from-emerald-900/15 to-slate-900/80',
    accent: 'text-emerald-400',
  },
  {
    id: 'citizens_biz',
    bank: 'CITIZENS BANK',
    product: 'Business card + line',
    projectedLimit: '$10k - $55k',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'mid',
    stackingTier: 'secondary',
    color: 'from-green-900/15 to-slate-900/80',
    accent: 'text-green-400',
  },
  {
    id: 'mt_biz',
    bank: 'M&T BANK',
    product: 'Business card (Northeast relationship)',
    projectedLimit: '$10k - $50k',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'mid',
    stackingTier: 'secondary',
    color: 'from-lime-900/15 to-slate-900/80',
    accent: 'text-lime-400',
  },
  {
    id: 'fnbo_biz',
    bank: 'FNBO (FIRST NATIONAL)',
    product: 'Business card stack partner',
    projectedLimit: '$10k - $45k',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'mid',
    stackingTier: 'secondary',
    color: 'from-violet-900/15 to-slate-900/80',
    accent: 'text-violet-400',
  },
  {
    id: 'truist_biz',
    bank: 'TRUIST',
    product: 'Business card + LOC',
    projectedLimit: '$10k - $40k',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'mid',
    stackingTier: 'secondary',
    color: 'from-purple-900/15 to-slate-900/80',
    accent: 'text-purple-300',
  },
  {
    id: 'fifththird_biz',
    bank: 'FIFTH THIRD',
    product: 'Business card + line',
    projectedLimit: '$10k - $45k',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'mid',
    stackingTier: 'secondary',
    color: 'from-blue-900/15 to-slate-900/80',
    accent: 'text-blue-300',
  },
  {
    id: 'regions_biz',
    bank: 'REGIONS BANK',
    product: 'Business card (South / Midwest)',
    projectedLimit: '$10k - $40k',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'mid',
    stackingTier: 'secondary',
    color: 'from-emerald-900/15 to-slate-900/80',
    accent: 'text-emerald-300',
  },
  {
    id: 'chase_ink_pref',
    bank: 'CHASE',
    product: 'Ink Business Preferred',
    projectedLimit: '$5k - $50k typical',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'low',
    stackingTier: 'national_low',
    color: 'from-blue-900/40 to-slate-900/80',
    accent: 'text-blue-400',
  },
  {
    id: 'amex_biz_plat',
    bank: 'AMEX',
    product: 'Business Platinum (pay-in-full)',
    projectedLimit: 'No preset limit (PAY IN FULL)',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'mid',
    stackingTier: 'secondary',
    color: 'from-neutral-800/40 to-stone-900/80',
    accent: 'text-slate-300',
  },
  {
    id: 'capone_spark_cash',
    bank: 'CAPITAL ONE',
    product: 'Spark Cash Plus',
    projectedLimit: '$5k - $30k typical',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'low',
    stackingTier: 'national_low',
    color: 'from-red-900/20 to-slate-900/80',
    accent: 'text-red-300',
  },
  {
    id: 'boa_adv',
    bank: 'BANK OF AMERICA',
    product: 'Business Advantage',
    projectedLimit: '$5k - $25k typical',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'low',
    stackingTier: 'national_low',
    color: 'from-red-900/20 to-slate-900/80',
    accent: 'text-red-400',
  },
  {
    id: 'wells_fargo_biz',
    bank: 'WELLS FARGO',
    product: 'Signify Business',
    projectedLimit: '$5k - $20k typical',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'low',
    stackingTier: 'national_low',
    color: 'from-amber-900/15 to-slate-900/80',
    accent: 'text-amber-300',
  },
  {
    id: 'usbank_triplecash',
    bank: 'U.S. BANK',
    product: 'Triple Cash Rewards',
    projectedLimit: '$5k - $25k typical',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'low',
    stackingTier: 'national_low',
    color: 'from-sky-900/20 to-slate-900/80',
    accent: 'text-sky-300',
  },
  {
    id: 'pnc_biz',
    bank: 'PNC',
    product: 'BusinessOptions',
    projectedLimit: '$5k - $25k typical',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'low',
    stackingTier: 'national_low',
    color: 'from-orange-900/15 to-slate-900/80',
    accent: 'text-orange-300',
  },
  {
    id: 'td_biz',
    bank: 'TD BANK',
    product: 'Business Solutions',
    projectedLimit: '$5k - $20k typical',
    category: 'national',
    relationshipFriendly: true,
    limitBias: 'low',
    stackingTier: 'national_low',
    color: 'from-emerald-900/15 to-slate-900/80',
    accent: 'text-emerald-300',
  },
  {
    id: 'regional_cu_generic',
    bank: 'REGIONAL CREDIT UNION',
    product: 'Business card + deposits lane',
    projectedLimit: '$10k - $60k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-teal-900/20 to-slate-900/80',
    accent: 'text-teal-300',
  },
];

function slugLenderId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48);
}

function parseFdicRows(data: FdicInstitution | undefined): Array<{ name: string; city: string; state: string }> {
  const rows = (data?.data ?? []) as Array<{ data?: Record<string, unknown> } | Record<string, unknown>>;
  const out: Array<{ name: string; city: string; state: string }> = [];
  for (const row of rows) {
    const d = (row as { data?: Record<string, unknown> }).data ?? (row as Record<string, unknown>);
    const name = String(d.NAME ?? d.INSTNAME ?? d.name ?? '').trim();
    if (!name) continue;
    out.push({
      name,
      city: String(d.CITY ?? d.city ?? '').trim(),
      state: String(d.STALP ?? d.STNAME ?? d.state ?? '').trim(),
    });
  }
  return out;
}

function parseNcuaRows(data: NcuaNearbyResult | undefined): Array<{ name: string; city?: string }> {
  if (!data) return [];
  const tryArray = (rows: unknown[]): Array<{ name: string; city?: string }> => {
    const out: Array<{ name: string; city?: string }> = [];
    for (const row of rows) {
      const r = row as Record<string, unknown>;
      const name = String(
        r.CreditUnionName ?? r.CU_NAME ?? r.cuName ?? r.Name ?? r.name ?? r.CUNAME ?? '',
      ).trim();
      if (!name) continue;
      const city = String(r.City ?? r.city ?? r.CITY ?? '').trim();
      out.push(city ? { name, city } : { name });
    }
    return out;
  };

  if (Array.isArray(data)) return tryArray(data);
  if (typeof data.raw === 'string' && data.raw.trim()) {
    try {
      const parsed = JSON.parse(data.raw) as unknown;
      if (Array.isArray(parsed)) return tryArray(parsed);
    } catch {
      /* NCUA may return HTML — skip */
    }
  }
  for (const key of ['CreditUnions', 'results', 'data', 'cu', 'CUs']) {
    const candidate = (data as Record<string, unknown>)[key];
    if (Array.isArray(candidate)) return tryArray(candidate);
  }
  return [];
}

function fdicToMatch(inst: { name: string; city: string; state: string }, index: number): LenderMatch {
  const cityLabel = inst.city ? `${inst.city}, ${inst.state}` : inst.state;
  return {
    id: `fdic_${slugLenderId(`${inst.state}_${inst.name}`)}_${index}`,
    bank: inst.name.toUpperCase(),
    product: `Business LOC / relationship line (${cityLabel})`,
    projectedLimit: '$15k - $150k',
    category: 'local',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-violet-900/20 to-slate-900/80',
    accent: 'text-violet-300',
    why: 'FDIC in state',
    matchCity: inst.city || undefined,
  };
}

function ncuaToMatch(cu: { name: string; city?: string }, index: number): LenderMatch {
  const cityLabel = cu.city ? `${cu.city}` : 'nearby';
  return {
    id: `ncua_${slugLenderId(cu.name)}_${index}`,
    bank: cu.name.toUpperCase(),
    product: `Member business card + LOC (${cityLabel})`,
    projectedLimit: '$10k - $75k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    limitBias: 'high',
    stackingTier: 'primary',
    color: 'from-emerald-900/20 to-slate-900/80',
    accent: 'text-emerald-300',
    why: 'NCUA nearby',
    matchCity: cu.city,
  };
}

export type ResolveLocalLendersArgs = {
  zip?: string;
  state?: string;
  city?: string;
  address?: string;
  address2?: string;
  radiusMiles?: number;
};

export type ResolveLocalLendersResult = {
  ok: boolean;
  matches: LenderMatch[];
  error?: string;
};

/** Real FDIC / NCUA lookups — never fabricates placeholder lenders. */
export async function resolveLocalLenderMatches(args: ResolveLocalLendersArgs): Promise<ResolveLocalLendersResult> {
  const zip = (args.zip || '').trim();
  const hasZip = zip.length >= 5;
  const hasAddress = Boolean((args.address || '').trim());

  if (!hasZip && !hasAddress) {
    return { ok: true, matches: [] };
  }

  let state = (args.state || '').trim().toUpperCase();
  let city = (args.city || '').trim();
  let ncuaAddress = '';

  if (hasZip) {
    const zipRes = await lookupZip(zip.slice(0, 5));
    if (zipRes.ok && zipRes.data?.places?.length) {
      const place = zipRes.data.places[0];
      if (!state) state = String(place['state abbreviation'] || place.state || '').trim().toUpperCase();
      if (!city) city = String(place['place name'] || '').trim();
    }
  }

  if (hasAddress) {
    const street = [args.address, args.address2].filter(Boolean).join(' ').trim();
    const geo = await geocodeAddress({
      street,
      city: city || undefined,
      state: state || undefined,
      zip: hasZip ? zip.slice(0, 5) : undefined,
    });
    if (geo.ok && geo.data?.result?.addressMatches?.length) {
      const match = geo.data.result.addressMatches[0];
      ncuaAddress = match.matchedAddress;
      if (!city && match.matchedAddress) {
        const parts = match.matchedAddress.split(',');
        if (parts.length >= 2) city = parts[parts.length - 2]?.trim() ?? city;
      }
    } else if (street) {
      ncuaAddress = [street, city, state, hasZip ? zip.slice(0, 5) : undefined].filter(Boolean).join(', ');
    }
  } else {
    ncuaAddress = [city, state, hasZip ? zip.slice(0, 5) : undefined].filter(Boolean).join(', ');
  }

  if (!state && !ncuaAddress) {
    return { ok: false, matches: [], error: 'geo_unresolved' };
  }

  const radius = Math.min(100, Math.max(1, args.radiusMiles ?? 50));
  const fdicPromise = state
    ? searchFdicInstitutions({
        filters: `STALP:${state} AND ACTIVE:1`,
        fields: 'NAME,CITY,STALP',
        limit: 20,
      })
    : Promise.resolve({ ok: false as const, error: 'no_state' });

  const ncuaPromise = ncuaAddress
    ? searchNcuaNearby({ type: 'address', address: ncuaAddress, radius })
    : Promise.resolve({ ok: false as const, error: 'no_address' });

  const [fdicRes, ncuaRes] = await Promise.all([fdicPromise, ncuaPromise]);

  const matches: LenderMatch[] = [];
  const seen = new Set<string>();

  if (ncuaRes.ok) {
    parseNcuaRows(ncuaRes.data).forEach((cu, i) => {
      const key = cu.name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      matches.push(ncuaToMatch(cu, i));
    });
  }

  if (fdicRes.ok) {
    parseFdicRows(fdicRes.data).forEach((inst, i) => {
      const key = inst.name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      matches.push(fdicToMatch(inst, i));
    });
  }

  if (!fdicRes.ok && !ncuaRes.ok) {
    return {
      ok: false,
      matches: [],
      error: fdicRes.error || ncuaRes.error || 'lookup_failed',
    };
  }

  return { ok: true, matches };
}

export function curatedPresetMatches(): LenderMatch[] {
  return BASE_LENDER_PRESETS.map((p) => ({ ...p, why: 'curated preset' as LenderMatchWhy }));
}
