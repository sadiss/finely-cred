/**
 * Explainable Cold / Warm / Hot / Priority-hot state machine.
 * Profile completeness can raise fit, never intent, and never Hot on a cold directory row.
 */
import { isColdDirectoryLeadCapture, isPublicOrganizationRoleInbox } from './coldDirectory';
import type { LeadCapture } from '../domain/leads';

export type ProspectHeatState = 'cold' | 'warm' | 'hot' | 'priority_hot' | 'opted_in' | 'suppressed';

export type ProspectHeatEventType =
  | 'imported'
  | 'reviewed'
  | 'email_open'
  | 'bot_click'
  | 'first_party_click'
  | 'curious_reply'
  | 'positive_reply'
  | 'kit_request'
  | 'form_opt_in'
  | 'meeting_booked'
  | 'partnership_accepted'
  | 'unsubscribe'
  | 'bounce'
  | 'complaint';

const IGNORED_EVENTS = new Set<ProspectHeatEventType>(['email_open', 'bot_click', 'imported', 'reviewed']);

export type ProspectHeatInput = {
  isColdDirectory: boolean;
  events: ProspectHeatEventType[];
  publicOrgInbox: boolean;
  hasWebsite: boolean;
  laneMatched: boolean;
  consent: boolean;
};

export type ProspectHeatResult = {
  state: ProspectHeatState;
  fit: number;
  intent: number;
  recency: number;
  total: number;
  reasons: string[];
  allowedChannels: string[];
  consent: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function resolveProspectHeat(input: ProspectHeatInput): ProspectHeatResult {
  const reasons: string[] = [];
  const events = input.events ?? [];

  if (events.includes('unsubscribe') || events.includes('bounce') || events.includes('complaint')) {
    return {
      state: 'suppressed',
      fit: 0,
      intent: 0,
      recency: 0,
      total: 0,
      reasons: ['Terminal suppression (unsubscribe, bounce, or complaint)'],
      allowedChannels: [],
      consent: false,
    };
  }

  let fit = 0;
  if (input.publicOrgInbox) {
    fit += 12;
    reasons.push('Verified public organization/role inbox');
  }
  if (input.laneMatched) {
    fit += 10;
    reasons.push('Lane/audience match');
  }
  if (input.hasWebsite) {
    fit += 8;
    reasons.push('Website/source URL on file');
  }
  fit = clamp(fit, 0, 30);

  let intent = 0;
  const meaningful = events.filter((e) => !IGNORED_EVENTS.has(e));
  if (events.includes('email_open')) reasons.push('Email open ignored — no intent');
  if (events.includes('bot_click')) reasons.push('Bot/scanner click ignored — no intent');

  if (meaningful.includes('first_party_click')) {
    intent += 8;
    reasons.push('First-party click (warm signal only)');
  }
  if (meaningful.includes('curious_reply')) {
    intent += 16;
    reasons.push('Neutral/curious reply — manual review');
  }
  if (meaningful.includes('positive_reply')) {
    intent += 28;
    reasons.push('Positive reply');
  }
  if (meaningful.includes('kit_request')) {
    intent += 32;
    reasons.push('Explicit kit/co-brand request');
  }
  if (meaningful.includes('form_opt_in')) {
    intent += 36;
    reasons.push('Completed Finely form with consent');
  }
  if (meaningful.includes('meeting_booked')) {
    intent += 42;
    reasons.push('Booked meeting');
  }
  if (meaningful.includes('partnership_accepted')) {
    intent += 46;
    reasons.push('Partnership accepted');
  }
  intent = clamp(intent, 0, 50);

  const recency = meaningful.length ? 20 : 0;
  const total = clamp(fit + intent + recency, 0, 100);

  const hasHighIntent =
    meaningful.includes('positive_reply') ||
    meaningful.includes('kit_request') ||
    meaningful.includes('form_opt_in') ||
    meaningful.includes('meeting_booked') ||
    meaningful.includes('partnership_accepted');

  const hasWarmSignal =
    meaningful.includes('first_party_click') || meaningful.includes('curious_reply') || hasHighIntent;

  let state: ProspectHeatState = 'cold';
  if (input.isColdDirectory) {
    if (hasHighIntent && (meaningful.includes('meeting_booked') || meaningful.includes('partnership_accepted'))) {
      state = 'priority_hot';
    } else if (hasHighIntent) {
      state = 'hot';
    } else if (hasWarmSignal) {
      state = 'warm';
    } else {
      state = 'cold';
      if (fit > 0) reasons.push('Fit from public listing only — cannot create Hot');
    }
  } else if (total >= 75 && hasHighIntent) {
    state = 'priority_hot';
  } else if (hasHighIntent || total >= 58) {
    state = 'hot';
  } else if (hasWarmSignal || total >= 45) {
    state = 'warm';
  }

  const consent = input.consent || events.includes('form_opt_in');
  const opted = events.includes('form_opt_in') || consent;
  const allowedChannels = opted
    ? ['email_nurture', 'one_to_one']
    : input.isColdDirectory
      ? state === 'cold'
        ? []
        : ['one_to_one_reviewed']
      : ['one_to_one'];

  return {
    state,
    fit,
    intent,
    recency,
    total,
    reasons,
    allowedChannels,
    consent: opted,
  };
}

export function heatFromLeadCapture(lead: LeadCapture): ProspectHeatResult {
  const cold = isColdDirectoryLeadCapture(lead);
  const inbox = isPublicOrganizationRoleInbox(lead.email);
  return resolveProspectHeat({
    isColdDirectory: cold,
    events: [],
    publicOrgInbox: inbox.ok,
    hasWebsite: Boolean(lead.funnelPath),
    laneMatched: /haitian|affiliate|specialist|krey/i.test(`${lead.interest ?? ''} ${lead.offer}`),
    consent: Boolean(lead.consentEmailMarketing || (lead.consentToContact && !cold)),
  });
}
