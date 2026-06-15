import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FolderKanban, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ensureDefaultProjectForPartner, listProjectsByPartner } from '../../../data/projectsRepo';
import { listTasksByPartner } from '../../../data/tasksRepo';
import { getWorkboardSettings } from '../../../data/settingsRepo';
import { usePartnerSession } from '../../../auth/PartnerSessionContext';
import { listPartnerPortalProjects, listPartnerPortalTasks } from '../../../lib/workVisibility';
import { serviceLaneFromProjectTags } from '../../../domain/workSla';
import type { Project } from '../../../domain/projects';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
} from '../../os/finelyOsLightUi';

function projectProgress(projectId: string, tasks: ReturnType<typeof listPartnerPortalTasks>) {
  const pts = tasks.filter((t) => t.projectId === projectId);
  const total = pts.length;
  const open = pts.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const done = pts.filter((t) => t.status === 'completed').length;
  return { total, open, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function WorkPartnerProjectsHub() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [scope, setScope] = useState<'personal' | 'business'>('personal');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (!partner) return;
    ensureDefaultProjectForPartner({
      partnerId: partner.id,
      scope,
      fundingGoal: partner.routes?.[partner.primaryRoute || 'personal_restore']?.fundingTarget,
    });
  }, [partner?.id, scope]);

  const projects = useMemo(() => {
    if (!partner) return [];
    return listPartnerPortalProjects(listProjectsByPartner(partner.id)).filter((p) => (p.scope ?? 'personal') === scope);
  }, [partner, scope, version]);

  const tasks = useMemo(() => (partner ? listPartnerPortalTasks(listTasksByPartner(partner.id)) : []), [partner, version]);

  const stageLabelById = useMemo(() => {
    const defs = getWorkboardSettings().projectStages;
    return new Map(defs.map((s) => [s.id, s.label]));
  }, [version]);

  const openTasks = useMemo(() => tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress'), [tasks]);

  if (!partner) {
    return (
      <div className={FINELY_OS_ENTITY_EMPTY}>
        Sign in with a partner profile to view projects.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate('/portal/my-tasks')} className={FINELY_OS_SECONDARY_BTN}>
            <ListChecks size={14} className="inline mr-1" /> My tasks
          </button>
        </div>
      </div>

      <div className={FINELY_OS_BANNER}>
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>Your delivery projects — tap a card to open the full workspace with overview, tasks, and AI suggestions.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={scope} onChange={(e) => setScope(e.target.value as 'personal' | 'business')} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}>
          <option value="personal">Personal credit</option>
          <option value="business">Business credit</option>
        </select>
        <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{projects.length} project{projects.length === 1 ? '' : 's'} · {openTasks.length} open tasks</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p: Project, i) => {
          const prog = projectProgress(p.id, tasks);
          const lane = serviceLaneFromProjectTags(p.tags);
          const phase = stageLabelById.get(String(p.stage)) ?? p.stage;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/portal/projects/${p.id}`)}
              className={`text-left p-4 transition-all hover:shadow-md hover:border-emerald-400/30 ${finelyOsInlineListItem()} ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}
            >
              <span className={`inline-flex text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${lane.className}`}>{lane.label}</span>
              <div className={`mt-2 line-clamp-2 ${FINELY_OS_ENTITY_VALUE}`}>{p.title}</div>
              <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>Phase: {phase}</div>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#34d399" strokeWidth="3" strokeDasharray={`${prog.pct} 100`} />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${FINELY_OS_ENTITY_VALUE}`}>{prog.pct}%</span>
                </div>
                <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  <div>{prog.open} open · {prog.total} total</div>
                  <div className="text-emerald-300 font-semibold mt-0.5">Open workspace →</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {projects.length === 0 ? (
        <div className={FINELY_OS_ENTITY_EMPTY}>
          <FolderKanban className="mx-auto mb-2 text-white/35" size={28} />
          No projects yet for this scope — your coach may add one soon.
        </div>
      ) : null}
    </div>
  );
}

export default WorkPartnerProjectsHub;
