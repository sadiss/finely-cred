#!/usr/bin/env node
/**
 * Wave 3 contact enrichment.
 * Reads gitignored website rows and copies prior public emails through.
 * Fetches each real website (homepage, /contact, /about, /en-contact) and
 * keeps published mailto / visible contact addresses.
 *
 * Does NOT send email or SMS.
 * Does NOT call ProPublica or any name-only directory.
 * Does NOT guess a staff inbox from a person's name.
 * Does NOT invent emails, phones, or organization names.
 *
 *   node scripts/lead_discovery/enrich.mjs
 *   node scripts/lead_discovery/enrich.mjs --self-check
 */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_DIR = join(ROOT, 'data/lead-discovery');
const DEFAULT_QUEUE = join(OUT_DIR, 'enrich-queue-websites.local.csv');
const DEFAULT_READY = join(OUT_DIR, 'email-ready.local.csv');
const OUT_CSV = join(OUT_DIR, 'enriched-emails.local.csv');
const OUT_REPORT = join(OUT_DIR, 'enrichment-report.local.md');
const OUT_COUNTS = join(OUT_DIR, 'enrichment-counts.local.json');
const CHECKPOINT = join(OUT_DIR, 'enrich-checkpoint.local.json');
const ARTIFACT_DIR = join(ROOT, 'artifacts');
const CURSOR_ARTIFACTS = '/opt/cursor/artifacts';

const USER_AGENT = 'FinelyCredLeadDiscovery/1.0 (+https://finelycred.com; public-contact research; no outreach)';
const HOST_PAUSE_MS = 150;
const MAX_IN_FLIGHT = 8;
const PAGE_TIMEOUT_MS = 10000;
const MAX_BODY = 700_000;
const MAX_EMAILS_PER_ORG = 8;
const MAX_PAGES_PER_HOST = 8;

const BLOCK_TLDS = new Set(
  'png jpg jpeg gif svg webp ico css js mjs ts json map woff woff2 ttf eot html htm php asp aspx comi'.split(' '),
);
const BLOCK_LOCAL = new Set(
  'example test email youremail yourname name user username someone somebody null undefined asdf qwerty xxx abc foo bar postmaster abuse hostmaster'.split(
    ' ',
  ),
);
const BLOCK_DOMAINS = new Set(
  [
    'example.com',
    'example.org',
    'example.net',
    'test.com',
    'email.com',
    'domain.com',
    'sentry.io',
    'wixpress.com',
    'sentry-next.wixpress.com',
    'schema.org',
    'gravatar.com',
    'wordpress.com',
    'wordpress.org',
    'w3.org',
    'googleapis.com',
    'gstatic.com',
    'cloudflare.com',
    'squarespace.com',
    'godaddy.com',
    'mysite.com',
    'yoursite.com',
    'yourdomain.com',
    'doe.com',
    'latofonts.com',
    'mozilla.org',
    'github.com',
    'github.io',
    'wix.com',
    'ionos.com',
    'hostgator.com',
    'bluehost.com',
    'google.com',
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
    'youtube.com',
    'company.com',
  ],
);
const FREE_MAIL = new Set(
  'gmail.com yahoo.com hotmail.com outlook.com aol.com icloud.com me.com msn.com live.com comcast.net sbcglobal.net att.net verizon.net ymail.com proton.me protonmail.com gmx.com mail.com'.split(
    ' ',
  ),
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQ = false;
  const src = String(text ?? '').replace(/^\uFEFF/, '');
  while (i < src.length) {
    const c = src[i];
    if (inQ) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQ = true;
      i += 1;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((cell) => String(cell).trim() !== '')).map((r) => {
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = r[idx] ?? '';
    });
    return obj;
  });
}

function csvCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function assertGitignored(file) {
  try {
    execSync(`git check-ignore -q -- ${JSON.stringify(file)}`, { cwd: ROOT, stdio: 'ignore' });
  } catch {
    throw new Error(`Refusing to write ${file} — path is not gitignored`);
  }
}

