#!/usr/bin/env node
/**
 * Tour Factory — Part C scaffold
 * Playwright screenshots + Voice Studio narration + ffmpeg → MP4
 *
 * Usage (when wired):
 *   node scripts/tour-capture.mjs --tour=resources-overview
 *   node scripts/tour-capture.mjs --all
 *
 * Requires: playwright, ffmpeg on PATH, dev server at http://127.0.0.1:5173
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const manifestPath = path.join(root, 'src/config/tourManifest.ts');

const args = process.argv.slice(2);
const tourArg = args.find((a) => a.startsWith('--tour='))?.split('=')[1];
const all = args.includes('--all');

console.log('[tour-capture] Tour Factory scaffold');
console.log('[tour-capture] Manifest:', manifestPath);
console.log('[tour-capture] Target:', tourArg ?? (all ? 'ALL' : '(dry run — pass --tour=id or --all)'));
console.log('[tour-capture] Dev server expected: http://127.0.0.1:5173');
console.log('');
console.log('Next steps:');
console.log('  1. npx playwright install chromium');
console.log('  2. Capture PNG per step → public/tours/{tourId}/');
console.log('  3. Voice Studio or TTS → public/tours/{tourId}/audio/');
console.log('  4. ffmpeg concat → public/tours/{tourId}.mp4');
console.log('  5. Register MP4 in siteTourVideos + Admin Tour Studio');

try {
  readFileSync(manifestPath, 'utf8');
  console.log('\n[tour-capture] Manifest file OK.');
} catch {
  console.warn('[tour-capture] Manifest not found — check src/config/tourManifest.ts');
  process.exitCode = 1;
}
