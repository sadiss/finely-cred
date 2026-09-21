/**
 * Training Academy registry (additive).
 * Specialist methodology content is served from docs via Admin Specialist Academy UI.
 */

export const SPECIALIST_ACADEMY_ROUTE = '/admin/specialist-academy';

export const SPECIALIST_ACADEMY_LESSONS = [
  { id: 'f-doctrine', title: 'Sanz doctrine', path: `${SPECIALIST_ACADEMY_ROUTE}/f-doctrine` },
  { id: 'f-debt-validation', title: 'Debt-first & validation', path: `${SPECIALIST_ACADEMY_ROUTE}/f-debt-validation` },
  { id: 'f-summons', title: 'Summons literacy', path: `${SPECIALIST_ACADEMY_ROUTE}/f-summons` },
  { id: 'f-rounds', title: 'Restore rounds', path: `${SPECIALIST_ACADEMY_ROUTE}/f-rounds` },
  { id: 'f-build', title: 'BUILD & funding-readiness', path: `${SPECIALIST_ACADEMY_ROUTE}/f-build` },
] as const;
