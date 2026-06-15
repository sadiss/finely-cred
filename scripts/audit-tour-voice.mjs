#!/usr/bin/env node
/**
 * Launch OS — report tour step MP3 coverage (optional voiced walkthroughs).
 * Usage: npm run tour:voice:audit
 * Does not fail launch:check — informational until Voice Studio MP3s are dropped.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toursRoot = path.join(root, 'public', 'tours');

const manifestSrc = fs.readFileSync(path.join(root, 'src', 'config', 'tourManifest.ts'), 'utf8');
const tourIds = [...manifestSrc.matchAll(/^\s+id:\s*'(tour-[^']+)'/gm)].map((m) => m[1]);

console.log('Finely Cred — tour voice (MP3) audit\n');

let withMp3 = 0;
let totalSteps = 0;
let mp3Steps = 0;

for (const id of tourIds) {
  const dir = path.join(toursRoot, id);
  const narrationPath = path.join(dir, 'narration.json');
  let stepCount = 3;
  if (fs.existsSync(narrationPath)) {
    try {
      const n = JSON.parse(fs.readFileSync(narrationPath, 'utf8'));
      stepCount = n.steps?.length ?? stepCount;
    } catch {
      /* ignore */
    }
  }

  let tourMp3 = 0;
  for (let i = 1; i <= stepCount; i++) {
    totalSteps += 1;
    const mp3 = path.join(dir, `step-${String(i).padStart(2, '0')}.mp3`);
    if (fs.existsSync(mp3)) {
      mp3Steps += 1;
      tourMp3 += 1;
    }
  }

  const voiced = tourMp3 === stepCount && stepCount > 0;
  if (voiced) withMp3 += 1;
  console.log(`${voiced ? '✓' : '○'} ${id} — MP3 ${tourMp3}/${stepCount}`);
}

console.log(`\nVoiced tours: ${withMp3}/${tourIds.length} · steps with MP3: ${mp3Steps}/${totalSteps}`);
console.log('Run: npm run tour:voice:prerender (needs Supabase + Cartesia) then npm run tour:assemble -- --all');
