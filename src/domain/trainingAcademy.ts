/**
 * Training Academy registry (additive).
 * Specialist content: docs via Admin Specialist Academy UI + in-app quizzes.
 */

import { ACADEMY_QUIZZES } from '../specialistAcademy/academyQuizzes';

export const SPECIALIST_ACADEMY_ROUTE = '/admin/specialist-academy';

export const SPECIALIST_ACADEMY_LESSONS = [
  { id: 'f-consumer-power', title: 'Consumer power', path: `${SPECIALIST_ACADEMY_ROUTE}/f-consumer-power` },
  { id: 'f-doctrine', title: 'Sanz doctrine', path: `${SPECIALIST_ACADEMY_ROUTE}/f-doctrine` },
  { id: 'f-debt-validation', title: 'Debt-first & validation', path: `${SPECIALIST_ACADEMY_ROUTE}/f-debt-validation` },
  { id: 'f-debt-legal', title: 'Debt & Legal', path: `${SPECIALIST_ACADEMY_ROUTE}/f-debt-legal` },
  { id: 'f-summons', title: 'Summons literacy', path: `${SPECIALIST_ACADEMY_ROUTE}/f-summons` },
  { id: 'f-rounds', title: 'Restore rounds', path: `${SPECIALIST_ACADEMY_ROUTE}/f-rounds` },
  { id: 'f-build', title: 'BUILD & funding-readiness', path: `${SPECIALIST_ACADEMY_ROUTE}/f-build` },
] as const;

export const SPECIALIST_ACADEMY_COMPLIANCE = [
  { id: 'h-curriculum', title: 'Compliance curriculum map', path: `${SPECIALIST_ACADEMY_ROUTE}/h-curriculum` },
  { id: 'h-metro2', title: 'Metro 2', path: `${SPECIALIST_ACADEMY_ROUTE}/h-metro2` },
  { id: 'h-fcra', title: 'FCRA', path: `${SPECIALIST_ACADEMY_ROUTE}/h-fcra` },
  { id: 'h-fdcpa', title: 'FDCPA', path: `${SPECIALIST_ACADEMY_ROUTE}/h-fdcpa` },
  { id: 'h-cfpb', title: 'CFPB', path: `${SPECIALIST_ACADEMY_ROUTE}/h-cfpb` },
] as const;

export const SPECIALIST_ACADEMY_QUIZZES = ACADEMY_QUIZZES.map((q) => ({
  id: q.id,
  title: q.title,
  questionCount: q.questions.length,
  passPercent: q.passPercent,
  path: `${SPECIALIST_ACADEMY_ROUTE}/quiz/${q.id}`,
}));

/** Partner-facing alias — same curriculum for internal specialists with portal access. */
export const PARTNER_TRAINING_ACADEMY_ROUTE = SPECIALIST_ACADEMY_ROUTE;
