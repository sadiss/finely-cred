import type { Bureau, DisputeCandidate, ParsedTradeline } from '../domain/creditReports';
import { sanitizeDisputeReasonText } from '../letters/disputeLetterFormat';

function norm(s: string) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function bureauLabel(b: Bureau) {
  if (b === 'EXP') return 'Experian';
  if (b === 'EQF') return 'Equifax';
  return 'TransUnion';
}

/** Lead-in when a bureau screenshot accompanies the dispute. */
export function bureauScreenshotLead(b: Bureau): string {
  return `As you can see here on ${bureauLabel(b)},`;
}

/** Prefix a factual finding with bureau screenshot language when not already present. */
export function withBureauScreenshotLead(bureau: Bureau, text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (/^as you can see/i.test(trimmed)) return sanitizeDisputeReasonText(trimmed);
  const body = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  return sanitizeDisputeReasonText(`${bureauScreenshotLead(bureau)} ${body}`);
}

/** Statute demands, bureau commands, and generic filler — not forensic findings. */
const PROCEDURAL_MARKERS: RegExp[] = [
  /^please (verify|provide|confirm|delete|remove|conduct|note|identify|have|review|disclose|require)/i,
  /^pursuant to/i,
  /^under (fcra|metro 2|15 u\.s\.c)/i,
  /^if you cannot verify/i,
  /^i demand/i,
  /^require the furnisher/i,
  /^i am disputing the accuracy/i,
  /^this is (round|a follow-up)/i,
  /fcra §/i,
  /section \d{3}/i,
  /§\s*611|§\s*623|§\s*609/i,
  /\bplease delete\b/i,
  /\bdelete (this|the|it|immediately|from my file)\b/i,
  /\bremove it from my file\b/i,
  /\bfurnish or remove\b/i,
  /\bconduct a (genuine|complete|reasonable) reinvestigation\b/i,
  /\breinvestigation\b/i,
  /\bmethod of verification\b/i,
  /\bdisclose the method\b/i,
  /\bprovide (validation|documentation|written|the name, address)/i,
  /\bconfirm (the|that|full|proper|whether)\b/i,
  /\bverify (the|that|this|ownership|accuracy)\b/i,
  /\bescalate to (supervisor|cfpb)/i,
  /\bi do not recall authorizing this inquiry\. provide\b/i,
  /the information appears inaccurate, incomplete/i,
  /cannot be verified with competent evidence/i,
  /under metro 2 and the fcra, i request reinvestigation/i,
  /is reporting as a collection tradeline/i,
  /is reporting as a collection\b/i,
  /tradeline fields currently displayed are/i,
  /reporting differently across bureaus \(/i,
];

export function isProceduralDisputeReason(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return PROCEDURAL_MARKERS.some((re) => re.test(t));
}

/** Keep account-specific factual findings; drop commands and generic filler. */
export function filterFactualDisputeReasons(reasons: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of reasons) {
    const t = sanitizeDisputeReasonText(raw);
    if (!t || isProceduralDisputeReason(t)) continue;
    const key = norm(t);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function rowFor(tradeline: ParsedTradeline, label: string, bureau?: Bureau): string {
  const needle = norm(label);
  const row = (tradeline.fields ?? []).find((r) => norm(r.label).includes(needle));
  if (!row) return '';
  if (bureau && row.byBureau[bureau]) return row.byBureau[bureau]!.trim();
  return (row.byBureau.EXP || row.byBureau.EQF || row.byBureau.TUC || '').trim();
}

function fieldOrRow(tl: ParsedTradeline, typed: string | number | null | undefined, label: string, bureau?: Bureau): string {
  if (typed != null && String(typed).trim()) return String(typed).trim();
  return rowFor(tl, label, bureau);
}

function negativeTypeLabel(candidate: DisputeCandidate): string {
  const t = norm(`${candidate.type} ${candidate.subtype ?? ''}`);
  if (t.includes('collection')) return 'collection';
  if (t.includes('charge')) return 'charge-off';
  if (t.includes('late') || t.includes('derog')) return 'derogatory payment history';
  if (t.includes('inquiry')) return 'hard inquiry';
  if (t.includes('public') || t.includes('bankrupt')) return 'public record';
  if (t.includes('repo')) return 'repossession';
  if (t.includes('foreclos')) return 'foreclosure';
  return candidate.type.trim() || 'negative tradeline';
}

/**
 * Screenshot-aware account label — use what the exhibit actually shows when it matches the dispute target.
 */
export function resolveDisputeAccountLabel(args: {
  candidate: DisputeCandidate;
  evidenceCreditorName?: string | null;
}): string {
  const target = args.candidate.account.trim() || 'this account';
  const ev = (args.evidenceCreditorName || '').trim();
  if (!ev) return target;
  const a = norm(target);
  const b = norm(ev);
  if (a === b || a.includes(b) || b.includes(a)) return ev;
  return target;
}

/** Deprecated weak summaries — factual reasons now come from contradictions only. */
export function buildFactualNegativeSummary(_args: {
  candidate: DisputeCandidate;
  tradeline?: ParsedTradeline | null;
  evidenceCreditorName?: string | null;
}): string[] {
  return [];
}

/** Rank: factual summaries and contradictions first; cap procedural leakage. */
export function pickBestDisputeReasons(reasons: string[], max = 5): string[] {
  return filterFactualDisputeReasons(reasons).slice(0, max);
}
