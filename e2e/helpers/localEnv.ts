import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
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

function isSet(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.trim();
  if (!s || s.includes('YOUR_') || s.includes('your_') || s === '...') return false;
  return true;
}

export function isSupabaseConfiguredInLocalEnv(): boolean {
  const merged = {
    ...parseEnvFile(path.join(root, '.env')),
    ...parseEnvFile(path.join(root, '.env.local')),
  };
  const url = process.env.VITE_SUPABASE_URL ?? merged.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY ?? merged.VITE_SUPABASE_ANON_KEY;
  return isSet(url) && isSet(anon);
}

export function e2ePortalCredentials(): { email: string; password: string } | null {
  const merged = {
    ...parseEnvFile(path.join(root, '.env')),
    ...parseEnvFile(path.join(root, '.env.local')),
  };
  const email = process.env.E2E_TEST_EMAIL ?? merged.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD ?? merged.E2E_TEST_PASSWORD;
  if (isSet(email) && isSet(password)) {
    return { email: email!.trim(), password: password!.trim() };
  }
  return null;
}

/** Dev mock auth works when Supabase keys are absent and Playwright runs `npm run dev`. */
export function canUseDevMockAuth(): boolean {
  return !isSupabaseConfiguredInLocalEnv();
}
