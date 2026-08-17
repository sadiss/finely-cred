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
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

type AgentTaskHierarchyPanelProps = {
  /** Daily desk: only daily-frequency tasks. Team tab: full roster. */
  scope?: 'desk' | 'team';
  /** Show Ezra architect card on team tab. */
  showArchitect?: boolean;
};

function taskHref(agent: GrowthAgentDef, task: AgentDailyTask): string {
  if (task.href) return task.href;
  if (task.runKey) return `/admin/growth-agents/${agent.id}?run=${task.runKey}`;
  return agentWorkroomHref(agent);
}

function AgentTaskRow({
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
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
        highlighted ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-black/20'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">{task.label}</div>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{task.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className={FINELY_OS_ENTITY_CHIP}>{freq}</span>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => navigate(taskHref(agent, task))}
        >
          Open
        </button>
      </div>
    </div>
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
  const [expanded, setExpanded] = useState(defaultExpanded ?? agent.id === 'lead-discovery');
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
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <p className={FINELY_OS_ENTITY_SUBLABEL}>{agent.roleTitle}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={`${FINELY_OS_ENTITY_TITLE} text-lg`}>{agent.name}</h3>
          <span className={finelyOsStatusChip('ok')}>{expanded ? 'Collapse' : 'Expand'}</span>
        </div>
        <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{agent.mission}</p>
        {chips.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c.label} className={finelyOsMicroStat(c.accent)}>
                {c.label}
              </span>
            ))}
            {metaLive ? (
              <span className={finelyOsMicroStat('fuchsia')}>Meta publish live</span>
            ) : null}
          </div>
        ) : null}
        <p className={`mt-2 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
          Desk work goes to: <span className="text-white/90">{getDeskWorkGoesToLabel()}</span>
          {humanBackup ? (
            <>
              {' '}
              · Human backup: <span className="text-white/90">{humanBackup.name}</span> ({humanBackup.title})
            </>
          ) : null}
        </p>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {tasks.map((task) => (
            <AgentTaskRow
              key={task.id}
              agent={agent}
              task={task}
              highlighted={Boolean(copilotHref && taskHref(agent, task) === copilotHref)}
            />
          ))}
          {subagents.length > 0 && scope === 'team' ? (
            <div className="pt-2">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>
                Pipeline workers
              </p>
              <ul className="mt-2 space-y-1">
                {subagents.map((w) => (
                  <li key={w.id} className="text-xs text-white/75">
                    <span className="font-semibold text-white">{w.label}</span>
                    <span className="text-white/50"> — {w.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <button
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} mt-2`}
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
    <div className="space-y-3">
      <div>
        <p className={FINELY_OS_ENTITY_SUBLABEL}>{scope === 'desk' ? 'Daily desk' : 'Marketing team'}</p>
        <h2 className={FINELY_OS_ENTITY_TITLE}>
          {scope === 'desk' ? 'Agents → today’s tasks' : 'Agents → tasks'}
        </h2>
        <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Each specialist shows live status and daily work — open their task or workroom directly.
        </p>
      </div>

      {showArchitect && scope === 'team' ? (
        <AgentHierarchyCard agent={AGENT_ARCHITECT} scope={scope} copilotHref={copilot.href} />
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3">
        {agents.map((agent) => (
          <AgentHierarchyCard
            key={agent.id}
            agent={agent}
            scope={scope}
            copilotHref={copilot.href}
            defaultExpanded={agent.id === 'lead-discovery'}
          />
        ))}
      </div>
    </div>
  );
}
