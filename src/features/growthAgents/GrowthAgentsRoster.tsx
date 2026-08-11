import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Zap } from 'lucide-react';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsDeckTile,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { listGrowthAgentsByWave, type GrowthAgentDef } from './growthAgentRegistry';
import { getAgentMaturity } from './growthAgentMaturity';
import { AgentStatusChip } from './GrowthAgentWorkspaceShell';
import { getCalebMaturity } from './growthAgentMaturity';
import { FinelyCapabilityScorecard } from '../admin/FinelyCapabilityScorecard';
import {
  countAutomationExceptions,
  getWhileYouSleptSummary,
  isGrowthAutopilotEnabled,
  runGrowthAutopilotTick,
  setGrowthAutopilotEnabled,
} from '../../lib/finelyAutomationOrchestrator';

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
  const [tick, setTick] = useState(0);
  const agents = useMemo(() => listGrowthAgentsByWave(), []);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (!isGrowthAutopilotEnabled()) return;
    void runGrowthAutopilotTick();
  }, []);

  const cards = useMemo(() => {
    void tick;
    return agents.map((a) => ({
      agent: a,
      maturity: getAgentMaturity(a),
      ready: agentReadyState(a),
    }));
  }, [agents, tick]);

  const autopilotOn = useMemo(() => {
    void tick;
    return isGrowthAutopilotEnabled();
  }, [tick]);

  const slept = useMemo(() => {
    void tick;
    return getWhileYouSleptSummary();
  }, [tick]);

  const exceptions = useMemo(() => {
    void tick;
    return countAutomationExceptions();
  }, [tick]);

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
        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-automation')}>
            Automation console
          </button>
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin/growth-agents/results')}>
            Open Results
          </button>
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('amber')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10">
              <Zap size={16} className="text-amber-200" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Growth autopilot</div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                {autopilotOn
                  ? 'Daily find, nurture, and scorecard run while you work.'
                  : 'Turn on to run overnight find + nurture from this hub.'}
              </p>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <span className={`text-xs font-semibold ${autopilotOn ? 'text-emerald-300' : 'text-white/50'}`}>
              {autopilotOn ? 'On' : 'Off'}
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-black/30 accent-amber-400"
              checked={autopilotOn}
              onChange={(e) => {
                setGrowthAutopilotEnabled(e.target.checked);
                setTick((t) => t + 1);
              }}
            />
          </label>
        </div>
      </div>

      {(slept.hasSignal || autopilotOn) && (
        <section className={`${finelyOsDeckTile('violet')} !p-4 space-y-2`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} inline-flex items-center gap-1.5`}>
                <Moon size={12} />
                While you slept
              </div>
              <p className="text-sm font-semibold text-white">{slept.summaryLine}</p>
              <p className={`mt-1 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                {exceptions > 0 ? `${exceptions} exception(s) need review. ` : ''}
                <button
                  type="button"
                  className="text-sky-300/90 underline underline-offset-2"
                  onClick={() => navigate('/admin/growth-automation')}
                >
                  Open console
                </button>
              </p>
            </div>
            {exceptions > 0 ? (
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin/growth-automation')}>
                Review exceptions
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={finelyOsMicroStat('violet')}>{slept.found} found</span>
            <span className={finelyOsMicroStat('emerald')}>{slept.autoSaved} auto-saved</span>
            <span className={finelyOsMicroStat('amber')}>{exceptions} exceptions</span>
            <span className={finelyOsMicroStat('sky')}>
              Quota {slept.quotaProgress.totalCount}/{slept.quotaProgress.totalCap}
            </span>
          </div>
        </section>
      )}

      <FinelyCapabilityScorecard variant="full" />

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
