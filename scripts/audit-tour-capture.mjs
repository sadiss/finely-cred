#!/usr/bin/env node
/**
 * Launch OS — verify Playwright capture folders exist for manifest tours.
 * Usage: npm run tour:capture:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toursRoot = path.join(root, 'public', 'tours');

const manifestSrc = fs.readFileSync(path.join(root, 'src', 'config', 'tourManifest.ts'), 'utf8');
const tourIds = [...manifestSrc.matchAll(/^\s+id:\s*'(tour-[^']+)'/gm)].map((m) => m[1]);

console.log('Finely Cred — tour capture audit\n');

let failed = 0;
let captured = 0;

for (const id of tourIds) {
  const dir = path.join(toursRoot, id);
  const step1 = path.join(dir, 'step-01.png');
  const mp4 = path.join(toursRoot, `${id}.mp4`);
  const hasCapture = fs.existsSync(step1);
  const hasMp4 = fs.existsSync(mp4);
  const hasNarration = fs.existsSync(path.join(dir, 'narration.json'));
  if (hasCapture) captured += 1;
  const ok = hasCapture;
  console.log(`${ok ? '✓' : '✗'} ${id} — capture ${hasCapture ? 'yes' : 'no'} · MP4 ${hasMp4 ? 'yes' : 'no'} · narration ${hasNarration ? 'yes' : 'no'}`);
  if (!ok) failed += 1;
}

console.log(`\nCaptured: ${captured}/${tourIds.length} · MP4 optional until ffmpeg assemble`);

if (failed) {
  console.error(`\n${failed} tour(s) missing capture. Run: npm run tour:capture -- --all`);
  process.exit(1);
}

console.log('\nAll manifest tours have screenshot captures.');
