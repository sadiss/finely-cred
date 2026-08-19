import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AGENT_ARCHITECT,
  GROWTH_AGENTS,
  listCalebSubagentWorkers,
  type GrowthAgentDef,
} from '../growthAgents/growthAgentRegistry';
import { getMarketingCopilotRecommendation } from './marketingCopilotRecommendations';
import { agentWorkroomHref, listAgentDailyTasks, type AgentDailyTask } from './agentDailyTasks';
import { buildAgentLiveStatusChips } from './agentLiveStatus';
import { getDeskWorkGoesToLabel, resolveHumanBackupForAgent } from './agentHumanBackup';
import { isMetaIntegrationLive } from '../../data/metaIntegrationRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { MARKETING_HUB_CONTENT_SHELL, marketingVividShell } from './marketingHubUi';
import { MarketingHelpButton } from './MarketingHelpModal';

type AgentTaskHierarchyPanelProps = {
  scope?: 'desk' | 'team';
  showArchitect?: boolean;
};

function taskHref(agent: GrowthAgentDef, task: AgentDailyTask): string {
  if (task.href) return task.href;
  if (task.runKey) return `/admin/growth-agents/${agent.id}?run=${task.runKey}`;
  return agentWorkroomHref(agent);
}

function AgentTaskTile({
  agent,
  task,
  highlighted,
}: {
  agent: GrowthAgentDef;
  task: AgentDailyTask;
  highlighted?: boolean;
}) {
  const navigate = useNavigate();
  const freq =
    task.frequency === 'daily' ? 'Daily' : task.frequency === 'weekly' ? 'Weekly' : 'On demand';

  return (
    <button
      type="button"
      onClick={() => navigate(taskHref(agent, task))}
      className={`${marketingVividShell(highlighted ? 'emerald' : 'sky')} !p-3 text-left w-full min-h-[5.5rem] flex flex-col justify-between ${
        highlighted ? 'ring-2 ring-white/40' : ''
      }`}
    >
      <div>
        <span className={FINELY_OS_ENTITY_CHIP}>{freq}</span>
        <div className="mt-2 text-sm font-bold text-white leading-snug">{task.label}</div>
        <p className={`mt-1 text-[11px] line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>{task.description}</p>
      </div>
    </button>
  );
}

function AgentHierarchyCard({
  agent,
  scope,
  copilotHref,
  defaultExpanded,
}: {
  agent: GrowthAgentDef;
  scope: 'desk' | 'team';
  copilotHref?: string;
  defaultExpanded?: boolean;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const tasks = useMemo(
    () => listAgentDailyTasks(agent.id, scope === 'desk' ? 'daily' : 'all'),
    [agent.id, scope],
  );
  const chips = useMemo(() => buildAgentLiveStatusChips(agent), [agent]);
  const humanBackup = useMemo(() => resolveHumanBackupForAgent(agent), [agent]);
  const subagents = agent.subagents ?? (agent.id === 'lead-discovery' ? listCalebSubagentWorkers() : []);
  const metaLive = agent.id === 'social' ? isMetaIntegrationLive() : false;

  return (
    <div className={`${finelyOsCatalogCard(agent.accent)} !p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setExpanded((e) => !e)}>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>{agent.roleTitle}</p>
          <h3 className={`${FINELY_OS_ENTITY_TITLE} text-lg`}>{agent.name}</h3>
          <p className={`mt-1 text-sm line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>{agent.mission}</p>
        </button>
        <button type="button" className="rounded-lg bg-black/30 px-2 py-1 text-[10px] font-bold uppercase" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Hide tasks' : `${tasks.length} tasks`}
        </button>
      </div>

      {chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.slice(0, 4).map((c) => (
            <span key={c.label} className={finelyOsMicroStat(c.accent)}>
              {c.label}
            </span>
          ))}
          {metaLive ? <span className={finelyOsMicroStat('fuchsia')}>Meta live</span> : null}
        </div>
      ) : null}

      <div className="mt-2 grid sm:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/15 bg-black/25 px-2.5 py-2 text-[10px] text-white/75">
          <span className="font-bold text-white/50 uppercase tracking-widest">Desk seat</span>
          <div className="mt-0.5 font-semibold text-white">{getDeskWorkGoesToLabel()}</div>
        </div>
        {humanBackup ? (
          <div className="rounded-xl border border-white/15 bg-black/25 px-2.5 py-2 text-[10px] text-white/75">
            <span className="font-bold text-white/50 uppercase tracking-widest">Human backup</span>
            <div className="mt-0.5 font-semibold text-white">
              {humanBackup.name} · {humanBackup.title}
            </div>
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div className="mt-3 border-t border-white/10 pt-3 space-y-3">
          <div className="grid sm:grid-cols-2 gap-2">
            {tasks.map((task) => (
              <AgentTaskTile
                key={task.id}
                agent={agent}
                task={task}
                highlighted={Boolean(copilotHref && taskHref(agent, task) === copilotHref)}
              />
            ))}
          </div>
          {subagents.length > 0 && scope === 'team' ? (
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>
                Pipeline workers
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {subagents.map((w) => (
                  <span key={w.id} className={finelyOsMicroStat('violet')} title={w.role}>
                    {w.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => navigate(agentWorkroomHref(agent))}
          >
            Open workroom
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AgentTaskHierarchyPanel({
  scope = 'team',
  showArchitect = true,
}: AgentTaskHierarchyPanelProps) {
  const [tick, setTick] = useState(0);
  const copilot = useMemo(() => {
    void tick;
    return getMarketingCopilotRecommendation();
  }, [tick]);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const agents =
    scope === 'desk'
      ? GROWTH_AGENTS.filter((a) =>
          ['lead-discovery', 'appointment-setter', 'capture-links', 'social'].includes(a.id),
        )
      : GROWTH_AGENTS;

  return (
    <div className={`${MARKETING_HUB_CONTENT_SHELL} space-y-3`}>
      <div>
        <p className={FINELY_OS_ENTITY_SUBLABEL}>{scope === 'desk' ? 'Daily desk' : 'Marketing team'}</p>
        <h2 className={FINELY_OS_ENTITY_TITLE}>
          {scope === 'desk' ? 'Today’s agent missions' : 'Your growth specialists'}
        </h2>
        <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Tap a card to expand tasks — open workroom for the full cockpit.
        </p>
      </div>

      {showArchitect && scope === 'team' ? (
        <AgentHierarchyCard agent={AGENT_ARCHITECT} scope={scope} copilotHref={copilot.href} defaultExpanded={false} />
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3">
        {agents.map((agent) => (
          <AgentHierarchyCard
            key={agent.id}
            agent={agent}
            scope={scope}
            copilotHref={copilot.href}
            defaultExpanded={scope === 'desk' && agent.id === 'lead-discovery'}
          />
        ))}
      </div>
    </div>
  );
}
