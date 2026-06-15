#!/usr/bin/env node
/**
 * Launch OS — verify key hubs use scroll sections (not tab-gated content).
 * Usage: npm run launch:scroll:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  {
    file: 'src/pages/portal/PartnerDashboardPage.tsx',
    sections: ['portal-dash-overview', 'portal-dash-journey', 'portal-dash-activity', 'portal-dash-modules', 'portal-dash-workflow'],
    strips: ['FinelyNowDoThisStrip', 'FinelyNoticedStrip'],
  },
  {
    file: 'src/pages/admin/AdminDashboardPage.tsx',
    sections: ['admin-overview', 'admin-ops', 'admin-modules'],
    strips: ['FinelyNowDoThisStrip', 'FinelyNoticedStrip'],
  },
  {
    file: 'src/components/dashboard/index.tsx',
    sections: ['dash-overview', 'dash-remedy', 'dash-debt', 'dash-lender', 'dash-automation', 'dash-vault'],
    strips: ['FinelyNowDoThisStrip'],
  },
  {
    file: 'src/pages/ResourcesPage.tsx',
    sections: ['guides', 'monitoring', 'references', 'videos'],
    strips: [],
  },
];

console.log('Finely Cred — launch scroll-section audit\n');

let failed = 0;

for (const req of REQUIRED) {
  const abs = path.join(root, req.file);
  if (!fs.existsSync(abs)) {
    console.log(`✗ ${req.file} (missing)`);
    failed += 1;
    continue;
  }
  const src = fs.readFileSync(abs, 'utf8');
  let fileOk = true;

  for (const id of req.sections) {
    const ok = src.includes(`id="${id}"`) || src.includes(`id='${id}'`);
    console.log(`${ok ? '✓' : '✗'} ${req.file} → #${id}`);
    if (!ok) {
      fileOk = false;
      failed += 1;
    }
  }

  for (const strip of req.strips) {
    const ok = src.includes(strip);
    console.log(`${ok ? '✓' : '✗'} ${req.file} → ${strip}`);
    if (!ok) {
      fileOk = false;
      failed += 1;
    }
  }

  if (req.file === 'src/pages/ResourcesPage.tsx') {
    const laneHeader = src.includes('fc-launch-lane-header');
    console.log(`${laneHeader ? '✓' : '✗'} ${req.file} → fc-launch-lane-header`);
    if (!laneHeader) {
      fileOk = false;
      failed += 1;
    }
  }

  if (
    req.file === 'src/pages/admin/AdminDashboardPage.tsx' ||
    req.file === 'src/pages/portal/PartnerDashboardPage.tsx' ||
    req.file === 'src/components/dashboard/index.tsx'
  ) {
    const laneHeader = src.includes('fc-launch-lane-header');
    console.log(`${laneHeader ? '✓' : '✗'} ${req.file} → fc-launch-lane-header`);
    if (!laneHeader) {
      fileOk = false;
      failed += 1;
    }
  }

  const scrollClass = src.includes('fc-scroll-section');
  console.log(`${scrollClass ? '✓' : '✗'} ${req.file} → fc-scroll-section`);
  if (!scrollClass) {
    fileOk = false;
    failed += 1;
  }

  if (fileOk) console.log(`  (pass)\n`);
  else console.log(`  (issues)\n`);
}

if (failed) {
  console.error(`${failed} launch scroll check(s) failed.`);
  process.exit(1);
}

console.log('All launch scroll hubs pass.');
