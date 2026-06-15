#!/usr/bin/env node
/**
 * Pre-render tour step narration MP3s via voice-studio edge function.
 * Writes public/tours/{tourId}/step-NN.mp3 for ffmpeg assemble.
 *
 * Requires VITE_SUPABASE_URL (or SUPABASE_URL) + VITE_SUPABASE_ANON_KEY (or anon bearer).
 * Cartesia/ElevenLabs secrets must be set on the edge function for live TTS.
 *
 * Usage:
 *   npm run tour:voice:prerender
 *   npm run tour:voice:prerender -- --tour=tour-home-overview
 *   npm run tour:voice:prerender -- --all --force
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const toursRoot = path.join(root, 'public', 'tours');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const fileEnv = {
  ...parseEnvFile(path.join(root, '.env')),
  ...parseEnvFile(path.join(root, '.env.local')),
};
for (const [k, v] of Object.entries(fileEnv)) {
  if (!process.env[k]) process.env[k] = v;
}

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const force = process.argv.includes('--force');
const tourArg = process.argv.find((a) => a.startsWith('--tour='))?.split('=')[1];
const all = process.argv.includes('--all') || !tourArg;
const profileArg = process.argv.find((a) => a.startsWith('--profile='));
const voiceProfile = profileArg ? profileArg.split('=')[1] : 'finely_brand_primary';

if (!url || !anonKey) {
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL + anon key).');
  process.exit(1);
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function listTourDirs() {
  if (!fs.existsSync(toursRoot)) return [];
  return fs
    .readdirSync(toursRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((id) => {
      if (all) return true;
      return id === tourArg;
    });
}

async function renderStep({ tourId, step, label, narrationPlain, mp3File }) {
  const script = narrationPlain.trim();
  if (!script) throw new Error('empty narration');

  const contentId = `${tourId}-step-${String(step).padStart(2, '0')}`;
  const scriptHash = await sha256(script);

  const res = await fetch(`${url}/functions/v1/voice-studio`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'render',
      tenantId: 'finely_cred',
      contentType: 'course_lesson',
      contentId,
      title: `${tourId} · ${label}`,
      voiceProfile,
      script,
      scriptHash,
      force,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  const outPath = path.join(toursRoot, tourId, mp3File);
  if (data.audioDataUrl && typeof data.audioDataUrl === 'string') {
    const m = data.audioDataUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (m) {
      fs.writeFileSync(outPath, Buffer.from(m[1], 'base64'));
      return { cached: Boolean(data.cached), via: 'dataUrl' };
    }
  }

  if (data.signedUrl) {
    const audioRes = await fetch(data.signedUrl);
    if (!audioRes.ok) throw new Error(`Download failed HTTP ${audioRes.status}`);
    const buf = Buffer.from(await audioRes.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    return { cached: Boolean(data.cached), via: 'signedUrl' };
  }

  throw new Error('No audio payload in voice-studio response');
}

async function main() {
  const tourIds = listTourDirs();
  if (!tourIds.length) {
    console.error('No tour folders found. Run npm run tour:capture first.');
    process.exit(1);
  }

  console.log(`Tour voice pre-render: ${tourIds.length} tour(s) · profile ${voiceProfile}${force ? ' (force)' : ''}\n`);

  let ok = 0;
  let failed = 0;
  let skipped = 0;

  for (const tourId of tourIds) {
    const narrationPath = path.join(toursRoot, tourId, 'narration.json');
    if (!fs.existsSync(narrationPath)) {
      console.log(`⊘ ${tourId} — no narration.json (run tour:narration:export)`);
      skipped += 1;
      continue;
    }

    const narration = JSON.parse(fs.readFileSync(narrationPath, 'utf8'));
    const steps = narration.steps ?? [];

    for (const s of steps) {
      const mp3File = s.mp3File || `step-${String(s.step).padStart(2, '0')}.mp3`;
      const outPath = path.join(toursRoot, tourId, mp3File);
      if (!force && fs.existsSync(outPath)) {
        console.log(`⊘ ${tourId} ${mp3File} (exists)`);
        skipped += 1;
        continue;
      }

      const label = `${tourId} · step ${s.step}`;
      try {
        const result = await renderStep({
          tourId,
          step: s.step,
          label: s.label || label,
          narrationPlain: s.narrationPlain,
          mp3File,
        });
        console.log(`✓ ${tourId} ${mp3File}${result.cached ? ' (cached)' : ''} · ${result.via}`);
        ok += 1;
      } catch (e) {
        console.log(`✗ ${tourId} ${mp3File} — ${e?.message ?? e}`);
        failed += 1;
      }
    }
  }

  console.log(`\nDone: ${ok} rendered, ${skipped} skipped, ${failed} failed.`);
  if (ok > 0) console.log('Next: npm run tour:assemble -- --all');
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
