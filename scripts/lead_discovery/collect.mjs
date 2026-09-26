#!/usr/bin/env node
/**
 * Compliant cold lead discovery.
 * Reads scripts/lead_discovery/catalog.json and writes gitignored local files only.
 *
 * Does NOT send email or SMS.
 * Does NOT crawl arbitrary websites for personal inboxes.
 * Does NOT call Indeed, LinkedIn, NMLS, or other blocked/manual sources.
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

const USER_AGENT = 'FinelyCredLeadDiscovery/1.0 (+https://finelycred.com; public-directory research; no outreach)';
const PAUSE_MS = 400;

const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
const titleRe = new RegExp(catalog.jobs.titlePattern, 'i');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
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

function partnerLanesFromName(name, ntee) {
  const n = String(name ?? '').toLowerCase();
  const code = String(ntee ?? '');
  if (/chamber|association|professional|lawyer|business|consortium|coalition|federation/.test(n) || /^S/.test(code)) {
    return ['affiliates'];
  }
  return [];
}

function emptyOrg(partial) {
  return {
    recordKind: 'organization',
    externalId: partial.externalId,
    organization: partial.organization,
    city: partial.city || '',
    state: partial.state || '',
    phone: partial.phone || '',
    email: partial.email || '',
    website: partial.website || '',
    lanes: [...new Set(partial.lanes || [])],
    sourceId: partial.sourceId,
    sourceUrl: partial.sourceUrl,
    matchReasons: [...new Set(partial.matchReasons || [])],
    metro: partial.metro || '',
    cold: true,
    outreach: 'do_not_contact',
  };
}

function mergeOrg(map, org) {
  const prev = map.get(org.externalId);
  if (!prev) {
    map.set(org.externalId, org);
    return;
  }
  prev.lanes = [...new Set([...prev.lanes, ...org.lanes])];
  prev.matchReasons = [...new Set([...prev.matchReasons, ...org.matchReasons])];
  if (!prev.email && org.email) prev.email = org.email;
  if (!prev.phone && org.phone) prev.phone = org.phone;
  if (!prev.website && org.website) prev.website = org.website;
  if (!prev.city && org.city) prev.city = org.city;
  if (!prev.metro && org.metro) prev.metro = org.metro;
}

async function collectPropublica(errors) {
  const map = new Map();
  const { endpoint, queries } = catalog.propublica;
  for (const query of queries) {
    const maxPages = Math.max(1, Number(query.maxPages) || 1);
    for (let page = 0; page < maxPages; page++) {
      const url = new URL(endpoint);
      url.searchParams.set('q', query.q);
      url.searchParams.set('state[id]', query.state);
      url.searchParams.set('page', String(page));
      try {
        const data = await fetchJson(url);
        const orgs = Array.isArray(data.organizations) ? data.organizations : [];
        for (const org of orgs) {
          if (!org?.ein || !org?.name) continue;
          const extra = query.lanes.includes('haitian_orgs') ? partnerLanesFromName(org.name, org.ntee_code) : [];
          mergeOrg(
            map,
            emptyOrg({
              externalId: `pp:${org.ein}`,
              organization: String(org.name).trim(),
              city: org.city || '',
              state: org.state || query.state,
              lanes: [...query.lanes, ...extra],
              sourceId: 'propublica_nonprofit',
              sourceUrl: `https://projects.propublica.org/nonprofits/organizations/${org.ein}`,
              matchReasons: [`propublica:${query.q}@${query.state}`],
            }),
          );
        }
        const numPages = Number(data.num_pages) || 1;
        if (page + 1 >= numPages || orgs.length === 0) break;
      } catch (e) {
        errors.push({ source: 'propublica', query: query.q, state: query.state, page, error: e.message });
        break;
      }
      await sleep(PAUSE_MS);
    }
    await sleep(PAUSE_MS);
  }
  return [...map.values()];
}

async function collectHud(errors) {
  const map = new Map();
  const { endpoint, distanceMiles, metros, kreyolLanguageCode, creditServiceCodes } = catalog.hud;
  for (const metro of metros) {
    const url = new URL(endpoint);
    url.searchParams.set('Lat', String(metro.lat));
    url.searchParams.set('Long', String(metro.lng));
    url.searchParams.set('Distance', String(distanceMiles));
    try {
      const data = await fetchJson(url);
      const rows = Array.isArray(data) ? data : [];
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
        if (!lanes.length) continue;
        const phone = digits(row.phone1);
        mergeOrg(
          map,
          emptyOrg({
            externalId: `hud:${id}`,
            organization: name,
            city: row.city || '',
            state: row.statecd || '',
            phone: phone.length >= 10 ? phone : '',
            email: cleanEmail(row.email),
            website: cleanWebsite(row.weburl),
            lanes,
            sourceId: 'hud_housing_counselor',
            sourceUrl: 'https://data.hud.gov/Housing_Counselor',
            matchReasons: reasons,
            metro: metro.id,
          }),
        );
      }
    } catch (e) {
      errors.push({ source: 'hud', metro: metro.id, error: e.message });
    }
    await sleep(PAUSE_MS);
  }
  return [...map.values()];
}

function readList(payload, listPath) {
  if (!listPath) return Array.isArray(payload) ? payload : [];
  const value = payload?.[listPath];
  return Array.isArray(value) ? value : [];
}

async function collectJobs(errors) {
  const postings = [];
  const seen = new Set();
  for (const api of catalog.jobs.apis) {
    try {
      const data = await fetchJson(api.url);
      const list = readList(data, api.listPath);
      for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        const title = String(item[api.titleField] ?? '').trim();
        if (!title || !titleRe.test(title)) continue;
        const organization = String(item[api.orgField] ?? '').trim();
        const url = String(item[api.urlField] ?? '').trim();
        const key = `${title.toLowerCase()}|${organization.toLowerCase()}|${url}`;
        if (seen.has(key)) continue;
        seen.add(key);
        postings.push({
          recordKind: 'employer_posting',
          lane: 'jobs',
          title,
          organization: organization || title,
          location: String(item[api.locationField] ?? '').trim(),
          url,
          sourceId: api.id,
          sourceUrl: api.docs,
          email: '',
          cold: true,
          outreach: 'do_not_contact',
          note: 'Employer posting from a public job API. Not a job-seeker contact. Do not email.',
        });
      }
    } catch (e) {
      errors.push({ source: api.id, error: e.message });
    }
    await sleep(PAUSE_MS);
  }
  return postings;
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

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const file of [OUT_JSON, OUT_CSV, OUT_COUNTS]) assertGitignored(file);

  const errors = [];
  const [propublica, hud, jobs] = await Promise.all([
    collectPropublica(errors),
    collectHud(errors),
    collectJobs(errors),
  ]);

  const orgs = [];
  const byId = new Map();
  for (const org of [...propublica, ...hud]) mergeOrg(byId, org);
  orgs.push(...byId.values());
  orgs.sort((a, b) => a.organization.localeCompare(b.organization));

  const { csv, crmRows } = toCsv(orgs);
  const counts = laneCounts(orgs, jobs);
  const payload = {
    generatedAt: new Date().toISOString(),
    policy: catalog.policy,
    counts,
    uniqueOrganizations: orgs.length,
    crmReadyRows: crmRows,
    employerPostings: jobs.length,
    manualJobQueries: catalog.jobs.manualQueries,
    sourceErrors: errors,
    organizations: orgs,
    jobPostings: jobs,
  };
  const countPayload = {
    generatedAt: payload.generatedAt,
    counts,
    uniqueOrganizations: orgs.length,
    crmReadyRows: crmRows,
    employerPostings: jobs.length,
    sourceErrorCount: errors.length,
    reminder: 'NO EMAIL. Real contacts are in collected.local.json and cold-import.local.csv only.',
  };

  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2));
  writeFileSync(OUT_CSV, csv);
  writeFileSync(OUT_COUNTS, JSON.stringify(countPayload, null, 2));

  console.log('LEAD DISCOVERY — cold directory pull');
  console.log('NO EMAIL. NO SMS. Files below are gitignored.');
  for (const [lane, stats] of Object.entries(counts)) {
    console.log(`${lane}: records=${stats.records} crm_ready=${stats.crmReady} directory_only=${stats.directoryOnly}`);
  }
  console.log(`unique_organizations=${orgs.length}`);
  console.log(`crm_csv_rows=${crmRows}`);
  console.log(`employer_postings=${jobs.length}`);
  console.log(`source_errors=${errors.length}`);
  if (errors.length) {
    for (const err of errors) console.log(`  error ${err.source}: ${err.error}`);
  }
  console.log(`wrote ${OUT_JSON}`);
  console.log(`wrote ${OUT_CSV}`);
  console.log('Do not commit those files. Do not email anyone on them.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
