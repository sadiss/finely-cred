import type { CustomFieldScope } from './customFields';

export type CustomFieldValuesRecord = {
  /** Tenant that owns the values record (white-label). Defaults to FINELY tenant when omitted (legacy). */
  tenantId?: string;
  scope: CustomFieldScope;
  entityId: string;
  values: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

