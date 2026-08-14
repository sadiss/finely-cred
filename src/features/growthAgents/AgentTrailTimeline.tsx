/**
 * Verifiable agent trail — Phase 3's concrete answer to "make it verifiable."
 * Two modes: per-lead (which agent touched this record, when, why, outcome) and
 * team-wide (recent handoffs in flight across every growth agent). Both read the
 * same handoff ledger + agent audit trail, so what's shown here is exactly what
 * actually happened — not a marketing summary of it.
 */
import { useEffect, useState } from 'react';
import { ArrowRight, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { listGrowthHandoffs, listGrowthHandoffsForEntity, type GrowthHandoff } from '../../data/growthHandoffLedgerRepo';
import { listAuditEvents } from '../../data/auditRepo';
import type { AuditEvent } from '../../domain/audit';
import { resolveAgentDisplayName } from '../../lib/agentAuditLog';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

function timeAgoLabel(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function HandoffRow({ h }: { h: GrowthHandoff }) {
  const statusChip =
    h.status === 'stalled'
      ? finelyOsStatusChip('blocked')
      : h.status === 'completed' || h.status === 'acked'
        ? finelyOsStatusChip('ok')
        : finelyOsStatusChip('warn');
  return (
    <div className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0">
      {h.status === 'stalled' ? (
        <AlertTriangle size={14} className="text-rose-300 mt-0.5 shrink-0" />
      ) : (
        <ShieldCheck size={14} className="text-emerald-300 mt-0.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className={`flex flex-wrap items-center gap-1.5 text-xs ${FINELY_OS_ENTITY_VALUE}`}>
          <span>{resolveAgentDisplayName(h.fromAgentId)}</span>
          <ArrowRight size={10} className="text-white/35" />
          <span>{resolveAgentDisplayName(h.toAgentId)}</span>
          <span className={statusChip}>{h.status}</span>
        </div>
        <div className={`text-[11px] mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>
          {h.action}
          {h.reasoning ? ` — ${h.reasoning}` : ''}
        </div>
        <div className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
          <Clock size={10} /> {timeAgoLabel(h.createdAt)}
        </div>
      </div>
    </div>
  );
}

function ActionRow({ e }: { e: AuditEvent }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0">
      <ShieldCheck size={14} className="text-violet-300 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className={`text-xs ${FINELY_OS_ENTITY_VALUE}`}>{e.actorEmail || e.actorUserId || 'agent'}</div>
        <div className={`text-[11px] mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>
          {e.action}
          {typeof e.meta?.reasoning === 'string' && e.meta.reasoning ? ` — ${e.meta.reasoning}` : ''}
        </div>
        <div className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
          <Clock size={10} /> {timeAgoLabel(e.createdAt)}
        </div>
      </div>
    </div>
  );
}

/** Per-lead trail — drop into a CRM record detail panel. */
export function AgentTrailForEntity({ entityId }: { entityId: string }) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const handoffs = listGrowthHandoffsForEntity(entityId);
  const actions = listAuditEvents().filter((e) => e.actorType === 'agent' && e.entityId === entityId);
  void version;

  if (!handoffs.length && !actions.length) {
    return <div className={FINELY_OS_ENTITY_EMPTY}>No agent activity logged for this record yet.</div>;
  }

  const combined = [
    ...handoffs.map((h) => ({ at: h.createdAt, node: <HandoffRow key={h.id} h={h} /> })),
    ...actions.map((e) => ({ at: e.createdAt, node: <ActionRow key={e.id} e={e} /> })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className={`${finelyOsCatalogCardCompact('violet')} !p-3`}>
      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-1`}>Agent trail — verifiable</div>
      <div>{combined.map((c) => c.node)}</div>
    </div>
  );
}

/** Team-wide feed — drop into the Growth Command Hub. */
export function AgentTeamTrailFeed({ limit = 15 }: { limit?: number }) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);
  void version;

  const handoffs = listGrowthHandoffs(limit);

  return (
    <div className={`${finelyOsCatalogCardCompact('violet')} !p-3`}>
      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-1`}>Team handoffs in flight</div>
      {handoffs.length ? (
        <div>{handoffs.map((h) => <HandoffRow key={h.id} h={h} />)}</div>
      ) : (
        <div className={FINELY_OS_ENTITY_EMPTY}>No handoffs yet — they will appear as agents coordinate.</div>
      )}
    </div>
  );
}

export default AgentTrailForEntity;
