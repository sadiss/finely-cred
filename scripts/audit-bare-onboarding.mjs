#!/usr/bin/env node
/**
 * CTA master plan Phase 1 — fail when new bare `/onboarding` CTAs appear outside the registry.
 * Usage: npm run cta:bare-onboarding:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Interactive surfaces only — not route maps, SOPs, or tour manifests. */
const SCAN_DIRS = ['src/pages', 'src/components'];

/** Files allowed to construct bare `/onboarding` paths (bootstrap, auth redirect). */
const ALLOWLIST = new Set([
  'src/components/portal/index.tsx',
  'src/auth/ProtectedAdminRoute.tsx',
]);

/** User-facing CTA patterns — bare `/onboarding` with no query string. */
const CTA_PATTERNS = [
  /navigate\s*\(\s*['"]\/onboarding['"]\s*[,)]/g,
  /navigate\s*\(\s*`\/onboarding`\s*[,)]/g,
  /onClick=\{[^}]*navigate\s*\(\s*['"]\/onboarding['"]/g,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(abs, out);
      continue;
    }
    if (/\.(tsx?|jsx?)$/.test(name)) out.push(abs);
  }
  return out;
}

function rel(abs) {
  return path.relative(root, abs).replace(/\\/g, '/');
}

console.log('Finely Cred — bare /onboarding CTA audit (Phase 1)\n');

const violations = [];

for (const scanDir of SCAN_DIRS) {
  for (const abs of walk(path.join(root, scanDir))) {
    const file = rel(abs);
    if (ALLOWLIST.has(file)) continue;

    const text = fs.readFileSync(abs, 'utf8');
    for (const pattern of CTA_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const line = text.slice(0, match.index).split('\n').length;
        violations.push({ file, line, snippet: match[0].trim().slice(0, 80) });
      }
    }
  }
}

const unique = [...new Map(violations.map((v) => [`${v.file}:${v.line}`, v])).values()];

if (unique.length) {
  console.error(`Found ${unique.length} bare /onboarding CTA(s) in pages/components:\n`);
  for (const v of unique) {
    console.error(`  ✗ ${v.file}:${v.line} — ${v.snippet}`);
  }
  console.error('\nUse resolveFinelyCtaPath() or finelyCtaNavigate() from src/lib/finelyCtaIntent.ts');
  process.exit(1);
}

console.log('✓ No bare /onboarding CTAs in src/pages or src/components (outside allowlist).');
console.log('  Registry: src/lib/finelyCtaIntent.ts');
