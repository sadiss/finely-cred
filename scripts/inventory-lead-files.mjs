#!/usr/bin/env node
/**
 * Read-only inventory of gitignored/local lead files. Never prints emails, phones, or names.
 * Usage: npm run leads:inventory
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SEARCH_ROOTS = [
  path.join(root, 'data/lead-discovery'),
  path.join(root, 'artifacts'),
  path.join(os.homedir(), 'Documents', 'FinelyCredit'),
  path.join(os.homedir(), 'Downloads'),
];

const NAME_RE =
  /collected\.local\.json$|cold-import\.local\.csv$|last-run-counts\.local\.json$|summary\.local\.md$|enriched-emails\.local\.csv$|enrichment-report\.local\.md$|\.local\.(json|csv|md)$/i;

function walk(dir, out, depth = 0) {
  if (depth > 6 || !fs.existsSync(dir)) return;
  let ents;
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of ents) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue;
      walk(p, out, depth + 1);
    } else if (NAME_RE.test(ent.name)) {
      out.push(p);
    }
  }
}

function sha256(file) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(file));
  return hash.digest('hex');
}

function countRows(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.csv')) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    return Math.max(0, lines.length - (lines[0]?.includes('@') ? 0 : 1));
  }
  if (file.endsWith('.json')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.length;
      if (Array.isArray(parsed.rows)) return parsed.rows.length;
      if (Array.isArray(parsed.organizations)) return parsed.organizations.length;
      if (typeof parsed.count === 'number') return parsed.count;
      return Object.keys(parsed).length;
    } catch {
      return 0;
    }
  }
  return 0;
}

console.log('Finely Cred — lead file inventory (no PII)\n');

const files = [];
for (const dir of SEARCH_ROOTS) walk(dir, files);
const unique = [...new Set(files)].sort();

if (!unique.length) {
  console.log('No local lead-discovery files found on this machine.');
  console.log('Expected on the Toshiba/Windows clone (gitignored):');
  console.log('  data/lead-discovery/collected.local.json');
  console.log('  data/lead-discovery/cold-import.local.csv');
  console.log('  data/lead-discovery/enriched-emails.local.csv');
  console.log('This cloud agent cannot see C:\\ — run npm run leads:inventory on that desktop.');
  process.exit(0);
}

let failed = 0;
for (const file of unique) {
  const st = fs.statSync(file);
  const rows = countRows(file);
  console.log(`• ${path.relative(root, file) || file}`);
  console.log(`  bytes=${st.size} mtime=${st.mtime.toISOString()} sha256=${sha256(file)} rows≈${rows}`);
}

console.log(`\n${unique.length} file(s). No addresses printed. No import performed.`);
process.exit(failed ? 1 : 0);
