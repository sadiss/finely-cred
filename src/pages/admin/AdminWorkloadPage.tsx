import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { listTasks } from '../../data/tasksRepo';
import { listProjects } from '../../data/projectsRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import type { TaskItem } from '../../domain/tasks';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FINELY_OS_BANNER, FINELY_OS_BACK_LINK, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_KPI_ACCENTS, FINELY_OS_PAGE, finelyOsInlineListItem } from '../../features/os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';

function assigneeKey(t: TaskItem): string {
  const uid = t.assigneeUserIds?.[0];
  if (uid) return `user:${uid}`;
  if (t.assignedTo === 'admin') return 'role:admin';
  if (t.assignedTo === 'partner') return 'role:partner';
  return 'unassigned';
}

function assigneeLabel(key: string): string {
  if (key === 'unassigned') return 'Unassigned';
  if (key === 'role:admin') return 'Admin ops';
  if (key === 'role:partner') return 'Partner';
  return key.replace('user:', 'User ');
}

export default function AdminWorkloadPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) {
      setPartnerIds(new Set());
      return;
    }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then(setPartnerIds);
  }, [auth.user, version]);

  const projectById = useMemo(() => new Map(listProjects().map((p) => [p.id, p])), [version]);

  const openTasks = useMemo(() => {
    return listTasks()
      .filter((t) => partnerIds.has(t.partnerId))
      .filter((t) => t.status === 'pending' || t.status === 'in_progress');
  }, [partnerIds, version]);

  const byAssignee = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    for (const t of openTasks) {
      const key = assigneeKey(t);
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [openTasks]);

  return (
    <PageShell badge="Admin" title="Workload" subtitle="Open tasks by assignee — Finely OS 400% ops capacity view.">
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/admin/projects')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Projects
        </button>

        <div className={FINELY_OS_BANNER}>
          <Users className="text-emerald-400 shrink-0 mt-0.5" size={18} />
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Capacity view by assignee lane — paginated task lists, no scroll traps. Jump to project workspace from any row.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'Open tasks', value: openTasks.length, accent: 0 },
            { label: 'Assignee lanes', value: byAssignee.length, accent: 1 },
            { label: 'Unassigned', value: openTasks.filter((t) => assigneeKey(t) === 'unassigned').length, accent: 4, tone: 'text-violet-300' },
          ].map((m) => (
            <div key={m.label} className={`rounded-xl border p-4 shadow-sm ${FINELY_OS_KPI_ACCENTS[m.accent % FINELY_OS_KPI_ACCENTS.length]}`}>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px] font-bold uppercase tracking-wider`}>{m.label}</div>
              <div className={`text-3xl font-bold mt-1 ${m.tone ?? FINELY_OS_ENTITY_VALUE}`}>{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {byAssignee.map(([key, tasks], laneIdx) => (
            <div key={key} className={`rounded-2xl border p-4 shadow-sm ${FINELY_OS_KPI_ACCENTS[laneIdx % FINELY_OS_KPI_ACCENTS.length]}`}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-emerald-400" />
                <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{assigneeLabel(key)}</span>
                <span className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>({tasks.length})</span>
              </div>
              <FinelyOsPaginatedStack
                items={tasks}
                pageSize={6}
                emptyMessage="No tasks in this lane."
                renderItem={(t) => {
                  const proj = t.projectId ? projectById.get(t.projectId) : null;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => navigate(t.projectId ? `/admin/projects/${t.projectId}?task=${t.id}` : '/admin/projects')}
                      className={`w-full text-left px-3 py-2 ${finelyOsInlineListItem()}`}
                    >
                      <div className={`text-sm font-medium ${FINELY_OS_ENTITY_VALUE} truncate`}>{t.title}</div>
                      <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} truncate`}>
                        {proj?.title ?? 'No project'} • {t.priority ?? 'normal'}
                        {t.dueAt ? ` • due ${new Date(t.dueAt).toLocaleDateString()}` : ''}
                      </div>
                    </button>
                  );
                }}
              />
            </div>
          ))}
        </div>
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}
