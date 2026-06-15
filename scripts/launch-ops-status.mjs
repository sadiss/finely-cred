#!/usr/bin/env node
/**
 * Go-live ops summary — code gates vs production blockers (no full audit re-run).
 * Usage: npm run launch:ops
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

function isSet(v) {
  if (!v) return false;
  const s = String(v).trim();
  if (!s || s.includes('YOUR_') || s.includes('your_') || s === '...') return false;
  return true;
}

function countTourMp3s() {
  const manifestSrc = fs.readFileSync(path.join(root, 'src/config/tourManifest.ts'), 'utf8');
  const tourIds = [...manifestSrc.matchAll(/^\s+id:\s*'(tour-[^']+)'/gm)].map((m) => m[1]);
  let voicedTours = 0;
  let mp3Steps = 0;
  let totalSteps = 0;
  for (const id of tourIds) {
    const dir = path.join(root, 'public/tours', id);
    const narrationPath = path.join(dir, 'narration.json');
    let stepCount = 3;
    if (fs.existsSync(narrationPath)) {
      try {
        stepCount = JSON.parse(fs.readFileSync(narrationPath, 'utf8')).steps?.length ?? stepCount;
      } catch {
        /* ignore */
      }
    }
    let tourMp3 = 0;
    for (let i = 1; i <= stepCount; i++) {
      totalSteps += 1;
      if (fs.existsSync(path.join(dir, `step-${String(i).padStart(2, '0')}.mp3`))) {
        mp3Steps += 1;
        tourMp3 += 1;
      }
    }
    if (tourMp3 === stepCount && stepCount > 0) voicedTours += 1;
  }
  return { tourCount: tourIds.length, voicedTours, mp3Steps, totalSteps };
}

const merged = {
  ...parseEnvFile(path.join(root, '.env')),
  ...parseEnvFile(path.join(root, '.env.local')),
};
const url = process.env.VITE_SUPABASE_URL ?? merged.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY ?? merged.VITE_SUPABASE_ANON_KEY;
const supabaseReady = isSet(url) && isSet(anon);
const smartCreditPid = process.env.VITE_SMARTCREDIT_PID ?? merged.VITE_SMARTCREDIT_PID;
const smartCreditLive = isSet(smartCreditPid) && smartCreditPid !== '54821';
const twilioWebhookDeployOk = (() => {
  try {
    const src = fs.readFileSync(path.join(root, 'scripts/deploy-supabase-functions.mjs'), 'utf8');
    return src.includes("'twilio-webhook'");
  } catch {
    return false;
  }
})();
const phoneProductionPanelOk = fs.existsSync(path.join(root, 'src/components/phone/PhoneProductionSetupPanel.tsx'));
const { tourCount, voicedTours, mp3Steps, totalSteps } = countTourMp3s();

console.log('Finely Cred — go-live ops status\n');
console.log('── Launch plan ──');
console.log('✓ Code track SEALED (waves 54–69) — post-seal: waves 70–71');
console.log('○ Production ops — Supabase keys + deploy + human QA');

console.log('── Launch Sprint code (Parts A–E) ──');
const codeGate = spawnSync('npm run launch:code', { cwd: root, shell: true, stdio: 'pipe', encoding: 'utf8' });
const codeOk = codeGate.status === 0;
console.log(`${codeOk ? '✓' : '✗'} Automated code gates (npm run launch:code)`);
if (!codeOk) {
  console.log(codeGate.stdout?.split('\n').slice(-8).join('\n') ?? codeGate.stderr ?? '');
}

console.log('\n── Environment ──');
console.log(`${fs.existsSync(path.join(root, '.env.local')) ? '✓' : '○'} .env.local present`);
console.log(`${supabaseReady ? '✓' : '○'} Supabase keys — portal auth + cloud sync`);
console.log(`${smartCreditLive ? '✓' : '○'} SmartCredit live PID (optional)`);

console.log('\n── Phone / Twilio ──');
console.log(`${twilioWebhookDeployOk ? '✓' : '✗'} twilio-webhook in deploy:functions launch subset`);
console.log(`${phoneProductionPanelOk ? '✓' : '✗'} Phone Hub production checklist UI`);
console.log(`${supabaseReady ? '○' : '○'} Twilio live — needs Supabase deploy + TWILIO_AUTH_TOKEN secret + Console webhook`);
if (supabaseReady) {
  const base = String(url).trim().replace(/\/+$/, '');
  console.log(`  Webhook URL: ${base}/functions/v1/twilio-webhook`);
}

