import type { BlobPutResult, BlobRef, BlobStore } from './BlobStore';
import { IndexedDbBlobStore } from './IndexedDbBlobStore';
import { isSupabaseBlobRef } from './SupabaseBlobStore';

/**
 * Tries cloud storage first; falls back to IndexedDB so uploads still work
 * when Supabase storage/RLS is misconfigured or offline.
 */
export class FallbackBlobStore implements BlobStore {
  constructor(
    private primary: BlobStore,
    private local: IndexedDbBlobStore = new IndexedDbBlobStore(),
  ) {}

  async put(blob: Blob, meta?: Record<string, unknown>): Promise<BlobPutResult> {
    try {
      return await this.primary.put(blob, meta);
    } catch (primaryErr) {
      console.warn('[FallbackBlobStore] primary put failed; using IndexedDB', primaryErr);
      const local = await this.local.put(blob, meta);
      return {
        ...local,
        sha256: local.sha256,
        localOnly: true,
        primaryError: (primaryErr as Error)?.message || 'Cloud upload failed.',
      };
    }
  }

  async get(ref: BlobRef): Promise<Blob | null> {
    if (isSupabaseBlobRef(ref)) {
      try {
        const blob = await this.primary.get(ref);
        if (blob) return blob;
      } catch (e) {
        console.warn('[FallbackBlobStore] primary get failed', e);
      }
    }
    return this.local.get(ref);
  }

  async delete(ref: BlobRef): Promise<void> {
    if (isSupabaseBlobRef(ref)) {
      try {
        await this.primary.delete(ref);
      } catch {
        // ignore — still try local
      }
    }
    try {
      await this.local.delete(ref);
    } catch {
      // ignore
    }
  }

  /** Forward to primary when it can sign (e.g. SupabaseBlobStore). */
  async createSignedUrl(ref: BlobRef, expiresInSeconds = 60 * 30): Promise<string> {
    const primary = this.primary as BlobStore & {
      createSignedUrl?: (r: BlobRef, ttl?: number) => Promise<string>;
    };
    if (typeof primary.createSignedUrl !== 'function') {
      throw new Error('Primary store cannot create signed URLs.');
    }
    return primary.createSignedUrl(ref, expiresInSeconds);
  }
}
