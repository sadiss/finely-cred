import type { ProspectHeatEventType, ProspectHeatState } from './prospectHeat';

export const HEAT_VERSION = 'v1';

export type ProspectOutreachStage =
  | 'cold_imported'
  | 'eligible_for_review'
  | 'approved_one_to_one'
  | 'email_1_sent'
  | 'followup_sent'
  | 'warm_manual_review'
  | 'hot'
  | 'priority_hot'
  | 'opted_in_or_partnered'
  | 'suppressed'
  | 'unsubscribed'
  | 'bounced'
  | 'not_relevant';

const TERMINAL: ProspectOutreachStage[] = ['suppressed', 'unsubscribed', 'bounced', 'not_relevant'];

const ORDER: ProspectOutreachStage[] = [
  'cold_imported',
  'eligible_for_review',
  'approved_one_to_one',
  'email_1_sent',
  'followup_sent',
  'warm_manual_review',
  'hot',
  'priority_hot',
  'opted_in_or_partnered',
];

export function isTerminalOutreachStage(stage: ProspectOutreachStage | undefined | null): boolean {
  return Boolean(stage && TERMINAL.includes(stage));
}

/** Never skip from import to send. Terminal stages stick. */
export function nextOutreachStage(
  current: ProspectOutreachStage | undefined,
  event: ProspectHeatEventType,
): ProspectOutreachStage {
  if (current && TERMINAL.includes(current)) return current;
  if (event === 'unsubscribe') return 'unsubscribed';
  if (event === 'bounce') return 'bounced';
  if (event === 'complaint') return 'suppressed';
  if (event === 'imported') return current ?? 'cold_imported';
  if (event === 'reviewed') return advance(current, 'eligible_for_review');
  if (event === 'first_party_click' || event === 'curious_reply') return advance(current, 'warm_manual_review');
  if (event === 'positive_reply' || event === 'kit_request') return advance(current, 'hot');
  if (event === 'form_opt_in') return 'opted_in_or_partnered';
  if (event === 'meeting_booked' || event === 'partnership_accepted') return advance(current, 'priority_hot');
  return current ?? 'cold_imported';
}

function advance(current: ProspectOutreachStage | undefined, target: ProspectOutreachStage): ProspectOutreachStage {
  if (!current) return target;
  if (TERMINAL.includes(current)) return current;
  if (current === 'opted_in_or_partnered') return current;
  return ORDER.indexOf(target) >= ORDER.indexOf(current) ? target : current;
}

export function stageFromHeatState(
  heat: ProspectHeatState,
  outreach: ProspectOutreachStage | undefined,
): ProspectOutreachStage {
  if (outreach && TERMINAL.includes(outreach)) return outreach;
  if (heat === 'suppressed') return 'suppressed';
  if (heat === 'opted_in') return 'opted_in_or_partnered';
  if (heat === 'priority_hot') return 'priority_hot';
  if (heat === 'hot') return 'hot';
  if (heat === 'warm') return 'warm_manual_review';
  return outreach ?? 'cold_imported';
}
