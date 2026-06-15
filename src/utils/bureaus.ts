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

