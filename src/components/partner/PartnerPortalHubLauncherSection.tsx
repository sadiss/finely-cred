import React, { useMemo } from 'react';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  FileText,
  Files,
  FolderKanban,
  FolderOpen,
  Gavel,
  ListChecks,
  MessageCircle,
  Scale,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { getUserProfileMeta } from '../../auth/userProfile';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listProjectsByPartner } from '../../data/projectsRepo';
import { listPartnerPortalTasks } from '../../lib/workVisibility';
import { listCasesByPartner } from '../../data/casesRepo';
import { listDebtByPartner } from '../../data/debtRepo';
import { listPartnerNotesByPartner } from '../../data/partnerNotesRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import type { Partner } from '../../domain/partners';
import { KpiCard } from '../ui/KpiCards';
import { JourneyRoadmap } from '../journey/JourneyRoadmap';
import { RoleWorkflowPanel } from '../workflow/RoleWorkflowPanel';
import { computeRoleWorkflowProgress } from '../../lib/roleWorkflowProgress';
import { DenefitsEnrollmentPanel } from '../denefits/DenefitsEnrollmentPanel';
import { Button, CollapsibleSection } from '../ui';
import { computePartnerOverallScore } from '../../utils/partnerOverallScore';
import { LineChartCard, DonutChartCard } from '../charts';
import { ProofDocumentsHub } from '../evidence/ProofDocumentsHub';
import { PartnerFundingCommandStrip } from './PartnerFundingCommandStrip';
import { FinelyBridgeConnectorPanel } from '../bridge/FinelyBridgeConnectorPanel';
import { PartnerOnboardingProgress } from '../onboarding/PartnerOnboardingProgress';
import { PartnerOnboardingRelationshipCard } from '../onboarding/PartnerOnboardingRelationshipCard';
import { PartnerCreditLanesPanel } from './PartnerCreditLanesPanel';
import { PartnerSuccessExperiencePanel } from './PartnerSuccessExperiencePanel';
import { PartnerLaneSpecialistStrip } from './PartnerLaneSpecialistStrip';
import { PartnerSocialProofStrip } from './PartnerSocialProofStrip';
import { computeCourtPlanDashboardAlert } from '../../lib/courtPlanDashboardAlert';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { submitPartnerFundingHandoff } from '../../lib/noraFundingHandoff';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyNoticedStrip } from '../tours/FinelyNoticedStrip';
import { PartnerActivityTimeline, partnerNoteToTimelineItem } from './PartnerActivityTimeline';
import { PartnerHubLauncherGrid } from './PartnerHubLauncherTile';
import { PartnerHubWorkModal } from './PartnerHubWorkModal';
import { usePartnerHubLauncher } from './usePartnerHubLauncher';
import {
  PARTNER_HUB_ACTION_TINT,
  PARTNER_HUB_LAUNCHER_ACCENTS,
} from './partnerHubLauncherUi';
import { buildPortalNoticedItems } from '../../lib/finelyProactiveSignals';
import { evidenceDestination } from '../../lib/evidenceVaultGrouping';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsGlassShell,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partner: Partner;
  refresh: () => void;
};

