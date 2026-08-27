import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Landmark, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import type { PartnerOverallScoreResult } from '../../utils/partnerOverallScore';
import { FUNDING_GOAL_PRESETS, formatFundingAmount, savePartnerFundingTarget } from '../../lib/partnerGoals';
import { computeReadinessScore } from '../../domain/capitalReadiness';
import { computeMiddleScore } from '../../domain/creditScoreMiddle';
import { addRelationship, getOrCreateCapitalPlan, setCapitalTargetBand, upsertCapitalPlan } from '../../data/capitalReadinessRepo';
import { LenderLogicEngine } from '../dashboard/LenderLogicEngine';
import { listReportsByPartner } from '../../data/reportsRepo';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_PANEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
  finelyOsKpiTile,
  finelyOsStatusChip,
  finelyOsCatalogCard,} from '../../features/os/finelyOsLightUi';
import {
  finelyOsVisibleTintShell,
  finelyOsVisibleTintMuted,
} from '../../features/os/finelyOsVisibleTint';
import {
  WL_ENTITY_BODY,
  WL_ENTITY_SUBLABEL,
  WL_ENTITY_TITLE,
  WL_ENTITY_VALUE,
  WL_SOLID_ACTION_BTN,
  WL_SOLID_ACTION_BTN_EMERALD,
  WL_SOLID_ACTION_BTN_SKY,
  WL_SOLID_ACTION_BTN_VIOLET,
} from '../../features/workspaceLightPreview/wlLightUi';

type Props = {
  partner: Partner;
  overallScore: PartnerOverallScoreResult | null;
  onSaved?: () => void;
  /** `light` = ivory bed with visible tints and always-readable ink */
  surface?: 'dark' | 'light';
};

