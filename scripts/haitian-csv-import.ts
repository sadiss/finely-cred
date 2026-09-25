#!/usr/bin/env npx tsx
/**
 * Haitian cold CSV importer — local CLI (no nurture, no consent).
 *
 * Usage:
 *   npx tsx scripts/haitian-csv-import.ts --dry-run path/to/leads.csv
 *   npx tsx scripts/haitian-csv-import.ts --apply path/to/leads.csv
 *
 * Merge multiple lists by passing multiple files (deduped by email / phone).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

/** File-backed localStorage so CLI --apply can write leads without a browser. */
if (typeof globalThis.localStorage === 'undefined') {
  const dir = join(homedir(), '.finely-cred-cli-store');
  mkdirSync(dir, { recursive: true });
  const storePath = join(dir, 'localStorage.json');
  let map: Record<string, string> = {};
  if (existsSync(storePath)) {
    try {
      map = JSON.parse(readFileSync(storePath, 'utf8')) as Record<string, string>;
    } catch {
      map = {};
    }
  }
  const persist = () => writeFileSync(storePath, JSON.stringify(map));
  globalThis.localStorage = {
    getItem: (k: string) => map[k] ?? null,
    setItem: (k: string, v: string) => {
      map[k] = v;
      persist();
    },
    removeItem: (k: string) => {
      delete map[k];
      persist();
    },
    clear: () => {
      map = {};
      persist();
    },
    key: (i: number) => Object.keys(map)[i] ?? null,
    get length() {
      return Object.keys(map).length;
    },
  } as Storage;
  (globalThis as { window?: { dispatchEvent: (e: Event) => void } }).window = {
    dispatchEvent: () => undefined,
  };
}
import {
  bulkImportHaitianColdLeads,
  formatHaitianColdImportReport,
  parseHaitianColdCsv,
} from '../src/lib/haitianColdImport.ts';

function usage() {
  console.log(`Usage: npx tsx scripts/haitian-csv-import.ts [--dry-run|--apply] <file.csv> [file2.csv ...]`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) usage();
  const mode = args[0];
  if (mode !== '--dry-run' && mode !== '--apply') usage();
  const dryRun = mode === '--dry-run';
  const files = args.slice(1).map((f) => resolve(f));

  const allRows: ReturnType<typeof parseHaitianColdCsv>['rows'] = [];
  const allErrors: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const { rows, errors } = parseHaitianColdCsv(text);
    allRows.push(...rows);
    allErrors.push(...errors.map((e) => `${file}: ${e}`));
  }

  const result = await bulkImportHaitianColdLeads(allRows, { dryRun });
  console.log(formatHaitianColdImportReport(result));
  if (allErrors.length) {
    console.log(`parse_warnings: ${allErrors.length} (first 5 shown)`);
    allErrors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
  }
  if (result.errors.length) {
    console.log(`import_errors: ${result.errors.length} (first 5 shown)`);
    result.errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
  }
  process.exit(result.failed > 0 ? 1 : 0);
}

void main();
