#!/usr/bin/env node
/**
 * Marketing materials QA — fixtures only, never sends.
 * Usage: npm run marketing:qa
 */
import { HAITIAN_PIECES } from '../src/lib/haitianPieceSpec.ts';
import { HAITIAN_COMMS_TEMPLATE_SEEDS } from '../src/data/commsHaitianTemplatesSeed.ts';
import { MARKETING_MATERIALS_INDEX } from '../src/lib/marketingMaterialsIndex.ts';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function ok(cond, label) {
  console.log(`${cond ? '✓' : '✗'} ${label}`);
  if (!cond) failed += 1;
}

console.log('Finely Cred — marketing materials QA (no send)\n');

ok(HAITIAN_PIECES.length === 37, `Haitian pieces = 37 (got ${HAITIAN_PIECES.length})`);
for (const piece of HAITIAN_PIECES) {
  const complete = Boolean(
    piece.title &&
      piece.titleHt &&
      piece.purpose &&
      piece.actionEn &&
      piece.captionEn &&
      piece.emailSubjectEn &&
      piece.emailLedeEn &&
      piece.ctaPath?.startsWith('/'),
  );
  if (!complete) ok(false, `${piece.id} missing bilingual/CTA fields`);
}
ok(HAITIAN_COMMS_TEMPLATE_SEEDS.length === 8, `Haitian email templates = 8 (got ${HAITIAN_COMMS_TEMPLATE_SEEDS.length})`);
for (const tpl of HAITIAN_COMMS_TEMPLATE_SEEDS) {
  ok(Boolean(tpl.subjectTemplate && tpl.bodyTemplate && /unsubscribe|finelycred.com/i.test(tpl.bodyTemplate)), `${tpl.id} preview fields`);
}

const lanes = ['haitian', 'affiliate', 'specialist', 'email', 'flyer'];
for (const lane of lanes) {
  ok(MARKETING_MATERIALS_INDEX.some((i) => i.lane === lane), `/admin/resources index has ${lane}`);
}
ok(
  MARKETING_MATERIALS_INDEX.every((i) => i.destination.startsWith('/') && i.sourceFile),
  'index destinations are in-app paths',
);

const pdf = spawnSync('npx', ['tsx', 'scripts/proof-haitian-pdfs.ts'], { cwd: root, encoding: 'utf8' });
process.stdout.write(pdf.stdout || '');
if (pdf.status !== 0) {
  failed += 1;
  process.stderr.write(pdf.stderr || '');
  console.error('✗ Haitian PDF export proof');
} else {
  console.log('✓ Haitian PDF export proof (no real send)');
}

if (failed) {
  console.error(`\n${failed} marketing QA check(s) failed.`);
  process.exit(1);
}
console.log('\nMarketing QA passed. Zero messages sent.');
