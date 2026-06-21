import type { BlobRef } from './BlobStore';
import { getBlobStore } from './getBlobStore';
import { SupabaseBlobStore, isSupabaseBlobRef } from './SupabaseBlobStore';
import { isLegacyPendingReportBlob } from '../lib/legacyPendingReport';

export type BlobUrlResult = { url: string; revoke?: () => void };

export async function getBlobUrl(
  ref: BlobRef,
  args?: { mimeType?: string; preferSigned?: boolean; signedTtlSeconds?: number },
): Promise<BlobUrlResult | null> {
  const normalized = String(ref || '').trim();
  if (!normalized) return null;
  if (isLegacyPendingReportBlob(normalized)) return null;

  const store = getBlobStore();
  const preferSigned = args?.preferSigned ?? true;

  // If Supabase refs are used, prefer signed URLs (no blob download in browser memory).
  if (preferSigned && isSupabaseBlobRef(normalized) && store instanceof SupabaseBlobStore) {
    try {
      const url = await store.createSignedUrl(normalized, args?.signedTtlSeconds ?? 60 * 30);
      return { url };
    } catch {
      return null;
    }
  }

  let blob: Blob | null = null;
  try {
    blob = await store.get(normalized);
  } catch {
    return null;
  }
  if (!blob) return null;
  const typed =
    blob.type || !args?.mimeType ? blob : new Blob([blob], { type: args.mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(typed);
  return { url, revoke: () => URL.revokeObjectURL(url) };
}

