import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Gavel, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { listCasesByPartner } from '../../data/casesRepo';
import { listReportsByPartner } from '../../data/reportsRepo';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { ActionLink, Button, ClickableCard, CollapsibleSection } from '../../components/ui';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import type { DisputeCandidate } from '../../domain/creditReports';

function limitByBureau<T>(entries: Array<[string, T[]]>, limit: number): Array<[string, T[]]> {
  if (!Number.isFinite(limit) || limit <= 0) return [];
  let remaining = limit;
  const out: Array<[string, T[]]> = [];
  for (const [k, list] of entries) {
    if (remaining <= 0) break;
    const slice = list.slice(0, remaining);
    if (slice.length) out.push([k, slice]);
    remaining -= slice.length;
  }
  return out;
}

export default function PartnerDisputesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const email = auth.user?.email || '';
  const [status, setStatus] = useState<'open' | 'closed' | 'all'>('open');
  const [showAllNeeds, setShowAllNeeds] = useState(false);
  const [showAllAlready, setShowAllAlready] = useState(false);
  const [showAllCasesByBureau, setShowAllCasesByBureau] = useState<Record<string, boolean>>({});

  const { partner } = usePartnerSession();

  const cases = useMemo(() => {
    if (!partner) return [];
    const all = listCasesByPartner(partner.id);
    return status === 'all' ? all : all.filter((c) => c.status === status);
  }, [partner, status]);

  const reports = useMemo(() => {
    if (!partner) return [];
    return listReportsByPartner(partner.id);
  }, [partner]);

  const latestParsedReport = useMemo(() => {
    for (const r of reports) {
      if (r.parsed) return r;
    }
    return null;
  }, [reports]);

  const candidates = useMemo<DisputeCandidate[]>(() => {
    if (!latestParsedReport?.parsed) return [];
    return deriveDisputeCandidates(latestParsedReport.parsed as any, latestParsedReport.id);
  }, [latestParsedReport?.id]);

  const disputedIndex = useMemo(() => {
    const candidateIdToCaseId = new Map<string, { caseId: string; caseTitle: string; caseStatus: string; bureau: string }>();
    for (const c of cases) {
      for (const it of c.items) {
        if (!it.candidateId) continue;
        candidateIdToCaseId.set(it.candidateId, { caseId: c.id, caseTitle: c.title, caseStatus: c.status, bureau: c.bureau });
      }
    }
    return candidateIdToCaseId;
  }, [cases]);

  const needsDisputing = useMemo(() => candidates.filter((c) => !disputedIndex.has(c.id)), [candidates, disputedIndex]);
  const alreadyDisputed = useMemo(() => candidates.filter((c) => disputedIndex.has(c.id)), [candidates, disputedIndex]);

  const needsByBureau = useMemo(() => {
    const m = new Map<string, DisputeCandidate[]>();
    for (const c of needsDisputing) {
      const k = (c.bureau || 'Other').toString();
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [needsDisputing]);

  const alreadyByBureau = useMemo(() => {
    const m = new Map<string, DisputeCandidate[]>();
    for (const c of alreadyDisputed) {
      const k = (c.bureau || 'Other').toString();
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [alreadyDisputed]);

  const casesByBureau = useMemo(() => {
    const m = new Map<string, typeof cases>();
    for (const c of cases) {
      const k = (c.bureau || 'Other').toString();
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [cases]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Dispute Center"
      subtitle="Your cases are organized per bureau and tracked by round. Generate letters and follow-ups with evidence and reasons."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found for this account. If you’re an admin, use Partner Management to pick a partner.
          </div>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.disputes]}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <ActionLink to="/portal/dashboard" title="Back to Partner Dashboard" icon={<ArrowLeft size={16} />}>
                  Partner Dashboard
                </ActionLink>
                <ActionLink to="/dashboard" title="Back to Finely Cred Dashboard" icon={<ArrowLeft size={16} />}>
                  Finely Cred
                </ActionLink>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                {(['open', 'closed', 'all'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      status === s
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" size="sm" onClick={() => navigate('/portal/letters?openPicker=1')}>
                  Generate letter <ArrowRight size={14} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/portal/reports')}>
                  Upload / Evidence <ArrowRight size={14} />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Candidates</div>
                <div className="mt-2 text-2xl font-semibold text-white">{candidates.length}</div>
                <div className="mt-1 text-white/50 text-xs">From latest parsed report</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Needs disputing</div>
                <div className="mt-2 text-2xl font-semibold text-white">{needsDisputing.length}</div>
                <div className="mt-1 text-white/50 text-xs">Not in any case yet</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Already disputed</div>
                <div className="mt-2 text-2xl font-semibold text-white">{alreadyDisputed.length}</div>
                <div className="mt-1 text-white/50 text-xs">Tracked in Dispute Center</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Cases</div>
                <div className="mt-2 text-2xl font-semibold text-white">{cases.length}</div>
                <div className="mt-1 text-white/50 text-xs">{status} view</div>
              </div>
            </div>

            {latestParsedReport ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-white/70 text-sm">
                Using report: <span className="text-white/85 font-semibold">{latestParsedReport.filename}</span>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-white/70 text-sm">
                Upload a report first to see “Needs disputing” items here.
              </div>
            )}

            {latestParsedReport && needsDisputing.length ? (
              <CollapsibleSection
                title="Needs disputing"
                subtitle="Items detected on your report that are not yet part of a dispute case."
                count={`${needsDisputing.length} item${needsDisputing.length === 1 ? '' : 's'}`}
                defaultOpen
                storageKey={`portal.disputes.needs.${status}`}
              >
                <div className="space-y-4">
                  {(showAllNeeds ? needsByBureau : limitByBureau(needsByBureau, 12)).map(([bureau, list]) => (
                    <details key={bureau} className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden" open>
                      <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
                        <div className="text-white font-semibold">{bureau}</div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40">{list.length}</div>
                      </summary>
                      <div className="p-5 pt-0 grid md:grid-cols-2 gap-4">
                        {list.map((c) => (
                          <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                            <div className="min-w-0">
                              <div className="text-white font-semibold truncate">{c.account}</div>
                              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                {c.bureau} • {c.type} • {c.code}
                              </div>
                              <div className="mt-2 text-white/70 text-sm">{c.status}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => navigate('/portal/letters?openPicker=1')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                              >
                                Select in Letters <ArrowRight size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate('/portal/reports?intelTab=collections')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                              >
                                Open report <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                  {needsDisputing.length > 12 ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAllNeeds((v) => !v)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        title={showAllNeeds ? 'Show fewer items' : 'Show all items'}
                      >
                        {showAllNeeds ? 'Show less' : `Show all (${needsDisputing.length})`}
                      </button>
                    </div>
                  ) : null}
                </div>
              </CollapsibleSection>
            ) : null}

            {latestParsedReport && alreadyDisputed.length ? (
              <CollapsibleSection
                title="Already disputed"
                subtitle="Items that are already tracked inside a dispute case (open or closed)."
                count={`${alreadyDisputed.length} item${alreadyDisputed.length === 1 ? '' : 's'}`}
                defaultOpen={false}
                storageKey={`portal.disputes.already.${status}`}
              >
                <div className="space-y-4">
                  {(showAllAlready ? alreadyByBureau : limitByBureau(alreadyByBureau, 12)).map(([bureau, list]) => (
                    <details key={bureau} className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                      <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
                        <div className="text-white font-semibold">{bureau}</div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40">{list.length}</div>
                      </summary>
                      <div className="p-5 pt-0 grid md:grid-cols-2 gap-4">
                        {list.map((c) => {
                          const hit = disputedIndex.get(c.id) ?? null;
                          return (
                            <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                              <div className="min-w-0">
                                <div className="text-white font-semibold truncate">{c.account}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                  {c.bureau} • {c.type} • {c.code}
                                </div>
                                <div className="mt-2 text-white/70 text-sm">{c.status}</div>
                              </div>
                              {hit ? (
                                <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-white/70 text-sm">
                                  Case:{' '}
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/portal/disputes/${hit.caseId}`)}
                                    className="text-amber-300 hover:text-amber-200 underline underline-offset-4"
                                  >
                                    {hit.caseTitle}
                                  </button>{' '}
                                  <span className="text-white/40">•</span>{' '}
                                  <span className="text-white/70">{hit.caseStatus}</span>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  ))}
                  {alreadyDisputed.length > 12 ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAllAlready((v) => !v)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        title={showAllAlready ? 'Show fewer items' : 'Show all items'}
                      >
                        {showAllAlready ? 'Show less' : `Show all (${alreadyDisputed.length})`}
                      </button>
                    </div>
                  ) : null}
                </div>
              </CollapsibleSection>
            ) : null}

            {cases.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
                No cases yet. Upload a report, capture screenshots, then generate your bureau letter in Letters to create your first case.
              </div>
            ) : (
              <div className="space-y-4">
                {casesByBureau.map(([bureau, list]) => (
                  <CollapsibleSection
                    key={bureau}
                    title={`${bureau} cases`}
                    subtitle="Grouped to keep the page short. Open a case to see rounds, evidence, and deadlines."
                    count={`${list.length} case${list.length === 1 ? '' : 's'}`}
                    defaultOpen
                    storageKey={`portal.disputes.${status}.${bureau}`}
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      {(showAllCasesByBureau[bureau] ? list : list.slice(0, 4)).map((c) => {
                        const lastRound = c.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
                        return (
                          <ClickableCard
                            key={c.id}
                            onClick={() => navigate(`/portal/disputes/${c.id}`)}
                            className="p-6 space-y-4"
                            title="Open case details"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 text-amber-400">
                                  <Gavel size={16} />
                                  <span className="text-xs font-semibold uppercase tracking-wider">{c.bureau} case</span>
                                </div>
                                <p className="mt-2 text-lg font-semibold text-white truncate">{c.title}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                  {c.status} • {c.items.length} items • rounds: {c.rounds.length}
                                </p>
                                {lastRound && (
                                  <p className="mt-2 text-white/60 text-sm">
                                    Latest: <span className="text-white/80 font-mono">{lastRound.round}</span> • Due:{' '}
                                    <span className="text-white/80">{lastRound.dueAt ? new Date(lastRound.dueAt).toLocaleDateString() : '—'}</span>
                                  </p>
                                )}
                              </div>
                              {c.status === 'open' ? (
                                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-300 uppercase tracking-widest">
                                  Active
                                </div>
                              ) : (
                                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/50 uppercase tracking-widest">
                                  Closed
                                </div>
                              )}
                            </div>

                            {c.status === 'open' && lastRound?.dueAt && (
                              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-white/70 text-sm flex items-start gap-3">
                                <ShieldAlert size={16} className="text-amber-400 mt-0.5" />
                                <div>
                                  <p className="text-white/80 font-semibold">Follow-up window</p>
                                  <p className="mt-1">
                                    Next follow-up due by{' '}
                                    <span className="text-white/90">{new Date(lastRound.dueAt).toLocaleDateString()}</span>.
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                              Open case <ArrowRight size={12} />
                            </div>
                          </ClickableCard>
                        );
                      })}
                    </div>
                    {list.length > 4 ? (
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            setShowAllCasesByBureau((cur) => ({ ...cur, [bureau]: !(cur[bureau] ?? false) }))
                          }
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          title={(showAllCasesByBureau[bureau] ?? false) ? 'Show fewer cases' : 'Show all cases'}
                        >
                          {(showAllCasesByBureau[bureau] ?? false) ? 'Show less' : `Show all (${list.length})`}
                        </button>
                      </div>
                    ) : null}
                  </CollapsibleSection>
                ))}
              </div>
            )}
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}

