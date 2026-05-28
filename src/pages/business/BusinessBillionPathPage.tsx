import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Crown, FileText, LayoutGrid, Target, Users, Building2, Plus, Trash2, Download, Sparkles, TrendingUp, Shield, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
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

function navBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
  }`;
}

function tabBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-white/10 text-white border-white/15' : 'bg-black/30 text-white/65 border-white/10 hover:bg-white/[0.04] hover:text-white'
  }`;
}

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
  const auth = useAuth();
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
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          title="Back"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-wrap gap-3">
          <button className={navBtn(false)} onClick={() => navigate('/business/dashboard')}>
            <LayoutGrid size={12} className="inline mr-2" /> Dashboard
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/profile')}>
            <Building2 size={12} className="inline mr-2" /> Profile
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/vendors')}>
            <Users size={12} className="inline mr-2" /> Vendors
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/lender-logic')}>
            <Target size={12} className="inline mr-2" /> Lender Logic
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/documents')}>
            <FileText size={12} className="inline mr-2" /> Documents
          </button>
          <button className={navBtn(true)} onClick={() => navigate('/business/billion-path')}>
            <Crown size={12} className="inline mr-2" /> Billion Path
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] via-amber-500/6 to-emerald-500/10 backdrop-blur-xl p-6 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background:
                'radial-gradient(700px 220px at 18% 10%, rgba(251,191,36,0.18), transparent 60%), radial-gradient(700px 220px at 82% 0%, rgba(16,185,129,0.16), transparent 62%)',
            }}
          />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 text-amber-300">
                <Crown size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Boardroom capital readiness</span>
              </div>
              <div className="text-white/85 text-2xl font-light leading-tight">
                Operate like an underwriter is already reviewing you.
              </div>
              <div className="text-white/65 text-sm leading-relaxed">
                Billion Path is a discipline system: entity stack clarity, document readiness, and relationship cadence. It doesn’t “guarantee funding” — it makes your file clean enough that funding conversations move faster.
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/consultation?lane=' + encodeURIComponent('Business Credit'))}
                className="fc-button-brand"
              >
                Book session <ArrowRight size={14} />
              </button>
              <button
                type="button"
                disabled={!plan}
                onClick={() => {
                  if (!plan) return;
                  downloadText({
                    text: JSON.stringify(plan, null, 2),
                    filename: `billion-path_${partnerId || 'partner'}.json`,
                    mimeType: 'application/json',
                  });
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={14} /> Export plan
              </button>
            </div>
          </div>
        </div>

        {!partner ? (
          <div className="fc-panel p-6 text-white/70 text-sm">
            Sign in as a partner to access your Capital Readiness plan.
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4">
              <KpiCard label="Readiness score" value={score} hint="System discipline index" tone="amber" />
              <KpiCard label="Docs ready" value={docStats.ready} hint={`${docStats.missing} missing • ${docStats.draft} draft`} tone="emerald" />
              <KpiCard label="Entities" value={plan?.entities?.length ?? 0} hint="HoldCo/OpCo/IP stack" tone="violet" />
              <KpiCard label="Active relationships" value={relStats.active} hint={`${relStats.meetings} meetings • ${relStats.apps} apps`} tone="sky" />
            </div>

            <div className="fc-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <TrendingUp size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Billion Path console</span>
                </div>
                <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
                  <button type="button" onClick={() => setTab('overview')} className={tabBtn(tab === 'overview')}>Overview</button>
                  <button type="button" onClick={() => setTab('entities')} className={tabBtn(tab === 'entities')}>Entities</button>
                  <button type="button" onClick={() => setTab('docs')} className={tabBtn(tab === 'docs')}>Docs</button>
                  <button type="button" onClick={() => setTab('relationships')} className={tabBtn(tab === 'relationships')}>Relationships</button>
                </div>
              </div>
            </div>

            {tab === 'overview' ? (
              <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 fc-panel p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Capital narrative</div>
                      <div className="mt-2 text-white font-semibold">The enterprise answer (no fluff)</div>
                      <div className="mt-2 text-white/70 text-sm leading-relaxed space-y-2">
                        <p>
                          “Billion status credit” is not a single bureau trick. It’s underwriting readiness: **structure + docs + relationship cadence**.
                          This console keeps those three pillars disciplined so your applications don’t collapse under scrutiny.
                        </p>
                        <p className="text-white/55 text-xs">
                          No guarantees on approvals, limits, or outcomes. We systemize execution and reduce underwriting friction.
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:block text-right">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Target band</div>
                      <select
                        value={plan?.targetBand ?? 'seven_fig'}
                        onChange={(e) => saveBand(e.target.value)}
                        className="mt-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80"
                      >
                        <option value="six_fig">6-figure capital</option>
                        <option value="seven_fig">7-figure capital</option>
                        <option value="eight_fig">8-figure capital</option>
                        <option value="nine_fig">9-figure capital</option>
                        <option value="ten_fig_plus">10-figure+ (enterprise)</option>
                      </select>
                      <div className="mt-2 text-white/50 text-xs">
                        Discipline first; volume later.
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {[
                      { t: 'Structure', d: 'HoldCo/OpCo/IP + clean ownership story', icon: <Building2 size={16} className="text-amber-300" /> },
                      { t: 'Docs', d: 'Bank-ready package + consistency across entities', icon: <FileText size={16} className="text-amber-300" /> },
                      { t: 'Relationships', d: 'Targeted banks + cadence before applications', icon: <Users size={16} className="text-amber-300" /> },
                    ].map((x) => (
                      <div key={x.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="inline-flex items-center gap-2 text-white/85 font-semibold">{x.icon}{x.t}</div>
                        <div className="mt-1 text-white/60 text-sm">{x.d}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 fc-card p-6 space-y-4">
                  <div className="inline-flex items-center gap-2 text-amber-400">
                    <Shield size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Next moves</span>
                  </div>
                  <div className="text-white/60 text-sm">Auto-generated from your missing docs + relationship stage.</div>
                  <div className="space-y-2">
                    {nextMoves.map((m, idx) => (
                      <div key={idx} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <div className="text-white/85 font-semibold">{m.t}</div>
                        <div className="mt-1 text-white/60 text-sm">{m.d}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button type="button" onClick={() => setTab('docs')} className="fc-button-soft">
                      <FileText size={14} /> Open docs
                    </button>
                    <button type="button" onClick={() => setTab('relationships')} className="fc-button-soft">
                      <Calendar size={14} /> Relationship cadence
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Entities */}
            {tab === 'entities' ? <div className="fc-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white font-semibold">Entity stack</div>
                <button
                  type="button"
                  onClick={() => {
                    addEntity(partnerId, { role: 'holding', legalName: 'New Holding Company' });
                    setVersion((v) => v + 1);
                  }}
                  className="fc-button-brand"
                >
                  <Plus size={14} /> Add entity
                </button>
              </div>
              <div className="text-white/60 text-sm">
                Use this to plan and track multi-entity setups (HoldingCo/OpCo/IP). Keep documentation consistent across entities.
              </div>
              {plan?.entities?.length ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {plan.entities.map((e) => (
                    <div key={e.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-white/85 font-semibold">{ROLE_LABEL[e.role]}</div>
                        <button
                          type="button"
                          onClick={() => {
                            deleteEntity(partnerId, e.id);
                            setVersion((v) => v + 1);
                          }}
                          className="fc-button-soft"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                      <label className="block">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Legal name</div>
                        <input
                          value={e.legalName}
                          onChange={(ev) => {
                            updateEntity(partnerId, e.id, { legalName: ev.target.value });
                            setVersion((v) => v + 1);
                          }}
                          className="fc-input mt-2"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">State</div>
                          <input
                            value={e.state ?? ''}
                            onChange={(ev) => {
                              updateEntity(partnerId, e.id, { state: ev.target.value });
                              setVersion((v) => v + 1);
                            }}
                            className="fc-input mt-2"
                            placeholder="TX"
                          />
                        </label>
                        <label className="block">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">EIN last 4</div>
                          <input
                            value={e.einLast4 ?? ''}
                            onChange={(ev) => {
                              updateEntity(partnerId, e.id, { einLast4: ev.target.value.replace(/\D/g, '').slice(0, 4) });
                              setVersion((v) => v + 1);
                            }}
                            className="fc-input mt-2 font-mono"
                            placeholder="1234"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">
                  No entities added yet. Start with a HoldingCo + OperatingCo plan if it fits your situation.
                </div>
              )}
            </div> : null}

            {/* Docs */}
            {tab === 'docs' ? <div className="fc-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white font-semibold">Underwriting document readiness</div>
                <button type="button" onClick={() => navigate('/business/documents')} className="fc-button-soft">
                  Open documents <ArrowRight size={14} />
                </button>
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Missing</div>
                  <div className="mt-2 text-2xl font-light text-white">{docStats.missing}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Draft</div>
                  <div className="mt-2 text-2xl font-light text-white">{docStats.draft}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Ready</div>
                  <div className="mt-2 text-2xl font-light text-white">{docStats.ready}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Total</div>
                  <div className="mt-2 text-2xl font-light text-white">{docStats.total}</div>
                </div>
              </div>
              <div className="text-white/60 text-sm">
                This is the “deal room” discipline. Keep these items consistent and current before higher-tier applications.
              </div>
              <div className="grid lg:grid-cols-12 gap-4">
                {(plan?.docs ?? []).map((d) => (
                  <div key={d.key} className="lg:col-span-6 rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-white/90 font-semibold">{d.label}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">{d.key}</div>
                      </div>
                      <select
                        value={d.status}
                        onChange={(e) => setDoc(d.key, e.target.value as CapitalDocStatus)}
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                      >
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
                      className="w-full min-h-[80px] rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white/80 placeholder:text-white/30 text-sm outline-none resize-y"
                    />
                    <div className="text-white/45 text-xs">Updated {new Date(d.updatedAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div> : null}

            {/* Relationships */}
            {tab === 'relationships' ? <div className="fc-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white font-semibold">Bank / lender relationships</div>
                <button
                  type="button"
                  onClick={() => {
                    addRelationship(partnerId, { lenderName: 'New Lender', type: 'bank' });
                    setVersion((v) => v + 1);
                  }}
                  className="fc-button-brand"
                >
                  <Plus size={14} /> Add relationship
                </button>
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Active</div>
                  <div className="mt-2 text-2xl font-light text-white">{relStats.active}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Meetings</div>
                  <div className="mt-2 text-2xl font-light text-white">{relStats.meetings}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Apps</div>
                  <div className="mt-2 text-2xl font-light text-white">{relStats.apps}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Approved</div>
                  <div className="mt-2 text-2xl font-light text-white">{relStats.approved}</div>
                </div>
              </div>
              <div className="text-white/60 text-sm">
                Track relationship cadence (research → intro → meeting → applications) with next actions.
              </div>
              {plan?.relationships?.length ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {plan.relationships.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <input
                          value={r.lenderName}
                          onChange={(e) => {
                            updateRelationship(partnerId, r.id, { lenderName: e.target.value });
                            setVersion((v) => v + 1);
                          }}
                          className="fc-input"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            deleteRelationship(partnerId, r.id);
                            setVersion((v) => v + 1);
                          }}
                          className="fc-button-soft"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Stage</div>
                          <select
                            value={r.stage}
                            onChange={(e) => {
                              setRelationshipStage(partnerId, r.id, e.target.value as RelationshipStage);
                              setVersion((v) => v + 1);
                            }}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80"
                          >
                            {REL_STAGE.map((x) => (
                              <option key={x.value} value={x.value}>
                                {x.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Type</div>
                          <select
                            value={r.type}
                            onChange={(e) => {
                              updateRelationship(partnerId, r.id, { type: e.target.value as any });
                              setVersion((v) => v + 1);
                            }}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80"
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
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Next action</div>
                        <input
                          value={r.nextAction ?? ''}
                          onChange={(e) => {
                            updateRelationship(partnerId, r.id, { nextAction: e.target.value });
                            setVersion((v) => v + 1);
                          }}
                          className="fc-input mt-2"
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
                        className="w-full min-h-[90px] rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white/80 placeholder:text-white/30 text-sm outline-none resize-y"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">
                  No relationships tracked yet. Start with 5–10 target institutions aligned with your industry and revenue story.
                </div>
              )}
            </div> : null}
          </>
        )}
      </div>
    </PageShell>
  );
}

