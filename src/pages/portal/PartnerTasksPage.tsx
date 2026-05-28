import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, ListChecks, PlayCircle, X } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { createTask, listTasksByPartner, setTaskStatus, upsertTask } from '../../data/tasksRepo';
import { addAuditEvent } from '../../data/auditRepo';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listNotifications, markAllRead, markNotificationRead, unreadCount } from '../../data/notificationsRepo';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { ActionLink, Button } from '../../components/ui';
import { KpiCard } from '../../components/ui/KpiCards';
import { listCustomFieldDefinitionsByScope } from '../../data/customFieldsRepo';
import { getFieldLayout } from '../../data/fieldLayoutsRepo';
import { getCustomFieldValues, upsertCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FieldLayoutRenderer } from '../../components/fields/FieldLayoutRenderer';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { getWorkboardSettings } from '../../data/settingsRepo';
import { TASK_PROGRESS_STAGES, WorkBoardShell, WorkCalendarView, WorkKanbanBoard, WorkListView, type WorkBoardItem } from '../../components/workboard';
import type { WorkStageDefinition } from '../../domain/settings';
import type { TaskStatus } from '../../domain/tasks';
import { addTaskComment, listCommentsByTask } from '../../data/taskCommentsRepo';
import { newId } from '../../utils/ids';
import { listProjectsByPartner, createProject } from '../../data/projectsRepo';
import { WorkItemCreateModal } from '../../components/workboard/WorkItemCreateModal';

