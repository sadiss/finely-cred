import type { EvidenceItem } from '../domain/evidence';
import { listEvidenceByPartner } from '../data/evidenceRepo';

/** How many vault files to surface in chat attach pickers. */
export const CHAT_VAULT_ATTACH_LIMIT = 40;

function isReportScreenshot(item: EvidenceItem): boolean {
  if (item.type === 'screenshot') return true;
  const source = String(item.source || '').toLowerCase();
  return (
    source.includes('screenshot') ||
    source === 'tradeline_screenshot' ||
    source === 'section_screenshot'
  );
}

function chatVaultRank(item: EvidenceItem): number {
  // Report screenshots must beat older generic uploads so they stay visible in chat.
  if (isReportScreenshot(item)) return 3;
  if (String(item.mimeType || '').startsWith('image/')) return 2;
  if (String(item.mimeType || '').includes('pdf')) return 1;
  return 0;
}

/**
 * Evidence the partner (or admin messaging them) can attach in chat.
 * Prioritizes credit-report / Evidence View screenshots, then newest files.
 */
export function listChatVaultAttachments(
  partnerId: string,
  limit: number = CHAT_VAULT_ATTACH_LIMIT,
): EvidenceItem[] {
  if (!partnerId) return [];
  return listEvidenceByPartner(partnerId)
    .slice()
    .sort((a, b) => {
      const rankDelta = chatVaultRank(b) - chatVaultRank(a);
      if (rankDelta !== 0) return rankDelta;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    })
    .slice(0, Math.max(1, limit));
}

export function chatVaultAttachmentLabel(item: EvidenceItem): string {
  const name = (item.filename || item.caption || 'Attachment').trim();
  if (isReportScreenshot(item)) {
    const creditor = (item.creditorName || '').trim();
    if (creditor && !name.toLowerCase().includes(creditor.toLowerCase())) {
      return `Screenshot · ${creditor}`;
    }
    return name.startsWith('Screenshot') ? name : `Screenshot · ${name}`;
  }
  return name;
}
