import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FileText, FolderOpen, Gavel, ListChecks, ShieldAlert, Scale, TrendingUp, MessageCircle, Calendar, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listCasesByPartner } from '../../data/casesRepo';
import { listDebtByPartner } from '../../data/debtRepo';
import { listPartnerNotesByPartner } from '../../data/partnerNotesRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { KpiCard } from '../../components/ui/KpiCards';
import { bucketCountsByDay } from '../../utils/timeSeries';
import { upsertPartner } from '../../data/partnersRepo';
import { JourneyRoadmap } from '../../components/journey/JourneyRoadmap';
import { Button, ClickableCard, CollapsibleSection, ActionLink } from '../../components/ui';
import { computePartnerOverallScore } from '../../utils/partnerOverallScore';
import { LineChartCard, DonutChartCard } from '../../components/charts';

export default function PartnerDashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);
  const [showAllNextSteps, setShowAllNextSteps] = useState(false);

  const { partner } = usePartnerSession();
  const reports = useMemo(() => (partner ? listReportsByPartner(partner.id) : []), [partner]);
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner]);
  const tasks = useMemo(() => (partner ? listTasksByPartner(partner.id) : []), [partner]);
  const cases = useMemo(() => (partner ? listCasesByPartner(partner.id) : []), [partner]);
  const debtCases = useMemo(() => (partner ? listDebtByPartner(partner.id) : []), [partner]);
  const letters = useMemo(() => (partner ? listLettersByPartner(partner.id) : []), [partner]);
  const partnerNotes = useMemo(() => (partner ? listPartnerNotesByPartner(partner.id) : []), [partner]);
  const visibleNotes = useMemo(
    () =>
      partnerNotes
        .filter((n) => n.visibility === 'partner')
        .slice()
        .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 12),
    [partnerNotes],
  );

  const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'completed');
  const openCases = cases.filter((c) => c.status === 'open');
  const openDebt = debtCases.filter((d) => d.status === 'open' || d.status === 'in_review');

  const NOTES_LIMIT = 4;
  const MODULES_LIMIT = 8;
  const NEXT_STEPS_LIMIT = 6;

  const series = useMemo(() => {
    const tasks14 = bucketCountsByDay({ items: tasks, getIso: (t) => (t as any).createdAt, days: 14 }).values;
    const cases14 = bucketCountsByDay({ items: cases, getIso: (c) => (c as any).createdAt, days: 14 }).values;
    const evidence14 = bucketCountsByDay({ items: evidence, getIso: (e) => (e as any).createdAt, days: 14 }).values;
    const reports14 = bucketCountsByDay({ items: reports, getIso: (r) => (r as any).receivedAt, days: 14 }).values;
    return { tasks14, cases14, evidence14, reports14 };
  }, [tasks, cases, evidence, reports]);

  const overallScore = useMemo(() => {
    if (!partner) return null;
    return computePartnerOverallScore({
      partner,
      counts: {
        reports: reports.length,
        evidence: evidence.length,
        tasksOpen: openTasks.length,
        tasksDone: doneTasks.length,
        casesOpen: openCases.length + openDebt.length,
        lettersGenerated: letters.length,
      },
    });
  }, [partner?.id, reports.length, evidence.length, openTasks.length, doneTasks.length, openCases.length, openDebt.length, letters.length]);

  // Best-effort: keep journey stage in sync (local demo store).
  useEffect(() => {
    if (!partner) return;
    const nextStage =
      reports.length === 0
        ? 'report_upload'
        : evidence.length === 0
          ? 'evidence'
          : openTasks.length > 0
            ? 'letters'
            : openCases.length > 0
              ? 'analysis'
              : 'complete';
    if (partner.journeyStage !== nextStage) {
      void upsertPartner({
        ...partner,
        journeyStage: nextStage as any,
        journeySignals: {
          ...(partner.journeySignals ?? {}),
          reports: reports.length,
          evidence: evidence.length,
          openTasks: openTasks.length,
          openCases: openCases.length,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.id, reports.length, evidence.length, openTasks.length, openCases.length]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Partner Dashboard"
      subtitle="Your home base: next steps, uploads, and dispute progress — organized so you always know what to do next."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="fc-panel p-6 text-white/60">
            No partner profile found for this account. If you’re an admin, use Partner Management to pick a partner.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="fc-button-brand"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <ActionLink to="/dashboard" title="Back to Finely Cred Dashboard" icon={<ArrowLeft size={16} />}>
              Dashboard
            </ActionLink>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">partner_id: {partner.id}</div>
          </div>

          {overallScore ? (
            <div className="grid lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4">
                <KpiCard
                  label="Overall score"
                  value={overallScore.overall}
                  hint="Profile + execution readiness"
                  tone={overallScore.overall >= 80 ? 'emerald' : overallScore.overall >= 60 ? 'amber' : 'violet'}
                  onClick={() => navigate('/portal/checklist')}
                />
              </div>
              <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Mission control</div>
                    <div className="mt-2 text-white font-semibold">Top improvements + quick actions</div>
                    <div className="mt-1 text-white/60 text-sm">These are the fastest levers to raise score and move the file.</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('fc-roadmap-console');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      title="Jump to cinematic roadmap + action console"
                    >
                      Open 3D roadmap <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/portal/tasks')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    >
                      Tasks <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/portal/checklist')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
                      Checklist <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {overallScore.topActions?.length ? (
                  <div className="mt-4 grid md:grid-cols-3 gap-3">
                    {overallScore.topActions.slice(0, 3).map((a) => (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => navigate(a.path || '/portal/checklist')}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-4 text-left"
                        title={a.title}
                      >
                        <div className="text-[10px] uppercase tracking-widest text-amber-400">
                          {a.severity === 'warn' ? 'Priority' : 'Improvement'}
                        </div>
                        <div className="mt-2 text-white font-semibold">{a.title}</div>
                        <div className="mt-2 text-white/60 text-sm">{a.desc}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-white/60 text-sm">No improvements detected right now.</div>
                )}
              </div>
            </div>
          ) : null}

          {visibleNotes.length > 0 && (
            <CollapsibleSection
              title={<span className="text-amber-200">Staff notes</span>}
              subtitle="Pinned items are highest priority. Complete tasks as you go."
              count={`${visibleNotes.length} note${visibleNotes.length === 1 ? '' : 's'}`}
              defaultOpen={false}
              storageKey="portal.dashboard.staffNotes"
              className="border-amber-500/20 bg-amber-500/5"
              headerClassName="border-amber-500/20"
              actions={
                <div className="flex items-center gap-2">
                  {visibleNotes.length > NOTES_LIMIT ? (
                    <Button variant="outline" size="sm" onClick={() => setShowAllNotes((v) => !v)}>
                      {showAllNotes ? 'Show less' : `Show all (${visibleNotes.length})`} <ArrowRight size={14} />
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={() => navigate('/portal/messages')}>
                    Message support <ArrowRight size={14} />
                  </Button>
                </div>
              }
            >
              <div className="grid md:grid-cols-2 gap-4">
                {(showAllNotes ? visibleNotes : visibleNotes.slice(0, NOTES_LIMIT)).map((n) => (
                  <div key={n.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-2">
                    <div className="text-white font-semibold">{n.title || 'Note'}</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      {new Date(n.createdAt).toLocaleString()}
                      {n.pinned ? ' • pinned' : ''}
                    </div>
                    <pre className="whitespace-pre-wrap text-white/75 text-sm leading-relaxed">{n.body}</pre>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {partner.lane === 'business_credit' && (
            <CollapsibleSection
              title={<span className="text-amber-200">Business persona</span>}
              subtitle="Your EIN profile (separate from personal)."
              defaultOpen={false}
              storageKey="portal.dashboard.businessPersona"
              className="border-amber-500/20 bg-amber-500/5"
              headerClassName="border-amber-500/20"
              actions={
                <Button variant="primary" size="sm" onClick={() => navigate('/business/profile')}>
                  Complete business profile <ArrowRight size={14} />
                </Button>
              }
            >
              <div className="text-white/60 text-sm">
                {(partner.routes as any)?.business_build?.business?.businessName || (partner.journeySignals as any)?.businessName || '—'}
                {((partner.routes as any)?.business_build?.business?.entityState || (partner.journeySignals as any)?.entityState) ? (
                  <span className="text-white/40 font-mono">
                    {' '}
                    •{' '}
                    {String((partner.routes as any)?.business_build?.business?.entityState || (partner.journeySignals as any)?.entityState).toUpperCase()}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-white/50 font-mono">
                <span>
                  EIN last4:{' '}
                  {String((partner.routes as any)?.business_build?.business?.einLast4 || (partner.journeySignals as any)?.einLast4 || '—')}
                </span>
                <span className="text-white/20">|</span>
                <span>
                  NAICS: {String((partner.routes as any)?.business_build?.business?.naics || (partner.journeySignals as any)?.naics || '—')}
                </span>
              </div>
            </CollapsibleSection>
          )}

          {(() => {
            const stage = partner.journeyStage ?? 'intake';
            const lane = partner.lane ?? 'other';
            const actions: Array<{ k: 'Now' | 'Next' | 'Later'; title: string; desc: string; path: string }> = [];
            if (stage === 'intake' || stage === 'report_upload') {
              actions.push({ k: 'Now', title: 'Upload your credit report', desc: 'Use HTML export when possible for full parsing.', path: '/portal/reports' });
              actions.push({ k: 'Next', title: 'Review Credit Intelligence', desc: 'Confirm negatives + screenshot key items for evidence.', path: '/portal/reports' });
              actions.push({ k: 'Later', title: 'Build your first letter draft', desc: 'Generate + save to your Letters Vault.', path: '/portal/letters' });
            } else if (stage === 'evidence') {
              actions.push({ k: 'Now', title: 'Capture evidence screenshots', desc: 'Save clean screenshots to your Evidence Vault.', path: '/portal/reports' });
              actions.push({ k: 'Next', title: 'Select dispute items + reasons', desc: 'Pick the items you want to dispute this round.', path: '/portal/letters' });
              actions.push({ k: 'Later', title: 'Generate PDF + save', desc: 'Store it so it’s always downloadable later.', path: '/portal/letters/vault' });
            } else if (stage === 'letters') {
              actions.push({ k: 'Now', title: 'Build/edit your draft', desc: 'Use paper preview, then generate + save.', path: '/portal/letters' });
              actions.push({ k: 'Next', title: 'Track tasks + deadlines', desc: 'Mail dates and follow-ups live in Tasks.', path: '/portal/tasks' });
              actions.push({ k: 'Later', title: 'Projects board', desc: 'See your workflow stages in Kanban.', path: '/portal/projects' });
            } else {
              actions.push({ k: 'Now', title: 'Open Tasks', desc: 'Stay current on follow-ups and deadlines.', path: '/portal/tasks' });
              actions.push({ k: 'Next', title: 'Open Letters Vault', desc: 'Download or re-open saved PDFs.', path: '/portal/letters/vault' });
              actions.push({ k: 'Later', title: 'Book a free enlightenment session', desc: 'Schedule and export calendar invites.', path: '/portal/calendar' });
            }
            if (lane === 'business_credit') {
              actions.unshift({ k: 'Now', title: 'Open Business Portal', desc: 'Vendor sequencing + lender logic for EIN builds.', path: '/business/dashboard' });
              actions.pop();
            }
            return (
              <div id="fc-roadmap-console">
                <CollapsibleSection
                  title="Roadmap + Action Console"
                  subtitle="Cinematic progress + the cleanest sequence (Now / Next / Later)."
                  count={`lane: ${partner.lane ?? '—'} • stage: ${partner.journeyStage ?? 'intake'}`}
                  defaultOpen
                  storageKey="portal.dashboard.roadmap"
                >
                  <div className="grid lg:grid-cols-2 gap-4">
                    <div>
                      <JourneyRoadmap stage={partner.journeyStage} signals={partner.journeySignals} lane={partner.lane} defaultView="cinematic" />
                    </div>
                    <div className="space-y-3">
                      {(['Now', 'Next', 'Later'] as const).map((k) => {
                        const items = actions.filter((a) => a.k === k);
                        return (
                          <details key={k} open={k === 'Now'} className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5">
                            <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                              <div className="text-white font-semibold">
                                {k}{' '}
                                <span className="ml-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                  {items.length} item{items.length === 1 ? '' : 's'}
                                </span>
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">Open</div>
                            </summary>
                            <div className="mt-4 space-y-3">
                              {items.map((a) => (
                                <ClickableCard key={`${k}:${a.path}`} onClick={() => navigate(a.path)} className="p-5">
                                  <div className="text-[10px] uppercase tracking-widest text-amber-400">{a.k}</div>
                                  <div className="mt-2 text-white font-semibold">{a.title}</div>
                                  <div className="mt-2 text-white/60 text-sm">{a.desc}</div>
                                  <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                                    Open <ArrowRight size={12} />
                                  </div>
                                </ClickableCard>
                              ))}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            );
          })()}

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              label="Open tasks"
              value={openTasks.length}
              hint="Next actions in motion"
              series={series.tasks14}
              tone="amber"
              onClick={() => navigate('/portal/tasks')}
            />
            <KpiCard
              label="Open cases"
              value={openCases.length}
              hint="Disputes currently active"
              series={series.cases14}
              tone="emerald"
              onClick={() => navigate('/portal/disputes')}
            />
            <KpiCard
              label="Vault files"
              value={evidence.length}
              hint="Evidence & uploads"
              series={series.evidence14}
              tone="sky"
              onClick={() => navigate('/portal/documents')}
            />
            <KpiCard
              label="Reports"
              value={reports.length}
              hint="Parsed & stored reports"
              series={series.reports14}
              tone="violet"
              onClick={() => navigate('/portal/reports')}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <LineChartCard
              title="Score trend"
              subtitle="Estimated score progression"
              labels={['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']}
              series={[{ id: 'score', label: 'Credit score', values: [620, 635, 648, 660, 672, 685] }]}
            />
            <DonutChartCard
              title="Dispute readiness"
              centerValue="72"
              centerLabel="readiness"
              slices={[
                { label: 'Evidence Ready', value: 8 },
                { label: 'Reasons Set', value: 6 },
                { label: 'Missing Evidence', value: 3 },
                { label: 'Pending', value: 2 },
              ]}
            />
          </div>

          {overallScore?.topActions?.length ? (
            <CollapsibleSection
              title="Top improvements"
              subtitle="Fastest ways to raise your score and keep your workflow clean."
              count={`${overallScore.topActions.length}`}
              defaultOpen={false}
              storageKey="portal.dashboard.overallScore.topActions"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overallScore.topActions.slice(0, 6).map((a) => (
                  <ClickableCard
                    key={a.key}
                    onClick={() => (a.path ? navigate(a.path) : navigate('/portal/checklist'))}
                    className="p-5"
                  >
                    <div className="text-[10px] uppercase tracking-widest text-amber-400">
                      {a.severity === 'warn' ? 'Priority' : 'Improvement'}
                    </div>
                    <div className="mt-2 text-white font-semibold">{a.title}</div>
                    <div className="mt-2 text-white/60 text-sm">{a.desc}</div>
                    <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                      Open <ArrowRight size={12} />
                    </div>
                  </ClickableCard>
                ))}
              </div>
            </CollapsibleSection>
          ) : null}

          <CollapsibleSection
            title="Modules"
            subtitle="Shortcuts to the most-used areas (kept collapsible so the dashboard stays compact)."
            count="10 shortcuts"
            defaultOpen={false}
            storageKey="portal.dashboard.modules"
            actions={
              <Button variant="outline" size="sm" onClick={() => setShowAllModules((v) => !v)}>
                {showAllModules ? 'Show less' : 'Show all'} <ArrowRight size={14} />
              </Button>
            }
          >
            <div className="grid md:grid-cols-4 gap-4">
              {[
                {
                  key: 'reports',
                  onClick: () => navigate('/portal/reports'),
                  icon: <FileText size={18} />,
                  title: 'Credit reports',
                  desc: 'Upload HTML/PDF reports and view extracted tradelines.',
                  stat: `${reports.length} report${reports.length === 1 ? '' : 's'}`,
                },
                {
                  key: 'documents',
                  onClick: () => navigate('/portal/documents'),
                  icon: <FolderOpen size={18} />,
                  title: 'Documents vault',
                  desc: 'Upload letters, responses, IDs, and supporting proof.',
                  stat: `${evidence.length} file${evidence.length === 1 ? '' : 's'}`,
                },
                {
                  key: 'disputes',
                  onClick: () => navigate('/portal/disputes'),
                  icon: <Gavel size={18} />,
                  title: 'Dispute center',
                  desc: 'Track cases by bureau and follow-up windows.',
                  stat: `${openCases.length} open case${openCases.length === 1 ? '' : 's'}`,
                },
                {
                  key: 'tasks',
                  onClick: () => navigate('/portal/tasks'),
                  icon: <ListChecks size={18} />,
                  title: 'Tasks',
                  desc: 'Mail letters, track deadlines, and complete follow-ups.',
                  stat: `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'}`,
                },
                {
                  key: 'calendar',
                  onClick: () => navigate('/portal/calendar'),
                  icon: <Calendar size={18} />,
                  title: 'Enlightenment Sessions',
                  desc: 'Request a session, view scheduled meetings, export to iCal.',
                  stat: 'Calendar',
                },
                {
                  key: 'projects',
                  onClick: () => navigate('/portal/projects'),
                  icon: <FolderKanban size={18} />,
                  title: 'Projects',
                  desc: 'DFY workflow board with stages, dependencies, deadlines.',
                  stat: 'Board',
                },
                {
                  key: 'debt',
                  onClick: () => navigate('/portal/debt'),
                  icon: <Scale size={18} />,
                  title: 'Debt & Summons',
                  desc: 'Track collection accounts and summons; upload related docs.',
                  stat: `${openDebt.length} open · ${debtCases.length} total`,
                },
                {
                  key: 'build',
                  onClick: () => navigate('/portal/build'),
                  icon: <TrendingUp size={18} />,
                  title: 'Credit Building',
                  desc: 'Utilization, AU options, and roadmap to fundability prep.',
                  stat: 'Center',
                },
                {
                  key: 'identity',
                  onClick: () => navigate('/portal/identity-theft'),
                  icon: <ShieldAlert size={18} />,
                  title: 'Identity Theft',
                  desc: 'FTC report, fraud alerts, freezes, and recovery steps.',
                  stat: 'Center',
                },
                {
                  key: 'escalations',
                  onClick: () => navigate('/portal/escalations'),
                  icon: <MessageCircle size={18} />,
                  title: 'Escalations',
                  desc: 'Submit complaints and formal escalations; track resolution.',
                  stat: 'Support',
                },
              ]
                .slice(0, showAllModules ? 999 : MODULES_LIMIT)
                .map((c) => (
                  <ClickableCard key={c.key} onClick={c.onClick} className="p-6">
                    <div className="flex items-center gap-3 text-amber-400">
                      {c.icon}
                      <span className="text-[10px] font-black uppercase tracking-widest">{c.title}</span>
                    </div>
                    <p className="mt-3 text-white/70 text-sm">{c.desc}</p>
                    <div className="mt-4 text-white/50 text-[10px] uppercase tracking-widest font-mono">{c.stat}</div>
                  </ClickableCard>
                ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Next steps & status"
            subtitle="Keep momentum without scrolling 20 pages."
            defaultOpen
            storageKey="portal.dashboard.nextSteps"
          >
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Next steps</p>
                  {openTasks.length > NEXT_STEPS_LIMIT ? (
                    <button
                      type="button"
                      onClick={() => setShowAllNextSteps((v) => !v)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      title={showAllNextSteps ? 'Show fewer tasks' : 'Show all open tasks'}
                    >
                      {showAllNextSteps ? 'Show less' : `Show all (${openTasks.length})`} <ArrowRight size={14} />
                    </button>
                  ) : null}
                </div>

                {openTasks.length === 0 ? (
                  <div className="text-white/60 text-sm">
                    No open tasks right now. Upload a report and capture evidence to move the case forward.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {(showAllNextSteps ? openTasks : openTasks.slice(0, NEXT_STEPS_LIMIT)).map((t) => (
                      <div key={t.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{t.title}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                              {t.kind} • {t.status}
                              {t.dueAt ? ` • due ${new Date(t.dueAt).toLocaleDateString()}` : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => navigate('/portal/tasks')}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          >
                            Open <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Status snapshot</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Partner status</div>
                    <div className="mt-2 text-white font-semibold">{partner.status}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Primary route</div>
                    <div className="mt-2 text-white font-semibold">{partner.primaryRoute ?? '—'}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Lane</div>
                    <div className="mt-2 text-white font-semibold">{partner.lane ?? '—'}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Stage</div>
                    <div className="mt-2 text-white font-semibold">{partner.journeyStage ?? 'intake'}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-white/70 text-sm flex items-start gap-3">
                  <ShieldAlert size={16} className="text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-white/80 font-semibold">Pro tip</p>
                    <p className="mt-1">
                      If you receive bureau mail responses, upload them to your Documents Vault immediately — it keeps your rounds and follow-ups on schedule.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Onboarding checklist"
            subtitle="Execution-ready: reports uploaded, evidence captured, tasks completed."
            defaultOpen={false}
            storageKey="portal.dashboard.onboarding"
            actions={
              <Button variant="primary" size="sm" onClick={() => navigate('/portal/checklist')}>
                Open checklist <ArrowRight size={14} />
              </Button>
            }
          >
            <p className="text-white/60 text-sm">
              Use the checklist to ensure the account is execution-ready (reports uploaded, evidence captured, tasks completed).
            </p>
          </CollapsibleSection>
        </div>
      )}
    </PageShell>
  );
}