export function ProfileGoalsReadinessPanel({ partner, overallScore, onSaved, surface = 'dark' }: Props) {
  const navigate = useNavigate();
  const routeKey = partner.primaryRoute || 'personal_restore';
  const intake = partner.routes?.[routeKey];
  const personal = intake?.personal ?? {};
  const savedTarget = typeof intake?.fundingTarget === 'number' ? intake.fundingTarget : 0;

  const [goalInput, setGoalInput] = useState(String(savedTarget || ''));
  const [editingGoal, setEditingGoal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const plan = useMemo(() => getOrCreateCapitalPlan(partner.id), [partner.id, msg]);
  const capitalScore = useMemo(() => computeReadinessScore(plan), [plan]);
  const readinessPct = overallScore?.overall ?? capitalScore;

  const reports = useMemo(() => listReportsByPartner(partner.id), [partner.id]);
  const latestParsed = reports[0]?.parsed ?? null;
  const middleScore = useMemo(() => computeMiddleScore(latestParsed?.scores ?? []), [latestParsed]);
  const creditScore = useMemo(() => {
    if (middleScore.value != null) return middleScore.value;
    return typeof intake?.score === 'number' && intake.score >= 300 ? intake.score : 680;
  }, [middleScore, intake?.score]);

  const zip = personal.postalCode || '';
  const revenue = partner.financial?.annualIncome ? Math.round(partner.financial.annualIncome / 12) : 8000;
  const targetedLenders = plan.relationships.filter((r) => r.stage === 'targeted' || r.stage === 'active_applications');

  useEffect(() => {
    setGoalInput(String(savedTarget || ''));
  }, [savedTarget]);

  const saveGoal = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const goal = Math.max(0, Math.round(Number(goalInput.replace(/[^\d]/g, '')) || 0));
      await savePartnerFundingTarget(partner, goal);
      setEditingGoal(false);
      setMsg('Funding goal saved to your profile.');
      onSaved?.();
    } catch (e) {
      setMsg((e as Error)?.message || 'Could not save goal.');
    } finally {
      setBusy(false);
    }
  };

  const setTargetBand = (band: typeof plan.targetBand) => {
    setCapitalTargetBand(partner.id, band);
    setMsg('Capital target band updated.');
    onSaved?.();
  };

  const markTargetLender = (lenderName: string, type: 'bank' | 'credit_union') => {
    const existing = plan.relationships.find((r) => r.lenderName === lenderName);
    if (existing) {
      upsertCapitalPlan({
        ...plan,
        relationships: plan.relationships.map((r) =>
          r.lenderName === lenderName ? { ...r, stage: 'targeted', updatedAt: new Date().toISOString() } : r,
        ),
      });
    } else {
      addRelationship(partner.id, { lenderName, type });
      const refreshed = getOrCreateCapitalPlan(partner.id);
      upsertCapitalPlan({
        ...refreshed,
        relationships: refreshed.relationships.map((r) =>
          r.lenderName === lenderName ? { ...r, stage: 'targeted' } : r,
        ),
      });
    }
    setMsg(`Target lender set: ${lenderName}. Readiness below updates to this bank's requirements.`);
    onSaved?.();
  };

  const light = surface === 'light';
  const body = light ? WL_ENTITY_BODY : FINELY_OS_ENTITY_BODY;
  const sublabel = light ? WL_ENTITY_SUBLABEL : FINELY_OS_ENTITY_SUBLABEL;
  const title = light ? WL_ENTITY_TITLE : FINELY_OS_ENTITY_TITLE;
  const value = light ? WL_ENTITY_VALUE : FINELY_OS_ENTITY_VALUE;

  return (
    <div className={`space-y-6 ${light ? 'fc-wl-readiness-light' : ''}`} id="profile-goals-readiness" data-fc-surface={surface}>
      <div
        className={
          light
            ? `${finelyOsVisibleTintShell('emerald', '!p-4 border-t-4 border-t-emerald-500')}`
            : `${finelyOsGlassShell('panel', 'emerald')}`
        }
      >
        <div className={`inline-flex items-center gap-2 ${light ? 'text-emerald-700' : 'text-emerald-300'}`}>
          <Target size={18} />
          <span className={sublabel}>Profile goals & readiness</span>
        </div>
        <h2 className={`mt-2 ${title}`}>Your capital profile — not account settings</h2>
        <p className={`mt-2 ${body} max-w-3xl`}>
          Funding goals, readiness score, and credit-stacking bank fit live on your partner profile. Pick target lenders and we tailor readiness to their requirements (deposits, score, utilization, time in business).
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div
          className={
            light
              ? `${finelyOsVisibleTintShell('sky', '!p-4 border-t-4 border-t-sky-500')}`
              : finelyOsKpiTile(2)
          }
        >
          <p className={`${sublabel} ${light ? 'text-sky-800' : 'text-sky-300'}`}>Funding goal</p>
          {editingGoal ? (
            <div className="mt-3 space-y-2">
              <input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value.replace(/[^\d]/g, ''))}
                className={`${light ? 'w-full rounded-lg border border-sky-300/60 bg-white px-3 py-2 text-[#0a1628]' : FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} font-mono`}
                placeholder="100000"
              />
              <div className="flex flex-wrap gap-1">
                {FUNDING_GOAL_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setGoalInput(String(p.value))}
                    className={light ? WL_SOLID_ACTION_BTN_SKY : FINELY_OS_SECONDARY_BTN}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button type="button" disabled={busy} onClick={() => void saveGoal()} className={FINELY_OS_PRIMARY_BTN}>
                Save
              </button>
            </div>
          ) : (
            <>
              <p className={`text-3xl font-bold mt-2 ${light ? 'text-sky-900' : 'text-sky-300'}`}>
                {savedTarget > 0 ? formatFundingAmount(savedTarget) : '—'}
              </p>
              <button
                type="button"
                onClick={() => setEditingGoal(true)}
                className={`mt-3 text-[10px] font-black uppercase tracking-widest ${light ? 'text-sky-800' : 'text-sky-300/80'}`}
              >
                {savedTarget > 0 ? 'Update goal' : 'Set funding goal'}
              </button>
            </>
          )}
        </div>

        <div
          className={
            light
              ? `${finelyOsVisibleTintShell('emerald', '!p-4 border-t-4 border-t-emerald-500')}`
              : finelyOsKpiTile(1)
          }
        >
          <p className={`${sublabel} ${light ? 'text-emerald-800' : 'text-emerald-300'}`}>Profile readiness</p>
          <p className={`text-3xl font-bold mt-2 ${light ? 'text-emerald-900' : 'text-emerald-300'}`}>
            {readinessPct != null ? `${readinessPct}%` : '—'}
          </p>
          <p className={`text-xs mt-2 ${light ? finelyOsVisibleTintMuted('emerald') : body}`}>
            Docs {capitalScore}% • disputes • reports • wealth-path milestones
          </p>
        </div>

        <div
          className={
            light
              ? `${finelyOsVisibleTintShell('violet', '!p-4 border-t-4 border-t-violet-500')}`
              : finelyOsKpiTile(0)
          }
        >
          <p className={sublabel}>Capital target band</p>
          <select
            value={plan.targetBand}
            onChange={(e) => setTargetBand(e.target.value as typeof plan.targetBand)}
            className={`${light ? 'w-full mt-2 rounded-lg border border-violet-300/55 bg-white px-3 py-2 text-sm text-[#0a1628]' : `${FINELY_OS_ENTITY_SELECT} w-full mt-2 text-sm`}`}
          >
            <option value="six_fig">$100K–$500K</option>
            <option value="seven_fig">$500K–$2M</option>
            <option value="eight_fig">$2M–$10M</option>
            <option value="nine_fig">$10M–$50M</option>
            <option value="ten_fig_plus">$50M+</option>
          </select>
        </div>
      </div>

      {targetedLenders.length > 0 ? (
        <div
          className={
            light
              ? `${finelyOsVisibleTintShell('amber', '!p-5 border-t-4 border-t-amber-500')}`
              : `${finelyOsCatalogCard('violet')} !p-5 p-4`
          }
        >
          <p className={`${sublabel} mb-2 ${light ? 'text-amber-900' : 'text-amber-300'}`}>Your target stacking banks</p>
          <div className="flex flex-wrap gap-2">
            {targetedLenders.map((r) => (
              <span key={r.id} className={finelyOsStatusChip('warn')}>
                {r.lenderName}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={
          light
            ? `${finelyOsVisibleTintShell('sky', '!p-5 space-y-3 border-t-4 border-t-sky-500')}`
            : `${finelyOsCatalogCard('violet')} !p-5 space-y-3`
        }
      >
        <div className="flex items-center gap-2">
          <Landmark size={16} className={light ? 'text-sky-700' : 'text-violet-400'} />
          <span className={value}>Recommended lenders · credit stacking fit</span>
        </div>
        <p className={body}>
          We prioritize credit unions and relationship-based local banks that often grant higher limits than big-box nationals.
          {zip ? ` Using ZIP ${zip} from your profile.` : ' Add ZIP in Contact & address to unlock local matches.'}
        </p>
        <LenderLogicEngine
          userScore={creditScore}
          utilizationPct={9}
          revenueMonthly={revenue}
          timeInBusinessMonths={12}
          zip={zip}
          state={personal.state}
          city={personal.city}
          address={personal.address1}
          address2={personal.address2}
          onSelectTargetLender={markTargetLender}
          prioritizeStacking
          layout="compact"
          surface={light ? 'light' : 'dark'}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => navigate('/portal/wealth-paths')} className={light ? WL_SOLID_ACTION_BTN_EMERALD : FINELY_OS_SECONDARY_BTN}>
          Wealth paths <ArrowRight size={14} />
        </button>
        <button type="button" onClick={() => navigate('/business/lender-logic')} className={light ? WL_SOLID_ACTION_BTN_VIOLET : FINELY_OS_SECONDARY_BTN}>
          Full lender logic <ArrowRight size={14} />
        </button>
        <button type="button" onClick={() => navigate('/account/settings?tab=contact')} className={light ? WL_SOLID_ACTION_BTN_SKY : FINELY_OS_SECONDARY_BTN}>
          Update address / ZIP <ArrowRight size={14} />
        </button>
      </div>

      {msg ? <div className={FINELY_OS_NOTICE_SUCCESS}>{msg}</div> : null}
    </div>
  );
}
