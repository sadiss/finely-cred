import type { BlobRef } from '../storage/BlobStore';

export type ResourceVideo = {
  id: string;
  title: string;
  desc?: string;
  blobRef: BlobRef;
  mimeType: string;
  /** Optional poster/thumbnail for cards and previews. */
  posterBlobRef?: BlobRef;
  /** Optional: used for display/filtering. */
  tags?: string[];
  /** Public resources page visibility. */
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

