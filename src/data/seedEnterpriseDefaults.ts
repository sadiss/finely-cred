import type { CustomFieldDefinition, CustomFieldScope } from '../domain/customFields';
import { nowIso } from '../domain/customFields';
import { upsertCustomFieldDefinition, listCustomFieldDefinitions } from './customFieldsRepo';
import type { FieldLayout } from '../domain/fieldLayouts';
import { upsertFieldLayout, getFieldLayout } from './fieldLayoutsRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';

type SeedField = Omit<CustomFieldDefinition, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string };

function seedId(tenantId: string, scope: CustomFieldScope, key: string) {
  return `seed_${tenantId}_${scope}_${key}`;
}

function seedLayoutId(tenantId: string, scope: CustomFieldScope) {
  return `seed_layout_${tenantId}_${scope}_default`;
}

function mkField(args: {
  tenantId: string;
  scope: CustomFieldScope;
  key: string;
  label: string;
  type: CustomFieldDefinition['type'];
  required?: boolean;
  helpText?: string;
  options?: string[];
}): SeedField {
  const createdAt = nowIso();
  return {
    id: seedId(args.tenantId, args.scope, args.key),
    tenantId: args.tenantId,
    scope: args.scope,
    key: args.key,
    label: args.label,
    type: args.type,
    required: args.required,
    helpText: args.helpText,
    options: args.options,
    createdAt,
    updatedAt: createdAt,
  };
}

function upsertSeedField(def: SeedField) {
  upsertCustomFieldDefinition({
    ...(def as CustomFieldDefinition),
    createdAt: def.createdAt ?? nowIso(),
    updatedAt: def.updatedAt ?? nowIso(),
  });
}

function ensureDefaultLayout(args: { tenantId: string; scope: CustomFieldScope; name: string; sections: Array<{ id: string; title: string; fieldIds: string[] }> }) {
  const existing = getFieldLayout({ tenantId: args.tenantId, scope: args.scope });
  if (existing) return existing;
  const createdAt = nowIso();
  const layout: FieldLayout = {
    id: seedLayoutId(args.tenantId, args.scope),
    tenantId: args.tenantId,
    scope: args.scope,
    name: args.name,
    sections: args.sections,
    hiddenFieldIds: [],
    createdAt,
    updatedAt: createdAt,
  };
  return upsertFieldLayout(layout);
}

/**
 * Seeds “enterprise defaults” (definitions + layouts) per tenant.
 * Safe to call repeatedly — it only fills missing definitions/layouts.
 */
