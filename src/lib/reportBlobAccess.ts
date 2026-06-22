import { isLegacyPendingReportBlob } from './legacyPendingReport';
import { isSupabaseBlobRef } from '../storage/SupabaseBlobStore';

/** True when the stored blob ref can be loaded for re-parse / open file. */
export function canAccessReportBlob(rawBlobRef?: string | null): boolean {
  if (!rawBlobRef?.trim()) return false;
  if (isLegacyPendingReportBlob(rawBlobRef)) return false;
  if (isSupabaseBlobRef(rawBlobRef)) return true;
  if (rawBlobRef.startsWith('blob_')) return true;
  return false;
}
