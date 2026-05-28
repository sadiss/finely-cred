import React, { useEffect, useMemo, useState } from 'react';
import { 
  Building2, ArrowRight, AlertTriangle, Target, Cpu, Gavel,
  Layers, Lock, Zap, X, ChevronUp, Scale, FastForward, Crosshair, Users, UploadCloud, ListChecks, LayoutDashboard, Settings, CreditCard, ShieldAlert, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { findPartnerByEmail, listPartners } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listCasesByPartner } from '../../data/casesRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import type { DisputeCandidate } from '../../domain/creditReports';
import type { WorkflowId } from '../../domain/automation';
import { addWorkflowRun, getWorkflowConfig, listWorkflowRuns, setWorkflowConfig } from '../../data/automationRepo';
import { runWorkflow } from '../../automation/runWorkflows';
import { KpiCard } from '../ui/KpiCards';
import { bucketCountsByDay } from '../../utils/timeSeries';
import { BASE_LENDER_PRESETS } from '../../data/localLenders';

// --- LENDER LOGIC ENGINE ---
interface LenderLogicEngineProps {
  userScore?: number;
  utilizationPct?: number;
  revenueMonthly?: number;
  timeInBusinessMonths?: number;
  zip?: string;
  radiusMiles?: number;
  hasRelationship?: boolean;
  willingToOpenDeposits?: boolean;
  noDocPreference?: boolean;
}

