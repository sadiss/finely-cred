// Public-data proxy — authoritative government / reference lookups for partner tools.
// Browser never calls upstream hosts directly; responses are cached with per-source TTL.

import { corsHeaders } from '../_shared/cors.ts';
import { getClientIp, json, rateLimit, resolveAuthContext } from '../_shared/edgeGuard.ts';

type ReqBody = {
  source?: string;
  action?: string;
  params?: Record<string, unknown>;
};

type CacheBucket = 'statutes' | 'institutions' | 'geocode' | 'holidays' | 'complaints' | 'general';

type CacheEntry = {
  value: unknown;
  fetchedAt: number;
  expiresAt: number;
  endpoint: string;
};

type HandlerResult = { data: unknown; endpoint: string };

const FETCH_TIMEOUT_MS = 8000;
const FINELY_UA = 'FinelyCred/1.0 (partner-tool; contact@finelycred.com)';

const TTL_MS: Record<CacheBucket, number> = {
  statutes: 7 * 24 * 60 * 60 * 1000,
  institutions: 24 * 60 * 60 * 1000,
  geocode: Number.POSITIVE_INFINITY,
  holidays: 30 * 24 * 60 * 60 * 1000,
  complaints: 24 * 60 * 60 * 1000,
  general: 24 * 60 * 60 * 1000,
};

const SOURCE_BUCKET: Record<string, CacheBucket> = {
  ecfr: 'statutes',
  federal_register: 'statutes',
  cfpb_complaints: 'complaints',
  fdic: 'institutions',
  ncua: 'institutions',
  census_geocode: 'geocode',
  nager_holidays: 'holidays',
  zippopotam: 'general',
  hmda: 'general',
  sba: 'general',
  courtlistener: 'statutes',
};

const cache = new Map<string, CacheEntry>();

function stableKey(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort();
  const sorted: Record<string, unknown> = {};
  for (const k of keys) sorted[k] = obj[k];
  return JSON.stringify(sorted);
}

function cacheKey(source: string, action: string, params: Record<string, unknown>): string {
  return `${source}:${action}:${stableKey(params)}`;
}

function getFreshEntry(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== Number.POSITIVE_INFINITY && Date.now() > entry.expiresAt) return null;
  return entry;
}

function getAnyEntry(key: string): CacheEntry | null {
  return cache.get(key) ?? null;
}

function putCache(key: string, bucket: CacheBucket, value: unknown, endpoint: string) {
  const ttl = TTL_MS[bucket];
  cache.set(key, {
    value,
    fetchedAt: Date.now(),
    expiresAt: ttl === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Date.now() + ttl,
    endpoint,
  });
}

