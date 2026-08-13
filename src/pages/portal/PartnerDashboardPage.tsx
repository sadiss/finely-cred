import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  FileText,
  FolderKanban,
  FolderOpen,
  Gavel,
  ListChecks,
  MessageCircle,
  Scale,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listProjectsByPartner } from '../../data/projectsRepo';
import { listPartnerPortalTasks } from '../../lib/workVisibility';
import { listCasesByPartner } from '../../data/casesRepo';
import { listDebtByPartner } from '../../data/debtRepo';
import { listPartnerNotesByPartner } from '../../data/partnerNotesRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ADMIN_PARTNER_OVERRIDE_KEY } from '../../portal/getOrCreatePartnerForSession';
import { isAdminEmail } from '../../auth/admin';
import { supabase } from '../../lib/supabaseClient';
import { KpiCard } from '../../components/ui/KpiCards';
import { upsertPartner, fetchAllPartnersAsAdmin } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import { JourneyRoadmap } from '../../components/journey/JourneyRoadmap';
import { WelcomeBanner } from '../../components/onboarding/WelcomeBanner';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { computeRoleWorkflowProgress } from '../../lib/roleWorkflowProgress';
import { DenefitsEnrollmentPanel } from '../../components/denefits/DenefitsEnrollmentPanel';
import { getUserProfileMeta } from '../../auth/userProfile';
import { Button, CollapsibleSection } from '../../components/ui';
import { computePartnerOverallScore } from '../../utils/partnerOverallScore';
import { LineChartCard, DonutChartCard } from '../../components/charts';
import { ProfileGoalsReadinessPanel } from '../../components/profile/ProfileGoalsReadinessPanel';
import { ProofDocumentsHub } from '../../components/evidence/ProofDocumentsHub';
import { PartnerFundingCommandStrip } from '../../components/partner/PartnerFundingCommandStrip';
import { FinelyBridgeConnectorPanel } from '../../components/bridge/FinelyBridgeConnectorPanel';
import { PartnerOnboardingProgress } from '../../components/onboarding/PartnerOnboardingProgress';
import { PartnerOnboardingRelationshipCard } from '../../components/onboarding/PartnerOnboardingRelationshipCard';
import { PartnerCreditLanesPanel } from '../../components/partner/PartnerCreditLanesPanel';
import { PartnerSuccessExperiencePanel } from '../../components/partner/PartnerSuccessExperiencePanel';
import { PartnerLaneSpecialistStrip } from '../../components/partner/PartnerLaneSpecialistStrip';
import { PartnerSocialProofStrip } from '../../components/partner/PartnerSocialProofStrip';
import { ensurePartnerOnboardingTasks } from '../../lib/partnerOnboardingEngine';
import { openCommunicationHub } from '../../components/chat/communicationHubModel';
import { PartnerCreditRestoreCommandStrip } from '../../components/partner/PartnerCreditRestoreCommandStrip';
import { computeCreditRestorePrimaryAlert } from '../../lib/creditRestorePrimaryAlert';
import { computeCourtPlanDashboardAlert } from '../../lib/courtPlanDashboardAlert';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { submitPartnerFundingHandoff } from '../../lib/noraFundingHandoff';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsDataErrorBanner } from '../../features/os/FinelyOsDataErrorBanner';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { PartnerActivityTimeline, partnerNoteToTimelineItem } from '../../components/partner/PartnerActivityTimeline';
import { PartnerHubLauncherGrid } from '../../components/partner/PartnerHubLauncherTile';
import { PartnerHubWorkModal } from '../../components/partner/PartnerHubWorkModal';
import { usePartnerHubLauncher } from '../../components/partner/usePartnerHubLauncher';
import {
  PARTNER_HUB_ACTION_TINT,
  PARTNER_HUB_LAUNCHER_ACCENTS,
  partnerHubModuleCardClass,
} from '../../components/partner/partnerHubLauncherUi';
import '../../features/partner/partnerPortalVisual.css';
import { buildPortalNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsInlineListItem,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

export default function PartnerDashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hubLauncher = usePartnerHubLauncher();

  const { partner, refresh } = usePartnerSession();
  const meta = getUserProfileMeta(auth.user);
  const userRole = (meta.role || partner?.lane || 'client').trim();

  // Admin partner picker state
  const [isAdmin, setIsAdmin] = useState(() => isAdminEmail(auth.user?.email));
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [partnerPickerLoading, setPartnerPickerLoading] = useState(false);
  const [partnerPickerErr, setPartnerPickerErr] = useState<string | null>(null);
  const [partnerFetchKey, setPartnerFetchKey] = useState(0);

  useEffect(() => {
    const email = auth.user?.email;
    if (!email) { setIsAdmin(false); return; }
    if (isAdminEmail(email)) { setIsAdmin(true); return; }
    supabase
      .from('admin_emails')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()
      .then(({ data }) => { if (data) setIsAdmin(true); });
  }, [auth.user?.email]);

  useEffect(() => {
    if (searchParams.get('chat') !== '1') return;
    openCommunicationHub({ tab: 'ai', expanded: true });
    const next = new URLSearchParams(searchParams);
    next.delete('chat');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!isAdmin || partner) return;
    setPartnerPickerLoading(true);
    setPartnerPickerErr(null);
    fetchAllPartnersAsAdmin().then((list) => {
      setAllPartners(list);
      setPartnerPickerLoading(false);
    }).catch((e: unknown) => {
      setPartnerPickerErr((e as Error)?.message || 'Could not load partner list.');
      setPartnerPickerLoading(false);
    });
  }, [isAdmin, partner, partnerFetchKey]);

  function selectPartner(id: string) {
    localStorage.setItem(ADMIN_PARTNER_OVERRIDE_KEY, id);
    refresh();
  }
  const reports = useMemo(() => (partner ? listReportsByPartner(partner.id) : []), [partner]);
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner]);
  const tasks = useMemo(() => (partner ? listPartnerPortalTasks(listTasksByPartner(partner.id)) : []), [partner]);
  const projects = useMemo(() => (partner ? listProjectsByPartner(partner.id) : []), [partner]);
  const cases = useMemo(() => (partner ? listCasesByPartner(partner.id) : []), [partner]);
  const debtCases = useMemo(() => (partner ? listDebtByPartner(partner.id) : []), [partner]);
  const letters = useMemo(() => (partner ? listLettersByPartner(partner.id) : []), [partner]);
  const partnerNotes = useMemo(() => (partner ? listPartnerNotesByPartner(partner.id) : []), [partner]);
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
      body: `${r.provider}${r.reportDate ? ` Â· ${new Date(r.reportDate).toLocaleDateString()}` : ''}`,
      kind: 'system' as const,
    }));
    return [...visibleNotes.map(partnerNoteToTimelineItem), ...mailed, ...completed, ...uploads]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 16);
  }, [visibleNotes, letters, doneTasks, reports]);
  const openCases = cases.filter((c) => c.status === 'open');
  const openDebt = debtCases.filter((d) => d.status === 'open' || d.status === 'in_review');
  const restoreAlert = useMemo(
    () =>
      computeCreditRestorePrimaryAlert({
        reportsCount: reports.length,
        hasParsedReport: reports.some((r) => Boolean(r.parsed)),
        letters,
        debtCases,
        partnerId: partner?.id,
      }),
    [reports, letters, debtCases, partner?.id],
  );

  const courtPlanAlert = useMemo(
    () => (partner ? computeCourtPlanDashboardAlert(partner.id) : { show: false, tone: 'info' as const, message: '' }),
    [partner, debtCases],
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
        stat: `${openDebt.length} open Â· ${debtCases.length} total`,
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
    [navigate, reports.length, evidence.length, openCases.length, openTasks.length, openDebt.length, debtCases.length],
  );

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

  const disputeModuleCards = useMemo(
    () => dashboardModuleCards.filter((c) => ['disputes', 'identity', 'escalations', 'tasks', 'calendar', 'projects'].includes(c.key)),
    [dashboardModuleCards],
  );

  const debtModuleCards = useMemo(
    () => dashboardModuleCards.filter((c) => ['debt', 'build'].includes(c.key)),
    [dashboardModuleCards],
  );

  const documentModuleCards = useMemo(
    () => dashboardModuleCards.filter((c) => ['documents', 'reports'].includes(c.key)),
    [dashboardModuleCards],
  );

  const journeyActions = useMemo(() => {
    if (!partner) return [] as Array<{ k: 'Now' | 'Next' | 'Later'; title: string; desc: string; path: string }>;
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
  }, [partner?.journeyStage, partner?.lane]);

  const primaryDashboardAlert = useMemo(() => {
    if (restoreAlert.show) return restoreAlert;
    if (courtPlanAlert.show) return courtPlanAlert;
    return null;
  }, [restoreAlert, courtPlanAlert]);

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
        stat: `${openDebt.length} open Â· ${debtCases.length} total`,
        icon: Scale,
        accent: 'fuchsia' as const,
      },
      {
        id: 'business' as const,
        label: 'Business credit',
        description: 'EIN profile, vendor sequencing, and business portal shortcuts.',
        stat: partner?.lane === 'business_credit' ? 'EIN lane active' : 'Explore business build',
        icon: Briefcase,
        accent: 'amber' as const,
      },
      {
        id: 'documents' as const,
        label: 'Documents',
        description: 'Vault uploads, credit reports, and proof for disputes.',
        stat: `${evidence.length} vault file${evidence.length === 1 ? '' : 's'}`,
        icon: FolderOpen,
        accent: 'sky' as const,
      },
      {
        id: 'activity' as const,
        label: 'Activity',
        description: 'Timeline, charts, next steps, and workflow checklist.',
        stat: `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'}`,
        icon: ListChecks,
        accent: 'emerald' as const,
        badge: portalActivityItems.length ? `${portalActivityItems.length} recent` : undefined,
      },
    ],
    [
      overallScore,
      reports.length,
      openCases.length,
      openDebt.length,
      debtCases.length,
      partner?.lane,
      evidence.length,
      openTasks.length,
      portalActivityItems.length,
    ],
  );

  // Journey stage is set by the Finely case team (admin) â€” only refresh signals here.
  useEffect(() => {
    if (!partner) return;
    const signals = {
      ...(partner.journeySignals ?? {}),
      reports: reports.length,
      evidence: evidence.length,
      openTasks: openTasks.length,
      openCases: openCases.length,
    };
    const changed = JSON.stringify(signals) !== JSON.stringify(partner.journeySignals ?? {});
    if (changed) {
      void upsertPartner({ ...partner, journeySignals: signals });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.id, reports.length, evidence.length, openTasks.length, openCases.length]);

  useEffect(() => {
    if (!partner) return;
    try {
      ensurePartnerOnboardingTasks(partner);
    } catch {
      // non-blocking
    }
  }, [partner?.id]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Partner Dashboard"
      subtitle="Your home base: next steps, uploads, and dispute progress â€” organized so you always know what to do next."
    >
      {!partner ? (
        <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
          {isAdmin ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className={FINELY_OS_ENTITY_LABEL}>Admin â€” Select a Partner</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Click a partner below to view their portal dashboard.</div>
                </div>
                <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
                  <ArrowLeft size={14} /> Dashboard
                </button>
              </div>
              {partnerPickerErr ? (
                <FinelyOsDataErrorBanner message={partnerPickerErr} onRetry={() => setPartnerFetchKey((k) => k + 1)} />
              ) : null}
              {partnerPickerLoading ? (
                <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>Loading partnersâ€¦</div>
              ) : allPartners.length === 0 ? (
                <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>No partners found.</div>
              ) : (
                <FinelyOsPaginatedStack
                  items={allPartners}
                  pageSize={9}
                  itemSpacingClassName="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  emptyMessage="No partners found."
                  renderItem={(p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPartner(p.id)}
                      className={`${finelyOsCatalogCard(PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length])} w-full text-left !p-5 space-y-2`}
                      data-fc-accent={PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length]}
                    >
                      <div className={FINELY_OS_ENTITY_VALUE}>{p.profile.fullName || 'Unnamed'}</div>
                      <div className={`${FINELY_OS_ENTITY_BODY} text-xs truncate`}>{p.profile.email || 'â€”'}</div>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>{p.status}</div>
                    </button>
                  )}
                />
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
                No partner profile found for this account. If you're an admin, use Partner Management to pick a partner.
              </div>
              <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
                <ArrowLeft size={14} /> Back to Dashboard
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={`${FINELY_OS_PAGE} fc-senior-simple`} data-fc-partner-portal="1">
          <WelcomeBanner user={auth.user} partner={partner} surface="portal" />
          <PartnerCreditRestoreCommandStrip
            partner={partner}
            reportsCount={reports.length}
            evidenceCount={evidence.length}
            lettersCount={letters.length}
            openCasesCount={openCases.length}
            negativesCount={openCases.length}
          />
          {primaryDashboardAlert ? (
            <div className="space-y-3">
              <FinelyOsAlertBanner tone={primaryDashboardAlert.tone} message={primaryDashboardAlert.message} />
              <div className="flex flex-wrap gap-2">
                {'ctaPath' in primaryDashboardAlert && primaryDashboardAlert.ctaPath ? (
                  <button type="button" onClick={() => navigate(primaryDashboardAlert.ctaPath!)} className={FINELY_OS_PRIMARY_BTN}>
                    {'ctaLabel' in primaryDashboardAlert ? (primaryDashboardAlert.ctaLabel ?? 'Continue') : 'Continue'}{' '}
                    <ArrowRight size={14} />
                  </button>
                ) : null}
                {'secondaryCtaPath' in primaryDashboardAlert && primaryDashboardAlert.secondaryCtaPath ? (
                  <button
                    type="button"
                    onClick={() => navigate(primaryDashboardAlert.secondaryCtaPath!)}
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    {'secondaryCtaLabel' in primaryDashboardAlert
                      ? (primaryDashboardAlert.secondaryCtaLabel ?? 'Bureau letter now (optional)')
                      : 'Bureau letter now (optional)'}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <PartnerHubLauncherGrid tiles={hubLauncherTiles} onOpen={hubLauncher.open} />

          <div
            className={`${PARTNER_HUB_ACTION_TINT.emerald} !p-4 sm:!p-5 flex flex-wrap items-center justify-between gap-4`}
            data-fc-partner-map-teaser="1"
          >
            <div className="min-w-0">
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-200/90`}>Progression map</p>
              <p className={`mt-1 text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Your expedition from intake to fund-ready</p>
              <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>
                Terrain map with landmarks tied to your projects and tasks — open Credit restore to view the full map and action console.
              </p>
            </div>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => hubLauncher.open('restore')}>
              Open progression map <ArrowRight size={14} />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Finely Cred Dashboard">
              <ArrowLeft size={16} /> Dashboard
            </button>
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(ADMIN_PARTNER_OVERRIDE_KEY);
                    refresh();
                  }}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  <ArrowLeft size={12} /> Change partner
                </button>
              ) : null}
              <div className={FINELY_OS_ENTITY_SUBLABEL}>partner_id: {partner.id}</div>
            </div>
          </div>

          <PartnerHubWorkModal
            open={hubLauncher.isOpen('restore')}
            onClose={hubLauncher.close}
            title="Credit restore"
            subtitle="Score, onboarding, journey map, and funding readiness."
            accent="emerald"
          >
            <FinelyNoticedStrip
              surface="dark"
              items={buildPortalNoticedItems({
                reportsCount: reports.length,
                lettersCount: letters.length,
                openCasesCount: openCases.length,
                evidenceCount: evidence.length,
                overallScore: overallScore?.overall ?? null,
              })}
            />
            <ProfileGoalsReadinessPanel partner={partner} overallScore={overallScore} onSaved={() => refresh()} />
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
                    tone={overallScore.overall >= 80 ? 'emerald' : overallScore.overall >= 60 ? 'amber' : 'violet'}
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
                            className={`${PARTNER_HUB_ACTION_TINT[tint]} w-full text-left !p-4`}
                            data-fc-accent={tint}
                            title={a.title}
                          >
                            <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>
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
              variant="dark"
              title="Expedition map + Action Console"
              subtitle="Terrain map with landmarks tied to your projects & tasks â€” plus Now / Next / Later actions."
              count={`lane: ${partner.lane ?? 'â€”'} â€¢ stage: ${partner.journeyStage ?? 'intake'}`}
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
                <div className="space-y-3 min-w-0">
                  {(['Now', 'Next', 'Later'] as const).map((k) => {
                    const items = journeyActions.filter((a) => a.k === k);
                    return (
                      <details key={k} open={k === 'Now'} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                        <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                          <div className={FINELY_OS_ENTITY_VALUE}>
                            {k}{' '}
                            <span className={`ml-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                              {items.length} item{items.length === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className={`text-[10px] font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>Open</div>
                        </summary>
                        <div className="mt-4 space-y-3">
                          {items.map((a) => (
                            <button
                              key={`${k}:${a.path}`}
                              type="button"
                              onClick={() => navigate(a.path)}
                              className={`${finelyOsInlineListItem()} w-full text-left p-5`}
                            >
                              <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>{a.k}</div>
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
                    const next = r.doThisNext?.length ? `\n\nNext:\nâ€¢ ${r.doThisNext.join('\nâ€¢ ')}` : '';
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
                variant="dark"
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
                  className={partnerHubModuleCardClass(PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length])}
                  data-fc-accent={PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length]}
                >
                  <div className={`flex items-center gap-3 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    {c.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{c.title}</span>
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
            accent="fuchsia"
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
                  className={partnerHubModuleCardClass(PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length])}
                  data-fc-accent={PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length]}
                >
                  <div className={`flex items-center gap-3 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    {c.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{c.title}</span>
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
            accent="amber"
          >
            {partner.lane === 'business_credit' ? (
              <CollapsibleSection
                variant="dark"
                title={<span className="text-fuchsia-200">Business persona</span>}
                subtitle="Your EIN profile (separate from personal)."
                defaultOpen
                storageKey="portal.dashboard.businessPersona"
                className="!border-fuchsia-500/40 shadow-[0_0_0_1px_rgba(217,70,239,0.14),0_14px_44px_-16px_rgba(217,70,239,0.42)]"
                headerClassName="border-fuchsia-500/15"
                actions={
                  <Button variant="primary" size="sm" onClick={() => navigate('/business/profile')}>
                    Complete business profile <ArrowRight size={14} />
                  </Button>
                }
              >
                <div className={FINELY_OS_ENTITY_BODY}>
                  {(partner.routes as any)?.business_build?.business?.businessName || (partner.journeySignals as any)?.businessName || 'â€”'}
                  {((partner.routes as any)?.business_build?.business?.entityState || (partner.journeySignals as any)?.entityState) ? (
                    <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                      {' '}
                      â€¢{' '}
                      {String((partner.routes as any)?.business_build?.business?.entityState || (partner.journeySignals as any)?.entityState).toUpperCase()}
                    </span>
                  ) : null}
                </div>
                <div className={`mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                  <span>
                    EIN last4:{' '}
                    {String((partner.routes as any)?.business_build?.business?.einLast4 || (partner.journeySignals as any)?.einLast4 || 'â€”')}
                  </span>
                  <span className="opacity-40">|</span>
                  <span>
                    NAICS: {String((partner.routes as any)?.business_build?.business?.naics || (partner.journeySignals as any)?.naics || 'â€”')}
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
                  className={partnerHubModuleCardClass(PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length])}
                  data-fc-accent={PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length]}
                >
                  <div className={`flex items-center gap-3 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    {c.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{c.title}</span>
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
              variant="dark"
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
                        <div key={t.id} className="rounded-xl border border-black/10 bg-transparent p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{t.title}</div>
                              <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                                {t.kind} â€¢ {t.status}
                                {t.dueAt ? ` â€¢ due ${new Date(t.dueAt).toLocaleDateString()}` : ''}
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
                  <div className="grid grid-cols-2 rounded-xl border border-black/10 bg-transparent divide-x divide-y divide-black/10 overflow-hidden">
                    <div className="p-3">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Partner status</div>
                      <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{partner.status}</div>
                    </div>
                    <div className="p-3">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Primary route</div>
                      <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{partner.primaryRoute ?? 'â€”'}</div>
                    </div>
                    <div className="p-3">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Lane</div>
                      <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{partner.lane ?? 'â€”'}</div>
                    </div>
                    <div className="p-3">
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Stage</div>
                      <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{partner.journeyStage ?? 'intake'}</div>
                    </div>
                  </div>
                  <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3`}>
                    <ShieldAlert size={16} className="text-fuchsia-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-fuchsia-900">Pro tip</p>
                      <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                        If you receive bureau mail responses, upload them to your Documents Vault immediately â€” it keeps your rounds and follow-ups on schedule.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
            <CollapsibleSection
              variant="dark"
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

          <FinelyOsPageFooter />
        </div>
      )}
    </PageShell>
  );
}
