#!/usr/bin/env npx tsx
/**
 * Cold directory CSV importer — local CLI.
 * Never sends email or SMS. Consent flags are forced off.
 *
 *   npx tsx scripts/lane-cold-import.ts --dry-run data/lead-discovery/cold-import.local.csv
 *   npx tsx scripts/lane-cold-import.ts --apply data/lead-discovery/cold-import.local.csv
 *
 * Refuses --apply when the file is tracked by git (committed samples are dry-run only).
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

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
  bulkImportDirectoryColdLeads,
  formatLaneColdImportReport,
  parseLaneColdCsv,
} from '../src/lib/laneColdImport.ts';

function usage() {
  console.log('Usage: npx tsx scripts/lane-cold-import.ts [--dry-run|--apply] <file.csv> [file2.csv ...]');
  console.log('NO EMAIL. Cold import only. Real CSVs must stay gitignored (*.local.csv).');
  process.exit(1);
}

function isGitignored(file: string): boolean {
  try {
    execSync(`git check-ignore -q -- ${JSON.stringify(file)}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) usage();
  const mode = args[0];
  if (mode !== '--dry-run' && mode !== '--apply') usage();
  const dryRun = mode === '--dry-run';
  const files = args.slice(1).map((f) => resolve(f));

  if (!dryRun) {
    for (const file of files) {
      if (!isGitignored(file)) {
        console.error(`Refusing --apply on a tracked file: ${file}`);
        console.error('Commit only redacted *.example.csv. Real exports stay *.local.csv (gitignored).');
        process.exit(1);
      }
    }
  }

  console.log('NO EMAIL — directory cold import does not send messages or enroll nurture.');

  const allRows: ReturnType<typeof parseLaneColdCsv>['rows'] = [];
  const allErrors: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const { rows, errors } = parseLaneColdCsv(text);
    allRows.push(...rows);
    allErrors.push(...errors.map((e) => `${file}: ${e}`));
  }

  const result = await bulkImportDirectoryColdLeads(allRows, { dryRun });
  console.log(formatLaneColdImportReport(result));
  if (allErrors.length) {
    console.log(`parse_warnings: ${allErrors.length} (first 5 shown, no contact values)`);
    allErrors.slice(0, 5).forEach((e) => console.log(`  - ${e.replace(/[^\s]+@[^\s]+/g, '[email]')}`));
  }
  if (result.errors.length) {
    console.log(`import_errors: ${result.errors.length}`);
  }
  process.exit(result.failed > 0 ? 1 : 0);
}

void main();
