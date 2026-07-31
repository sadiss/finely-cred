import { listCrmRecords } from '../../data/crmRecordsRepo';
import { listProspects } from '../../data/crmProspectsRepo';
import { listLeadTrash } from '../studioCommandOs/leadTrashRepo';
import { listNurtureEnrollments } from '../../lib/nurtureEngine';
import type { MarketingDeskHelperId } from './marketingDeskGlossary';
import { listMarketingDeskOpenTasks } from './marketingDeskMyWork';
import {
  countMarketingStagingPending,
  getMarketingFindLastRun,
} from './marketingDeskHunt';

function withinDays(iso: string, days: number) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= days * 86400000;
}

export type MarketingDeskKpi = {
  id: string;
  label: string;
  value: number;
  helper?: MarketingDeskHelperId;
  hint?: string;
};

function lastRunHint(): string | undefined {
  const last = getMarketingFindLastRun();
  if (!last?.at) return undefined;
  const when = new Date(last.at);
  const time = Number.isFinite(when.getTime())
    ? when.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : last.at;
  if (last.errors[0]) return `Last run ${time} · issue`;
  return `Last run ${time} · ${last.found} found · ${last.autoSaved} auto · ${last.review} review`;
}

/** Compact KPI chips for Marketing Desk home — real counts + last-run hints. */
export function getMarketingDeskKpis(): MarketingDeskKpi[] {
  const last = getMarketingFindLastRun();
  const prospects7d = listProspects().filter(
    (p) =>
      (p.tags ?? []).some((t) => t === 'lead-intel' || t === 'lead-engine' || t === 'marketing-desk') &&
      withinDays(p.createdAt, 7),
  ).length;

  const needsReview = countMarketingStagingPending();
  const autoSaved = last && withinDays(last.at, 7) ? last.autoSaved : 0;

  const mailSent7d = listNurtureEnrollments(200).filter((e) => {
    if (e.status === 'cancelled') return false;
    const sentHint = e.nextStepIndex > 0 || e.status === 'completed';
    return sentHint && withinDays(e.updatedAt ?? e.startedAt, 7);
  }).length;

  const booked7d = listCrmRecords({ kind: 'inbound_lead' }).filter(
    (r) => (r.stage === 'booked' || r.stage === 'won') && withinDays(r.updatedAt, 7),
  ).length;

  const junk = listLeadTrash().length;

  return [
    {
      id: 'found',
      label: 'Found (7d)',
      value: prospects7d,
      helper: 'find',
      hint: lastRunHint() || 'CRM saves this week',
    },
    {
      id: 'auto',
      label: 'Auto-saved',
      value: autoSaved,
      helper: 'find',
      hint: last ? 'From last Find run' : 'Run Find to populate',
    },
    {
      id: 'review',
      label: 'Needs review',
      value: needsReview,
      helper: 'find',
      hint: needsReview > 0 ? 'Review before save' : 'Queue clear',
    },
    {
      id: 'mail',
      label: 'Mail moved (7d)',
      value: mailSent7d,
      helper: 'mail',
      hint: 'Sequences advanced (not raw SMTP count)',
    },
    {
      id: 'booked',
      label: 'Booked (7d)',
      value: booked7d,
      helper: 'board',
      hint: 'Board stage',
    },
    {
      id: 'junk',
      label: 'Junk cleaned',
      value: junk,
      helper: 'clean',
      hint: 'Put back anytime',
    },
  ];
}

/** @deprecated Prefer listMarketingDeskOpenTasks — kept for MarketingDeskHome import. */
export function listMarketingMyWork(limit = 5) {
  return listMarketingDeskOpenTasks(limit);
}
