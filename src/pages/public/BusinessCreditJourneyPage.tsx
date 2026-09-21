import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Circle,
  Shield,
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { PublicBrandMark } from '../../components/public/PublicBrandMark';
import {
  BUSINESS_CREDIT_JOURNEY_STEPS,
  journeyPortalHref,
  journeyStepFromParam,
  type BusinessJourneyStepId,
} from '../../domain/businessCreditJourney';
import {
  getJourneyProgress,
  journeyPercentComplete,
  setJourneyLastStep,
  setJourneyStepComplete,
} from '../../data/businessCreditJourneyProgress';
import { businessCreditPackages } from '../../config/pricingCatalog';
import { PackageCard, variantForTierIndex } from '../../components/pricing/PricingCards';

export default function BusinessCreditJourneyPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [version, setVersion] = useState(0);

  const stepId = useMemo(
    () => journeyStepFromParam(searchParams.get('step')),
    [searchParams],
  );
  const step = useMemo(
    () => BUSINESS_CREDIT_JOURNEY_STEPS.find((s) => s.id === stepId) ?? BUSINESS_CREDIT_JOURNEY_STEPS[0],
    [stepId],
  );
  const progress = useMemo(() => getJourneyProgress(), [version]);
  const pct = useMemo(() => journeyPercentComplete(), [version]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    setJourneyLastStep(stepId);
  }, [stepId]);

  const goStep = (id: BusinessJourneyStepId) => {
    const n = BUSINESS_CREDIT_JOURNEY_STEPS.find((s) => s.id === id)?.step ?? 1;
    setSearchParams({ step: String(n) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pkgs = useMemo(
    () => businessCreditPackages.filter((p) => p.isPublic).sort((a, b) => a.sortOrder - b.sortOrder),
    [],
  );

  return (
    <PageShell
      badge="Business credit"
      title="Build business credit — guided journey"
      subtitle="Seven honest steps from entity foundation to personal-credit handoff. Educational only — no guaranteed scores, approvals, or funding."
    >
      <div className="max-w-7xl mx-auto space-y-8 -mt-2">
        <div className="rounded-2xl border border-[#fbbf24]/35 bg-gradient-to-br from-[#0b1110] via-[#060908] to-[#0b1110] p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-6">
            <PublicBrandMark className="h-16 w-16" size={64} />
            <div className="flex-1 min-w-[240px]">
              <div className="text-[#fbbf24] text-xs font-black uppercase tracking-[0.35em]">Finely Cred · Business</div>
              <p className="mt-2 text-white/80 text-base leading-relaxed max-w-3xl">
                This is your step rail — always visible. Complete checklists at your pace. Staff use the same map in the business
                portal to coach clients.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="rounded-xl border border-white/15 bg-black/40 px-4 py-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/50">Progress</span>
                  <div className="text-2xl font-semibold text-[#fbbf24]">{pct}%</div>
                </div>
                <div className="flex-1 min-w-[200px] h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-[#fbbf24] transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <aside className="lg:col-span-4 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Step rail</div>
            {BUSINESS_CREDIT_JOURNEY_STEPS.map((s) => {
              const active = s.id === stepId;
              const done = Boolean(progress.completed[s.id]);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goStep(s.id)}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                    active
                      ? 'border-[#fbbf24]/50 bg-[#fbbf24]/10'
                      : 'border-white/10 bg-black/30 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Circle size={18} className={active ? 'text-[#fbbf24]' : 'text-white/30'} />
                    )}
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-widest text-white/45">Step {s.step}</div>
                      <div className="text-white font-semibold text-sm truncate">{s.title}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          <div className="lg:col-span-8 space-y-6">
            <article className="rounded-2xl border border-white/15 bg-[#0b1110] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 text-[#fbbf24]">
                <Building2 size={22} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Step {step.step} · {step.title}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-white">{step.subtitle}</h2>
              <p className="text-white/75 leading-relaxed">{step.why}</p>

              <div className="rounded-xl border border-[#fbbf24]/25 bg-[#fbbf24]/5 p-5">
                <div className="text-[10px] uppercase tracking-widest text-[#fde68a] font-bold">Checklist</div>
                <ul className="mt-3 space-y-2">
                  {step.checklist.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-white/85 text-sm">
                      <Shield size={14} className="text-[#fbbf24] mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setJourneyStepComplete(step.id, !progress.completed[step.id]);
                    setVersion((v) => v + 1);
                  }}
                  className="mt-4 fc-button-soft text-xs"
                >
                  {progress.completed[step.id] ? 'Mark step incomplete' : 'Mark step complete'}
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(step.publicCta?.path ?? journeyPortalHref(step))}
                  className="fc-button-brand"
                >
                  {step.publicCta?.label ?? 'Open in portal'} <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/consultation?lane=' + encodeURIComponent('Business Credit'))}
                  className="fc-button-soft"
                >
                  Book consult
                </button>
                {step.step < BUSINESS_CREDIT_JOURNEY_STEPS.length ? (
                  <button
                    type="button"
                    onClick={() => goStep(BUSINESS_CREDIT_JOURNEY_STEPS[step.step].id)}
                    className="fc-button-soft"
                  >
                    Next step <ArrowRight size={14} />
                  </button>
                ) : null}
              </div>
            </article>

            {step.id === 'tier1_vendors' || step.id === 'docs_funding' ? (
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-white">Business credit packages (DIY + DFY)</h3>
                <p className="text-white/65 text-sm">Choose a lane — no approval guarantees.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {pkgs.slice(0, 4).map((pkg, idx) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      variant={variantForTierIndex(idx, pkgs.length)}
                      onSelect={() => {
                        const next = `/portal/checkout?package=${encodeURIComponent(pkg.id)}`;
                        navigate(`/onboarding?package=${pkg.id}&next=${encodeURIComponent(next)}`);
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <p className="text-white/50 text-xs">
              Nora Capital branding stays off Finely-primary journeys. Questions?{' '}
              <Link to="/contact" className="text-[#fbbf24] underline">Contact</Link> or{' '}
              <Link to="/enlightenment-session" className="text-[#fbbf24] underline">book a session</Link>.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
