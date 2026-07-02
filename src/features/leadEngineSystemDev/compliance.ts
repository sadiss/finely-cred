const BLOCKED_PHRASES = [
  'guaranteed approval',
  '100% approval',
  'delete bad credit',
  'wipe your credit',
  'erase bad credit',
  'instant funding',
  'no matter what',
  'cpn',
  'new credit identity',
  'remove anything',
  'guaranteed deletion',
  'raise your score by',
  'overnight score boost',
  'illegal shortcut',
];

const REVIEW_PHRASES = [
  'fast results',
  'easy approval',
  'fix your credit',
  'funding guaranteed',
  'credit sweep',
  'deletion',
  'approval odds',
  'tradeline boost',
];

export function scanMarketingCopy(text: string): { status: 'safe' | 'needs_review' | 'blocked'; notes: string[] } {
  const body = String(text || '').toLowerCase();
  const blocked = BLOCKED_PHRASES.filter((p) => body.includes(p));
  if (blocked.length) {
    return {
      status: 'blocked',
      notes: blocked.map((p) => `Blocked phrase: ${p}`),
    };
  }
  const review = REVIEW_PHRASES.filter((p) => body.includes(p));
  if (review.length) {
    return {
      status: 'needs_review',
      notes: review.map((p) => `Review phrase: ${p}`),
    };
  }
  return { status: 'safe', notes: ['No blocked claims found.'] };
}

export function safeDisclosure() {
  return 'Educational information only. Results depend on profile, documentation, eligibility, timing, and execution. No approval, deletion, score, funding, or income result is guaranteed.';
}

export function enforceManualCommunityBoundary(channel: string) {
  const c = String(channel || '').toLowerCase();
  if (['reddit', 'facebook_group', 'nextdoor', 'community', 'manual_community_queue'].includes(c)) {
    return 'Manual review required for community replies. Draft the answer and short link, then let an authorized human post it.';
  }
  return null;
}
