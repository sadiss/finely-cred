import React, { useMemo, useState } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_PANEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,} from '../../features/os/finelyOsLightUi';

type FundingGoal = 'mortgage' | 'auto' | 'cards' | 'business';

const GOAL_BUDGET: Record<FundingGoal, { monthlyMax: number; minSpacingDays: number; label: string }> = {
  mortgage: { monthlyMax: 0, minSpacingDays: 90, label: 'Mortgage / major funding' },
  auto: { monthlyMax: 1, minSpacingDays: 45, label: 'Auto loan' },
  cards: { monthlyMax: 2, minSpacingDays: 30, label: 'Card / revolving stack' },
  business: { monthlyMax: 2, minSpacingDays: 45, label: 'Business credit / vendors' },
};

/** Phase 11D — public inquiry budget calculator for tradeline funnel. */
export function PublicInquiryBudgetCalculator() {
  const [goal, setGoal] = useState<FundingGoal>('cards');
  const [pulls30, setPulls30] = useState(0);
  const [pulls90, setPulls90] = useState(0);
  const [daysSinceLast, setDaysSinceLast] = useState<number | ''>('');

  const result = useMemo(() => {
    const plan = GOAL_BUDGET[goal];
    const remaining = Math.max(0, plan.monthlyMax - pulls30);
    const days = daysSinceLast === '' ? null : Number(daysSinceLast);
    const spacingOk = days == null || Number.isNaN(days) || days >= plan.minSpacingDays;
    const canApply = remaining > 0 && spacingOk;
    const tips: string[] = [];

    if (goal === 'mortgage') {
      tips.push('Avoid new hard pulls 90+ days before mortgage shopping unless strategically necessary.');
    }
    if (pulls90 >= 6) {
      tips.push('Six or more pulls in 90 days often triggers manual review — slow down.');
    }
    if (!spacingOk && days != null) {
      tips.push(`Wait ${Math.max(0, plan.minSpacingDays - days)} more day(s) before the next application.`);
    }
    if (remaining <= 0 && plan.monthlyMax > 0) {
      tips.push(`Monthly inquiry budget used (${plan.monthlyMax} for ${plan.label}).`);
    }
    if (canApply && plan.monthlyMax > 0) {
      tips.push(`You have room for ~${remaining} pull(s) this month for your ${plan.label} goal.`);
    }

    return { plan, remaining, canApply, spacingOk, tips };
  }, [goal, pulls30, pulls90, daysSinceLast]);

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4 text-left`}>
      <div className="flex items-center gap-2 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
        <Calculator size={14} /> Inquiry budget calculator
      </div>
      <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
        Plan hard pulls before tradeline or funding moves — educational only, not a guarantee of approval.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className={FINELY_OS_ENTITY_LABEL}>Funding goal</span>
          <select value={goal} onChange={(e) => setGoal(e.target.value as FundingGoal)} className={FINELY_OS_ENTITY_SELECT}>
            {(Object.keys(GOAL_BUDGET) as FundingGoal[]).map((g) => (
              <option key={g} value={g}>
                {GOAL_BUDGET[g].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className={FINELY_OS_ENTITY_LABEL}>Hard pulls (last 30 days)</span>
          <input
            type="number"
            min={0}
            max={20}
            value={pulls30}
            onChange={(e) => setPulls30(Math.max(0, Number(e.target.value) || 0))}
            className={FINELY_OS_ENTITY_INPUT}
          />
        </label>
        <label className="block space-y-1">
          <span className={FINELY_OS_ENTITY_LABEL}>Hard pulls (last 90 days)</span>
          <input
            type="number"
            min={0}
            max={50}
            value={pulls90}
            onChange={(e) => setPulls90(Math.max(0, Number(e.target.value) || 0))}
            className={FINELY_OS_ENTITY_INPUT}
          />
        </label>
        <label className="block space-y-1">
          <span className={FINELY_OS_ENTITY_LABEL}>Days since last pull (optional)</span>
          <input
            type="number"
            min={0}
            max={365}
            value={daysSinceLast}
            onChange={(e) => setDaysSinceLast(e.target.value === '' ? '' : Math.max(0, Number(e.target.value) || 0))}
            className={FINELY_OS_ENTITY_INPUT}
            placeholder="e.g. 14"
          />
        </label>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 space-y-2">
        <div className={`${FINELY_OS_ENTITY_VALUE} flex items-center gap-2`}>
          <TrendingUp size={16} className="text-emerald-400" />
          {result.canApply ? 'Room to apply with discipline' : 'Pause — spacing or budget tight'}
        </div>
        <ul className={`${FINELY_OS_ENTITY_BODY} text-sm space-y-1 list-disc pl-4`}>
          {result.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
