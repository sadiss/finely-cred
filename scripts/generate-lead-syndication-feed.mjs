#!/usr/bin/env node
/**
 * Public RSS + JSON feeds for lead magnet / acquisition lanes.
 * Aggregators, Zapier RSS triggers, and search crawlers can pull these.
 *
 * Usage: npm run syndication:feeds
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'src/data/leadAcquisitionManifest.json');
const outDir = path.join(root, 'public/feeds');

const site = process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://finelycred.com';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const now = new Date().toUTCString();

function laneUrl(lane) {
  const base = lane.path + (lane.query ? `?${lane.query}` : '');
  const params = new URLSearchParams(lane.query || '');
  params.set('utm_source', 'syndication');
  params.set('utm_medium', lane.utmMedium || 'feed');
  params.set('utm_campaign', lane.utmCampaign);
  const q = params.toString();
  const pathOnly = lane.path;
  return `${site}${pathOnly}${q ? `?${q}` : ''}`;
}

const items = manifest.lanes.map((lane) => ({
  id: lane.id,
  title: lane.label,
  link: laneUrl(lane),
  description: lane.description,
  audience: lane.audience,
  sequenceId: lane.sequenceId ?? null,
  pubDate: now,
}));

fs.mkdirSync(outDir, { recursive: true });

const rssItems = items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <description>${escapeXml(item.description)}</description>
      <category>${escapeXml(item.audience)}</category>
      <pubDate>${item.pubDate}</pubDate>
    </item>`,
  )
  .join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Finely Cred — Lead acquisition lanes</title>
    <link>${site}</link>
    <description>Free guides, apply flows, and signup paths for credit restore, business credit, affiliates, AU sellers, and specialists.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${site}/feeds/leads.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>
`;

const json = {
  version: 1,
  generatedAt: new Date().toISOString(),
  site,
  items,
};

function stripVolatileDates(s) {
  return s
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, 'DATE')
    .replace(/[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT/g, 'DATE');
}

function writeIfChanged(file, next) {
  if (fs.existsSync(file)) {
    const prev = fs.readFileSync(file, 'utf8');
    if (stripVolatileDates(prev).trim() === stripVolatileDates(next).trim()) {
      return false;
    }
  }
  fs.writeFileSync(file, next, 'utf8');
  return true;
}

const xmlPath = path.join(outDir, 'leads.xml');
const jsonPath = path.join(outDir, 'leads.json');
const xmlChanged = writeIfChanged(xmlPath, rss);
const jsonChanged = writeIfChanged(jsonPath, JSON.stringify(json, null, 2) + '\n');
if (xmlChanged || jsonChanged) {
  console.log(`Wrote ${items.length} lanes → public/feeds/leads.xml + leads.json`);
} else {
  console.log(`Unchanged ${items.length} lanes → public/feeds/leads.xml + leads.json`);
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
