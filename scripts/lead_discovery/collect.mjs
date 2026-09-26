#!/usr/bin/env node
/**
 * Compliant cold lead discovery.
 * Reads scripts/lead_discovery/catalog.json and writes gitignored local files only.
 *
 * Does NOT send email or SMS.
 * Does NOT crawl arbitrary websites for personal inboxes.
 * Does NOT call Indeed, LinkedIn, NMLS, or other blocked/manual sources.
 * Does NOT invent emails, phones, or organization names.
 *
 *   node scripts/lead_discovery/collect.mjs
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CATALOG_PATH = join(ROOT, 'scripts/lead_discovery/catalog.json');
const OUT_DIR = join(ROOT, 'data/lead-discovery');
const OUT_JSON = join(OUT_DIR, 'collected.local.json');
const OUT_CSV = join(OUT_DIR, 'cold-import.local.csv');
const OUT_COUNTS = join(OUT_DIR, 'last-run-counts.local.json');
const OUT_SUMMARY = join(OUT_DIR, 'summary.local.md');

const USER_AGENT = 'FinelyCredLeadDiscovery/1.0 (+https://finelycred.com; public-directory research; no outreach)';
const PAUSE_MS = 350;
const MAX_IN_FLIGHT = 4;

const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
const titleRe = new RegExp(catalog.jobs.titlePattern, 'i');
const hudCreditNameRe = new RegExp(catalog.hud.creditNamePattern || 'credit counsel', 'i');

const STATE_BY_NAME = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO',
  connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY',
  louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH',
  'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA',
  washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let pace = Promise.resolve();
let nextSlot = 0;
let inFlight = 0;
const flightWaiters = [];

function acquireFlight() {
  if (inFlight < MAX_IN_FLIGHT) {
    inFlight += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => flightWaiters.push(resolve));
}

function releaseFlight() {
  const next = flightWaiters.shift();
  if (next) next();
  else inFlight -= 1;
}

function takeSlot() {
  const start = pace.then(async () => {
    const wait = nextSlot - Date.now();
    if (wait > 0) await sleep(wait);
    nextSlot = Date.now() + PAUSE_MS;
  });
  pace = start.then(
    () => {},
    () => {},
  );
  return start;
}

async function paced(fn) {
  await acquireFlight();
  try {
    await takeSlot();
    return await fn();
  } finally {
    releaseFlight();
  }
}

async function fetchJson(url, { allow404 = false } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await paced(() =>
        fetch(url, {
          headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(30000),
        }),
      );
      if (res.status === 404 && allow404) {
        return { organizations: [], num_pages: 0, total_results: 0, _empty: true };
      }
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}`);
        await sleep(1200 * (attempt + 1));
        continue;
      }
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e);
      const retryable = /HTTP 5|429|timeout|aborted|network|fetch failed/i.test(msg);
      if (!retryable || attempt === 3) throw lastErr;
      await sleep(1200 * (attempt + 1));
    }
  }
  throw lastErr;
}

function digits(phone) {
  return String(phone ?? '').replace(/\D/g, '');
}

function cleanEmail(email) {
  const v = String(email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '';
  return v;
}

function cleanWebsite(url) {
  const v = String(url ?? '').trim();
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

function csvCell(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fold(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normState(value) {
  const raw = fold(value);
  if (!raw) return '';
  if (/^[a-z]{2}$/.test(raw)) return raw.toUpperCase();
  return STATE_BY_NAME[raw] || raw.toUpperCase();
}

function normOrgName(value) {
  return fold(value)
    .replace(/\b(incorporated|inc|llc|corp|corporation|ltd|pllc)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normPhone(phone) {
  let d = digits(phone);
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  return d.length === 10 ? d : '';
}

function einOf(org) {
  const fromId = String(org.externalId ?? '');
  const tagged = fromId.match(/^pp:(\d+)$/);
  const raw = tagged ? tagged[1] : String(org.ein ?? '').replace(/\D/g, '');
  if (!raw) return '';
  return raw.padStart(9, '0');
}

function normOrgCityState(org) {
  const name = normOrgName(org.organization);
  const city = fold(org.city);
  const state = normState(org.state);
  if (!name || !city || !state) return '';
  return `${name}|${city}|${state}`;
}

function compileOptional(pattern) {
  if (!pattern) return null;
  return new RegExp(pattern, 'i');
}

function classifyExtra(name, ntee) {
  const lanes = [];
  const reasons = [];
  const label = String(name ?? '');
  const code = String(ntee ?? '').trim();
  if (
    /\b(chamber|association|alliance|coalition|federation|consortium|league|civic|realtor|guild)\b/i.test(label) ||
    /bar association|business league|professional society/i.test(label)
  ) {
    lanes.push('affiliates');
    reasons.push('name:referral-org');
  }
  if (/^(S|L)/i.test(code) || /^P(20|51|52|84)/i.test(code)) {
    lanes.push('affiliates');
    reasons.push(`ntee:${code}`);
  }
  if (/^P51/i.test(code)) {
    lanes.push('specialists');
    reasons.push(`ntee-specialist:${code}`);
  }
  if (/credit counsel|consumer credit counsel|financial counsel|housing counsel|financial literacy|debt management/i.test(label)) {
    lanes.push('specialists', 'affiliates');
    reasons.push('name:counseling-office');
  }
  if (/\b(haitian|haiti|kreyol|ayisyen)\b/i.test(label)) {
    lanes.push('haitian_orgs');
    reasons.push('name:haitian');
  }
  return { lanes, reasons };
}

function emptyOrg(partial) {
  const sourceId = partial.sourceId;
  return {
    recordKind: 'organization',
    externalId: partial.externalId,
    organization: partial.organization,
    city: partial.city || '',
    state: normState(partial.state),
    phone: partial.phone || '',
    email: partial.email || '',
    website: partial.website || '',
    nteeCode: partial.nteeCode || '',
    lanes: [...new Set(partial.lanes || [])],
    sourceId,
    sourceIds: [...new Set(partial.sourceIds || (sourceId ? [sourceId] : []))],
    sourceUrl: partial.sourceUrl,
    matchReasons: [...new Set(partial.matchReasons || [])],
    metro: partial.metro || '',
    cold: true,
    outreach: 'do_not_contact',
  };
}

function absorb(prev, org) {
  prev.lanes = [...new Set([...prev.lanes, ...org.lanes])];
  prev.matchReasons = [...new Set([...prev.matchReasons, ...org.matchReasons])];
  prev.sourceIds = [...new Set([...(prev.sourceIds || []), ...(org.sourceIds || []), prev.sourceId, org.sourceId].filter(Boolean))];
  if (!prev.email && org.email) {
    prev.email = org.email;
    prev.sourceId = org.sourceId || prev.sourceId;
    prev.sourceUrl = org.sourceUrl || prev.sourceUrl;
  }
  if (!prev.phone && org.phone) prev.phone = org.phone;
  if (!prev.website && org.website) prev.website = org.website;
  if (!prev.city && org.city) prev.city = org.city;
  if (!prev.state && org.state) prev.state = org.state;
  if (!prev.metro && org.metro) prev.metro = org.metro;
  if (!prev.nteeCode && org.nteeCode) prev.nteeCode = org.nteeCode;
  if (String(org.externalId).startsWith('pp:') && !String(prev.externalId).startsWith('pp:')) {
    prev.externalId = org.externalId;
    if (!prev.email) {
      prev.sourceId = org.sourceId || prev.sourceId;
      prev.sourceUrl = org.sourceUrl || prev.sourceUrl;
    }
  }
  return prev;
}

function mergeOrg(map, org) {
  const prev = map.get(org.externalId);
  if (!prev) {
    map.set(org.externalId, org);
    return;
  }
  absorb(prev, org);
}

function dedupeOrganizations(list) {
  const parent = list.map((_, i) => i);
  const find = (i) => {
    let x = i;
    while (parent[x] !== x) x = parent[x];
    let y = i;
    while (parent[y] !== y) {
      const next = parent[y];
      parent[y] = x;
      y = next;
    }
    return x;
  };
  const union = (a, b) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent[pb] = pa;
  };
  const indexes = {
    ein: new Map(),
    email: new Map(),
    phone: new Map(),
    org: new Map(),
  };
  list.forEach((org, i) => {
    const pairs = [
      ['ein', einOf(org)],
      ['email', cleanEmail(org.email)],
      ['phone', normPhone(org.phone)],
      ['org', normOrgCityState(org)],
    ];
    for (const [kind, val] of pairs) {
      if (!val) continue;
      const idx = indexes[kind];
      if (idx.has(val)) union(i, idx.get(val));
      else idx.set(val, i);
    }
  });
  const groups = new Map();
  list.forEach((org, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(org);
  });
  const merged = [];
  for (const group of groups.values()) {
    const [first, ...rest] = group;
    const acc = emptyOrg(first);
    for (const org of rest) absorb(acc, org);
    merged.push(acc);
  }
  return merged;
}

function expandPropublicaQueries(pp) {
  if (!Array.isArray(pp.keywords) || pp.keywords.length === 0) return pp.queries || [];
  const states = (pp.states || []).map((s) => String(s).toUpperCase());
  const scopes = [];
  if (pp.includeNational !== false) scopes.push('');
  scopes.push(...states);
  const maxPages = Math.max(1, Number(pp.maxPages) || 120);
  const queries = [];
  for (const keyword of pp.keywords) {
    for (const state of scopes) {
      queries.push({
        ...keyword,
        state,
        maxPages: Math.max(1, Number(keyword.maxPages) || maxPages),
        _nameMust: compileOptional(keyword.nameMustMatch),
        _nameNot: compileOptional(keyword.nameMustNotMatch),
        _relevance: compileOptional(keyword.relevanceMustMatch),
      });
    }
  }
  return queries;
}

function passesNameFilters(name, query) {
  if (query._nameMust && !query._nameMust.test(name)) return 'name_mismatch';
  if (query._nameNot && query._nameNot.test(name)) return 'name_excluded';
  if (query._relevance && !query._relevance.test(name)) return 'relevance';
  return '';
}

async function collectPropublica(errors) {
  const map = new Map();
  const queries = expandPropublicaQueries(catalog.propublica);
  const queryStats = [];
  for (const query of queries) {
    const stat = {
      q: query.q,
      state: query.state || 'US',
      reported: 0,
      pagesFetched: 0,
      kept: 0,
      droppedName: 0,
      droppedExcluded: 0,
      droppedRelevance: 0,
      empty: false,
      capped: false,
      error: '',
    };
    const maxPages = query.maxPages;
    let numPages = 1;
    for (let page = 0; page < maxPages; page++) {
      const url = new URL(catalog.propublica.endpoint);
      url.searchParams.set('q', query.q);
      if (query.state) url.searchParams.set('state[id]', query.state);
      url.searchParams.set('page', String(page));
      let data;
      try {
        data = await fetchJson(url, { allow404: true });
      } catch (e) {
        stat.error = e instanceof Error ? e.message : String(e);
        errors.push({ source: 'propublica', query: query.q, state: stat.state, page, error: stat.error });
        break;
      }
      stat.pagesFetched += 1;
      if (data?._empty) {
        stat.empty = page === 0;
        break;
      }
      const orgs = Array.isArray(data.organizations) ? data.organizations : [];
      if (page === 0) stat.reported = Number(data.total_results) || orgs.length;
      numPages = Number(data.num_pages) || 1;
      for (const org of orgs) {
        if (!org?.ein || !org?.name) continue;
        const why = passesNameFilters(String(org.name), query);
        if (why === 'name_mismatch') {
          stat.droppedName += 1;
          continue;
        }
        if (why === 'name_excluded') {
          stat.droppedExcluded += 1;
          continue;
        }
        if (why === 'relevance') {
          stat.droppedRelevance += 1;
          continue;
        }
        const extra = classifyExtra(org.name, org.ntee_code);
        const ein = String(org.ein).replace(/\D/g, '').padStart(9, '0');
        mergeOrg(
          map,
          emptyOrg({
            externalId: `pp:${ein}`,
            organization: String(org.name).trim(),
            city: org.city || '',
            state: org.state || query.state,
            nteeCode: org.ntee_code || '',
            lanes: [...query.lanes, ...extra.lanes],
            sourceId: 'propublica_nonprofit',
            sourceUrl: `https://projects.propublica.org/nonprofits/organizations/${ein}`,
            matchReasons: [`propublica:${query.q}@${stat.state}`, ...extra.reasons],
          }),
        );
        stat.kept += 1;
      }
      if (page + 1 >= numPages || orgs.length === 0) break;
      if (page + 1 >= maxPages && numPages > maxPages) stat.capped = true;
    }
    queryStats.push(stat);
    console.log(
      `propublica q=${JSON.stringify(query.q)} state=${stat.state} reported=${stat.reported} pages=${stat.pagesFetched} kept_rows=${stat.kept} dropped=${stat.droppedName + stat.droppedExcluded + stat.droppedRelevance}${stat.capped ? ' CAPPED' : ''}${stat.error ? ` error=${stat.error}` : ''}`,
    );
  }
  return { orgs: [...map.values()], queryStats };
}

async function collectHud(errors) {
  const map = new Map();
  const { endpoint, distanceMiles, metros, kreyolLanguageCode, creditServiceCodes } = catalog.hud;
  let rowsSeen = 0;
  let rowsKept = 0;
  for (const metro of metros) {
    const url = new URL(endpoint);
    url.searchParams.set('Lat', String(metro.lat));
    url.searchParams.set('Long', String(metro.lng));
    url.searchParams.set('Distance', String(distanceMiles));
    try {
      const data = await fetchJson(url);
      const rows = Array.isArray(data) ? data : [];
      rowsSeen += rows.length;
      let keptHere = 0;
      for (const row of rows) {
        const name = String(row.nme ?? '').trim();
        const id = String(row.agcid ?? '').trim();
        if (!name || !id) continue;
        const languages = String(row.languages ?? '')
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        const services = String(row.services ?? '')
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        const lanes = [];
        const reasons = [];
        if (languages.includes(String(kreyolLanguageCode).toUpperCase())) {
          lanes.push('haitian_orgs', 'affiliates');
          reasons.push(`language:${kreyolLanguageCode}`);
        }
        const credit = services.filter((code) => creditServiceCodes.includes(code));
        if (credit.length) {
          lanes.push('specialists', 'affiliates');
          reasons.push(...credit.map((code) => `service:${code}`));
        }
        if (hudCreditNameRe.test(name)) {
          lanes.push('specialists', 'affiliates');
          reasons.push('name:credit-counseling');
        }
        const extra = classifyExtra(name, '');
        lanes.push(...extra.lanes);
        reasons.push(...extra.reasons);
        if (!lanes.length) continue;
        const phone = normPhone(row.phone1);
        mergeOrg(
          map,
          emptyOrg({
            externalId: `hud:${id}`,
            organization: name,
            city: row.city || '',
            state: row.statecd || '',
            phone,
            email: cleanEmail(row.email),
            website: cleanWebsite(row.weburl),
            lanes,
            sourceId: 'hud_housing_counselor',
            sourceUrl: 'https://data.hud.gov/Housing_Counselor',
            matchReasons: reasons,
            metro: metro.id,
          }),
        );
        keptHere += 1;
        rowsKept += 1;
      }
      console.log(`hud metro=${metro.id} rows=${rows.length} kept_rows=${keptHere}`);
    } catch (e) {
      errors.push({ source: 'hud', metro: metro.id, error: e instanceof Error ? e.message : String(e) });
      console.log(`hud metro=${metro.id} error=${e instanceof Error ? e.message : e}`);
    }
  }
  return {
    orgs: [...map.values()],
    stats: { metros: metros.length, rowsSeen, rowsKept, uniqueAgencies: map.size },
  };
}

function readList(payload, listPath) {
  if (!listPath) return Array.isArray(payload) ? payload : [];
  const value = payload?.[listPath];
  return Array.isArray(value) ? value : [];
}

function nextPageUrl(data, current) {
  const raw = data?.links?.next || data?.next || '';
  if (!raw || typeof raw !== 'string') return '';
  try {
    const resolved = new URL(raw, current).href;
    if (resolved === current) return '';
    return resolved;
  } catch {
    return '';
  }
}

async function collectJobs(errors) {
  const postings = [];
  const seen = new Set();
  const bySource = {};
  for (const api of catalog.jobs.apis) {
    let url = api.url;
    const maxPages = Math.max(1, Number(api.maxPages) || 1);
    let pages = 0;
    let matched = 0;
    while (url && pages < maxPages) {
      pages += 1;
      let data;
      try {
        data = await fetchJson(url);
      } catch (e) {
        errors.push({ source: api.id, error: e instanceof Error ? e.message : String(e) });
        break;
      }
      const list = readList(data, api.listPath);
      for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        const title = String(item[api.titleField] ?? '').trim();
        if (!title || !titleRe.test(title)) continue;
        const organization = String(item[api.orgField] ?? '').trim();
        const postingUrl = String(item[api.urlField] ?? '').trim();
        const key = `${title.toLowerCase()}|${organization.toLowerCase()}|${postingUrl}`;
        if (seen.has(key)) continue;
        seen.add(key);
        matched += 1;
        postings.push({
          recordKind: 'employer_posting',
          lane: 'jobs',
          title,
          organization: organization || title,
          location: String(item[api.locationField] ?? '').trim(),
          url: postingUrl,
          sourceId: api.id,
          sourceUrl: api.docs,
          email: '',
          cold: true,
          outreach: 'do_not_contact',
          note: 'Employer posting from a public job API. Not a job-seeker contact. Do not email.',
        });
      }
      const next = nextPageUrl(data, url);
      url = next;
      if (!next) break;
    }
    bySource[api.id] = { pages, matched };
    console.log(`jobs source=${api.id} pages=${pages} matched=${matched}`);
  }
  return { postings, bySource };
}

function laneCounts(orgs, postings) {
  const lanes = ['affiliates', 'specialists', 'haitian_orgs', 'jobs'];
  const counts = {};
  for (const lane of lanes) {
    const inLane = lane === 'jobs' ? postings : orgs.filter((o) => o.lanes.includes(lane));
    const withEmail = inLane.filter((o) => cleanEmail(o.email));
    counts[lane] = {
      records: inLane.length,
      crmReady: withEmail.length,
      directoryOnly: inLane.length - withEmail.length,
    };
  }
  return counts;
}

function tally(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = keyFn(item) || 'unknown';
    out[key] = (out[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function keywordParticipation(orgs) {
  const counts = {};
  for (const org of orgs) {
    const seen = new Set();
    for (const reason of org.matchReasons || []) {
      const match = String(reason).match(/^propublica:(.+)@/);
      if (match) seen.add(match[1]);
    }
    for (const key of seen) counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function toCsv(orgs) {
  const header = [
    'Full name',
    'Phone number',
    'Email',
    'State guess',
    'Lane',
    'Organization',
    'Website',
    'Source',
    'Source URL',
  ];
  const lines = [header.join(',')];
  const seenEmail = new Set();
  for (const org of orgs) {
    const email = cleanEmail(org.email);
    if (!email || seenEmail.has(email)) continue;
    seenEmail.add(email);
    lines.push(
      [
        org.organization,
        org.phone,
        email,
        org.state,
        org.lanes.join('|'),
        org.organization,
        org.website,
        org.sourceId,
        org.sourceUrl,
      ]
        .map(csvCell)
        .join(','),
    );
  }
  return { csv: `${lines.join('\n')}\n`, crmRows: lines.length - 1 };
}

function assertGitignored(file) {
  try {
    execSync(`git check-ignore -q -- ${JSON.stringify(file)}`, { cwd: ROOT, stdio: 'ignore' });
  } catch {
    throw new Error(`Refusing to write ${file} — path is not gitignored`);
  }
}

function stripContacts(value) {
  return String(value ?? '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[phone]');
}

function mdTable(headers, rows) {
  const head = `| ${headers.join(' | ')} |`;
  const rule = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.map((cell) => stripContacts(cell)).join(' | ')} |`);
  return [head, rule, ...body].join('\n');
}

function buildSummary(countPayload) {
  const lines = [];
  lines.push('# Lead discovery local summary');
  lines.push('');
  lines.push('NO EMAIL. NO SMS. This file is gitignored. Do not commit it.');
  lines.push('');
  lines.push(`Generated: ${countPayload.generatedAt}`);
  lines.push('');
  lines.push('## Paths');
  lines.push('');
  lines.push(`- JSON: \`${OUT_JSON}\``);
  lines.push(`- CSV (email rows only): \`${OUT_CSV}\``);
  lines.push(`- Counts: \`${OUT_COUNTS}\``);
  lines.push(`- This summary: \`${OUT_SUMMARY}\``);
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  lines.push(`- Unique organizations after dedupe: **${countPayload.uniqueOrganizations}**`);
  lines.push(`- Wave 1 baseline unique organizations: **${countPayload.wave1UniqueOrganizations}**`);
  lines.push(`- Rows with a public email (CSV): **${countPayload.crmReadyRows}**`);
  lines.push(`- Employer postings: **${countPayload.employerPostings}**`);
  lines.push(`- Combined records before cross-source dedupe: ${countPayload.dedupe.before}`);
  lines.push(`- Removed as duplicates: ${countPayload.dedupe.removed}`);
  lines.push(`- Source errors: ${countPayload.sourceErrorCount}`);
  lines.push('');
  lines.push('## Lanes');
  lines.push('');
  lines.push(mdTable(['Lane', 'Records', 'With public email', 'Directory only'], Object.entries(countPayload.counts).map(([lane, stats]) => [lane, stats.records, stats.crmReady, stats.directoryOnly])));
  lines.push('');
  lines.push('## Sources');
  lines.push('');
  lines.push(mdTable(['Source', 'Unique orgs'], Object.entries(countPayload.bySource).map(([k, v]) => [k, v])));
  lines.push('');
  lines.push('## States');
  lines.push('');
  lines.push(mdTable(['State', 'Unique orgs'], Object.entries(countPayload.byState).map(([k, v]) => [k, v])));
  lines.push('');
  lines.push('## ProPublica keyword participation (unique orgs)');
  lines.push('');
  lines.push(mdTable(['Keyword', 'Unique orgs'], Object.entries(countPayload.byKeyword).map(([k, v]) => [k, v])));
  lines.push('');
  lines.push('## HUD');
  lines.push('');
  lines.push(`- Metros queried: ${countPayload.hud.metros}`);
  lines.push(`- Locator rows seen: ${countPayload.hud.rowsSeen}`);
  lines.push(`- Rows matching filters: ${countPayload.hud.rowsKept}`);
  lines.push(`- Unique agencies before cross-source dedupe: ${countPayload.hud.uniqueAgencies}`);
  lines.push('');
  lines.push('## Jobs');
  lines.push('');
  lines.push(mdTable(['API', 'Pages', 'Title matches'], Object.entries(countPayload.jobsBySource).map(([id, stats]) => [id, stats.pages, stats.matched])));
  lines.push('');
  if (countPayload.apiCaps.length) {
    lines.push('## API caps');
    lines.push('');
    for (const cap of countPayload.apiCaps) lines.push(`- ${stripContacts(cap)}`);
    lines.push('');
  }
  lines.push('Consent stays false on import. Do not email anyone on these files.');
  lines.push('');
  return lines.join('\n');
}

function assertOfflineFilters() {
  const sample = expandPropublicaQueries({
    keywords: catalog.propublica.keywords.filter((k) => k.q === 'creole' || k.q === 'haitian'),
    states: ['FL'],
    includeNational: false,
    maxPages: 1,
  });
  const creole = sample.find((q) => q.q === 'creole');
  const haitian = sample.find((q) => q.q === 'haitian');
  if (!creole || !haitian) throw new Error('offline filter check missing keywords');
  if (passesNameFilters('Create Church', creole) === '') throw new Error('creole filter kept a fuzzy Create hit');
  if (passesNameFilters('Creole Cuisine Cares', creole) === '') throw new Error('creole filter kept a food hit');
  if (passesNameFilters('Creole Heritage Society', creole) !== '') throw new Error('creole filter dropped a heritage society');
  if (passesNameFilters('Haitian American Community', haitian) !== '') throw new Error('haitian filter dropped a real name');
  const merged = dedupeOrganizations([
    emptyOrg({
      externalId: 'pp:000000001',
      organization: 'Example Counseling Inc',
      city: 'Miami',
      state: 'FL',
      lanes: ['haitian_orgs'],
      sourceId: 'propublica_nonprofit',
      sourceUrl: 'https://example.org/pp',
      matchReasons: ['propublica:haitian@FL'],
    }),
    emptyOrg({
      externalId: 'hud:9',
      organization: 'Example Counseling',
      city: 'Miami',
      state: 'Florida',
      lanes: ['specialists'],
      sourceId: 'hud_housing_counselor',
      email: 'office@example.com',
      phone: '3055550100',
      sourceUrl: 'https://example.org/hud',
      matchReasons: ['service:FBC'],
    }),
    emptyOrg({
      externalId: 'hud:10',
      organization: 'Other Agency',
      city: 'Tampa',
      state: 'FL',
      lanes: ['affiliates'],
      sourceId: 'hud_housing_counselor',
      email: 'office@example.com',
      sourceUrl: 'https://example.org/hud2',
      matchReasons: ['service:FBW'],
    }),
  ]);
  if (merged.length !== 1) throw new Error(`dedupe expected 1 org, got ${merged.length}`);
  const only = merged[0];
  if (only.email !== 'office@example.com') throw new Error('dedupe did not keep the public email');
  if (!only.lanes.includes('haitian_orgs') || !only.lanes.includes('specialists') || !only.lanes.includes('affiliates')) {
    throw new Error('dedupe did not union lanes');
  }
  if (!String(only.externalId).startsWith('pp:')) throw new Error('dedupe did not prefer the EIN id');
}

async function main() {
  assertOfflineFilters();
  if (process.argv.includes('--filters-only')) {
    console.log('offline filters ok');
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  for (const file of [OUT_JSON, OUT_CSV, OUT_COUNTS, OUT_SUMMARY]) assertGitignored(file);

  const errors = [];
  const [propublica, hud, jobs] = await Promise.all([
    collectPropublica(errors),
    collectHud(errors),
    collectJobs(errors),
  ]);

  const before = propublica.orgs.length + hud.orgs.length;
  const orgs = dedupeOrganizations([...propublica.orgs, ...hud.orgs]);
  orgs.sort((a, b) => a.organization.localeCompare(b.organization) || a.state.localeCompare(b.state));

  const { csv, crmRows } = toCsv(orgs);
  const counts = laneCounts(orgs, jobs.postings);
  const focusStates = new Set((catalog.propublica.states || []).map((s) => String(s).toUpperCase()));
  const inFocus = orgs.filter((o) => focusStates.has(o.state)).length;
  const apiCaps = propublica.queryStats
    .filter((s) => s.capped)
    .map((s) => `propublica ${s.q} @ ${s.state}: stopped at catalog maxPages after ${s.pagesFetched} pages (reported ${s.reported})`);
  const payload = {
    generatedAt: new Date().toISOString(),
    policy: catalog.policy,
    counts,
    uniqueOrganizations: orgs.length,
    wave1UniqueOrganizations: 331,
    crmReadyRows: crmRows,
    employerPostings: jobs.postings.length,
    manualJobQueries: catalog.jobs.manualQueries,
    sourceErrors: errors.map((err) => ({ ...err, error: stripContacts(err.error) })),
    organizations: orgs,
    jobPostings: jobs.postings,
  };
  const countPayload = {
    generatedAt: payload.generatedAt,
    wave1UniqueOrganizations: 331,
    uniqueOrganizations: orgs.length,
    crmReadyRows: crmRows,
    employerPostings: jobs.postings.length,
    counts,
    dedupe: { before, removed: before - orgs.length, after: orgs.length },
    bySource: tally(orgs, (o) => (o.sourceIds || [o.sourceId]).slice().sort().join('+') || o.sourceId),
    byState: tally(orgs, (o) => o.state || 'unknown'),
    byKeyword: keywordParticipation(orgs),
    focusStateOrgs: inFocus,
    focusStates: [...focusStates],
    hud: hud.stats,
    hudMetroIds: catalog.hud.metros.map((m) => m.id),
    jobsBySource: jobs.bySource,
    propublicaQueries: propublica.queryStats,
    apiCaps,
    sourceErrorCount: errors.length,
    sourceErrors: payload.sourceErrors,
    reminder: 'NO EMAIL. Real contacts are in collected.local.json and cold-import.local.csv only.',
  };
  const summary = buildSummary(countPayload);
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(summary)) {
    throw new Error('Refusing to write summary.local.md — email pattern detected');
  }

  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2));
  writeFileSync(OUT_CSV, csv);
  writeFileSync(OUT_COUNTS, JSON.stringify(countPayload, null, 2));
  writeFileSync(OUT_SUMMARY, summary);

  console.log('LEAD DISCOVERY — cold directory pull');
  console.log('NO EMAIL. NO SMS. Files below are gitignored.');
  for (const [lane, stats] of Object.entries(counts)) {
    console.log(`${lane}: records=${stats.records} crm_ready=${stats.crmReady} directory_only=${stats.directoryOnly}`);
  }
  console.log(`unique_organizations=${orgs.length}`);
  console.log(`crm_csv_rows=${crmRows}`);
  console.log(`employer_postings=${jobs.postings.length}`);
  console.log(`deduped_away=${before - orgs.length}`);
  console.log(`source_errors=${errors.length}`);
  console.log(`api_caps=${apiCaps.length}`);
  console.log(`wrote ${OUT_JSON}`);
  console.log(`wrote ${OUT_CSV}`);
  console.log(`wrote ${OUT_SUMMARY}`);
  console.log('Do not commit those files. Do not email anyone on them.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
