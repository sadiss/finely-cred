import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listLeadCaptures } from '../../../../../data/leadsRepo';
import { listLeadOps, setLeadStage } from '../../../../../data/leadOpsRepo';
import type { LeadStage } from '../../../../../domain/leadOps';
import { LeadBulkImportPanel } from '../../../../leadsOs/LeadBulkImportPanel';
import { FinelyOsPaginatedStack } from '../../../../os/FinelyOsPaginatedStack';
import { scoreLead } from '../../../../../lib/leadScoring';
import { isLeadTrashed } from '../../../../studioCommandOs/leadTrashRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../../os/finelyOsLightUi';

const STAGES: LeadStage[] = ['new', 'contacted', 'booked', 'converted', 'disqualified'];

function formatAge(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

/** Raw inbound lead triage — queue, stage updates, bulk import. */
export function LeadsInboxEmbeddedPanel() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', refresh as EventListener);
    return () => window.removeEventListener('finely:store', refresh as EventListener);
  }, []);

  const ops = useMemo(() => new Map(listLeadOps().map((op) => [op.leadId, op])), [version]);

  const queue = useMemo(() => {
    void version;
    const q = query.trim().toLowerCase();
    return listLeadCaptures()
      .filter((lead) => !isLeadTrashed(lead.id))
      .filter((lead) => {
        const stage = ops.get(lead.id)?.stage ?? 'new';
        return stage === 'new' || stage === 'contacted';
      })
      .filter((lead) => {
        if (!q) return true;
        const hay = `${lead.fullName ?? ''} ${lead.email ?? ''} ${lead.source ?? ''} ${lead.offer ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [ops, query, version]);

  const selected = queue.find((lead) => lead.id === selectedId) ?? queue[0] ?? null;

  useEffect(() => {
    if (selected && selectedId !== selected.id) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const bumpStage = (leadId: string, stage: LeadStage) => {
    setLeadStage(leadId, stage);
    window.dispatchEvent(new Event('finely:store'));
    setVersion((v) => v + 1);
  };

  return (
    <div className="fc-wlp-growth-leads-embed">
      <div className="fc-wlp-growth-leads-toolbar">
        <div className="fc-wlp-growth-leads-search" data-fcm-accent="sky">
          <Search size={16} aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search unworked partners…"
            aria-label="Search leads"
          />
        </div>
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/crm?pipeline=inbound')}>
          Full CRM <ArrowRight size={14} aria-hidden />
        </button>
      </div>

      <div className="fc-wlp-growth-leads-workbench">
        <aside className="fc-wlp-growth-leads-queue" data-fcm-accent="rose">
          <p className="fc-wlp-growth-rail-label">Unworked queue · oldest first</p>
          {queue.length ? (
            <FinelyOsPaginatedStack
              items={queue}
              pageSize={8}
              emptyMessage="Queue is clear."
              itemSpacingClassName="space-y-2"
              renderItem={(lead) => {
                const stage = ops.get(lead.id)?.stage ?? 'new';
                const active = selected?.id === lead.id;
                return (
                  <button
                    key={lead.id}
                    type="button"
                    className="fc-wlp-growth-leads-queue-row"
                    data-active={active ? 'true' : undefined}
                    onClick={() => setSelectedId(lead.id)}
                  >
                    <strong>{lead.fullName || lead.email || lead.id}</strong>
                    <span>{lead.source || lead.offer || 'Inbound'}</span>
                    <em>{formatAge(lead.createdAt)} · {stage}</em>
                  </button>
                );
              }}
            />
          ) : (
            <p className="fc-wlp-growth-empty">No unworked leads — queue is clear.</p>
          )}
        </aside>

        <div className="fc-wlp-growth-leads-inspector" data-fcm-accent="violet">
          {selected ? (
            <>
              <p className="fc-wlp-growth-rail-label">Work this partner</p>
              <div className={`${finelyOsCatalogCard('violet')} fc-surface-harmony space-y-3`} data-fc-accent="violet">
                <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                  {selected.fullName || selected.email || selected.id}
                </div>
                <div className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
                  {selected.email}
                  {selected.phone ? ` · ${selected.phone}` : ''}
                </div>
                <div className={`text-sm ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  {selected.source || 'Inbound'} · {selected.interest || 'No interest tagged'}
                </div>
                {(() => {
                  const scored = scoreLead(selected);
                  return (
                    <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                      Fit score {scored.score} ({scored.band}) — {scored.suggestedAction}
                    </p>
                  );
                })()}
                <div className="flex flex-wrap gap-2 pt-2">
                  {STAGES.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      className={
                        (ops.get(selected.id)?.stage ?? 'new') === stage
                          ? FINELY_OS_PRIMARY_BTN
                          : FINELY_OS_SECONDARY_BTN
                      }
                      onClick={() => bumpStage(selected.id, stage)}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={FINELY_OS_PRIMARY_BTN}
                  onClick={() => navigate('/admin/crm?pipeline=inbound')}
                >
                  Open in CRM <ArrowRight size={14} aria-hidden />
                </button>
              </div>
            </>
          ) : (
            <div className="fc-wlp-growth-leads-placeholder" data-fcm-accent="emerald">
              <UserPlus size={32} aria-hidden />
              <strong>Queue is clear</strong>
              <p>New inbound partners appear here oldest-first.</p>
            </div>
          )}
        </div>

        <aside className="fc-wlp-growth-leads-import" data-fcm-accent="emerald">
          <p className="fc-wlp-growth-rail-label">Bulk import</p>
          <LeadBulkImportPanel onImported={() => setVersion((v) => v + 1)} />
        </aside>
      </div>
    </div>
  );
}
