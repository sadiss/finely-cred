import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import type { PartnerOverallScoreResult } from '../../utils/partnerOverallScore';
import { FUNDING_GOAL_PRESETS, formatFundingAmount, savePartnerFundingTarget } from '../../lib/partnerGoals';
import { computeReadinessScore } from '../../domain/capitalReadiness';
import { getOrCreateCapitalPlan } from '../../data/capitalReadinessRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
  finelyOsOverviewStatTile,
} from '../../features/os/finelyOsLightUi';

type DashboardFundingPanelProps = {
  partner: Partner | null;
  creditScore: number | null;
  scoreFromReport: boolean;
  overallScore: PartnerOverallScoreResult | null;
  onSaved?: () => void;
};

export function DashboardFundingPanel({
  partner,
  creditScore,
  scoreFromReport,
  overallScore,
  onSaved,
}: DashboardFundingPanelProps) {
  const navigate = useNavigate();
  const routeKey = partner?.primaryRoute || 'personal_restore';
  const intake = partner?.routes?.[routeKey];
  const savedTarget = typeof intake?.fundingTarget === 'number' ? intake.fundingTarget : 0;

  const [goalInput, setGoalInput] = useState(String(savedTarget || ''));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setGoalInput(String(savedTarget || ''));
  }, [savedTarget]);

  const capitalScore = useMemo(() => {
    if (!partner?.id) return null;
    try {
      return computeReadinessScore(getOrCreateCapitalPlan(partner.id));
    } catch {
      return null;
    }
  }, [partner?.id]);

  const readinessPct = overallScore?.overall ?? capitalScore ?? null;
  const goal = Math.max(0, Math.round(Number(goalInput.replace(/[^\d]/g, '')) || savedTarget || 0));

  const progressPct = useMemo(() => {
    if (!readinessPct || !goal) return null;
    return Math.min(100, Math.round(readinessPct * 0.85 + (creditScore && creditScore >= 680 ? 10 : 0)));
  }, [readinessPct, goal, creditScore]);

  const saveGoal = async () => {
    if (!partner) {
      setMsg('Link a partner file first — complete onboarding or open the portal.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await savePartnerFundingTarget(partner, goal);
      setEditing(false);
      setMsg('Funding goal saved.');
      onSaved?.();
    } catch (e) {
      setMsg((e as Error)?.message || 'Could not save goal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className={`${finelyOsGlassShell('panel', 'violet')} flex flex-wrap items-center justify-between gap-4`}>
        <div className="min-w-0">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Workspace overview</p>
          <h3 className={`mt-1 text-xl md:text-2xl font-light ${FINELY_OS_ENTITY_VALUE}`}>
            Your credit <span className="text-violet-300 font-medium">overview</span>
          </h3>
        </div>
        <button type="button" onClick={() => navigate('/portal/projects')} className={FINELY_OS_PRIMARY_BTN}>
          Projects & Tasks <ArrowRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <div className={`min-w-0 ${finelyOsOverviewStatTile('violet')}`}>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth="6" />
                <circle
                  cx="44"
                  cy="44"
                  r="38"
                  fill="none"
                  stroke="url(#scoreGradFunding)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(100, creditScore ?? 0) * 2.39} 239`}
                />
                <defs>
                  <linearGradient id="scoreGradFunding" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-light tabular-nums ${FINELY_OS_ENTITY_VALUE}`}>{creditScore ?? '—'}</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Credit score</p>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                {creditScore == null
                  ? 'Upload a tri-merge report to populate live bureau scores.'
                  : scoreFromReport
                    ? 'From your latest uploaded report'
                    : 'From your partner file'}
              </p>
              <button type="button" onClick={() => navigate(partner ? '/portal/reports' : '/onboarding')} className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-300 hover:text-violet-200">
                {creditScore == null ? 'Upload report' : 'View reports'} <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className={`min-w-0 ${finelyOsOverviewStatTile('sky')}`}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>Funding goal</p>
            <Target size={16} className="text-sky-400 shrink-0" />
          </div>
          {editing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>$</span>
                <input value={goalInput} onChange={(e) => setGoalInput(e.target.value.replace(/[^\d]/g, ''))} className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} font-mono text-lg`} placeholder="50000" inputMode="numeric" />
              </div>
              <div className="flex flex-wrap gap-2">
                {FUNDING_GOAL_PRESETS.map((p) => (
                  <button key={p.value} type="button" onClick={() => setGoalInput(String(p.value))} className={FINELY_OS_SECONDARY_BTN}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => void saveGoal()} className={FINELY_OS_PRIMARY_BTN}>
                  Save goal
                </button>
                <button type="button" onClick={() => { setEditing(false); setGoalInput(String(savedTarget || '')); }} className={FINELY_OS_SECONDARY_BTN}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-5xl md:text-6xl font-extralight tabular-nums text-sky-300">{savedTarget > 0 ? formatFundingAmount(savedTarget) : '—'}</div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY} mt-3`}>{savedTarget > 0 ? 'Your capital target on file' : 'Set a funding target to track readiness progress'}</p>
              <button type="button" onClick={() => setEditing(true)} className={`mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-300 hover:text-sky-200`}>
                {savedTarget > 0 ? 'Update goal' : 'Set funding goal'} <ArrowRight size={12} />
              </button>
            </>
          )}
        </div>

        <div className={`min-w-0 sm:col-span-2 xl:col-span-1 ${finelyOsOverviewStatTile('emerald')}`}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Capital readiness</p>
            <TrendingUp size={16} className="text-emerald-400 shrink-0" />
          </div>
          <div className="text-5xl md:text-6xl font-extralight tabular-nums text-emerald-300">{readinessPct != null ? `${readinessPct}%` : '—'}</div>
          {progressPct != null && savedTarget > 0 ? (
            <div className="mt-4">
              <div className={`flex justify-between ${FINELY_OS_ENTITY_SUBLABEL} mb-1`}>
                <span>Progress toward goal</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-100/80 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          ) : null}
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY} mt-3`}>Profile completeness, documents, disputes, and wealth-path milestones — not a funding guarantee.</p>
          <button type="button" onClick={() => navigate('/portal/wealth-paths')} className={`mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-700`}>
            Wealth paths <ArrowRight size={12} />
          </button>
        </div>
      </div>
      {msg ? <div className={FINELY_OS_NOTICE_SUCCESS}>{msg}</div> : null}
    </div>
  );
}
