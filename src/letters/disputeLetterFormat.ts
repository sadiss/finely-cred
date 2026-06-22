/** Shared dispute letter reason + demand formatting (PDF, preview, HTML). */

export const MAX_DISPUTE_REASONS = 5;
export const DISPUTE_DELETE_NOW = 'DELETE NOW';

export function sanitizeDisputeReasonText(text: string): string {
  let t = String(text || '').trim();
  if (!t) return '';
  t = t.replace(/[«»]/g, '');
  t = t.replace(/\bMetro\s*2\b/gi, '');
  t = t.replace(/\([^)]*code[^)]*\)/gi, '');
  t = t.replace(/\s*;\s*/g, '. ');
  t = t.replace(/\s{2,}/g, ' ');
  t = t.replace(/\.{2,}/g, '.');
  if (t && !/[.!?]$/.test(t)) t += '.';
  return t;
}

/** Numbered factual reasons (1. … 5.) — one clear point each. */
export function formatNumberedDisputeReasons(reasons: string[]): string[] {
  const cleaned = reasons
    .map((r) => sanitizeDisputeReasonText(r))
    .filter(Boolean)
    .slice(0, MAX_DISPUTE_REASONS);
  return cleaned.map((r, i) => `${i + 1}. ${r}`);
}
