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
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const LANE_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

const ICON_TONE: Record<(typeof LANE_ACCENTS)[number], string> = {
  emerald: 'text-emerald-300',
  violet: 'text-violet-300',
  sky: 'text-sky-300',
  rose: 'text-rose-300',
};

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

  const tiles = [
    showDebt
      ? {
          key: 'debt',
          title: 'Debt OS',
          body: debtTimers.length ? `${debtTimers.length} active timer(s)` : 'No urgent deadlines',
          href: '/portal/debt',
          icon: Scale,
        }
      : null,
    showBusiness
      ? {
          key: 'business',
          title: 'Business credit',
          body: businessSteps ? `${businessDone}/${businessSteps} roadmap steps` : 'Start business profile',
          href: '/business/dashboard',
          icon: BriefcaseBusiness,
        }
      : null,
    showFunding
      ? {
          key: 'funding',
          title: 'Funding ladder',
          body: `${funding.remainingThisMonth} inquiry pull(s) left`,
          href: '/portal/wealth-paths',
          icon: TrendingUp,
        }
      : null,
    showTradeline
      ? {
          key: 'tradeline',
          title: 'Tradeline OS',
          body: `${tradeline.openTasks} open · ${tradeline.completedTasks} done`,
          href: '/tradelines',
          icon: Layers,
        }
      : null,
  ].filter((t): t is NonNullable<typeof t> => Boolean(t));

  if (!tiles.length) return null;

  return (
    <div className={`${finelyOsCatalogCard('sky')} space-y-5`} data-fc-accent="sky">
      <div className={`${FINELY_OS_ENTITY_SUBLABEL} inline-flex items-center gap-2 text-sm`}>
        <Layers size={18} className="text-sky-300" /> Credit lanes
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile, idx) => {
          const accent = LANE_ACCENTS[idx % LANE_ACCENTS.length];
          const Icon = tile.icon;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => navigate(tile.href)}
              className={`${finelyOsCatalogCard(accent)} text-left min-h-[10rem]`}
              data-fc-accent={accent}
            >
              <Icon size={22} className={`${ICON_TONE[accent]} mb-3`} />
              <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tile.title}</div>
              <div className={`mt-2 text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>{tile.body}</div>
            </button>
          );
        })}
      </div>

      {debtTimers[0] ? (
        <div className={`${FINELY_OS_ENTITY_BODY} flex flex-wrap items-center justify-between gap-3 text-base`}>
          <span>
            <span className={FINELY_OS_ENTITY_CHIP}>{debtTimers[0].label}</span> — {debtTimers[0].daysRemaining}d left
          </span>
          <button type="button" onClick={() => navigate('/portal/debt')} className={FINELY_OS_SECONDARY_BTN}>
            Open debt workspace <ArrowRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
