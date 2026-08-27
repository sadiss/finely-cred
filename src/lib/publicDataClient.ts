import { supabase, isSupabaseConfigured } from './supabaseClient';

export type PublicDataResult<T> = {
  ok: boolean;
  data?: T;
  stale?: boolean;
  error?: string;
  endpoint?: string;
  cached?: boolean;
};

type EdgeEnvelope<T> = {
  ok?: boolean;
  data?: T;
  stale?: boolean;
  error?: string;
  endpoint?: string;
  cached?: boolean;
  source?: string;
};

async function invokePublicData<T>(
  source: string,
  action: string,
  params?: Record<string, unknown>,
): Promise<PublicDataResult<T>> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'not_configured' };
  }
  try {
    const { data, error } = await supabase.functions.invoke('public-data', {
      body: { source, action, params: params ?? {} },
    });
    if (error) return { ok: false, error: error.message || 'invoke_failed' };
    const envelope = (data ?? {}) as EdgeEnvelope<T>;
    if (!envelope.ok) {
      return {
        ok: false,
        error: envelope.error || 'upstream_failed',
        endpoint: envelope.endpoint,
      };
    }
    return {
      ok: true,
      data: envelope.data as T,
      stale: Boolean(envelope.stale),
      endpoint: envelope.endpoint,
      cached: Boolean(envelope.cached),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'invoke_failed' };
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CfrSectionResult = {
  xml: string;
  date: string;
  title: string;
  part: string;
  section: string;
};

export type CfpbComplaintHit = {
  complaint_id?: string;
  product?: string;
  issue?: string;
  company?: string;
  state?: string;
  date_received?: string;
  [key: string]: unknown;
};

export type CfpbComplaintsResponse = {
  hits?: { hits?: Array<{ _source?: CfpbComplaintHit }> };
  [key: string]: unknown;
};

export type FdicInstitution = {
  data?: Array<{ data?: Record<string, unknown> }>;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

export type NcuaNearbyResult = {
  raw?: string;
  [key: string]: unknown;
};

export type CensusGeocodeMatch = {
  coordinates?: { x: number; y: number };
  matchedAddress?: string;
};

export type CensusGeocodeResponse = {
  result?: {
    addressMatches?: Array<{ coordinates: { x: number; y: number }; matchedAddress: string }>;
  };
};

export type UsHoliday = {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  types?: string[];
};

export type ZipLookupPlace = {
  'place name': string;
  longitude: string;
  state: string;
  'state abbreviation': string;
  latitude: string;
};

export type ZipLookupResult = {
  'post code': string;
  country: string;
  'country abbreviation': string;
  places: ZipLookupPlace[];
};

// ── API wrappers ────────────────────────────────────────────────────────────

export async function fetchCfrSection(args: {
  title: string | number;
  part: string | number;
  section: string | number;
  date?: string;
}): Promise<PublicDataResult<CfrSectionResult>> {
  return invokePublicData<CfrSectionResult>('ecfr', 'section', {
    title: String(args.title),
    part: String(args.part),
    section: String(args.section),
    ...(args.date ? { date: args.date } : {}),
  });
}

export async function searchCfpbComplaints(args: {
  company: string;
  state?: string;
  date_received_min?: string;
  date_received_max?: string;
  size?: number;
}): Promise<PublicDataResult<CfpbComplaintsResponse>> {
  return invokePublicData<CfpbComplaintsResponse>('cfpb_complaints', 'search', {
    company: args.company,
    ...(args.state ? { state: args.state } : {}),
    ...(args.date_received_min ? { date_received_min: args.date_received_min } : {}),
    ...(args.date_received_max ? { date_received_max: args.date_received_max } : {}),
    ...(args.size !== undefined ? { size: args.size } : {}),
  });
}

export async function searchFdicInstitutions(args: {
  filters: string;
  fields?: string;
  limit?: number;
}): Promise<PublicDataResult<FdicInstitution>> {
  return invokePublicData<FdicInstitution>('fdic', 'institutions', {
    filters: args.filters,
    ...(args.fields ? { fields: args.fields } : {}),
    ...(args.limit !== undefined ? { limit: args.limit } : {}),
  });
}

export async function searchNcuaNearby(args: {
  type?: 'address' | 'cuname' | 'cunumber';
  address?: string;
  cuname?: string;
  cunumber?: string;
  radius?: number;
}): Promise<PublicDataResult<NcuaNearbyResult>> {
  return invokePublicData<NcuaNearbyResult>('ncua', 'nearby', {
    type: args.type ?? 'address',
    ...(args.address ? { address: args.address } : {}),
    ...(args.cuname ? { cuname: args.cuname } : {}),
    ...(args.cunumber ? { cunumber: args.cunumber } : {}),
    ...(args.radius !== undefined ? { radius: args.radius } : {}),
  });
}

export async function geocodeAddress(args: {
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}): Promise<PublicDataResult<CensusGeocodeResponse>> {
  return invokePublicData<CensusGeocodeResponse>('census_geocode', 'geocode', { ...args });
}

export async function fetchUsHolidays(year?: number): Promise<PublicDataResult<UsHoliday[]>> {
  return invokePublicData<UsHoliday[]>('nager_holidays', 'holidays', {
    year: year ?? new Date().getFullYear(),
  });
}

export async function lookupZip(zip: string): Promise<PublicDataResult<ZipLookupResult>> {
  return invokePublicData<ZipLookupResult>('zippopotam', 'lookup', { zip });
}

export type HmdaStateSummary = {
  year: string;
  state: string;
  originated: number;
  denied: number;
  originatedSum: number;
  servedFrom?: string | null;
};

export async function fetchHmdaStateSummary(args: {
  state: string;
  year?: string;
}): Promise<PublicDataResult<HmdaStateSummary>> {
  return invokePublicData<HmdaStateSummary>('hmda', 'aggregations', {
    state: args.state.trim().toUpperCase().slice(0, 2),
    ...(args.year ? { year: args.year } : {}),
  });
}

export type SbaStateSummary = {
  state: string;
  available: boolean;
  loanCount: number;
  approvalSum: number;
  lenderNames: string[];
  resourceName?: string;
  packageId?: string;
  hint?: string;
};

export async function fetchSbaStateSummary(args: { state: string }): Promise<PublicDataResult<SbaStateSummary>> {
  return invokePublicData<SbaStateSummary>('sba', 'summary', {
    state: args.state.trim().toUpperCase().slice(0, 2),
  });
}

export type CfrSearchHit = {
  headings?: Record<string, string>;
  hierarchy?: Record<string, string>;
  full_text_excerpt?: string;
  starts_on?: string;
  [key: string]: unknown;
};

export type CfrSearchResponse = {
  results?: CfrSearchHit[];
  description?: string;
  [key: string]: unknown;
};

export async function searchCfr(args: {
  query: string;
  title?: string | number;
  part?: string | number;
}): Promise<PublicDataResult<CfrSearchResponse>> {
  return invokePublicData<CfrSearchResponse>('ecfr', 'search', {
    query: args.query,
    ...(args.title !== undefined ? { title: String(args.title) } : {}),
    ...(args.part !== undefined ? { part: String(args.part) } : {}),
  });
}

export type CourtListenerOpinionHit = {
  caseName?: string;
  court?: string;
  dateFiled?: string;
  absoluteUrl?: string;
  snippet?: string;
  docketNumber?: string;
};

export type CourtListenerSearchResponse = {
  count?: number;
  results: CourtListenerOpinionHit[];
};

/**
 * CourtListener opinion search — ADMIN-ONLY consumer.
 * Do not import this from partner portal surfaces or call on partner page load.
 */
export async function searchCourtListenerOpinions(args: {
  query: string;
  court?: string;
}): Promise<PublicDataResult<CourtListenerSearchResponse>> {
  return invokePublicData<CourtListenerSearchResponse>('courtlistener', 'search', {
    query: args.query,
    ...(args.court ? { court: args.court } : {}),
  });
}
