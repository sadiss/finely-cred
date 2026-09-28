#!/usr/bin/env node
/**
 * Read-only lead reconciliation dry-run. Never prints PII. Never writes.
 * Usage: npm run leads:reconcile-dry
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('Finely Cred — lead reconciliation dry-run (no PII, no writes)\n');

const inventory = spawnSync('npm', ['run', 'leads:inventory'], { cwd: root, encoding: 'utf8' });
process.stdout.write(inventory.stdout || '');
if (inventory.stderr) process.stderr.write(inventory.stderr);

const dataDir = path.join(root, 'data/lead-discovery');
const files = fs.existsSync(dataDir)
  ? fs.readdirSync(dataDir).filter((f) => /\.local\.(json|csv)$/i.test(f))
  : [];

if (!files.length) {
  console.log('\nDry-run totals');
  console.log('  insert=0 update=0 skip=0 conflict=0 quarantine=0');
  console.log('  TOSHIBA_REQUIRED=1  (gitignored Grok exports are not on this machine)');
  console.log('No import performed.');
  process.exit(0);
}

const { dryRunColdProspectImport } = await import('../src/lib/coldProspectImport.ts');

function loadRows(file) {
  const abs = path.join(dataDir, file);
  const text = fs.readFileSync(abs, 'utf8');
  if (file.endsWith('.json')) {
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : parsed.rows || parsed.organizations || [];
    return rows.map((row) => ({
      organization: row.organization || row.name || row.company,
      website: row.website || row.url || row.domain,
      email: row.email || row.publicEmail,
      lane: row.lane || row.tag,
      sourceUrl: row.sourceUrl || row.source,
    }));
  }
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const rec = {};
    header.forEach((h, i) => {
      rec[h] = cells[i];
    });
    return {
      organization: rec.organization || rec.name || rec.company,
      website: rec.website || rec.url,
      email: rec.email,
      lane: rec.lane,
      sourceUrl: rec.source || rec.source_url,
    };
  });
}

const allRows = files.flatMap(loadRows);
const result = dryRunColdProspectImport(allRows);
console.log('\nDry-run totals (no addresses printed)');
console.log(`  files=${files.length} rows≈${allRows.length}`);
console.log(`  insert=${result.insert} update=${result.update} skip=${result.skip} conflict=${result.conflict} quarantine=${result.quarantine}`);
console.log('  reasons:', JSON.stringify(result.reasons));
console.log('No import performed.');
process.exit(0);
