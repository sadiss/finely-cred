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

/** Track H — compliance literacy (additive deep links). */
export const SPECIALIST_ACADEMY_COMPLIANCE = [
  { id: 'h-curriculum', title: 'Compliance curriculum map', path: `${SPECIALIST_ACADEMY_ROUTE}/h-curriculum` },
  { id: 'h-metro2', title: 'Metro 2', path: `${SPECIALIST_ACADEMY_ROUTE}/h-metro2` },
  { id: 'h-fcra', title: 'FCRA', path: `${SPECIALIST_ACADEMY_ROUTE}/h-fcra` },
  { id: 'h-fdcpa', title: 'FDCPA', path: `${SPECIALIST_ACADEMY_ROUTE}/h-fdcpa` },
  { id: 'h-cfpb', title: 'CFPB', path: `${SPECIALIST_ACADEMY_ROUTE}/h-cfpb` },
  { id: 'h-tila', title: 'TILA', path: `${SPECIALIST_ACADEMY_ROUTE}/h-tila` },
  { id: 'h-respa', title: 'RESPA', path: `${SPECIALIST_ACADEMY_ROUTE}/h-respa` },
  { id: 'h-ucc', title: 'UCC awareness', path: `${SPECIALIST_ACADEMY_ROUTE}/h-ucc` },
  { id: 'h-repo', title: 'Repossession', path: `${SPECIALIST_ACADEMY_ROUTE}/h-repo` },
  { id: 'h-foreclosure', title: 'Foreclosure literacy', path: `${SPECIALIST_ACADEMY_ROUTE}/h-foreclosure` },
] as const;
