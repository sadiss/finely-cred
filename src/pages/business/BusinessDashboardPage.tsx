import React, { useMemo, useState } from 'react';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessReadinessChecklist } from '../../components/business/BusinessReadinessChecklist';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { BusinessCreditLadderPanel } from '../../components/business/BusinessCreditLadderPanel';
import { BusinessCreditRoadmapPanel } from '../../components/business/BusinessCreditRoadmapPanel';
import { BusinessJourneyShell } from '../../components/business/BusinessJourneyShell';
import { BUSINESS_CREDIT_JOURNEY_STEPS, journeyPortalHref } from '../../domain/businessCreditJourney';
import { getBusinessCreditProfile } from '../../data/businessCreditRepo';

export default function BusinessDashboardPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);

  const profile = useMemo(
    () => (partner ? getBusinessCreditProfile(partner.id) : null),
    [partner?.id, version],
  );

  React.useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const doneCount = BUSINESS_CREDIT_JOURNEY_STEPS.filter((s) => profile?.journey?.[s.id]?.done).length;
  const pct = Math.round((doneCount / BUSINESS_CREDIT_JOURNEY_STEPS.length) * 100);
  const focus = BUSINESS_CREDIT_JOURNEY_STEPS.find((s) => !profile?.journey?.[s.id]?.done) ?? BUSINESS_CREDIT_JOURNEY_STEPS[0];
  const blockers = BUSINESS_CREDIT_JOURNEY_STEPS.filter((s) => !profile?.journey?.[s.id]?.done).map((s) => s.title);

  return (
    <PageShell
      badge="Business Portal"
      title="Business credit journey"
      subtitle="Your execution home — follow the seven-step rail. Progress and marks save to your partner profile when signed in."
    >
      <BusinessJourneyShell showStepGuide={false}>
        <div className="grid md:grid-cols-4 gap-4">
          <Kpi label="Progress" value={`${pct}%`} hint={`${doneCount} of ${BUSINESS_CREDIT_JOURNEY_STEPS.length} steps`} />
          <Kpi label="Current step" value={`${focus.step}`} hint={focus.title} accent />
          <Kpi label="Open blockers" value={String(blockers.length)} hint={blockers.length ? 'See list below' : 'All clear'} />
          <Kpi label="Next action" value="Go" hint={focus.subtitle} />
        </div>

        <div className="rounded-2xl border border-[#fbbf24]/30 bg-gradient-to-br from-[#0b1110] to-[#060908] p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#fbbf24]">Next action</div>
              <div className="text-2xl md:text-3xl font-semibold text-white">
                Step {focus.step}: {focus.title}
              </div>
              <p className="text-white/75 text-sm leading-relaxed">{focus.why}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(journeyPortalHref(focus))}
              className="fc-button-brand shrink-0"
            >
              Open step workspace <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {blockers.length ? (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2 text-amber-200 text-sm font-semibold">
              <AlertTriangle size={16} /> Blockers (incomplete steps)
            </div>
            <ul className="mt-3 space-y-2">
              {blockers.map((t) => (
                <li key={t} className="text-white/80 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 flex items-center gap-3 text-emerald-100 text-sm">
            <CheckCircle2 size={20} /> All seven steps marked complete. Maintain files and re-run lender logic before new applications.
          </div>
        )}

        <details className="rounded-2xl border border-white/15 bg-[#0b1110] p-5">
          <summary className="cursor-pointer text-white font-semibold">Step guide — {focus.title}</summary>
          <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm text-white/80">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-emerald-200 font-bold">Do</div>
              <ul className="mt-2 list-disc pl-4 space-y-1">
                {focus.do.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-amber-200 font-bold">Avoid</div>
              <ul className="mt-2 list-disc pl-4 space-y-1">
                {focus.avoid.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>

        {partner ? <BusinessCreditLadderPanel partnerId={partner.id} /> : null}
        {partner ? <BusinessCreditRoadmapPanel partnerId={partner.id} /> : null}
        <BusinessReadinessChecklist />
      </BusinessJourneyShell>
    </PageShell>
  );
}

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-[#0b1110] p-5">
      <div className="text-[10px] uppercase tracking-widest text-white/50">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? 'text-[#fbbf24]' : 'text-white'}`}>{value}</div>
      <div className="text-xs text-white/65 mt-1">{hint}</div>
    </div>
  );
}
