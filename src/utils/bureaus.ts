import type { Bureau } from '../domain/creditReports';

export function bureauFullName(b: Bureau): string {
  if (b === 'EXP') return 'Experian';
  if (b === 'EQF') return 'Equifax';
  return 'TransUnion';
}

/** Display code (user-facing). Keep internal code as 'TUC' but show 'Trans'. */
export function bureauShortCode(b: Bureau): string {
  if (b === 'EXP') return 'EXP';
  if (b === 'EQF') return 'EQF';
  return 'Trans';
}

/** Map internal bureau keys or legacy labels to user-facing short codes (never TUC/TCU). */
export function formatBureauDisplayCode(raw: Bureau | string | null | undefined): string {
  const v = String(raw ?? '').trim().toUpperCase();
  if (!v) return '';
  if (v === 'EXP' || v.includes('EXPERIAN')) return 'EXP';
  if (v === 'EQF' || v.includes('EQUIFAX')) return 'EQF';
  if (v === 'TUC' || v === 'TU' || v === 'TCU' || v.includes('TRANSUNION') || v.includes('TRANS UNION')) return 'Trans';
  return raw as string;
}

