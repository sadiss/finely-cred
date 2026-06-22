#!/usr/bin/env node
/**
 * Action automation: regenerate discovery assets + ping search/syndication endpoints.
 *
 * Env:
 *   SITE_URL / VITE_SITE_URL — default https://finelycred.com
 *   INDEXNOW_KEY — optional; pings Bing/Yandex via IndexNow API
 *   SYNDICATION_WEBHOOK_URL — optional; POST lane bundle to Zapier/Make/n8n
 *
 * Usage: npm run syndication:publish
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const site = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://finelycred.com').replace(/\/$/, '');

function run(label, cmd, args) {
  const res = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) {
    console.error(`✗ ${label} failed (exit ${res.status})`);
    process.exit(res.status || 1);
  }
  console.log(`✓ ${label}`);
}

run('sitemap', 'node', ['scripts/generate-public-sitemap.mjs']);
run('syndication feeds', 'node', ['scripts/generate-lead-syndication-feed.mjs']);

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/data/leadAcquisitionManifest.json'), 'utf8'));
const feedJson = JSON.parse(fs.readFileSync(path.join(root, 'public/feeds/leads.json'), 'utf8'));

const urls = [
  site,
  `${site}/sitemap.xml`,
  `${site}/feeds/leads.xml`,
  `${site}/feeds/leads.json`,
  ...manifest.lanes.map((lane) => {
    const q = lane.query ? `?${lane.query}` : '';
    return `${site}${lane.path}${q}`;
  }),
];

const indexNowKey = process.env.INDEXNOW_KEY?.trim();
if (indexNowKey) {
  const keyFile = path.join(root, 'public', `${indexNowKey}.txt`);
  if (!fs.existsSync(keyFile)) {
    fs.writeFileSync(keyFile, indexNowKey, 'utf8');
    console.log(`✓ wrote IndexNow key file → public/${indexNowKey}.txt`);
  }
  const host = new URL(site).host;
  const body = {
    host,
    key: indexNowKey,
    keyLocation: `${site}/${indexNowKey}.txt`,
    urlList: urls.slice(0, 100),
  };
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    console.log(res.ok ? `✓ IndexNow ping (${urls.length} URLs)` : `⚠ IndexNow returned ${res.status}`);
  } catch (e) {
    console.warn('⚠ IndexNow ping failed:', e instanceof Error ? e.message : e);
  }
} else {
  console.log('○ INDEXNOW_KEY not set — skip search ping (add secret to enable)');
}

const webhook = process.env.SYNDICATION_WEBHOOK_URL?.trim();
if (webhook) {
  const payload = {
    source: 'finely-syndication-publish',
    site,
    publishedAt: new Date().toISOString(),
    feeds: {
      rss: `${site}/feeds/leads.xml`,
      json: `${site}/feeds/leads.json`,
      sitemap: `${site}/sitemap.xml`,
    },
    lanes: feedJson.items,
  };
  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log(res.ok ? '✓ Syndication webhook posted' : `⚠ Webhook returned ${res.status}`);
  } catch (e) {
    console.warn('⚠ Syndication webhook failed:', e instanceof Error ? e.message : e);
  }
} else {
  console.log('○ SYNDICATION_WEBHOOK_URL not set — skip outbound syndication webhook');
}

console.log('\nDone. Feeds live at:');
console.log(`  ${site}/feeds/leads.xml`);
console.log(`  ${site}/feeds/leads.json`);
