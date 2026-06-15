import React, { useCallback, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, GripVertical, ListFilter } from 'lucide-react';
import type { TaskItem, TaskStatus } from '../../../domain/tasks';
import { FINELY_OS_DRAG_HINT, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_EMPTY, FINELY_OS_ENTITY_INPUT, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_KPI_ACCENTS, FINELY_OS_LUXURY_PAGINATION, FINELY_OS_LUXURY_PAGINATION_BTN, finelyOsGlassShell, finelyOsStatusChip, finelyOsViewTab, finelyOsColumnTheme } from '../../os/finelyOsLightUi';
import { TaskTimerChip } from '../components/TaskTimerChip';
import { useBoardDragDrop } from '../../os/useBoardDragDrop';

const STATUS_COLUMNS: Array<{ id: TaskStatus; label: string; hint: string; color: string }> = [
  { id: 'pending', label: 'To do', hint: 'Not started', color: '#94a3b8' },
  { id: 'in_progress', label: 'In progress', hint: 'Active now', color: '#f59e0b' },
  { id: 'completed', label: 'Done', hint: 'Completed', color: '#10b981' },
  { id: 'cancelled', label: 'Cancelled', hint: 'Not needed', color: '#64748b' },
];

const STATUS_BADGE: Record<TaskStatus, string> = {
  pending: 'border-white/[0.08] bg-white/[0.07] text-white/60',
  in_progress: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  completed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  cancelled: 'border-white/[0.08] bg-white/[0.05] text-white/40',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtDue(iso?: string) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const overdue = d.getTime() < Date.now();
    return { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), overdue, date: d };
  } catch {
    return null;
  }
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function WorkTaskStatusBoard({
  tasks,
  stageLabelById,
  onOpenTask,
  onStatusChange,
}: {
  tasks: TaskItem[];
  stageLabelById: Map<string, string>;
  onOpenTask: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, TaskItem[]>();
    for (const c of STATUS_COLUMNS) map.set(c.id, []);
    for (const t of tasks) {
      const st = (t.status ?? 'pending') as TaskStatus;
      (map.get(st) ?? map.get('pending') ?? [])?.push(t);
    }
    for (const [, arr] of map) arr.sort((a, b) => String(a.dueAt || a.createdAt).localeCompare(String(b.dueAt || b.createdAt)));
    return map;
  }, [tasks]);

  const handleMove = useCallback(
    (taskId: string, status: TaskStatus) => onStatusChange(taskId, status),
    [onStatusChange],
  );
  const { cardDragProps, columnDropProps, stopDragOnControl } = useBoardDragDrop<TaskStatus>(handleMove);

  return (
    <div>
      <p className={FINELY_OS_DRAG_HINT}>
        <GripVertical size={12} /> Drag tasks between columns to update status
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-px-4 -mx-1 px-1">
        {STATUS_COLUMNS.map((col, colIdx) => {
          const items = byStatus.get(col.id) ?? [];
          const theme = finelyOsColumnTheme(colIdx);
          const dropProps = columnDropProps(col.id, `${theme.drop} rounded-xl transition-all min-h-[120px] p-1`);
          return (
            <div key={col.id} className="min-w-[260px] w-[260px] shrink-0 snap-start">
              <div className={`rounded-xl border px-3 py-2 mb-2 ${theme.header}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/85">{col.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-white/70 bg-white/[0.08] px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="text-[10px] text-white/50 mt-0.5">{col.hint}</div>
              </div>
              <div {...dropProps} className={`space-y-2 min-h-[120px] rounded-xl ${theme.body} ${dropProps.className ?? ''}`}>
                {items.length === 0 ? (
                  <div className={`rounded-xl border border-dashed border-violet-400/30 p-4 text-center text-xs m-1 ${FINELY_OS_ENTITY_BODY}`}>Drop task here</div>
                ) : (
                  items.map((t) => {
                    const due = fmtDue(t.dueAt);
                    const phase = stageLabelById.get(String(t.stage ?? 'intake')) ?? t.stage;
                    const drag = cardDragProps(
                      t.id,
                      `rounded-xl border p-3 shadow-sm hover:shadow-md transition-all ${
                        due?.overdue
                          ? 'border-rose-500/35 bg-rose-500/10 ring-1 ring-rose-400/20'
                          : 'border-white/[0.08] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08] hover:border-violet-400/30'
                      }`,
                    );
                    const { className: dragClass, ...restDrag } = drag;
                    return (
                      <div
                        key={t.id}
                        {...restDrag}
                        className={dragClass}
                        onClick={() => onOpenTask(t.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onOpenTask(t.id)}
                      >
                        <div className="flex items-start gap-1">
                          <GripVertical size={14} className="text-white/25 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm line-clamp-2 ${FINELY_OS_ENTITY_VALUE}`}>{t.title}</div>
                            <div className={`mt-1 text-[10px] font-medium text-violet-300/80`}>{phase} · {t.kind.replace(/_/g, ' ')}</div>
                          </div>
                        </div>
                        <TaskTimerChip task={t} compact onUpdate={() => {}} />
                        {t.priority && t.priority !== 'normal' ? (
                          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${finelyOsStatusChip('warn')}`}>{t.priority}</span>
                        ) : null}
                        <select
                          {...stopDragOnControl}
                          value={t.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onStatusChange(t.id, e.target.value as TaskStatus)}
                          className={`mt-2 w-full ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} !text-[10px] !py-1`}
                        >
                          {STATUS_COLUMNS.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WorkTaskListPanel({
  tasks,
  stageLabelById,
  onOpenTask,
}: {
  tasks: TaskItem[];
  stageLabelById: Map<string, string>;
  onOpenTask: (id: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const stats = useMemo(() => {
    let open = 0;
    let overdue = 0;
    let done = 0;
    for (const t of tasks) {
      if (t.status === 'completed' || t.status === 'cancelled') done++;
      else open++;
      const due = fmtDue(t.dueAt);
      if (due?.overdue && t.status !== 'completed' && t.status !== 'cancelled') overdue++;
    }
    return { open, overdue, done, total: tasks.length };
  }, [tasks]);

  const filtered = useMemo(() => {
    const list = statusFilter === 'all' ? [...tasks] : tasks.filter((t) => t.status === statusFilter);
    return list.sort((a, b) => String(a.dueAt || a.createdAt).localeCompare(String(b.dueAt || b.createdAt)));
  }, [tasks, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    for (const t of filtered) {
      const key = String(t.stage ?? 'intake');
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageSlice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  if (!tasks.length) {
    return (
      <div className={FINELY_OS_ENTITY_EMPTY}>
        <ListFilter className="mx-auto mb-2 text-violet-300" size={28} />
        <p className={FINELY_OS_ENTITY_BODY}>No tasks in this project yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, accent: 0 },
          { label: 'Open', value: stats.open, accent: 1 },
          { label: 'Overdue', value: stats.overdue, accent: 4, tone: stats.overdue ? 'text-rose-300' : undefined },
          { label: 'Done', value: stats.done, accent: 2 },
        ].map((m) => (
          <div key={m.label} className={`rounded-xl border p-3 ${FINELY_OS_KPI_ACCENTS[m.accent % FINELY_OS_KPI_ACCENTS.length]}`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{m.label}</div>
            <div className={`text-xl font-bold mt-0.5 ${m.tone ?? FINELY_OS_ENTITY_VALUE}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'in_progress', 'completed'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => { setStatusFilter(f); setPage(0); }}
            className={finelyOsViewTab(statusFilter === f, 'violet')}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {grouped.map(([stageId, groupTasks]) => {
          const visible = groupTasks.filter((t) => pageSlice.some((p) => p.id === t.id));
          if (!visible.length) return null;
          const phaseLabel = stageLabelById.get(stageId) ?? stageId;
          return (
            <section key={stageId}>
              <h3 className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2 flex items-center gap-2`}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {phaseLabel}
                <span className="text-white/35 normal-case tracking-normal">({groupTasks.length})</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {visible.map((t, i) => {
                  const due = fmtDue(t.dueAt);
                  const st = (t.status ?? 'pending') as TaskStatus;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onOpenTask(t.id)}
                      className={`text-left rounded-xl border p-3 transition-all hover:shadow-md ${
                        FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]
                      } ${due?.overdue && st !== 'completed' ? 'ring-1 ring-rose-400/40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm line-clamp-2`}>{t.title}</div>
                        <span className={`shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_BADGE[st]}`}>
                          {st.replace('_', ' ')}
                        </span>
                      </div>
                      <div className={`mt-2 flex flex-wrap gap-2 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
                        <span>{t.kind.replace(/_/g, ' ')}</span>
                        {due ? (
                          <span className={due.overdue && st !== 'completed' ? 'text-rose-300 font-semibold' : ''}>
                            Due {due.label}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {filtered.length > pageSize ? (
        <div className={FINELY_OS_LUXURY_PAGINATION}>
          <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Page {safePage + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={safePage <= 0} onClick={() => setPage((p) => p - 1)} className={FINELY_OS_LUXURY_PAGINATION_BTN}>Prev</button>
            <button type="button" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className={FINELY_OS_LUXURY_PAGINATION_BTN}>Next</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function WorkTaskCalendarPanel({
  tasks,
  onOpenTask,
}: {
  tasks: TaskItem[];
  onOpenTask: (id: string) => void;
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string>(() => dateKey(new Date()));

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    for (const t of tasks) {
      if (!t.dueAt) continue;
      const d = new Date(t.dueAt);
      const key = dateKey(d);
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    for (const [, arr] of map) arr.sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)));
    return map;
  }, [tasks]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const firstDay = startOfMonth(cursor);
  const offset = firstDay.getDay();
  const totalDays = daysInMonth(cursor);
  const cells: Array<{ key: string; day: number | null; inMonth: boolean }> = [];

  for (let i = 0; i < offset; i++) cells.push({ key: `pad-${i}`, day: null, inMonth: false });
  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(cursor.getFullYear(), cursor.getMonth(), d);
    cells.push({ key: dateKey(dt), day: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) cells.push({ key: `tail-${cells.length}`, day: null, inMonth: false });

  const selectedTasks = tasksByDay.get(selectedDay) ?? [];
  const scheduledCount = tasks.filter((t) => t.dueAt).length;

  if (!scheduledCount) {
    return (
      <div className={FINELY_OS_ENTITY_EMPTY}>
        <CalendarDays className="mx-auto mb-2 text-sky-300" size={32} />
        <p className={FINELY_OS_ENTITY_BODY}>No scheduled due dates on tasks yet.</p>
        <p className={`text-xs mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>Add due dates to see them on the calendar grid.</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <div className={`p-4 ${finelyOsGlassShell('panel', 'sky')}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>Month view</div>
            <div className={`text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>{monthLabel}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className={FINELY_OS_LUXURY_PAGINATION_BTN}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => { const now = new Date(); setCursor(startOfMonth(now)); setSelectedDay(dateKey(now)); }}
              className={`${FINELY_OS_LUXURY_PAGINATION_BTN} !px-3 !py-1.5 text-[10px] font-bold uppercase tracking-wider`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className={FINELY_OS_LUXURY_PAGINATION_BTN}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className={`text-center py-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            if (cell.day == null) return <div key={cell.key} className="min-h-[72px] rounded-lg bg-white/[0.05]" />;
            const dayTasks = tasksByDay.get(cell.key) ?? [];
            const isSelected = selectedDay === cell.key;
            const isToday = cell.key === dateKey(new Date());
            const hasOverdue = dayTasks.some((t) => {
              const due = fmtDue(t.dueAt);
              return due?.overdue && t.status !== 'completed';
            });
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDay(cell.key)}
                className={`min-h-[72px] rounded-xl border p-1.5 text-left transition-all ${
                  isSelected
                    ? 'border-sky-500/60 ring-2 ring-sky-400/25 bg-sky-500/10 shadow-md'
                    : 'border-white/[0.08] bg-white/[0.05] hover:border-sky-400/35 hover:bg-sky-500/5'
                } ${isToday && !isSelected ? 'bg-sky-500/8' : ''}`}
              >
                <div className={`text-xs font-bold ${isToday ? 'text-sky-300' : 'text-white/75'}`}>{cell.day}</div>
                {dayTasks.length ? (
                  <div className="mt-1 space-y-0.5">
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate ${
                          hasOverdue ? 'bg-rose-500/20 text-rose-200' : 'bg-sky-500/15 text-sky-200'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 ? (
                      <div className="text-[9px] text-sky-300 font-semibold px-1">+{dayTasks.length - 2} more</div>
                    ) : null}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`p-4 ${finelyOsGlassShell('panel', 'emerald')}`}>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300 mb-1`}>Selected day</div>
        <div className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE} mb-3`}>
          {new Date(selectedDay + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
        {selectedTasks.length ? (
          <div className="space-y-2">
            {selectedTasks.map((t, i) => {
              const due = fmtDue(t.dueAt);
              const st = (t.status ?? 'pending') as TaskStatus;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onOpenTask(t.id)}
                  className={`w-full text-left rounded-xl border p-3 hover:shadow-sm transition-all ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}
                >
                  <div className={`font-medium text-sm line-clamp-2 ${FINELY_OS_ENTITY_VALUE}`}>{t.title}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full border ${STATUS_BADGE[st]}`}>{st.replace('_', ' ')}</span>
                    {due ? <span className={FINELY_OS_ENTITY_BODY}>{due.label}</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>No tasks due this day.</p>
        )}
      </div>
    </div>
  );
}
