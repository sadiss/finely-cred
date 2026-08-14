/**
 * Partner-facing "who's working on your case and what just happened" card (Wave 2 / B4).
 *
 * Sourced from the real, attributable agent handoff ledger (`growthHandoffLedgerRepo.ts`)
 * — every entry here reflects an actual recorded handoff, translated into plain, warm
 * language. No internal jargon (agent ids, "handoff ledger", raw action/status strings)
 * ever reaches this component's output; unresolved/unknown activity is described in
 * generic warm terms instead of leaking an internal name or code.
 */
import { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { listGrowthHandoffsForEntities, type GrowthHandoff, type GrowthHandoffStatus } from '../../data/growthHandoffLedgerRepo';
import { listCrmRecords } from '../../data/crmRecordsRepo';
import { resolveAgentDisplayName } from '../../lib/agentAuditLog';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';

function timeAgoLabel(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** First name only — warm and personal without exposing internal role titles. */
function friendlyFirstName(agentId: string): string | null {
  const name = resolveAgentDisplayName(agentId);
  if (!name || name.trim().toLowerCase() === agentId.trim().toLowerCase()) return null;
  return name.trim().split(/\s+/)[0];
}

const ACTION_PHRASES: Record<string, (from: string, to: string) => string> = {
  route_to_booking_outreach: (from, to) =>
    `${from} reviewed your file and handed it to ${to} to reach out and get a strategy call on the books.`,
  brain_routed: (from, to) => `${from} moved your file forward to ${to} for the next step.`,
  channel_performance_brief: (from, to) => `${from} sent ${to} an update to help keep your outreach on track.`,
};

function describeHandoffAction(action: string, from: string, to: string): string {
  const phrase = ACTION_PHRASES[action];
  if (phrase) return phrase(from, to);
  const humanized = action.replace(/_/g, ' ').trim();
  return `${from} passed your file to ${to}${humanized ? ` — ${humanized}` : ''}.`;
}

function statusMeta(status: GrowthHandoffStatus): { label: string; tone: 'ok' | 'warn' | 'blocked' } {
  if (status === 'completed') return { label: 'Done', tone: 'ok' };
  if (status === 'acked') return { label: 'Picked up', tone: 'ok' };
  if (status === 'stalled') return { label: 'Getting extra attention', tone: 'blocked' };
  return { label: 'In progress', tone: 'warn' };
}

type CaseTeamEntry = {
  id: string;
  createdAt: string;
  text: string;
  status: ReturnType<typeof statusMeta>;
};

function toCaseTeamEntry(h: GrowthHandoff): CaseTeamEntry {
  const from = friendlyFirstName(h.fromAgentId) ?? 'Your case team';
  const to = friendlyFirstName(h.toAgentId) ?? 'the next specialist';
  return {
    id: h.id,
    createdAt: h.createdAt,
    text: describeHandoffAction(h.action, from, to),
    status: statusMeta(h.status),
  };
}

export function CaseTeamActivityTimeline({
  partnerId,
  accent = 'sky',
  maxItems = 6,
}: {
  partnerId?: string;
  accent?: FinelyOsPublicAccent;
  maxItems?: number;
}) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const entries = useMemo(() => {
    if (!partnerId) return [];
    void version; // recompute on local-store writes (new handoffs, CRM record links)
    let recordIds: string[] = [];
    try {
      recordIds = listCrmRecords()
        .filter((r) => r.partnerId === partnerId)
        .map((r) => r.id);
    } catch {
      // CRM cross-reference is best-effort — the partner's own id still matches direct handoffs.
    }
    const handoffs = listGrowthHandoffsForEntities([partnerId, ...recordIds], maxItems);
    return handoffs.map(toCaseTeamEntry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, maxItems, version]);

  if (!partnerId) return null;

  return (
    <div className={finelyOsCatalogCardCompact(accent)} data-fc-accent={accent} data-fc-case-team-timeline="1">
      <div className="flex items-center gap-2">
        <Users size={15} className="text-sky-300 shrink-0" />
        <div className="min-w-0">
          <div className={FINELY_OS_ENTITY_VALUE}>Your case team</div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>Who&apos;s working your file, and what just happened</div>
        </div>
      </div>
      {entries.length === 0 ? (
        <div className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
          Your case team hasn&apos;t logged an update here yet — check back soon.
        </div>
      ) : (
        <ol className="mt-3 space-y-2.5">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-3 border-t border-white/5 pt-2.5 first:border-0 first:pt-0">
              <div className={`${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed min-w-0`}>{entry.text}</div>
              <div className="shrink-0 text-right space-y-1">
                <span className={finelyOsStatusChip(entry.status.tone)}>{entry.status.label}</span>
                <div className="text-[10px] text-white/40 font-mono">{timeAgoLabel(entry.createdAt)}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default CaseTeamActivityTimeline;
