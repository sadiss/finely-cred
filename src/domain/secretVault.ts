export type SecretVaultItemType = 'file' | 'url';

export type SecretVaultItem = {
  id: string;
  tenantId: string;
  type: SecretVaultItemType;
  title: string;
  notes?: string;
  tags?: string[];
  /**
   * For type=file
   * Stored in blob store (Supabase private bucket or IndexedDB fallback).
   */
  blobRef?: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  sha256?: string;
  /**
   * For type=url
   */
  sourceUrl?: string;
  scrapedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
};

export function nowIso() {
  return new Date().toISOString();
}

