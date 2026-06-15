/**
 * Export tour step narration for Voice Studio / TTS pipeline.
 * Writes public/tours/{tourId}/narration.json + step-NN.txt sidecars.
 * Run: npm run tour:narration:export [-- --tour=id] [-- --all]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOUR_MANIFEST } from '../src/config/tourManifest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const toursRoot = path.join(root, 'public', 'tours');

const args = process.argv.slice(2);
const tourArg = args.find((a) => a.startsWith('--tour='))?.split('=')[1];
const all = args.includes('--all');
const tours = all ? TOUR_MANIFEST : TOUR_MANIFEST.filter((t) => t.id === tourArg);

if (!tours.length) {
  console.error('Pass --tour=<id> or --all');
  process.exit(1);
}

for (const tour of tours) {
  const dir = path.join(toursRoot, tour.id);
  mkdirSync(dir, { recursive: true });

  const steps = tour.steps.map((s, i) => ({
    step: i + 1,
    stepId: s.id,
    label: s.label,
    narrationPlain: s.narrationPlain,
    mp3File: `step-${String(i + 1).padStart(2, '0')}.mp3`,
  }));

  writeFileSync(path.join(dir, 'narration.json'), JSON.stringify({ tourId: tour.id, title: tour.title, steps }, null, 2));

  for (let i = 0; i < tour.steps.length; i++) {
    const file = path.join(dir, `step-${String(i + 1).padStart(2, '0')}.txt`);
    writeFileSync(file, tour.steps[i].narrationPlain, 'utf8');
  }

  console.log(`[tour:narration] ${tour.id} → ${steps.length} narration sidecars`);
}

console.log('[tour:narration] Drop MP3s as step-NN.mp3 then run npm run tour:assemble');
