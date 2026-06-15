import React, { useMemo } from 'react';
import { ArrowRight, Scale, TrendingUp, Layers, BriefcaseBusiness } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listDebtByPartner } from '../../data/debtRepo';
import { listDebtWorkflowTimers } from '../../lib/debtWorkflowEngine';
import { computeInquiryBudgetStatus } from '../../lib/fundingLadderEngine';
import { getTradelineOsSnapshot } from '../../lib/tradelineMarketplaceHub';
import { getBusinessCreditProfile } from '../../data/businessCreditRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

/** Unified debt / business / funding / tradeline lane strip (Phases 21–24). */
export function PartnerCreditLanesPanel({ partnerId, lane }: { partnerId: string; lane?: string }) {
  const navigate = useNavigate();

  const debtTimers = useMemo(() => {
    const debts = listDebtByPartner(partnerId);
    return debts.flatMap((d) => listDebtWorkflowTimers(d)).filter((t) => t.tone !== 'ok').slice(0, 3);
  }, [partnerId]);

  const funding = useMemo(() => computeInquiryBudgetStatus(partnerId), [partnerId]);
  const tradeline = useMemo(() => getTradelineOsSnapshot(partnerId), [partnerId]);
  const business = useMemo(() => getBusinessCreditProfile(partnerId), [partnerId]);
  const businessSteps = Object.values(business.roadmap ?? {}).filter(Boolean).length;
  const businessDone = Object.values(business.roadmap ?? {}).filter((s) => s?.done).length;

  const showDebt = lane === 'debt_kill' || debtTimers.length > 0;
  const showBusiness = lane === 'business_credit' || businessSteps > 0;
  const showTradeline = tradeline.openTasks > 0 || tradeline.completedTasks > 0;
  const showFunding = lane === 'business_credit' || funding.pullsLast30.length > 0 || funding.remainingThisMonth < funding.plan.monthlyInquiryBudget;

  if (!showDebt && !showBusiness && !showTradeline && !showFunding) return null;

  return (
    <div className={`space-y-3 ${finelyOsGlassShell('panel', 'sky')}`}>
      <div className={`${FINELY_OS_ENTITY_SUBLABEL} inline-flex items-center gap-2`}>
        <Layers size={14} className="text-sky-300" /> Credit lanes OS
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {showDebt ? (
          <button type="button" onClick={() => navigate('/portal/debt')} className={`text-left ${finelyOsGlassShell('inner', 'fuchsia')} p-3 hover:opacity-90`}>
            <Scale size={14} className="text-fuchsia-300 mb-1" />
            <div className={FINELY_OS_ENTITY_VALUE}>Debt OS</div>
            <div className={FINELY_OS_ENTITY_BODY}>
              {debtTimers.length ? `${debtTimers.length} active timer(s)` : 'No urgent deadlines'}
            </div>
          </button>
        ) : null}

        {showBusiness ? (
          <button type="button" onClick={() => navigate('/business/dashboard')} className={`text-left ${finelyOsGlassShell('inner', 'amber')} p-3 hover:opacity-90`}>
            <BriefcaseBusiness size={14} className="text-amber-300 mb-1" />
            <div className={FINELY_OS_ENTITY_VALUE}>Business credit</div>
            <div className={FINELY_OS_ENTITY_BODY}>
              {businessSteps ? `${businessDone}/${businessSteps} roadmap steps` : 'Start business profile'}
            </div>
          </button>
        ) : null}

        {showFunding ? (
          <button type="button" onClick={() => navigate('/portal/wealth-paths')} className={`text-left ${finelyOsGlassShell('inner', 'emerald')} p-3 hover:opacity-90`}>
            <TrendingUp size={14} className="text-emerald-300 mb-1" />
            <div className={FINELY_OS_ENTITY_VALUE}>Funding ladder</div>
            <div className={FINELY_OS_ENTITY_BODY}>{funding.remainingThisMonth} inquiry pull(s) left</div>
          </button>
        ) : null}

        {showTradeline ? (
          <button type="button" onClick={() => navigate('/tradelines')} className={`text-left ${finelyOsGlassShell('inner', 'violet')} p-3 hover:opacity-90`}>
            <Layers size={14} className="text-violet-300 mb-1" />
            <div className={FINELY_OS_ENTITY_VALUE}>Tradeline OS</div>
            <div className={FINELY_OS_ENTITY_BODY}>
              {tradeline.openTasks} open · {tradeline.completedTasks} done
            </div>
          </button>
        ) : null}
      </div>

      {debtTimers[0] ? (
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY} flex flex-wrap items-center justify-between gap-2`}>
          <span>
            <span className={FINELY_OS_ENTITY_CHIP}>{debtTimers[0].label}</span> — {debtTimers[0].daysRemaining}d left
          </span>
          <button type="button" onClick={() => navigate('/portal/debt')} className={FINELY_OS_SECONDARY_BTN}>
            Open debt workspace <ArrowRight size={12} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