function normalizeAddress(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function fetchWithTimeout(
  input: string | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function govHeaders(extra?: Record<string, string>): Record<string, string> {
  return { 'User-Agent': FINELY_UA, Accept: 'application/json', ...extra };
}

function strParam(params: Record<string, unknown>, key: string, fallback = ''): string {
  const v = params[key];
  if (v === undefined || v === null) return fallback;
  return String(v).trim();
}

function numParam(params: Record<string, unknown>, key: string, fallback: number): number {
  const n = Number(params[key]);
  return Number.isFinite(n) ? n : fallback;
}

// ── eCFR ──────────────────────────────────────────────────────────────────────

async function handleEcfr(action: string, params: Record<string, unknown>): Promise<HandlerResult> {
  if (action === 'search') {
    const query = strParam(params, 'query');
    if (!query) throw new Error('ecfr search requires params.query');
    const url = new URL('https://www.ecfr.gov/api/search/v1/results');
    url.searchParams.set('query', query.slice(0, 300));
    const title = strParam(params, 'title');
    const part = strParam(params, 'part');
    if (title) url.searchParams.set('title', title);
    if (part) url.searchParams.set('part', part);
    const res = await fetchWithTimeout(url, { headers: govHeaders() });
    if (!res.ok) throw new Error(`ecfr search HTTP ${res.status}`);
    const data = await res.json();
    return { data, endpoint: url.toString() };
  }

  if (action === 'section') {
    const title = strParam(params, 'title');
    const part = strParam(params, 'part');
    const section = strParam(params, 'section');
    if (!title || !part || !section) {
      throw new Error('ecfr section requires params.title, part, and section');
    }
    const date = strParam(params, 'date') || new Date().toISOString().slice(0, 10);
    const url = new URL(`https://www.ecfr.gov/api/versioner/v1/full/${date}/title-${title}.xml`);
    url.searchParams.set('part', part);
    url.searchParams.set('section', section);
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': FINELY_UA, Accept: 'application/xml' } });
    if (!res.ok) throw new Error(`ecfr section HTTP ${res.status}`);
    const text = await res.text();
    return { data: { xml: text, date, title, part, section }, endpoint: url.toString() };
  }

  throw new Error(`Unknown ecfr action: ${action}`);
}

// ── Federal Register ──────────────────────────────────────────────────────────

async function handleFederalRegister(action: string, params: Record<string, unknown>): Promise<HandlerResult> {
  if (action !== 'search') throw new Error(`Unknown federal_register action: ${action}`);
  const url = new URL('https://www.federalregister.gov/api/v1/documents.json');
  const term = strParam(params, 'term') || strParam(params, 'query');
  if (term) url.searchParams.set('conditions[term]', term.slice(0, 300));
  const agency = strParam(params, 'agency');
  if (agency) url.searchParams.set('conditions[agencies][]', agency);
  const type = strParam(params, 'type');
  if (type) url.searchParams.set('conditions[type][]', type);
  url.searchParams.set('per_page', String(Math.min(25, Math.max(1, numParam(params, 'per_page', 10)))));
  url.searchParams.set('order', strParam(params, 'order', 'newest'));
  const res = await fetchWithTimeout(url, { headers: govHeaders() });
  if (!res.ok) throw new Error(`federal_register HTTP ${res.status}`);
  const data = await res.json();
  return { data, endpoint: url.toString() };
}

// ── CFPB complaints ───────────────────────────────────────────────────────────

async function handleCfpbComplaints(action: string, params: Record<string, unknown>): Promise<HandlerResult> {
  if (action !== 'search') throw new Error(`Unknown cfpb_complaints action: ${action}`);
  const company = strParam(params, 'company');
  const state = strParam(params, 'state');
  const dateMin = strParam(params, 'date_received_min') || strParam(params, 'date_min');
  const dateMax = strParam(params, 'date_received_max') || strParam(params, 'date_max');
  if (!company) throw new Error('cfpb_complaints requires params.company');
  const hasState = Boolean(state);
  const hasDate = Boolean(dateMin || dateMax);
  if (!hasState && !hasDate) {
    throw new Error('cfpb_complaints requires company+state or company+date narrowing');
  }
  const url = new URL('https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/');
  url.searchParams.set('company', company.slice(0, 200));
  if (state) url.searchParams.set('state', state.toUpperCase().slice(0, 2));
  if (dateMin) url.searchParams.set('date_received_min', dateMin);
  if (dateMax) url.searchParams.set('date_received_max', dateMax);
  url.searchParams.set('size', String(Math.min(25, Math.max(1, numParam(params, 'size', 25)))));
  url.searchParams.set('no_aggs', 'true');
  const res = await fetchWithTimeout(url, { headers: govHeaders() });
  if (!res.ok) throw new Error(`cfpb_complaints HTTP ${res.status}`);
  const data = await res.json();
  return { data, endpoint: url.toString() };
}

// ── FDIC ────────────────────────────────────────────────────────────────────

async function handleFdic(action: string, params: Record<string, unknown>): Promise<HandlerResult> {
  const path = action === 'locations' ? 'locations' : 'institutions';
  if (action !== 'institutions' && action !== 'locations') {
    throw new Error(`Unknown fdic action: ${action} (use institutions or locations)`);
  }
  const url = new URL(`https://api.fdic.gov/banks/${path}`);
  const filters = strParam(params, 'filters');
  if (!filters) throw new Error('fdic requires params.filters (e.g. STALP:NJ AND ACTIVE:1)');
  url.searchParams.set('filters', filters);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(Math.min(100, Math.max(1, numParam(params, 'limit', 25)))));
  const fields = strParam(params, 'fields');
  if (fields) url.searchParams.set('fields', fields);
  const res = await fetchWithTimeout(url, { headers: govHeaders() });
  if (!res.ok) throw new Error(`fdic HTTP ${res.status}`);
  const data = await res.json();
  return { data, endpoint: url.toString() };
}

// ── NCUA ──────────────────────────────────────────────────────────────────────

async function handleNcua(action: string, params: Record<string, unknown>): Promise<HandlerResult> {
  if (action !== 'nearby') throw new Error(`Unknown ncua action: ${action}`);
  const type = strParam(params, 'type', 'address');
  if (!['cuname', 'cunumber', 'address'].includes(type)) {
    throw new Error('ncua type must be cuname, cunumber, or address');
  }
  const address = strParam(params, 'address') || strParam(params, 'query');
  const cuname = strParam(params, 'cuname');
  const cunumber = strParam(params, 'cunumber');
  if (type === 'address' && !address) throw new Error('ncua address type requires params.address');
  if (type === 'cuname' && !cuname) throw new Error('ncua cuname type requires params.cuname');
  if (type === 'cunumber' && !cunumber) throw new Error('ncua cunumber type requires params.cunumber');
  const radius = String(Math.min(100, Math.max(1, numParam(params, 'radius', 10))));
  const body = new URLSearchParams();
  body.set('type', type);
  body.set('radius', radius);
  if (type === 'address') body.set('address', address);
  if (type === 'cuname') body.set('cuname', cuname);
  if (type === 'cunumber') body.set('cunumber', cunumber);
  const endpoint = 'https://mapping.ncua.gov/findCUByRadius.aspx';
  const res = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'User-Agent': FINELY_UA,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/plain, */*',
    },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`ncua HTTP ${res.status}`);
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 50_000) };
  }
  return { data, endpoint };
}

// ── Census geocoder ───────────────────────────────────────────────────────────

async function handleCensusGeocode(action: string, params: Record<string, unknown>): Promise<HandlerResult> {
  if (action !== 'geocode') throw new Error(`Unknown census_geocode action: ${action}`);
  const benchmark = strParam(params, 'benchmark', 'Public_AR_Current');
  const street = strParam(params, 'street');
  const city = strParam(params, 'city');
  const state = strParam(params, 'state');
  const zip = strParam(params, 'zip');
  const oneline = strParam(params, 'address') || strParam(params, 'oneline');

  let url: URL;
  if (street || (city && state)) {
    url = new URL('https://geocoding.geo.census.gov/geocoder/locations/address');
    if (street) url.searchParams.set('street', street);
    if (city) url.searchParams.set('city', city);
    if (state) url.searchParams.set('state', state);
    if (zip) url.searchParams.set('zip', zip);
  } else if (oneline) {
    url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress');
    url.searchParams.set('address', oneline);
  } else {
    throw new Error('census_geocode requires params.address (oneline) or street+city+state');
  }
  url.searchParams.set('benchmark', benchmark);
  url.searchParams.set('format', 'json');
  const res = await fetchWithTimeout(url, { headers: govHeaders() });
  if (!res.ok) throw new Error(`census_geocode HTTP ${res.status}`);
  const data = await res.json();
  return { data, endpoint: url.toString() };
}

// ── US holidays (Nager) ───────────────────────────────────────────────────────

async function handleNagerHolidays(action: string, params: Record<string, unknown>): Promise<HandlerResult> {
  if (action !== 'holidays') throw new Error(`Unknown nager_holidays action: ${action}`);
  const year = numParam(params, 'year', new Date().getFullYear());
  const endpoint = `https://date.nager.at/api/v3/PublicHolidays/${year}/US`;
  const res = await fetchWithTimeout(endpoint, { headers: govHeaders() });
  if (!res.ok) throw new Error(`nager_holidays HTTP ${res.status}`);
  const data = await res.json();
  return { data, endpoint };
}

// ── Zippopotam ────────────────────────────────────────────────────────────────

async function handleZippopotam(action: string, params: Record<string, unknown>): Promise<HandlerResult> {
  if (action !== 'lookup') throw new Error(`Unknown zippopotam action: ${action}`);
  const zip = strParam(params, 'zip').replace(/\D/g, '').slice(0, 5);
  if (zip.length !== 5) throw new Error('zippopotam requires a 5-digit US zip');
  const endpoint = `https://api.zippopotam.us/us/${zip}`;
  const res = await fetchWithTimeout(endpoint, { headers: govHeaders() });
  if (!res.ok) throw new Error(`zippopotam HTTP ${res.status}`);
  const data = await res.json();
  return { data, endpoint };
}

// ── CourtListener (admin-only; cached opinions — never scrape state courts) ─

const BLOCKED_COURT_HOSTS = /njcourts\.gov|judiciary\.state\.nj|courts\.state\./i;

function slimCourtListenerHit(raw: Record<string, unknown>): Record<string, unknown> {
  const abs = String(raw.absolute_url ?? raw.absoluteUrl ?? '');
  return {
    caseName: raw.caseName ?? raw.case_name ?? '',
    court: raw.court ?? raw.court_id ?? '',
    dateFiled: raw.dateFiled ?? raw.date_filed ?? '',
    absoluteUrl: abs.startsWith('http') ? abs : abs ? `https://www.courtlistener.com${abs}` : '',
    snippet: String(raw.snippet ?? '').slice(0, 400),
    docketNumber: raw.docketNumber ?? raw.docket_number ?? '',
  };
}

async function handleCourtListener(action: string, params: Record<string, unknown>): Promise<HandlerResult> {
  if (action !== 'search') throw new Error(`Unknown courtlistener action: ${action}`);
  const query = strParam(params, 'query').slice(0, 240);
  if (query.length < 3) throw new Error('courtlistener search requires params.query (min 3 chars)');
  if (BLOCKED_COURT_HOSTS.test(query)) {
    throw new Error('courtlistener refuses state-court scrape targets — use CourtListener opinions only');
  }
  const court = strParam(params, 'court').slice(0, 32);
  const url = new URL('https://www.courtlistener.com/api/rest/v4/search/');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'o');
  url.searchParams.set('page_size', '5');
  if (court) url.searchParams.set('court', court);
  const token = (Deno.env.get('COURTLISTENER_API_TOKEN') || '').trim();
  const headers = govHeaders(token ? { Authorization: `Token ${token}` } : undefined);
  const res = await fetchWithTimeout(url, { headers });
  if (!res.ok) throw new Error(`courtlistener HTTP ${res.status}`);
  const payload = (await res.json()) as { count?: number; results?: Array<Record<string, unknown>> };
  const results = Array.isArray(payload.results) ? payload.results.slice(0, 5).map(slimCourtListenerHit) : [];
  return {
    data: { count: payload.count ?? results.length, results },
    endpoint: url.toString(),
  };
}

// ── HMDA (CFPB Data Browser aggregations — state counts only) ───────────────

function slimHmdaAggregations(payload: Record<string, unknown>, year: string, state: string) {
  const rows = Array.isArray(payload.aggregations) ? payload.aggregations : [];
  let originated = 0;
  let denied = 0;
  let originatedSum = 0;
  for (const raw of rows) {
    const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const actionTaken = String(row.actions_taken ?? row.action_taken ?? '');
    const count = Number(row.count) || 0;
    const sum = Number(row.sum) || 0;
    if (actionTaken === '1') {
      originated += count;
      originatedSum += sum;
    }
    if (actionTaken === '3') denied += count;
  }
  return {
    year,
    state,
    originated,
    denied,
    originatedSum,
    servedFrom: typeof payload.servedFrom === 'string' ? payload.servedFrom : null,
  };
}

async function handleHmda(action: string, params: Record<string, unknown>): Promise<HandlerResult> {
  if (action !== 'aggregations' && action !== 'summary') {
    throw new Error(`Unknown hmda action: ${action} (use aggregations)`);
  }
  const state = strParam(params, 'state').toUpperCase().slice(0, 2);
  if (!/^[A-Z]{2}$/.test(state)) throw new Error('hmda requires params.state (2-letter)');
  const requestedYear = strParam(params, 'year').replace(/\D/g, '').slice(0, 4);
  const fallbackYear = String(new Date().getFullYear() - 2);
  const yearsToTry = [...new Set([requestedYear, fallbackYear, '2024', '2023', '2022'].filter(Boolean))];

  let lastErr = 'hmda upstream failed';
  for (const year of yearsToTry) {
    const url = new URL('https://ffiec.cfpb.gov/v2/data-browser-api/view/aggregations');
    url.searchParams.set('years', year);
    url.searchParams.set('states', state);
    url.searchParams.set('actions_taken', '1,3');
    const res = await fetchWithTimeout(url, { headers: govHeaders() });
    if (!res.ok) {
      lastErr = `hmda HTTP ${res.status} year=${year}`;
      continue;
    }
    const payload = (await res.json()) as Record<string, unknown>;
    return { data: slimHmdaAggregations(payload, year, state), endpoint: url.toString() };
  }
  throw new Error(lastErr);
}

// ── SBA (CKAN DataStore — FOIA 7(a)/504 counts by state) ─────────────────────

const SBA_PACKAGE_CANDIDATES = ['7-a-504-foia', '7a-504-foia', 'foia-7-a-504'];
const SBA_LENDER_FIELDS = ['BankName', 'LenderName', 'Bank', 'ThirdPartyLender_Name', 'CDC_Name'];
const SBA_AMOUNT_FIELDS = ['GrossApproval', 'GrossApproval2', 'ApprovalAmount', 'GrossApprovalInDollars'];

function pickRecordField(row: Record<string, unknown>, candidates: string[]): string {
  for (const key of candidates) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  const lower = new Map(Object.keys(row).map((k) => [k.toLowerCase(), k]));
  for (const key of candidates) {
    const actual = lower.get(key.toLowerCase());
    if (!actual) continue;
    const value = row[actual];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return '';
}

async function resolveSbaFoiaResource(
  explicitId: string,
): Promise<{ resourceId: string; packageId: string; resourceName: string } | null> {
  if (explicitId) return { resourceId: explicitId, packageId: 'explicit', resourceName: 'provided' };

  const tryPackage = async (packageId: string) => {
    const url = new URL('https://data.sba.gov/api/3/action/package_show');
    url.searchParams.set('id', packageId);
    const res = await fetchWithTimeout(url, { headers: govHeaders() });
    if (!res.ok) return null;
    const payload = (await res.json()) as {
      success?: boolean;
      result?: { resources?: Array<{ id?: string; name?: string; description?: string; datastore_active?: boolean }> };
    };
    if (!payload?.success || !payload.result?.resources) return null;
    const active = payload.result.resources.filter((r) => r.datastore_active && r.id);
    const label = (r: { name?: string; description?: string }) => `${r.name || ''} ${r.description || ''}`;
    const preferred =
      active.find((r) => /7\s*\(?a\)?.*(2020|present)/i.test(label(r))) ??
      active.find((r) => /7\s*\(?a\)?/i.test(label(r))) ??
      active[0];
    if (!preferred?.id) return null;
    return { resourceId: preferred.id, packageId, resourceName: String(preferred.name || '') };
  };

  for (const id of SBA_PACKAGE_CANDIDATES) {
    const hit = await tryPackage(id);
    if (hit) return hit;
  }

  const search = new URL('https://data.sba.gov/api/3/action/package_search');
  search.searchParams.set('q', '7(a) FOIA');
  search.searchParams.set('rows', '5');
  const res = await fetchWithTimeout(search, { headers: govHeaders() });
  if (!res.ok) return null;
  const payload = (await res.json()) as { success?: boolean; result?: { results?: Array<{ name?: string }> } };
  const firstName = payload?.success ? payload.result?.results?.[0]?.name : '';
  if (!firstName) return null;
  return tryPackage(firstName);
}

async function handleSba(action: string, params: Record<string, unknown>): Promise<HandlerResult> {
  if (action === 'search') {
    const resourceId = strParam(params, 'resource_id');
    if (!resourceId) {
      const resolved = await resolveSbaFoiaResource('');
      if (!resolved) throw new Error('sba search requires params.resource_id (FOIA catalog unresolved)');
      params = { ...params, resource_id: resolved.resourceId };
    }
    const url = new URL('https://data.sba.gov/api/3/action/datastore_search');
    url.searchParams.set('resource_id', strParam(params, 'resource_id'));
    const q = strParam(params, 'q');
    if (q) url.searchParams.set('q', q.slice(0, 300));
    const filters = params.filters;
    if (filters && typeof filters === 'object') {
      url.searchParams.set('filters', JSON.stringify(filters));
    }
    url.searchParams.set('limit', String(Math.min(100, Math.max(1, numParam(params, 'limit', 25)))));
    const res = await fetchWithTimeout(url, { headers: govHeaders() });
    if (!res.ok) throw new Error(`sba HTTP ${res.status}`);
    const data = await res.json();
    return { data, endpoint: url.toString() };
  }

  if (action !== 'summary') throw new Error(`Unknown sba action: ${action} (use summary or search)`);
  const state = strParam(params, 'state').toUpperCase().slice(0, 2);
  if (!/^[A-Z]{2}$/.test(state)) throw new Error('sba summary requires params.state (2-letter)');

  const resolved = await resolveSbaFoiaResource(strParam(params, 'resource_id'));
  if (!resolved) {
    return {
      data: {
        state,
        available: false,
        loanCount: 0,
        approvalSum: 0,
        lenderNames: [],
        hint: 'SBA FOIA catalog did not expose a DataStore resource.',
      },
      endpoint: 'https://data.sba.gov/api/3/action/package_show',
    };
  }

  const url = new URL('https://data.sba.gov/api/3/action/datastore_search');
  url.searchParams.set('resource_id', resolved.resourceId);
  url.searchParams.set('q', state);
  url.searchParams.set('limit', '25');
  const res = await fetchWithTimeout(url, { headers: govHeaders() });
  if (!res.ok) throw new Error(`sba HTTP ${res.status}`);
  const payload = (await res.json()) as {
    success?: boolean;
    result?: { total?: number; records?: Array<Record<string, unknown>> };
  };
  const records = Array.isArray(payload.result?.records) ? payload.result!.records! : [];
  const names = new Set<string>();
  let approvalSum = 0;
  for (const row of records) {
    const name = pickRecordField(row, SBA_LENDER_FIELDS);
    if (name) names.add(name);
    const amount = Number(pickRecordField(row, SBA_AMOUNT_FIELDS));
    if (Number.isFinite(amount)) approvalSum += amount;
  }

  return {
    data: {
      state,
      available: true,
      loanCount: Number(payload.result?.total) || records.length,
      approvalSum,
      lenderNames: Array.from(names).slice(0, 20),
      resourceName: resolved.resourceName,
      packageId: resolved.packageId,
    },
    endpoint: url.toString(),
  };
}

const HANDLERS: Record<
  string,
  (action: string, params: Record<string, unknown>) => Promise<HandlerResult> | HandlerResult
> = {
  ecfr: handleEcfr,
  federal_register: handleFederalRegister,
  cfpb_complaints: handleCfpbComplaints,
  fdic: handleFdic,
  ncua: handleNcua,
  census_geocode: handleCensusGeocode,
  nager_holidays: handleNagerHolidays,
  zippopotam: handleZippopotam,
  courtlistener: handleCourtListener,
  hmda: handleHmda,
  sba: handleSba,
};

function geocodeCacheParams(params: Record<string, unknown>): Record<string, unknown> {
  const oneline = strParam(params, 'address') || strParam(params, 'oneline');
  if (oneline) return { address: normalizeAddress(oneline) };
  return {
    street: normalizeAddress(strParam(params, 'street')),
    city: normalizeAddress(strParam(params, 'city')),
    state: strParam(params, 'state').toUpperCase(),
    zip: strParam(params, 'zip').replace(/\D/g, '').slice(0, 5),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  let ctx;
  try {
    ctx = await resolveAuthContext(req);
  } catch (e) {
    return json({ ok: false, error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(req) || 'unknown';
  const rl = await rateLimit({
    key: `public_data:${ctx.user.id}:${ip}`,
    limit: 60,
    windowSeconds: 60,
  });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited', source: 'public-data' }, { status: 429 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const source = String(body.source || '').trim();
  const action = String(body.action || '').trim();
  const params = (body.params && typeof body.params === 'object' ? body.params : {}) as Record<string, unknown>;

  if (!source || !action) {
    return json({ ok: false, error: 'source and action are required' }, { status: 400 });
  }

  if (source === 'courtlistener' && ctx.user.id.startsWith('anon:')) {
    return json({ ok: false, error: 'admin_only', source }, { status: 403 });
  }

  const handler = HANDLERS[source];
  if (!handler) {
    return json({ ok: false, error: `Unknown source: ${source}`, source }, { status: 400 });
  }

  const bucket = SOURCE_BUCKET[source] ?? 'general';
  const cacheParams = source === 'census_geocode' ? geocodeCacheParams(params) : params;
  const key = cacheKey(source, action, cacheParams);

  const fresh = getFreshEntry(key);
  if (fresh) {
    return json({
      ok: true,
      source,
      action,
      data: fresh.value,
      endpoint: fresh.endpoint,
      cached: true,
      stale: false,
    });
  }

  try {
    const result = await handler(action, params);
    const stubNotWired =
      result.data &&
      typeof result.data === 'object' &&
      (result.data as { ok?: boolean; error?: string }).ok === false &&
      (result.data as { error?: string }).error === 'not_wired';

    if (!stubNotWired) {
      putCache(key, bucket, result.data, result.endpoint);
    }

    return json({
      ok: !stubNotWired,
      source,
      action,
      data: result.data,
      endpoint: result.endpoint,
      cached: false,
      stale: false,
      ...(stubNotWired ? { error: 'not_wired' } : {}),
    });
  } catch (e) {
    const staleEntry = getAnyEntry(key);
    const message = e instanceof Error ? e.message : 'Upstream fetch failed';
    if (staleEntry) {
      return json({
        ok: true,
        source,
        action,
        data: staleEntry.value,
        endpoint: staleEntry.endpoint,
        cached: true,
        stale: true,
        warning: message,
      });
    }
    return json({ ok: false, error: message, source });
  }
});
