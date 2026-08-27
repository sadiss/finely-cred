import type { PartnerJourneyStage } from '../domain/partners';

export type RecommendedLesson = {
  label: string;
  path: string;
};

/** First curriculum destination for the partner's current journey stage. */
export function recommendedLessonForJourneyStage(stage?: PartnerJourneyStage | string | null): RecommendedLesson {
  switch (stage) {
    case 'intake':
    case 'report_upload':
      return {
        label: "Start today's recommended lesson",
        path: '/portal/education?section=curriculum',
      };
    case 'disputes':
    case 'letters':
    case 'evidence':
      return {
        label: "Start today's recommended lesson",
        path: '/portal/disputes',
      };
    case 'readiness':
    case 'funding':
      return {
        label: "Start today's recommended lesson",
        path: '/fundability-readiness',
      };
    default:
      return {
        label: "Start today's recommended lesson",
        path: '/portal/education?section=curriculum',
      };
  }
}
