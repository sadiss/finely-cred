import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Crown, FileText, Target, Users, Building2, Plus, Trash2, Download, TrendingUp, Shield, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessNav } from '../../components/business/BusinessNav';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import type { CapitalDocKey, CapitalDocStatus, EntityRole, RelationshipStage } from '../../domain/capitalReadiness';
import { computeReadinessScore } from '../../domain/capitalReadiness';
import {
  addEntity,
  addRelationship,
  deleteEntity,
  deleteRelationship,
  getOrCreateCapitalPlan,
  setCapitalTargetBand,
  setDocNotes,
  setDocStatus,
  setRelationshipStage,
  updateEntity,
  updateRelationship,
} from '../../data/capitalReadinessRepo';
import { downloadText } from '../../utils/download';
import { KpiCard } from '../../components/ui/KpiCards';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,

  FINELY_OS_NOTICE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsKpiTile,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

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

export default function BusinessBillionPathPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const partnerId = partner?.id ?? '';
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<'overview' | 'entities' | 'docs' | 'relationships'>('overview');

  const plan = useMemo(() => (partnerId ? getOrCreateCapitalPlan(partnerId) : null), [partnerId, version]);
  const score = useMemo(() => (plan ? computeReadinessScore(plan) : 0), [plan]);

  const docStats = useMemo(() => {
    const docs = plan?.docs ?? [];
    const missing = docs.filter((d) => d.status === 'missing').length;
    const draft = docs.filter((d) => d.status === 'draft').length;
    const ready = docs.filter((d) => d.status === 'ready').length;
    return { total: docs.length, missing, draft, ready };
  }, [plan]);

  const relStats = useMemo(() => {
    const rel = plan?.relationships ?? [];
    const active = rel.filter((r) => r.stage !== 'declined' && r.stage !== 'paused').length;
    const meetings = rel.filter((r) => r.stage === 'meeting_booked').length;
    const apps = rel.filter((r) => r.stage === 'active_applications').length;
    const approved = rel.filter((r) => r.stage === 'approved').length;
    return { total: rel.length, active, meetings, apps, approved };
  }, [plan]);

  const nextMoves = useMemo(() => {
    const out: Array<{ t: string; d: string }> = [];
    const missingDocs = (plan?.docs ?? []).filter((d) => d.status === 'missing').slice(0, 4);
    for (const d of missingDocs) out.push({ t: `Upload: ${d.label}`, d: 'Move to Draft/Ready to increase readiness score.' });
    const needsCadence = (plan?.relationships ?? [])
      .filter((r) => r.stage === 'research' || r.stage === 'targeted')
      .slice(0, 3);
    for (const r of needsCadence) out.push({ t: `Relationship: ${r.lenderName}`, d: 'Send intro + book banker meeting (relationship-first underwriting).' });
    if (out.length === 0) out.push({ t: 'Maintain readiness', d: 'Review document expiry cadence and keep relationships warm.' });
    return out.slice(0, 6);
  }, [plan]);

  const saveBand = (band: any) => {
    if (!partnerId) return;
    setCapitalTargetBand(partnerId, band);
    setVersion((v) => v + 1);
  };

  const setDoc = (key: CapitalDocKey, status: CapitalDocStatus) => {
    if (!partnerId) return;
    setDocStatus(partnerId, key, status);
    setVersion((v) => v + 1);
  };

  const setDocNote = (key: CapitalDocKey, notes: string) => {
    if (!partnerId) return;
    setDocNotes(partnerId, key, notes);
    setVersion((v) => v + 1);
  };

  return (
    <PageShell
      badge="Business Portal"
      title="Billion Path • Capital Readiness OS"
      subtitle="Boardroom-grade readiness: multi-entity structure, underwriting document discipline, and bank/lender relationship tracking. No guarantees—just a clean system that reduces underwriting friction."
    >
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK} title="Back">
          <ArrowLeft size={16} /> Back
        </button>

        <BusinessNav />

        {!partner ? (
          <div className={FINELY_OS_NOTICE}>Sign in as a partner to access your Capital Readiness plan.</div>
        ) : (
          <FinelyUnifiedHubLayout
            eyebrow="Boardroom capital readiness"
            title="Billion Path • Capital Readiness OS"
            subtitle="Multi-entity structure, underwriting document discipline, and bank/lender relationship tracking."
            accent="amber"
            kpis={[
              { label: 'Readiness', value: String(score), accent: 'amber' },
              { label: 'Docs ready', value: String(docStats.ready), hint: `${docStats.missing} missing`, accent: 'emerald' },
              { label: 'Entities', value: String(plan?.entities?.length ?? 0), accent: 'violet' },
              { label: 'Relationships', value: String(relStats.active), hint: `${relStats.meetings} meetings`, accent: 'sky' },
            ]}
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'entities', label: 'Entities', badge: String(plan?.entities?.length ?? 0) || undefined },
              { id: 'docs', label: 'Docs', badge: String(docStats.total) || undefined },
              { id: 'relationships', label: 'Relationships', badge: String(relStats.total) || undefined },
            ]}
            activeTab={tab}
            onTabChange={(id) => setTab(id as typeof tab)}
            primaryAction={{ label: 'Book session', onClick: () => navigate('/consultation?lane=' + encodeURIComponent('Business Credit')) }}
            secondaryAction={{
              label: 'Export plan',
              onClick: () => {
                if (!plan) return;
                downloadText({
                  text: JSON.stringify(plan, null, 2),
                  filename: `billion-path_${partnerId || 'partner'}.json`,
                  mimeType: 'application/json',
                });
              },
            }}
          >
            {tab === 'overview' ? (
              <div className="grid lg:grid-cols-12 gap-6">
                <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('fuchsia')} !p-6 space-y-4`} data-fc-accent="fuchsia">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Capital narrative</div>
                      <div className={`mt-2 ${FINELY_OS_ENTITY_TITLE}`}>The enterprise answer (no fluff)</div>
                      <div className={`mt-2 ${FINELY_OS_ENTITY_BODY} space-y-2`}>
                        <p>
                          "Billion status credit" is not a single bureau trick. It's underwriting readiness: structure + docs + relationship cadence. This console keeps those three pillars disciplined so your applications don't collapse under scrutiny.
                        </p>
                        <p className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>No guarantees on approvals, limits, or outcomes. We systemize execution and reduce underwriting friction.</p>
                      </div>
                    </div>
                    <div className="hidden md:block text-right shrink-0">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Target band</div>
                      <select value={plan?.targetBand ?? 'seven_fig'} onChange={(e) => saveBand(e.target.value)} className={`mt-2 ${FINELY_OS_ENTITY_SELECT}`}>
                        <option value="six_fig">6-figure capital</option>
                        <option value="seven_fig">7-figure capital</option>
                        <option value="eight_fig">8-figure capital</option>
                        <option value="nine_fig">9-figure capital</option>
                        <option value="ten_fig_plus">10-figure+ (enterprise)</option>
                      </select>
                      <div className={`mt-2 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Discipline first; volume later.</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {[
                      { t: 'Structure', d: 'HoldCo/OpCo/IP + clean ownership story', icon: <Building2 size={16} className="text-fuchsia-700" /> },
                      { t: 'Docs', d: 'Bank-ready package + consistency across entities', icon: <FileText size={16} className="text-fuchsia-700" /> },
                      { t: 'Relationships', d: 'Targeted banks + cadence before applications', icon: <Users size={16} className="text-fuchsia-700" /> },
                    ].map((x, idx) => (
                      <div key={x.t} className={`${finelyOsCatalogCard((['emerald', 'sky', 'violet'] as const)[idx % 3])} !p-5`} data-fc-accent={(['emerald', 'sky', 'violet'] as const)[idx % 3]}>
                        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_VALUE}`}>
                          {x.icon}
                          {x.t}
                        </div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{x.d}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`lg:col-span-5 min-w-0 ${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
                  <div className="inline-flex items-center gap-2 text-violet-700">
                    <Shield size={18} />
                    <span className={FINELY_OS_ENTITY_SUBLABEL}>Next moves</span>
                  </div>
                  <div className={FINELY_OS_ENTITY_BODY}>Auto-generated from your missing docs + relationship stage.</div>
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
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button type="button" onClick={() => setTab('docs')} className={FINELY_OS_SECONDARY_BTN}>
                      <FileText size={14} /> Open docs
                    </button>
                    <button type="button" onClick={() => setTab('relationships')} className={FINELY_OS_SECONDARY_BTN}>
                      <Calendar size={14} /> Relationship cadence
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === 'entities' ? (
              <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className={FINELY_OS_ENTITY_TITLE}>Entity stack</div>
                  <button
                    type="button"
                    onClick={() => {
                      addEntity(partnerId, { role: 'holding', legalName: 'New Holding Company' });
                      setVersion((v) => v + 1);
                    }}
                    className={FINELY_OS_PRIMARY_BTN}
                  >
                    <Plus size={14} /> Add entity
                  </button>
                </div>
                <div className={FINELY_OS_ENTITY_BODY}>
                  Use this to plan and track multi-entity setups (HoldingCo/OpCo/IP). Keep documentation consistent across entities.
                </div>
                {plan?.entities?.length ? (
                  <FinelyOsPaginatedStack
                    items={[...(plan.entities ?? [])]}
                    pageSize={4}
                    itemSpacingClassName="grid md:grid-cols-2 gap-4"
                    renderItem={(e) => (
                      <div key={e.id} className={`${finelyOsInlineListItem()} space-y-3`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className={FINELY_OS_ENTITY_VALUE}>{ROLE_LABEL[e.role]}</div>
                          <button
                            type="button"
                            onClick={() => {
                              deleteEntity(partnerId, e.id);
                              setVersion((v) => v + 1);
                            }}
                            className={FINELY_OS_SECONDARY_BTN}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                        <label className="block">
                          <div className={FINELY_OS_ENTITY_LABEL}>Legal name</div>
                          <input
                            value={e.legalName}
                            onChange={(ev) => {
                              updateEntity(partnerId, e.id, { legalName: ev.target.value });
                              setVersion((v) => v + 1);
                            }}
                            className={FINELY_OS_ENTITY_INPUT}
                          />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="block">
                            <div className={FINELY_OS_ENTITY_LABEL}>State</div>
                            <input
                              value={e.state ?? ''}
                              onChange={(ev) => {
                                updateEntity(partnerId, e.id, { state: ev.target.value });
                                setVersion((v) => v + 1);
                              }}
                              className={FINELY_OS_ENTITY_INPUT}
                              placeholder="TX"
                            />
                          </label>
                          <label className="block">
                            <div className={FINELY_OS_ENTITY_LABEL}>EIN last 4</div>
                            <input
                              value={e.einLast4 ?? ''}
                              onChange={(ev) => {
                                updateEntity(partnerId, e.id, { einLast4: ev.target.value.replace(/\D/g, '').slice(0, 4) });
                                setVersion((v) => v + 1);
                              }}
                              className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                              placeholder="1234"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <div className={FINELY_OS_NOTICE}>No entities added yet. Start with a HoldingCo + OperatingCo plan if it fits your situation.</div>
                )}
              </div>
            ) : null}

            {tab === 'docs' ? (
              <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className={FINELY_OS_ENTITY_TITLE}>Underwriting document readiness</div>
                  <button type="button" onClick={() => navigate('/business/documents')} className={FINELY_OS_SECONDARY_BTN}>
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
                      <div className={`mt-2 text-2xl font-light ${FINELY_OS_ENTITY_VALUE}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className={FINELY_OS_ENTITY_BODY}>
                  This is the "deal room" discipline. Keep these items consistent and current before higher-tier applications.
                </div>
                <FinelyOsPaginatedStack
                  items={[...(plan?.docs ?? [])]}
                  pageSize={6}
                  itemSpacingClassName="grid lg:grid-cols-12 gap-4"
                  renderItem={(d) => (
                    <div key={d.key} className={`lg:col-span-6 min-w-0 ${finelyOsInlineListItem()} space-y-3`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className={FINELY_OS_ENTITY_VALUE}>{d.label}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{d.key}</div>
                        </div>
                        <select value={d.status} onChange={(e) => setDoc(d.key, e.target.value as CapitalDocStatus)} className={FINELY_OS_ENTITY_SELECT}>
                          {DOC_STATUS.map((x) => (
                            <option key={x.value} value={x.value}>
                              {x.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={d.notes ?? ''}
                        onChange={(e) => setDocNote(d.key, e.target.value)}
                        placeholder="Notes, blockers, or what to upload…"
                        className={`${FINELY_OS_ENTITY_INPUT} min-h-[80px] resize-y`}
                      />
                      <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Updated {new Date(d.updatedAt).toLocaleString()}</div>
                    </div>
                  )}
                />
              </div>
            ) : null}

            {tab === 'relationships' ? (
              <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className={FINELY_OS_ENTITY_TITLE}>Bank / lender relationships</div>
                  <button
                    type="button"
                    onClick={() => {
                      addRelationship(partnerId, { lenderName: 'New Lender', type: 'bank' });
                      setVersion((v) => v + 1);
                    }}
                    className={FINELY_OS_PRIMARY_BTN}
                  >
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
                      <div className={`mt-2 text-2xl font-light ${FINELY_OS_ENTITY_VALUE}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className={FINELY_OS_ENTITY_BODY}>Track relationship cadence (research → intro → meeting → applications) with next actions.</div>
                {plan?.relationships?.length ? (
                  <FinelyOsPaginatedStack
                    items={[...(plan.relationships ?? [])]}
                    pageSize={4}
                    itemSpacingClassName="grid md:grid-cols-2 gap-4"
                    renderItem={(r) => (
                      <div key={r.id} className={`${finelyOsInlineListItem()} space-y-3`}>
                        <div className="flex items-center justify-between gap-3">
                          <input
                            value={r.lenderName}
                            onChange={(e) => {
                              updateRelationship(partnerId, r.id, { lenderName: e.target.value });
                              setVersion((v) => v + 1);
                            }}
                            className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              deleteRelationship(partnerId, r.id);
                              setVersion((v) => v + 1);
                            }}
                            className={FINELY_OS_SECONDARY_BTN}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="block">
                            <div className={FINELY_OS_ENTITY_LABEL}>Stage</div>
                            <select
                              value={r.stage}
                              onChange={(e) => {
                                setRelationshipStage(partnerId, r.id, e.target.value as RelationshipStage);
                                setVersion((v) => v + 1);
                              }}
                              className={`mt-2 w-full ${FINELY_OS_ENTITY_SELECT}`}
                            >
                              {REL_STAGE.map((x) => (
                                <option key={x.value} value={x.value}>
                                  {x.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <div className={FINELY_OS_ENTITY_LABEL}>Type</div>
                            <select
                              value={r.type}
                              onChange={(e) => {
                                updateRelationship(partnerId, r.id, { type: e.target.value as any });
                                setVersion((v) => v + 1);
                              }}
                              className={`mt-2 w-full ${FINELY_OS_ENTITY_SELECT}`}
                            >
                              <option value="bank">Bank</option>
                              <option value="credit_union">Credit union</option>
                              <option value="fintech">Fintech</option>
                              <option value="vendor">Vendor</option>
                              <option value="card_issuer">Card issuer</option>
                              <option value="private_lender">Private lender</option>
                              <option value="broker">Broker</option>
                              <option value="other">Other</option>
                            </select>
                          </label>
                        </div>
                        <label className="block">
                          <div className={FINELY_OS_ENTITY_LABEL}>Next action</div>
                          <input
                            value={r.nextAction ?? ''}
                            onChange={(e) => {
                              updateRelationship(partnerId, r.id, { nextAction: e.target.value });
                              setVersion((v) => v + 1);
                            }}
                            className={FINELY_OS_ENTITY_INPUT}
                            placeholder="Example: Email intro + book banker meeting"
                          />
                        </label>
                        <textarea
                          value={r.notes ?? ''}
                          onChange={(e) => {
                            updateRelationship(partnerId, r.id, { notes: e.target.value });
                            setVersion((v) => v + 1);
                          }}
                          placeholder="Notes, underwriting requirements, contact names, constraints…"
                          className={`${FINELY_OS_ENTITY_INPUT} min-h-[90px] resize-y`}
                        />
                      </div>
                    )}
                  />
                ) : (
                  <div className={FINELY_OS_NOTICE}>
                    No relationships tracked yet. Start with 5–10 target institutions aligned with your industry and revenue story.
                  </div>
                )}
              </div>
            ) : null}
          </FinelyUnifiedHubLayout>
        )}

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
