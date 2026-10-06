import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';
import { getGrowthAgent } from '../growthAgents/growthAgentRegistry';

const STRIP_AGENT_IDS = ['lead-discovery', 'capture-links', 'marketing-director', 'results'] as const;

/** Compact growth-agent strip — daily desk links to Caleb, not overnight/swarm labs. */
export function MarketingDeskAgentStrip() {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Growth team</div>
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
              className={
                primary
                  ? 'rounded-lg border border-emerald-800 bg-emerald-800 px-2 py-1 text-xs font-black uppercase tracking-widest text-[#f8fafc]'
                  : 'rounded-lg border border-violet-800 bg-violet-800 px-2 py-1 text-xs font-black uppercase tracking-widest text-[#f8fafc]'
              }
              title={agent.roleTitle}
              onClick={() => navigate(`/admin/growth-agents/${id}`)}
            >
              {agent.name.split(' ')[0]} · {agent.roleTitle.split(' ')[0]}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] font-semibold text-slate-600">
        Live finds live on Caleb — not Overnight50 simulation counters.
      </p>
    </div>
  );
}
