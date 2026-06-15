import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listTasksByPartner } from '../../data/tasksRepo';
import type { TaskItem } from '../../domain/tasks';
import { TaskTimerChip } from '../../features/work/components/TaskTimerChip';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';

function pickSpotlightTask(tasks: TaskItem[]): TaskItem | null {
  const open = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const overdue = open.filter((t) => t.dueAt && Date.parse(t.dueAt) < Date.now());
  if (overdue.length) {
    return overdue.sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!))[0] ?? null;
  }
  const focus = open.find((t) => t.timerState?.mode === 'focus');
  if (focus) return focus;
  const dueSoon = open
    .filter((t) => t.dueAt && Date.parse(t.dueAt) - Date.now() < 48 * 60 * 60 * 1000)
    .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));
  return dueSoon[0] ?? open[0] ?? null;
}

/** Mobile PWA Work OS timer chip strip (Phase 41). */
export function PartnerMobileWorkBar() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const task = useMemo(() => {
    if (!partner) return null;
    return pickSpotlightTask(listTasksByPartner(partner.id));
  }, [partner, version]);

  if (!task) return null;

  return (
    <div className="fixed bottom-[5.5rem] left-0 right-0 z-[165] px-3 md:hidden pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-fuchsia-500/25 bg-fuchsia-950/90 backdrop-blur px-3 py-2 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className={`truncate text-xs font-semibold text-white/90`}>{task.title}</div>
            <div className="mt-1">
              <TaskTimerChip task={task} compact onUpdate={() => setVersion((v) => v + 1)} />
            </div>
          </div>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => navigate('/portal/projects')}
            aria-label="Open Work OS tasks"
          >
            Tasks <ArrowRight size={12} />
          </button>
        </div>
        <p className={`mt-1 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Work OS timer · swipe up for full board</p>
      </div>
    </div>
  );
}
