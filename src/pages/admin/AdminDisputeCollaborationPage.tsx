import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Gavel, Scale, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { listAllEscalations, updateEscalationStatus } from '../../data/escalationsRepo';
import { listAllRegulatoryComplaints, setRegulatoryComplaintStatus } from '../../data/regulatoryComplaintsRepo';
import { listPartnersByTenant } from '../../data/partnersRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import type { EscalationStatus } from '../../domain/escalations';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import type { RegulatoryComplaintStatus } from '../../domain/regulatoryComplaints';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

export default function AdminDisputeCollaborationPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<'escalations' | 'regulatory'>('escalations');

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

  const openEscalations = escalations.filter((e) => e.status === 'open' || e.status === 'in_review').length;
  const openComplaints = complaints.filter((c) => ['draft', 'submitted', 'in_review'].includes(c.status)).length;

  return (
    <PageShell
      badge="Admin"
      title="Dispute Collaboration Hub"
      subtitle="Central inbox for partner escalations and regulatory complaints — linked to case rounds and team messaging."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin overview
          </button>
          <button type="button" onClick={() => navigate('/admin/cases')} className={FINELY_OS_SECONDARY_BTN}>
            <Gavel size={16} /> Cases
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <FinelyOsOverviewStatTile icon={ShieldAlert} label="Open escalations" value={String(openEscalations)} accent="amber" iconAccent="amber" />
          <FinelyOsOverviewStatTile icon={Scale} label="Active regulatory" value={String(openComplaints)} accent="rose" iconAccent="fuchsia" />
          <FinelyOsOverviewStatTile
            icon={Gavel}
            label="Workflow"
            value="Status sync"
            accent="violet"
            iconAccent="violet"
            hint="Update status here — partners get notified and case timelines update automatically."
          />
        </div>

        <div className={FINELY_OS_VIEW_TABS}>
          {(['escalations', 'regulatory'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={finelyOsViewTab(tab === t, t === 'escalations' ? 'fuchsia' : 'violet')}>
              {t === 'escalations' ? `Escalations (${escalations.length})` : `Regulatory (${complaints.length})`}
            </button>
          ))}
        </div>

        {tab === 'escalations' ? (
          <div className="space-y-4">
            {escalations.length === 0 ? (
              <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>No escalations yet.</div>
            ) : (
              escalations.map((e) => (
                <div key={e.id} className={`${finelyOsInlineListItem()} p-6 space-y-4`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
                        <ShieldAlert size={16} />
                        <span>{e.priority}</span>
                      </div>
                      <p className={`mt-2 text-lg ${FINELY_OS_ENTITY_VALUE}`}>{e.title}</p>
                      <p className={FINELY_OS_ENTITY_BODY}>{partnerIndex.get(e.partnerId) ?? e.partnerId}</p>
                      <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{e.description}</p>
                      <p className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                        {e.topic.replace(/_/g, ' ')} • {e.status}
                        {e.disputeRound ? ` • ${e.disputeRound}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {e.caseId ? (
                        <button type="button" onClick={() => navigate(`/admin/cases/${e.caseId}`)} className={FINELY_OS_SECONDARY_BTN}>
                          Open case workflow
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-violet-100/80">
                    {(['in_review', 'pending_partner', 'resolved', 'closed'] as EscalationStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          updateEscalationStatus(e.id, s);
                          setVersion((v) => v + 1);
                        }}
                        className={`${FINELY_OS_SECONDARY_BTN} !px-3 !py-1.5 text-[10px]`}
                      >
                        {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>No regulatory complaints yet.</div>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className={`${finelyOsInlineListItem()} p-6 space-y-4`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
                        <Scale size={16} />
                        <span>{c.body}</span>
                      </div>
                      <p className={`mt-2 text-lg ${FINELY_OS_ENTITY_VALUE}`}>{c.targetName}</p>
                      <p className={FINELY_OS_ENTITY_BODY}>{partnerIndex.get(c.partnerId) ?? c.partnerId}</p>
                      <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} line-clamp-4`}>{c.narrative}</p>
                      <p className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                        {c.status}
                        {c.disputeRound ? ` • ${c.disputeRound}` : ''}
                        {c.referenceNumber ? ` • ref ${c.referenceNumber}` : ''}
                      </p>
                    </div>
                    {c.caseId ? (
                      <button type="button" onClick={() => navigate(`/admin/cases/${c.caseId}`)} className={FINELY_OS_SECONDARY_BTN}>
                        Open case workflow
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-violet-100/80">
                    {(['in_review', 'resolved', 'closed'] as RegulatoryComplaintStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setRegulatoryComplaintStatus({ id: c.id, status: s });
                          setVersion((v) => v + 1);
                        }}
                        className={`${FINELY_OS_SECONDARY_BTN} !px-3 !py-1.5 text-[10px]`}
                      >
                        {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
