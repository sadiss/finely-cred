import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, ArrowLeft, ArrowRight, FileText, FolderOpen, Gavel, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listCasesByPartner } from '../../data/casesRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { KpiCard } from '../../components/ui/KpiCards';
import { computePartnerOverallScore } from '../../utils/partnerOverallScore';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { PartnerCreditRestoreCommandStrip } from '../../components/partner/PartnerCreditRestoreCommandStrip';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type ChecklistItem = {
  key: string;
  title: string;
  description: string;
  done: boolean;
  ctaLabel: string;
  ctaPath: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  restoreStep: 1 | 2 | 3 | 4 | 5;
  accent: 'violet' | 'emerald' | 'amber' | 'fuchsia' | 'sky';
};

export default function PartnerChecklistPage() {
  const navigate = useNavigate();
  type ChecklistTab = 'checklist' | 'score' | 'improvements';
  const [tab, setTab] = useState<ChecklistTab>('checklist');

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
      restoreStep: 1,
      accent: 'violet',
    },
    {
      key: 'report_reviewed',
      title: 'Review report analysis & negatives',
      description: 'Open Credit Intel to confirm tradelines, scores, and items worth disputing before you mail.',
      done: reports.some((r) => Boolean(r.parsed)),
      ctaLabel: 'Open reports',
      ctaPath: '/portal/reports',
      icon: FileText,
      restoreStep: 2,
      accent: 'sky',
    },
    {
      key: 'evidence_uploaded',
      title: 'Upload supporting documents (Evidence Vault)',
      description: 'IDs, proof of address, bureau responses, creditor correspondence, payment history screenshots, etc.',
      done: evidence.length > 0,
      ctaLabel: 'Open documents',
      ctaPath: '/portal/documents',
      icon: FolderOpen,
      restoreStep: 3,
      accent: 'emerald',
    },
    {
      key: 'case_created',
      title: 'Have an active dispute case created',
      description: 'Cases are tracked per bureau and round once a dispute letter is generated with evidence + reasons.',
      done: openCases.length > 0,
      ctaLabel: 'View dispute center',
      ctaPath: '/portal/disputes',
      icon: Gavel,
      restoreStep: 4,
      accent: 'fuchsia',
    },
    {
      key: 'letter_generated',
      title: 'Generate and mail letters on time',
      description: 'If Admin generates letters for you, you’ll still see tasks for mailing and follow-up deadlines.',
      done: letters.length > 0,
      ctaLabel: 'View tasks',
      ctaPath: '/portal/projects',
      icon: ListChecks,
      restoreStep: 4,
      accent: 'amber',
    },
    {
      key: 'tasks_progress',
      title: 'Complete tasks as they appear',
      description: 'Mail letter tasks should be done quickly; follow-up tasks align with your reinvestigation window.',
      done: openTasks.length === 0 && completedTasks.length > 0,
      ctaLabel: 'Open tasks',
      ctaPath: '/portal/projects',
      icon: ListChecks,
      restoreStep: 5,
      accent: 'sky',
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

  const checklistKpis = useMemo(
    () => [
      { label: 'Readiness', value: `${pct}%`, hint: 'Checklist complete', accent: 'amber' as const },
      { label: 'Steps done', value: `${doneCount}/${items.length}`, hint: 'Milestones', accent: 'emerald' as const },
      { label: 'Overall score', value: overallScore ? String(overallScore.overall) : '—', hint: 'Profile + execution', accent: 'violet' as const },
      { label: 'Open tasks', value: String(openTasks.length), hint: 'Still in motion', accent: 'sky' as const },
    ],
    [pct, doneCount, items.length, overallScore, openTasks.length],
  );

  return (
    <PageShell
      badge="Partner Portal"
      title="Onboarding Checklist"
      subtitle="A clean, results-driven sequence. Finish these steps to keep disputes, deadlines, and funding readiness on track."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
            No partner profile found for this account. If you’re an admin, use Partner Management to pick a partner.
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <div className={FINELY_OS_PAGE}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Partner Dashboard">
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Finely Cred Dashboard">
              <ArrowLeft size={16} /> Finely Cred
            </button>
          </div>

          <PartnerCreditRestoreCommandStrip
            partner={partner}
            reportsCount={reports.length}
            evidenceCount={evidence.length}
            lettersCount={letters.length}
            openCasesCount={openCases.length}
            negativesCount={openCases.length}
          />

          <FinelyUnifiedHubLayout
            eyebrow="Onboarding checklist"
            title="Execution-ready sequence"
            subtitle="Checklist milestones, score breakdown, and top improvements — one tab at a time."
            accent="amber"
            kpis={checklistKpis}
            tabs={[
              { id: 'checklist', label: 'Checklist', badge: `${doneCount}/${items.length}` },
              { id: 'score', label: 'Score' },
              { id: 'improvements', label: 'Improvements', badge: overallScore?.topActions.length || undefined },
            ]}
            activeTab={tab}
            onTabChange={(id) => setTab(id as ChecklistTab)}
            primaryAction={{ label: 'Partner dashboard', onClick: () => navigate('/portal/dashboard') }}
            secondaryAction={{ label: 'Fundability hub', onClick: () => navigate('/fundability-readiness') }}
          >
            {tab === 'checklist' && (
              <div className="space-y-6">
                <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className={FINELY_OS_ENTITY_LABEL}>Progress</p>
                      <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                        Completed: <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{doneCount}</span> / {items.length}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Readiness</div>
                      <div className={`mt-1 text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{pct}%</div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 border border-white/[0.08] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <FinelyOsPaginatedStack
                  items={items}
                  pageSize={6}
                  itemSpacingClassName="space-y-3"
                  renderItem={(i) => {
                    const Icon = i.icon;
                    const StatusIcon = i.done ? CheckCircle2 : Circle;
                    return (
                      <div key={i.key} className={`${finelyOsCatalogCard(i.accent)} !p-6 ${i.done ? 'ring-1 ring-emerald-500/30' : 'ring-1 ring-amber-500/25'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <StatusIcon size={18} className={i.done ? 'text-emerald-400' : 'text-white/30'} />
                              <div className={FINELY_OS_ENTITY_VALUE}>{i.title}</div>
                            </div>
                            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{i.description}</p>
                            <div className={`mt-3 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                              <Icon size={14} className="text-violet-300" /> Step {i.restoreStep} · {i.done ? 'Complete' : 'Incomplete'}
                              {i.done ? <span className={finelyOsStatusChip('ok')}>Done</span> : null}
                            </div>
                          </div>
                          <button type="button" onClick={() => navigate(i.ctaPath)} className={`shrink-0 ${FINELY_OS_SECONDARY_BTN}`}>
                            {i.ctaLabel} <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            )}

            {tab === 'score' && overallScore ? (
              <div className="space-y-6">
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
                <FinelyUnifiedSection title="Score breakdown" subtitle="Route-aware categories and missing signals.">
                  <div className={`${FINELY_OS_ENTITY_BODY} mb-4`}>
                    This score is route-aware (personal/business) and includes execution signals (reports, evidence, tasks, cases, letters).
                  </div>
                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
                      <div className={FINELY_OS_ENTITY_LABEL}>Categories</div>
                      <FinelyOsPaginatedStack
                        items={overallScore.categories}
                        pageSize={4}
                        itemSpacingClassName="space-y-3"
                        renderItem={(c) => (
                          <div key={c.key} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className={FINELY_OS_ENTITY_VALUE}>{c.label}</div>
                              <div className={FINELY_OS_ENTITY_SUBLABEL}>
                                {c.weightPct}% • {c.score}/100
                              </div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-white/10 border border-white/[0.08] overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${c.score}%` }} />
                            </div>
                            {c.missing.length ? (
                              <div className={`mt-3 ${FINELY_OS_ENTITY_BODY} text-xs`}>Missing: {c.missing.slice(0, 4).join(' • ')}</div>
                            ) : (
                              <div className="mt-3 text-emerald-700 text-xs font-semibold">Complete</div>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </FinelyUnifiedSection>
              </div>
            ) : tab === 'score' ? (
              <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>Complete more checklist steps to unlock your score breakdown.</div>
            ) : null}

            {tab === 'improvements' && overallScore ? (
              <FinelyUnifiedSection title="Top improvements" subtitle="Fastest levers to raise score and move the file.">
                <div className="space-y-3">
                  {overallScore.topActions.length ? (
                    <FinelyOsPaginatedStack
                      items={overallScore.topActions.slice(0, 8)}
                      pageSize={6}
                      itemSpacingClassName="space-y-3"
                      renderItem={(a) => (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => navigate(a.path || '/portal/billing')}
                          className={`${finelyOsInlineListItem()} w-full text-left p-5 transition-all`}
                        >
                          <div className="text-[10px] uppercase tracking-widest text-violet-300">
                            {a.severity === 'warn' ? 'Priority' : 'Improvement'}
                          </div>
                          <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{a.title}</div>
                          <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{a.desc}</div>
                          <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                            Open <ArrowRight size={12} />
                          </div>
                        </button>
                      )}
                    />
                  ) : (
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY}`}>No improvements detected right now.</div>
                  )}
                </div>
              </FinelyUnifiedSection>
            ) : tab === 'improvements' ? (
              <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>Complete onboarding steps to surface improvement suggestions.</div>
            ) : null}
          </FinelyUnifiedHubLayout>

          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
            <p className={FINELY_OS_ENTITY_LABEL}>Shortcut</p>
            <p className={FINELY_OS_ENTITY_BODY}>Return to your Partner Dashboard for next steps and snapshots.</p>
            <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_SUCCESS_BTN}>
              Partner dashboard <ArrowRight size={14} />
            </button>
          </div>

          <FinelyOsPageFooter />
        </div>
      )}
    </PageShell>
  );
}
