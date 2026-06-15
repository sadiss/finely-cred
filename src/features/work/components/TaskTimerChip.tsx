import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Pause, Play, Scale, Timer } from 'lucide-react';
import type { TaskItem } from '../../../domain/tasks';
import { upsertTask } from '../../../data/tasksRepo';
import { getBureauWindowTimer } from '../../../lib/bureauWindowTimer';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_SECONDARY_BTN, finelyOsStatusChip } from '../../os/finelyOsLightUi';

function formatCountdown(ms: number) {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function TaskTimerChip({
  task,
  compact = false,
  onUpdate,
}: {
  task: TaskItem;
  compact?: boolean;
  onUpdate?: () => void;
}) {
  const [tick, setTick] = useState(0);
  const [focusLeft, setFocusLeft] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (task.timerState?.mode !== 'focus' || !task.timerState.focusStartedAt) {
      setFocusLeft(null);
      return;
    }
    const dur = (task.timerState.focusDurationMin ?? 25) * 60000;
    const started = Date.parse(task.timerState.focusStartedAt);
    const id = window.setInterval(() => {
      setFocusLeft(Math.max(0, dur - (Date.now() - started)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [task.timerState?.mode, task.timerState?.focusStartedAt, task.timerState?.focusDurationMin]);

  const bureau = useMemo(() => getBureauWindowTimer(task), [task.id, task.dueAt, task.tags, tick]);

  const sla = useMemo(() => {
    if (!task.dueAt || task.status === 'completed' || task.status === 'cancelled') return null;
    const ms = Date.parse(task.dueAt) - Date.now();
    const overdue = ms < 0;
    const warn = ms > 0 && ms < 86400000;
    return { ms, overdue, warn, label: formatCountdown(ms) };
  }, [task.dueAt, task.status, tick]);

  const startFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    upsertTask({
      ...task,
      status: task.status === 'pending' ? 'in_progress' : task.status,
      timerState: {
        mode: 'focus',
        focusStartedAt: new Date().toISOString(),
        focusDurationMin: 25,
      },
    });
    onUpdate?.();
  };

  const stopFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const started = task.timerState?.focusStartedAt ? Date.parse(task.timerState.focusStartedAt) : Date.now();
    const elapsedMin = Math.round((Date.now() - started) / 60000);
    upsertTask({
      ...task,
      actualMinutes: (task.actualMinutes ?? 0) + Math.max(1, elapsedMin),
      timerState: { mode: 'idle' },
    });
    onUpdate?.();
  };

  if (!sla && !bureau && task.timerState?.mode !== 'focus') return null;

  const tone = sla?.overdue || bureau?.overdue ? 'blocked' : sla?.warn ? 'warn' : 'ok';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? 'mt-1' : 'mt-2'}`} onClick={(e) => e.stopPropagation()}>
      {bureau ? (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${finelyOsStatusChip(bureau.overdue ? 'blocked' : 'warn')}`}>
          <Scale size={10} />
          {bureau.label}
        </span>
      ) : null}
      {sla ? (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${finelyOsStatusChip(tone)}`}>
          <Clock size={10} />
          {sla.overdue ? `${sla.label} overdue` : `${sla.label} left`}
        </span>
      ) : null}
      {task.timerState?.mode === 'focus' && focusLeft != null ? (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${finelyOsStatusChip('warn')}`}>
          <Timer size={10} /> Focus {formatCountdown(focusLeft)}
        </span>
      ) : null}
      {!compact && task.status !== 'completed' ? (
        task.timerState?.mode === 'focus' ? (
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={stopFocus} title="Stop focus">
            <Pause size={10} /> Stop
          </button>
        ) : (
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={startFocus} title="25 min focus">
            <Play size={10} /> Focus
          </button>
        )
      ) : null}
      {!compact && sla?.overdue ? (
        <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>SLA breached</span>
      ) : null}
    </div>
  );
}