export function classifyWebsite(raw) {
  let s = String(raw ?? '').trim();
  if (!s) return { ok: false, reason: 'empty' };
  if (/^(https?:\/\/)?n\/a\/?$/i.test(s)) return { ok: false, reason: 'na' };
  if (/site\.notavailable/i.test(s)) return { ok: false, reason: 'placeholder' };
  s = s.replace(/^https?:\/\/\./i, (m) => m.replace('.', ''));
  if (/\s/.test(s)) return { ok: false, reason: 'address' };
  if (!/^https?:\/\//i.test(s)) return { ok: false, reason: 'not-url' };
  let u;
  try {
    u = new URL(s);
  } catch {
    return { ok: false, reason: 'unparseable' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { ok: false, reason: 'bad-protocol' };
  const host = u.hostname.toLowerCase();
  if (!host || !host.includes('.') || host.startsWith('.') || host.endsWith('.') || host.includes('..')) {
    return { ok: false, reason: 'bad-host' };
  }
  if (!/^[a-z0-9.-]+$/.test(host)) return { ok: false, reason: 'bad-host' };
  const bare = host.replace(/^www\./, '');
  return { ok: true, href: u.href, origin: u.origin, host: bare, seed: u.href };
}

export function registrable(host) {
  const h = String(host ?? '')
    .toLowerCase()
    .replace(/^www\./, '')
    .split(':')[0];
  const parts = h.split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');
  const two = parts.slice(-2).join('.');
  const multi = new Set(['co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'com.br', 'com.mx']);
  if (multi.has(two) && parts.length >= 3) return parts.slice(-3).join('.');
  return two;
}

function domainMatches(emailDomain, hosts) {
  const emailRoot = registrable(emailDomain);
  return hosts.some((host) => {
    const root = registrable(host);
    return emailRoot === root || emailDomain === host || emailDomain.endsWith(`.${root}`);
  });
}

export function normalizeEmail(raw) {
  let v = String(raw ?? '').trim().toLowerCase();
  v = v.replace(/^mailto:/i, '');
  const q = v.indexOf('?');
  if (q >= 0) v = v.slice(0, q);
  v = v.replace(/^<|>$/g, '').replace(/%20/gi, '').replace(/[),.;:\]]+$/g, '');
  try {
    v = decodeURIComponent(v);
  } catch {
    /* keep raw */
  }
  v = v.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._%+\-]{0,63}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(v)) {
    return '';
  }
  if (v.includes('..')) return '';
  const at = v.lastIndexOf('@');
  const local = v.slice(0, at);
  const domain = v.slice(at + 1);
  if (!local || !domain || local.length > 64 || domain.length > 253) return '';
  const tld = domain.split('.').pop();
  if (BLOCK_TLDS.has(tld)) return '';
  if (BLOCK_LOCAL.has(local)) return '';
  if (BLOCK_DOMAINS.has(domain)) return '';
  if (domain.endsWith('.example') || domain.includes('example.com') || domain.includes('example.org')) return '';
  if (/^(noreply|no-reply|donotreply|do-not-reply|no_reply)/.test(local)) return '';
  if (/spamtrap|not-a-real|invalid|example/.test(local)) return '';
  if (/^[0-9a-f]{20,}$/.test(local)) return '';
  return v;
}

export function decodeCfEmail(hex) {
  const clean = String(hex ?? '').trim();
  if (!/^[0-9a-f]+$/i.test(clean) || clean.length < 4 || clean.length % 2 !== 0) return '';
  const key = parseInt(clean.slice(0, 2), 16);
  let out = '';
  for (let i = 2; i < clean.length; i += 2) {
    out += String.fromCharCode(parseInt(clean.slice(i, i + 2), 16) ^ key);
  }
  return out;
}

function decodeHtml(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const cp = parseInt(h, 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
    })
    .replace(/&#(\d+);/g, (_, n) => {
      const cp = parseInt(n, 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
    })
    .replace(/&commat;/gi, '@')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&nbsp;/gi, ' ');
}

function stripCommentsAndHidden(html) {
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<input\b[^>]*type=["']hidden["'][^>]*>/gi, ' ');
}

function isSocialHost(hostname) {
  const h = String(hostname ?? '').toLowerCase().replace(/^www\./, '');
  const bases = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'youtube.com', 'tiktok.com', 'linktr.ee', 't.me', 'wa.me'];
  if (bases.some((d) => h === d || h.endsWith(`.${d}`))) return true;
  if (/^(maps|accounts)\.google\.com$/.test(h) || h === 'goo.gl' || h === 'bit.ly') return true;
  return false;
}

function isParked(html) {
  const head = String(html).slice(0, 8000).toLowerCase();
  if (/mailto:/i.test(html)) return false;
  return /sedoparking|hugedomains|dan\.com\/buy-domain|this domain is for sale|domain may be for sale|buy this domain|parked domain|godaddy parking page/.test(head);
}