export function ensureEnterpriseDefaults(args?: { tenantId?: string }) {
  const tenantId = (args?.tenantId || '').trim() || FINELY_TENANT_ID;

  const existing = listCustomFieldDefinitions({ tenantId });
  const have = new Set(existing.map((d) => `${d.scope}:${d.key}`));

  const fields: SeedField[] = [
    // ── Partners (identity + letters + monitoring)
    mkField({ tenantId, scope: 'partners', key: 'legal_first_name', label: 'Legal first name', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'legal_last_name', label: 'Legal last name', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'dob', label: 'Date of birth', type: 'date' }),
    mkField({ tenantId, scope: 'partners', key: 'ssn_last4', label: 'SSN (last 4)', type: 'text', helpText: 'Store only last 4 digits.' }),
    mkField({ tenantId, scope: 'partners', key: 'phone', label: 'Phone', type: 'text' }),

    mkField({ tenantId, scope: 'partners', key: 'address1', label: 'Mailing address (line 1)', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'address2', label: 'Mailing address (line 2)', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'city', label: 'City', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'state', label: 'State', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'postal_code', label: 'ZIP / Postal code', type: 'text' }),

    mkField({
      tenantId,
      scope: 'partners',
      key: 'credit_monitor_provider',
      label: 'Credit monitoring provider',
      type: 'select',
      options: ['IdentityIQ', 'MyScoreIQ', 'SmartCredit', 'Experian', 'Credit Karma', 'Other'],
    }),
    mkField({ tenantId, scope: 'partners', key: 'credit_monitor_username', label: 'Credit monitoring username', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'credit_monitor_password', label: 'Credit monitoring password', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'experian_username', label: 'Experian username', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'experian_password', label: 'Experian password', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'transunion_username', label: 'TransUnion username', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'transunion_password', label: 'TransUnion password', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'equifax_username', label: 'Equifax username', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'equifax_password', label: 'Equifax password', type: 'text' }),
    mkField({
      tenantId,
      scope: 'partners',
      key: 'lexisnexis_optout_status',
      label: 'LexisNexis opt-out status',
      type: 'select',
      options: ['not_started', 'in_progress', 'confirmed'],
      helpText: 'Optional tracking field.',
    }),

    mkField({ tenantId, scope: 'partners', key: 'duns_number', label: 'D-U-N-S number', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'bradstreet_username', label: 'D&B username', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'bradstreet_password', label: 'D&B password', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'profile_notes', label: 'Profile notes', type: 'textarea' }),
    mkField({ tenantId, scope: 'partners', key: 'social_facebook', label: 'Facebook profile URL', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'social_instagram', label: 'Instagram handle', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'social_linkedin', label: 'LinkedIn profile URL', type: 'text' }),

    mkField({ tenantId, scope: 'partners', key: 'social_facebook', label: 'Facebook profile URL', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'social_instagram', label: 'Instagram handle', type: 'text' }),
    mkField({ tenantId, scope: 'partners', key: 'social_linkedin', label: 'LinkedIn profile URL', type: 'text' }),

    // ── Projects (enterprise tracking)
    mkField({
      tenantId,
      scope: 'projects',
      key: 'project_stage',
      label: 'Stage',
      type: 'select',
      options: ['intake', 'reports', 'evidence', 'disputes', 'rebuild', 'funding', 'complete'],
    }),
    mkField({
      tenantId,
      scope: 'projects',
      key: 'primary_goal',
      label: 'Primary goal',
      type: 'select',
      options: ['restore', 'build', 'funding', 'debt', 'identity', 'other'],
    }),
    mkField({
      tenantId,
      scope: 'projects',
      key: 'bureau_focus',
      label: 'Bureau focus',
      type: 'multiselect',
      options: ['EQF', 'EXP', 'TUC'],
    }),
    mkField({ tenantId, scope: 'projects', key: 'project_priority', label: 'Priority', type: 'select', options: ['low', 'normal', 'high', 'urgent'] }),
    mkField({ tenantId, scope: 'projects', key: 'start_date', label: 'Start date', type: 'date' }),
    mkField({ tenantId, scope: 'projects', key: 'target_due_date', label: 'Target due date', type: 'date' }),
    mkField({ tenantId, scope: 'projects', key: 'next_review_date', label: 'Next review date', type: 'date' }),
    mkField({ tenantId, scope: 'projects', key: 'current_score', label: 'Current score (est.)', type: 'number' }),
    mkField({ tenantId, scope: 'projects', key: 'target_score', label: 'Target score', type: 'number' }),
    mkField({ tenantId, scope: 'projects', key: 'funding_goal', label: 'Funding goal (USD)', type: 'number' }),
    mkField({ tenantId, scope: 'projects', key: 'budget_usd', label: 'Budget (USD)', type: 'number' }),
    mkField({ tenantId, scope: 'projects', key: 'risk_flags', label: 'Risk flags', type: 'multiselect', options: ['missing_docs', 'identity', 'high_util', 'thin_file', 'fraud_block', 'bankruptcy'] }),
    mkField({ tenantId, scope: 'projects', key: 'mail_tracking_number', label: 'Mail tracking #', type: 'text' }),
    mkField({ tenantId, scope: 'projects', key: 'mail_method', label: 'Mail method', type: 'select', options: ['first_class', 'certified', 'priority', 'other'] }),
    mkField({ tenantId, scope: 'projects', key: 'compliance_consent_on_file', label: 'Consent on file', type: 'boolean' }),
    mkField({ tenantId, scope: 'projects', key: 'project_notes', label: 'Project notes', type: 'textarea' }),

    // ── Tasks (extra fields beyond core task model)
    mkField({ tenantId, scope: 'tasks', key: 'task_category', label: 'Category', type: 'select', options: ['reports', 'evidence', 'letters', 'mailing', 'follow_up', 'rebuild', 'general'] }),
    mkField({ tenantId, scope: 'tasks', key: 'task_channel', label: 'Channel', type: 'select', options: ['portal', 'email', 'phone', 'mail', 'in_person', 'other'] }),
    mkField({ tenantId, scope: 'tasks', key: 'mail_date', label: 'Mail date', type: 'date' }),
    mkField({ tenantId, scope: 'tasks', key: 'mail_tracking_number', label: 'Mail tracking #', type: 'text' }),
    mkField({ tenantId, scope: 'tasks', key: 'call_outcome', label: 'Call outcome', type: 'textarea' }),
    mkField({ tenantId, scope: 'tasks', key: 'blocking_issue', label: 'Blocking issue', type: 'textarea' }),
    mkField({ tenantId, scope: 'tasks', key: 'external_reference', label: 'External reference', type: 'text', helpText: 'Tracking #, case #, or vendor ref.' }),
    mkField({ tenantId, scope: 'tasks', key: 'doc_requested', label: 'Document requested', type: 'text' }),
    mkField({ tenantId, scope: 'tasks', key: 'doc_received', label: 'Document received', type: 'boolean' }),
  ];

  for (const f of fields) {
    const k = `${f.scope}:${f.key}`;
    if (have.has(k)) continue;
    upsertSeedField(f);
  }

  // Default layouts (only if missing) — place the new seeded fields into clear sections.
  const partnerFieldIds = (k: string) => seedId(tenantId, 'partners', k);
  ensureDefaultLayout({
    tenantId,
    scope: 'partners',
    name: 'Partner profile (enterprise)',
    sections: [
      { id: 'identity', title: 'Identity', fieldIds: [partnerFieldIds('legal_first_name'), partnerFieldIds('legal_last_name'), partnerFieldIds('dob'), partnerFieldIds('ssn_last4'), partnerFieldIds('phone')] },
      { id: 'mailing', title: 'Mailing address (letters)', fieldIds: [partnerFieldIds('address1'), partnerFieldIds('address2'), partnerFieldIds('city'), partnerFieldIds('state'), partnerFieldIds('postal_code')] },
      { id: 'monitoring', title: 'Monitoring logins', fieldIds: [partnerFieldIds('credit_monitor_provider'), partnerFieldIds('credit_monitor_username'), partnerFieldIds('credit_monitor_password')] },
      { id: 'bureaus', title: 'Bureau logins (optional)', fieldIds: [partnerFieldIds('experian_username'), partnerFieldIds('experian_password'), partnerFieldIds('transunion_username'), partnerFieldIds('transunion_password'), partnerFieldIds('equifax_username'), partnerFieldIds('equifax_password')] },
      { id: 'business', title: 'Business identifiers (optional)', fieldIds: [partnerFieldIds('duns_number'), partnerFieldIds('bradstreet_username'), partnerFieldIds('bradstreet_password')] },
      { id: 'social', title: 'Social & web', fieldIds: [partnerFieldIds('social_facebook'), partnerFieldIds('social_instagram'), partnerFieldIds('social_linkedin')] },
      { id: 'notes', title: 'Notes', fieldIds: [partnerFieldIds('lexisnexis_optout_status'), partnerFieldIds('profile_notes')] },
    ],
  });

  const projectFieldIds = (k: string) => seedId(tenantId, 'projects', k);
  ensureDefaultLayout({
    tenantId,
    scope: 'projects',
    name: 'Projects (enterprise)',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        fieldIds: [
          projectFieldIds('project_stage'),
          projectFieldIds('primary_goal'),
          projectFieldIds('bureau_focus'),
          projectFieldIds('project_priority'),
          projectFieldIds('start_date'),
          projectFieldIds('target_due_date'),
          projectFieldIds('next_review_date'),
        ],
      },
      {
        id: 'metrics',
        title: 'Metrics',
        fieldIds: [projectFieldIds('current_score'), projectFieldIds('target_score'), projectFieldIds('funding_goal'), projectFieldIds('budget_usd')],
      },
      {
        id: 'ops',
        title: 'Ops & risk',
        fieldIds: [
          projectFieldIds('risk_flags'),
          projectFieldIds('mail_method'),
          projectFieldIds('mail_tracking_number'),
          projectFieldIds('compliance_consent_on_file'),
          projectFieldIds('project_notes'),
        ],
      },
    ],
  });

  const taskFieldIds = (k: string) => seedId(tenantId, 'tasks', k);
  ensureDefaultLayout({
    tenantId,
    scope: 'tasks',
    name: 'Tasks (enterprise)',
    sections: [
      {
        id: 'meta',
        title: 'Task metadata',
        fieldIds: [
          taskFieldIds('task_category'),
          taskFieldIds('task_channel'),
          taskFieldIds('external_reference'),
          taskFieldIds('mail_date'),
          taskFieldIds('mail_tracking_number'),
        ],
      },
      { id: 'blockers', title: 'Blockers', fieldIds: [taskFieldIds('blocking_issue')] },
      { id: 'docs', title: 'Documents', fieldIds: [taskFieldIds('doc_requested'), taskFieldIds('doc_received')] },
      { id: 'outcomes', title: 'Outcomes', fieldIds: [taskFieldIds('call_outcome')] },
    ],
  });
}

let seededTenants: Set<string> | null = null;

/** Browser-safe “seed once per session” wrapper. */
export function ensureEnterpriseDefaultsOnce(args?: { tenantId?: string }) {
  const tenantId = (args?.tenantId || '').trim() || FINELY_TENANT_ID;
  if (!seededTenants) seededTenants = new Set<string>();
  if (seededTenants.has(tenantId)) return;
  seededTenants.add(tenantId);
  ensureEnterpriseDefaults({ tenantId });
}

