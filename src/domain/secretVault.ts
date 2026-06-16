/** Media categories stored in the owner Secret Vault. */
export type SecretVaultMediaKind =
  | 'document'
  | 'ebook'
  | 'video'
  | 'video_upload'
  | 'youtube'
  | 'audio'
  | 'image'
  | 'archive'
  | 'url'
  | 'other';

export type SecretVaultItemType = 'file' | 'url' | 'intel';

/** Roles that may view/share vault intelligence across Finely + Nora Capital. */
export type SecretVaultShareRole =
  | 'platform_admin'
  | 'tenant_owner'
  | 'agent'
  | 'partner'
  | 'ncg_ops'
  | 'ncg_underwriter'
  | 'affiliate'
  | 'finely_staff';

export type SecretVaultIntel = {
  summary?: string;
  keyPoints?: string[];
  riskFlags?: string[];
  opportunities?: string[];
  suggestedTags?: string[];
  researchQueries?: string[];
  confidence?: number;
  model?: string;
  generatedAt?: string;
  webSnippets?: Array<{ title: string; url: string; excerpt: string }>;
};

export type SecretVaultItem = {
  id: string;
  tenantId: string;
  type: SecretVaultItemType;
  mediaKind: SecretVaultMediaKind;
  title: string;
  notes?: string;
  tags?: string[];
  /** Blob store ref for uploaded files. */
  blobRef?: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  sha256?: string;
  /** External URL (YouTube, web, streaming). */
  sourceUrl?: string;
  /** YouTube video id when mediaKind=youtube */
  youtubeId?: string;
  scrapedAt?: string;
  intel?: SecretVaultIntel;
  /** Cross-role visibility — empty = owners/admins only. */
  sharedWithRoles?: SecretVaultShareRole[];
  /** Share intel with Nora Capital Group API consumers. */
  shareWithNcg?: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
};

export function nowIso() {
  return new Date().toISOString();
}

export const SECRET_VAULT_MEDIA_LABELS: Record<SecretVaultMediaKind, string> = {
  document: 'Document',
  ebook: 'E-book / PDF guide',
  video: 'Video link',
  video_upload: 'Uploaded video',
  youtube: 'YouTube',
  audio: 'Audio',
  image: 'Image',
  archive: 'Archive',
  url: 'Web link',
  other: 'Other',
};

export const SECRET_VAULT_SHARE_ROLES: Array<{ id: SecretVaultShareRole; label: string; hint: string }> = [
  { id: 'platform_admin', label: 'Platform admin', hint: 'Full Finely ops' },
  { id: 'tenant_owner', label: 'Tenant owner', hint: 'Business owner / principal' },
  { id: 'agent', label: 'Credit specialist', hint: 'Assigned agents & staff' },
  { id: 'partner', label: 'Partner (client)', hint: 'When explicitly shared' },
  { id: 'ncg_ops', label: 'Nora Capital ops', hint: 'NCG integration team' },
  { id: 'ncg_underwriter', label: 'NCG underwriting', hint: 'Funding review lane' },
  { id: 'affiliate', label: 'Affiliate', hint: 'Referral partners' },
  { id: 'finely_staff', label: 'Finely staff', hint: 'Internal support' },
];
