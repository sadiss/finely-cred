import React from 'react';
import { CheckCircle2, FolderKanban, PauseCircle, Plus } from 'lucide-react';
import type { Project } from '../../domain/projects';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';

const STATUS_DOT: Record<string, string> = {
  active: 'bg-amber-400',
  paused: 'bg-slate-400',
  completed: 'bg-emerald-400',
};

type Props = {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenProject?: (id: string) => void;
  onCreateProject: () => void;
  stageLabelById: Map<string, string>;
  taskCountByProject?: Map<string, { open: number; done: number }>;
};

export function ProjectsTasksMasterPanel({
  projects,
  selectedId,
  onSelect,
  onOpenProject,
  onCreateProject,
  stageLabelById,
  taskCountByProject,
}: Props) {
  const openProject = (id: string) => {
    onSelect(id);
    if (onOpenProject) onOpenProject(id);
  };

  return (
    <aside className="fc-light-glass-panel fc-light-chrome-panel overflow-hidden shrink-0 w-full lg:w-[280px]">
      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
          <FolderKanban size={14} className="text-amber-400" /> Projects
        </div>
        <button
          type="button"
          onClick={onCreateProject}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest hover:brightness-110"
          title="New project"
        >
          <Plus size={12} /> New
        </button>
      </div>
      <div className="p-2">
        <FinelyOsPaginatedStack
          items={projects}
          pageSize={10}
          emptyMessage="No projects yet. Create one to add tasks."
          renderItem={(p) => {
            const active = p.id === selectedId;
            const counts = taskCountByProject?.get(p.id);
            const stageLabel = stageLabelById.get(String(p.stage ?? 'intake')) ?? String(p.stage ?? 'intake');
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => openProject(p.id)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-colors cursor-pointer border ${
                  active ? 'bg-amber-500/10 border-amber-500/40' : 'border-white/5 hover:bg-white/[0.03]'
                }`}
                title="Open project details"
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[p.status] ?? STATUS_DOT.active}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${active ? 'text-amber-100' : 'text-white/85'}`}>{p.title}</p>
                    <p className="text-[11px] text-white/45 mt-0.5 truncate">{stageLabel} · {p.status}</p>
                    {counts ? (
                      <p className="text-[10px] text-white/35 mt-1 flex items-center gap-2">
                        <span>{counts.open} open</span>
                        <span className="inline-flex items-center gap-0.5 text-emerald-400/80">
                          <CheckCircle2 size={10} /> {counts.done}
                        </span>
                      </p>
                    ) : null}
                    <p className="text-[9px] uppercase tracking-widest text-amber-300/70 mt-2 font-black">Click to open details</p>
                  </div>
                  {p.status === 'paused' ? <PauseCircle size={14} className="text-white/40 shrink-0 mt-0.5" /> : null}
                </div>
              </button>
            );
          }}
        />
      </div>
      <div className="px-4 py-3 border-t border-white/[0.08] text-[10px] text-white/35 leading-relaxed">
        Click any project to open its editable detail popup. Tasks for that project appear in the board on the right.
      </div>
    </aside>
  );
}
