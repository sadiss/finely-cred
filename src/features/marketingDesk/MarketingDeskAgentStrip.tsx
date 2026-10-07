import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getGrowthAgent } from '../growthAgents/growthAgentRegistry';

const STRIP_AGENT_IDS = ['lead-discovery', 'capture-links', 'marketing-director', 'results'] as const;

const AGENT_CHIP =
  'rounded-lg border border-slate-800 bg-slate-800 px-2 py-1 text-xs font-black uppercase tracking-widest text-[#f8fafc] hover:bg-slate-700 transition';

/** Compact growth-agent roster — quiet slate chips, no desk CTAs. */
export function MarketingDeskAgentStrip() {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Team</div>
      <div className="flex flex-wrap gap-2">
        {STRIP_AGENT_IDS.map((id) => {
          const agent = getGrowthAgent(id);
          if (!agent) return null;
          return (
            <button
              key={id}
              type="button"
              className={AGENT_CHIP}
              title={agent.roleTitle}
              onClick={() => navigate(`/admin/growth-agents/${id}`)}
            >
              {agent.name.split(' ')[0]} · {agent.roleTitle.split(' ')[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
