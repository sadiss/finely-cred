import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  CircleHelp,
  Crown,
  FileText,
  PlayCircle,
  Plus,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { computeReadinessScore } from '../../../../domain/capitalReadiness';
import type { CapitalDocKey, CapitalDocStatus, EntityRole, RelationshipStage, CapitalReadinessPlan } from '../../../../domain/capitalReadiness';
import {
  addEntity,
  addRelationship,
  deleteEntity,
  deleteRelationship,
  buildReadinessScoreExtras,
  getOrCreateCapitalPlan,
  setCapitalTargetBand,
  setDocNotes,
  setDocStatus,
  setRelationshipStage,
  updateEntity,
  updateRelationship,
} from '../../../../data/capitalReadinessRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { downloadText } from '../../../../utils/download';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsKpiTile,
} from '../../../os/finelyOsLightUi';

const DOC_STATUS: { value: CapitalDocStatus; label: string }[] = [
  { value: 'missing', label: 'Missing' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
];

const ROLE_LABEL: Record<EntityRole, string> = {
  holding: 'Holding Co',
  operating: 'Operating Co',
  ip: 'IP Co',
  real_estate: 'Real Estate',
  services: 'Services',
  other: 'Other',
};

const REL_STAGE: { value: RelationshipStage; label: string }[] = [
  { value: 'research', label: 'Research' },
  { value: 'targeted', label: 'Targeted' },
  { value: 'intro_sent', label: 'Intro sent' },
  { value: 'meeting_booked', label: 'Meeting booked' },
  { value: 'active_applications', label: 'Active applications' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
  { value: 'paused', label: 'Paused' },
];

const RUNWAY_NODES = [
  { id: 'entities', label: 'Entities', accent: 'emerald' },
  { id: 'docs', label: 'Documents', accent: 'violet' },
  { id: 'relationships', label: 'Relationships', accent: 'sky' },
  { id: 'overview', label: 'Capital', accent: 'rose' },
] as const;

type RunwayView = (typeof RUNWAY_NODES)[number]['id'];

export default function PartnerBillionPathProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Crown;
  const scaffoldAccent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;

  const [version, setVersion] = useState(0);
  const [runwayView, setRunwayView] = useState<RunwayView>('entities');
  const partner = partnerId ? getPartnerSync(partnerId) ?? sessionPartner : sessionPartner;
  const partnerIdResolved = partner?.id ?? '';

  const plan = useMemo(() => (partnerIdResolved && !isDemo ? getOrCreateCapitalPlan(partnerIdResolved) : null), [partnerIdResolved, version, isDemo]);
  const score = useMemo(
    () => (plan && partnerIdResolved && partner ? computeReadinessScore(plan, buildReadinessScoreExtras(partnerIdResolved, partner)) : 0),
    [plan, partnerIdResolved, partner],
  );

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const docStats = useMemo(() => {
    const docs = plan?.docs ?? [];
    return {
      total: docs.length,
      missing: docs.filter((d) => d.status === 'missing').length,
      draft: docs.filter((d) => d.status === 'draft').length,
      ready: docs.filter((d) => d.status === 'ready').length,
    };
  }, [plan]);

  const relStats = useMemo(() => {
    const rel = plan?.relationships ?? [];
    return {
      total: rel.length,
      active: rel.filter((r) => r.stage !== 'declined' && r.stage !== 'paused').length,
      meetings: rel.filter((r) => r.stage === 'meeting_booked').length,
      apps: rel.filter((r) => r.stage === 'active_applications').length,
      approved: rel.filter((r) => r.stage === 'approved').length,
    };
  }, [plan]);

  const nextMoves = useMemo(() => {
    const out: Array<{ t: string; d: string }> = [];
    const missingDocs = (plan?.docs ?? []).filter((d) => d.status === 'missing').slice(0, 4);
    for (const d of missingDocs) out.push({ t: `Upload: ${d.label}`, d: 'Move to Draft or Ready to increase readiness.' });
    const needsCadence = (plan?.relationships ?? [])
      .filter((r) => r.stage === 'research' || r.stage === 'targeted')
      .slice(0, 3);
    for (const r of needsCadence) out.push({ t: `Relationship: ${r.lenderName}`, d: 'Send intro and book a banker meeting.' });
    if (out.length === 0) out.push({ t: 'Maintain readiness', d: 'Review document expiry and keep relationships warm.' });
    return out.slice(0, 6);
  }, [plan]);

  const firstMissingDoc = (plan?.docs ?? []).find((d) => d.status === 'missing') ?? null;

  const saveBand = (band: CapitalReadinessPlan['targetBand']) => {
    if (!partnerIdResolved) return;
    setCapitalTargetBand(partnerIdResolved, band);
    setVersion((v) => v + 1);
  };

  const setDoc = (key: CapitalDocKey, status: CapitalDocStatus) => {
    if (!partnerIdResolved) return;
    setDocStatus(partnerIdResolved, key, status);
    setVersion((v) => v + 1);
  };

  const setDocNote = (key: CapitalDocKey, notes: string) => {
    if (!partnerIdResolved) return;
    setDocNotes(partnerIdResolved, key, notes);
    setVersion((v) => v + 1);
  };

  const metrics: ProductMetric[] = [
    { label: 'Readiness', value: `${score}/100`, hint: plan?.targetBand ?? 'Set target band', accent: 'violet', icon: Crown, onClick: () => setRunwayView('overview') },
    { label: 'Docs ready', value: String(docStats.ready), hint: `${docStats.missing} missing`, accent: 'emerald', icon: FileText, onClick: () => setRunwayView('docs') },
    { label: 'Entities', value: String(plan?.entities?.length ?? 0), hint: 'Capital structure', accent: 'sky', icon: Building2, onClick: () => setRunwayView('entities') },
    { label: 'Relationships', value: String(relStats.active), hint: `${relStats.meetings} meetings`, accent: 'rose', icon: Users, onClick: () => setRunwayView('relationships') },
  ];

  const runwayBody = (
    <section className="fc-wlp-section space-y-6" data-surface-layout="capital-spine">
      <div className="relative flex flex-wrap items-center gap-2 md:gap-0 md:flex-nowrap">
        {RUNWAY_NODES.map((node, index) => {
          const active = runwayView === node.id;
          return (
            <React.Fragment key={node.id}>
              <button
                type="button"
                onClick={() => setRunwayView(node.id)}
                className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold border transition-all ${active ? 'ring-2 ring-white/20 scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
                data-fcm-accent={node.accent}
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black">{index + 1}</span>
                {node.label}
              </button>
              {index < RUNWAY_NODES.length - 1 ? (
                <div className="hidden md:block h-1 flex-1 min-w-[40px] mx-2 rounded-full bg-gradient-to-r from-emerald-500/40 via-violet-500/40 to-rose-500/40" aria-hidden />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      {runwayView === 'overview' && plan ? (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-7 ${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Capital narrative</div>
            <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Underwriting readiness</h2>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Structure, documents, and relationship cadence — tracked before you apply. This is a checklist, not an approval.
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { t: 'Structure', d: 'HoldCo / OpCo / IP', icon: <Building2 size={16} /> },
                { t: 'Docs', d: 'Bank-ready package', icon: <FileText size={16} /> },
                { t: 'Relationships', d: 'Bank cadence first', icon: <Users size={16} /> },
              ].map((x, idx) => (
                <div key={x.t} className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky'] as const)[idx])} p-4`} data-fc-accent={(['emerald', 'violet', 'sky'] as const)[idx]}>
                  <div className={`inline-flex items-center gap-2 font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{x.icon}{x.t}</div>
                  <div className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{x.d}</div>
                </div>
              ))}
            </div>
            <label className="block">
              <div className={FINELY_OS_ENTITY_LABEL}>Target band</div>
              <select value={plan.targetBand ?? 'seven_fig'} onChange={(e) => saveBand(e.target.value as CapitalReadinessPlan['targetBand'])} className={`mt-2 ${FINELY_OS_ENTITY_SELECT}`}>
                <option value="six_fig">6-figure capital</option>
                <option value="seven_fig">7-figure capital</option>
                <option value="eight_fig">8-figure capital</option>
                <option value="nine_fig">9-figure capital</option>
                <option value="ten_fig_plus">10-figure+ (enterprise)</option>
              </select>
            </label>
          </div>
          <div className={`lg:col-span-5 ${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <div className="inline-flex items-center gap-2"><Shield size={18} /><span className={FINELY_OS_ENTITY_SUBLABEL}>Next moves</span></div>
            <FinelyOsPaginatedStack
              items={nextMoves}
              pageSize={4}
              itemSpacingClassName="space-y-2"
              renderItem={(m, idx) => (
                <div key={idx} className={finelyOsInlineListItem()}>
                  <div className={FINELY_OS_ENTITY_VALUE}>{m.t}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{m.d}</div>
                </div>
              )}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setRunwayView('docs')} className={FINELY_OS_SECONDARY_BTN}><FileText size={14} /> Open docs</button>
              <button type="button" onClick={() => setRunwayView('relationships')} className={FINELY_OS_SECONDARY_BTN}><Calendar size={14} /> Relationships</button>
            </div>
          </div>
        </div>
      ) : null}

      {runwayView === 'entities' && plan ? (
        <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={FINELY_OS_ENTITY_TITLE}>Entity stack</div>
            <button type="button" onClick={() => { addEntity(partnerIdResolved, { role: 'holding', legalName: 'New Holding Company' }); setVersion((v) => v + 1); }} className={FINELY_OS_PRIMARY_BTN}>
              <Plus size={14} /> Add entity
            </button>
          </div>
          {plan.entities?.length ? (
            <FinelyOsPaginatedStack
              items={[...(plan.entities ?? [])]}
              pageSize={4}
              itemSpacingClassName="grid md:grid-cols-2 gap-4"
              renderItem={(e) => (
                <div key={e.id} className={`${finelyOsInlineListItem()} space-y-3 p-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className={FINELY_OS_ENTITY_VALUE}>{ROLE_LABEL[e.role]}</div>
                    <button type="button" onClick={() => { deleteEntity(partnerIdResolved, e.id); setVersion((v) => v + 1); }} className={FINELY_OS_SECONDARY_BTN}><Trash2 size={14} /></button>
                  </div>
                  <input value={e.legalName} onChange={(ev) => { updateEntity(partnerIdResolved, e.id, { legalName: ev.target.value }); setVersion((v) => v + 1); }} className={FINELY_OS_ENTITY_INPUT} />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={e.state ?? ''} onChange={(ev) => { updateEntity(partnerIdResolved, e.id, { state: ev.target.value }); setVersion((v) => v + 1); }} className={FINELY_OS_ENTITY_INPUT} placeholder="TX" />
                    <input value={e.einLast4 ?? ''} onChange={(ev) => { updateEntity(partnerIdResolved, e.id, { einLast4: ev.target.value.replace(/\D/g, '').slice(0, 4) }); setVersion((v) => v + 1); }} className={`${FINELY_OS_ENTITY_INPUT} font-mono`} placeholder="1234" />
                  </div>
                </div>
              )}
            />
          ) : (
            <div className={FINELY_OS_NOTICE}>No entities added yet.</div>
          )}
        </div>
      ) : null}

      {runwayView === 'docs' && plan ? (
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={FINELY_OS_ENTITY_TITLE}>Underwriting document readiness</div>
            <button type="button" onClick={() => navigate(mapPortalHref('/business/documents'))} className={FINELY_OS_SECONDARY_BTN}>
              Open documents <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            {[
              { label: 'Missing', value: docStats.missing },
              { label: 'Draft', value: docStats.draft },
              { label: 'Ready', value: docStats.ready },
              { label: 'Total', value: docStats.total },
            ].map((s, i) => (
              <div key={s.label} className={finelyOsKpiTile(i)}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{s.label}</div>
                <div className={`mt-2 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{s.value}</div>
              </div>
            ))}
          </div>
          <FinelyOsPaginatedStack
            items={[...(plan.docs ?? [])]}
            pageSize={6}
            itemSpacingClassName="grid lg:grid-cols-12 gap-4"
            renderItem={(d) => (
              <div key={d.key} className={`lg:col-span-6 ${finelyOsInlineListItem()} space-y-3 p-4`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={FINELY_OS_ENTITY_VALUE}>{d.label}</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{d.key}</div>
                  </div>
                  <select value={d.status} onChange={(e) => setDoc(d.key, e.target.value as CapitalDocStatus)} className={FINELY_OS_ENTITY_SELECT}>
                    {DOC_STATUS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </select>
                </div>
                <textarea value={d.notes ?? ''} onChange={(e) => setDocNote(d.key, e.target.value)} placeholder="Notes or blockers…" className={`${FINELY_OS_ENTITY_INPUT} min-h-[80px] resize-y`} rows={4} />
              </div>
            )}
          />
        </div>
      ) : null}

      {runwayView === 'relationships' && plan ? (
        <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={FINELY_OS_ENTITY_TITLE}>Bank / lender relationships</div>
            <button type="button" onClick={() => { addRelationship(partnerIdResolved, { lenderName: 'New Lender', type: 'bank' }); setVersion((v) => v + 1); }} className={FINELY_OS_PRIMARY_BTN}>
              <Plus size={14} /> Add relationship
            </button>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            {[
              { label: 'Active', value: relStats.active },
              { label: 'Meetings', value: relStats.meetings },
              { label: 'Apps', value: relStats.apps },
              { label: 'Approved', value: relStats.approved },
            ].map((s, i) => (
              <div key={s.label} className={finelyOsKpiTile(i)}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{s.label}</div>
                <div className={`mt-2 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{s.value}</div>
              </div>
            ))}
          </div>
          {plan.relationships?.length ? (
            <FinelyOsPaginatedStack
              items={[...(plan.relationships ?? [])]}
              pageSize={4}
              itemSpacingClassName="grid md:grid-cols-2 gap-4"
              renderItem={(r) => (
                <div key={r.id} className={`${finelyOsInlineListItem()} space-y-3 p-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <input value={r.lenderName} onChange={(e) => { updateRelationship(partnerIdResolved, r.id, { lenderName: e.target.value }); setVersion((v) => v + 1); }} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} />
                    <button type="button" onClick={() => { deleteRelationship(partnerIdResolved, r.id); setVersion((v) => v + 1); }} className={FINELY_OS_SECONDARY_BTN}><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={r.stage} onChange={(e) => { setRelationshipStage(partnerIdResolved, r.id, e.target.value as RelationshipStage); setVersion((v) => v + 1); }} className={`w-full ${FINELY_OS_ENTITY_SELECT}`}>
                      {REL_STAGE.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                    </select>
                    <select value={r.type} onChange={(e) => { updateRelationship(partnerIdResolved, r.id, { type: e.target.value as any }); setVersion((v) => v + 1); }} className={`w-full ${FINELY_OS_ENTITY_SELECT}`}>
                      <option value="bank">Bank</option>
                      <option value="credit_union">Credit union</option>
                      <option value="fintech">Fintech</option>
                      <option value="vendor">Vendor</option>
                      <option value="card_issuer">Card issuer</option>
                      <option value="private_lender">Private lender</option>
                      <option value="broker">Broker</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <input value={r.nextAction ?? ''} onChange={(e) => { updateRelationship(partnerIdResolved, r.id, { nextAction: e.target.value }); setVersion((v) => v + 1); }} className={FINELY_OS_ENTITY_INPUT} placeholder="Next action" />
                  <textarea value={r.notes ?? ''} onChange={(e) => { updateRelationship(partnerIdResolved, r.id, { notes: e.target.value }); setVersion((v) => v + 1); }} className={`${FINELY_OS_ENTITY_INPUT} min-h-[90px] resize-y`} rows={4} />
                </div>
              )}
            />
          ) : (
            <div className={FINELY_OS_NOTICE}>No relationships tracked yet.</div>
          )}
        </div>
      ) : null}
    </section>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow={demoSpec?.eyebrow ?? 'Capital readiness'} title={demoSpec?.title ?? 'Capital readiness checklist'} description={demoSpec?.description ?? 'Structure, documents, and lender relationships.'} status="demo data" freshness="demo snapshot" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} metrics={metrics} metricTitle="Capital runway" metricDescription="Runway nodes for overview, entities, docs, and relationships." primaryAction={<ProductPagePrimaryAction label="Open capital path" onClick={() => navigate(mapPortalHref('/business/billion-path'))} />}>
        {runwayBody}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (!partner) {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow="Capital readiness" title="Capital readiness checklist" description="Prepare before you apply." status="Sign in required" freshness="just now" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}>
        <ProductEmptyState title="Sign in required" description="Capital readiness attaches to your partner profile." action={<button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>Sign in</button>} />
      </ProductHubScaffold>
    );
  }

  if (!plan) {
    return <ProductDashboardSkeleton label="Loading capital readiness" />;
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Capital readiness"
      title="Capital readiness checklist"
      description="Prepare the documents and relationships lenders ask for before you apply."
      status={`${score}/100 readiness · live data`}
      freshness={plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString() : 'just now'}
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Capital runway"
      metricDescription="Structure, docs, and relationships on one horizontal runway."
      primaryAction={
        <ProductPagePrimaryAction
          label={firstMissingDoc ? `Upload ${firstMissingDoc.label}` : 'Upload next document'}
          onClick={() => setRunwayView('docs')}
        />
      }
      secondaryAction={
        <button
          type="button"
          className="fc-wlp-btn-secondary"
          onClick={() => {
            if (!plan) return;
            downloadText({
              text: JSON.stringify(plan, null, 2),
              filename: `capital-readiness_${partnerIdResolved}.json`,
              mimeType: 'application/json',
            });
          }}
        >
          Export plan
        </button>
      }
    >
      {runwayBody}
      <aside className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 mt-6 space-y-3`} data-fc-accent="emerald">
        <div className="fc-wlp-eyebrow">What to do next</div>
        <h2 className="text-2xl font-extrabold">Documents before applications</h2>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Lenders approve packages — close document gaps before any intro or application.</p>
        <div className="fc-wlp-page-guide-actions">
          <button type="button" onClick={() => openProductCopilot({ prompt: 'What is the next step on my capital readiness plan?', contextLabel: 'Capital readiness' })}>
            <CircleHelp size={15} /> Ask Finely
          </button>
          <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
            <PlayCircle size={15} /> Watch how
          </button>
        </div>
      </aside>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