function pageHasContactForm(html, pageUrl) {
  const hasForm = /<form\b/i.test(html);
  if (!hasForm) return false;
  const emailInput = /type=["']email["']/i.test(html) || /name=["'][^"']*email/i.test(html);
  const pathContact = /contact|connect|get-in-touch|en-contact/i.test(pageUrl);
  return emailInput || pathContact;
}

function sourceScore(url) {
  const path = String(url || '').toLowerCase();
  if (/contact/.test(path)) return 3;
  if (/about/.test(path)) return 2;
  return 1;
}

function roleRank(email) {
  const local = email.split('@')[0];
  if (
    /^(info|contact|hello|office|admin|inquir|intake|help|support|housing|counsel|programs|outreach|team|general|main|frontdesk|reception|partners|referrals|clients|apply|ask|media|press|webmaster|homeownership|credit|education|services|mail)/.test(
      local,
    )
  ) {
    return 0;
  }
  if (local.includes('.')) return 2;
  return 1;
}

export function capEmails(list, max = MAX_EMAILS_PER_ORG) {
  const sorted = [...list].sort((a, b) => roleRank(a.email) - roleRank(b.email) || a.email.localeCompare(b.email));
  const seen = new Set();
  const out = [];
  for (const item of sorted) {
    if (!item.email || seen.has(item.email)) continue;
    seen.add(item.email);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

function rememberEmail(bucket, email, sourcePage, via, siteHosts, allowThirdParty) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  const domain = normalized.split('@')[1];
  const same = domainMatches(domain, siteHosts);
  const freemail = FREE_MAIL.has(domain);
  if (!same && !allowThirdParty && !freemail) return;
  const prev = bucket.get(normalized);
  if (!prev || sourceScore(sourcePage) > sourceScore(prev.sourcePage)) {
    bucket.set(normalized, { email: normalized, sourcePage, via });
  }
}

export function extractEmails(html, pageUrl, siteHosts) {
  const bucket = new Map();
  const hosts = (siteHosts || []).map((h) => String(h).toLowerCase()).filter(Boolean);
  let raw = stripCommentsAndHidden(String(html ?? ''));
  const cfRe = /(?:data-cfemail=["']|\/cdn-cgi\/l\/email-protection#)([0-9a-f]+)/gi;
  let cf;
  while ((cf = cfRe.exec(raw))) {
    rememberEmail(bucket, decodeCfEmail(cf[1]), pageUrl, 'cfemail', hosts, true);
  }
  raw = decodeHtml(raw);

  const mailtoRe = /mailto:([^"'>\s]+)/gi;
  let m;
  while ((m = mailtoRe.exec(raw))) {
    rememberEmail(bucket, m[1], pageUrl, 'mailto', hosts, true);
  }

  const jsonRe = /"(?:email|e-mail)"\s*:\s*"([^"]+)"/gi;
  while ((m = jsonRe.exec(raw))) {
    rememberEmail(bucket, m[1], pageUrl, 'jsonld', hosts, false);
  }

  const visible = raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const deob = visible
    .replace(/\s*[\[({]\s*(?:at)\s*[\])}]\s*/gi, '@')
    .replace(/\s*[\[({]\s*dot\s*[\])}]\s*/gi, '.')
    .replace(/\b([a-z0-9._%+\-]{1,64})\s+(?:at)\s+([a-z0-9.-]{1,253})\s+(?:dot)\s+([a-z]{2,24})\b/gi, '$1@$2.$3');
  const emailRe = /\b([a-z0-9][a-z0-9._%+\-]{0,63})\s*@\s*([a-z0-9][a-z0-9.-]{0,253})\s*\.\s*([a-z]{2,24})\b/gi;
  while ((m = emailRe.exec(deob))) {
    rememberEmail(bucket, `${m[1]}@${m[2]}.${m[3]}`, pageUrl, 'visible', hosts, false);
  }
  return [...bucket.values()];
}

export function robotsAllows(robotsText, path) {
  const text = String(robotsText ?? '');
  if (!text.trim()) return true;
  const groups = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.split('#')[0].trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(allow|disallow|user-agent)\s*:\s*(.*)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const val = match[2].trim();
    if (key === 'user-agent') {
      if (!current || current.sealed) current = { agents: [], allows: [], disallows: [], sealed: false };
      current.agents.push(val.toLowerCase());
      continue;
    }
    if (!current) current = { agents: ['*'], allows: [], disallows: [], sealed: false };
    current.sealed = true;
    if (key === 'allow') current.allows.push(val);
    else current.disallows.push(val);
  }
  if (current) groups.push(current);
  const star = groups.filter((g) => g.agents.includes('*'));
  const rules = star.length ? star : [];
  const p = path && path.startsWith('/') ? path : `/${path || ''}`;
  let blocked = false;
  let best = -1;
  for (const g of rules) {
    for (const rule of g.disallows) {
      if (!rule) continue;
      if ((rule === '/' || p.startsWith(rule)) && rule.length > best) {
        best = rule.length;
        blocked = true;
      }
    }
    for (const rule of g.allows) {
      if (!rule) continue;
      if (p.startsWith(rule) && rule.length >= best) {
        best = rule.length;
        blocked = false;
      }
    }
  }
  return !blocked;
}

function discoverLinks(html, origin) {
  const out = [];
  const re = /href\s*=\s*["']([^"'#]+)["']/gi;
  let m;
  let base;
  try {
    base = new URL(origin);
  } catch {
    return out;
  }
  while ((m = re.exec(String(html)))) {
    const href = m[1].trim();
    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
    let abs;
    try {
      abs = new URL(href, origin);
    } catch {
      continue;
    }
    if (abs.hostname.replace(/^www\./, '') !== base.hostname.replace(/^www\./, '')) continue;
    if (!/contact|about|en-contact|connect|get-in-touch|email-us/i.test(abs.pathname)) continue;
    out.push(abs.origin + abs.pathname);
  }
  return [...new Set(out)].slice(0, 3);
}

async function readLimited(res) {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  while (received < MAX_BODY) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    chunks.push(value);
  }
  try {
    await reader.cancel();
  } catch {
    /* already done */
  }
  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  return buf.subarray(0, MAX_BODY).toString('utf8');
}

async function fetchText(url) {
  await sleep(HOST_PAUSE_MS);
  let last = { ok: false, kind: 'connect', status: 0, url, text: '' };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
      });
      const status = res.status;
      if ((status === 429 || status >= 500) && attempt === 0) {
        await sleep(700);
        continue;
      }
      if (!res.ok) return { ok: false, kind: 'http', status, url: res.url || url, text: '' };
      const ctype = (res.headers.get('content-type') || '').toLowerCase();
      if (ctype && !/html|xml|text\/plain|json/.test(ctype)) {
        return { ok: false, kind: 'nonhtml', status, url: res.url || url, text: '' };
      }
      const text = await readLimited(res);
      return { ok: true, kind: 'ok', status, url: res.url || url, text };
    } catch (e) {
      const msg = `${e?.name || ''} ${e?.message || e}`;
      let kind = 'connect';
      if (/timeout|aborted/i.test(msg)) kind = 'timeout';
      else if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(msg)) kind = 'dns';
      else if (/CERT|SSL|TLS|UNABLE_TO_VERIFY/i.test(msg)) kind = 'tls';
      last = { ok: false, kind, status: 0, url, text: '' };
      if (kind !== 'timeout' || attempt === 1) return last;
      await sleep(400);
    }
  }
  return last;
}

