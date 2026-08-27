import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, Gavel, Scale, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { listAllEscalations, updateEscalationStatus } from '../../../../data/escalationsRepo';
import { listAllRegulatoryComplaints, setRegulatoryComplaintStatus } from '../../../../data/regulatoryComplaintsRepo';
import { listPartnersByTenant } from '../../../../data/partnersRepo';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { getAccessiblePartnerIdsForAdmin } from '../../../../tenancy/adminPartnerScope';
import type { EscalationStatus } from '../../../../domain/escalations';
import type { RegulatoryComplaintStatus } from '../../../../domain/regulatoryComplaints';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
  finelyOsViewTab,
  FINELY_OS_VIEW_TABS,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminDisputeCollaborationProductSurface.css';

type TimelineKind = 'escalation' | 'regulatory';
type QueueFilter = 'all' | 'escalation' | 'regulatory';

type TimelineEntry = {
  id: string;
  kind: TimelineKind;
  at: string;
  partnerId: string;
  title: string;
  body: string;
  status: string;
  meta: string;
  caseId?: string;
  priority?: string;
  bodyLabel?: string;
};

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function isOpenEscalation(status: string) {
  return status === 'open' || status === 'in_review';
}

function isOpenComplaint(status: string) {
  return ['draft', 'submitted', 'in_review'].includes(status);
}

export default function AdminDisputeCollaborationProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';

  const [version, setVersion] = useState(0);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [allowedPartnerIds, setAllowedPartnerIds] = useState<Set<string>>(new Set());
  const [partnerIndex, setPartnerIndex] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) return;
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then(async (allowed) => {
      setAllowedPartnerIds(allowed);
      const all = await listPartnersByTenant(tenantId);
      const idx = new Map(
        all
          .filter((p) => allowed.has(p.id))
          .map((p) => [p.id, p.profile.fullName || p.profile.email || p.id]),
      );
      setPartnerIndex(idx);
    });
  }, [auth.user, version]);

  const escalations = useMemo(() => {
    return listAllEscalations().filter((e) => allowedPartnerIds.has(e.partnerId));
  }, [allowedPartnerIds, version]);

  const complaints = useMemo(() => {
    return listAllRegulatoryComplaints().filter((c) => allowedPartnerIds.has(c.partnerId));
  }, [allowedPartnerIds, version]);

  const timeline = useMemo((): TimelineEntry[] => {
    const rows: TimelineEntry[] = [
      ...escalations.map((e) => ({
        id: `esc:${e.id}`,
        kind: 'escalation' as const,
        at: e.updatedAt || e.createdAt,
        partnerId: e.partnerId,
        title: e.title,
        body: e.description,
        status: e.status,
        meta: `${e.topic.replace(/_/g, ' ')}${e.disputeRound ? ` · ${e.disputeRound}` : ''}`,
        caseId: e.caseId,
        priority: e.priority,
      })),
      ...complaints.map((c) => ({
        id: `reg:${c.id}`,
        kind: 'regulatory' as const,
        at: c.updatedAt || c.createdAt,
        partnerId: c.partnerId,
        title: c.targetName,
        body: c.narrative,
        status: c.status,
        meta: `${c.disputeRound ? `${c.disputeRound} · ` : ''}${c.referenceNumber ? `ref ${c.referenceNumber}` : c.body}`,
        caseId: c.caseId,
        bodyLabel: c.body,
      })),
    ];
    return rows.sort((a, b) => b.at.localeCompare(a.at));
  }, [escalations, complaints]);

  const filteredQueue = useMemo(() => {
    if (queueFilter === 'all') return timeline;
    return timeline.filter((e) => e.kind === queueFilter);
  }, [timeline, queueFilter]);

  const selected = useMemo(() => {
    if (!selectedId) return filteredQueue[0] ?? null;
    return filteredQueue.find((e) => e.id === selectedId) ?? filteredQueue[0] ?? null;
  }, [filteredQueue, selectedId]);

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected?.id]);

  const openEscalations = escalations.filter((e) => isOpenEscalation(e.status)).length;
  const openComplaints = complaints.filter((c) => isOpenComplaint(c.status)).length;
  const urgentEscalations = escalations.filter((e) => isOpenEscalation(e.status) && e.priority === 'high').length;

  const updateEscalation = (id: string, status: EscalationStatus) => {
    const rawId = id.replace(/^esc:/, '');
    updateEscalationStatus(rawId, status);
    setVersion((v) => v + 1);
  };

  const updateComplaint = (id: string, status: RegulatoryComplaintStatus) => {
    const rawId = id.replace(/^reg:/, '');
    setRegulatoryComplaintStatus({ id: rawId, status });
    setVersion((v) => v + 1);
  };

  const selectedIsEscalation = selected?.kind === 'escalation';

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Delivery"
      title="Dispute collaboration"
      description="Review partner escalations and regulatory complaints — pick a thread, update status, open the case."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={
        <ProductPagePrimaryAction label="Open cases" onClick={() => navigate('/admin/cases')} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/workflow')}>
          Workflow queue
        </button>
      }
      metrics={[
        { label: 'Open escalations', value: String(openEscalations), hint: 'Needs review', accent: 'rose' },
        { label: 'Active regulatory', value: String(openComplaints), hint: 'In progress', accent: 'violet' },
        { label: 'Timeline', value: String(timeline.length), hint: 'All events', accent: 'sky' },
        { label: 'Partners', value: String(partnerIndex.size), hint: 'In your scope', accent: 'emerald' },
      ]}
      metricTitle="Collaboration queue"
      metricDescription="Alert rail highlights what needs attention — queue on the left, full thread on the right."
    >
      <div className="fc-admin-dispute-collab" data-surface-layout="queue-detail">
        {/* Alert rail */}
        <div className="fc-admin-dispute-collab-alerts">
          {openEscalations > 0 ? (
            <div className={`fc-admin-dispute-collab-alert-chip ${finelyOsCatalogCard('rose')}`} data-fc-accent="rose">
              <ShieldAlert size={22} className="shrink-0 text-rose-300" />
              <div>
                <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{openEscalations} open escalation{openEscalations === 1 ? '' : 's'}</div>
                <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  {urgentEscalations > 0 ? `${urgentEscalations} marked high priority` : 'Review and update status'}
                </p>
              </div>
            </div>
          ) : (
            <FinelyOsAlertBanner tone="success" message="No open escalations — partner dispute threads are clear." />
          )}

          {openComplaints > 0 ? (
            <div className={`fc-admin-dispute-collab-alert-chip ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
              <Scale size={22} className="shrink-0 text-violet-300" />
              <div>
                <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{openComplaints} regulatory complaint{openComplaints === 1 ? '' : 's'}</div>
                <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Track bureau and agency responses</p>
              </div>
            </div>
          ) : (
            <FinelyOsAlertBanner tone="info" message="No active regulatory complaints in your scope." />
          )}

          <div className={`fc-admin-dispute-collab-alert-chip ${finelyOsCatalogCard('sky')}`} data-fc-accent="sky">
            <Gavel size={22} className="shrink-0 text-sky-300" />
            <div>
              <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{timeline.length} total threads</div>
              <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {partnerIndex.size} partner{partnerIndex.size === 1 ? '' : 's'} in scope
              </p>
            </div>
          </div>
        </div>

        {/* Queue + inspector */}
        <div className="fc-admin-dispute-collab-layout">
          <aside className={`fc-admin-dispute-collab-queue ${finelyOsCatalogCard('emerald')} p-5 lg:p-6`} data-fc-accent="emerald">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Gavel size={16} />
              <span>Thread queue</span>
            </div>
            <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Newest first — select a thread to inspect and update.
            </p>

            <div className={`mt-4 ${FINELY_OS_VIEW_TABS} fc-admin-dispute-collab-filters`}>
              {(
                [
                  { id: 'all' as const, label: 'All', accent: 'emerald' as const },
                  { id: 'escalation' as const, label: 'Escalations', accent: 'rose' as const },
                  { id: 'regulatory' as const, label: 'Regulatory', accent: 'violet' as const },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQueueFilter(tab.id)}
                  className={finelyOsViewTab(queueFilter === tab.id, tab.accent)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredQueue.length === 0 ? (
              <div className={`mt-6 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                No escalations or regulatory complaints yet.
              </div>
            ) : (
              <div className="fc-admin-dispute-collab-list mt-4">
                {filteredQueue.map((entry) => {
                  const active = entry.id === selected?.id;
                  const rowAccent = entry.kind === 'escalation' ? 'rose' : 'sky';
                  const Icon = entry.kind === 'escalation' ? ShieldAlert : Scale;
                  const open = entry.kind === 'escalation' ? isOpenEscalation(entry.status) : isOpenComplaint(entry.status);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      data-selected={active ? 'true' : undefined}
                      onClick={() => setSelectedId(entry.id)}
                      className={`fc-admin-dispute-collab-row ${finelyOsCatalogCard(rowAccent)}`}
                      data-fc-accent={rowAccent}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon size={14} className="shrink-0 opacity-80" />
                          <span className={`text-sm font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>{entry.title}</span>
                        </div>
                        {open ? <span className={finelyOsStatusChip('warn')}>Open</span> : <span className={finelyOsStatusChip('ok')}>Closed</span>}
                      </div>
                      <div className={`text-sm font-bold truncate ${FINELY_OS_ENTITY_BODY}`}>
                        {partnerIndex.get(entry.partnerId) ?? entry.partnerId}
                      </div>
                      <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                        {fmtWhen(entry.at).split(',')[0]} · {entry.status.replace(/_/g, ' ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="fc-admin-dispute-collab-inspector">
            {!selected ? (
              <div className={`${finelyOsCatalogCard('violet')} p-8 lg:p-10`} data-fc-accent="violet">
                <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Select a thread</div>
                <p className={`mt-3 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  Pick an escalation or regulatory complaint from the queue to review details and update status.
                </p>
              </div>
            ) : (
              <>
                <div className={`${finelyOsCatalogCard(selectedIsEscalation ? 'rose' : 'sky')} p-6 lg:p-8`} data-fc-accent={selectedIsEscalation ? 'rose' : 'sky'}>
                  <div className="fc-admin-dispute-collab-inspector-head">
                    <div className="min-w-0 flex-1">
                      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} ${selectedIsEscalation ? 'text-rose-300' : 'text-sky-300'}`}>
                        {selectedIsEscalation ? <ShieldAlert size={16} /> : <Scale size={16} />}
                        <span>{selectedIsEscalation ? 'Partner escalation' : 'Regulatory complaint'}</span>
                        {selected.priority ? <span>· {selected.priority}</span> : null}
                        {selected.bodyLabel ? <span>· {selected.bodyLabel}</span> : null}
                      </div>
                      <h2 className={`mt-3 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selected.title}</h2>
                      <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                        {partnerIndex.get(selected.partnerId) ?? selected.partnerId}
                      </p>
                    </div>
                    {selected.caseId ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cases/${selected.caseId}`)}
                        className={FINELY_OS_PRIMARY_BTN}
                      >
                        Open case <ArrowRight size={14} />
                      </button>
                    ) : null}
                  </div>

                  <p className={`mt-6 text-base ${FINELY_OS_ENTITY_BODY}`}>{selected.body}</p>

                  <div className={`mt-5 flex flex-wrap items-center gap-3 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                    <span className={finelyOsStatusChip(selectedIsEscalation ? 'warn' : 'ok')}>
                      {selected.status.replace(/_/g, ' ')}
                    </span>
                    <span>{selected.meta}</span>
                    <span className="font-mono text-xs">{fmtWhen(selected.at)}</span>
                  </div>
                </div>

                <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
                  <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Update status</div>
                  <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    Status changes notify partners and update case timelines.
                  </p>
                  <div className="fc-admin-dispute-collab-status-rail">
                    {selectedIsEscalation
                      ? (['in_review', 'pending_partner', 'resolved', 'closed'] as EscalationStatus[]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateEscalation(selected.id, s)}
                            className={`${FINELY_OS_SECONDARY_BTN} ${selected.status === s ? '!border-emerald-400/50 !bg-emerald-500/15' : ''}`}
                          >
                            {s.replace(/_/g, ' ')}
                          </button>
                        ))
                      : (['in_review', 'resolved', 'closed'] as RegulatoryComplaintStatus[]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateComplaint(selected.id, s)}
                            className={`${FINELY_OS_SECONDARY_BTN} ${selected.status === s ? '!border-emerald-400/50 !bg-emerald-500/15' : ''}`}
                          >
                            {s.replace(/_/g, ' ')}
                          </button>
                        ))}
                  </div>
                </div>

                <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6 flex flex-wrap items-center justify-between gap-4`} data-fc-accent="emerald">
                  <div>
                    <div className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Partner file</div>
                    <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Open the full partner record for context.</p>
                  </div>
                  <button
                    type="button"
                    className={FINELY_OS_SECONDARY_BTN}
                    onClick={() => navigate(`/admin/partners/${selected.partnerId}`)}
                  >
                    View partner <ChevronRight size={14} />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
