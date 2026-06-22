import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  FolderKanban,
  Inbox,
  ListChecks,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listNotifications, markAllRead, markNotificationRead } from '../../data/notificationsRepo';
import { listTasks, setTaskStatus } from '../../data/tasksRepo';
import { listProjects } from '../../data/projectsRepo';
import { listProspects } from '../../data/crmProspectsRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { getLeadOp } from '../../data/leadOpsRepo';
import { listPartnersByTenant } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import type { TaskItem } from '../../domain/tasks';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { listMemberships } from '../../data/tenantsRepo';
import { listCrmRecords } from '../../data/crmRecordsRepo';
import { buildDailyBriefing } from '../../features/ai/briefing/buildDailyBriefing';
import { OpsBriefingPanel } from '../../features/inbox/OpsBriefingPanel';
import { OpsPlatformCronHealthPanel } from '../../features/inbox/OpsPlatformCronHealthPanel';
import { listAllSlaBreaches } from '../../features/work/sla/listSlaBreaches';
import { SlaBreachesPanel } from '../../features/work/sla/SlaBreachesPanel';
import { buildWeeklyWorkDigest } from '../../features/work/digest/buildWeeklyWorkDigest';
import { WorkWeeklyDigestPanel } from '../../features/work/components/WorkWeeklyDigestPanel';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FINELY_OS_BACK_LINK, FINELY_OS_ENTITY_ACCENT_LINK, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SELECT, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_PAGE, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN, FINELY_OS_SUCCESS_BTN, FINELY_OS_TOOLBAR, finelyOsInlineListItem, finelyOsStatusChip } from '../../features/os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildAdminNoticedItems } from '../../lib/finelyProactiveSignals';
import { listOpenValidationClocks } from '../../lib/validationLetterEngine';
import { listDisputeOpsAttentionRows } from '../../lib/disputeOpsSummary';
import { AdminValidationClocksPanel } from '../../features/debt/AdminValidationClocksPanel';
import { AdminDisputeOpsPanel } from '../../features/debt/AdminDisputeOpsPanel';

type InboxTab = 'triage' | 'tasks' | 'crm' | 'activity';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function isOverdue(t: TaskItem) {
  if (!t.dueAt) return false;
  if (t.status === 'completed' || t.status === 'cancelled') return false;
  return Date.parse(t.dueAt) < Date.now();
}

function priorityWeight(p?: string) {
  if (p === 'urgent') return 4;
  if (p === 'high') return 3;
  if (p === 'normal') return 2;
  return 1;
}

