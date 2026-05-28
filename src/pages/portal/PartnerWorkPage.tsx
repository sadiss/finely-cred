import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listProjectsByPartner, setProjectStage } from '../../data/projectsRepo';
import { listTasksByPartner, upsertTask } from '../../data/tasksRepo';
import { getWorkboardSettings } from '../../data/settingsRepo';
import { WorkBoardShell, WorkCalendarView, WorkKanbanBoard, WorkListView, type WorkBoardItem } from '../../components/workboard';

type Scope = 'personal' | 'business';

export default function PartnerWorkPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [scope, setScope] = useState<Scope>('personal');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const stageDefs = useMemo(() => getWorkboardSettings().taskStages, [version]);

  const { items, kindById } = useMemo(() => {
    if (!partner) return { items: [] as WorkBoardItem[], kindById: new Map<string, 'project' | 'task'>() };
    const projects = listProjectsByPartner(partner.id).filter((p) => (p.scope ?? 'personal') === scope);
    const tasks = listTasksByPartner(partner.id).filter((t) => (t.scope ?? 'personal') === scope);
    const out: WorkBoardItem[] = [];
    const kind = new Map<string, 'project' | 'task'>();

    for (const p of projects) {
      const id = `proj:${p.id}`;
      kind.set(id, 'project');
      out.push({
        id,
        title: p.title,
        subtitle: `Project • ${p.status}`,
        stage: p.stage,
        status: p.status,
        updatedAt: p.updatedAt,
        tags: p.tags,
      });
    }
    for (const t of tasks) {
      const id = `task:${t.id}`;
      kind.set(id, 'task');
      out.push({
        id,
        title: t.title,
        subtitle: `Task • ${t.kind} • ${t.status}`,
        stage: (t.stage ?? 'intake') as any,
        status: t.status,
        dueAt: t.dueAt,
        updatedAt: t.updatedAt,
        tags: t.tags,
      });
    }
    return { items: out, kindById: kind };
  }, [partner, scope, version]);

  const onStageChange = (id: string, stageId: string) => {
    const k = kindById.get(id);
    if (!k) return;
    if (k === 'project') {
      const pid = id.replace(/^proj:/, '');
      setProjectStage(pid, stageId as any);
      return;
    }
    const tid = id.replace(/^task:/, '');
    const t = partner ? listTasksByPartner(partner.id).find((x) => x.id === tid) ?? null : null;
    if (!t) return;
    upsertTask({ ...t, stage: stageId as any });
  };

  const onOpenItem = (id: string) => {
    const k = kindById.get(id);
    if (k === 'project') return navigate('/portal/projects');
    if (k === 'task') return navigate('/portal/tasks');
  };

  return (
    <PageShell
      badge="Partner Portal"
      title="All work"
      subtitle="Unified view across Projects + Tasks. Use scope toggle to switch Personal vs Business."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">No partner profile found.</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              title="Back to Partner Dashboard"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>

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
          </div>

          <WorkBoardShell view={view} onViewChange={setView} stages={stageDefs} />

          {view === 'kanban' ? (
            <WorkKanbanBoard stages={stageDefs} items={items} onStageChange={onStageChange} onOpenItem={onOpenItem} />
          ) : view === 'list' ? (
            <WorkListView stages={stageDefs} items={items} onStageChange={onStageChange} onOpenItem={onOpenItem} />
          ) : (
            <WorkCalendarView
              items={items}
              stageColorById={Object.fromEntries(stageDefs.map((s) => [s.id, String((s as any).color || '')])) as any}
              dateForItem={(it) => it.dueAt || it.updatedAt}
              emptyHint="Calendar uses due dates for tasks, else updatedAt."
            />
          )}
        </div>
      )}
    </PageShell>
  );
}

