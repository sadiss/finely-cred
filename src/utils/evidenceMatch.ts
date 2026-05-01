import type { EvidenceItem } from '../domain/evidence';

function norm(raw: string): string {
  return (raw || '')
    .toLowerCase()
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

  if (!account) return 0;

  let score = 0;

  // Strong name matches
  if (evName && account === evName) score = Math.max(score, 1.0);
  if (evName && (account.includes(evName) || evName.includes(account))) score = Math.max(score, 0.85);

  // Token overlap
  const j = jaccard(tokens(account), tokens(evName || cap));
  score = Math.max(score, 0.35 + j * 0.55);

  // Prefer tradeline screenshots for tradeline-like matches
  if (args.evidence.source === 'tradeline_screenshot') score += 0.05;

  // If the candidate implies a section type, prefer matching sectionKey
  const wantSectionKey = inferSectionKeyFromCandidateType(args.candidateType || '');
  if (wantSectionKey && norm(args.evidence.sectionKey || '') === wantSectionKey) score += 0.08;

  // Clamp
  if (score > 1) score = 1;
  if (score < 0) score = 0;
  return score;
}

export function rankEvidenceMatches(args: { accountName: string; candidateType?: string; evidence: EvidenceItem[] }): EvidenceMatch[] {
  return (args.evidence || [])
    .map((e) => ({ evidenceId: e.id, score: scoreEvidenceForAccount({ accountName: args.accountName, candidateType: args.candidateType, evidence: e }) }))
    .sort((a, b) => b.score - a.score);
}

