import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FileText, FolderOpen, Gavel, ListChecks, ShieldAlert, Scale, TrendingUp, MessageCircle, Calendar, FolderKanban } from 'lucide-react';
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
import { bucketCountsByDay } from '../../utils/timeSeries';
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
import { PartnerCreditLanesPanel } from '../../components/partner/PartnerCreditLanesPanel';
import { ensurePartnerOnboardingTasks } from '../../lib/partnerOnboardingEngine';
import { openCommunicationHub } from '../../components/chat/communicationHubModel';
import { PartnerCreditRestoreCommandStrip } from '../../components/partner/PartnerCreditRestoreCommandStrip';
import { computeCreditRestorePrimaryAlert } from '../../lib/creditRestorePrimaryAlert';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { submitPartnerFundingHandoff } from '../../lib/noraFundingHandoff';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsDataErrorBanner } from '../../features/os/FinelyOsDataErrorBanner';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { PartnerActivityTimeline, partnerNoteToTimelineItem } from '../../components/partner/PartnerActivityTimeline';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
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
} from '../../features/os/finelyOsLightUi';

const DASH_CARD_ACCENTS = ['emerald', 'sky', 'violet', 'amber', 'fuchsia'] as const;

export default function PartnerDashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  type DashTab = 'overview' | 'journey' | 'activity' | 'modules' | 'workflow';
  const [dashTab, setDashTab] = useState<DashTab>('overview');

  const jumpToDashSection = (id: DashTab) => {
    setDashTab(id);
    window.setTimeout(() => {
      document.getElementById(`portal-dash-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  useEffect(() => {
    const hash = (window.location.hash.replace('#', '') || '') as DashTab;
    if (hash === 'overview' || hash === 'journey' || hash === 'activity' || hash === 'modules' || hash === 'workflow') {
      const t = window.setTimeout(() => jumpToDashSection(hash), 120);
      return () => window.clearTimeout(t);
    }
  }, []);

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
    const sectionIds: DashTab[] = ['overview', 'journey', 'activity', 'modules', 'workflow'];
    const sections = sectionIds
      .map((id) => document.getElementById(`portal-dash-${id}`))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target;
        if (!top?.id?.startsWith('portal-dash-')) return;
        const id = top.id.replace('portal-dash-', '') as DashTab;
        setDashTab((prev) => (prev === id ? prev : id));
      },
      { rootMargin: '-18% 0px -52% 0px', threshold: [0.08, 0.2, 0.4] },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [partner?.id]);

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
      body: `${r.provider}${r.reportDate ? ` · ${new Date(r.reportDate).toLocaleDateString()}` : ''}`,
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
      }),
    [reports, letters],
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
    [navigate, reports.length, evidence.length, openCases.length, openTasks.length, openDebt.length, debtCases.length],
  );

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

  const dashKpis = useMemo(
    () => [
      {
        label: 'Overall score',
        value: overallScore ? String(overallScore.overall) : '—',
        hint: 'Readiness index',
        accent: (overallScore?.overall ?? 0) >= 80 ? ('emerald' as const) : ('amber' as const),
      },
      { label: 'Open tasks', value: String(openTasks.length), hint: 'In motion', accent: 'amber' as const },
      { label: 'Open cases', value: String(openCases.length), hint: 'Active disputes', accent: 'violet' as const },
      { label: 'Vault files', value: String(evidence.length), hint: 'Evidence uploaded', accent: 'sky' as const },
    ],
    [overallScore, openTasks.length, openCases.length, evidence.length],
  );

  // Journey stage is set by the Finely case team (admin) — only refresh signals here.
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
      subtitle="Your home base: next steps, uploads, and dispute progress — organized so you always know what to do next."
    >
      {!partner ? (
        <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
          {isAdmin ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className={FINELY_OS_ENTITY_LABEL}>Admin — Select a Partner</div>
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
                <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>Loading partners…</div>
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
                      className={`${finelyOsCatalogCard(DASH_CARD_ACCENTS[idx % DASH_CARD_ACCENTS.length])} w-full text-left !p-5 space-y-2`}
                      data-fc-accent={DASH_CARD_ACCENTS[idx % DASH_CARD_ACCENTS.length]}
                    >
                      <div className={FINELY_OS_ENTITY_VALUE}>{p.profile.fullName || 'Unnamed'}</div>
                      <div className={`${FINELY_OS_ENTITY_BODY} text-xs truncate`}>{p.profile.email || '—'}</div>
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
        <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
          <WelcomeBanner user={auth.user} partner={partner} />
          <FinelyNoticedStrip
            items={buildPortalNoticedItems({
              reportsCount: reports.length,
              lettersCount: letters.length,
              openCasesCount: openCases.length,
              evidenceCount: evidence.length,
              overallScore: overallScore?.overall ?? null,
            })}
          />
          <FinelyNowDoThisStrip currentIndex={reports.length === 0 ? 0 : 2} />
          {restoreAlert.show ? (
            <div className="space-y-3">
              <FinelyOsAlertBanner tone={restoreAlert.tone} message={restoreAlert.message} />
              {restoreAlert.ctaPath ? (
                <button type="button" onClick={() => navigate(restoreAlert.ctaPath!)} className={FINELY_OS_PRIMARY_BTN}>
                  {restoreAlert.ctaLabel ?? 'Continue'} <ArrowRight size={14} />
                </button>
              ) : null}
            </div>
          ) : null}
          <PartnerCreditRestoreCommandStrip
            partner={partner}
            reportsCount={reports.length}
            evidenceCount={evidence.length}
            lettersCount={letters.length}
            openCasesCount={openCases.length}
            negativesCount={openCases.length}
          />
          <PartnerFundingCommandStrip
            partner={partner}
            reportCount={reports.length}
            letterCount={letters.length}
            onApply={() => {
              void submitPartnerFundingHandoff(partner).then((r) => {
                if (r.ok) refresh();
                else window.alert(r.error ?? 'Funding handoff failed.');
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
          <ProofDocumentsHub partner={partner} email={auth.user?.email} onUploaded={() => refresh()} />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Finely Cred Dashboard">
              <ArrowLeft size={16} /> Dashboard
            </button>
            <div className="flex items-center gap-3">
              {isAdmin && (
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
              )}
              <div className={FINELY_OS_ENTITY_SUBLABEL}>partner_id: {partner.id}</div>
            </div>
          </div>

          <FinelyUnifiedHubLayout
            eyebrow="Partner portal"
            title="Your file — scroll or jump"
            subtitle="Overview, journey, activity, modules, and workflow — all visible; tabs jump to each section."
            accent="violet"
            kpis={dashKpis}
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'journey', label: 'Journey' },
              { id: 'activity', label: 'Activity' },
              { id: 'modules', label: 'Modules' },
              { id: 'workflow', label: 'Workflow' },
            ]}
            activeTab={dashTab}
            onTabChange={(id) => jumpToDashSection(id as DashTab)}
            primaryAction={{ label: 'Open tasks', onClick: () => navigate('/portal/projects') }}
            secondaryAction={{ label: 'Fundability hub', onClick: () => navigate('/fundability-readiness') }}
          >
            <div className="space-y-16 pb-8">
            <section id="portal-dash-overview" className="fc-scroll-section space-y-6">
                <h2 className="fc-launch-lane-header">Overview</h2>
                <ProfileGoalsReadinessPanel partner={partner} overallScore={overallScore} onSaved={() => refresh()} />
                <PartnerOnboardingProgress partner={partner} />
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
              <div className={`lg:col-span-8 min-w-0 ${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={FINELY_OS_ENTITY_LABEL}>Mission control</div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>Top improvements + quick actions</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>These are the fastest levers to raise score and move the file.</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('fc-roadmap-console');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={FINELY_OS_SECONDARY_BTN}
                      title="Jump to cinematic roadmap + action console"
                    >
                      Open expedition map <ArrowRight size={14} />
                    </button>
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
                    {overallScore.topActions.slice(0, 3).map((a, idx) => (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => navigate(a.path || '/portal/checklist')}
                        className={`${finelyOsCatalogCard(DASH_CARD_ACCENTS[idx % DASH_CARD_ACCENTS.length])} w-full text-left !p-4`}
                        data-fc-accent={DASH_CARD_ACCENTS[idx % DASH_CARD_ACCENTS.length]}
                        title={a.title}
                      >
                        <div className="text-[10px] uppercase tracking-widest text-violet-700">
                          {a.severity === 'warn' ? 'Priority' : 'Improvement'}
                        </div>
                        <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{a.title}</div>
                        <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{a.desc}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={`mt-4 ${FINELY_OS_ENTITY_BODY}`}>No improvements detected right now.</div>
                )}
              </div>
            </div>
          ) : null}

          {visibleNotes.length > 0 ? (
            <CollapsibleSection
              variant="dark"
              title="Staff notes"
              subtitle="Updates from your credit specialist team."
              count={`${visibleNotes.length} note${visibleNotes.length === 1 ? '' : 's'}`}
              defaultOpen
              storageKey="portal.dashboard.staffNotes"
              className="border-fuchsia-500/25"
              headerClassName="border-white/[0.08]"
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

          {partner.lane === 'business_credit' && (
            <CollapsibleSection
              variant="dark"
              title={<span className="text-fuchsia-200">Business persona</span>}
              subtitle="Your EIN profile (separate from personal)."
              defaultOpen={false}
              storageKey="portal.dashboard.businessPersona"
              className="border-fuchsia-500/25"
              headerClassName="border-white/[0.08]"
              actions={
                <Button variant="primary" size="sm" onClick={() => navigate('/business/profile')}>
                  Complete business profile <ArrowRight size={14} />
                </Button>
              }
            >
              <div className={FINELY_OS_ENTITY_BODY}>
                {(partner.routes as any)?.business_build?.business?.businessName || (partner.journeySignals as any)?.businessName || '—'}
                {((partner.routes as any)?.business_build?.business?.entityState || (partner.journeySignals as any)?.entityState) ? (
                  <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                    {' '}
                    •{' '}
                    {String((partner.routes as any)?.business_build?.business?.entityState || (partner.journeySignals as any)?.entityState).toUpperCase()}
                  </span>
                ) : null}
              </div>
              <div className={`mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                <span>
                  EIN last4:{' '}
                  {String((partner.routes as any)?.business_build?.business?.einLast4 || (partner.journeySignals as any)?.einLast4 || '—')}
                </span>
                <span className="opacity-40">|</span>
                <span>
                  NAICS: {String((partner.routes as any)?.business_build?.business?.naics || (partner.journeySignals as any)?.naics || '—')}
                </span>
              </div>
            </CollapsibleSection>
          )}
            </section>

            <section id="portal-dash-journey" className="fc-scroll-section">
                <h2 className="fc-launch-lane-header">Your journey</h2>
            {(() => {
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
            return (
              <div id="fc-roadmap-console">
                <CollapsibleSection
                  variant="dark"
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
                    <div className="space-y-3 min-w-0">
                      {(['Now', 'Next', 'Later'] as const).map((k) => {
                        const items = actions.filter((a) => a.k === k);
                        return (
                          <details key={k} open={k === 'Now'} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                            <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                              <div className={FINELY_OS_ENTITY_VALUE}>
                                {k}{' '}
                                <span className={`ml-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                                  {items.length} item{items.length === 1 ? '' : 's'}
                                </span>
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-violet-300">Open</div>
                            </summary>
                            <div className="mt-4 space-y-3">
                              {items.map((a) => (
                                <button
                                  key={`${k}:${a.path}`}
                                  type="button"
                                  onClick={() => navigate(a.path)}
                                  className={`${finelyOsInlineListItem()} w-full text-left p-5`}
                                >
                                  <div className="text-[10px] uppercase tracking-widest text-violet-300">{a.k}</div>
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
              </div>
            );
          })()}
            </section>

            <section id="portal-dash-activity" className="fc-scroll-section space-y-6">
                <h2 className="fc-launch-lane-header">Recent activity</h2>

          <PartnerActivityTimeline
            items={portalActivityItems}
            emptyMessage="Your timeline will populate as reports upload, letters mail, and tasks complete."
            accent="emerald"
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Open tasks"
              value={openTasks.length}
              hint="Next actions in motion"
              series={series.tasks14}
              tone="amber"
              onClick={() => navigate('/portal/projects')}
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
              variant="dark"
              title="Top improvements"
              subtitle="Fastest ways to raise your score and keep your workflow clean."
              count={`${overallScore.topActions.length}`}
              defaultOpen={false}
              storageKey="portal.dashboard.overallScore.topActions"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overallScore.topActions.slice(0, 6).map((a, idx) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => (a.path ? navigate(a.path) : navigate('/portal/checklist'))}
                    className={`${finelyOsCatalogCard(DASH_CARD_ACCENTS[idx % DASH_CARD_ACCENTS.length])} w-full text-left !p-5`}
                    data-fc-accent={DASH_CARD_ACCENTS[idx % DASH_CARD_ACCENTS.length]}
                  >
                    <div className="text-[10px] uppercase tracking-widest text-violet-700">
                      {a.severity === 'warn' ? 'Priority' : 'Improvement'}
                    </div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{a.title}</div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{a.desc}</div>
                    <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      Open <ArrowRight size={12} />
                    </div>
                  </button>
                ))}
              </div>
            </CollapsibleSection>
          ) : null}

          <CollapsibleSection
            variant="dark"
            title="Next steps & status"
            subtitle="Keep momentum without scrolling 20 pages."
            defaultOpen
            storageKey="portal.dashboard.nextSteps"
          >
            <div className="grid lg:grid-cols-12 gap-6">
              <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony !p-6 space-y-4`}>
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
                      <div key={t.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
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

              <div className={`lg:col-span-5 min-w-0 ${finelyOsCatalogCard('violet')} !p-6 space-y-4`}>
                <p className={FINELY_OS_ENTITY_LABEL}>Status snapshot</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Partner status</div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{partner.status}</div>
                  </div>
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Primary route</div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{partner.primaryRoute ?? '—'}</div>
                  </div>
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Lane</div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{partner.lane ?? '—'}</div>
                  </div>
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Stage</div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{partner.journeyStage ?? 'intake'}</div>
                  </div>
                </div>
                <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3`}>
                  <ShieldAlert size={16} className="text-fuchsia-300 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-fuchsia-100">Pro tip</p>
                    <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                      If you receive bureau mail responses, upload them to your Documents Vault immediately — it keeps your rounds and follow-ups on schedule.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>
            </section>

            <section id="portal-dash-modules" className="fc-scroll-section">
                <h2 className="fc-launch-lane-header">All modules</h2>
          <CollapsibleSection
            variant="dark"
            title="Modules"
            subtitle="Shortcuts to the most-used areas (kept collapsible so the dashboard stays compact)."
            count={`${dashboardModuleCards.length} shortcuts`}
            defaultOpen={false}
            storageKey="portal.dashboard.modules"
          >
            <FinelyOsPaginatedStack
              items={dashboardModuleCards}
              pageSize={8}
              itemSpacingClassName="grid md:grid-cols-4 gap-4"
              emptyMessage="No modules available."
              renderItem={(c, idx) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={c.onClick}
                  className={`${finelyOsCatalogCard(DASH_CARD_ACCENTS[idx % DASH_CARD_ACCENTS.length])} w-full text-left !p-6`}
                  data-fc-accent={DASH_CARD_ACCENTS[idx % DASH_CARD_ACCENTS.length]}
                >
                  <div className="flex items-center gap-3 text-violet-700">
                    {c.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{c.title}</span>
                  </div>
                  <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>{c.desc}</p>
                  <div className={`mt-4 ${FINELY_OS_ENTITY_SUBLABEL}`}>{c.stat}</div>
                </button>
              )}
            />
          </CollapsibleSection>
            </section>

            <section id="portal-dash-workflow" className="fc-scroll-section space-y-6">
                <h2 className="fc-launch-lane-header">Workflow &amp; tasks</h2>
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
            </section>
            </div>
          </FinelyUnifiedHubLayout>

          <FinelyOsPageFooter />
        </div>
      )}
    </PageShell>
  );
}

