export type CustomFieldScope =
  | 'partners'
  | 'leads'
  | 'projects'
  | 'tasks'
  | 'team'
  | 'roles'
  | 'comms'
  | 'automation'
  | 'au_sellers'
  | 'affiliates';

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'json';

export type CustomFieldDefinition = {
  id: string;
  /** Tenant that owns this definition (white-label). Defaults to FINELY tenant when omitted (legacy). */
  tenantId?: string;
  scope: CustomFieldScope;
  /** Stable key used in stored values (e.g. "co_owner_name"). */
  key: string;
  label: string;
  type: CustomFieldType;
  required?: boolean;
  helpText?: string;
  /** For select/multiselect. */
  options?: string[];
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

export function createCustomFieldDefinition(args: {
  id?: string;
  scope: CustomFieldScope;
  key: string;
  label: string;
  type: CustomFieldType;
}): CustomFieldDefinition {
  const createdAt = nowIso();
  const id =
    args.id ??
    (crypto?.randomUUID ? crypto.randomUUID() : `cf_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`);
  return {
    id,
    scope: args.scope,
    key: args.key,
    label: args.label,
    type: args.type,
    createdAt,
    updatedAt: createdAt,
  };
}

