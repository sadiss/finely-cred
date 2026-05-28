import React, { useMemo } from 'react';
import { CheckCircle2, Circle, ArrowLeft, ArrowRight, FileText, FolderOpen, Gavel, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listCasesByPartner } from '../../data/casesRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { KpiCard } from '../../components/ui/KpiCards';
import { computePartnerOverallScore } from '../../utils/partnerOverallScore';

type ChecklistItem = {
  key: string;
  title: string;
  description: string;
  done: boolean;
  ctaLabel: string;
  ctaPath: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export default function PartnerChecklistPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const email = auth.user?.email || '';

  const { partner } = usePartnerSession();
  const reports = useMemo(() => (partner ? listReportsByPartner(partner.id) : []), [partner]);
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner]);
  const tasks = useMemo(() => (partner ? listTasksByPartner(partner.id) : []), [partner]);
  const cases = useMemo(() => (partner ? listCasesByPartner(partner.id) : []), [partner]);
  const letters = useMemo(() => (partner ? listLettersByPartner(partner.id) : []), [partner]);

  const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const openCases = cases.filter((c) => c.status === 'open');

  const items: ChecklistItem[] = [
    {
      key: 'report_uploaded',
      title: 'Upload at least one credit report',
      description: 'HTML is best for structured extraction. PDF is accepted (text extraction depends on the export).',
      done: reports.length > 0,
      ctaLabel: 'Upload report',
      ctaPath: '/portal/reports',
      icon: FileText,
    },
    {
      key: 'evidence_uploaded',
      title: 'Upload supporting documents (Evidence Vault)',
      description: 'IDs, proof of address, bureau responses, creditor correspondence, payment history screenshots, etc.',
      done: evidence.length > 0,
      ctaLabel: 'Open documents',
      ctaPath: '/portal/documents',
      icon: FolderOpen,
    },
    {
      key: 'case_created',
      title: 'Have an active dispute case created',
      description: 'Cases are tracked per bureau and round once a dispute letter is generated with evidence + reasons.',
      done: openCases.length > 0,
      ctaLabel: 'View dispute center',
      ctaPath: '/portal/disputes',
      icon: Gavel,
    },
    {
      key: 'letter_generated',
      title: 'Generate and mail letters on time',
      description: 'If Admin generates letters for you, you’ll still see tasks for mailing and follow-up deadlines.',
      done: letters.length > 0,
      ctaLabel: 'View tasks',
      ctaPath: '/portal/tasks',
      icon: ListChecks,
    },
    {
      key: 'tasks_progress',
      title: 'Complete tasks as they appear',
      description: 'Mail letter tasks should be done quickly; follow-up tasks align with your reinvestigation window.',
      done: openTasks.length === 0 && completedTasks.length > 0,
      ctaLabel: 'Open tasks',
      ctaPath: '/portal/tasks',
      icon: ListChecks,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);

  const overallScore = useMemo(() => {
    if (!partner) return null;
    return computePartnerOverallScore({
      partner,
      counts: {
        reports: reports.length,
        evidence: evidence.length,
        tasksOpen: openTasks.length,
        tasksDone: completedTasks.length,
        casesOpen: openCases.length,
        lettersGenerated: letters.length,
      },
    });
  }, [partner?.id, reports.length, evidence.length, openTasks.length, completedTasks.length, openCases.length, letters.length]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Onboarding Checklist"
      subtitle="A clean, results-driven sequence. Finish these steps to keep disputes, deadlines, and funding readiness on track."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
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
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              title="Back to Partner Dashboard"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              title="Back to Finely Cred Dashboard"
            >
              <ArrowLeft size={16} /> Finely Cred
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Progress</p>
                <p className="mt-2 text-white/70 text-sm">
                  Completed: <span className="text-white/90 font-mono">{doneCount}</span> / {items.length}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Readiness</div>
                <div className="mt-1 text-2xl font-semibold text-white">{pct}%</div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-black/40 border border-white/10 overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {overallScore ? (
            <div className="grid md:grid-cols-3 gap-4">
              <KpiCard
                label="Overall score"
                value={overallScore.overall}
                hint="Profile + execution readiness"
                tone={overallScore.overall >= 80 ? 'emerald' : overallScore.overall >= 60 ? 'amber' : 'violet'}
              />
              <KpiCard label="Checklist readiness" value={`${pct}%`} hint="This page’s milestones" tone="amber" />
              <KpiCard label="Top improvements" value={overallScore.topActions.length} hint="Fastest wins" tone="sky" />
            </div>
          ) : null}

          {overallScore ? (
            <details className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
              <summary className="cursor-pointer select-none text-white font-semibold">Score breakdown</summary>
              <div className="mt-3 text-white/60 text-sm">
                This score is route-aware (personal/business) and includes execution signals (reports, evidence, tasks, cases, letters).
              </div>
              <div className="mt-5 grid lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Categories</div>
                  <div className="mt-4 space-y-3">
                    {overallScore.categories.map((c) => (
                      <div key={c.key} className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-white/80 font-semibold">{c.label}</div>
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            {c.weightPct}% • {c.score}/100
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${c.score}%` }} />
                        </div>
                        {c.missing.length ? (
                          <div className="mt-3 text-white/55 text-xs">Missing: {c.missing.slice(0, 4).join(' • ')}</div>
                        ) : (
                          <div className="mt-3 text-emerald-200/80 text-xs">Complete</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Top improvements</div>
                  <div className="mt-4 space-y-3">
                    {overallScore.topActions.length ? (
                      overallScore.topActions.slice(0, 6).map((a) => (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => navigate(a.path || '/portal/billing')}
                          className="w-full text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-white/[0.03] p-5 transition-all"
                        >
                          <div className="text-[10px] uppercase tracking-widest text-amber-400">
                            {a.severity === 'warn' ? 'Priority' : 'Improvement'}
                          </div>
                          <div className="mt-2 text-white font-semibold">{a.title}</div>
                          <div className="mt-2 text-white/60 text-sm">{a.desc}</div>
                          <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                            Open <ArrowRight size={12} />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60 text-sm">
                        No improvements detected right now.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </details>
          ) : null}

          <div className="space-y-3">
            {items.map((i) => {
              const Icon = i.icon;
              const StatusIcon = i.done ? CheckCircle2 : Circle;
              return (
                <div key={i.key} className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <StatusIcon size={18} className={i.done ? 'text-emerald-400' : 'text-white/30'} />
                        <div className="text-white font-semibold">{i.title}</div>
                      </div>
                      <p className="mt-2 text-white/60 text-sm">{i.description}</p>
                      <div className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40">
                        <Icon size={14} className="text-amber-400" /> {i.done ? 'Complete' : 'Pending'}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(i.ctaPath)}
                      className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    >
                      {i.ctaLabel} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
            <p className="text-[10px] uppercase tracking-widest text-white/40">Shortcut</p>
            <p className="mt-2 text-white/60 text-sm">Return to your Partner Dashboard for next steps and snapshots.</p>
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Partner dashboard <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

