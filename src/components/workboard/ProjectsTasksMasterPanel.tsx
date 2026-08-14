import React from 'react';
import { ArrowRight, CheckCircle2, FolderKanban, Layers, PauseCircle, Plus } from 'lucide-react';
import type { Project } from '../../domain/projects';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowTile,
} from '../../features/os/finelyOsLightUi';

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-400',
  paused: 'bg-sky-400',
  completed: 'bg-violet-400',
};

type Props = {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpenProject?: (id: string) => void;
  onCreateProject?: () => void;
  showCreateButton?: boolean;
  stageLabelById: Map<string, string>;
  taskCountByProject?: Map<string, { open: number; done: number }>;
};

export function ProjectsTasksMasterPanel({
  projects,
  selectedId,
  onSelect,
  onOpenProject,
  onCreateProject,
  showCreateButton = Boolean(onCreateProject),
  stageLabelById,
  taskCountByProject,
}: Props) {
  return (
    <aside className={`${finelyOsCatalogCardCompact('violet')} shrink-0 w-full lg:w-[280px] !p-0 overflow-hidden`}>
      <div className="px-3 py-2.5 border-b border-white/[0.08] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
          <FolderKanban size={14} className="text-violet-300" /> Projects
        </div>
        {showCreateButton && onCreateProject ? (
          <button type="button" onClick={onCreateProject} className={`${FINELY_OS_PRIMARY_BTN} !px-2.5 !py-1.5 !text-[9px]`} title="New project">
            <Plus size={12} /> New
          </button>
        ) : null}
      </div>

      <div className="p-2 space-y-1.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-xl transition-all border ${finelyOsGlowTile('sky', selectedId === null)}`}
        >
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-sky-300 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/90">All projects</p>
              <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Show every task in scope</p>
            </div>
          </div>
        </button>

        <FinelyOsPaginatedStack
          items={projects}
          pageSize={10}
          emptyMessage="No projects yet. Create one to add tasks."
          itemSpacingClassName="space-y-1.5"
          renderItem={(p) => {
            const active = p.id === selectedId;
            const counts = taskCountByProject?.get(p.id);
            const stageLabel = stageLabelById.get(String(p.stage ?? 'intake')) ?? String(p.stage ?? 'intake');
            return (
              <div
                key={p.id}
                className={`rounded-xl border transition-all ${finelyOsGlowTile('violet', active)}`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className="w-full text-left px-3 py-2.5 cursor-pointer"
                  title="Filter tasks for this project"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[p.status] ?? STATUS_DOT.active}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-white/90">{p.title}</p>
                      <p className={`text-[11px] mt-0.5 truncate ${FINELY_OS_ENTITY_BODY}`}>
                        {stageLabel} · {p.status}
                      </p>
                      {counts ? (
                        <p className={`text-[10px] mt-1 flex items-center gap-2 ${FINELY_OS_ENTITY_BODY}`}>
                          <span>{counts.open} open</span>
                          <span className="inline-flex items-center gap-0.5 text-emerald-400/80">
                            <CheckCircle2 size={10} /> {counts.done}
                          </span>
                        </p>
                      ) : null}
                    </div>
                    {p.status === 'paused' ? <PauseCircle size={14} className="text-white/40 shrink-0 mt-0.5" /> : null}
                  </div>
                </button>
                {onOpenProject ? (
                  <div className="px-3 pb-2.5 pt-0">
                    <button
                      type="button"
                      onClick={() => onOpenProject(p.id)}
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-sky-300/90 hover:text-sky-200 transition-colors"
                    >
                      Open workspace <ArrowRight size={10} />
                    </button>
                  </div>
                ) : null}
              </div>
            );
          }}
        />
      </div>

      <div className={`px-3 py-2.5 border-t border-white/[0.08] ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal leading-relaxed`}>
        Select a project to filter tasks on the board, or open its full workspace.
      </div>
    </aside>
  );
}
