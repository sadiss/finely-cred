import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../os/finelyOsLightUi';
import { listGrowthAgentsByWave, type GrowthAgentDef } from './growthAgentRegistry';
import { getAgentMaturity } from './growthAgentMaturity';
import { AgentStatusChip } from './GrowthAgentWorkspaceShell';
import { getCalebMaturity } from './growthAgentMaturity';

function agentReadyState(agent: GrowthAgentDef): 'ready' | 'setup' | 'soon' {
  if (agent.wave > 2) return 'soon';
  if (agent.id === 'lead-discovery') {
    const m = getCalebMaturity();
    return m.percent >= 60 ? 'ready' : 'setup';
  }
  return agent.wave <= 1 ? 'ready' : 'soon';
}

export function GrowthAgentsRoster() {
  const navigate = useNavigate();
  const [tick] = useState(0);
  const agents = useMemo(() => listGrowthAgentsByWave(), []);

  const cards = useMemo(() => {
    void tick;
    return agents.map((a) => ({
      agent: a,
      maturity: getAgentMaturity(a),
      ready: agentReadyState(a),
    }));
  }, [agents, tick]);

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Growth Agents</div>
          <h2 className={`${FINELY_OS_ENTITY_TITLE} text-white`}>Your growth team</h2>
          <p className={`text-sm max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>
            Each specialist has a job. Start with Caleb to find people, Hannah for links, Results for the scoreboard.
          </p>
        </div>
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin/growth-agents/results')}>
          Open Results
        </button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {cards.map(({ agent, maturity, ready }) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => navigate(`/admin/growth-agents/${agent.id}`)}
            className={`${finelyOsCatalogCardCompact(agent.accent)} text-left hover:brightness-110 transition`}
          >
            <div className="flex items-center justify-between gap-2">
              <AgentStatusChip ready={ready} />
              <span className="text-xs text-white/50">Wave {agent.wave}</span>
            </div>
            <div className="mt-2 text-lg font-black text-white">{agent.name}</div>
            <div className="text-xs font-semibold text-white/70">{agent.roleTitle}</div>
            <p className={`mt-2 text-sm line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>{agent.mission}</p>
            <p className="mt-2 text-xs text-white/50">{maturity.percent}% ready · {maturity.label}</p>
          </button>
        ))}
      </div>

      <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing-desk')}>
        Caleb&apos;s workroom (Marketing Desk)
      </button>
    </div>
  );
}
