import React, { useEffect, useMemo, useState } from 'react';
import { 
  Building2, ArrowRight, AlertTriangle, Target, Gavel,
  Layers, Lock, Zap, X, Menu, ChevronUp, Scale, FastForward, Crosshair, Users, UploadCloud, ListChecks, LayoutDashboard, Settings, CreditCard, Shield, ShieldAlert, Briefcase, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { UserAccountMenu } from '../account/UserAccountMenu';
import { WelcomeBanner } from '../onboarding/WelcomeBanner';
import { supabase } from '../../lib/supabaseClient';
import { findPartnerByEmail, fetchAllPartnersAsAdmin } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listCasesByPartner } from '../../data/casesRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import type { DisputeCandidate } from '../../domain/creditReports';
import { bureauShortCode } from '../../utils/bureaus';
import type { WorkflowId } from '../../domain/automation';
import { addWorkflowRun, getWorkflowConfig, listWorkflowRuns, setWorkflowConfig } from '../../data/automationRepo';
import { runWorkflow } from '../../automation/runWorkflows';
import { KpiCard } from '../ui/KpiCards';
import { bucketCountsByDay } from '../../utils/timeSeries';
export { LenderLogicEngine } from './LenderLogicEngine';
export type { LenderLogicEngineProps } from './LenderLogicEngine';
export { DisputeWeaver } from './DisputeWeaver';

import { buildDashboardMetrics } from '../../lib/dashboardMetrics';
import { DashboardHeroMetrics } from './DashboardHeroMetrics';
import { DashboardDoNextStrip } from './DashboardDoNextStrip';
import { DashboardFundingPanel } from './DashboardFundingPanel';
import { LenderLogicEngine } from './LenderLogicEngine';
import { DisputeWeaver } from './DisputeWeaver';
import { FinelyOwnersGuidePanel } from '../guide/FinelyOwnersGuidePanel';
import { ClickableCard } from '../ui/ClickableCard';
import { FinelyCredLogo } from '../brand/FinelyCredLogo';
import { BackToSiteButton } from '../navigation/BackToSiteButton';
import { FinelyNowDoThisStrip } from '../tours/FinelyNowDoThisStrip';
import { computePartnerOverallScore } from '../../utils/partnerOverallScore';
import { getUserProfileMeta } from '../../auth/userProfile';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_PAGE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_SIDE_RAIL_GLOW,
  FINELY_OS_SIDE_RAIL_LABEL,
  FINELY_OS_SIDE_RAIL_SHELL,
  FINELY_OS_LUXURY_PAGINATION_BTN,
  finelyOsGlassShell,
  finelyOsInlineListItem,
  finelyOsSideRailNavItem,
  finelyOsModuleAccentText,
  FINELY_OS_BADGE_LIVE,
  FINELY_OS_BADGE_MUTED,
  FINELY_OS_BADGE_WARN,
  type FinelyOsGlassAccent,
} from '../../features/os/finelyOsLightUi';
import { useIsMobileOrTabletViewport } from '../../hooks/useMediaQuery';

