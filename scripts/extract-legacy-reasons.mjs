#!/usr/bin/env node
/**
 * Tier 374 — Extract inaccuracy_categories + inaccuracy_text from legacy SQL.
 * Usage: npx tsx scripts/extract-legacy-reasons.mjs [path-to-sql]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSql = path.resolve(__dirname, '../../../finelyno_finelycred.sql');
const sqlPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultSql;

if (!fs.existsSync(sqlPath)) {
  console.error('SQL file not found:', sqlPath);
  process.exit(1);
}

const { buildLegacyReasonsFromSql } = await import('../src/lib/legacyReasonsImport.ts');
const sql = fs.readFileSync(sqlPath, 'utf8');
const result = buildLegacyReasonsFromSql(sql, path.basename(sqlPath));

const outDir = path.resolve(__dirname, '../src/generated');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'legacyDisputeReasons.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');

const catCount = Object.keys(result.library).length;
const reasonCount = Object.values(result.library).reduce((n, g) => n + g.reasons.length, 0);
console.log('Done.');
console.log('  Categories:', catCount);
console.log('  Reasons:', reasonCount);
console.log('  Output:', outPath);
