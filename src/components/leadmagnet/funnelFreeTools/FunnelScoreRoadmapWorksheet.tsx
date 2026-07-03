import React, { useMemo, useState } from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { FunnelToolkitChecklistPanel } from './FunnelToolkitChecklistPanel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../../features/os/finelyOsLightUi';

const ROADMAP_STEPS = [
  { id: 'utilization', label: 'Step 1 — Utilization under 30%', hint: 'Pay down revolving balances before new applications.' },
  { id: 'disputes', label: 'Step 2 — Dispute high-impact negatives', hint: 'Collections and charge-offs before minor lates.' },
  { id: 'mix', label: 'Step 3 — Credit mix optimization', hint: 'Installment + revolving when file is clean enough.' },
  { id: 'age', label: 'Step 4 — Age & inquiry discipline', hint: 'No unnecessary hard pulls for 90+ days.' },
  { id: 'funding', label: 'Step 5 — Funding-ready optics', hint: 'AU tradelines or builder products only when file supports it.' },
];

type Props = { leadId: string; email: string };

export function FunnelScoreRoadmapWorksheet({ leadId, email }: Props) {
  const [currentScore, setCurrentScore] = useState(580);
  const [targetScore, setTargetScore] = useState(720);
  const [revolvingUtil, setRevolvingUtil] = useState(65);

  const plan = useMemo(() => {
    const gap = targetScore - currentScore;
    const months = gap <= 40 ? 4 : gap <= 80 ? 8 : 12;
    const priorities: string[] = [];
    if (revolvingUtil > 30) priorities.push(`Drop utilization from ${revolvingUtil}% → under 30% first (fastest score lift).`);
    if (gap > 60) priorities.push('Dispute or settle high-balance collections before opening new accounts.');
    priorities.push(`Timeline estimate: ${months}–${months + 3} months with disciplined execution.`);
    priorities.push('Avoid new hard inquiries until Steps 1–2 show progress on your next pull.');
    return { gap, months, priorities };
  }, [currentScore, targetScore, revolvingUtil]);

  return (
    <div className="space-y-4">
      <FunnelToolkitChecklistPanel
        leadId={leadId}
        email={email}
        funnelId="score_roadmap"
        title="5-step score recovery worksheet"
        subtitle="Check off each phase — mirrors your downloadable roadmap PDF."
        accent="emerald"
        items={ROADMAP_STEPS}
      />

      <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-4 text-left`}>
        <div className="flex items-center gap-2 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
          <TrendingUp size={14} /> Personalized score gap planner
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block space-y-1">
            <span className={FINELY_OS_ENTITY_LABEL}>Current score (est.)</span>
            <input type="number" min={300} max={850} value={currentScore} onChange={(e) => setCurrentScore(Number(e.target.value) || 0)} className={FINELY_OS_ENTITY_INPUT} />
          </label>
          <label className="block space-y-1">
            <span className={FINELY_OS_ENTITY_LABEL}>Target score</span>
            <input type="number" min={300} max={850} value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value) || 0)} className={FINELY_OS_ENTITY_INPUT} />
          </label>
          <label className="block space-y-1">
            <span className={FINELY_OS_ENTITY_LABEL}>Revolving utilization %</span>
            <input type="number" min={0} max={100} value={revolvingUtil} onChange={(e) => setRevolvingUtil(Number(e.target.value) || 0)} className={FINELY_OS_ENTITY_INPUT} />
          </label>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <div>
            <div className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>+{plan.gap} point path</div>
            <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>~{plan.months} month execution window</div>
          </div>
          <Target size={28} className="text-emerald-300" />
        </div>
        <ul className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1 list-disc pl-4`}>
          {plan.priorities.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
