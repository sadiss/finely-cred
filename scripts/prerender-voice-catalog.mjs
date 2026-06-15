#!/usr/bin/env node
/**
 * Pre-render voice catalog via voice-studio edge function (Phase 4).
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage:
 *   npm run voice:prerender
 *   npm run voice:prerender -- --force
 *   npm run voice:prerender -- --profile finely_brand_primary
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const force = process.argv.includes('--force');
const profileArg = process.argv.find((a) => a.startsWith('--profile='));
const profileOverride = profileArg ? profileArg.split('=')[1] : null;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_URL for URL only).');
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/voice-prerender-catalog.json'), 'utf8'));

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function buildScript(item) {
  if (item.scriptHint) return item.scriptHint;
  if (item.description) {
    return [
      `Welcome to ${item.title} from Finely Cred.`,
      item.description,
      'This educational resource covers practical credit, funding, and compliance-aware strategies.',
      'Pause anytime and consult a licensed professional for advice specific to your situation.',
    ].join(' ');
  }
  return [
    `Welcome to ${item.title} from Finely Cred.`,
    'This educational resource covers practical credit, funding, and compliance-aware strategies.',
    'Pause anytime and consult a licensed professional for legal advice specific to your situation.',
  ].join(' ');
}

async function renderItem(item, profile) {
  const script = buildScript(item);
  const scriptHash = await sha256(script);
  const res = await fetch(`${url}/functions/v1/voice-studio`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'render',
      tenantId: catalog.tenantId ?? 'finely_cred',
      contentType: item.contentType,
      contentId: item.contentId,
      title: item.title,
      voiceProfile: profile,
      script,
      scriptHash,
      force,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function main() {
  const profiles = profileOverride ? [profileOverride] : catalog.profiles ?? [catalog.defaultProfile];
  const items = catalog.items ?? [];
  console.log(`Voice pre-render: ${items.length} item(s) × ${profiles.length} profile(s)${force ? ' (force)' : ''}\n`);

  let ok = 0;
  let failed = 0;

  for (const item of items) {
    for (const profile of profiles) {
      const label = `${item.contentId} · ${profile}`;
      try {
        const result = await renderItem(item, profile);
        console.log(`✓ ${label}${result.cached ? ' (cached)' : ''}`);
        ok += 1;
      } catch (e) {
        console.log(`✗ ${label} — ${e?.message ?? e}`);
        failed += 1;
      }
    }
  }

  console.log(`\nDone: ${ok} ok, ${failed} failed.`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