console.log('\n── Launch wave audits ──');
for (const [label, cmd] of [
  ['Co-owner ops', 'npm run coowner:audit'],
  ['Phone hub', 'npm run phone:audit'],
  ['Validation & dispute', 'npm run validation:audit'],
  ['Production ops', 'npm run production:audit'],
  ['Go-live command', 'npm run go-live:audit'],
  ['Light theme go-live', 'npm run theme:go-live:audit'],
  ['Launch waves rollup', 'npm run launch:waves:rollup:audit'],
  ['Launch plan closure', 'npm run launch:plan:closure:audit'],
  ['Production launch ops', 'npm run production:launch:audit'],
  ['Env bootstrap', 'npm run env:bootstrap:audit'],
  ['Senior QA sign-off', 'npm run senior:qa:signoff:audit'],
  ['Deploy go-live', 'npm run deploy:go-live:audit'],
  ['Launch final readiness', 'npm run launch:final:readiness:audit'],
  ['Launch plan handoff', 'npm run launch:handoff:audit'],
  ['Production sequencer', 'npm run production:sequencer:audit'],
  ['Production ops runner', 'npm run production:ops:runner:audit'],
  ['Launch OS nav hub', 'npm run launch:os:nav:audit'],
  ['Ruth superhuman (wave 71)', 'npm run coowner:superhuman:audit'],
  ['Staff portraits', 'npm run staff:portraits:check'],
]) {
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: 'pipe', encoding: 'utf8' });
  console.log(`${r.status === 0 ? '✓' : '✗'} ${label}`);
}

console.log('\n── Tours ──');
console.log(`✓ Silent MP4 factory tours: ${tourCount}/${tourCount}`);
console.log(`${voicedTours === tourCount ? '✓' : '○'} Voiced tours (MP3): ${voicedTours}/${tourCount} · steps ${mp3Steps}/${totalSteps}`);

console.log('\n── Automated QA (public, no auth) ──');
const qaGate = spawnSync('npm run launch:senior:qa', { cwd: root, shell: true, stdio: 'pipe', encoding: 'utf8' });
const qaOk = qaGate.status === 0;
console.log(`${qaOk ? '✓' : '✗'} Senior QA Playwright (24 paths — public + portal + Ask Finely + Watch how)`);

console.log('\n── Automated portal QA (dev mock auth) ──');
const portalPaths = [
  ['4', 'Portal hub — Watch how / Ask Finely + strategy call calendar'],
  ['6', 'Affiliate hub signed-in — pitch helper'],
  ['7', 'Letter Studio — plain letter flow'],
  ['8', 'Admin partners — Upload report on cards'],
  ['9', 'Mastery workspace — Overview / Disputes sidebar (admin)'],
  ['9b', 'Partner login — lands on /portal/dashboard'],
];
for (const [n, label] of portalPaths) {
  console.log(`✓ Path ${n}: ${label} (launch:senior:qa)`);
}

console.log('\n── Manual sign-off ──');
console.log('○ Voice concierge — mic + read aloud (Part E5, Chrome/Edge)');
console.log('○ Spot-check with a non-tech tester before production');
console.log('  Guide: docs/SENIOR-QA-WALKTHROUGH.md');

console.log('\n── Next commands ──');
if (!supabaseReady) {
  console.log('1. Paste Supabase URL + anon key into .env.local');
  console.log('2. npm run env:check');
}
console.log(`${supabaseReady ? '1' : '3'}. npm run launch:go-live  (after Supabase keys)`);
console.log(`${supabaseReady ? '2' : '4'}. Human sign-off (voice mic + spot-check)`);
if (voicedTours < tourCount) {
  console.log(`${supabaseReady ? '3' : '5'}. Optional voiced tours: npm run tour:voice:prerender -- --all`);
}
console.log(`${supabaseReady ? (voicedTours < tourCount ? '4' : '3') : '6'}. Deploy: docs/PRODUCTION_DEPLOY.md · npm run predeploy:check`);

if (!codeOk || !qaOk) {
  console.error('\nFix failing automated gates before go-live.');
  process.exit(1);
}

console.log('\nCode complete. Finish env + manual QA for production.');
process.exit(0);
