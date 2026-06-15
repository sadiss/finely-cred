import type { BlobRef } from './BlobStore';
import { getBlobStore } from './getBlobStore';
import { SupabaseBlobStore, isSupabaseBlobRef } from './SupabaseBlobStore';

export type BlobUrlResult = { url: string; revoke?: () => void };

export async function getBlobUrl(
  ref: BlobRef,
  args?: { mimeType?: string; preferSigned?: boolean; signedTtlSeconds?: number },
): Promise<BlobUrlResult | null> {
  const store = getBlobStore();
  const preferSigned = args?.preferSigned ?? true;

  // If Supabase refs are used, prefer signed URLs (no blob download in browser memory).
  if (preferSigned && isSupabaseBlobRef(ref) && store instanceof SupabaseBlobStore) {
    const url = await store.createSignedUrl(ref, args?.signedTtlSeconds ?? 60 * 30);
    return { url };
  }

  const blob = await store.get(ref);
  if (!blob) return null;
  const typed =
    blob.type || !args?.mimeType ? blob : new Blob([blob], { type: args.mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(typed);
  return { url, revoke: () => URL.revokeObjectURL(url) };
}

