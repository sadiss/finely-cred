import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bell, ListChecks, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listNotifications, markAllRead, markNotificationRead } from '../../data/notificationsRepo';
import { listTasks, setTaskStatus } from '../../data/tasksRepo';
import { getPartner } from '../../data/partnersRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { ActionLink, Button, CollapsibleSection } from '../../components/ui';
import { listMemberships } from '../../data/tenantsRepo';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminWorkflowQueuePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [showAllUnread, setShowAllUnread] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'unassigned' | string>('all');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const tenantId = getActiveTenantId();
    const u = auth.user;
    if (!u) { setPartnerIds(new Set()); return; }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then(setPartnerIds);
  }, [auth.user, version]);

  const unread = useMemo(() => {
    const all = listNotifications({ audience: 'admin', unreadOnly: true, limit: 200 });
    return all.filter((n) => !n.partnerId || partnerIds.has(n.partnerId));
  }, [partnerIds, version]);
  const recent = useMemo(() => {
    const all = listNotifications({ audience: 'admin', limit: 60 });
    return all.filter((n) => !n.partnerId || partnerIds.has(n.partnerId));
  }, [partnerIds, version]);

  const openTasks = useMemo(() => {
    const all = listTasks();
    return all
      .filter((t) => (!t.partnerId ? false : partnerIds.has(t.partnerId)))
      .filter((t) => t.status === 'pending' || t.status === 'in_progress')
      .filter((t) => {
        if (assigneeFilter === 'all') return true;
        const ids = Array.isArray((t as any).assigneeUserIds) ? ((t as any).assigneeUserIds as string[]) : [];
        if (assigneeFilter === 'unassigned') return ids.length === 0;
        return ids.includes(assigneeFilter);
      })
      .slice()
      .sort((a, b) => (a.dueAt || a.createdAt).localeCompare(b.dueAt || b.createdAt));
  }, [partnerIds, version, assigneeFilter]);

  const team = useMemo(() => {
    const tenantId = getActiveTenantId();
    return listMemberships(tenantId)
      .filter((m) => m.status === 'active')
      .filter((m) => m.role !== 'partner')
      .sort((a, b) => a.email.localeCompare(b.email));
  }, [version]);

  const UNREAD_LIMIT = 6;
  const TASKS_LIMIT = 6;
  const RECENT_LIMIT = 9;

  return (
    <PageShell badge="Admin" title="Workflow Queue" subtitle="Ops view: unread alerts + open partner tasks in one place.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ActionLink to="/admin" icon={<ArrowLeft size={16} />}>
            Admin Dashboard
          </ActionLink>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              markAllRead({ audience: 'admin' });
              setVersion((v) => v + 1);
            }}
            disabled={unread.length === 0}
          >
            Mark all read
          </Button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <CollapsibleSection
              title="Unread alerts"
              subtitle="What needs attention right now."
              count={`${unread.length} unread`}
              defaultOpen
              storageKey="admin.workflow.unread"
            >
              <div className="space-y-4">
                {unread.length === 0 ? (
                  <div className="text-white/60 text-sm">All caught up.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                  {(showAllUnread ? unread : unread.slice(0, UNREAD_LIMIT)).map((n) => {
                    const p = n.partnerId ? getPartner(n.partnerId) : null;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.href) navigate(n.href);
                          setVersion((v) => v + 1);
                        }}
                        className="w-full text-left rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 transition-all p-4 min-h-[132px]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{n.title}</div>
                            {n.body && <div className="mt-1 text-white/70 text-sm whitespace-pre-wrap">{n.body}</div>}
                            <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                              {n.kind} • {p?.profile.fullName ?? n.partnerId ?? 'system'} • {fmtWhen(n.createdAt)}
                            </div>
                          </div>
                          <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest">
                            New
                          </span>
                        </div>
                      </button>
                    );
                  })
                  }</div>
                )}
              </div>

              {unread.length > UNREAD_LIMIT ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllUnread((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    title={showAllUnread ? 'Show fewer alerts' : 'Show all alerts'}
                  >
                    {showAllUnread ? 'Show less' : `Show all (${unread.length})`}
                  </button>
                </div>
              ) : null}
            </CollapsibleSection>
          </div>

          <div className="lg:col-span-6">
            <CollapsibleSection
              title="Open tasks"
              subtitle="Cross-partner work items (pending + in progress)."
              count={`${openTasks.length} open`}
              defaultOpen
              storageKey="admin.workflow.tasks"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Filter by assignee</div>
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
                  title="Assignee filter"
                >
                  <option value="all">All</option>
                  <option value="unassigned">Unassigned</option>
                  {team.slice(0, 20).map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-4">
                {openTasks.length === 0 ? (
                  <div className="text-white/60 text-sm">No open tasks right now.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                  {(showAllTasks ? openTasks : openTasks.slice(0, TASKS_LIMIT)).map((t) => {
                    const p = getPartner(t.partnerId);
                    const due = t.dueAt ? new Date(t.dueAt) : null;
                    return (
                      <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 min-h-[132px]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{t.title}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                              {p?.profile.fullName ?? t.partnerId} • {t.kind} • {t.status}
                              {due ? ` • due ${due.toLocaleDateString()}` : ''}
                            </div>
                            {t.notes && <div className="mt-2 text-white/70 text-sm whitespace-pre-wrap">{t.notes}</div>}
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/partners/${t.partnerId}`)}
                              className="fc-action-link fc-focus-ring"
                            >
                              Open partner <ArrowRight size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTaskStatus(t.id, 'completed');
                                setVersion((v) => v + 1);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition-all"
                            >
                              <CheckCircle2 size={14} /> Done
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>

              {openTasks.length > TASKS_LIMIT ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllTasks((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    title={showAllTasks ? 'Show fewer tasks' : 'Show all tasks'}
                  >
                    {showAllTasks ? 'Show less' : `Show all (${openTasks.length})`}
                  </button>
                </div>
              ) : null}
            </CollapsibleSection>
          </div>
        </div>

        <CollapsibleSection
          title="Recent activity"
          subtitle="All admin-facing notifications (most recent first)."
          count={`${Math.min(12, recent.length)} shown`}
          defaultOpen={false}
          storageKey="admin.workflow.recent"
        >
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(showAllRecent ? recent : recent.slice(0, RECENT_LIMIT)).map((n) => (
                <div key={n.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 min-h-[120px]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{n.title}</div>
                      {n.body && <div className="mt-1 text-white/70 text-sm whitespace-pre-wrap">{n.body}</div>}
                      <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {n.kind} • {fmtWhen(n.createdAt)} {n.readAt ? '• read' : '• unread'}
                      </div>
                    </div>
                    {n.href && (
                      <button type="button" onClick={() => navigate(n.href!)} className="fc-action-link fc-focus-ring">
                        Open <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {recent.length > RECENT_LIMIT ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAllRecent((v) => !v)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  title={showAllRecent ? 'Show fewer items' : 'Show all recent activity'}
                >
                  {showAllRecent ? 'Show less' : `Show all (${recent.length})`}
                </button>
              </div>
            ) : null}
          </div>
        </CollapsibleSection>
      </div>
    </PageShell>
  );
}

