/**
 * Lightweight parser for phpMyAdmin INSERT dumps (finelyno_finelycred.sql).
 * Used for legacy partner migration audit + export generation.
 */

export type LegacySqlRow = Record<string, string | number | null>;

const TEST_EMAIL_PATTERNS = [
  /mailinator\.com/i,
  /rottack\.autos/i,
  /spectrail\.world/i,
  /silesia\.life/i,
  /tonetics\.biz/i,
  /zetetic\.sbs/i,
  /rightbliss\.beauty/i,
  /test@test\.com/i,
  /example\.com/i,
  /javu@mailinator/i,
  /hepi@mailinator/i,
];

export function isTestEmail(email?: string | null): boolean {
  const e = (email || '').trim().toLowerCase();
  if (!e) return true;
  return TEST_EMAIL_PATTERNS.some((re) => re.test(e));
}

/** Extract column names from CREATE TABLE block */
export function parseCreateTableColumns(sql: string, tableName: string): string[] {
  const re = new RegExp(
    `CREATE TABLE \`${tableName}\` \\(([\\s\\S]*?)\\) ENGINE`,
    'i',
  );
  const m = sql.match(re);
  if (!m) return [];
  const body = m[1];
  const cols: string[] = [];
  for (const line of body.split('\n')) {
    const cm = line.match(/^\s*`([^`]+)`/);
    if (cm && !line.trim().startsWith('PRIMARY') && !line.trim().startsWith('KEY') && !line.trim().startsWith('UNIQUE')) {
      cols.push(cm[1]);
    }
  }
  return cols;
}

/** Parse all INSERT rows for a table (handles multi-row INSERT). */
export function parseInsertRows(sql: string, tableName: string): LegacySqlRow[] {
  const columns = parseCreateTableColumns(sql, tableName);
  if (!columns.length) return [];

  const insertRe = new RegExp(
    `INSERT INTO \`${tableName}\` \\([^)]+\\) VALUES\\s*([\\s\\S]*?);\\s*(?:\\n|$|INSERT|-- )`,
    'gi',
  );
  const rows: LegacySqlRow[] = [];

  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = insertRe.exec(sql)) !== null) {
    const valuesBlock = blockMatch[1];
    const tuples = splitSqlTuples(valuesBlock);
    for (const tuple of tuples) {
      const values = parseSqlTupleValues(tuple);
      if (values.length !== columns.length) continue;
      const row: LegacySqlRow = {};
      columns.forEach((col, i) => {
        row[col] = values[i];
      });
      rows.push(row);
    }
  }
  return rows;
}

function splitSqlTuples(block: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < block.length; i++) {
    const c = block[i];
    if (c === '(') {
      if (depth === 0) start = i;
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0 && start >= 0) {
        tuples.push(block.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return tuples;
}

function parseSqlTupleValues(tuple: string): Array<string | number | null> {
  const inner = tuple.replace(/^\(/, '').replace(/\)$/, '');
  const values: Array<string | number | null> = [];
  let i = 0;
  while (i < inner.length) {
    while (i < inner.length && (inner[i] === ' ' || inner[i] === ',')) i++;
    if (i >= inner.length) break;
    if (inner[i] === "'") {
      let j = i + 1;
      let s = '';
      while (j < inner.length) {
        if (inner[j] === '\\' && j + 1 < inner.length) {
          s += inner[j + 1];
          j += 2;
          continue;
        }
        if (inner[j] === "'") {
          if (inner[j + 1] === "'") {
            s += "'";
            j += 2;
            continue;
          }
          break;
        }
        s += inner[j];
        j++;
      }
      values.push(s);
      i = j + 1;
    } else if (inner.slice(i, i + 4).toUpperCase() === 'NULL') {
      values.push(null);
      i += 4;
    } else {
      let j = i;
      while (j < inner.length && inner[j] !== ',') j++;
      const raw = inner.slice(i, j).trim();
      const num = Number(raw);
      values.push(raw === '' ? null : Number.isFinite(num) && !raw.includes("'") ? num : raw);
      i = j;
    }
  }
  return values;
}

/** Map old Laravel applicationstatus (1–12) to Finely journey stage. */
export function mapLegacyApplicationStatus(status: number | string | null | undefined): string {
  const n = Number(status);
  if (!Number.isFinite(n) || n < 1) return 'intake';
  if (n <= 3) return 'intake';
  if (n <= 6) return 'evidence';
  if (n === 7) return 'letters';
  if (n <= 10) return 'mailing';
  if (n === 11) return 'mailing';
  return 'complete';
}

export const LEGACY_APPLICATION_STATUS_LABELS: Record<number, string> = {
  1: 'Account opened',
  2: 'Service agreement signed',
  3: 'Payment done',
  4: 'CA processed',
  5: 'CA sent',
  6: 'Documents in',
  7: 'Letters generated',
  8: 'Letters sent',
  9: 'Letters received by bureau',
  10: 'Waiting bureau response',
  11: 'Customer /received response',
  12: 'Customer /sent scanned copy',
};