export default function AdminWorkflowQueuePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<InboxTab>('triage');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'unassigned' | string>('all');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  const [partners, setPartners] = useState<Partner[]>([]);
  useEffect(() => {
    const tenantId = getActiveTenantId();
    const u = auth.user;
    if (!u) {
      setPartnerIds(new Set());
      setPartners([]);
      return;
    }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then((allowed) => {
      setPartnerIds(allowed);
      listPartnersByTenant(tenantId).then((all) => setPartners(all.filter((p) => allowed.has(p.id))));
    });
  }, [auth.user, version]);
  const partnerById = useMemo(() => new Map(partners.map((p) => [p.id, p])), [partners]);

  const projects = useMemo(() => listProjects().filter((p) => partnerIds.has(p.partnerId)), [partnerIds, version]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const unread = useMemo(() => {
    const all = listNotifications({ audience: 'admin', unreadOnly: true, limit: 200 });
    return all.filter((n) => !n.partnerId || partnerIds.has(n.partnerId));
  }, [partnerIds, version]);

  const recent = useMemo(() => {
    const all = listNotifications({ audience: 'admin', limit: 80 });
    return all.filter((n) => !n.partnerId || partnerIds.has(n.partnerId));
  }, [partnerIds, version]);

  const openTasks = useMemo(() => {
    const all = listTasks();
    return all
      .filter((t) => t.partnerId && partnerIds.has(t.partnerId))
      .filter((t) => t.status === 'pending' || t.status === 'in_progress')
      .filter((t) => {
        if (assigneeFilter === 'all') return true;
        const ids = t.assigneeUserIds ?? [];
        if (assigneeFilter === 'unassigned') return ids.length === 0;
        return ids.includes(assigneeFilter);
      })
      .slice()
      .sort((a, b) => {
        const od = Number(isOverdue(b)) - Number(isOverdue(a));
        if (od !== 0) return od;
        const pw = priorityWeight(b.priority) - priorityWeight(a.priority);
        if (pw !== 0) return pw;
        return (a.dueAt || a.createdAt).localeCompare(b.dueAt || b.createdAt);
      });
  }, [partnerIds, version, assigneeFilter]);

  const overdueTasks = useMemo(() => openTasks.filter(isOverdue), [openTasks]);
  const unassignedTasks = useMemo(
    () => openTasks.filter((t) => !(t.assigneeUserIds ?? []).length),
    [openTasks],
  );
  const urgentTasks = useMemo(() => openTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high'), [openTasks]);

  const crmDueProspects = useMemo(() => {
    return listProspects({ stage: 'all', target: 'all' }).filter((p) => {
      const due = p.nextAction?.dueAt ? String(p.nextAction.dueAt) : '';
      if (!due) return false;
      const t = Date.parse(due);
      return Number.isFinite(t) && t <= Date.now() + 7 * 24 * 60 * 60 * 1000 && p.stage !== 'converted' && p.stage !== 'disqualified';
    });
  }, [version]);

  const newInboundLeads = useMemo(() => {
    return listLeadCaptures()
      .filter((l) => {
        const st = getLeadOp(l.id).stage;
        return st === 'new' || st === 'contacted';
      })
      .slice(0, 20);
  }, [version]);

  const workAtRiskRecords = useMemo(
    () => listCrmRecords().filter((r) => r.workSignals?.riskLevel === 'high' || r.workSignals?.riskLevel === 'medium').slice(0, 12),
    [version],
  );

  const team = useMemo(() => {
    const tenantId = getActiveTenantId();
    return listMemberships(tenantId)
      .filter((m) => m.status === 'active')
      .filter((m) => m.role !== 'partner')
      .sort((a, b) => a.email.localeCompare(b.email));
  }, [version]);

  const triageCount = unread.length + overdueTasks.length + crmDueProspects.length + workAtRiskRecords.length;

  const slaBreaches = useMemo(() => listAllSlaBreaches(partnerIds), [partnerIds, version]);
  const validationClockCount = useMemo(() => listOpenValidationClocks().length, [version]);
  const disputeFollowUpCount = useMemo(() => listDisputeOpsAttentionRows().length, [version]);

  const dailyBriefing = useMemo(
    () =>
      buildDailyBriefing({
        openTasks,
        crmRecords: listCrmRecords(),
        unreadCount: unread.length,
        slaBreaches,
      }),
    [openTasks, unread.length, slaBreaches, version],
  );

  const weeklyDigest = useMemo(
    () =>
      buildWeeklyWorkDigest({
        projects,
        tasks: listTasks().filter((t) => t.partnerId && partnerIds.has(t.partnerId)),
        slaBreaches,
      }),
    [projects, partnerIds, slaBreaches, version],
  );

  const renderTaskCard = (t: TaskItem) => {
    const p = partnerById.get(t.partnerId);
    const proj = t.projectId ? projectById.get(t.projectId) : null;
    const overdue = isOverdue(t);
    return (
      <div
        key={t.id}
        className={`rounded-2xl border p-4 transition-all shadow-sm ${
          overdue ? 'border-rose-500/30 bg-rose-500/10' : finelyOsInlineListItem()
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`${FINELY_OS_ENTITY_VALUE} font-semibold truncate`}>{t.title}</span>
              {t.priority === 'urgent' || t.priority === 'high' ? (
                <span className={finelyOsStatusChip('warn')}>{t.priority}</span>
              ) : null}
              {overdue ? (
                <span className={finelyOsStatusChip('blocked')}>Overdue</span>
              ) : null}
            </div>
            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} truncate`}>
              {p?.profile.fullName ?? t.partnerId}
              {proj ? ` • ${proj.title}` : ''} • {t.kind} • {t.status}
              {t.dueAt ? ` • due ${new Date(t.dueAt).toLocaleDateString()}` : ''}
            </div>
            {t.notes ? <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{t.notes}</p> : null}
          </div>
          <div className="shrink-0 flex flex-col gap-2">
            {t.projectId ? (
              <button type="button" onClick={() => navigate(`/admin/projects/${t.projectId}`)} className={FINELY_OS_SECONDARY_BTN}>
                Project <ArrowRight size={12} className="inline" />
              </button>
            ) : (
              <button type="button" onClick={() => navigate(`/admin/partners/${t.partnerId}`)} className={FINELY_OS_SECONDARY_BTN}>
                Partner <ArrowRight size={12} className="inline" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setTaskStatus(t.id, 'completed');
                setVersion((v) => v + 1);
              }}
              className={FINELY_OS_SUCCESS_BTN}
            >
              <CheckCircle2 size={12} /> Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageShell
      badge="Admin"
      title="Ops command center"
      subtitle="Alerts first — SLA breaches, triage queue, and acquisition pulse. Support messages live in Support Inbox."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/admin/tasks')} className={FINELY_OS_SECONDARY_BTN}>
              <ListChecks size={14} className="inline mr-1" /> Tasks board
            </button>
            <button type="button" onClick={() => navigate('/admin/projects')} className={FINELY_OS_SUCCESS_BTN}>
              <FolderKanban size={14} className="inline mr-1" /> Projects
            </button>
            <button type="button" onClick={() => navigate('/admin/crm')} className={FINELY_OS_PRIMARY_BTN}>
              <Target size={14} className="inline mr-1" /> CRM
            </button>
            <button
              type="button"
              disabled={unread.length === 0}
              onClick={() => {
                markAllRead({ audience: 'admin' });
                setVersion((v) => v + 1);
              }}
              className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-40`}
            >
              Mark all read
            </button>
          </div>
        </div>

        <FinelyNoticedStrip
          items={buildAdminNoticedItems({
            slaBreaches: slaBreaches.length,
            partnersWithoutReports: 0,
            openCases: openTasks.length,
            validationClocks: validationClockCount,
            disputeFollowUps: disputeFollowUpCount,
          })}
        />
        <FinelyNowDoThisStrip currentIndex={slaBreaches.length > 0 ? 1 : 0} />

        <FinelyUnifiedHubLayout
          eyebrow="Ops command center"
          title="Triage first — alerts, tasks & CRM pulse"
          subtitle="SLA breaches, weekly digest, and acquisition follow-ups. Partner messages live in Support Inbox."
          accent="emerald"
          kpis={[
            { label: 'Needs triage', value: String(triageCount), hint: 'Action now', accent: 'fuchsia' },
            { label: 'SLA breaches', value: String(slaBreaches.length), hint: 'Work OS', accent: 'rose' },
            { label: 'Unread alerts', value: String(unread.length), hint: 'Notifications', accent: 'violet' },
            { label: 'Overdue tasks', value: String(overdueTasks.length), hint: 'Open queue', accent: 'amber' },
          ]}
          tabs={[
            { id: 'triage', label: 'Triage', badge: triageCount || undefined },
            { id: 'tasks', label: 'Task queue', badge: openTasks.length || undefined },
            { id: 'crm', label: 'CRM pulse', badge: crmDueProspects.length + newInboundLeads.length + workAtRiskRecords.length || undefined },
            { id: 'activity', label: 'Activity', badge: recent.length || undefined },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as InboxTab)}
          primaryAction={{ label: 'CRM workspace', onClick: () => navigate('/admin/crm') }}
          secondaryAction={{ label: 'Tasks board', onClick: () => navigate('/admin/tasks') }}
        >
        {tab === 'triage' && (
          <div className="space-y-4">
            <OpsPlatformCronHealthPanel />
            <OpsBriefingPanel briefing={dailyBriefing} />
            <WorkWeeklyDigestPanel digest={weeklyDigest} />
            <div className="grid lg:grid-cols-2 gap-6">
              <AdminValidationClocksPanel />
              <AdminDisputeOpsPanel />
            </div>
            <SlaBreachesPanel breaches={slaBreaches} />
          <div className="grid lg:grid-cols-2 gap-6">
            <section className="space-y-3">
              <h3 className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE} flex items-center gap-2`}>
                <Bell size={16} className="text-fuchsia-400" /> Unread alerts
              </h3>
              <FinelyOsPaginatedStack
                items={unread}
                pageSize={6}
                emptyMessage="All caught up on alerts."
                renderItem={(n) => {
                  const p = n.partnerId ? partnerById.get(n.partnerId) : null;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.href) navigate(n.href);
                        setVersion((v) => v + 1);
                      }}
                      className="w-full text-left rounded-xl border border-fuchsia-500/35 bg-fuchsia-500/10 hover:bg-fuchsia-500/15 p-4 transition-all"
                    >
                      <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{n.title}</div>
                      {n.body ? <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{n.body}</p> : null}
                      <p className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                        {p?.profile.fullName ?? 'System'} • {fmtWhen(n.createdAt)}
                      </p>
                    </button>
                  );
                }}
              />
            </section>
            <section className="space-y-3">
              <h3 className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE} flex items-center gap-2`}>
                <AlertTriangle size={16} className="text-rose-600" /> At-risk tasks
              </h3>
              <FinelyOsPaginatedStack
                items={[...overdueTasks, ...urgentTasks.filter((t) => !overdueTasks.some((o) => o.id === t.id))]}
                pageSize={6}
                emptyMessage="No overdue or high-priority tasks."
                renderItem={(t) => renderTaskCard(t)}
              />
            </section>
          </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="space-y-4">
            <div className={`${FINELY_OS_TOOLBAR} justify-between`}>
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>Open tasks across all partners — use the full Tasks board to edit, assign, and organize.</p>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className={FINELY_OS_ENTITY_SELECT}
              >
                <option value="all">All assignees</option>
                <option value="unassigned">Unassigned only</option>
                {team.slice(0, 25).map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.email}
                  </option>
                ))}
              </select>
            </div>
            <FinelyOsPaginatedStack
              items={openTasks}
              pageSize={8}
              emptyMessage="No open tasks."
              renderItem={(t) => (
                <div key={t.id} className="md:col-span-1">{renderTaskCard(t)}</div>
              )}
            />
          </div>
        )}

        {tab === 'crm' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <section className="space-y-3 lg:col-span-2">
              <h3 className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE} flex items-center gap-2`}>
                <AlertTriangle size={16} className="text-rose-600" /> CRM — Work OS at risk
              </h3>
              <FinelyOsPaginatedStack
                items={workAtRiskRecords}
                pageSize={4}
                emptyMessage="No linked customers with Work idle or SLA risk."
                renderItem={(r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => navigate(`/admin/crm/records/${encodeURIComponent(r.id)}`)}
                    className={`w-full text-left rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15 p-4 transition-all`}
                  >
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold truncate`}>{r.contact.fullName || r.contact.email || r.id}</div>
                    <p className={`mt-1 text-xs text-rose-200`}>
                      Idle {Math.round(r.workSignals!.idleDays)}d · {r.workSignals!.slaBreachCount} SLA · {r.workSignals!.riskLevel}
                    </p>
                  </button>
                )}
              />
            </section>
            <section className="space-y-3">
              <h3 className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE} flex items-center gap-2`}>
                <Clock size={16} className="text-sky-600" /> Prospects — next action due (7 days)
              </h3>
              <FinelyOsPaginatedStack
                items={crmDueProspects}
                pageSize={6}
                emptyMessage="No prospect follow-ups due this week."
                renderItem={(p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigate(`/admin/crm/records/crm_prospect_${encodeURIComponent(p.id)}`)}
                    className={`w-full text-left rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/15 p-4 transition-all`}
                  >
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{p.company?.name || p.contact?.emails?.[0] || p.id}</div>
                    <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{p.nextAction?.label ?? 'Follow up'}</p>
                    <p className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>{p.stage} • score {p.score ?? '—'}</p>
                  </button>
                )}
              />
            </section>
            <section className="space-y-3">
              <h3 className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE} flex items-center gap-2`}>
                <Inbox size={16} className="text-emerald-600" /> New inbound leads
              </h3>
              <FinelyOsPaginatedStack
                items={newInboundLeads}
                pageSize={6}
                emptyMessage="No new inbound leads."
                renderItem={(l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => navigate(`/admin/crm/records/crm_lead_${encodeURIComponent(l.id)}`)}
                    className={`w-full text-left rounded-xl ${finelyOsInlineListItem()} hover:border-emerald-500/30 p-4 transition-all`}
                  >
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{l.fullName || l.email}</div>
                    <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{l.interest ?? l.offer} • {l.source}</p>
                    <p className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>{fmtWhen(l.createdAt)}</p>
                  </button>
                )}
              />
              <button type="button" onClick={() => navigate('/admin/crm')} className={FINELY_OS_SECONDARY_BTN}>
                Open CRM <ArrowRight size={12} className="inline" />
              </button>
            </section>
          </div>
        )}

        {tab === 'activity' && (
          <FinelyOsPaginatedStack
            items={recent}
            pageSize={9}
            emptyMessage="No recent activity."
            renderItem={(n) => (
              <div key={n.id} className={`rounded-xl ${finelyOsInlineListItem()} p-4`}>
                <div className={`${FINELY_OS_ENTITY_VALUE} font-medium text-sm truncate`}>{n.title}</div>
                {n.body ? <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{n.body}</p> : null}
                <p className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} uppercase`}>{fmtWhen(n.createdAt)} {n.readAt ? '• read' : '• unread'}</p>
                {n.href ? (
                  <button type="button" onClick={() => navigate(n.href!)} className={`mt-2 text-[10px] font-bold uppercase ${FINELY_OS_ENTITY_ACCENT_LINK}`}>
                    Open <ArrowRight size={12} className="inline" />
                  </button>
                ) : null}
              </div>
            )}
          />
        )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
