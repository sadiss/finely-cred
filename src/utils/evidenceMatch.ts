import type { EvidenceItem } from '../domain/evidence';

const CORP_SUFFIX = /\b(llc|inc|corp|co|ltd|lp|llp|pllc|na|n\.a\.)\b/gi;

function norm(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .replace(CORP_SUFFIX, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(raw: string): string[] {
  const s = norm(raw);
  if (!s) return [];
  return s.split(' ').filter((t) => t.length >= 2);
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const uni = A.size + B.size - inter;
  return uni ? inter / uni : 0;
}

export type EvidenceMatch = {
  evidenceId: string;
  score: number; // 0..1
};

/** Minimum score to attach evidence to a dispute account without override. */
export const EVIDENCE_MATCH_ATTACH_MIN = 0.58;

export function inferSectionKeyFromCandidateType(candidateType: string): string | null {
  const t = norm(candidateType || '');
  if (!t) return null;
  if (t.includes('collection')) return 'collections';
  if (t.includes('inquiry')) return 'inquiries';
  if (t.includes('public')) return 'public_records';
  if (t.includes('bankrupt')) return 'bankruptcy';
  return null;
}

export function scoreEvidenceForAccount(args: {
  accountName: string;
  candidateType?: string;
  evidence: EvidenceItem;
}): number {
  const account = norm(args.accountName || '');
  const evName = norm(args.evidence.creditorName || '');
  const cap = norm(args.evidence.caption || '');
  const file = norm(args.evidence.filename || '');

  if (!account) return 0;

  const accountTok = tokens(account);
  const nameTok = tokens(evName);
  const capTok = tokens(cap);
  const fileTok = tokens(file);

  let score = 0;

  if (evName && account === evName) score = 1;
  else if (evName && (account.includes(evName) || evName.includes(account))) score = 0.9;
  else {
    const jName = jaccard(accountTok, nameTok);
    const jCap = jaccard(accountTok, capTok);
    const jFile = jaccard(accountTok, fileTok);
    const j = Math.max(jName, jCap, jFile);
    if (j >= 0.45) score = 0.62 + j * 0.35;
    else if (j >= 0.3) score = 0.48 + j * 0.25;
    else if (j >= 0.2) score = 0.28 + j * 0.2;
  }

  // Hard penalty when evidence names a different creditor than the dispute target.
  if (evName && score < 0.55) {
    const j = jaccard(accountTok, nameTok);
    if (j < 0.18) score = Math.min(score, 0.1);
  }

  if (args.evidence.source === 'tradeline_screenshot' && score >= 0.45) score += 0.04;

  const wantSectionKey = inferSectionKeyFromCandidateType(args.candidateType || '');
  if (wantSectionKey && norm(args.evidence.sectionKey || '') === wantSectionKey && score >= 0.4) {
    score += 0.04;
  }

  if (score > 1) score = 1;
  if (score < 0) score = 0;
  return score;
}

export function evidenceMatchesAccount(args: {
  accountName: string;
  candidateType?: string;
  evidence: EvidenceItem;
}): boolean {
  return scoreEvidenceForAccount(args) >= EVIDENCE_MATCH_ATTACH_MIN;
}

export function rankEvidenceMatches(args: { accountName: string; candidateType?: string; evidence: EvidenceItem[] }): EvidenceMatch[] {
  return (args.evidence || [])
    .map((e) => ({
      evidenceId: e.id,
      score: scoreEvidenceForAccount({ accountName: args.accountName, candidateType: args.candidateType, evidence: e }),
    }))
    .sort((a, b) => b.score - a.score);
}

export function describeEvidenceMismatch(args: { accountName: string; evidence: EvidenceItem }): string {
  const shown = args.evidence.creditorName?.trim() || args.evidence.caption?.trim() || args.evidence.filename;
  return `This screenshot appears to show "${shown || 'another account'}", not "${args.accountName}". Attach a capture that clearly shows ${args.accountName} on the bureau report.`;
}