function emptyHostResult(host) {
  return {
    host,
    status: 'unreachable',
    blocker: 'unreachable',
    pagesFetched: 0,
    fetchErrors: 0,
    lastKind: '',
    contactForm: false,
    capped: false,
    emails: [],
  };
}

function absorbPage(result, res, siteHost, bucket) {
  const finalHost = (() => {
    try {
      return new URL(res.url).hostname;
    } catch {
      return '';
    }
  })();
  if (isSocialHost(finalHost)) {
    result.status = 'social';
    result.blocker = 'social-redirect';
    return 'stop';
  }
  if (isParked(res.text)) {
    result.status = 'parked';
    result.blocker = 'parked-domain';
    result.pagesFetched += 1;
    return 'stop';
  }
  result.pagesFetched += 1;
  if (pageHasContactForm(res.text, res.url)) result.contactForm = true;
  for (const found of extractEmails(res.text, res.url, [siteHost, finalHost])) {
    const prev = bucket.get(found.email);
    if (!prev || sourceScore(found.sourcePage) > sourceScore(prev.sourcePage)) bucket.set(found.email, found);
  }
  return 'ok';
}

async function crawlHost(group) {
  const result = emptyHostResult(group.host);
  const robotsRes = await fetchText(`https://${group.host}/robots.txt`);
  let robotsText = '';
  if (robotsRes.ok && /user-agent|disallow|allow/i.test(robotsRes.text)) robotsText = robotsRes.text;
  else if (robotsRes.kind === 'dns') {
    const alt = await fetchText(`https://www.${group.host}/robots.txt`);
    if (alt.ok && /user-agent|disallow|allow/i.test(alt.text)) robotsText = alt.text;
  }
  if (robotsText && !robotsAllows(robotsText, '/')) {
    result.status = 'robots';
    result.blocker = 'robots-disallow-all';
    return result;
  }

  const seen = new Set();
  const queue = [];
  function enqueue(url) {
    let u;
    try {
      u = new URL(url);
    } catch {
      return;
    }
    if (isSocialHost(u.hostname)) return;
    const path = u.pathname || '/';
    if (robotsText && !robotsAllows(robotsText, path)) return;
    const norm = `${u.origin}${path.replace(/\/+$/, '')}` || u.origin;
    if (seen.has(norm)) return;
    seen.add(norm);
    queue.push(u.href);
  }

  for (const seed of group.seeds) enqueue(seed);
  enqueue(`https://${group.host}/`);
  enqueue(`https://www.${group.host}/`);
  enqueue(`http://${group.host}/`);

  const bucket = new Map();
  let timeouts = 0;
  let hardFails = 0;
  let liveOrigin = '';
  let firstHtml = '';
  let addedRequired = false;

  async function drain(limit) {
    while (queue.length && result.pagesFetched < limit && timeouts < 2) {
      if (result.pagesFetched === 0 && hardFails >= 3 && timeouts === 0) break;
      const url = queue.shift();
      const res = await fetchText(url);
      if (!res.ok) {
        result.fetchErrors += 1;
        result.lastKind = res.kind;
        if (res.kind === 'timeout') timeouts += 1;
        else if (res.kind === 'dns' || res.kind === 'connect' || res.kind === 'tls') hardFails += 1;
        continue;
      }
      const flag = absorbPage(result, res, group.host, bucket);
      if (flag === 'stop') return 'stop';
      try {
        liveOrigin = new URL(res.url).origin;
      } catch {
        liveOrigin = '';
      }
      if (!firstHtml) firstHtml = res.text;
      if (!addedRequired && liveOrigin) {
        addedRequired = true;
        for (const path of ['/contact', '/about', '/en-contact']) enqueue(`${liveOrigin}${path}`);
      }
    }
    return 'done';
  }

  const firstPass = await drain(6);
  if (firstPass === 'stop') return result;

  if (bucket.size === 0 && liveOrigin && timeouts < 2) {
    for (const path of ['/contact-us', '/about-us']) enqueue(`${liveOrigin}${path}`);
    for (const link of discoverLinks(firstHtml, liveOrigin)) enqueue(link);
    const second = await drain(MAX_PAGES_PER_HOST);
    if (second === 'stop') return result;
  }

  const all = [...bucket.values()];
  const capped = capEmails(all);
  result.emails = capped;
  result.capped = all.length > capped.length;
  if (result.status === 'social' || result.status === 'parked') return result;
  if (result.pagesFetched === 0) {
    result.status = 'unreachable';
    result.blocker = result.lastKind || 'unreachable';
  } else if (capped.length === 0) {
    result.status = 'no-email';
    result.blocker = result.contactForm ? 'contact-form-only' : 'no-published-email';
  } else {
    result.status = 'emails';
    result.blocker = '';
  }
  return result;
}

function rowKey(org, email, city, state) {
  return [org, email, city, state].map((v) => String(v ?? '').trim().toLowerCase()).join('|');
}

