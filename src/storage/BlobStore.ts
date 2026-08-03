export type BlobRef = string;

export type BlobPutResult = {
  ref: BlobRef;
  sha256?: string;
  /**
   * True when the cloud store rejected the upload and the bytes only exist in
   * this browser. Callers that share files with other people (chat attachments,
   * letter packets) must warn instead of reporting success.
   */
  localOnly?: boolean;
  /** Cloud failure reason, present when localOnly is true. */
  primaryError?: string;
};

export interface BlobStore {
  put(blob: Blob, meta?: Record<string, any>): Promise<BlobPutResult>;
  get(ref: BlobRef): Promise<Blob | null>;
  delete(ref: BlobRef): Promise<void>;
}

