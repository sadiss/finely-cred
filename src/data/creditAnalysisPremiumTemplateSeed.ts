import { FINELY_TENANT_ID } from '../domain/tenants';
import type { TemplateVaultItem } from '../domain/templateVault';
import { getTemplateVaultItem, upsertTemplateVaultItem, defaultRequiredEntitlementsForCategory } from './templateVaultRepo';

const TEMPLATE_ID = 'seed_tplv_premium_credit_analysis_v1';

const PREMIUM_TEMPLATE_BODY = JSON.stringify(
  {
    version: 1,
    engine: 'premium_spreads',
    spreadPackId: 'finely_premium_v1',
    title: 'Premium Credit Analysis Report',
    badgeLine: 'Finely Cred · Executive credit intelligence',
    variant: 'standard',
  },
  null,
  2,
);

export function ensurePremiumCreditAnalysisTemplateOnce() {
  const tenantId = FINELY_TENANT_ID;
  const existing = getTemplateVaultItem({ tenantId, id: TEMPLATE_ID });
  const now = new Date().toISOString();
  const next: TemplateVaultItem = {
    id: TEMPLATE_ID,
    tenantId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    title: 'Premium Credit Analysis (10 spreads)',
    category: 'ops',
    kind: 'text',
    bodyText: PREMIUM_TEMPLATE_BODY,
    tags: ['analysis_report_template', 'premium_spreads', 'analysis_variant:standard'],
    requiredEntitlements: defaultRequiredEntitlementsForCategory('ops'),
  };
  upsertTemplateVaultItem(next);
  return TEMPLATE_ID;
}
