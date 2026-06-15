#!/usr/bin/env node
/**
 * Tier 366 — Audit legacy finelyno_finelycred.sql dump.
 * Usage: node scripts/audit-legacy-sql.mjs [path-to-sql]
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

const { buildLegacyMigrationFromSql, auditRowsToCsv } = await import('../src/lib/legacyMigrationExport.ts');
const { assessLegacyMigrationSignOff } = await import('../src/lib/legacyMigrationSignOff.ts');

console.log('Reading', sqlPath, '…');
const sql = fs.readFileSync(sqlPath, 'utf8');
const result = buildLegacyMigrationFromSql(sql, path.basename(sqlPath));

const outDir = path.resolve(__dirname, '../data/legacy-migration');
fs.mkdirSync(outDir, { recursive: true });

const exportPath = path.join(outDir, 'legacy-partners-export-v1.json');
const auditPath = path.join(outDir, 'legacy-partners-audit.csv');
const summaryPath = path.join(outDir, 'legacy-partners-audit-summary.json');

fs.writeFileSync(exportPath, JSON.stringify(result.export, null, 2), 'utf8');
fs.writeFileSync(auditPath, auditRowsToCsv(result.rows), 'utf8');
fs.writeFileSync(
  summaryPath,
  JSON.stringify(
    {
      exportedAt: result.exportedAt,
      sourceFile: result.sourceFile,
      totalPartnersInfo: result.totalPartnersInfo,
      realPartners: result.realPartners,
      skippedTest: result.skippedTest,
      realPartnerEmails: result.rows.filter((r) => r.isReal).map((r) => r.email),
      phase2: result.phase2 ?? null,
      signOff: assessLegacyMigrationSignOff({ exportData: result.export, phase2: result.phase2 ?? null }),
    },
    null,
    2,
  ),
  'utf8',
);

console.log('Done.');
console.log('  Real partners:', result.realPartners);
console.log('  Skipped test:', result.skippedTest);
if (result.phase2) {
  console.log('  Phase 2 SQL rows — letters:', result.phase2.letterRows, 'business:', result.phase2.businessRows);
}
console.log('  Export JSON:', exportPath);
console.log('  Audit CSV:', auditPath);