export function buildEnrichedRows(priorRows, queueRows, hostResults) {
  const out = [];
  const seen = new Set();
  function add(row) {
    const email = normalizeEmail(row.email) || String(row.email ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) return false;
    const key = rowKey(row.org, email, row.city, row.state);
    if (seen.has(key)) return false;
    seen.add(key);
    out.push({
      org: row.org,
      email,
      website: row.website || '',
      source_page: row.source_page,
      city: row.city || '',
      state: row.state || '',
      lanes: row.lanes || '',
    });
    return true;
  }

  for (const r of priorRows) {
    add({
      org: r.organization,
      email: r.email,
      website: r.website,
      source_page: 'prior-wave',
      city: r.city,
      state: r.state,
      lanes: r.lanes,
    });
  }

  const byHost = new Map();
  for (const r of queueRows) {
    const classified = classifyWebsite(r.website);
    if (!classified.ok) continue;
    if (!byHost.has(classified.host)) byHost.set(classified.host, []);
    byHost.get(classified.host).push(r);
  }

  for (const [host, result] of Object.entries(hostResults || {})) {
    const orgs = byHost.get(host) || [];
    for (const org of orgs) {
      for (const found of result.emails || []) {
        add({
          org: org.organization,
          email: found.email,
          website: org.website,
          source_page: found.sourcePage,
          city: org.city,
          state: org.state,
          lanes: org.lanes,
        });
      }
    }
  }
  return out;
}

export function summarize({ queueRows, priorRows, hostResults, skippedReasons }) {
  const priorEmails = new Set(
    priorRows.map((r) => normalizeEmail(r.email) || String(r.email ?? '').trim().toLowerCase()).filter((email) => email.includes('@')),
  );
  const rows = buildEnrichedRows(priorRows, queueRows, hostResults);
  const discovered = rows.filter((r) => r.source_page !== 'prior-wave');
  const newRows = discovered.filter((r) => !priorEmails.has(r.email));
  const newAddresses = new Set(newRows.map((r) => r.email));
  const knownAttached = discovered.filter((r) => priorEmails.has(r.email));
  const blankIds = new Set(
    queueRows
      .filter((r) => !String(r.email ?? '').includes('@'))
      .map((r) => rowKey(r.organization, '', r.city, r.state)),
  );
  const newOnBlank = new Set(
    newRows.filter((r) => blankIds.has(rowKey(r.org, '', r.city, r.state))).map((r) => r.email),
  );

  const hosts = Object.values(hostResults || {});
  const attemptedWebsites = hosts.length;
  const failureBuckets = {};
  let contactFormHosts = 0;
  let formOnlyHosts = 0;
  let pagesFetched = 0;
  let hostsWithEmail = 0;
  for (const host of hosts) {
    pagesFetched += host.pagesFetched || 0;
    if (host.contactForm) contactFormHosts += 1;
    if (host.status === 'emails') hostsWithEmail += 1;
    if (host.blocker === 'contact-form-only') formOnlyHosts += 1;
    if (host.status !== 'emails') {
      const key = host.blocker || host.status || 'unknown';
      failureBuckets[key] = (failureBuckets[key] || 0) + 1;
    }
  }
  const failures = hosts.filter((h) => h.pagesFetched === 0).length;

  const gained = new Set();
  const stillNo = [];
  let skippedNoWebsite = 0;
  let attemptedOrgRows = 0;
  for (const r of queueRows) {
    const classified = classifyWebsite(r.website);
    const had = String(r.email ?? '').includes('@');
    if (!classified.ok) {
      skippedNoWebsite += 1;
      continue;
    }
    if (!hostResults[classified.host]) continue;
    attemptedOrgRows += 1;
    const orgId = rowKey(r.organization, '', r.city, r.state);
    const got = rows.some(
      (out) => out.source_page !== 'prior-wave' && rowKey(out.org, '', out.city, out.state) === orgId && out.email,
    );
    const hasAny = had || got || rows.some((out) => rowKey(out.org, '', out.city, out.state) === orgId);
    if (!had && got) gained.add(orgId);
    if (!had && !hasAny) stillNo.push(orgId);
  }

  return {
    queueRows: queueRows.length,
    attemptedWebsites,
    attemptedOrgRows,
    newEmailsFound: newAddresses.size,
    newEmailRows: newRows.length,
    newEmailsOnPreviouslyBlankOrgs: newOnBlank.size,
    newEmailsOnlyOnOrgsThatAlreadyHadOne: newAddresses.size - newOnBlank.size,
    alreadyHadEmail: priorRows.length,
    alreadyHadEmailAddresses: priorEmails.size,
    knownAddressAttachedRows: knownAttached.length,
    orgsGainedEmail: gained.size,
    stillNoContactAfterAttempt: stillNo.length,
    failures,
    skippedNoWebsite,
    skippedReasons: skippedReasons || {},
    contactFormHosts,
    formOnlyHosts,
    pagesFetched,
    hostsWithEmail,
    outputRows: rows.length,
    failureBuckets,
    cappedHosts: hosts.filter((h) => h.capped).length,
    rows,
  };
}

