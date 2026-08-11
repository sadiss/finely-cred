import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { getGrowthAgent } from '../growthAgents/growthAgentRegistry';

const STRIP_AGENT_IDS = ['lead-discovery', 'capture-links', 'marketing-director', 'results'] as const;

/** Compact growth-agent strip — daily desk links to Caleb, not overnight/swarm labs. */
export function MarketingDeskAgentStrip() {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 !p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Growth team</div>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => navigate('/admin/growth-agents/lead-discovery')}
        >
          Open Caleb desk
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {STRIP_AGENT_IDS.map((id) => {
          const agent = getGrowthAgent(id);
          if (!agent) return null;
          const primary = id === 'lead-discovery';
          return (
            <button
              key={id}
              type="button"
              className={finelyOsMicroStat(primary ? 'emerald' : 'violet')}
              title={agent.roleTitle}
              onClick={() => navigate(`/admin/growth-agents/${id}`)}
            >
              {agent.name.split(' ')[0]} · {agent.roleTitle.split(' ')[0]}
            </button>
          );
        })}
      </div>
      <p className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
        Live finds live on Caleb — not Overnight50 simulation counters.
      </p>
    </div>
  );
}