export function LenderLogicEngine({
  userScore = 550,
  utilizationPct,
  revenueMonthly,
  timeInBusinessMonths,
  zip,
  radiusMiles = 50,
  hasRelationship = false,
  willingToOpenDeposits = true,
  noDocPreference = true,
}: LenderLogicEngineProps) {
  type Inputs = {
    score: number;
    utilizationPct?: number;
    revenueMonthly?: number;
    timeInBusinessMonths?: number;
    zip?: string;
    radiusMiles: number;
    hasRelationship: boolean;
    willingToOpenDeposits: boolean;
    noDocPreference: boolean;
  };
  type Requirement = {
    label: string;
    weight: number;
    pass: (i: Inputs) => boolean;
    tip: string;
  };
  type Lender = {
    id: string;
    bank: string;
    product: string;
    projectedLimit: string;
    category: 'national' | 'credit_union' | 'local';
    relationshipFriendly?: boolean;
    noDocFriendly?: boolean;
    color: string;
    accent: string;
    requirements: Requirement[];
  };

  const inputs: Inputs = useMemo(
    () => ({
      score: userScore,
      utilizationPct,
      revenueMonthly,
      timeInBusinessMonths,
      zip: (zip || '').trim() || undefined,
      radiusMiles,
      hasRelationship,
      willingToOpenDeposits,
      noDocPreference,
    }),
    [userScore, utilizationPct, revenueMonthly, timeInBusinessMonths, zip, radiusMiles, hasRelationship, willingToOpenDeposits, noDocPreference],
  );

  const lenders = useMemo(() => {
    const relationshipOk = (i: Inputs) => Boolean(i.hasRelationship || i.willingToOpenDeposits);
    const zipOk = (i: Inputs) => Boolean((i.zip || '').trim().length >= 5);

    const base: Lender[] = BASE_LENDER_PRESETS.map((p) => {
      const req: Requirement[] = [];
      // universal underwriting optics
      req.push({
        label: 'Score 680+',
        weight: 26,
        pass: (i) => i.score >= 680,
        tip: 'Bring score to 680+ (utilization 1–9%, remove derogatories, add positive history).',
      });
      req.push({
        label: 'Utilization ≤ 12%',
        weight: 18,
        pass: (i) => (i.utilizationPct ?? 99) <= 12,
        tip: 'Lower utilization into the 1–9% band right before applying.',
      });
      req.push({
        label: 'Time in business ≥ 12 mo',
        weight: 16,
        pass: (i) => (i.timeInBusinessMonths ?? 0) >= 12,
        tip: 'If <12 months, build seasoning and stable deposits before higher-tier underwriting.',
      });
      req.push({
        label: 'Revenue ≥ $7k/mo',
        weight: 14,
        pass: (i) => (i.revenueMonthly ?? 0) >= 7_000,
        tip: 'Increase consistency of deposits and revenue month-over-month.',
      });

      if (p.relationshipFriendly) {
        req.push({
          label: 'Relationship lane (deposits / history)',
          weight: 16,
          pass: relationshipOk,
          tip: 'Relationship-based approvals improve when you open deposits and keep activity clean for 30–90 days.',
        });
      }

      if (p.category === 'local') {
        req.push({
          label: `ZIP for local search (radius ${inputs.radiusMiles} mi)`,
          weight: 10,
          pass: zipOk,
          tip: 'Enter your ZIP so we can prioritize local banks/credit unions within 50 miles.',
        });
      }

      if (inputs.noDocPreference && p.noDocFriendly) {
        req.push({
          label: 'No‑doc leaning (relationship-based)',
          weight: 10,
          pass: relationshipOk,
          tip: 'No‑doc lanes usually still require deposits/relationship signals. Open deposits and show activity.',
        });
      }

      return {
        ...p,
        requirements: req,
      };
    });

    // If ZIP provided, inject 3 synthetic “nearby” picks to ensure local emphasis.
    const zipStr = (inputs.zip || '').trim();
    const locals: Lender[] =
      zipStr.length >= 5
        ? [
            {
              id: `zip_local_cu_${zipStr}`,
              bank: `LOCAL CREDIT UNION (${zipStr})`,
              product: `Relationship LOC / card (≤${inputs.radiusMiles} miles)`,
              projectedLimit: '$10k - $100k',
              category: 'local',
              relationshipFriendly: true,
              noDocFriendly: true,
              color: 'from-emerald-900/20 to-slate-900/80',
              accent: 'text-emerald-300',
              requirements: [
                {
                  label: 'Relationship lane (deposits / history)',
                  weight: 55,
                  pass: relationshipOk,
                  tip: 'Open business deposits + keep activity clean for 30–90 days before asking for limits.',
                },
                {
                  label: 'Basic credit optics (score 660+)',
                  weight: 25,
                  pass: (i) => i.score >= 660,
                  tip: 'Push to 660+ and keep utilization low.',
                },
                {
                  label: 'Business story + docs ready',
                  weight: 20,
                  pass: (i) => (i.revenueMonthly ?? 0) >= 3_000,
                  tip: 'Even “no-doc” lanes improve with deposits and a clean story.',
                },
              ],
            },
            {
              id: `zip_local_bank_${zipStr}`,
              bank: `LOCAL BANK (${zipStr})`,
              product: `Relationship line (≤${inputs.radiusMiles} miles)`,
              projectedLimit: '$25k - $250k',
              category: 'local',
              relationshipFriendly: true,
              noDocFriendly: true,
              color: 'from-violet-900/20 to-slate-900/80',
              accent: 'text-violet-300',
              requirements: [
                { label: 'Relationship lane (deposits)', weight: 50, pass: relationshipOk, tip: 'Open deposits and build relationship before asking.' },
                { label: 'Time in business ≥ 6 mo', weight: 25, pass: (i) => (i.timeInBusinessMonths ?? 0) >= 6, tip: 'Seasoning improves local approvals.' },
                { label: 'Revenue ≥ $5k/mo', weight: 25, pass: (i) => (i.revenueMonthly ?? 0) >= 5_000, tip: 'Stable deposits can substitute for “docs-heavy” underwriting.' },
              ],
            },
            {
              id: `zip_regional_cu_${zipStr}`,
              bank: `REGIONAL CREDIT UNION (${zipStr})`,
              product: `Card + deposits lane (≤${inputs.radiusMiles} miles)`,
              projectedLimit: '$10k - $75k',
              category: 'credit_union',
              relationshipFriendly: true,
              noDocFriendly: true,
              color: 'from-teal-900/20 to-slate-900/80',
              accent: 'text-teal-300',
              requirements: [
                { label: 'Relationship lane (deposits)', weight: 50, pass: relationshipOk, tip: 'Deposits + activity increases internal limits.' },
                { label: 'Utilization ≤ 15%', weight: 25, pass: (i) => (i.utilizationPct ?? 99) <= 15, tip: 'Drop utilization before applying.' },
                { label: 'Score 660+', weight: 25, pass: (i) => i.score >= 660, tip: 'Bring score up and remove negatives.' },
              ],
            },
          ]
        : [];

    return [...locals, ...base]
      .map((l) => {
        const total = l.requirements.reduce((a, r) => a + r.weight, 0) || 1;
        const earned = l.requirements.reduce((a, r) => a + (r.pass(inputs) ? r.weight : 0), 0);
        const match = Math.max(5, Math.min(99, Math.round((earned / total) * 100)));
        const status = match >= 82 ? 'High probability' : match >= 62 ? 'Moderate match' : 'Needs prep';
        const nextActions = l.requirements.filter((r) => !r.pass(inputs)).slice(0, 3).map((r) => r.tip);
        return { ...l, match, status, nextActions };
      })
      .sort((a, b) => b.match - a.match);
  }, [inputs]);

  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<'all' | 'high' | 'mid' | 'prep'>('all');
  const [category, setCategory] = useState<'all' | 'local' | 'credit_union' | 'national'>('all');
  const [showAllLenders, setShowAllLenders] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lenders.filter((l) => {
      const statusTier = l.match >= 82 ? 'high' : l.match >= 62 ? 'mid' : 'prep';
      if (tier !== 'all' && statusTier !== tier) return false;
      if (category !== 'all' && l.category !== category) return false;
      if (!q) return true;
      return `${l.bank} ${l.product}`.toLowerCase().includes(q);
    });
  }, [lenders, query, tier, category]);

  const [selectedId, setSelectedId] = useState<string>(() => lenders[0]?.id ?? '');
  useEffect(() => {
    const next = (filtered[0]?.id ?? lenders[0]?.id) || '';
    if (!next) return;
    if (!filtered.some((x) => x.id === selectedId)) setSelectedId(next);
  }, [filtered, lenders, selectedId]);

  const selected = useMemo(() => filtered.find((x) => x.id === selectedId) ?? lenders.find((x) => x.id === selectedId) ?? null, [filtered, lenders, selectedId]);

  const chip = (active: boolean) =>
    `fc-chip ${active ? 'fc-chip-active' : 'fc-chip-muted'}`;

  return (
    <div className="fc-panel p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-5">
        <div className="space-y-2 text-left">
          <h3 className="text-2xl font-light text-white tracking-tight">
            Lender <span className="text-amber-500">Logic</span>
          </h3>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em]">Algorithmic underwriting fit • Live inputs</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/60 font-mono">
            score: <span className="text-white/90">{inputs.score}</span>
            {typeof inputs.utilizationPct === 'number' ? (
              <>
                {' '}
                • util: <span className="text-white/90">{inputs.utilizationPct}%</span>
              </>
            ) : null}
            {typeof inputs.revenueMonthly === 'number' ? (
              <>
                {' '}
                • rev: <span className="text-white/90">${inputs.revenueMonthly.toLocaleString()}</span>/mo
              </>
            ) : null}
            {inputs.zip ? (
              <>
                {' '}
                • zip: <span className="text-white/90">{inputs.zip}</span>
              </>
            ) : null}
          </div>
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] uppercase tracking-wider text-amber-200">
            AI confidence: <span className="text-amber-400 font-black">98%</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Search lender</div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Chase, Amex, Navy Federal…"
                className="fc-input mt-2"
              />
            </label>
            <button type="button" className={chip(tier === 'all')} onClick={() => setTier('all')}>
              All
            </button>
            <button type="button" className={chip(tier === 'high')} onClick={() => setTier('high')}>
              High
            </button>
            <button type="button" className={chip(tier === 'mid')} onClick={() => setTier('mid')}>
              Moderate
            </button>
            <button type="button" className={chip(tier === 'prep')} onClick={() => setTier('prep')}>
              Needs prep
            </button>
            <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
              <button type="button" className={chip(category === 'all')} onClick={() => setCategory('all')}>
                All categories
              </button>
              <button type="button" className={chip(category === 'local')} onClick={() => setCategory('local')}>
                Local
              </button>
              <button type="button" className={chip(category === 'credit_union')} onClick={() => setCategory('credit_union')}>
                Credit unions
              </button>
              <button type="button" className={chip(category === 'national')} onClick={() => setCategory('national')}>
                National
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40 flex items-center justify-between">
              <span>Lenders</span>
              <span className="font-mono">{filtered.length}</span>
            </div>
            <div className="divide-y divide-white/5">
              {(showAllLenders ? filtered : filtered.slice(0, 12)).map((l) => {
                const active = l.id === selectedId;
                const badge =
                  l.match >= 82 ? 'bg-green-500/10 border-green-500/20 text-green-300' : l.match >= 62 ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-red-500/10 border-red-500/20 text-red-200';
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setSelectedId(l.id)}
                    className={`w-full text-left px-4 py-4 transition-all ${
                      active ? 'bg-amber-500/10' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center bg-black/40 shadow-inner">
                            <Building2 size={18} className={l.accent} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{l.bank}</div>
                            <div className="text-[10px] text-white/50 uppercase tracking-widest truncate">{l.product}</div>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${badge}`}>
                          {l.match}%
                        </div>
                        <div className="mt-1 text-[10px] text-white/40 uppercase tracking-widest">{l.status}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 ? (
                <div className="p-6 text-white/60 text-sm">No lenders match this filter/search.</div>
              ) : null}
            </div>
            {filtered.length > 12 ? (
              <div className="p-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAllLenders((v) => !v)}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  {showAllLenders ? 'Show less' : `Show all (${filtered.length})`}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-7 min-w-0">
          {selected ? (
            <div className={`relative rounded-3xl border border-white/10 bg-gradient-to-br ${selected.color} p-6 overflow-hidden`}>
              <div className="absolute inset-0 bg-black/30 pointer-events-none" />
              <div className="relative z-10 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-white/50">Recommended lender</div>
                    <div className="mt-1 text-2xl font-light text-white tracking-tight truncate">{selected.bank}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/50 truncate">{selected.product}</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/70">
                      projected: <span className="text-white/90 font-mono">{selected.projectedLimit}</span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-[10px] uppercase tracking-widest text-white/70">
                      fit: <span className="text-white/95 font-black">{selected.match}%</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Key criteria</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">pass/fail</div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {selected.requirements.map((r) => {
                      const ok = r.pass(inputs);
                      return (
                        <div key={r.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-white/85 text-sm font-semibold">{r.label}</div>
                              {!ok ? <div className="mt-1 text-white/55 text-xs">{r.tip}</div> : <div className="mt-1 text-white/35 text-xs">Meets requirement.</div>}
                            </div>
                            <div className="shrink-0">
                              <div className={`w-3 h-3 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} title={ok ? 'Pass' : 'Fail'} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Next best actions</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">top 3</div>
                  </div>
                  {selected.nextActions.length ? (
                    <ul className="space-y-2 text-white/70 text-sm">
                      {selected.nextActions.map((t, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="min-w-0">{t}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-white/70 text-sm">You’re in a strong lane for this lender. Keep documentation tight and apply strategically.</div>
                  )}
                  <button
                    type="button"
                    className={`w-full mt-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:scale-[1.01] flex items-center justify-center gap-2 ${selected.accent}`}
                  >
                    Initiate application <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-white/60 text-sm">Select a lender to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- DISPUTE WEAVER ---
export function DisputeWeaver({ fractures }: { fractures: DisputeCandidate[] }) {
  const [activeNode, setActiveNode] = useState<DisputeCandidate | null>(null);
  const [executing, setExecuting] = useState(false);
  const [query, setQuery] = useState('');
  const [filterBureau, setFilterBureau] = useState<'ALL' | 'EXP' | 'EQF' | 'TUC'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'COLLECTIONS' | 'LATES' | 'OTHER'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

  const handleExecute = () => {
    setExecuting(true);
    setTimeout(() => setExecuting(false), 3000);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const norm = (s: string) => (s || '').toLowerCase();
    const bucket = (c: DisputeCandidate) => {
      const t = norm(c.type);
      if (t.includes('collection') || t.includes('charge')) return 'COLLECTIONS' as const;
      if (t.includes('late') || t.includes('delinq')) return 'LATES' as const;
      return 'OTHER' as const;
    };
    return (fractures ?? [])
      .filter((c) => {
        if (q) {
          const hay = `${c.account} ${c.type} ${c.status} ${c.code} ${c.bureau}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (filterBureau !== 'ALL' && c.bureau !== filterBureau) return false;
        if (filterType !== 'ALL' && bucket(c) !== filterType) return false;
        if (filterStatus !== 'ALL') {
          const s = norm(c.status);
          const isClosed = s.includes('closed') || s.includes('paid') || s.includes('resolved');
          if (filterStatus === 'CLOSED' && !isClosed) return false;
          if (filterStatus === 'OPEN' && isClosed) return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => a.account.localeCompare(b.account));
  }, [fractures, filterBureau, filterStatus, filterType, query]);

  useEffect(() => {
    if (activeNode) return;
    if (filtered.length) setActiveNode(filtered[0]);
  }, [activeNode, filtered]);

  const chip = (active: boolean) =>
    `px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-5 gap-4">
        <div className="space-y-2 text-left">
          <h3 className="text-3xl font-light text-white tracking-tight">Autonomous <span className="text-amber-500">Dispute Weaver</span></h3>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em]">Statutory Enforcement Engine // NLP Active</p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
            <Scale size={14} /> Audit Mode
          </button>
          <button className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] uppercase tracking-wider text-amber-500 hover:bg-amber-500/20 transition-all flex items-center gap-2">
            <FastForward size={14} /> Auto-Execute
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 min-h-0">
        {/* Left: List */}
        <div className="lg:col-span-5 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Identified fractures</p>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${fractures.length ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
              <span className="text-[9px] font-mono text-red-400">{filtered.length} / {fractures.length} ACTIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Search</div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Account name, type, code…"
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button type="button" onClick={() => setFilterType('ALL')} className={chip(filterType === 'ALL')}>All</button>
              <button type="button" onClick={() => setFilterType('COLLECTIONS')} className={chip(filterType === 'COLLECTIONS')}>Collections/CO</button>
              <button type="button" onClick={() => setFilterType('LATES')} className={chip(filterType === 'LATES')}>Lates</button>
              <button type="button" onClick={() => setFilterType('OTHER')} className={chip(filterType === 'OTHER')}>Other</button>
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button type="button" onClick={() => setFilterBureau('ALL')} className={chip(filterBureau === 'ALL')}>All bureaus</button>
              <button type="button" onClick={() => setFilterBureau('EXP')} className={chip(filterBureau === 'EXP')}>EXP</button>
              <button type="button" onClick={() => setFilterBureau('EQF')} className={chip(filterBureau === 'EQF')}>EQF</button>
              <button type="button" onClick={() => setFilterBureau('TUC')} className={chip(filterBureau === 'TUC')}>TUC</button>
              <button type="button" onClick={() => setFilterStatus('ALL')} className={chip(filterStatus === 'ALL')}>Any status</button>
              <button type="button" onClick={() => setFilterStatus('OPEN')} className={chip(filterStatus === 'OPEN')}>Open</button>
              <button type="button" onClick={() => setFilterStatus('CLOSED')} className={chip(filterStatus === 'CLOSED')}>Closed</button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40 flex items-center justify-between">
              <span>Queue</span>
              <span className="font-mono">{filtered.length}</span>
            </div>
            <div className="max-h-[560px] overflow-auto">
              {fractures.length === 0 ? (
                <div className="p-6 text-white/60 text-sm">
                  Upload an HTML credit report to populate dispute candidates from real tradelines and payment history.
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-white/60 text-sm">No items match your filter/search.</div>
              ) : (
                filtered.map((f) => {
                  const active = activeNode?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveNode(f)}
                      className={`w-full text-left px-4 py-4 border-b border-white/5 transition-all ${active ? 'bg-amber-500/10' : 'hover:bg-white/[0.03]'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{f.account}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-mono uppercase">{f.bureau}</span>
                            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{f.type}</span>
                            <span className="text-[10px] text-white/30 font-mono uppercase">{f.code}</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-300 backdrop-blur-sm shadow-sm">
                            {f.status}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Detail */}
        <div className="lg:col-span-7 min-w-0">
          <div className="relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.08] pointer-events-none" />
            {activeNode ? (
              <div className="relative z-10 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-5">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Target locked</div>
                    <div className="mt-1 text-3xl font-extralight text-white tracking-tight truncate">{activeNode.account}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/70 uppercase">{activeNode.bureau}</span>
                      <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-200 uppercase tracking-widest">{activeNode.type}</span>
                      <span className="px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] font-mono text-white/60 uppercase">{activeNode.code}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full border border-amber-500/30 flex items-center justify-center animate-spin-slow bg-black/30">
                      <Cpu size={18} className="text-amber-500" />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40 font-bold">
                      <span>Readiness / injection</span>
                      <span className="font-mono">15 U.S.C. § 1681</span>
                    </div>
                    <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/10 shadow-inner">
                      <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 w-[75%] shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-pulse" />
                    </div>
                    <div className="text-white/55 text-sm">
                      This panel is intentionally compact. Expand the draft below when you need to review language.
                    </div>
                  </div>

                  <details className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <summary className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-white/60">
                      Draft affidavit (collapsed)
                    </summary>
                    <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] text-white/70 leading-relaxed relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                      <span className="text-amber-400 font-bold">GENERATING LEGAL AFFIDAVIT:</span>
                      <br />
                      <br />
                      "Pursuant to <span className="text-white bg-white/10 px-1 rounded">{activeNode.code}</span>, demand is hereby made for immediate validation of the alleged{' '}
                      {activeNode.type.toLowerCase()}. Failure to provide physical evidence of contract signature within 30 days constitutes a violation of Metro2 compliance standards..."
                    </div>
                  </details>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Actions</div>
                    <button
                      onClick={handleExecute}
                      className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl font-black text-black uppercase tracking-[0.2em] text-xs hover:shadow-[0_0_35px_rgba(245,158,11,0.25)] hover:scale-[1.01] transition-all flex items-center justify-center gap-3 border-t border-white/20"
                    >
                      {executing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          Executing protocol...
                        </>
                      ) : (
                        <>
                          <Gavel size={18} /> Execute dispute cycle
                        </>
                      )}
                    </button>
                    <div className="text-white/55 text-sm">
                      Next: we’ll tie this action into your Evidence Vault + Letter Generator so execution produces a ready-to-send packet.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-6 animate-pulse">
                  <Crosshair size={40} />
                </div>
                <p className="text-sm font-light uppercase tracking-widest text-white">Select a fracture node to engage</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MASTERY OS DASHBOARD ---
interface MasteryOSDashboardProps {
  user: {
    name?: string;
    score?: number;
    target?: number;
    fractures?: string[];
  };
  onLogout: () => void;
}

export function MasteryOSDashboard({ user, onLogout }: MasteryOSDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const auth = useAuth();
  const navigate = useNavigate();
  const isAdmin = isAdminEmail(auth.user?.email);
  const signedInEmail = auth.user?.email || '';
  const [storeVersion, setStoreVersion] = useState(0);
  const [automationView, setAutomationView] = useState<'workflows' | 'history'>('workflows');
  const [configOpenFor, setConfigOpenFor] = useState<WorkflowId | null>(null);
  const [automationRunMsg, setAutomationRunMsg] = useState<string | null>(null);
  const [partnerQuery, setPartnerQuery] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    try {
      const raw = localStorage.getItem('finely.masteryos.sidebar.expanded');
      if (raw === '1') return true;
      if (raw === '0') return false;
    } catch {
      // ignore
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('finely.masteryos.sidebar.expanded', sidebarExpanded ? '1' : '0');
    } catch {
      // ignore
    }
  }, [sidebarExpanded]);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  type TabId = 'overview' | 'remedy' | 'debt' | 'lender' | 'automation' | 'vault';
  const sidebarTabs: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'remedy', label: 'Disputes', icon: Gavel },
    { id: 'debt', label: 'Debt Kill', icon: Scale },
    { id: 'lender', label: 'Lender Logic', icon: Zap },
    { id: 'automation', label: 'Automation', icon: FastForward },
    { id: 'vault', label: 'Launchpad', icon: Lock },
  ];

  const [disputeCandidates, setDisputeCandidates] = useState<DisputeCandidate[]>([]);
  const [adminPartnersAll, setAdminPartnersAll] = useState<Partner[]>([]);
  const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);

  useEffect(() => {
    const email = auth.user?.email;
    if (!email) { setCurrentPartner(null); setDisputeCandidates([]); return; }
    findPartnerByEmail(email).then((partner) => {
      setCurrentPartner(partner);
      if (!partner) { setDisputeCandidates([]); return; }
      const reports = listReportsByPartner(partner.id);
      const latest = reports.find((r) => Boolean(r.parsed)) ?? null;
      if (!latest?.parsed) { setDisputeCandidates([]); return; }
      setDisputeCandidates(deriveDisputeCandidates(latest.parsed, latest.id));
    });
  }, [auth.user?.email, storeVersion]);

  useEffect(() => {
    if (!isAdmin) { setAdminPartnersAll([]); return; }
    listPartners().then(setAdminPartnersAll);
  }, [isAdmin, storeVersion]);

  const adminPartnerCards = useMemo(() => {
    if (!isAdmin) return [];
    const q = partnerQuery.trim().toLowerCase();
    const filtered = q
      ? adminPartnersAll.filter((p) =>
          `${p.profile.fullName} ${p.profile.email ?? ''} ${p.status}`.toLowerCase().includes(q)
        )
      : adminPartnersAll;
    return filtered.slice(0, 24).map((p) => {
      const reports = listReportsByPartner(p.id);
      const tasks = listTasksByPartner(p.id);
      const cases = listCasesByPartner(p.id);
      const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
      const openCases = cases.filter((c) => c.status === 'open').length;
      return {
        id: p.id,
        name: p.profile.fullName,
        email: p.profile.email || 'no-email',
        status: p.status,
        reports: reports.length,
        openTasks,
        openCases,
        updatedAt: p.updatedAt,
      };
    });
  }, [isAdmin, partnerQuery, adminPartnersAll]);

  const kpi = useMemo(() => {
    if (isAdmin) {
      const leads = listLeadCaptures();
      const allTasks = adminPartnersAll.flatMap((p) => listTasksByPartner(p.id));
      const allCases = adminPartnersAll.flatMap((p) => listCasesByPartner(p.id));
      const openTasks = allTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
      const openCases = allCases.filter((c) => c.status === 'open');
      return {
        mode: 'admin' as const,
        partnersCount: adminPartnersAll.length,
        openTasksCount: openTasks.length,
        openCasesCount: openCases.length,
        leadsCount: leads.length,
        series: {
          tasks14: bucketCountsByDay({ items: allTasks, getIso: (t: any) => t.createdAt, days: 14 }).values,
          cases14: bucketCountsByDay({ items: allCases, getIso: (c: any) => c.createdAt, days: 14 }).values,
          leads14: bucketCountsByDay({ items: leads, getIso: (l: any) => l.createdAt, days: 14 }).values,
        },
      };
    }
    const partner = currentPartner;
    const reports = partner ? listReportsByPartner(partner.id) : [];
    const tasks = partner ? listTasksByPartner(partner.id) : [];
    const cases = partner ? listCasesByPartner(partner.id) : [];
    const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
    const openCases = cases.filter((c) => c.status === 'open');
    return {
      mode: 'partner' as const,
      reportsCount: reports.length,
      openTasksCount: openTasks.length,
      openCasesCount: openCases.length,
      candidatesCount: disputeCandidates.length,
      series: {
        tasks14: bucketCountsByDay({ items: tasks, getIso: (t: any) => t.createdAt, days: 14 }).values,
        cases14: bucketCountsByDay({ items: cases, getIso: (c: any) => c.createdAt, days: 14 }).values,
        reports14: bucketCountsByDay({ items: reports, getIso: (r: any) => r.receivedAt, days: 14 }).values,
      },
    };
  }, [isAdmin, adminPartnersAll, currentPartner, disputeCandidates.length, partnerQuery, storeVersion]);

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white flex flex-col animate-in fade-in duration-1000">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/5 bg-[#0e1713]/70 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 z-50">
        <div className="flex items-center gap-4 md:gap-8">
          <span className="text-xs font-black tracking-[0.4em] text-white uppercase">
            FINELY <span className="text-amber-500">CRED</span>
          </span>
          <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
          <p className="hidden md:block text-[10px] font-semibold text-white/45 tracking-wider">
            Welcome{user.name ? `, ${user.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Stable</span>
          </div>
          <button onClick={onLogout} className="text-white/20 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`border-r border-white/5 bg-[#0c1411]/65 overflow-y-auto transition-[width] duration-300 ease-out ${
            sidebarExpanded ? 'w-72' : 'w-20'
          }`}
        >
          <div className={`py-6 ${sidebarExpanded ? 'px-3' : 'px-0'} flex flex-col gap-4`}>
            <div className={`flex items-center ${sidebarExpanded ? 'justify-between px-2' : 'justify-center'}`}>
              {sidebarExpanded && (
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                  MENU
                </div>
              )}
              <button
                type="button"
                onClick={() => setSidebarExpanded((v) => !v)}
                className={`rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all ${
                  sidebarExpanded ? 'px-3 py-2' : 'p-2.5'
                }`}
                title={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {sidebarExpanded ? 'Collapse' : 'Menu'}
                </span>
              </button>
            </div>

            <div className={`space-y-2 ${sidebarExpanded ? '' : 'flex flex-col items-center'}`}>
              {sidebarTabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group border transition-all ${
                      sidebarExpanded ? 'w-full px-3 py-3 rounded-2xl flex items-center gap-3' : 'w-14 rounded-2xl'
                    } ${
                      isActive
                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                        : 'bg-white/[0.03] border-white/10 text-white/65 hover:text-white hover:bg-white/[0.07]'
                    }`}
                    title={t.label}
                  >
                    <div className={`${sidebarExpanded ? '' : 'py-3 flex flex-col items-center gap-1'}`}>
                      <Icon size={20} />
                    </div>
                    {sidebarExpanded ? (
                      <div className="text-left">
                        <div className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-black/80' : 'text-white/70'}`}>
                          {t.label}
                        </div>
                        <div className={`text-[10px] ${isActive ? 'text-black/70' : 'text-white/35'}`}>
                          {t.id === 'overview'
                            ? 'Signals + admin tools'
                            : t.id === 'remedy'
                              ? 'Dispute engine'
                              : t.id === 'debt'
                                ? 'Defense + packets'
                                : t.id === 'lender'
                                  ? 'Underwriting analysis'
                                : t.id === 'automation'
                                  ? 'Workflows + runs'
                                  : 'Quick launch modules'}
                        </div>
                      </div>
                    ) : (
                      <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-black/80' : 'text-white/40 group-hover:text-white/70'}`}>
                        {t.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {sidebarExpanded && (
              <>
                <div className="h-px bg-white/10 my-2" />
                <div className="px-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">Quick launch</div>
                  <div className="mt-2 space-y-2">
                    {[
                      { label: 'Partner Portal', path: '/portal/dashboard', icon: LayoutDashboard },
                      { label: 'Business Portal', path: '/business/dashboard', icon: Briefcase },
                      { label: 'AU Marketplace', path: '/au/marketplace', icon: CreditCard },
                      { label: 'Resources', path: '/resources', icon: UploadCloud },
                    ].map((x) => (
                      <button
                        key={x.path}
                        onClick={() => navigate(x.path)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-white/75 hover:text-white transition-all"
                      >
                        <x.icon size={16} className="text-amber-400/80" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{x.label}</span>
                      </button>
                    ))}
                    {isAdmin && (
                      <button
                        onClick={() => navigate('/admin')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-white/80 transition-all"
                      >
                        <Users size={16} className="text-amber-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#14231e_0%,#0a0f0d_100%)]">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          
          <div className="p-4 md:p-12 max-w-7xl mx-auto h-full flex flex-col">
            <header className="mb-8 md:mb-12 space-y-2">
              <h2 className="text-3xl md:text-4xl font-extralight tracking-tight">
                Finely Cred <span className="text-amber-500">Workspace</span>
              </h2>
              <p className="text-white/20 text-[10px] md:text-xs uppercase tracking-[0.4em]">Administrative Level: Master Architect</p>
            </header>

            <div className="flex-1 relative h-full overflow-hidden">
              {activeTab === 'overview' && (
                <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700 h-full overflow-y-auto pb-20 pr-2">
                  {/* Quick Actions (so you can reach partner + upload modules) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">
                      Signed in as{' '}
                      <span className="text-white/70 font-mono normal-case tracking-normal">
                        {signedInEmail || '—'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        auth
                          .signOut()
                          .finally(() => navigate('/onboarding'));
                      }}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      title="Sign out and switch accounts"
                    >
                      Switch account
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpi.mode === 'admin' ? (
                      <>
                        <KpiCard
                          label="Partners"
                          value={kpi.partnersCount}
                          hint="Active partner records"
                          tone="sky"
                          onClick={() => navigate('/admin/partners')}
                        />
                        <KpiCard
                          label="Open cases"
                          value={kpi.openCasesCount}
                          hint="Cases needing attention"
                          series={kpi.series.cases14}
                          tone="emerald"
                          onClick={() => navigate('/admin/cases')}
                        />
                        <KpiCard
                          label="Open tasks"
                          value={kpi.openTasksCount}
                          hint="Ops queue work items"
                          series={kpi.series.tasks14}
                          tone="amber"
                          onClick={() => navigate('/admin/workflow')}
                        />
                        <KpiCard
                          label="Leads"
                          value={kpi.leadsCount}
                          hint="Captured inbound requests"
                          series={kpi.series.leads14}
                          tone="violet"
                          onClick={() => navigate('/admin/leads')}
                        />
                      </>
                    ) : (
                      <>
                        <KpiCard
                          label="Open tasks"
                          value={kpi.openTasksCount}
                          hint="Next actions in motion"
                          series={kpi.series.tasks14}
                          tone="amber"
                          onClick={() => navigate('/portal/tasks')}
                        />
                        <KpiCard
                          label="Open cases"
                          value={kpi.openCasesCount}
                          hint="Disputes currently active"
                          series={kpi.series.cases14}
                          tone="emerald"
                          onClick={() => navigate('/portal/disputes')}
                        />
                        <KpiCard
                          label="Reports"
                          value={kpi.reportsCount}
                          hint="Parsed & stored reports"
                          series={kpi.series.reports14}
                          tone="violet"
                          onClick={() => navigate('/portal/reports')}
                        />
                        <KpiCard
                          label="Dispute signals"
                          value={kpi.candidatesCount}
                          hint="Candidates detected"
                          tone="sky"
                          onClick={() => setActiveTab('remedy')}
                        />
                      </>
                    )}
                  </div>

                  {isAdmin ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <button
                        onClick={() => navigate('/admin')}
                        className="text-left rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all p-6"
                        title="Admin Dashboard"
                      >
                        <div className="flex items-center gap-3 text-amber-400">
                          <LayoutDashboard size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Admin Dashboard</span>
                        </div>
                        <p className="mt-3 text-white/70 text-sm">
                          Central hub: partners, cases, settings, templates, and analytics.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400/80">
                          Open dashboard <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/admin/settings')}
                        className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6"
                        title="System Settings"
                      >
                        <div className="flex items-center gap-3 text-amber-400">
                          <Settings size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">System Settings</span>
                        </div>
                        <p className="mt-3 text-white/70 text-sm">
                          Branding, compliance links, admin users, and feature flags.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                          Open settings <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/admin/partners')}
                        className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6"
                        title="Partner Management"
                      >
                        <div className="flex items-center gap-3 text-amber-400">
                          <Users size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Partner Management</span>
                        </div>
                        <p className="mt-3 text-white/70 text-sm">
                          Create partners, upload reports, bind evidence, generate letters, and manage notes.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                          Open partners <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/admin/cases')}
                        className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6"
                        title="Case Management"
                      >
                        <div className="flex items-center gap-3 text-amber-400">
                          <Gavel size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Case Management</span>
                        </div>
                        <p className="mt-3 text-white/70 text-sm">Track bureau cases, rounds, and follow-up windows across all partners.</p>
                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                          Open cases <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/admin/billing')}
                        className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6"
                        title="Billing & Agreements"
                      >
                        <div className="flex items-center gap-3 text-amber-400">
                          <CreditCard size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Billing & Agreements</span>
                        </div>
                        <p className="mt-3 text-white/70 text-sm">Manage partner agreements, update statuses, grant entitlements.</p>
                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                          Open billing <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/business/dashboard')}
                        className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6"
                        title="Business Portal"
                      >
                        <div className="flex items-center gap-3 text-amber-400">
                          <Briefcase size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Business Portal</span>
                        </div>
                        <p className="mt-3 text-white/70 text-sm">Business profile, fundability matrix, and vendor sequencing.</p>
                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                          Open business <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/resources')}
                        className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6"
                        title="Resources"
                      >
                        <div className="flex items-center gap-3 text-amber-400">
                          <Lock size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Resources</span>
                        </div>
                        <p className="mt-3 text-white/70 text-sm">Reference library and product shells (CMS + access control in Phase 5).</p>
                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                          Open library <ArrowRight size={12} />
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <button
                        onClick={() => navigate('/portal/reports')}
                        className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6"
                      >
                        <div className="flex items-center gap-3 text-amber-400">
                          <UploadCloud size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Credit Reports</span>
                        </div>
                        <p className="mt-3 text-white/70 text-sm">Upload HTML/PDF reports to generate tradelines + dispute candidates.</p>
                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                          Open reports <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/portal/disputes')}
                        className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6"
                      >
                        <div className="flex items-center gap-3 text-amber-400">
                          <Gavel size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Dispute Center</span>
                        </div>
                        <p className="mt-3 text-white/70 text-sm">View cases by bureau, rounds, and follow-up windows.</p>
                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                          Open disputes <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/portal/tasks')}
                        className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6"
                      >
                        <div className="flex items-center gap-3 text-amber-400">
                          <ListChecks size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Tasks</span>
                        </div>
                        <p className="mt-3 text-white/70 text-sm">Mail letters, track deadlines, and complete follow-ups.</p>
                        <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                          Open tasks <ArrowRight size={12} />
                        </div>
                      </button>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-white/40">Partners</p>
                          <p className="mt-2 text-white/60 text-sm">
                            Unified admin workflow: pick a partner → upload report → evidence → disputes → letters.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => navigate('/admin/partners#create-partner')}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                            title="Create a new partner"
                          >
                            Create partner <ArrowRight size={12} />
                          </button>
                          <input
                            value={partnerQuery}
                            onChange={(e) => setPartnerQuery(e.target.value)}
                            className="w-72 max-w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                            placeholder="Search partners…"
                          />
                        </div>
                      </div>

                      {adminPartnerCards.length === 0 ? (
                        <div className="text-white/60 text-sm">No partners found.</div>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {adminPartnerCards.map((p) => (
                            <div
                              key={p.id}
                              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-white font-semibold truncate">{p.name}</div>
                                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                                    {p.email} • {p.status}
                                  </div>
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                  {new Date(p.updatedAt).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                  <div className="text-[9px] uppercase tracking-widest text-white/40">Reports</div>
                                  <div className="mt-1 text-white/80 font-mono text-sm">{p.reports}</div>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                  <div className="text-[9px] uppercase tracking-widest text-white/40">Open tasks</div>
                                  <div className="mt-1 text-white/80 font-mono text-sm">{p.openTasks}</div>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                  <div className="text-[9px] uppercase tracking-widest text-white/40">Open cases</div>
                                  <div className="mt-1 text-white/80 font-mono text-sm">{p.openCases}</div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => navigate(`/admin/partners/${p.id}`)}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                >
                                  Open profile <ArrowRight size={12} />
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/partners/${p.id}?tab=reports`)}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black hover:brightness-110 text-[10px] font-black uppercase tracking-widest transition-all"
                                  title="Upload report inside this partner profile"
                                >
                                  Upload report <ArrowRight size={12} />
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/partners/${p.id}?tab=notes`)}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                >
                                  Notes <ArrowRight size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-[11px] text-white/40">
                        Showing up to <span className="text-white/70 font-mono">24</span> partners here. Full list stays in Partner Management.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-6 items-start">
                    {/* Score Panel */}
                    <div className="group relative p-8 rounded-3xl border-t border-l border-white/10 border-b border-r border-black/50 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(245,158,11,0.1)] hover:-translate-y-1 transition-all duration-500 w-full md:w-auto">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-6">Structural Integrity</p>
                      <div className="flex items-end gap-4">
                        <span className="text-6xl font-extralight tabular-nums leading-none drop-shadow-md">{user.score || 550}</span>
                        <div className="pb-2 text-green-500 flex items-center gap-1 font-mono text-xs">
                          <ChevronUp size={14} /> +42
                        </div>
                      </div>
                      <div className="mt-8 h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-amber-500 w-3/4 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                      </div>
                    </div>

                    {/* Liquidity Panel */}
                    <div className="group relative p-8 rounded-3xl border-t border-l border-white/10 border-b border-r border-black/50 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(245,158,11,0.1)] hover:-translate-y-1 transition-all duration-500 w-full md:w-auto">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-6">Liquidity Horizon</p>
                      <div className="flex items-end gap-4">
                        <span className="text-6xl font-extralight tabular-nums leading-none drop-shadow-md">
                          ${((user.target || 50000) / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-amber-500/80 uppercase tracking-widest mt-6">Ready for Deployment</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'lender' && <LenderLogicEngine userScore={user.score} />}
              {activeTab === 'debt' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 h-full overflow-y-auto pb-20 pr-2">
                  <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/5 pb-6">
                    <div className="space-y-2 text-left">
                      <h3 className="text-3xl font-light text-white tracking-tight">
                        Debt <span className="text-amber-500">Kill</span>
                      </h3>
                      <p className="text-white/40 text-xs uppercase tracking-[0.2em]">
                        Defense workflow • evidence-first • next best action
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('/portal/debt')}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:brightness-110 text-black text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Open Debt Center <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/consultation?lane=' + encodeURIComponent('Debt Kill (Debt & Legal)'))}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        Book free enlightenment session <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-4">
                    {[
                      { title: 'Collections', desc: 'Validation, dispute sequencing, and proof-of-claim workflows.' },
                      { title: 'Summons', desc: 'Time-sensitive: document capture + response sequencing by jurisdiction.' },
                      { title: 'Reporting cleanup', desc: 'Align bureau reporting to your actual facts and documentation.' },
                    ].map((x) => (
                      <div key={x.title} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                        <div className="text-white font-semibold">{x.title}</div>
                        <div className="mt-2 text-white/60 text-sm">{x.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-100 text-sm">
                    <span className="font-semibold">Live next step:</span> upload any letters/summons immediately, then generate your packet workflow in the Debt Center.
                  </div>
                </div>
              )}
              {activeTab === 'remedy' && <DisputeWeaver fractures={disputeCandidates} />}
              {activeTab === 'automation' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 h-full overflow-y-auto pb-20 pr-2">
                  <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/5 pb-6">
                    <div className="space-y-2 text-left">
                      <h3 className="text-3xl font-light text-white tracking-tight">
                        Automation <span className="text-amber-500">Control Room</span>
                      </h3>
                      <p className="text-white/40 text-xs uppercase tracking-[0.2em]">
                        Workflows • scheduled runs • compliance logs
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setAutomationView((v) => (v === 'history' ? 'workflows' : 'history'))}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        {automationView === 'history' ? 'Back to workflows' : 'View run history'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfigOpenFor('dispute_followup_scheduler')}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:brightness-110 text-black text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Workflow settings
                      </button>
                    </div>
                  </div>

                  {automationRunMsg && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-100 text-sm">
                      {automationRunMsg}
                    </div>
                  )}

                  {automationView === 'history' ? (
                    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
                      <div className="text-white/80 font-semibold">Run history</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        Stored locally • updates live as workflows run
                      </div>
                      <div className="space-y-2">
                        {listWorkflowRuns(40).map((r) => (
                          <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-white font-semibold truncate">
                                  {r.workflowId.replace(/_/g, ' ')} • {r.mode}
                                </div>
                                <div className="mt-1 text-white/70 text-sm">{r.summary}</div>
                                <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                  started {new Date(r.startedAt).toLocaleString()} • actions {r.actions.length}
                                </div>
                              </div>
                              <div className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                {new Date(r.finishedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-3 gap-4">
                      {[
                        {
                          id: 'dispute_followup_scheduler' as WorkflowId,
                          title: 'Dispute follow-up scheduler',
                          desc: 'Auto-create follow-up tasks as bureau round due dates approach. Prevents stalled rounds.',
                          badge: 'Live',
                        },
                        {
                          id: 'evidence_request_autopilot' as WorkflowId,
                          title: 'Evidence request autopilot',
                          desc: 'Creates upload tasks when case items are missing evidence, with an internal due date.',
                          badge: 'Live',
                        },
                      ].map((w) => {
                        const cfg = getWorkflowConfig(w.id);
                        return (
                          <div
                            key={w.id}
                            className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4 hover:bg-white/[0.03] transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="text-white font-semibold">{w.title}</div>
                                  {!cfg.enabled && (
                                    <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-[9px] font-bold text-white/60 uppercase tracking-widest">
                                      Disabled
                                    </span>
                                  )}
                                </div>
                                <div className="mt-2 text-white/60 text-sm">{w.desc}</div>
                                <div className="mt-3 text-[10px] uppercase tracking-widest text-white/35 font-mono">
                                  params:{' '}
                                  {w.id === 'dispute_followup_scheduler'
                                    ? `daysBeforeDue=${Number(cfg.params.daysBeforeDue ?? 7)}`
                                    : `dueInDays=${Number(cfg.params.dueInDays ?? 3)}`}
                                </div>
                              </div>
                              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-300 uppercase tracking-widest shrink-0">
                                {w.badge}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <button
                                type="button"
                                onClick={() => setConfigOpenFor(w.id)}
                                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                              >
                                Configure
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const run = runWorkflow(w.id, 'dry_run');
                                  addWorkflowRun(run);
                                  setAutomationRunMsg(run.summary);
                                  setStoreVersion((v) => v + 1);
                                }}
                                className="px-3 py-2 rounded-xl bg-amber-500 hover:brightness-110 text-black text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                Dry‑run
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const run = runWorkflow(w.id, 'live');
                                  addWorkflowRun(run);
                                  setAutomationRunMsg(run.summary);
                                  setStoreVersion((v) => v + 1);
                                }}
                                className="px-3 py-2 rounded-xl bg-emerald-500 hover:brightness-110 text-black text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                Run live
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {configOpenFor && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70">
                      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d1512] shadow-2xl p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-white font-semibold">Workflow settings</div>
                            <div className="mt-1 text-white/60 text-sm">{configOpenFor.replace(/_/g, ' ')}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfigOpenFor(null)}
                            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 transition-all"
                            title="Close"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="mt-5 space-y-4">
                          {(() => {
                            const cfg = getWorkflowConfig(configOpenFor);
                            return (
                              <>
                                <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                                  <div>
                                    <div className="text-white/80 text-sm font-semibold">Enabled</div>
                                    <div className="text-white/50 text-xs">Turn this workflow on/off.</div>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={cfg.enabled}
                                    onChange={(e) => {
                                      setWorkflowConfig(configOpenFor, { enabled: e.target.checked });
                                      setStoreVersion((v) => v + 1);
                                    }}
                                  />
                                </label>

                                {configOpenFor === 'dispute_followup_scheduler' ? (
                                  <label className="block rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                                    <div className="text-white/80 text-sm font-semibold">Days before due date</div>
                                    <div className="mt-1 text-white/50 text-xs">
                                      Create a follow-up task when a round due date is within this window.
                                    </div>
                                    <input
                                      type="number"
                                      min={0}
                                      value={Number(cfg.params.daysBeforeDue ?? 7)}
                                      onChange={(e) => {
                                        const n = Number(e.target.value);
                                        setWorkflowConfig(configOpenFor, { params: { daysBeforeDue: Number.isFinite(n) ? n : 7 } });
                                        setStoreVersion((v) => v + 1);
                                      }}
                                      className="mt-3 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                                    />
                                  </label>
                                ) : (
                                  <label className="block rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                                    <div className="text-white/80 text-sm font-semibold">Upload due (days)</div>
                                    <div className="mt-1 text-white/50 text-xs">
                                      Set a due date for evidence upload tasks created by the autopilot.
                                    </div>
                                    <input
                                      type="number"
                                      min={0}
                                      value={Number(cfg.params.dueInDays ?? 3)}
                                      onChange={(e) => {
                                        const n = Number(e.target.value);
                                        setWorkflowConfig(configOpenFor, { params: { dueInDays: Number.isFinite(n) ? n : 3 } });
                                        setStoreVersion((v) => v + 1);
                                      }}
                                      className="mt-3 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                                    />
                                  </label>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setConfigOpenFor(null)}
                            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'vault' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 h-full overflow-y-auto pb-20 pr-2">
                  <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/5 pb-6">
                    <div className="space-y-2 text-left">
                      <h3 className="text-3xl font-light text-white tracking-tight">
                        Secure <span className="text-amber-500">Launchpad</span>
                      </h3>
                      <p className="text-white/40 text-xs uppercase tracking-[0.2em]">
                        Jump into modules • shortcuts • next-step routing
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 text-[10px] uppercase tracking-widest text-white/40">
                      Tip: configure automation in <span className="text-amber-400/80 font-black">Automation</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button onClick={() => navigate('/portal/dashboard')} className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6">
                      <div className="flex items-center gap-3 text-amber-400">
                        <LayoutDashboard size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Partner Portal</span>
                      </div>
                      <p className="mt-3 text-white/70 text-sm">Reports, disputes, tasks, messages, and billing.</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">Open <ArrowRight size={12} /></div>
                    </button>

                    <button onClick={() => navigate('/business/dashboard')} className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6">
                      <div className="flex items-center gap-3 text-amber-400">
                        <Briefcase size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Business Portal</span>
                      </div>
                      <p className="mt-3 text-white/70 text-sm">Business profile, fundability matrix, vendor sequencing.</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">Open <ArrowRight size={12} /></div>
                    </button>

                    <button onClick={() => navigate('/portal/billing')} className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6">
                      <div className="flex items-center gap-3 text-amber-400">
                        <CreditCard size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Billing</span>
                      </div>
                      <p className="mt-3 text-white/70 text-sm">Agreements, entitlements, Stripe & in-house financing.</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">Open <ArrowRight size={12} /></div>
                    </button>

                    <button onClick={() => navigate('/portal/identity-theft')} className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6">
                      <div className="flex items-center gap-3 text-amber-400">
                        <ShieldAlert size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Identity Theft</span>
                      </div>
                      <p className="mt-3 text-white/70 text-sm">Recovery workflow, FTC reports, freezes, and fraud alerts.</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">Open <ArrowRight size={12} /></div>
                    </button>

                    <button onClick={() => navigate('/portal/documents')} className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6">
                      <div className="flex items-center gap-3 text-amber-400">
                        <Lock size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Documents</span>
                      </div>
                      <p className="mt-3 text-white/70 text-sm">Secure document vault and evidence storage.</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">Open <ArrowRight size={12} /></div>
                    </button>

                    <button onClick={() => navigate('/portal/escalations')} className="text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] transition-all p-6">
                      <div className="flex items-center gap-3 text-amber-400">
                        <Scale size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Escalations</span>
                      </div>
                      <p className="mt-3 text-white/70 text-sm">CFPB, BBB, AG complaints tracking.</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">Open <ArrowRight size={12} /></div>
                    </button>

                    {isAdmin && (
                      <>
                        <button onClick={() => navigate('/admin/billing')} className="text-left rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all p-6">
                          <div className="flex items-center gap-3 text-amber-400">
                            <CreditCard size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Admin Billing</span>
                          </div>
                          <p className="mt-3 text-white/70 text-sm">Manage all partner agreements and entitlements.</p>
                          <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400/80">Open <ArrowRight size={12} /></div>
                        </button>

                        <button onClick={() => navigate('/admin/partners')} className="text-left rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all p-6">
                          <div className="flex items-center gap-3 text-amber-400">
                            <Users size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Partner Admin</span>
                          </div>
                          <p className="mt-3 text-white/70 text-sm">Create and manage all partner profiles.</p>
                          <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400/80">Open <ArrowRight size={12} /></div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Assistant */}
          <div className="fixed bottom-4 left-4 right-4 md:absolute md:bottom-12 md:right-12 md:w-80 md:left-auto bg-black/80 border-t border-l border-white/10 border-b border-r border-black/50 backdrop-blur-2xl p-6 rounded-2xl shadow-2xl space-y-4 hover:scale-105 transition-transform duration-300 z-50">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Cpu size={16} className="text-amber-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white">Finely AI</p>
            </div>
            <p className="text-[10px] text-white/60 leading-relaxed font-light italic">
              {activeTab === 'lender' 
                ? "I've isolated institutional lenders matching your profile. Tune utilization and relationship signals to raise your approval probability."
                : activeTab === 'debt'
                ? "If you have active collections or summons, timing matters. Upload documents first, then we’ll sequence the safest defense workflow."
                : activeTab === 'remedy' 
                ? "Three fractures identified. The FDCPA violation on the Experian file has a 94% removal probability via 15 U.S.C. § 1681."
                : `Based on your ${user.fractures?.length || 0} foundational fractures, institutional readiness is projected in 90 days.`
              }
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
