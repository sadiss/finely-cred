import type { BlobRef } from './BlobStore';
import { getBlobStore } from './getBlobStore';
import { isSupabaseBlobRef } from './SupabaseBlobStore';
import { isLegacyPendingReportBlob } from '../lib/legacyPendingReport';

export type BlobUrlResult = { url: string; revoke?: () => void };

type SignedCapable = { createSignedUrl: (ref: BlobRef, expiresInSeconds?: number) => Promise<string> };

function asSignedCapable(store: unknown): SignedCapable | null {
  if (!store || typeof store !== 'object') return null;
  if (typeof (store as SignedCapable).createSignedUrl === 'function') return store as SignedCapable;
  return null;
}

export async function getBlobUrl(
  ref: BlobRef,
  args?: { mimeType?: string; preferSigned?: boolean; signedTtlSeconds?: number },
): Promise<BlobUrlResult | null> {
  const normalized = String(ref || '').trim();
  if (!normalized) return null;
  if (isLegacyPendingReportBlob(normalized)) return null;

  const store = getBlobStore();
  const preferSigned = args?.preferSigned ?? true;
  const ttl = args?.signedTtlSeconds ?? 60 * 30;

  if (preferSigned && isSupabaseBlobRef(normalized)) {
    const signer = asSignedCapable(store);
    if (signer) {
      try {
        const url = await signer.createSignedUrl(normalized, ttl);
        if (url) return { url };
      } catch (e) {
        console.warn('[getBlobUrl] signed URL failed; falling back to download', e);
      }
    }
  }

  let blob: Blob | null = null;
  try {
    blob = await store.get(normalized);
  } catch (e) {
    console.warn('[getBlobUrl] store.get failed', e);
    return null;
  }
  if (!blob) return null;
  const typed =
    blob.type || !args?.mimeType ? blob : new Blob([blob], { type: args.mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(typed);
  return { url, revoke: () => URL.revokeObjectURL(url) };
}
