import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listPartnerPortalTasks } from '../../lib/workVisibility';
import { listCasesByPartner } from '../../data/casesRepo';
import { listDebtByPartner } from '../../data/debtRepo';
import { listPartnerNotesByPartner } from '../../data/partnerNotesRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ADMIN_PARTNER_OVERRIDE_KEY } from '../../portal/getOrCreatePartnerForSession';
import { isAdminEmail } from '../../auth/admin';
import { supabase } from '../../lib/supabaseClient';
import { upsertPartner, fetchAllPartnersAsAdmin } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import type { Bureau } from '../../domain/creditReports';
import { computePartnerOverallScore } from '../../utils/partnerOverallScore';
import { ProfileGoalsReadinessPanel } from '../../components/profile/ProfileGoalsReadinessPanel';
import { openCommunicationHub } from '../../components/chat/communicationHubModel';
import { PartnerCreditRestoreCommandStrip } from '../../components/partner/PartnerCreditRestoreCommandStrip';
import { computeCreditRestorePrimaryAlert } from '../../lib/creditRestorePrimaryAlert';
import { computeCourtPlanDashboardAlert } from '../../lib/courtPlanDashboardAlert';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsDataErrorBanner } from '../../features/os/FinelyOsDataErrorBanner';
import { partnerNoteToTimelineItem } from '../../components/partner/PartnerActivityTimeline';
import { PartnerOverviewTab } from '../../features/partner/PartnerOverviewTab';
import { ensurePartnerOnboardingTasks } from '../../lib/partnerOnboardingEngine';
import '../../features/partner/partnerPortalVisual.css';
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
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { PARTNER_HUB_LAUNCHER_ACCENTS } from '../../components/partner/partnerHubLauncherUi';

const PORTAL_TAB_PATHS: Record<string, string> = {
  reports: '/portal/reports',
  evidence: '/portal/documents',
  letters: '/portal/letters',
  tasks: '/portal/projects',
  disputes: '/portal/disputes',
  notes: '/portal/messages',
  debt: '/portal/debt',
  profile: '/account/settings',
};

export default function PartnerDashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { partner, refresh } = usePartnerSession();

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

  const latestScoresRows = useMemo(() => {
    const scores = reports[0]?.parsed?.scores ?? [];
    if (!scores.length) return [];
    const byModel = new Map<string, Partial<Record<Bureau, number>>>();
    for (const s of scores) {
      const cur = byModel.get(s.model) ?? {};
      if (s.bureau) {
        const prev = cur[s.bureau];
        cur[s.bureau] = prev == null ? s.value : Math.max(prev, s.value);
      }
      byModel.set(s.model, cur);
    }
    return Array.from(byModel.entries()).map(([model, by]) => ({
      model,
      exp: by.EXP,
      eqf: by.EQF,
      tuc: by.TUC,
    }));
  }, [reports]);

  const mailingSummary = useMemo(() => {
    if (!partner) return null;
    const routeKey = partner.primaryRoute || 'personal_restore';
    const personal = partner.routes?.[routeKey]?.personal ?? partner.routes?.personal_restore?.personal;
    const parts = [personal?.address1, personal?.city, personal?.state, personal?.postalCode].filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }, [partner]);

  const profileRouteKey = partner?.primaryRoute || 'personal_restore';

  const primaryDashboardAlert = useMemo(() => {
    if (restoreAlert.show) return restoreAlert;
    if (courtPlanAlert.show) return courtPlanAlert;
    return null;
  }, [restoreAlert, courtPlanAlert]);

  const openPortalTab = (tab: string) => {
    navigate(PORTAL_TAB_PATHS[tab] || '/portal/dashboard');
  };

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
      subtitle="Scores, tasks, and restore readiness — aligned with your admin command view."
      hideHero={Boolean(partner)}
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
                      className={`${finelyOsCatalogCard(PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length])} w-full text-left !p-5 space-y-2`}
                      data-fc-accent={PARTNER_HUB_LAUNCHER_ACCENTS[idx % PARTNER_HUB_LAUNCHER_ACCENTS.length]}
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
        <div className={`${FINELY_OS_PAGE} fc-senior-simple`} data-fc-partner-portal="1">
          {isAdmin ? (
            <div className={`${finelyOsCatalogCard('violet')} !p-3 flex flex-wrap items-center justify-between gap-2`}>
              <div>
                <div className={FINELY_OS_ENTITY_LABEL}>Admin — viewing as partner</div>
                <div className={`${FINELY_OS_ENTITY_VALUE} text-base`}>{partner.profile.fullName || partner.id}</div>
              </div>
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

          <div className="fc-admin-dark-glass-surface rounded-2xl border border-white/10 p-1 sm:p-2">
            <PartnerOverviewTab
              variant="portal"
              partner={partner}
              profileRouteKey={profileRouteKey}
              mailingSummary={mailingSummary}
              emptyCustomFieldSections={0}
              reportsCount={reports.length}
              evidenceCount={evidence.length}
              lettersCount={letters.length}
              debtCasesCount={debtCases.length}
              overallScore={overallScore}
              openPartnerTasksCount={openTasks.length}
              openPartnerCasesCount={openCases.length}
              latestScoresRows={latestScoresRows}
              onStatusChange={() => undefined}
              onOpenProfile={() => openPortalTab('profile')}
              onOpenTab={openPortalTab}
              onNavigate={(path) => navigate(path)}
              activityItems={portalActivityItems}
              readinessSlot={
                <ProfileGoalsReadinessPanel partner={partner} overallScore={overallScore} onSaved={() => refresh()} />
              }
            />
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

          <FinelyOsPageFooter />
        </div>
      )}
    </PageShell>
  );
}
