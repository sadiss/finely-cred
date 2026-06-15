import React, { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, Briefcase, Target, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listTasks } from '../../data/tasksRepo';
import { listCases } from '../../data/casesRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [stats, setStats] = useState({
    leadsCount: 0,
    tasksCount: 0,
    openTasksCount: 0,
    casesCount: 0,
    openCasesCount: 0,
  });

  useEffect(() => {
    const tenantId = getActiveTenantId();
    const u = auth.user;
    const pidsPromise = u
      ? getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId })
      : Promise.resolve(new Set<string>());
    pidsPromise.then((partnerIds) => {
      const leads = listLeadCaptures();
      const tasks = listTasks().filter((t: any) => partnerIds.has(String((t as any).partnerId || '')));
      const cases = listCases().filter((c) => partnerIds.has(c.partnerId));
      const openTasks = tasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress');
      const openCases = cases.filter((c) => c.status === 'open');
      setStats({
        leadsCount: leads.length,
        tasksCount: tasks.length,
        openTasksCount: openTasks.length,
        casesCount: cases.length,
        openCasesCount: openCases.length,
      });
    });
  }, [auth.user]);

  return (
    <PageShell badge="Admin" title="Analytics" subtitle="High-signal operational visibility (tenant-scoped where applicable).">
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK} title="Back to Admin Dashboard">
          <ArrowLeft size={16} /> Admin dashboard
        </button>

        <div className={FINELY_OS_BANNER}>
          <BarChart3 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
          <p className={FINELY_OS_ENTITY_BODY}>
            Ops snapshot — answers “what’s happening right now?” without hunting through tabs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <FinelyOsOverviewStatTile icon={Users} label="Leads" value={stats.leadsCount} accent="violet" iconAccent="violet" hint="Total captured" />
          <FinelyOsOverviewStatTile icon={Target} label="Tasks" value={stats.tasksCount} accent="amber" iconAccent="amber" hint="Total" />
          <FinelyOsOverviewStatTile icon={Target} label="Open tasks" value={stats.openTasksCount} accent="amber" iconAccent="amber" hint="Pending + in progress" />
          <FinelyOsOverviewStatTile icon={Briefcase} label="Cases" value={stats.casesCount} accent="emerald" iconAccent="emerald" hint="Total" />
          <FinelyOsOverviewStatTile icon={Briefcase} label="Open cases" value={stats.openCasesCount} accent="emerald" iconAccent="emerald" hint="Active disputes" />
        </div>

        <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="violet">
          Tenant-scoped task and case counts respect your admin partner access. Lead captures are global to this browser store until Supabase sync is active.
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
