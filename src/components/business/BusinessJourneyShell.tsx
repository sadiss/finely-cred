import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import {
  BUSINESS_CREDIT_JOURNEY_STEPS,
  journeyPortalHref,
  journeyStepForPath,
  type BusinessJourneyStepId,
} from '../../domain/businessCreditJourney';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { getBusinessCreditProfile, setJourneyStepDonePortal } from '../../data/businessCreditRepo';
import { getJourneyProgress, journeyPercentComplete } from '../../data/businessCreditJourneyProgress';

export function BusinessJourneyShell({
  children,
  activeStepId,
  showStepGuide = true,
}: {
  children: React.ReactNode;
  activeStepId?: BusinessJourneyStepId | null;
  /** Dashboard sets false to avoid duplicate guide above KPI home. */
  showStepGuide?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);

  const journeyQuery = searchParams.get('journey');
  const onDashboard = location.pathname.startsWith('/business/dashboard');
  const inferred =
    activeStepId !== undefined
      ? activeStepId
      : journeyStepForPath(location.pathname, journeyQuery);

  const profile = useMemo(() => (partner ? getBusinessCreditProfile(partner.id) : null), [partner?.id, version]);

  const pct = useMemo(() => {
    if (partner && profile?.journey) {
      const done = BUSINESS_CREDIT_JOURNEY_STEPS.filter((s) => profile.journey?.[s.id]?.done).length;
      return Math.round((done / BUSINESS_CREDIT_JOURNEY_STEPS.length) * 100);
    }
    return journeyPercentComplete();
  }, [partner, profile, version]);

  const firstOpen = useMemo(() => {
    if (partner && profile?.journey) {
      return BUSINESS_CREDIT_JOURNEY_STEPS.find((s) => !profile.journey?.[s.id]?.done) ?? null;
    }
    const local = getJourneyProgress();
    return BUSINESS_CREDIT_JOURNEY_STEPS.find((s) => !local.completed[s.id]) ?? null;
  }, [partner, profile, version]);

  const currentStepId: BusinessJourneyStepId =
    inferred ?? firstOpen?.id ?? BUSINESS_CREDIT_JOURNEY_STEPS[0].id;

  const current = BUSINESS_CREDIT_JOURNEY_STEPS.find((s) => s.id === currentStepId) ?? BUSINESS_CREDIT_JOURNEY_STEPS[0];
  const next = BUSINESS_CREDIT_JOURNEY_STEPS.find((s) => s.step === current.step + 1);

  const blockers = useMemo(() => {
    const pending = BUSINESS_CREDIT_JOURNEY_STEPS.filter((s) => !profile?.journey?.[s.id]?.done);
    return pending.slice(0, 3).map((s) => s.title);
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#fbbf24]/35 bg-gradient-to-br from-[#0b1110] to-[#060908] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#fbbf24]">Business credit journey</div>
            <div className="text-white font-semibold text-lg mt-1">{pct}% complete</div>
            {onDashboard && firstOpen ? (
              <p className="mt-1 text-sm text-white/75">
                Current focus: <span className="text-[#fbbf24] font-medium">Step {firstOpen.step} — {firstOpen.title}</span>
              </p>
            ) : null}
          </div>
          {next ? (
            <button
              type="button"
              onClick={() => navigate(journeyPortalHref(next))}
              className="fc-button-brand text-xs"
            >
              Next: {next.title} <ArrowRight size={14} />
            </button>
          ) : null}
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-[#fbbf24]" style={{ width: `${pct}%` }} />
        </div>
        {blockers.length ? (
          <p className="mt-3 text-sm text-white/75">
            Blockers: <span className="text-white/90">{blockers.join(' · ')}</span>
          </p>
        ) : null}
      </div>

      <nav className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2" aria-label="Business credit steps">
        {BUSINESS_CREDIT_JOURNEY_STEPS.map((s) => {
          const done = Boolean(profile?.journey?.[s.id]?.done);
          const active = s.id === currentStepId;
          const href = journeyPortalHref(s);
          return (
            <Link
              key={s.id}
              to={href}
              className={`rounded-xl border px-2 py-3 text-center transition-all ${
                active
                  ? 'border-[#fbbf24]/50 bg-[#fbbf24]/15'
                  : 'border-white/15 bg-[#0b1110] hover:border-white/25'
              }`}
            >
              <div className="flex justify-center mb-1">
                {done ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <Circle size={16} className={active ? 'text-[#fbbf24]' : 'text-white/35'} />
                )}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-white/50">Step {s.step}</div>
              <div className="text-[11px] font-semibold text-white leading-tight mt-0.5">{s.title}</div>
            </Link>
          );
        })}
      </nav>

      {showStepGuide && inferred !== null ? (
        <StepGuideCard
          step={current}
          done={Boolean(profile?.journey?.[current.id]?.done)}
          onToggle={() => {
            if (!partner) return;
            setJourneyStepDonePortal({
              partnerId: partner.id,
              stepId: current.id,
              done: !profile?.journey?.[current.id]?.done,
            });
            setVersion((v) => v + 1);
          }}
          onContinue={() => next && navigate(journeyPortalHref(next))}
          hasPartner={Boolean(partner)}
        />
      ) : null}

      {children}
    </div>
  );
}

function StepGuideCard({
  step,
  done,
  onToggle,
  onContinue,
  hasPartner,
}: {
  step: (typeof BUSINESS_CREDIT_JOURNEY_STEPS)[number];
  done: boolean;
  onToggle: () => void;
  onContinue: () => void;
  hasPartner: boolean;
}) {
  return (
    <details open className="rounded-2xl border border-white/15 bg-[#0b1110] p-5">
      <summary className="cursor-pointer text-white font-semibold">
        Step {step.step}: {step.title} — {step.subtitle}
      </summary>
      <div className="mt-4 space-y-4 text-sm text-white/80">
        <p>{step.why}</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-emerald-200 font-bold">Do</div>
            <ul className="mt-2 list-disc pl-4 space-y-1">
              {step.do.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-amber-200 font-bold">Avoid</div>
            <ul className="mt-2 list-disc pl-4 space-y-1">
              {step.avoid.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPartner ? (
            <button type="button" onClick={onToggle} className="fc-button-soft text-xs">
              {done ? 'Mark incomplete' : 'Mark step done'}
            </button>
          ) : null}
          <button type="button" onClick={onContinue} className="fc-button-brand text-xs">
            Continue <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </details>
  );
}
