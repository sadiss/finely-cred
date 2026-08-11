#!/usr/bin/env node
/**
 * Batch-generate 3–5 second ElevenLabs/Cartesia preview samples per expanded voice persona.
 *
 * Output: public/voice-samples/{voiceId}.mp3 + manifest.json
 *
 * Stub — wire to voice-studio edge + expandedVoiceCatalog when keys are configured.
 *
 * Usage (future):
 *   npm run voice:prerender:samples
 *   npm run voice:prerender:samples -- --force
 *   npm run voice:prerender:samples -- --voice=voice_feminine_warm_american
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public/voice-samples');
const manifestPath = path.join(outDir, 'manifest.json');

const force = process.argv.includes('--force');
const voiceArg = process.argv.find((a) => a.startsWith('--voice='));
const voiceFilter = voiceArg ? voiceArg.split('=')[1] : null;

console.log('voice:prerender:samples — stub');
console.log(`  out: ${outDir}`);
console.log(`  force: ${force}`);
if (voiceFilter) console.log(`  voice filter: ${voiceFilter}`);
console.log('');
console.log('Next steps:');
console.log('  1. Import expanded voice catalog ids from src/data/expandedVoiceCatalog.ts');
console.log('  2. Render 3–5s samples via voice-studio edge (ElevenLabs / Cartesia)');
console.log('  3. Write MP3 files + update public/voice-samples/manifest.json');
console.log('');
console.log('Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + ELEVENLABS_API_KEY or CARTESIA_API_KEY.');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(manifestPath)) {
  fs.writeFileSync(manifestPath, JSON.stringify({ version: 1, samples: {} }, null, 2) + '\n');
  console.log('Created empty manifest at public/voice-samples/manifest.json');
}

process.exit(0);