function renderReport(summary, generatedAt) {
  const bucketRows = Object.entries(summary.failureBuckets)
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => `| ${name} | ${n} |`)
    .join('\n');
  const low = summary.newEmailsFound < 50;
  const lines = [
    '# Wave 3 contact enrichment — local counts',
    '',
    'NO EMAIL. NO SMS. NO OUTREACH. This file is gitignored. Do not commit it.',
    '',
    `Generated: ${generatedAt}`,
    '',
    '## Metrics',
    '',
    '| Metric | Number |',
    '| --- | ---: |',
    `| Queue rows (website field present) | ${summary.queueRows} |`,
    `| Attempted websites (unique hosts) | ${summary.attemptedWebsites} |`,
    `| Attempted org rows | ${summary.attemptedOrgRows} |`,
    `| New emails found (unique addresses not in the prior set) | ${summary.newEmailsFound} |`,
    `| New emails on orgs that previously had none | ${summary.newEmailsOnPreviouslyBlankOrgs} |`,
    `| New emails only on orgs that already had one | ${summary.newEmailsOnlyOnOrgsThatAlreadyHadOne} |`,
    `| New email rows (org + new address) | ${summary.newEmailRows} |`,
    `| Already had email (rows preserved) | ${summary.alreadyHadEmail} |`,
    `| Orgs that gained a published email | ${summary.orgsGainedEmail} |`,
    `| Still no contact after attempt | ${summary.stillNoContactAfterAttempt} |`,
    `| Failures (hosts with no page retrieved) | ${summary.failures} |`,
    `| Skipped, no fetchable website | ${summary.skippedNoWebsite} |`,
    `| Hosts where a page contained a contact form | ${summary.contactFormHosts} |`,
    `| Hosts with a contact form and no published email | ${summary.formOnlyHosts} |`,
    `| Pages retrieved | ${summary.pagesFetched} |`,
    `| Hosts with at least one published email | ${summary.hostsWithEmail} |`,
    `| Output rows (prior + discovered) | ${summary.outputRows} |`,
    '',
    '## Hosts with no new stored email',
    '',
    '| Blocker | Hosts |',
    '| --- | ---: |',
    bucketRows || '| none | 0 |',
    '',
    '## Notes',
    '',
    '- Prior email rows are copied with `source_page=prior-wave`. They are not recounted as new.',
    '- A shared website that publishes one address can attach that address to more than one office. Unique addresses, not row count, are the new-email metric.',
    '- Personal names on a page are not turned into inboxes. Only published addresses are kept.',
    `- Staff-directory pages are capped at ${MAX_EMAILS_PER_ORG} addresses per organization, role inboxes first. Hosts capped: ${summary.cappedHosts}.`,
    '- Nothing was imported. `consentToContact` was not set. No message was sent.',
    '',
  ];
  if (low) {
    lines.push('## Yield');
    lines.push('');
    lines.push(
      `New emails found: **${summary.newEmailsFound}**, which is under 50. This is the real yield. Name-only organizations were not added.`,
    );
    lines.push('');
    lines.push('Blockers are the host buckets above (unreachable sites, contact forms with no address, pages with no published email, robots disallow, parked domains, social redirects).');
    lines.push('');
  } else {
    lines.push('## Yield');
    lines.push('');
    lines.push(`New emails found: **${summary.newEmailsFound}**.`);
    lines.push('');
  }
  lines.push('Do not commit this file. Do not email anyone listed in the CSV.');
  lines.push('');
  return lines.join('\n');
}

