import type { TemplateCategory } from './templates';
import type { EntitlementKey } from '../billing/entitlements';

export type TemplateVaultKind = 'text' | 'file' | 'link';

export type TemplateVaultItem = {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;

  title: string;
  category: TemplateCategory;
  tags?: string[];

  kind: TemplateVaultKind;

  // Text templates
  bodyText?: string;

  // File templates (stored in BlobStore; referenced here)
  blobRef?: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;

  // Link templates
  url?: string;

  /** Entitlements required to see/use this template. */
  requiredEntitlements: EntitlementKey[];

  createdBy?: { actorType: 'admin' | 'partner'; id?: string; email?: string };
};

