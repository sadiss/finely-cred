/**
 * First-run / How this works — dismissible Marketing Desk tour state.
 */
import { loadJson, saveJson } from '../../data/localJsonStore';

const KEY = 'finely.marketing_desk_tour.v1';

export const MARKETING_DESK_TOUR_ID = 'tour-marketing-desk';

export function hasSeenMarketingDeskTour(): boolean {
  return Boolean(loadJson<{ seen?: boolean }>(KEY, {}, 1).seen);
}

export function markMarketingDeskTourSeen() {
  saveJson(KEY, { seen: true, at: new Date().toISOString() }, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function resetMarketingDeskTour() {
  saveJson(KEY, { seen: false }, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function shouldAutoOpenMarketingDeskTour(): boolean {
  return !hasSeenMarketingDeskTour();
}

export const MARKETING_DESK_HOW_IT_WORKS = [
  'Open Marketing Desk each day (same browser profile).',
  'Check Mail chip — Ready vs Needs setup (checklist in Mail room).',
  'Do Today’s mission (Find, Review, or My work).',
  'Find new people → exceptions only for mid scores (approve good ones).',
  'Approve saves to CRM + enroll cold mail when Ready; else a to-do.',
  'Board — people who wrote in; Booked pauses mail, seeds partner when email on file, creates handoff.',
  'Set Work goes to (+ optional Alternate / Round-robin) so My work stays yours.',
  'Clean out junk — Put back if mistake (also stops mail).',
  'Stuck on words → Ruth. Reply / bounce / complaint webhooks pause matching mail when live.',
  'End of day: My work clear (≤5) or overdue = 0. Find failed / Convert / Hot reply float to the top.',
] as const;
