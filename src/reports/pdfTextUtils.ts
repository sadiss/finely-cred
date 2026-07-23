/** Replace Unicode chars that WinAnsi (pdf-lib standard fonts) cannot encode. */
export function pdfSafe(s: string): string {
  return String(s ?? '')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2022/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\xFF]/g, '?');
}

export function fmtMoney(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return '-';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export function fmtPct(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return '-';
  return `${Math.round(n)}%`;
}

export function fmtReportDate(d?: string): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}
