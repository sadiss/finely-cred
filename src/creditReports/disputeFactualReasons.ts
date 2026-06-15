import type { Bureau, DisputeCandidate, ParsedTradeline } from '../domain/creditReports';

function norm(s: string) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function bureauLabel(b: Bureau) {
  if (b === 'EXP') return 'Experian';
  if (b === 'EQF') return 'Equifax';
  return 'TransUnion';
}

/** Lead-in when a bureau screenshot accompanies the dispute (not "on my file"). */
export function bureauScreenshotLead(b: Bureau): string {
  return `As you can see here on ${bureauLabel(b)},`;
}

/** Prefix a factual finding with bureau screenshot language when not already present. */
export function withBureauScreenshotLead(bureau: Bureau, text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (/^as you can see/i.test(trimmed)) return trimmed;
  const body = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  return `${bureauScreenshotLead(bureau)} ${body}`;
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
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
];

export function isProceduralDisputeReason(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return PROCEDURAL_MARKERS.some((re) => re.test(t));
}

/** Keep account-specific factual findings; drop commands and generic statute lines. */
export function filterFactualDisputeReasons(reasons: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of reasons) {
    const t = raw.trim();
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

/** First-person factual statements describing exactly what the bureau file shows. */
export function buildFactualNegativeSummary(args: {
  candidate: DisputeCandidate;
  tradeline?: ParsedTradeline | null;
}): string[] {
  const { candidate } = args;
  const tl = args.tradeline ?? null;
  const lead = bureauScreenshotLead(candidate.bureau);
  const creditor = candidate.account.trim() || 'this furnisher';
  const negLabel = negativeTypeLabel(candidate);
  const out: string[] = [];

  out.push(
    `${lead} ${creditor} is reporting as a ${negLabel}${candidate.subtype ? ` (${candidate.subtype})` : ''}.`,
  );

  if (candidate.status.trim()) {
    out.push(
      `${lead} the disputed status line for this account reads «${candidate.status.trim()}»${candidate.code.trim() ? ` (code/reference: ${candidate.code.trim()})` : ''}.`,
    );
  }

  if (tl) {
    const b = candidate.bureau;
    const status = fieldOrRow(tl, tl.accountStatus, 'account status', b) || fieldOrRow(tl, null, 'payment status', b);
    const balanceRaw = fieldOrRow(tl, tl.balance, 'balance', b);
    const limitRaw = fieldOrRow(tl, tl.creditLimit, 'credit limit', b);
    const highRaw = fieldOrRow(tl, tl.highBalance, 'high balance', b);
    const opened = fieldOrRow(tl, tl.dateOpened, 'date opened', b);
    const closed = fieldOrRow(tl, tl.dateClosed, 'date closed', b);
    const dofd = fieldOrRow(tl, tl.dofd, 'first delinquency', b);
    const pastDue = fieldOrRow(tl, tl.pastDue, 'past due', b);
    const acctType = fieldOrRow(tl, tl.accountType, 'account type', b);

    const parts: string[] = [];
    if (acctType) parts.push(`account type «${acctType}»`);
    if (status) parts.push(`status «${status}»`);
    if (balanceRaw) parts.push(`balance «${balanceRaw}»`);
    if (pastDue) parts.push(`past due «${pastDue}»`);
    if (limitRaw) parts.push(`credit limit «${limitRaw}»`);
    if (highRaw) parts.push(`high balance «${highRaw}»`);
    if (opened) parts.push(`date opened «${opened}»`);
    if (closed) parts.push(`date closed «${closed}»`);
    if (dofd) parts.push(`date of first delinquency «${dofd}»`);

    if (parts.length) {
      out.push(`${lead} the tradeline fields currently displayed are: ${parts.join('; ')}.`);
    }

    const history = tl.paymentHistory2y?.byBureau?.[candidate.bureau] ?? tl.paymentHistory2y?.byBureau?.EXP ?? [];
    const derogCodes = (history ?? [])
      .map((c) => String(c.code || '').trim())
      .filter((c) => /^(30|60|90|120|CO|COL|LATE)/i.test(c) || /late|charge|collect/i.test(c));
    if (derogCodes.length) {
      const uniq = [...new Set(derogCodes)].slice(0, 8);
      out.push(`${lead} the 24-month payment grid shows derogatory codes (${uniq.join(', ')}) on this account.`);
    }

    const balNum = typeof tl.balance === 'number' ? tl.balance : null;
    const limNum = typeof tl.creditLimit === 'number' ? tl.creditLimit : null;
    if (balNum != null && limNum != null && limNum > 0 && balNum > limNum) {
      out.push(
        `${lead} the reported balance of ${money(balNum)} exceeds the credit limit of ${money(limNum)}, which overstates utilization and is internally inconsistent on this tradeline.`,
      );
    }
  }

  return out;
}

/** Rank: factual summaries and contradictions first; cap procedural leakage. */
export function pickBestDisputeReasons(reasons: string[], max = 12): string[] {
  return filterFactualDisputeReasons(reasons).slice(0, max);
}
