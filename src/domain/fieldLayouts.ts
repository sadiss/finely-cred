import type { CustomFieldScope } from './customFields';

export type FieldLayoutSection = {
  id: string;
  title: string;
  /** Ordered list of CustomFieldDefinition.id values. */
  fieldIds: string[];
};

export type FieldLayout = {
  id: string;
  tenantId: string;
  scope: CustomFieldScope;
  name: string;
  sections: FieldLayoutSection[];
  /** Optional hidden fields (definition ids). */
  hiddenFieldIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

export function createFieldLayout(args: { tenantId: string; scope: CustomFieldScope; name?: string }): FieldLayout {
  const createdAt = nowIso();
  const id =
    crypto?.randomUUID ? crypto.randomUUID() : `layout_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  return {
    id,
    tenantId: args.tenantId,
    scope: args.scope,
    name: (args.name || '').trim() || `${args.scope} layout`,
    sections: [{ id: 'main', title: 'Fields', fieldIds: [] }],
    hiddenFieldIds: [],
    createdAt,
    updatedAt: createdAt,
  };
}