function toCsv(rows) {
  const header = ['org', 'email', 'website', 'source_page', 'city', 'state', 'lanes'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(header.map((h) => csvCell(r[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function publishCopies() {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const csvCopy = join(ARTIFACT_DIR, 'enriched-emails.local.csv');
  const mdCopy = join(ARTIFACT_DIR, 'enrichment-report.local.md');
  assertGitignored(csvCopy);
  assertGitignored(mdCopy);
  copyFileSync(OUT_CSV, csvCopy);
  copyFileSync(OUT_REPORT, mdCopy);
  if (existsSync(CURSOR_ARTIFACTS)) {
    copyFileSync(OUT_CSV, join(CURSOR_ARTIFACTS, 'enriched-emails.local.csv'));
    copyFileSync(OUT_REPORT, join(CURSOR_ARTIFACTS, 'enrichment-report.local.md'));
  }
}

function groupHosts(queueRows) {
  const map = new Map();
  const skippedReasons = {};
  for (const r of queueRows) {
    const classified = classifyWebsite(r.website);
    if (!classified.ok) {
      skippedReasons[classified.reason] = (skippedReasons[classified.reason] || 0) + 1;
      continue;
    }
    if (!map.has(classified.host)) {
      map.set(classified.host, { host: classified.host, seeds: [], needsEmail: false });
    }
    const group = map.get(classified.host);
    if (!group.seeds.includes(classified.seed)) group.seeds.push(classified.seed);
    if (!normalizeEmail(r.email)) group.needsEmail = true;
  }
  const groups = [...map.values()].sort((a, b) => Number(b.needsEmail) - Number(a.needsEmail) || a.host.localeCompare(b.host));
  return { groups, skippedReasons };
}

function priorFrom(readyRows, queueRows) {
  const prior = [];
  const seen = new Set();
  for (const r of [...readyRows, ...queueRows.filter((row) => String(row.email || '').trim())]) {
    const email = normalizeEmail(r.email) || String(r.email ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) continue;
    const key = rowKey(r.organization, email, r.city, r.state);
    if (seen.has(key)) continue;
    seen.add(key);
    prior.push({ ...r, email });
  }
  return prior;
}

async function pool(items, limit, fn) {
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const idx = cursor;
      cursor += 1;
      await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
}

function selfCheck() {
  const failures = [];
  function assert(cond, message) {
    if (!cond) failures.push(message);
    else console.log(`ok ${message}`);
  }

  assert(classifyWebsite('https://N/A').reason === 'na', 'N/A website skipped');
  assert(classifyWebsite('http://604 Gallatin Ave Suite 103').reason === 'address', 'street address skipped');
  assert(classifyWebsite('http://site.notavailable.org').reason === 'placeholder', 'placeholder host skipped');
  const repaired = classifyWebsite('https://.www.benrose.org');
  assert(repaired.ok && repaired.host === 'benrose.org', 'leading-dot website repaired');
  assert(classifyWebsite('https://www.havenservices.org').ok, 'haven host kept');
  assert(!classifyWebsite('').ok, 'empty website skipped');

  const site = ['examplehousing.org'];
  const html = `
    <!-- spamtrap@examplehousing.org -->
    <input type="hidden" name="email" value="honeypot@examplehousing.org">
    <a href="mailto:info@examplehousing.org">Email</a>
    <p>Counselor Jane Doe leads the office.</p>
    <p>Partners: friend@other-agency.org</p>
    <a href="mailto:desk@partner.org">partner desk</a>
    <p>info [at] examplehousing [dot] org</p>
    <p>hello&#64;examplehousing.org</p>
    <img src="icon@2x.png">
    <p>noreply@examplehousing.org</p>
    <p>user@example.com</p>
    <script type="application/ld+json">{"email":"intake@examplehousing.org"}</script>
  `;
  const hex = (() => {
    const email = 'cf@examplehousing.org';
    const key = 0x11;
    let out = key.toString(16).padStart(2, '0');
    for (const ch of email) out += (ch.charCodeAt(0) ^ key).toString(16).padStart(2, '0');
    return out;
  })();
  const withCf = `${html}<a href="/cdn-cgi/l/email-protection#${hex}">protected</a>`;
  const found = new Set(extractEmails(withCf, 'https://examplehousing.org/contact', site).map((e) => e.email));
  assert(found.has('info@examplehousing.org'), 'mailto and visible same-domain kept');
  assert(found.has('hello@examplehousing.org'), 'html entity email kept');
  assert(found.has('intake@examplehousing.org'), 'json-ld email kept');
  assert(found.has('cf@examplehousing.org'), 'cloudflare email decoded');
  assert(found.has('desk@partner.org'), 'mailto on another domain kept');
  assert(!found.has('friend@other-agency.org'), 'third-party body email dropped');
  assert(!found.has('spamtrap@examplehousing.org'), 'html comment trap dropped');
  assert(!found.has('honeypot@examplehousing.org'), 'hidden input dropped');
  assert(!found.has('noreply@examplehousing.org'), 'noreply dropped');
  assert(!found.has('user@example.com'), 'example.com dropped');
  assert(!normalizeEmail('needhelp@company.com'), 'template company.com dropped');
  assert(!normalizeEmail('person@patersontaskforce.comi'), 'truncated tld dropped');
  assert(![...found].some((e) => e.includes('2x') || e.endsWith('.png')), 'image filename dropped');
  assert(![...found].some((e) => e.startsWith('jane')), 'staff name not turned into an inbox');

  assert(robotsAllows('User-agent: *\nDisallow: /\n', '/contact') === false, 'robots disallow all');
  assert(robotsAllows('User-agent: *\nDisallow: /contact\nAllow: /\n', '/') === true, 'robots allows home');
  assert(robotsAllows('User-agent: *\nDisallow: /contact\n', '/contact') === false, 'robots blocks contact');
  assert(robotsAllows('', '/contact') === true, 'missing robots allows');

  const many = [];
  for (let i = 0; i < 20; i += 1) many.push({ email: `person${i}@examplehousing.org`, sourcePage: 'https://examplehousing.org/about' });
  many.push({ email: 'info@examplehousing.org', sourcePage: 'https://examplehousing.org/contact' });
  const capped = capEmails(many);
  assert(capped.length === 8, 'cap is 8');
  assert(capped[0].email === 'info@examplehousing.org', 'role inbox kept first');

  const prior = [
    {
      organization: 'Alpha Housing',
      email: 'info@alpha.org',
      website: 'https://alpha.org',
      city: 'Miami',
      state: 'FL',
      lanes: 'affiliates',
    },
  ];
  const queue = [
    ...prior,
    {
      organization: 'Alpha Housing',
      email: '',
      website: 'https://alpha.org/north',
      city: 'Orlando',
      state: 'FL',
      lanes: 'affiliates',
    },
    {
      organization: 'Beta CDC',
      email: '',
      website: 'https://betacdc.org',
      city: 'Tampa',
      state: 'FL',
      lanes: 'specialists',
    },
  ];
  const hostResults = {
    'alpha.org': {
      emails: [{ email: 'info@alpha.org', sourcePage: 'https://alpha.org/contact', via: 'mailto' }],
    },
    'betacdc.org': {
      emails: [{ email: 'hello@betacdc.org', sourcePage: 'https://betacdc.org/contact', via: 'mailto' }],
    },
  };
  const summary = summarize({
    queueRows: queue,
    priorRows: prior,
    hostResults,
    skippedReasons: {},
  });
  assert(summary.alreadyHadEmail === 1, 'prior row preserved');
  assert(summary.rows.some((r) => r.email === 'info@alpha.org' && r.source_page === 'prior-wave'), 'prior source marked');
  assert(summary.newEmailsFound === 1, 'shared known address is not a new email');
  assert(summary.newEmailsOnPreviouslyBlankOrgs === 1, 'new address on a blank org counted');
  assert(summary.newEmailsOnlyOnOrgsThatAlreadyHadOne === 0, 'no extra address on an org that already had email');
  assert(summary.newEmailsFound === new Set(['hello@betacdc.org']).size, 'beta address counted once');
  assert(summary.rows.filter((r) => r.email === 'hello@betacdc.org').length === 1, 'one row for the new address');
  assert(summary.orgsGainedEmail === 2, 'orlando office gained the known address and beta gained a new one');
  assert(summary.knownAddressAttachedRows === 1, 'known address attached to the office that lacked it');
  const quoted = parseCsv('organization,email,website,city,state,lanes\n"Aaa, Inc",info@aaa.org,https://aaa.org,Miami,FL,affiliates\n');
  assert(quoted.length === 1 && quoted[0].organization === 'Aaa, Inc', 'quoted csv comma kept');

  if (failures.length) {
    for (const message of failures) console.error(`FAIL ${message}`);
    process.exit(1);
  }
  console.log('leads:enrich self-check passed');
}

async function main() {
  const args = process.argv.slice(2);
  const queuePath = DEFAULT_QUEUE;
  const readyPath = DEFAULT_READY;
  const fresh = args.includes('--fresh');
  const limitFlag = args.find((a) => a.startsWith('--limit='));
  const limit = limitFlag ? Number(limitFlag.split('=')[1]) : 0;

  if (!existsSync(queuePath)) throw new Error(`Missing queue CSV: ${queuePath}`);
  if (!existsSync(readyPath)) throw new Error(`Missing email-ready CSV: ${readyPath}`);

  for (const file of [OUT_CSV, OUT_REPORT, OUT_COUNTS, CHECKPOINT]) assertGitignored(file);

  const queueRows = parseCsv(readFileSync(queuePath, 'utf8'));
  const readyRows = parseCsv(readFileSync(readyPath, 'utf8'));
  const priorRows = priorFrom(readyRows, queueRows);
  const { groups, skippedReasons } = groupHosts(queueRows);
  const selected = limit > 0 ? groups.slice(0, limit) : groups;

  let hostResults = {};
  if (!fresh && existsSync(CHECKPOINT)) {
    try {
      const saved = JSON.parse(readFileSync(CHECKPOINT, 'utf8'));
      hostResults = saved.hosts || {};
      for (const result of Object.values(hostResults)) {
        if (!result || !Array.isArray(result.emails)) continue;
        result.emails = result.emails.filter((item) => normalizeEmail(item.email));
        if (result.status === 'emails' && result.emails.length === 0) {
          result.status = 'no-email';
          result.blocker = 'no-published-email';
        }
      }
    } catch {
      hostResults = {};
    }
  }

  let writeChain = Promise.resolve();
  function saveCheckpoint() {
    const snapshot = hostResults;
    writeChain = writeChain.then(() => {
      writeFileSync(CHECKPOINT, JSON.stringify({ version: 1, hosts: snapshot }));
    });
    return writeChain;
  }

  const pending = selected.filter((g) => !hostResults[g.host]);
  console.log('NO EMAIL. NO SMS. NO OUTREACH.');
  const skippedNoWebsite = Object.values(skippedReasons).reduce((sum, n) => sum + n, 0);
  console.log(`queue_rows=${queueRows.length} already_had_email=${priorRows.length} hosts=${selected.length} pending=${pending.length} skipped_no_website=${skippedNoWebsite}`);

  let done = Object.keys(hostResults).length;
  await pool(pending, MAX_IN_FLIGHT, async (group) => {
    const result = await crawlHost(group);
    hostResults[group.host] = result;
    done += 1;
    if (done % 10 === 0 || done === selected.length) {
      const withEmail = Object.values(hostResults).filter((h) => h.status === 'emails').length;
      const unreachable = Object.values(hostResults).filter((h) => h.status === 'unreachable').length;
      console.log(`progress hosts=${done}/${selected.length} hosts_with_email=${withEmail} unreachable=${unreachable}`);
    }
    if (done % 25 === 0) await saveCheckpoint();
  });
  await saveCheckpoint();

  const summary = summarize({ queueRows, priorRows, hostResults, skippedReasons });
  const generatedAt = new Date().toISOString();
  const counts = { ...summary, generatedAt, rows: undefined };
  delete counts.rows;
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_CSV, toCsv(summary.rows));
  writeFileSync(OUT_REPORT, renderReport(summary, generatedAt));
  writeFileSync(OUT_COUNTS, `${JSON.stringify(counts, null, 2)}\n`);
  publishCopies();

  console.log(`attempted_websites=${summary.attemptedWebsites}`);
  console.log(`new_emails_found=${summary.newEmailsFound}`);
  console.log(`new_email_rows=${summary.newEmailRows}`);
  console.log(`already_had_email=${summary.alreadyHadEmail}`);
  console.log(`orgs_gained_email=${summary.orgsGainedEmail}`);
  console.log(`still_no_contact_after_attempt=${summary.stillNoContactAfterAttempt}`);
  console.log(`failures=${summary.failures}`);
  console.log(`skipped_no_website=${summary.skippedNoWebsite}`);
  console.log(`contact_form_hosts=${summary.contactFormHosts}`);
  console.log(`form_only_hosts=${summary.formOnlyHosts}`);
  console.log(`pages_fetched=${summary.pagesFetched}`);
  console.log(`output_rows=${summary.outputRows}`);
  console.log(`wrote ${OUT_CSV}`);
  console.log(`wrote ${OUT_REPORT}`);
  console.log('Do not commit the local files. Do not email anyone on them.');
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  if (process.argv.includes('--self-check')) selfCheck();
  else {
    main().catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
  }
}