export default function PartnerTasksPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const email = auth.user?.email || '';
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<'board' | 'activity'>('board');
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [scope, setScope] = useState<'personal' | 'business'>('personal');
  const [categoryStageFilter, setCategoryStageFilter] = useState<string | 'all'>('all');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const { partner } = usePartnerSession();

  const tasks = useMemo(() => {
    if (!partner) return [];
    return listTasksByPartner(partner.id).filter((t) => (t.assignedTo ?? 'both') !== 'admin');
  }, [partner, version]);

  const notifications = useMemo(() => {
    if (!partner) return [];
    return listNotifications({ partnerId: partner.id, audience: 'partner', limit: 80 });
  }, [partner, version]);

  const unread = useMemo(() => {
    if (!partner) return 0;
    return unreadCount({ partnerId: partner.id, audience: 'partner' });
  }, [partner, version]);

  const taskCategoryStages = useMemo(() => getWorkboardSettings().taskStages, [version]);
  const categoryLabelById = useMemo(() => new Map(taskCategoryStages.map((s) => [s.id, s.label])), [taskCategoryStages]);

  const scopedTasks = useMemo(() => {
    const base = tasks.filter((t) => (t.scope ?? 'personal') === scope);
    if (categoryStageFilter === 'all') return base;
    return base.filter((t) => String(t.stage ?? 'intake') === categoryStageFilter);
  }, [tasks, scope, categoryStageFilter]);
  const openTasks = useMemo(
    () => scopedTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress'),
    [scopedTasks],
  );
  const doneTasks = useMemo(() => scopedTasks.filter((t) => t.status === 'completed'), [scopedTasks]);
  const ACTIVITY_LIMIT = 18;
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [commentDraft, setCommentDraft] = useState('');

  useEffect(() => {
    if (!focusedTaskId) {
      const first = openTasks[0]?.id ?? doneTasks[0]?.id ?? null;
      if (first) setFocusedTaskId(first);
      return;
    }
    const stillExists = tasks.some((t) => t.id === focusedTaskId);
    if (!stillExists) {
      const fallback = openTasks[0]?.id ?? doneTasks[0]?.id ?? null;
      setFocusedTaskId(fallback);
    }
  }, [focusedTaskId, tasks.length, openTasks.length, doneTasks.length]);

  const focusedTask = useMemo(() => {
    if (!focusedTaskId) return null;
    return scopedTasks.find((t) => t.id === focusedTaskId) ?? null;
  }, [scopedTasks, focusedTaskId]);

  const focusedComments = useMemo(() => {
    if (!focusedTaskId) return [];
    return listCommentsByTask(focusedTaskId);
  }, [focusedTaskId, version]);

  const progressStages: WorkStageDefinition[] = useMemo(() => TASK_PROGRESS_STAGES, []);
  const tasksById = useMemo(() => new Map(scopedTasks.map((t) => [t.id, t])), [scopedTasks]);
  const taskItems: WorkBoardItem[] = useMemo(
    () =>
      scopedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: `${categoryLabelById.get(String(t.stage ?? 'intake')) ?? String(t.stage ?? 'intake')} • ${t.kind}`,
        stage: String(t.status ?? 'pending'),
        status: t.status,
        dueAt: t.dueAt,
        updatedAt: t.updatedAt,
        tags: t.tags,
      })),
    [scopedTasks, categoryLabelById],
  );

  const projects = useMemo(() => (partner ? listProjectsByPartner(partner.id) : []), [partner, version]);
  const scopedProjects = useMemo(() => projects.filter((p) => (p.scope ?? 'personal') === scope), [projects, scope]);
  const defaultProjectId = scopedProjects.find((p) => p.status === 'active')?.id ?? scopedProjects[0]?.id ?? undefined;

  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const taskFieldDefs = useMemo(() => listCustomFieldDefinitionsByScope('tasks', tenantId), [tenantId]);
  const taskFieldLayout = useMemo(() => getFieldLayout({ tenantId, scope: 'tasks' }), [tenantId]);
  const taskValuesRecord = useMemo(
    () => (partner && focusedTaskId ? getCustomFieldValues('tasks', focusedTaskId, tenantId) : null),
    [partner?.id, focusedTaskId, tenantId, version],
  );
  const [taskValues, setTaskValues] = useState<Record<string, any>>(taskValuesRecord?.values ?? {});

  useEffect(() => {
    setTaskValues(taskValuesRecord?.values ?? {});
  }, [taskValuesRecord?.updatedAt, focusedTaskId]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<'task' | 'project'>('task');

  return (
    <PageShell
      badge="Partner Portal"
      title="Tasks & Notifications"
      subtitle="Your action queue for disputes: mail letters, follow up by deadline, upload responses, and confirm outcomes."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found for this account. If you’re an admin, use Partner Management to pick a partner.
          </div>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.tasks]}>
          {tasks.length === 0 && notifications.length === 0 ? (
            <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <ActionLink to="/portal/dashboard" title="Back to Partner Dashboard" icon={<ArrowLeft size={16} />}>
                Partner Dashboard
              </ActionLink>
              <ActionLink to="/dashboard" title="Back to Finely Cred Dashboard" icon={<ArrowLeft size={16} />}>
                Finely Cred
              </ActionLink>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No tasks yet. When a bureau letter is generated, tasks will appear here automatically (mail + follow-up).
          </div>
        </div>
          ) : (
            <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <ActionLink to="/portal/dashboard" title="Back to Partner Dashboard" icon={<ArrowLeft size={16} />}>
                Partner Dashboard
              </ActionLink>
              <ActionLink to="/dashboard" title="Back to Finely Cred Dashboard" icon={<ArrowLeft size={16} />}>
                Finely Cred
              </ActionLink>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreateKind('task');
                  setCreateOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                <PlayCircle size={14} /> New task
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateKind('project');
                  setCreateOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
              >
                <ListChecks size={14} /> New project
              </button>
            </div>
          </div>

          <WorkItemCreateModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            kind={createKind}
            onKindChange={setCreateKind}
            allowProject
            allowTask
            partnerOptions={partner ? [{ id: partner.id, label: partner.profile?.fullName ?? partner.id }] : []}
            projectOptions={scopedProjects.map((p) => ({ id: p.id, label: p.title }))}
            defaultPartnerId={partner?.id}
            defaultScope={scope}
            defaultProjectId={defaultProjectId}
            enabledTaskStages={(getWorkboardSettings().taskStages || []).filter((s) => !s.disabled).map((s) => ({ id: s.id, label: s.label }))}
            enabledProjectStages={(getWorkboardSettings().projectStages || []).filter((s) => !s.disabled).map((s) => ({ id: s.id, label: s.label }))}
            onCreateTask={(args) => {
              if (!partner) return;
              createTask({
                partnerId: partner.id,
                scope,
                projectId: args.projectId ?? defaultProjectId,
                title: args.title,
                kind: 'general',
                stage: args.stage as any,
                priority: args.priority as any,
                status: 'pending',
                dueAt: args.dueAt,
                notes: args.notes,
                tags: args.tags,
                assignedTo: 'partner',
                visibility: 'partner',
              } as any);
              setVersion((v) => v + 1);
            }}
            onCreateProject={(args) => {
              if (!partner) return;
              createProject({
                partnerId: partner.id,
                scope,
                title: args.title,
                stage: args.stage as any,
                status: args.status as any,
                tags: args.tags,
              } as any);
              setVersion((v) => v + 1);
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setTab('board')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === 'board' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setTab('activity')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === 'activity' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Activity feed {unread ? `(${unread})` : ''}
              </button>
            </div>

            <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setScope('personal')}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  scope === 'personal' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => setScope('business')}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  scope === 'business' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Business
              </button>
            </div>

            {tab === 'activity' && (
              <button
                type="button"
                onClick={() => {
                  if (!partner) return;
                  markAllRead({ partnerId: partner.id, audience: 'partner' });
                  setVersion((v) => v + 1);
                }}
                disabled={!unread}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Mark all read
              </button>
            )}
          </div>

          {tab === 'board' ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <KpiCard label="Open tasks" value={openTasks.length} hint="Next actions in motion" tone="amber" />
                <KpiCard label="Completed" value={doneTasks.length} hint="Archived wins" tone="emerald" />
                <KpiCard label="Unread" value={unread} hint="New activity" tone="violet" />
              </div>

              <WorkBoardShell
                view={view}
                onViewChange={setView}
                stages={progressStages}
                stageFilter={categoryStageFilter}
                onStageFilterChange={setCategoryStageFilter}
                stageFilterStages={taskCategoryStages}
              />

              {view === 'kanban' ? (
                <WorkKanbanBoard
                  stages={progressStages}
                  items={taskItems}
                  onOpenItem={(id) => setFocusedTaskId(id)}
                  onStageChange={(id, stageId) => {
                    const t = tasksById.get(id);
                    if (!t) return;
                    setTaskStatus(t.id, stageId as TaskStatus);
                    addAuditEvent({
                      partnerId: t.partnerId,
                      actorType: 'partner',
                      actorEmail: email || undefined,
                      action: `task.status_set:${String(stageId)}`,
                      entityType: 'task',
                      entityId: t.id,
                      meta: { kind: t.kind, title: t.title, status: stageId },
                    });
                    setVersion((v) => v + 1);
                  }}
                  cardMeta={(it) => {
                    const t = tasksById.get(it.id);
                    if (!t) return null;
                    const due = t.dueAt ? new Date(t.dueAt) : null;
                    const isDone = t.status === 'completed';
                    return (
                      <div className="space-y-2">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {(categoryLabelById.get(String(t.stage ?? 'intake')) ?? String(t.stage ?? 'intake'))} • {t.kind} • {t.status}{' '}
                          {due ? `• due ${due.toLocaleDateString()}` : ''}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              const next = setTaskStatus(t.id, 'in_progress');
                              if (next) {
                                addAuditEvent({
                                  partnerId: next.partnerId,
                                  actorType: 'partner',
                                  actorEmail: email || undefined,
                                  action: 'task.status_set:in_progress',
                                  entityType: 'task',
                                  entityId: next.id,
                                  meta: { kind: next.kind, title: next.title },
                                });
                              }
                              setVersion((v) => v + 1);
                            }}
                            disabled={t.status !== 'pending'}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <PlayCircle size={14} />
                            Start
                          </button>
                          <button
                            onClick={() => {
                              const next = setTaskStatus(t.id, 'completed');
                              if (next) {
                                addAuditEvent({
                                  partnerId: next.partnerId,
                                  actorType: 'partner',
                                  actorEmail: email || undefined,
                                  action: 'task.status_set:completed',
                                  entityType: 'task',
                                  entityId: next.id,
                                  meta: { kind: next.kind, title: next.title },
                                });
                              }
                              setVersion((v) => v + 1);
                            }}
                            disabled={isDone}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 size={14} />
                            Done
                          </button>
                        </div>
                      </div>
                    );
                  }}
                />
              ) : view === 'list' ? (
                <WorkListView
                  stages={progressStages}
                  items={taskItems}
                  onStageChange={(id, stageId) => {
                    const t = tasksById.get(id);
                    if (!t) return;
                    setTaskStatus(t.id, stageId as TaskStatus);
                    addAuditEvent({
                      partnerId: t.partnerId,
                      actorType: 'partner',
                      actorEmail: email || undefined,
                      action: `task.status_set:${String(stageId)}`,
                      entityType: 'task',
                      entityId: t.id,
                      meta: { kind: t.kind, title: t.title, status: stageId },
                    });
                    setVersion((v) => v + 1);
                  }}
                />
              ) : (
                <WorkCalendarView
                  items={taskItems}
                  stageColorById={Object.fromEntries(progressStages.map((s) => [s.id, String((s as any).color || '')])) as any}
                  dateForItem={(it) => it.dueAt}
                  emptyHint="Only tasks with a due date appear here."
                />
              )}

              {taskFieldDefs.length && focusedTask ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Task details</div>
                      <div className="mt-1 text-white font-semibold">{focusedTask.title}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {focusedTask.kind} • {focusedTask.status} • {focusedTask.stage ?? 'general'}
                      </div>
                      <div className="mt-2 text-white/60 text-sm">
                        Optional enterprise fields (mail tracking, blockers, outcomes). Saved to this task.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFocusedTaskId(openTasks[0]?.id ?? doneTasks[0]?.id ?? focusedTask.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        title="Focus the next task"
                      >
                        Next
                      </button>
                      <button
                        type="button"
                        onClick={() => setFocusedTaskId(null)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                        title="Hide details"
                      >
                        <X size={14} /> Hide
                      </button>
                    </div>
                  </div>

                  <FieldLayoutRenderer
                    layout={taskFieldLayout}
                    definitions={taskFieldDefs}
                    values={taskValues}
                    onChangeValue={(key, next, persist) => {
                      if (!partner || !focusedTaskId) return;
                      setTaskValues((prev) => {
                        const merged = { ...(prev || {}), [key]: next };
                        if (persist) upsertCustomFieldValues('tasks', focusedTaskId, merged, tenantId);
                        return merged;
                      });
                    }}
                  />

                  {/* Checklist + comments (local-first) */}
                  <div className="grid lg:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-white font-semibold">Checklist</div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {(focusedTask.checklist ?? []).filter((x) => x.done).length}/{(focusedTask.checklist ?? []).length}
                        </div>
                      </div>
                      <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const txt = newChecklistText.trim();
                          if (!txt) return;
                          const next = upsertTask({
                            ...focusedTask,
                            checklist: [{ id: newId('chk'), text: txt, done: false }, ...(focusedTask.checklist ?? [])],
                          } as any);
                          setNewChecklistText('');
                          setVersion((v) => v + 1);
                          addAuditEvent({
                            partnerId: next.partnerId,
                            actorType: 'partner',
                            actorEmail: email || undefined,
                            action: 'task.checklist.added',
                            entityType: 'task',
                            entityId: next.id,
                            meta: { text: txt },
                          });
                        }}
                      >
                        <input
                          value={newChecklistText}
                          onChange={(e) => setNewChecklistText(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-sm"
                          placeholder="Add checklist item…"
                        />
                        <button type="submit" className="px-3 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest">
                          Add
                        </button>
                      </form>
                      <div className="space-y-2">
                        {(focusedTask.checklist ?? []).length === 0 ? (
                          <div className="text-white/55 text-sm">No checklist items yet.</div>
                        ) : (
                          (focusedTask.checklist ?? []).slice(0, 12).map((c) => (
                            <label
                              key={c.id}
                              className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
                            >
                              <div className="min-w-0">
                                <div className={`text-sm ${c.done ? 'text-white/50 line-through' : 'text-white/80'}`}>{c.text}</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={c.done}
                                onChange={(e) => {
                                  const done = e.target.checked;
                                  const next = upsertTask({
                                    ...focusedTask,
                                    checklist: (focusedTask.checklist ?? []).map((x) =>
                                      x.id === c.id ? { ...x, done, doneAt: done ? new Date().toISOString() : undefined } : x,
                                    ),
                                  } as any);
                                  setVersion((v) => v + 1);
                                  addAuditEvent({
                                    partnerId: next.partnerId,
                                    actorType: 'partner',
                                    actorEmail: email || undefined,
                                    action: done ? 'task.checklist.done' : 'task.checklist.undone',
                                    entityType: 'task',
                                    entityId: next.id,
                                    meta: { checklistId: c.id },
                                  });
                                }}
                                className="mt-1 accent-amber-500"
                              />
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-white font-semibold">Comments</div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{focusedComments.length}</div>
                      </div>
                      <form
                        className="space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const body = commentDraft.trim();
                          if (!body || !partner || !focusedTaskId) return;
                          addTaskComment({
                            partnerId: partner.id,
                            taskId: focusedTaskId,
                            authorType: 'partner',
                            authorEmail: email || undefined,
                            body,
                          });
                          setCommentDraft('');
                          setVersion((v) => v + 1);
                        }}
                      >
                        <textarea
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          className="w-full min-h-[88px] bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-sm"
                          placeholder="Add a comment (e.g., ‘Mailed today; tracking in notes’)"
                        />
                        <button type="submit" className="fc-button-brand w-full">
                          Add comment
                        </button>
                      </form>
                      <div className="space-y-2">
                        {focusedComments.length === 0 ? (
                          <div className="text-white/55 text-sm">No comments yet.</div>
                        ) : (
                          focusedComments.slice(-8).map((c) => (
                            <div key={c.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                {c.authorType} • {c.authorEmail || '—'} • {new Date(c.createdAt).toLocaleString()}
                              </div>
                              <div className="mt-2 text-white/80 text-sm whitespace-pre-wrap">{c.body}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Activity feed</div>
                {notifications.length > ACTIVITY_LIMIT ? (
                  <button
                    type="button"
                    onClick={() => setShowAllActivity((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    title={showAllActivity ? 'Show fewer items' : 'Show all activity'}
                  >
                    {showAllActivity ? 'Show less' : `Show all (${notifications.length})`}
                  </button>
                ) : null}
              </div>

              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
                  No activity yet.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {(showAllActivity ? notifications : notifications.slice(0, ACTIVITY_LIMIT)).map((n) => {
                    const when = (() => {
                      try {
                        return new Date(n.createdAt).toLocaleString();
                      } catch {
                        return n.createdAt;
                      }
                    })();
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.href) navigate(n.href);
                          setVersion((v) => v + 1);
                        }}
                        className={`w-full text-left rounded-2xl border p-4 transition-all min-h-[124px] ${
                          n.readAt
                            ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.03]'
                            : 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15'
                        }`}
                        title={n.title}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{n.title}</div>
                            {n.body && <div className="mt-1 text-white/70 text-sm whitespace-pre-wrap">{n.body}</div>}
                            <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                              {n.kind} • {when}
                            </div>
                          </div>
                          {!n.readAt && (
                            <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest">
                              New
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
            </div>
          )}
        </EntitlementGate>
      )}
    </PageShell>
  );
}

