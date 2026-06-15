#!/usr/bin/env node
/**
 * Smoke-check a deployed production URL (static assets + SPA shell).
 * Usage: npm run post-deploy:verify -- https://your-domain.com
 */
const base = process.argv[2]?.replace(/\/+$/, '');
if (!base || !/^https?:\/\//.test(base)) {
  console.error('Usage: npm run post-deploy:verify -- https://your-domain.com');
  process.exit(1);
}

const staticPaths = [
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest',
  '/security.txt',
  '/.well-known/security.txt',
  '/brand/finely-cred-mark.png',
  '/DEPLOY_HANDOFF.txt',
];

const spaPaths = ['/', '/start-here', '/resources', '/pricing', '/privacy'];

console.log(`Finely Cred — post-deploy verify (${base})\n`);

let failed = 0;

async function check(url, { expectTitle = false } = {}) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const ok = res.ok;
    console.log(`${ok ? '✓' : '✗'} ${res.status} ${url}`);
    if (!ok) {
      failed += 1;
      return;
    }
    if (expectTitle) {
      const html = await res.text();
      if (!html.includes('Finely Cred')) {
        console.log(`✗ ${url} — missing expected title marker`);
        failed += 1;
      }
      if (!html.includes('id="app"') && !html.includes("id='app'")) {
        console.log(`✗ ${url} — SPA mount point missing`);
        failed += 1;
      }
    }
  } catch (err) {
    console.log(`✗ fetch failed ${url}: ${err.message}`);
    failed += 1;
  }
}

console.log('── Static assets ──');
for (const p of staticPaths) {
  await check(`${base}${p}`);
}

console.log('\n── SPA routes (shell) ──');
for (const p of spaPaths) {
  await check(`${base}${p}`, { expectTitle: true });
}

if (failed) {
  console.error(`\n${failed} post-deploy check(s) failed.`);
  process.exit(1);
}

console.log('\nPost-deploy smoke pass.');
