export type CrmEntityKind = 'partner' | 'lead' | 'prospect';

export type CrmCategoryId = string;

export type CrmCategory = {
  id: CrmCategoryId;
  label: string;
  /** Optional hex color like #f59e0b */
  color?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmCategoryAssignment = {
  id: string;
  entityKind: CrmEntityKind;
  entityId: string;
  categoryIds: CrmCategoryId[];
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

