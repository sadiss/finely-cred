export type BlobRef = string;

export type BlobPutResult = {
  ref: BlobRef;
  sha256?: string;
};

export interface BlobStore {
  put(blob: Blob, meta?: Record<string, any>): Promise<BlobPutResult>;
  get(ref: BlobRef): Promise<Blob | null>;
  delete(ref: BlobRef): Promise<void>;
}

