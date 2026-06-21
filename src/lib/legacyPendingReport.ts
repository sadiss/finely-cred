/** Legacy imports store report metadata before file bytes are re-uploaded from archive. */
export const LEGACY_PENDING_BLOB_PREFIX = 'legacy:pending-reupload:';

export function isLegacyPendingReportBlob(rawBlobRef?: string | null): boolean {
  return String(rawBlobRef || '').startsWith(LEGACY_PENDING_BLOB_PREFIX);
}

export function legacyPendingReportFilename(rawBlobRef: string): string {
  return rawBlobRef.slice(LEGACY_PENDING_BLOB_PREFIX.length) || 'credit-report';
}
