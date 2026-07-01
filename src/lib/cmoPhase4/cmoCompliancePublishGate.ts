import { CmoManagedAccount, CmoPublishAsset, CmoRiskLevel } from '../../domain/cmoPhase4';

const BLOCKED_CLAIMS = [
  'guaranteed approval',
  'guaranteed deletion',
  '100% approval',
  'instant funding',
  'wipe your credit',
  'remove anything',
  'legal loophole',
  'no questions asked',
  'everyone qualifies',
];

const SENSITIVE_ACTIONS = ['external_publish', 'outbound_sms', 'outbound_email', 'comment_reply', 'dm_reply'];

export interface CmoPublishGateResult {
  allowed: boolean;
  riskLevel: CmoRiskLevel;
  score: number;
  reasons: string[];
  requiredActions: string[];
}

export function scanCmoPublishRisk(text: string, linkUrl?: string): Pick<CmoPublishGateResult, 'riskLevel' | 'score' | 'reasons'> {
  const normalized = `${text} ${linkUrl ?? ''}`.toLowerCase();
  const reasons: string[] = [];
  let score = 100;

  for (const claim of BLOCKED_CLAIMS) {
    if (normalized.includes(claim)) {
      score -= 30;
      reasons.push(`Risky claim detected: "${claim}"`);
    }
  }

  if (normalized.includes('http://')) {
    score -= 20;
    reasons.push('Use secure HTTPS links only.');
  }

  if (linkUrl && !/finelycred\.com|calendly\.com|youtube\.com|youtu\.be|instagram\.com|tiktok\.com|linkedin\.com|facebook\.com/i.test(linkUrl)) {
    score -= 15;
    reasons.push('Link domain is not in the default trusted registry. Review before publishing.');
  }

  if (normalized.length < 60) {
    score -= 8;
    reasons.push('Caption is probably too thin to convert.');
  }

  if (!/(book|apply|schedule|learn|download|join|message|comment|start|get)/i.test(text)) {
    score -= 10;
    reasons.push('No clear CTA detected.');
  }

  const clamped = Math.max(0, Math.min(100, score));
  const riskLevel: CmoRiskLevel = clamped < 45 ? 'blocked' : clamped < 65 ? 'high' : clamped < 82 ? 'medium' : 'low';
  return { riskLevel, score: clamped, reasons };
}

export function evaluateCmoPublishGate(params: {
  asset: CmoPublishAsset;
  account?: CmoManagedAccount;
  action: string;
  adminApproved?: boolean;
}): CmoPublishGateResult {
  const { asset, account, action, adminApproved } = params;
  const scan = scanCmoPublishRisk(`${asset.title}\n${asset.caption}\n${asset.cta ?? ''}`, asset.linkUrl);
  const requiredActions: string[] = [];
  const reasons = [...scan.reasons];
  let allowed = true;

  if (!account) {
    allowed = false;
    requiredActions.push('Connect or select a managed account.');
  }

  if (account?.status !== 'connected' && account?.platform !== 'manual') {
    allowed = false;
    reasons.push(`Account status is ${account?.status ?? 'unknown'}.`);
    requiredActions.push('Reconnect account or use manual publishing.');
  }

  if (scan.riskLevel === 'blocked') {
    allowed = false;
    requiredActions.push('Rewrite copy before it can be published.');
  }

  if (SENSITIVE_ACTIONS.includes(action) && !adminApproved) {
    allowed = false;
    requiredActions.push('Human approval required before outbound action.');
  }

  if (account?.publishMode === 'blocked') {
    allowed = false;
    reasons.push('This account is blocked from publishing.');
  }

  if (account?.publishMode === 'manual_copy_paste' && action === 'external_publish') {
    allowed = false;
    requiredActions.push('Use manual copy/paste publishing for this account.');
  }

  return {
    allowed,
    riskLevel: scan.riskLevel,
    score: scan.score,
    reasons,
    requiredActions,
  };
}