export function PartnerPortalHubLauncherSection({ partner, refresh }: Props) {
  const auth = useAuth();
  const navigate = useNavigate();
  const hubLauncher = usePartnerHubLauncher();
  const meta = getUserProfileMeta(auth.user);
  const userRole = (meta.role || partner.lane || 'client').trim();

  const reports = useMemo(() => listReportsByPartner(partner.id), [partner.id]);
  const evidence = useMemo(() => listEvidenceByPartner(partner.id), [partner.id]);
  const tasks = useMemo(
    () => listPartnerPortalTasks(listTasksByPartner(partner.id)),
    [partner.id],
  );
  const projects = useMemo(() => listProjectsByPartner(partner.id), [partner.id]);
  const cases = useMemo(() => listCasesByPartner(partner.id), [partner.id]);
  const debtCases = useMemo(() => listDebtByPartner(partner.id), [partner.id]);
  const letters = useMemo(() => listLettersByPartner(partner.id), [partner.id]);
  const partnerNotes = useMemo(() => listPartnerNotesByPartner(partner.id), [partner.id]);
  const visibleNotes = useMemo(
    () =>
      partnerNotes
        .filter((n) => n.visibility === 'partner')
        .slice()
        .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.createdAt.localeCompare(a.createdAt)),
    [partnerNotes],
  );

  const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'completed');
  const portalActivityItems = useMemo(() => {
    const mailed = letters
      .filter((l) => l.status === 'mailed' || l.mailing?.providerId)
      .slice(0, 6)
      .map((l) => ({
        id: `letter-${l.id}`,
        createdAt: l.mailing?.createdAt || l.createdAt,
        title: 'Letter mailed',
        body: l.title,
        kind: 'system' as const,
      }));
    const completed = doneTasks.slice(0, 6).map((t) => ({
      id: `task-${t.id}`,
      createdAt: t.completedAt || t.updatedAt || t.createdAt,
      title: 'Task completed',
      body: t.title,
      kind: 'system' as const,
    }));
    const uploads = reports.slice(0, 4).map((r) => ({
      id: `report-${r.id}`,
      createdAt: r.receivedAt,
      title: 'Credit report uploaded',
      body: `${r.provider}${r.reportDate ? ` · ${new Date(r.reportDate).toLocaleDateString()}` : ''}`,
      kind: 'system' as const,
    }));
    return [...visibleNotes.map(partnerNoteToTimelineItem), ...mailed, ...completed, ...uploads]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 16);
  }, [visibleNotes, letters, doneTasks, reports]);

  const openCases = cases.filter((c) => c.status === 'open');
  const openDebt = debtCases.filter((d) => d.status === 'open' || d.status === 'in_review');
  const evidenceVaultCount = evidence.filter((item) => evidenceDestination(item) === 'evidence').length;
  const documentsCount = evidence.filter((item) => evidenceDestination(item) === 'documents').length;

  const courtPlanAlert = useMemo(
    () => computeCourtPlanDashboardAlert(partner.id),
    [partner.id, debtCases],
  );

  const clientWorkflowProgress = useMemo(
    () =>
      computeRoleWorkflowProgress('client', {
        partner,
        reportsCount: reports.length,
        evidenceCount: evidence.length,
        lettersCount: letters.length,
        casesCount: cases.length,
        tasksCount: tasks.length,
        projectsCount: projects.length,
      }),
    [partner, reports.length, evidence.length, letters.length, cases.length, tasks.length, projects.length],
  );

  const dashboardModuleCards = useMemo(
    () => [
      {
        key: 'reports',
        onClick: () => navigate('/portal/reports'),
        icon: <FileText size={18} />,
        title: 'Credit reports',
        desc: 'Upload HTML/PDF reports and view extracted tradelines.',
        stat: `${reports.length} report${reports.length === 1 ? '' : 's'}`,
      },
      {
        key: 'evidence',
        onClick: () => navigate('/portal/evidence'),
        icon: <FolderOpen size={18} />,
        title: 'Evidence vault',
        desc: 'Report crops, bureau replies, collector paper, and source proof.',
        stat: `${evidenceVaultCount} exhibit${evidenceVaultCount === 1 ? '' : 's'}`,
      },
      {
        key: 'documents',
        onClick: () => navigate('/portal/documents'),
        icon: <Files size={18} />,
        title: 'Documents vault',
        desc: 'Upload ID, proof of address, statements, and your paperwork.',
        stat: `${documentsCount} file${documentsCount === 1 ? '' : 's'}`,
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
        onClick: () => navigate('/portal/projects'),
        icon: <ListChecks size={18} />,
        title: 'Tasks',
        desc: 'Mail letters, track deadlines, and complete follow-ups.',
        stat: `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'}`,
      },
      {
        key: 'calendar',
        onClick: () => navigate('/portal/calendar'),
        icon: <Calendar size={18} />,
        title: 'Strategy calls',
        desc: 'Book a call, view scheduled meetings, and export to your calendar.',
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
    ],
    [navigate, reports.length, evidenceVaultCount, documentsCount, openCases.length, openTasks.length, openDebt.length, debtCases.length],
  );

  const overallScore = useMemo(
    () =>
      computePartnerOverallScore({
        partner,
        counts: {
          reports: reports.length,
          evidence: evidence.length,
          tasksOpen: openTasks.length,
          tasksDone: doneTasks.length,
          casesOpen: openCases.length + openDebt.length,
          lettersGenerated: letters.length,
        },
      }),
    [
      partner,
      reports.length,
      evidence.length,
      openTasks.length,
      doneTasks.length,
      openCases.length,
      openDebt.length,
      letters.length,
    ],
  );

  const disputeModuleCards = useMemo(
    () => dashboardModuleCards.filter((c) => ['disputes', 'identity', 'escalations', 'tasks', 'calendar', 'projects'].includes(c.key)),
    [dashboardModuleCards],
  );

  const debtModuleCards = useMemo(
    () => dashboardModuleCards.filter((c) => ['debt', 'build'].includes(c.key)),
    [dashboardModuleCards],
  );

  const documentModuleCards = useMemo(
    () => dashboardModuleCards.filter((c) => ['reports', 'evidence', 'documents'].includes(c.key)),
    [dashboardModuleCards],
  );

  const journeyActions = useMemo(() => {
    const stage = partner.journeyStage ?? 'intake';
    const lane = partner.lane ?? 'other';
    const actions: Array<{ k: 'Now' | 'Next' | 'Later'; title: string; desc: string; path: string }> = [];
    if (stage === 'intake' || stage === 'report_upload') {
      actions.push({ k: 'Now', title: 'Upload your credit report', desc: 'Use HTML export when possible for full parsing.', path: '/portal/reports' });
      actions.push({ k: 'Next', title: 'Review Credit Intelligence', desc: 'Confirm negatives + screenshot key items for evidence.', path: '/portal/reports' });
      actions.push({ k: 'Later', title: 'Set up Template Library', desc: 'Upload templates, save reasons, preview starter bases.', path: '/portal/templates' });
    } else if (stage === 'evidence') {
      actions.push({ k: 'Now', title: 'Capture evidence screenshots', desc: 'Save clean screenshots to your Evidence Vault.', path: '/portal/reports' });
      actions.push({ k: 'Next', title: 'Save dispute reasons', desc: 'Browse built-in reasons or save your own packs.', path: '/portal/templates?section=reasons' });
      actions.push({ k: 'Later', title: 'Draft in Letter Studio', desc: 'Select disputes, attach evidence, generate PDFs.', path: '/portal/letters' });
    } else if (stage === 'letters') {
      actions.push({ k: 'Now', title: 'Build/edit your draft', desc: 'Use paper preview, then generate + save.', path: '/portal/letters' });
      actions.push({ k: 'Next', title: 'Track tasks + deadlines', desc: 'Mail dates and follow-ups live in Tasks.', path: '/portal/projects' });
      actions.push({ k: 'Later', title: 'Projects board', desc: 'See your workflow stages in Kanban.', path: '/portal/projects' });
    } else {
      actions.push({ k: 'Now', title: 'Open Tasks', desc: 'Stay current on follow-ups and deadlines.', path: '/portal/projects' });
      actions.push({ k: 'Next', title: 'Open Letters Vault', desc: 'Download or re-open saved PDFs.', path: '/portal/letters/vault' });
      actions.push({ k: 'Later', title: 'Book a free strategy call', desc: 'Schedule and export calendar invites.', path: '/portal/calendar' });
    }
    if (lane === 'business_credit') {
      actions.unshift({ k: 'Now', title: 'Open Business Portal', desc: 'Vendor sequencing + lender logic for EIN builds.', path: '/business/dashboard' });
      actions.pop();
    }
    return actions;
  }, [partner.journeyStage, partner.lane]);

  const hubLauncherTiles = useMemo(
    () => [
      {
        id: 'restore' as const,
        label: 'Credit restore',
        description: 'Score, journey map, onboarding, funding readiness, and mission control.',
        stat: overallScore ? `Score ${overallScore.overall}` : `${reports.length} report${reports.length === 1 ? '' : 's'}`,
        icon: TrendingUp,
        accent: 'emerald' as const,
      },
      {
        id: 'disputes' as const,
        label: 'Disputes',
        description: 'Cases, letters, escalations, identity theft, and follow-up tasks.',
        stat: `${openCases.length} open case${openCases.length === 1 ? '' : 's'}`,
        icon: Gavel,
        accent: 'violet' as const,
      },
      {
        id: 'debt' as const,
        label: 'Debt & summons',
        description: 'Collection accounts, court outcomes, validation, and credit building.',
        stat: `${openDebt.length} open · ${debtCases.length} total`,
        icon: Scale,
        accent: 'rose' as const,
      },
      {
        id: 'business' as const,
        label: 'Business credit',
        description: 'EIN profile, vendor sequencing, and business portal shortcuts.',
        stat: partner.lane === 'business_credit' ? 'EIN lane active' : 'Explore business build',
        icon: Briefcase,
        accent: 'sky' as const,
      },
      {
        id: 'documents' as const,
        label: 'Documents',
        description: 'Vault uploads, credit reports, and proof for disputes.',
        stat: `${evidence.length} vault file${evidence.length === 1 ? '' : 's'}`,
        icon: FolderOpen,
        accent: 'emerald' as const,
      },
      {
        id: 'activity' as const,
        label: 'Activity',
        description: 'Timeline, charts, next steps, and workflow checklist.',
        stat: `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'}`,
        icon: ListChecks,
        accent: 'violet' as const,
        badge: portalActivityItems.length ? `${portalActivityItems.length} recent` : undefined,
      },
    ],
    [
      overallScore,
      reports.length,
      openCases.length,
      openDebt.length,
      debtCases.length,
      partner.lane,
      evidence.length,
      openTasks.length,
      portalActivityItems.length,
    ],
  );

  return (
    <>
      <PartnerHubLauncherGrid tiles={hubLauncherTiles} onOpen={hubLauncher.open} />

      <PartnerHubWorkModal
        open={hubLauncher.isOpen('restore')}
        onClose={hubLauncher.close}
        title="Credit restore"
        subtitle="Score, onboarding, journey map, and funding readiness."
        accent="emerald"
      >
        <FinelyNoticedStrip
          surface="light"
          items={buildPortalNoticedItems({
            reportsCount: reports.length,
            lettersCount: letters.length,
            openCasesCount: openCases.length,
            evidenceCount: evidence.length,
            overallScore: overallScore?.overall ?? null,
          })}
        />
        <p className={`${FINELY_OS_ENTITY_BODY} rounded-xl border border-violet-200/70 bg-violet-50/80 px-4 py-3`}>
          Funding readiness and lender alignment live on your dashboard overview. Open it there to avoid duplicate panels.
          <button
            type="button"
            onClick={() => navigate('/portal/wealth-paths')}
            className={`${FINELY_OS_SECONDARY_BTN} mt-3`}
          >
            Open funding readiness <ArrowRight size={14} />
          </button>
        </p>
        <PartnerOnboardingRelationshipCard partner={partner} />
        <PartnerOnboardingProgress partner={partner} />
        <PartnerSuccessExperiencePanel partnerId={partner.id} lane="all" compact />
        <PartnerLaneSpecialistStrip partnerId={partner.id} />
        <PartnerSocialProofStrip staffId="scout_supreme" compact />
        <PartnerCreditLanesPanel partnerId={partner.id} lane={partner.lane} />
        {overallScore ? (
          <div className="grid lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 min-w-0">
              <KpiCard
                label="Overall score"
                value={overallScore.overall}
                hint="Profile + execution readiness"
                tone={overallScore.overall >= 80 ? 'emerald' : overallScore.overall >= 60 ? 'sky' : 'violet'}
                onClick={() => navigate('/portal/checklist')}
              />
            </div>
            <div className={`lg:col-span-8 min-w-0 ${finelyOsGlassShell('inner', 'violet')}`} data-fc-accent="violet">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={FINELY_OS_ENTITY_LABEL}>Mission control</div>
                  <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>Top improvements + quick actions</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>These are the fastest levers to raise score and move the file.</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => navigate('/portal/projects')} className={FINELY_OS_SECONDARY_BTN}>
                    Tasks <ArrowRight size={14} />
                  </button>
                  <button type="button" onClick={() => navigate('/portal/checklist')} className={FINELY_OS_SUCCESS_BTN}>
                    Checklist <ArrowRight size={14} />
                  </button>
                </div>
              </div>
              {overallScore.topActions?.length ? (
                <div className="mt-4 grid md:grid-cols-3 gap-3">
                  {overallScore.topActions.slice(0, 3).map((a, idx) => {
                    const tint = PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length];
                    return (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => navigate(a.path || '/portal/checklist')}
                        className={`${PARTNER_HUB_ACTION_TINT[tint]} w-full text-left p-6`}
                        data-fc-accent={tint}
                        title={a.title}
                      >
                        <div className="text-xs uppercase tracking-widest text-violet-700">
                          {a.severity === 'warn' ? 'Priority' : 'Improvement'}
                        </div>
                        <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{a.title}</div>
                        <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{a.desc}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className={`mt-4 ${FINELY_OS_ENTITY_BODY}`}>No improvements detected right now.</div>
              )}
            </div>
          </div>
        ) : null}
        <CollapsibleSection
          variant="light"
          title="Expedition map + Action Console"
          subtitle="Terrain map with landmarks tied to your projects & tasks — plus Now / Next / Later actions."
          count={`lane: ${partner.lane ?? '—'} • stage: ${partner.journeyStage ?? 'intake'}`}
          defaultOpen
          storageKey="portal.dashboard.roadmap"
        >
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="min-w-0">
              <JourneyRoadmap
                stage={partner.journeyStage}
                signals={partner.journeySignals}
                lane={partner.lane}
                defaultView="map"
                partnerId={partner.id}
                tasks={tasks}
                projects={projects}
              />
            </div>
            <div className="space-y-4 min-w-0">
              {(['Now', 'Next', 'Later'] as const).map((k) => {
                const items = journeyActions.filter((a) => a.k === k);
                const journeyAccent = k === 'Now' ? 'emerald' : k === 'Next' ? 'violet' : 'rose';
                return (
                  <details key={k} open={k === 'Now'} className={`${finelyOsCatalogCard(journeyAccent)} fc-surface-harmony`} data-fc-accent={journeyAccent}>
                    <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                      <div className={FINELY_OS_ENTITY_VALUE}>
                        {k}{' '}
                        <span className={`ml-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          {items.length} item{items.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="text-xs font-black uppercase tracking-widest text-violet-700">Open</div>
                    </summary>
                    <div className="mt-4 space-y-3">
                      {items.map((a) => (
                        <button
                          key={`${k}:${a.path}`}
                          type="button"
                          onClick={() => navigate(a.path)}
                          className={`${finelyOsInlineListItem()} w-full text-left p-5`}
                        >
                          <div className="text-xs uppercase tracking-widest text-violet-700">{a.k}</div>
                          <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{a.title}</div>
                          <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{a.desc}</div>
                          <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                            Open <ArrowRight size={12} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </CollapsibleSection>
        <PartnerFundingCommandStrip
          partner={partner}
          reportCount={reports.length}
          letterCount={letters.length}
          onApply={() => {
            void submitPartnerFundingHandoff(partner).then((r) => {
              if (r.ok) {
                refresh();
                const next = r.doThisNext?.length ? `\n\nNext:\n• ${r.doThisNext.join('\n• ')}` : '';
                window.alert(`${r.title}\n\n${r.message}${next}`);
              } else {
                window.alert(`${r.title || 'Funding handoff'}\n\n${r.message || r.error}${r.hint ? `\n\n${r.hint}` : ''}`);
              }
            });
          }}
        />
        <FinelyBridgeConnectorPanel
          partner={partner}
          reportCount={reports.length}
          letterCount={letters.length}
          mode="readiness"
          onPartnerRefresh={() => refresh()}
        />
        {visibleNotes.length > 0 ? (
          <CollapsibleSection
            variant="light"
            title="Staff notes"
            subtitle="Updates from your credit specialist team."
            count={`${visibleNotes.length} note${visibleNotes.length === 1 ? '' : 's'}`}
            defaultOpen
            storageKey="portal.dashboard.staffNotes"
            actions={
              <Button variant="outline" size="sm" onClick={() => navigate('/portal/messages?hub=ai')}>
                Communication Hub <ArrowRight size={14} />
              </Button>
            }
          >
            <PartnerActivityTimeline
              items={visibleNotes.map(partnerNoteToTimelineItem)}
              emptyMessage="No staff notes yet."
              accent="violet"
            />
          </CollapsibleSection>
        ) : null}
      </PartnerHubWorkModal>

      <PartnerHubWorkModal
        open={hubLauncher.isOpen('disputes')}
        onClose={hubLauncher.close}
        title="Disputes"
        subtitle="Cases, letters, escalations, and follow-up tools."
        accent="violet"
      >
        <FinelyOsPaginatedStack
          items={disputeModuleCards}
          pageSize={6}
          itemSpacingClassName="grid md:grid-cols-2 gap-3"
          emptyMessage="No dispute modules available."
          renderItem={(c, idx) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onClick}
              className={`${finelyOsCatalogCard(PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length])} w-full text-left`}
              data-fc-accent={PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length]}
            >
              <div className="flex items-center gap-3 text-violet-700">
                {c.icon}
                <span className="text-xs font-black uppercase tracking-widest">{c.title}</span>
              </div>
              <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>{c.desc}</p>
              <div className={`mt-4 ${FINELY_OS_ENTITY_SUBLABEL}`}>{c.stat}</div>
            </button>
          )}
        />
      </PartnerHubWorkModal>

      <PartnerHubWorkModal
        open={hubLauncher.isOpen('debt')}
        onClose={hubLauncher.close}
        title="Debt & summons"
        subtitle="Collection accounts, court outcomes, and credit building."
        accent="rose"
      >
        {courtPlanAlert.show ? (
          <FinelyOsAlertBanner tone={courtPlanAlert.tone} message={courtPlanAlert.message} />
        ) : null}
        <FinelyOsPaginatedStack
          items={debtModuleCards}
          pageSize={4}
          itemSpacingClassName="grid md:grid-cols-2 gap-3"
          emptyMessage="No debt modules available."
          renderItem={(c, idx) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onClick}
              className={`${finelyOsCatalogCard(PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length])} w-full text-left`}
              data-fc-accent={PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length]}
            >
              <div className="flex items-center gap-3 text-violet-700">
                {c.icon}
                <span className="text-xs font-black uppercase tracking-widest">{c.title}</span>
              </div>
              <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>{c.desc}</p>
              <div className={`mt-4 ${FINELY_OS_ENTITY_SUBLABEL}`}>{c.stat}</div>
            </button>
          )}
        />
      </PartnerHubWorkModal>

      <PartnerHubWorkModal
        open={hubLauncher.isOpen('business')}
        onClose={hubLauncher.close}
        title="Business credit"
        subtitle="EIN profile and business portal shortcuts."
        accent="sky"
      >
        {partner.lane === 'business_credit' ? (
          <CollapsibleSection
            variant="light"
            title={<span className="text-sky-800">Business persona</span>}
            subtitle="Your EIN profile (separate from personal)."
            defaultOpen
            storageKey="portal.dashboard.businessPersona"
            className="!border-sky-500/40 shadow-[0_0_0_1px_rgba(14,165,233,0.14),0_14px_44px_-16px_rgba(14,165,233,0.42)]"
            headerClassName="border-sky-500/15"
            actions={
              <Button variant="primary" size="sm" onClick={() => navigate('/business/profile')}>
                Complete business profile <ArrowRight size={14} />
              </Button>
            }
          >
            <div className={FINELY_OS_ENTITY_BODY}>
              {(partner.routes as { business_build?: { business?: { businessName?: string; entityState?: string; einLast4?: string; naics?: string } } })?.business_build?.business?.businessName ||
                (partner.journeySignals as { businessName?: string; entityState?: string; einLast4?: string; naics?: string })?.businessName ||
                '—'}
              {((partner.routes as { business_build?: { business?: { entityState?: string } } })?.business_build?.business?.entityState ||
                (partner.journeySignals as { entityState?: string })?.entityState) ? (
                <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                  {' '}
                  •{' '}
                  {String(
                    (partner.routes as { business_build?: { business?: { entityState?: string } } })?.business_build?.business?.entityState ||
                      (partner.journeySignals as { entityState?: string })?.entityState,
                  ).toUpperCase()}
                </span>
              ) : null}
            </div>
            <div className={`mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
              <span>
                EIN last4:{' '}
                {String(
                  (partner.routes as { business_build?: { business?: { einLast4?: string } } })?.business_build?.business?.einLast4 ||
                    (partner.journeySignals as { einLast4?: string })?.einLast4 ||
                    '—',
                )}
              </span>
              <span className="opacity-40">|</span>
              <span>
                NAICS:{' '}
                {String(
                  (partner.routes as { business_build?: { business?: { naics?: string } } })?.business_build?.business?.naics ||
                    (partner.journeySignals as { naics?: string })?.naics ||
                    '—',
                )}
              </span>
            </div>
          </CollapsibleSection>
        ) : (
          <div className={FINELY_OS_ENTITY_BODY}>
            Business credit builds run on a separate EIN profile. Open the business portal to start vendor sequencing and lender logic.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate('/business/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
            Open business portal <ArrowRight size={14} />
          </button>
          <button type="button" onClick={() => navigate('/business/profile')} className={FINELY_OS_SECONDARY_BTN}>
            Business profile <ArrowRight size={14} />
          </button>
        </div>
      </PartnerHubWorkModal>

      <PartnerHubWorkModal
        open={hubLauncher.isOpen('documents')}
        onClose={hubLauncher.close}
        title="Documents"
        subtitle="Vault uploads, credit reports, and dispute proof."
        accent="sky"
      >
        <ProofDocumentsHub partner={partner} email={auth.user?.email} onUploaded={() => refresh()} />
        <FinelyOsPaginatedStack
          items={documentModuleCards}
          pageSize={4}
          itemSpacingClassName="grid md:grid-cols-2 gap-3"
          emptyMessage="No document modules available."
          renderItem={(c, idx) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onClick}
              className={`${finelyOsCatalogCard(PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length])} w-full text-left`}
              data-fc-accent={PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length]}
            >
              <div className="flex items-center gap-3 text-violet-700">
                {c.icon}
                <span className="text-xs font-black uppercase tracking-widest">{c.title}</span>
              </div>
              <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>{c.desc}</p>
              <div className={`mt-4 ${FINELY_OS_ENTITY_SUBLABEL}`}>{c.stat}</div>
            </button>
          )}
        />
      </PartnerHubWorkModal>

      <PartnerHubWorkModal
        open={hubLauncher.isOpen('activity')}
        onClose={hubLauncher.close}
        title="Activity & workflow"
        subtitle="Timeline, charts, next steps, and checklist."
        accent="emerald"
      >
        <PartnerActivityTimeline
          items={portalActivityItems}
          emptyMessage="Your timeline will populate as reports upload, letters mail, and tasks complete."
          accent="emerald"
        />
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
        <CollapsibleSection
          variant="light"
          title="Next steps & status"
          subtitle="Keep momentum without scrolling 20 pages."
          defaultOpen
          storageKey="portal.dashboard.nextSteps"
        >
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 min-w-0 space-y-3">
              <p className={FINELY_OS_ENTITY_LABEL}>Next steps</p>
              {openTasks.length === 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>
                  No open tasks right now. Upload a report and capture evidence to move the case forward.
                </div>
              ) : (
                <FinelyOsPaginatedStack
                  items={openTasks}
                  pageSize={6}
                  itemSpacingClassName="grid md:grid-cols-2 gap-3"
                  emptyMessage="No open tasks."
                  renderItem={(t) => (
                    <div key={t.id} className={`${finelyOsCatalogCard('sky')} min-w-0`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{t.title}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                            {t.kind} • {t.status}
                            {t.dueAt ? ` • due ${new Date(t.dueAt).toLocaleDateString()}` : ''}
                          </div>
                        </div>
                        <button type="button" onClick={() => navigate('/portal/projects')} className={FINELY_OS_SECONDARY_BTN}>
                          Open <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
            <div className="lg:col-span-5 min-w-0 space-y-3">
              <p className={FINELY_OS_ENTITY_LABEL}>Status snapshot</p>
              <div className="grid grid-cols-2 gap-3">
                <div className={finelyOsCatalogCard('emerald')}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Partner status</div>
                  <div className={`mt-2 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{partner.status}</div>
                </div>
                <div className={finelyOsCatalogCard('violet')}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Primary route</div>
                  <div className={`mt-2 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{partner.primaryRoute ?? '—'}</div>
                </div>
                <div className={finelyOsCatalogCard('sky')}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Lane</div>
                  <div className={`mt-2 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{partner.lane ?? '—'}</div>
                </div>
                <div className={finelyOsCatalogCard('rose')}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Stage</div>
                  <div className={`mt-2 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{partner.journeyStage ?? 'intake'}</div>
                </div>
              </div>
              <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3`}>
                <ShieldAlert size={16} className="text-sky-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sky-900">Pro tip</p>
                  <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                    If you receive bureau mail responses, upload them to your Documents Vault immediately — it keeps your rounds and follow-ups on schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
        <CollapsibleSection
          variant="light"
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
          <p className={FINELY_OS_ENTITY_BODY}>
            Use the checklist to ensure the account is execution-ready (reports uploaded, evidence captured, tasks completed).
          </p>
        </CollapsibleSection>
        {userRole === 'client' || !['agent', 'affiliate', 'au_seller'].includes(userRole) ? (
          <>
            <RoleWorkflowPanel roleId="client" completedSteps={clientWorkflowProgress} />
            <DenefitsEnrollmentPanel audience="client" compact />
          </>
        ) : null}
      </PartnerHubWorkModal>
    </>
  );
}