const MODULE_SHELL_ACCENTS: FinelyOsGlassAccent[] = ['violet', 'emerald', 'sky', 'fuchsia', 'rose', 'violet'];
function moduleShell(index: number) {
  return `${finelyOsGlassShell('catalog', MODULE_SHELL_ACCENTS[index % MODULE_SHELL_ACCENTS.length])} hover:brightness-105 transition-all`;
}
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
  const [isAdmin, setIsAdmin] = useState(() => isAdminEmail(auth.user?.email));

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
  const isCompactViewport = useIsMobileOrTabletViewport();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  const jumpToSection = (id: TabId) => {
    setActiveTab(id);
    setMobileNavOpen(false);
    window.setTimeout(() => {
      document.getElementById(`dash-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const [disputeCandidates, setDisputeCandidates] = useState<DisputeCandidate[]>([]);
  const [adminPartnersAll, setAdminPartnersAll] = useState<Partner[]>([]);
  const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
  const [latestParsedReport, setLatestParsedReport] = useState<import('../../domain/creditReports').ParsedCreditReport | null>(null);

  useEffect(() => {
    const email = auth.user?.email;
    if (!email) { setCurrentPartner(null); setDisputeCandidates([]); return; }
    findPartnerByEmail(email).then((partner) => {
      setCurrentPartner(partner);
      if (!partner) { setDisputeCandidates([]); setLatestParsedReport(null); return; }
      const reports = listReportsByPartner(partner.id);
      const latest = reports.find((r) => Boolean(r.parsed)) ?? null;
      setLatestParsedReport(latest?.parsed ?? null);
      if (!latest?.parsed) { setDisputeCandidates([]); return; }
      setDisputeCandidates(deriveDisputeCandidates(latest.parsed, latest.id));
    });
  }, [auth.user?.email]);

  useEffect(() => {
    if (!isAdmin) { setAdminPartnersAll([]); return; }
    fetchAllPartnersAsAdmin().then(setAdminPartnersAll);
  }, [isAdmin]);

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

  const adminAggregateStats = useMemo(() => {
    if (!isAdmin) return { partners: 0, openTasks: 0, openCases: 0 };
    return adminPartnerCards.reduce(
      (acc, p) => ({
        partners: acc.partners + 1,
        openTasks: acc.openTasks + p.openTasks,
        openCases: acc.openCases + p.openCases,
      }),
      { partners: 0, openTasks: 0, openCases: 0 },
    );
  }, [isAdmin, adminPartnerCards]);

  const heroMetrics = useMemo(
    () =>
      buildDashboardMetrics({
        user: auth.user,
        partner: currentPartner,
        latestParsedReport,
        isAdmin,
        adminStats: adminAggregateStats,
      }),
    [auth.user, currentPartner, latestParsedReport, isAdmin, adminAggregateStats],
  );

  const profileRole = (getUserProfileMeta(auth.user).role || '').trim();
  const showFundingPanel = !isAdmin && profileRole !== 'agent';
  const workspaceSubtitle = isAdmin
    ? 'Administrative Level: Ops command'
    : profileRole === 'agent' || profileRole === 'credit_specialist'
      ? 'Credit Specialist workspace'
      : 'Partner workspace';

  const partnerOverall = useMemo(() => {
    if (!currentPartner || !showFundingPanel) return null;
    const reports = listReportsByPartner(currentPartner.id);
    const tasks = listTasksByPartner(currentPartner.id);
    const cases = listCasesByPartner(currentPartner.id);
    const letters = listLettersByPartner(currentPartner.id);
    return computePartnerOverallScore({
      partner: currentPartner,
      counts: {
        reports: reports.length,
        evidence: 0,
        tasksOpen: tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length,
        tasksDone: tasks.filter((t) => t.status === 'completed').length,
        casesOpen: cases.filter((c) => c.status === 'open').length,
        lettersGenerated: letters.length,
      },
    });
  }, [currentPartner, showFundingPanel, storeVersion]);

  const clientCreditScore = useMemo(() => {
    const scores = latestParsedReport?.scores?.filter((s) => s.value >= 300 && s.value <= 850) ?? [];
    if (scores.length) return Math.round(scores.reduce((a, s) => a + s.value, 0) / scores.length);
    const routeKey = currentPartner?.primaryRoute || 'personal_restore';
    const s = currentPartner?.routes?.[routeKey]?.score;
    return typeof s === 'number' && s >= 300 ? s : null;
  }, [latestParsedReport, currentPartner]);

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
  }, [isAdmin, adminPartnersAll, currentPartner, disputeCandidates.length, partnerQuery]);

  return (
    <div className="min-h-screen bg-fc-shell text-white flex flex-col animate-in fade-in duration-1000 overflow-x-clip">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/5 bg-fc-chrome/70 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 z-50 shrink-0 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-2 md:gap-6 min-w-0">
          {isCompactViewport ? (
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.05] text-white/80"
              aria-label={mobileNavOpen ? 'Close workspace menu' : 'Open workspace menu'}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          ) : null}
          <BackToSiteButton variant="ghost" label="Back to site" className="!px-2.5 !py-2 !text-[10px] sm:!text-xs shrink-0" />
          <button
            type="button"
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:opacity-90 transition-opacity shrink-0"
            aria-label="Go to homepage"
          >
            <FinelyCredLogo size="xs" forceLight className="!h-[1.25rem]" />
          </button>
          <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
          <p className="hidden md:block text-[10px] font-semibold text-white/45 tracking-wider">
            Welcome{user.name ? `, ${user.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Stable</span>
          </div>
          <UserAccountMenu />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-w-0">
        {isCompactViewport && mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-[2px] md:hidden"
            aria-label="Close workspace menu"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}
        {/* Sidebar — drawer on phone/tablet, rail on desktop */}
        <aside
          className={`${
            isCompactViewport
              ? `fixed inset-y-0 left-0 z-[200] w-[min(17rem,88vw)] transform transition-transform duration-300 ease-out shadow-2xl ${
                  mobileNavOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
                }`
              : `${sidebarExpanded ? 'w-[17rem]' : 'w-[5.5rem]'} shrink-0`
          } overflow-y-auto p-2 bg-fc-shell`}
        >
          <div className={`${FINELY_OS_SIDE_RAIL_SHELL} !max-h-[calc(100vh-5rem)] h-full ${sidebarExpanded || isCompactViewport ? '' : '!p-2'}`}>
            <div className={FINELY_OS_SIDE_RAIL_GLOW} />

            <div className={`relative flex items-center ${sidebarExpanded || isCompactViewport ? 'justify-between px-1' : 'justify-center'}`}>
              {sidebarExpanded || isCompactViewport ? <div className={FINELY_OS_SIDE_RAIL_LABEL}>Workspace</div> : null}
              {!isCompactViewport ? (
                <button
                  type="button"
                  onClick={() => setSidebarExpanded((v) => !v)}
                  className={`${FINELY_OS_LUXURY_PAGINATION_BTN} ${sidebarExpanded ? 'px-3 py-2' : '!p-2.5'}`}
                  title={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{sidebarExpanded ? 'Collapse' : 'Menu'}</span>
                </button>
              ) : null}
            </div>

            <div className={`relative space-y-2 ${sidebarExpanded || isCompactViewport ? '' : 'flex flex-col items-center'}`}>
              {sidebarTabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                const showExpanded = sidebarExpanded || isCompactViewport;
                return (
                  <button
                    key={t.id}
                    onClick={() => jumpToSection(t.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={
                      showExpanded
                        ? finelyOsSideRailNavItem(isActive)
                        : `flex flex-col items-center justify-center w-12 h-12 rounded-2xl border transition-all ${
                            isActive
                              ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white border-violet-400/40 shadow-md'
                              : 'bg-white/[0.06] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.05]'
                          }`
                    }
                    title={t.label}
                  >
                    <Icon size={showExpanded ? 18 : 20} className={showExpanded ? 'shrink-0' : ''} />
                    {showExpanded ? (
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-[10px] font-black uppercase tracking-widest">{t.label}</div>
                        <div className="text-[10px] text-white/45 font-normal normal-case tracking-normal">
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
                      <span className="sr-only">{t.label}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {(sidebarExpanded || isCompactViewport) && (
              <div className="relative mt-auto pt-2 border-t border-white/[0.08]">
                <div className={`${FINELY_OS_SIDE_RAIL_LABEL} px-1`}>Quick launch</div>
                <div className="mt-2 space-y-1">
                  {[
                    { label: 'Partner Portal', path: '/portal/dashboard', icon: LayoutDashboard, accent: 'emerald' as const },
                    { label: 'Business Portal', path: '/business/dashboard', icon: Briefcase, accent: 'sky' as const },
                    { label: 'AU Marketplace', path: '/au/marketplace', icon: CreditCard, accent: 'violet' as const },
                    { label: 'Resources', path: '/resources', icon: UploadCloud, accent: 'fuchsia' as const },
                  ].map((x) => (
                    <button
                      key={x.path}
                      type="button"
                      onClick={() => navigate(x.path)}
                      className={finelyOsSideRailNavItem(false)}
                    >
                      <x.icon
                        size={16}
                        className={
                          x.accent === 'emerald'
                            ? 'text-emerald-300'
                            : x.accent === 'sky'
                              ? 'text-sky-300'
                              : x.accent === 'violet'
                                ? 'text-violet-300'
                                : 'text-fuchsia-300'
                        }
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest">{x.label}</span>
                    </button>
                  ))}
                  {isAdmin && (
                    <button type="button" onClick={() => navigate('/admin')} className={finelyOsSideRailNavItem(false)}>
                      <Users size={16} className="text-violet-300" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 relative overflow-hidden bg-fc-shell min-w-0 w-full">
          <div className="p-4 sm:p-6 md:p-12 max-w-7xl mx-auto h-full flex flex-col min-w-0">
            <header className="mb-6 md:mb-12 space-y-2">
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extralight tracking-tight ${FINELY_OS_ENTITY_VALUE}`}>
                Finely Cred <span className="text-violet-300">Workspace</span>
              </h2>
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px] sm:text-xs tracking-[0.28em] sm:tracking-[0.4em]`}>{workspaceSubtitle}</p>
            </header>

            <div className={`flex-1 relative h-full overflow-y-auto overflow-x-clip ${FINELY_OS_PAGE} fc-senior-simple space-y-12 md:space-y-16 pb-28 md:pb-24 pr-0 sm:pr-2`}>
              <section id="dash-overview" className="fc-scroll-section space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                  <h2 className="fc-launch-lane-header">Overview</h2>
                  {/* Quick Actions (so you can reach partner + upload modules) */}
                  <div className={`flex flex-wrap items-center justify-between gap-3 ${finelyOsCatalogCard('violet')} !p-5 p-4`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>
                      Signed in as{' '}
                      <span className={`${FINELY_OS_ENTITY_VALUE} font-mono normal-case tracking-normal`}>{signedInEmail || '—'}</span>
                    </div>
                    <button type="button" onClick={() => navigate('/account/settings')} className={FINELY_OS_SECONDARY_BTN} title="Account settings and logout">
                      Account settings
                    </button>
                  </div>

                  <WelcomeBanner user={auth.user} partner={currentPartner} />

                  {isAdmin ? (
                    <div className={`${finelyOsCatalogCard('violet')} !p-5 p-4 flex flex-wrap items-center justify-between gap-3 border-violet-500/20`}>
                      <div>
                        <p className={FINELY_OS_ENTITY_SUBLABEL}>Admin command center</p>
                        <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                          Daily ops, CRM pipeline, workflow triage, and launch KPIs — open Admin or jump straight to queue.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => navigate('/admin/workflow')} className={FINELY_OS_SECONDARY_BTN}>
                          Ops queue
                        </button>
                        <button type="button" onClick={() => navigate('/admin/crm')} className={FINELY_OS_SECONDARY_BTN}>
                          Leads & CRM
                        </button>
                        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_PRIMARY_BTN}>
                          Open Admin
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <DashboardDoNextStrip
                    userEmail={auth.user?.email}
                    userRole={profileRole}
                    partnerId={currentPartner?.id}
                    reportsCount={kpi.mode === 'partner' ? kpi.reportsCount : 0}
                    openTasksCount={kpi.openTasksCount}
                    openCasesCount={kpi.openCasesCount}
                  />

                  <FinelyNowDoThisStrip />

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
                          tone="fuchsia"
                          onClick={() => navigate('/admin/workflow')}
                        />
                        <KpiCard
                          label="Leads"
                          value={kpi.leadsCount}
                          hint="Captured inbound requests"
                          series={kpi.series.leads14}
                          tone="violet"
                          onClick={() => navigate('/admin/crm')}
                        />
                      </>
                    ) : (
                      <>
                        <KpiCard
                          label="Open tasks"
                          value={kpi.openTasksCount}
                          hint="Next actions in motion"
                          series={kpi.series.tasks14}
                          tone="fuchsia"
                          onClick={() => navigate('/portal/projects')}
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
                        className={`text-left p-6 ${moduleShell(0)}`}
                        title="Admin Dashboard"
                      >
                        <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(0)}`}>
                          <LayoutDashboard size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Admin Dashboard</span>
                        </div>
                        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
                          Central hub: partners, cases, settings, templates, and analytics.
                        </p>
                        <div className={`mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${finelyOsModuleAccentText(0)}`}>
                          Open dashboard <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/admin/settings')}
                        className={`text-left p-6 ${moduleShell(1)}`}
                        title="System Settings"
                      >
                        <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(1)}`}>
                          <Settings size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">System Settings</span>
                        </div>
                        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
                          Branding, compliance links, admin users, and feature flags.
                        </p>
                        <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Open settings <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/admin/partners')}
                        className={`text-left p-6 ${moduleShell(2)}`}
                        title="Partner Management"
                      >
                        <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(2)}`}>
                          <Users size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Partner Management</span>
                        </div>
                        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
                          Create partners, upload reports, bind evidence, generate letters, and manage notes.
                        </p>
                        <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Open partners <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/admin/cases')}
                        className={`text-left p-6 ${moduleShell(3)}`}
                        title="Case Management"
                      >
                        <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(3)}`}>
                          <Gavel size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Case Management</span>
                        </div>
                        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Track bureau cases, rounds, and follow-up windows across all partners.</p>
                        <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Open cases <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/admin/billing')}
                        className={`text-left p-6 ${moduleShell(4)}`}
                        title="Billing & Agreements"
                      >
                        <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(4)}`}>
                          <CreditCard size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Billing & Agreements</span>
                        </div>
                        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Manage partner agreements, update statuses, grant entitlements.</p>
                        <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Open billing <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/business/dashboard')}
                        className={`text-left p-6 ${moduleShell(5)}`}
                        title="Business Portal"
                      >
                        <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(5)}`}>
                          <Briefcase size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Business Portal</span>
                        </div>
                        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Business profile, fundability matrix, and vendor sequencing.</p>
                        <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Open business <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/resources')}
                        className={`text-left p-6 ${moduleShell(6)}`}
                        title="Resources"
                      >
                        <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(6)}`}>
                          <Lock size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Resources</span>
                        </div>
                        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Reference library and product shells (CMS + access control in Phase 5).</p>
                        <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Open library <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/admin/role-preview')}
                        className={`text-left p-6 ${moduleShell(7)}`}
                        title="Role preview — inspect every lane"
                      >
                        <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(7)}`}>
                          <Shield size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Role preview</span>
                        </div>
                        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
                          See what Partner, Agent, Affiliate, AU Seller, and Admin roles can access, sign, and earn.
                        </p>
                        <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Open preview <ArrowRight size={12} />
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <button
                        onClick={() => navigate('/portal/reports')}
                        className={`text-left p-6 ${moduleShell(0)}`}
                      >
                        <div className="flex items-center gap-3 text-violet-300">
                          <UploadCloud size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Credit Reports</span>
                        </div>
                        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Upload HTML/PDF reports to generate tradelines + dispute candidates.</p>
                        <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Open reports <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/portal/disputes')}
                        className={`text-left p-6 ${moduleShell(1)}`}
                      >
                        <div className="flex items-center gap-3 text-emerald-300">
                          <Gavel size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Dispute Center</span>
                        </div>
                        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>View cases by bureau, rounds, and follow-up windows.</p>
                        <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Open disputes <ArrowRight size={12} />
                        </div>
                      </button>

                      <button
                        onClick={() => navigate('/portal/projects')}
                        className={`text-left p-6 ${moduleShell(2)}`}
                      >
                        <div className="flex items-center gap-3 text-sky-300">
                          <ListChecks size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Tasks</span>
                        </div>
                        <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Mail letters, track deadlines, and complete follow-ups.</p>
                        <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Open tasks <ArrowRight size={12} />
                        </div>
                      </button>
                    </div>
                  )}

                  {isAdmin && (
                    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-5`}>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className={FINELY_OS_ENTITY_SUBLABEL}>Partners</p>
                          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                            Unified admin workflow: pick a partner, upload report, evidence, disputes, and letters.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => navigate('/admin/partners#create-partner')}
                            className={FINELY_OS_PRIMARY_BTN}
                            title="Create a new partner"
                          >
                            Create partner <ArrowRight size={12} />
                          </button>
                          <input
                            value={partnerQuery}
                            onChange={(e) => setPartnerQuery(e.target.value)}
                            className={`w-72 max-w-full ${FINELY_OS_ENTITY_INPUT}`}
                            placeholder="Search partners..."
                          />
                        </div>
                      </div>

                      {adminPartnerCards.length === 0 ? (
                        <div className={FINELY_OS_ENTITY_BODY}>No partners found.</div>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {adminPartnerCards.map((p) => (
                            <ClickableCard
                              key={p.id}
                              onClick={() => navigate(`/admin/partners/${p.id}`)}
                              className={`${finelyOsInlineListItem()} p-5 space-y-4`}
                              ariaLabel={`Open partner ${p.name}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{p.name}</div>
                                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case`}>
                                    {p.email} • {p.status}
                                  </div>
                                </div>
                                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>
                                  {new Date(p.updatedAt).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div className={`${FINELY_OS_GLASS_CATALOG} !p-3 space-y-1`}>
                                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Reports</div>
                                  <div className={`${FINELY_OS_ENTITY_VALUE} font-mono text-sm`}>{p.reports}</div>
                                </div>
                                <div className={`${FINELY_OS_GLASS_CATALOG} !p-3 space-y-1`}>
                                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Open tasks</div>
                                  <div className={`${FINELY_OS_ENTITY_VALUE} font-mono text-sm`}>{p.openTasks}</div>
                                </div>
                                <div className={`${FINELY_OS_GLASS_CATALOG} !p-3 space-y-1`}>
                                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Open cases</div>
                                  <div className={`${FINELY_OS_ENTITY_VALUE} font-mono text-sm`}>{p.openCases}</div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2" role="presentation" onClick={(e) => e.stopPropagation()}>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      navigate(`/admin/partners/${p.id}`);
                                    }
                                  }}
                                  onClick={() => navigate(`/admin/partners/${p.id}`)}
                                  className={`${FINELY_OS_SECONDARY_BTN} cursor-pointer inline-flex`}
                                >
                                  Open profile <ArrowRight size={12} />
                                </span>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      navigate(`/admin/partners/${p.id}?tab=reports`);
                                    }
                                  }}
                                  onClick={() => navigate(`/admin/partners/${p.id}?tab=reports`)}
                                  className={`${FINELY_OS_PRIMARY_BTN} cursor-pointer inline-flex`}
                                  title="Upload report inside this partner profile"
                                >
                                  Upload report <ArrowRight size={12} />
                                </span>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      navigate(`/admin/partners/${p.id}?tab=notes`);
                                    }
                                  }}
                                  onClick={() => navigate(`/admin/partners/${p.id}?tab=notes`)}
                                  className={`${FINELY_OS_SECONDARY_BTN} cursor-pointer inline-flex`}
                                >
                                  Notes <ArrowRight size={12} />
                                </span>
                              </div>
                            </ClickableCard>
                          ))}
                        </div>
                      )}

                      <div className={`text-[11px] ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
                        Showing up to <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>24</span> partners here. Full list stays in Partner Management.
                      </div>
                    </div>
                  )}

                  {showFundingPanel ? (
                    <DashboardFundingPanel
                      partner={currentPartner}
                      creditScore={clientCreditScore}
                      scoreFromReport={Boolean(latestParsedReport?.scores?.length)}
                      overallScore={partnerOverall}
                      onSaved={() => {
                        setStoreVersion((v) => v + 1);
                        if (auth.user?.email) {
                          findPartnerByEmail(auth.user.email).then(setCurrentPartner);
                        }
                      }}
                    />
                  ) : (
                    <DashboardHeroMetrics cards={heroMetrics.cards} />
                  )}
              </section>

              <section id="dash-remedy" className="fc-scroll-section">
                <h2 className="fc-launch-lane-header mb-6">Disputes</h2>
                <DisputeWeaver fractures={disputeCandidates} />
              </section>

              <section id="dash-debt" className="fc-scroll-section space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                  <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/[0.08] pb-6">
                    <div className="space-y-2 text-left min-w-0">
                      <h3 className={`text-3xl font-light tracking-tight ${FINELY_OS_ENTITY_VALUE}`}>
                        Debt <span className="text-rose-300">Kill</span>
                      </h3>
                      <p className={FINELY_OS_ENTITY_SUBLABEL}>
                        Defense workflow • evidence-first • next best action
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('/portal/debt')}
                        className={FINELY_OS_PRIMARY_BTN}
                      >
                        Open Debt Center <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/consultation?lane=' + encodeURIComponent('Debt Kill (Debt & Legal)'))}
                        className={FINELY_OS_SECONDARY_BTN}
                      >
                        Book a free strategy call <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-4 min-w-0">
                    {[
                      { title: 'Collections', desc: 'Validation, dispute sequencing, and proof-of-claim workflows.' },
                      { title: 'Summons', desc: 'Time-sensitive: document capture + response sequencing by jurisdiction.' },
                      { title: 'Reporting cleanup', desc: 'Align bureau reporting to your actual facts and documentation.' },
                    ].map((x) => (
                      <div key={x.title} className={`${FINELY_OS_GLASS_CATALOG} space-y-2 min-w-0`}>
                        <div className={FINELY_OS_ENTITY_VALUE}>{x.title}</div>
                        <div className={FINELY_OS_ENTITY_BODY}>{x.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div className={FINELY_OS_NOTICE_SUCCESS}>
                    <span className="font-semibold">Live next step:</span> upload any letters/summons immediately, then generate your packet workflow in the Debt Center.
                  </div>
              </section>

              <section id="dash-lender" className="fc-scroll-section">
                <h2 className="fc-launch-lane-header mb-6">Lender logic</h2>
                <LenderLogicEngine userScore={heroMetrics.cards.find((c) => c.id === 'credit_score')?.value ? Number(heroMetrics.cards.find((c) => c.id === 'credit_score')!.value) : undefined} />
              </section>

              <section id="dash-automation" className="fc-scroll-section space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                  <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/[0.08] pb-6">
                    <div className="space-y-2 text-left min-w-0">
                      <h3 className={`text-3xl font-light tracking-tight ${FINELY_OS_ENTITY_VALUE}`}>
                        Automation <span className="text-fuchsia-300">Control Room</span>
                      </h3>
                      <p className={FINELY_OS_ENTITY_SUBLABEL}>
                        Workflows • scheduled runs • compliance logs
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setAutomationView((v) => (v === 'history' ? 'workflows' : 'history'))}
                        className={FINELY_OS_SECONDARY_BTN}
                      >
                        {automationView === 'history' ? 'Back to workflows' : 'View run history'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfigOpenFor('dispute_followup_scheduler')}
                        className={FINELY_OS_PRIMARY_BTN}
                      >
                        Workflow settings
                      </button>
                    </div>
                  </div>

                  {automationRunMsg && (
                    <div className={FINELY_OS_NOTICE_SUCCESS}>
                      {automationRunMsg}
                    </div>
                  )}

                  {automationView === 'history' ? (
                    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                      <div className={FINELY_OS_ENTITY_VALUE}>Run history</div>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>
                        Stored locally • updates live as workflows run
                      </div>
                      <div className="space-y-2">
                        {listWorkflowRuns(40).map((r) => (
                          <div key={r.id} className={`${finelyOsInlineListItem()} p-4`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className={`${FINELY_OS_ENTITY_VALUE} truncate normal-case`}>
                                  {r.workflowId.replace(/_/g, ' ')} • {r.mode}
                                </div>
                                <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{r.summary}</div>
                                <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>
                                  started {new Date(r.startedAt).toLocaleString()} • actions {r.actions.length}
                                </div>
                              </div>
                              <div className={`shrink-0 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>
                                {new Date(r.finishedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-3 gap-4 min-w-0">
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
                            className={`${FINELY_OS_GLASS_CATALOG} space-y-4 hover:border-violet-300/70 transition-all min-w-0`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className={FINELY_OS_ENTITY_VALUE}>{w.title}</div>
                                  {!cfg.enabled && (
                                    <span className={FINELY_OS_BADGE_MUTED}>
                                      Disabled
                                    </span>
                                  )}
                                </div>
                                <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{w.desc}</div>
                                <div className={`mt-3 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>
                                  params:{' '}
                                  {w.id === 'dispute_followup_scheduler'
                                    ? `daysBeforeDue=${Number(cfg.params.daysBeforeDue ?? 7)}`
                                    : `dueInDays=${Number(cfg.params.dueInDays ?? 3)}`}
                                </div>
                              </div>
                              <div className={FINELY_OS_BADGE_LIVE}>
                                {w.badge}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                              <button
                                type="button"
                                onClick={() => setConfigOpenFor(w.id)}
                                className={`${FINELY_OS_SECONDARY_BTN} w-full`}
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
                                className={`${FINELY_OS_PRIMARY_BTN} w-full`}
                              >
                                Dry-run
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const run = runWorkflow(w.id, 'live');
                                  addWorkflowRun(run);
                                  setAutomationRunMsg(run.summary);
                                  setStoreVersion((v) => v + 1);
                                }}
                                className={`${FINELY_OS_SUCCESS_BTN} w-full`}
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
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                      <div className={`w-full max-w-xl ${finelyOsCatalogCard('violet')} !p-5 shadow-2xl p-6`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className={FINELY_OS_ENTITY_VALUE}>Workflow settings</div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{configOpenFor.replace(/_/g, ' ')}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfigOpenFor(null)}
                            className={FINELY_OS_SECONDARY_BTN}
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
                                <label className={`flex items-center justify-between gap-3 ${finelyOsInlineListItem()} p-4`}>
                                  <div>
                                    <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Enabled</div>
                                    <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Turn this workflow on/off.</div>
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
                                  <label className={`block ${finelyOsInlineListItem()} p-4`}>
                                    <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Days before due date</div>
                                    <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>
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
                                      className={FINELY_OS_ENTITY_INPUT}
                                    />
                                  </label>
                                ) : (
                                  <label className={`block ${finelyOsInlineListItem()} p-4`}>
                                    <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Upload due (days)</div>
                                    <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>
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
                                      className={FINELY_OS_ENTITY_INPUT}
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
                            className={FINELY_OS_SECONDARY_BTN}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </section>

              <section id="dash-vault" className="fc-scroll-section space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                  <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/[0.08] pb-6 gap-4">
                    <div className="space-y-2 text-left min-w-0">
                      <h3 className={`text-3xl font-light tracking-tight ${FINELY_OS_ENTITY_VALUE}`}>
                        Secure <span className="text-violet-300">Launchpad</span>
                      </h3>
                      <p className={`${FINELY_OS_ENTITY_BODY} max-w-xl`}>
                        Shortcuts to every module — start with the Owner&apos;s guide if you forget where something lives.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/owners-guide')}
                      className={`${FINELY_OS_PRIMARY_BTN} shrink-0`}
                    >
                      Open full Owner&apos;s guide <ArrowRight size={14} />
                    </button>
                  </div>

                  <FinelyOwnersGuidePanel compact isAdmin={isAdmin} maxSections={4} />

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => navigate('/owners-guide')}
                      className={`text-left p-6 flex flex-col ${moduleShell(0)} min-w-0`}
                    >
                      <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(0)}`}>
                        <Lock size={18} />
                        <span className={FINELY_OS_ENTITY_SUBLABEL}>Owner&apos;s guide</span>
                      </div>
                      <p className={`mt-3 ${FINELY_OS_ENTITY_BODY} flex-1`}>
                        Every feature, route, and workflow — Hub, Calendar, lead magnets, disputes, specialists.
                      </p>
                      <span className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                        Read guide <ArrowRight size={12} />
                      </span>
                    </button>

                    <button
                      onClick={() => navigate('/portal/dashboard')}
                      className={`text-left p-6 flex flex-col ${moduleShell(1)} min-w-0`}
                    >
                      <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(1)}`}>
                        <LayoutDashboard size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Partner Portal</span>
                      </div>
                      <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Reports, disputes, tasks, messages, and billing.</p>
                      <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>Open <ArrowRight size={12} /></div>
                    </button>

                    <button onClick={() => navigate('/business/dashboard')} className={`text-left p-6 ${moduleShell(2)}`}>
                      <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(2)}`}>
                        <Briefcase size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Business Portal</span>
                      </div>
                      <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Business profile, fundability matrix, vendor sequencing.</p>
                      <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>Open <ArrowRight size={12} /></div>
                    </button>

                    <button onClick={() => navigate('/portal/billing')} className={`text-left p-6 ${moduleShell(3)}`}>
                      <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(3)}`}>
                        <CreditCard size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Billing</span>
                      </div>
                      <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Agreements, entitlements, Stripe & in-house financing.</p>
                      <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>Open <ArrowRight size={12} /></div>
                    </button>

                    <button onClick={() => navigate('/portal/library')} className={`text-left p-6 ${moduleShell(4)}`}>
                      <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(4)}`}>
                        <BookOpen size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">My Library</span>
                      </div>
                      <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Read and listen to purchased playbooks with Finely Voice Studio.</p>
                      <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>Open <ArrowRight size={12} /></div>
                    </button>

                    <button onClick={() => navigate('/portal/identity-theft')} className={`text-left p-6 ${moduleShell(5)}`}>
                      <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(4)}`}>
                        <ShieldAlert size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Identity Theft</span>
                      </div>
                      <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Recovery workflow, FTC reports, freezes, and fraud alerts.</p>
                      <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>Open <ArrowRight size={12} /></div>
                    </button>

                    <button onClick={() => navigate('/portal/documents')} className={`text-left p-6 ${moduleShell(6)}`}>
                      <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(5)}`}>
                        <Lock size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Documents</span>
                      </div>
                      <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Secure document vault and evidence storage.</p>
                      <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>Open <ArrowRight size={12} /></div>
                    </button>

                    <button onClick={() => navigate('/portal/escalations')} className={`text-left p-6 ${moduleShell(7)}`}>
                      <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(6)}`}>
                        <Scale size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Escalations</span>
                      </div>
                      <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>CFPB, BBB, AG complaints tracking.</p>
                      <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>Open <ArrowRight size={12} /></div>
                    </button>

                    {isAdmin && (
                      <>
                        <button onClick={() => navigate('/admin/billing')} className={`text-left p-6 ${moduleShell(4)}`}>
                          <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(4)}`}>
                            <CreditCard size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Admin Billing</span>
                          </div>
                          <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Manage all partner agreements and entitlements.</p>
                          <div className={`mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${finelyOsModuleAccentText(4)}`}>Open <ArrowRight size={12} /></div>
                        </button>

                        <button onClick={() => navigate('/admin/partners')} className={`text-left p-6 ${moduleShell(5)}`}>
                          <div className={`flex items-center gap-3 ${finelyOsModuleAccentText(5)}`}>
                            <Users size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Partner Admin</span>
                          </div>
                          <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>Create and manage all partner profiles.</p>
                          <div className={`mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${finelyOsModuleAccentText(5)}`}>Open <ArrowRight size={12} /></div>
                        </button>
                      </>
                    )}
                  </div>
              </section>
            </div>
          </div>
        </main>

        {isCompactViewport ? (
          <nav
            className="md:hidden fixed bottom-0 inset-x-0 z-[170] border-t border-white/10 bg-fc-chrome/95 backdrop-blur-xl px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
            aria-label="Workspace sections"
          >
            <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sidebarTabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => jumpToSection(t.id)}
                    className={`flex min-w-[4.25rem] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[9px] font-black uppercase tracking-wider transition ${
                      isActive ? 'bg-violet-600/30 text-white' : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    <Icon size={16} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
