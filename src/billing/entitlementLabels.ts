import { ENTITLEMENT_KEYS } from './entitlements';

const ENTITLEMENT_LABELS: Record<string, string> = {
  [ENTITLEMENT_KEYS.reports]: 'Credit reports',
  [ENTITLEMENT_KEYS.documents]: 'Documents vault',
  [ENTITLEMENT_KEYS.messages]: 'Messages & support',
  [ENTITLEMENT_KEYS.tasks]: 'Tasks & notifications',
  [ENTITLEMENT_KEYS.courses]: 'Education courses',
  [ENTITLEMENT_KEYS.disputes]: 'Dispute center',
  [ENTITLEMENT_KEYS.letters]: 'Letters (studio + vault)',
  [ENTITLEMENT_KEYS.templates]: 'Template library',
  [ENTITLEMENT_KEYS.debt]: 'Debt & summons',
  [ENTITLEMENT_KEYS.escalations]: 'Complaints & escalations',
  [ENTITLEMENT_KEYS.identityTheft]: 'Identity theft center',
  [ENTITLEMENT_KEYS.businessBuild]: 'Credit building center',
  [ENTITLEMENT_KEYS.packBankruptcy]: 'Letter pack: Bankruptcy',
  [ENTITLEMENT_KEYS.packRepossession]: 'Letter pack: Repossession',
  [ENTITLEMENT_KEYS.packForeclosure]: 'Letter pack: Foreclosure',
  [ENTITLEMENT_KEYS.packStudentLoans]: 'Letter pack: Student loans',
  [ENTITLEMENT_KEYS.packInquiries]: 'Letter pack: Inquiries',
};

export function entitlementLabel(key: string): string {
  return ENTITLEMENT_LABELS[key] ?? key.replace(/_/g, ' ');
}
