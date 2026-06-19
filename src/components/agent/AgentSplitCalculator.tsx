import React, { useMemo } from 'react';
import { Building2, GraduationCap, Percent, Sparkles, TrendingUp } from 'lucide-react';
import type { AgentOperatingModel } from '../../domain/agentProgram';
import {
  AGENT_TRAINING_PHASES,
  computeAgentRevenueSplit,
  formatAgentMoney,
  formatAgentPct,
  PLATFORM_VALUE_LEVERS,
  resolveLeverPerformer,
} from '../../domain/agentProgram';
import { CalculatorBarChart } from '../calculators/CalculatorBarChart';
import {
  FINELY_OS_CALC_INNER,
  FINELY_OS_CALC_INPUT,
  FINELY_OS_CALC_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_INFO,
  finelyOsCalcMetricTile,
} from '../../features/os/finelyOsLightUi';

type AgentSplitCalculatorProps = {
  model: AgentOperatingModel;
  onChangeModel?: (patch: Partial<AgentOperatingModel>) => void;
  onChangeLever?: (leverId: string, performer: 'platform' | 'agent' | 'shared') => void;
  onChangeSampleFee?: (cents: number) => void;
  compact?: boolean;
  showLeverControls?: boolean;
  /** When true, levers scroll inside a short panel instead of expanding the page. */
  leversScrollable?: boolean;
};

export function AgentSplitCalculator({
  model,
  onChangeModel,
  onChangeLever,
  onChangeSampleFee,
  compact = false,
  showLeverControls = true,
  leversScrollable = false,
}: AgentSplitCalculatorProps) {
  const split = useMemo(() => computeAgentRevenueSplit(model), [model]);

  return (
    <div className={`space-y-5 ${compact ? '' : FINELY_OS_CALC_SHELL}`}>
      {!compact ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-fuchsia-200 bg-fuchsia-500/15 border border-fuchsia-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Percent size={14} /> Revenue split calculator
            </div>
            <p className={`mt-3 max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>
              Revenue share only — no platform access fee. Your split shifts as you graduate training and take on more levers yourself.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid md:grid-cols-3 gap-4">
        <div className={finelyOsCalcMetricTile(true, 'fuchsia')}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Finely share</div>
          <div className={`mt-1 text-3xl font-bold tabular-nums ${FINELY_OS_ENTITY_VALUE}`}>
            {formatAgentPct(split.platformSharePct)}
          </div>
          <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>Platform, training & fulfillment we provide</div>
        </div>
        <div className={`${finelyOsCalcMetricTile(true, 'emerald')} ring-2 ring-emerald-400/25`}>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Your share</div>
          <div className="mt-1 text-3xl font-bold text-emerald-200 tabular-nums">{formatAgentPct(split.agentSharePct)}</div>
          <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>What you keep on client revenue</div>
        </div>
        <div className={finelyOsCalcMetricTile()}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Training phase</div>
          <div className={`mt-1 text-lg font-semibold flex items-center gap-2 ${FINELY_OS_ENTITY_VALUE}`}>
            <GraduationCap size={18} className="text-violet-300" />
            {split.phaseLabel}
          </div>
          {onChangeModel ? (
            <select
              value={model.trainingPhase}
              onChange={(e) => onChangeModel({ trainingPhase: e.target.value as AgentOperatingModel['trainingPhase'] })}
              className={`${FINELY_OS_ENTITY_SELECT} w-full mt-3 text-sm`}
            >
              {AGENT_TRAINING_PHASES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      {split.example ? (
        <div className={`${FINELY_OS_CALC_INNER} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
              <TrendingUp size={14} className="text-sky-300" />
              Example on a client fee
            </div>
            {onChangeSampleFee ? (
              <label className={`flex items-center gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                $
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={Math.round((model.sampleClientFeeCents ?? 0) / 100)}
                  onChange={(e) => onChangeSampleFee(Math.max(0, Math.round(Number(e.target.value) || 0) * 100))}
                  className={`${FINELY_OS_CALC_INPUT} w-28 font-mono !mt-0`}
                />
              </label>
            ) : (
              <span className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{formatAgentMoney(split.example.clientFeeCents)} client fee</span>
            )}
          </div>
          <CalculatorBarChart
            formatValue={(n) => formatAgentMoney(n)}
            bars={[
              { label: 'Finely', value: split.example.platformCents, color: 'linear-gradient(180deg, #c084fc, #7c3aed)' },
              { label: 'You', value: split.example.agentCents, color: 'linear-gradient(180deg, #34d399, #059669)' },
            ]}
            height={100}
          />
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className={FINELY_OS_ENTITY_BODY}>
              Client pays <span className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{formatAgentMoney(split.example.clientFeeCents)}</span>
            </div>
            <div className="text-fuchsia-300">Finely {formatAgentMoney(split.example.platformCents)}</div>
            <div className="text-emerald-300 font-semibold">You keep {formatAgentMoney(split.example.agentCents)}</div>
          </div>
        </div>
      ) : null}

      {showLeverControls ? (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Sparkles size={12} /> Value levers — who does the work?
          </div>
          <div
            className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 ${
              leversScrollable ? 'max-h-72 overflow-y-auto pr-1 fc-scroll-area' : ''
            }`}
          >
            {PLATFORM_VALUE_LEVERS.map((lever) => {
              const performer = resolveLeverPerformer(model, lever.id);
              return (
                <div key={lever.id} className={`${finelyOsCalcMetricTile()} p-3 space-y-2`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={`text-sm font-medium ${FINELY_OS_ENTITY_VALUE}`}>{lever.label}</div>
                      <div className={`text-xs leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{lever.description}</div>
                    </div>
                    {onChangeLever ? (
                      <select
                        value={performer}
                        onChange={(e) => onChangeLever(lever.id, e.target.value as 'platform' | 'agent' | 'shared')}
                        className={`${FINELY_OS_ENTITY_SELECT} text-xs shrink-0 w-28 !mt-0`}
                      >
                        <option value="platform">Finely</option>
                        <option value="shared">Shared</option>
                        <option value="agent">You</option>
                      </select>
                    ) : (
                      <span className={`${FINELY_OS_ENTITY_SUBLABEL} shrink-0`}>{performer}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className={`${FINELY_OS_NOTICE_INFO} flex items-start gap-2 text-xs`}>
          <Building2 size={14} className="text-violet-300 mt-0.5 shrink-0" />
          {split.summary}
        </div>
      ) : null}
    </div>
  );
}
