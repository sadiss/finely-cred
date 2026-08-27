import { useEffect, useMemo, useState } from 'react';
import { fetchAllPartnersAsAdmin } from '../../../data/partnersRepo';
import { listCases } from '../../../data/casesRepo';
import { listLeadCaptures } from '../../../data/leadsRepo';
import { listTasks } from '../../../data/tasksRepo';
import { listReportsByPartner } from '../../../data/reportsRepo';
import { listLettersByPartner } from '../../../data/lettersRepo';
import { countSlaBreaches } from '../../work/sla/listSlaBreaches';
import { unreadCount } from '../../../data/notificationsRepo';
import { bucketCountsByDay } from '../../../utils/timeSeries';
import { getActiveTenantId } from '../../../tenancy/activeTenant';
import { useAuth } from '../../../auth/AuthProvider';
import {
  canManageTeam,
  canUseFinanceTools,
  canViewAllClients,
  getMembershipByUserAndTenant,
  isPlatformAdmin,
} from '../../../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../../../domain/tenants';
import { isAdminEmail } from '../../../auth/admin';
import { listCommsSends, listCommsTemplates } from '../../../data/commsRepo';
import { listCommsSequences } from '../../../data/commsSequencesRepo';
import { getGoLivePillars } from '../../../lib/goLiveCommandOps';
import { buildAdminModuleCatalog, type AdminDashboardStats } from '../data/adminDashboardModuleCatalog';

export function useAdminDashboardData() {
  const auth = useAuth();
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsKey, setStatsKey] = useState(0);
  const [stats, setStats] = useState<AdminDashboardStats>({
    partnersCount: 0,
    casesCount: 0,
    openCasesCount: 0,
    leadsCount: 0,
    openTasksCount: 0,
    adminUnread: 0,
    partnersMissingReport: 0,
    lettersThisWeek: 0,
    slaBreaches: 0,
    labels14: [],
    leads14: [],
    tasks14: [],
    cases14: [],
  });

  const commsOps = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const sends = listCommsSends(400);
    const recent = sends.filter((s) => Date.parse(s.createdAt) >= weekAgo);
    return {
      templates: listCommsTemplates().length,
      sequences: listCommsSequences().length,
      sendsWeek: recent.length,
      failedWeek: recent.filter((s) => s.status === 'error').length,
    };
  }, [statsKey]);

  useEffect(() => {
    setStatsError(null);
    setStatsLoading(true);
    fetchAllPartnersAsAdmin()
      .then((partners) => {
        const partnerIdSet = new Set(partners.map((p) => p.id));
        const cases = listCases();
        const tenantCases = cases.filter((c) => partnerIdSet.has(c.partnerId));
        const openCases = tenantCases.filter((c) => c.status === 'open');
        const leads = listLeadCaptures();
        const tasks = listTasks();
        const tenantTasks = tasks.filter((t: { partnerId?: string }) => partnerIdSet.has(String(t.partnerId || '')));
        const openTasks = tenantTasks.filter(
          (t: { status?: string }) => t.status === 'pending' || t.status === 'in_progress',
        );
        const adminUnread = unreadCount({ audience: 'admin' });
        const leads14 = bucketCountsByDay({ items: leads, getIso: (l) => (l as { createdAt?: string }).createdAt ?? '', days: 14 });
        const tasks14 = bucketCountsByDay({ items: tenantTasks, getIso: (t) => (t as { createdAt?: string }).createdAt ?? '', days: 14 });
        const cases14 = bucketCountsByDay({ items: tenantCases, getIso: (c) => (c as { createdAt?: string }).createdAt ?? '', days: 14 });
        const partnersMissingReport = partners.filter((p) => listReportsByPartner(p.id).length === 0).length;
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const lettersThisWeek = partners.reduce(
          (acc, p) => acc + listLettersByPartner(p.id).filter((l) => Date.parse(l.createdAt) >= weekAgo).length,
          0,
        );
        const slaBreaches = countSlaBreaches(partnerIdSet);
        setStats({
          partnersCount: partners.length,
          casesCount: tenantCases.length,
          openCasesCount: openCases.length,
          leadsCount: leads.length,
          openTasksCount: openTasks.length,
          adminUnread,
          partnersMissingReport,
          lettersThisWeek,
          slaBreaches,
          labels14: leads14.labels,
          leads14: leads14.values,
          tasks14: tasks14.values,
          cases14: cases14.values,
        });
        setStatsLoading(false);
      })
      .catch((e: unknown) => {
        setStatsError((e as Error)?.message || 'Could not load admin dashboard stats.');
        setStatsLoading(false);
      });
  }, [auth.user, statsKey]);

  const goLiveBlocked = useMemo(
    () => getGoLivePillars().filter((p) => p.tone === 'blocked' && p.id !== 'tour_voice').length,
    [],
  );

  const opsCaps = useMemo(() => {
    const tenantId = getActiveTenantId();
    const u = auth.user;
    if (!u) {
      return { canManageTeam: false, canManageTenants: false, canViewAllCustomers: false, canUseFinanceTools: false };
    }
    if (isAdminEmail(u.email)) {
      return { canManageTeam: true, canManageTenants: true, canViewAllCustomers: true, canUseFinanceTools: true };
    }
    const membership =
      getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
    const ok = membership?.status === 'active' && (isPlatformAdmin(membership) || membership.role === 'tenant_owner');
    return {
      canManageTeam: ok || canManageTeam(membership),
      canManageTenants: ok,
      canViewAllCustomers: ok || canViewAllClients(membership),
      canUseFinanceTools: ok || canUseFinanceTools(membership),
    };
  }, [auth.user]);

  const { featured, grouped } = useMemo(
    () => buildAdminModuleCatalog(stats, opsCaps),
    [stats, opsCaps],
  );

  const primaryCtaPath = '/admin/workflow';
  const primaryCtaLabel =
    stats.slaBreaches > 0
      ? 'Clear SLA breaches'
      : stats.adminUnread > 0
        ? 'Open ops command'
        : 'Ops command center';

  return {
    stats,
    statsError,
    statsLoading,
    statsKey,
    retryStats: () => setStatsKey((k) => k + 1),
    commsOps,
    goLiveBlocked,
    opsCaps,
    featured,
    grouped,
    primaryCtaPath,
    primaryCtaLabel,
  };
}
