import React, { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { KpiCard } from '../../components/ui/KpiCards';
import { bucketCountsByDay } from '../../utils/timeSeries';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listTasks } from '../../data/tasksRepo';
import { listCases } from '../../data/casesRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [stats, setStats] = useState({
    leadsCount: 0, tasksCount: 0, openTasksCount: 0, casesCount: 0, openCasesCount: 0,
    leads14: [] as number[], tasks14: [] as number[], cases14: [] as number[],
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
        leadsCount: leads.length, tasksCount: tasks.length, openTasksCount: openTasks.length,
        casesCount: cases.length, openCasesCount: openCases.length,
        leads14: bucketCountsByDay({ items: leads, getIso: (l) => (l as any).createdAt, days: 14 }).values,
        tasks14: bucketCountsByDay({ items: tasks, getIso: (t) => (t as any).createdAt, days: 14 }).values,
        cases14: bucketCountsByDay({ items: cases, getIso: (c) => (c as any).createdAt, days: 14 }).values,
      });
    });
  }, [auth.user]);

  return (
    <PageShell badge="Admin" title="Analytics" subtitle="High-signal operational visibility (tenant-scoped where applicable).">
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          title="Back to Admin Dashboard"
        >
          <ArrowLeft size={16} /> Admin dashboard
        </button>

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
          <div className="inline-flex items-center gap-2 text-amber-300">
            <BarChart3 size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Ops snapshot</span>
          </div>
          <div className="mt-2 text-white/60 text-sm">
            This dashboard is intentionally simple: it’s here to answer “what’s happening right now?” without hunting through tabs.
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-4">
          <KpiCard label="Leads" value={stats.leadsCount} hint="Total captured" tone="violet" series={stats.leads14} />
          <KpiCard label="Tasks" value={stats.tasksCount} hint="Total" tone="amber" series={stats.tasks14} />
          <KpiCard label="Open tasks" value={stats.openTasksCount} hint="Pending + in progress" tone="amber" />
          <KpiCard label="Cases" value={stats.casesCount} hint="Total" tone="emerald" series={stats.cases14} />
          <KpiCard label="Open cases" value={stats.openCasesCount} hint="Active disputes" tone="emerald" />
        </div>
      </div>
    </PageShell>
  );
}

