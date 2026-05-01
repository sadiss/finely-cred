function escapeCsvCell(v: string): string {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toTsv(args: { columns: string[]; rows: Array<Array<string | number | null | undefined>> }): string {
  const cols = args.columns.map((c) => String(c ?? ''));
  const lines: string[] = [];
  lines.push(cols.join('\t'));
  for (const r of args.rows) {
    lines.push((r ?? []).map((x) => String(x ?? '')).join('\t'));
  }
  return lines.join('\n');
}

export function toCsv(args: { columns: string[]; rows: Array<Array<string | number | null | undefined>> }): string {
  const cols = args.columns.map((c) => escapeCsvCell(String(c ?? '')));
  const lines: string[] = [];
  lines.push(cols.join(','));
  for (const r of args.rows) {
    lines.push((r ?? []).map((x) => escapeCsvCell(String(x ?? ''))).join(','));
  }
  return lines.join('\n');
}

