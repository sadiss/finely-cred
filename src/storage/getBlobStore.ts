import { isSupabaseConfigured } from '../lib/supabaseClient';
import type { BlobStore } from './BlobStore';
import { FallbackBlobStore } from './FallbackBlobStore';
import { IndexedDbBlobStore } from './IndexedDbBlobStore';
import { SupabaseBlobStore } from './SupabaseBlobStore';

let cached: BlobStore | null = null;

export function getBlobStore(): BlobStore {
  if (cached) return cached;
  cached = isSupabaseConfigured
    ? new FallbackBlobStore(new SupabaseBlobStore())
    : new IndexedDbBlobStore();
  return cached;
}

