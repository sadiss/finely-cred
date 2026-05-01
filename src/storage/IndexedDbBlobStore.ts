import type { BlobPutResult, BlobRef, BlobStore } from './BlobStore';
import { newId } from '../utils/ids';

const DB_NAME = 'finely_blobstore';
const STORE_NAME = 'blobs_v1';

type StoredBlob = {
  ref: string;
  createdAt: string;
  blob: Blob;
  meta?: Record<string, any>;
  sha256?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'ref' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function sha256Hex(blob: Blob): Promise<string> {
  // Some environments may not expose crypto.subtle (or may not be a secure context).
  // In that case we skip hashing (sha256 becomes optional in BlobPutResult).
  const subtle: SubtleCrypto | undefined = (globalThis.crypto as any)?.subtle;
  if (!subtle) throw new Error('crypto.subtle unavailable');
  const buf = await blob.arrayBuffer();
  const digest = await subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class IndexedDbBlobStore implements BlobStore {
  async put(blob: Blob, meta?: Record<string, any>): Promise<BlobPutResult> {
    const db = await openDb();
    const ref = `blob_${newId('blob')}`;
    let sha256: string | undefined;
    try {
      sha256 = await sha256Hex(blob);
    } catch {
      sha256 = undefined;
    }
    const record: StoredBlob = { ref, createdAt: new Date().toISOString(), blob, meta, sha256 };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_NAME).put(record);
    });

    db.close();
    return { ref, sha256 };
  }

  async get(ref: BlobRef): Promise<Blob | null> {
    const db = await openDb();
    const record = await new Promise<StoredBlob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(ref);
      req.onsuccess = () => resolve(req.result as StoredBlob | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return record?.blob ?? null;
  }

  async delete(ref: BlobRef): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_NAME).delete(ref);
    });
    db.close();
  }
}

