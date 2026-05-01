import type { BlobPutResult, BlobRef, BlobStore } from './BlobStore';
import { supabase } from '../lib/supabaseClient';
import { newId } from '../utils/ids';

const REF_PREFIX = 'supabase://';

function isSupabaseRef(ref: string): boolean {
  return typeof ref === 'string' && ref.startsWith(REF_PREFIX);
}

function parseSupabaseRef(ref: BlobRef): { bucket: string; path: string } {
  if (!isSupabaseRef(ref)) throw new Error('Not a Supabase blob ref.');
  const rest = ref.slice(REF_PREFIX.length);
  const slash = rest.indexOf('/');
  if (slash < 1) throw new Error('Invalid Supabase blob ref.');
  const bucket = rest.slice(0, slash);
  const path = rest.slice(slash + 1);
  if (!bucket || !path) throw new Error('Invalid Supabase blob ref.');
  return { bucket, path };
}

function extFromMime(mime: string | undefined): string {
  const m = (mime || '').toLowerCase();
  if (m.includes('pdf')) return '.pdf';
  if (m.includes('png')) return '.png';
  if (m.includes('jpeg') || m.includes('jpg')) return '.jpg';
  if (m.includes('webp')) return '.webp';
  if (m.includes('gif')) return '.gif';
  if (m.includes('text/html')) return '.html';
  if (m.includes('text/plain')) return '.txt';
  return '';
}

export class SupabaseBlobStore implements BlobStore {
  private readonly bucket: string;

  constructor(args?: { bucket?: string }) {
    // This should point to a private bucket with RLS + signed URL access.
    const envBucket = (import.meta.env.VITE_SUPABASE_PRIVATE_BUCKET as string | undefined) || '';
    this.bucket = args?.bucket || envBucket || 'pii';
  }

  async put(blob: Blob, meta?: Record<string, any>): Promise<BlobPutResult> {
    const partnerId = (meta?.partnerId as string | undefined) || 'unknown';
    const kind = (meta?.kind as string | undefined) || 'blob';
    const id = newId('blob');
    const ext = extFromMime(blob.type);
    const path = `partners/${partnerId}/${kind}/${id}${ext}`;

    const { error } = await supabase.storage.from(this.bucket).upload(path, blob, {
      upsert: false,
      contentType: blob.type || undefined,
    });
    if (error) throw new Error(error.message);

    return { ref: `${REF_PREFIX}${this.bucket}/${path}` };
  }

  async get(ref: BlobRef): Promise<Blob | null> {
    const { bucket, path } = parseSupabaseRef(ref);
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) throw new Error(error.message);
    return data ?? null;
  }

  async delete(ref: BlobRef): Promise<void> {
    const { bucket, path } = parseSupabaseRef(ref);
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw new Error(error.message);
  }

  async createSignedUrl(ref: BlobRef, expiresInSeconds = 60 * 30): Promise<string> {
    const { bucket, path } = parseSupabaseRef(ref);
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (error) throw new Error(error.message);
    if (!data?.signedUrl) throw new Error('Signed URL unavailable.');
    return data.signedUrl;
  }
}

export const isSupabaseBlobRef = isSupabaseRef;

