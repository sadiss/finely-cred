/**
 * `/resources/which-program-fits`
 *
 * Public, standalone "which program fits your situation" outcome wizard (Phase C5).
 * Distinct from the inline debt-balance chip picker already shipped on
 * `PricingPage.tsx`'s Debt & Legal tab — that picker is a same-page, single-question
 * helper for visitors already on the pricing page. This page is a dedicated,
 * multi-step, SEO-indexable tool: situation → (debt details, if applicable) →
 * starting credit score → an honest, sample-size-labeled result screen with a CTA.
 *
 * Both real data sources are reused, never reinvented:
 * - `getDebtPackageGuidanceForBalance()` (`config/pricingCatalog.ts`) for the tier match.
 * - `CaseStudy.startingScore`/`endingScore` (`data/caseStudiesRepo.ts`) for the outcome range.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Gavel,
  Info,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { useAuth } from '../../auth/AuthProvider';
import { finelyCtaNavigate, type FinelyCtaIntentId } from '../../lib/finelyCtaIntent';
import { formatPrice, type PricingCategory } from '../../config/pricingCatalog';
import { computeOutcomeWizardResult } from '../../lib/outcomeWizardEngine';
import {
  DEBT_LITIGATION_STATUS_OPTIONS,
  STARTING_SCORE_BANDS,
  WIZARD_CATEGORIES,
  WIZARD_DEBT_BALANCE_BANDS,
  type DebtLitigationStatus,
  type OutcomeWizardStep,
  type StartingScoreBand,
} from '../../domain/outcomeWizard';
import { ensureC5OutcomeWizardComplianceRecordsSeeded } from '../../data/complianceReviewRepo';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

const CONTENT_REF = '/resources/which-program-fits';

const CATEGORY_ICON: Record<PricingCategory, React.ReactNode> = {
  personal_credit: <Sparkles size={18} />,
  business_credit: <Building2 size={18} />,
  debt_legal: <Gavel size={18} />,
  wealth_builder: <Wallet size={18} />,
  privacy_id: <ShieldCheck size={18} />,
  bundle: <Sparkles size={18} />,
  tradeline_promo: <TrendingUp size={18} />,
  agency: <Building2 size={18} />,
};

function consultationLaneForCategory(category: PricingCategory): string {
  switch (category) {
    case 'personal_credit':
      return 'Personal Credit';
    case 'business_credit':
      return 'Business Credit';
    case 'debt_legal':
      return 'Debt & Legal';
    case 'wealth_builder':
      return 'Wealth Builder';
    default:
      return 'General';
  }
}

function ctaIntentForCategory(category: PricingCategory): FinelyCtaIntentId {
  switch (category) {
    case 'business_credit':
      return 'business_intake';
    case 'debt_legal':
      return 'debt_intake';
    case 'wealth_builder':
      return 'funding_intake';
    default:
      return 'personal_intake';
  }
}

function formatSignedDelta(n: number): string {
  return `${n >= 0 ? '+' : ''}${n}`;
}

const STEP_LABELS: Record<OutcomeWizardStep, string> = {
  situation: 'Your situation',
  debt_details: 'Debt details',
  starting_score: 'Starting score',
  result: 'Your result',
};

export default function OutcomeWizardPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  usePublicSeoMeta({
    title: 'Which program fits your situation? — Free outcome wizard',
    description:
      'Answer a few questions about your debt balance, situation, and starting credit score to see which Finely Cred program fits and a real, sample-sized outcome range from documented case studies.',
    path: CONTENT_REF,
  });

  useEffect(() => {
    ensureC5OutcomeWizardComplianceRecordsSeeded();
  }, []);

  const [step, setStep] = useState<OutcomeWizardStep>('situation');
  const [category, setCategory] = useState<PricingCategory | null>(null);
  const [debtBalanceCents, setDebtBalanceCents] = useState<number | null>(null);
  const [litigationStatus, setLitigationStatus] = useState<DebtLitigationStatus | null>(null);
  const [startingScoreBand, setStartingScoreBand] = useState<StartingScoreBand | null>(null);

  const orderedSteps = useMemo<OutcomeWizardStep[]>(() => {
    const arr: OutcomeWizardStep[] = ['situation'];
    if (category === 'debt_legal') arr.push('debt_details');
    arr.push('starting_score', 'result');
    return arr;
  }, [category]);
  const stepIndex = Math.max(0, orderedSteps.indexOf(step));

  const chooseCategory = (cat: PricingCategory) => {
    setCategory(cat);
    setStep(cat === 'debt_legal' ? 'debt_details' : 'starting_score');
  };

  const goBack = () => {
    const idx = orderedSteps.indexOf(step);
    if (idx <= 0) return;
    setStep(orderedSteps[idx - 1] as OutcomeWizardStep);
  };

  const restart = () => {
    setCategory(null);
    setDebtBalanceCents(null);
    setLitigationStatus(null);
    setStartingScoreBand(null);
    setStep('situation');
  };

  const result = useMemo(() => {
    if (!category) return null;
    return computeOutcomeWizardResult({
      category,
      debtBalanceCents: debtBalanceCents ?? undefined,
      litigationStatus: litigationStatus ?? undefined,
      startingScoreBand: startingScoreBand ?? undefined,
    });
  }, [category, debtBalanceCents, litigationStatus, startingScoreBand]);

  const primaryCtaOnResult = () => {
    if (!category) return;
    if (category === 'debt_legal' && result && result.urgencyLevel !== 'normal') {
      finelyCtaNavigate(navigate, 'consultation', { consultationLane: consultationLaneForCategory(category) });
      return;
    }
    if (category === 'debt_legal' && result?.recommendedPackage) {
      finelyCtaNavigate(navigate, 'personal_package', {
        packageId: result.recommendedPackage.id,
        isAuthed: Boolean(auth.user),
      });
      return;
    }
    finelyCtaNavigate(navigate, ctaIntentForCategory(category));
  };

  return (
    <PageShell
      hideHero
      badge="Free tool · no signup"
      title="Which program fits your situation?"
      subtitle="Answer three quick questions — get an honest tier match and a real outcome range, sample size included."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[1.5rem] border border-violet-400/25 bg-gradient-to-br from-[#141013]/95 via-[#0d0e12]/95 to-[#0a0b0f]/98 p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_0%,rgba(139,92,246,0.14),transparent_60%)]" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-violet-300">
              <Sparkles size={13} /> Outcome & program-fit wizard
            </div>
            <h1 className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              Tell us your situation. <span className="text-violet-300">See what actually fits.</span>
            </h1>
            <p className={`mt-3 max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>
              No black box — the tier match comes from the same balance-guidance table used on our pricing page, and the
              outcome range comes from our real, documented case studies. If the sample is small for your exact situation,
              we say so.
            </p>
            <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4 !text-left !mx-0`}>
              Results vary · individual circumstances differ · not legal or financial advice · funding subject to
              underwriting.
            </p>
          </div>
        </section>

        {/* ── Step progress ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          {orderedSteps.map((s, i) => (
            <span
              key={s}
              className={i === stepIndex ? finelyOsViewTab(true, 'violet') : `${FINELY_OS_ENTITY_CHIP} !normal-case`}
            >
              {i + 1}. {STEP_LABELS[s]}
            </span>
          ))}
        </div>

        {/* ── Step: situation (category picker) ───────────────────── */}
        {step === 'situation' && (
          <section className={finelyOsCatalogCard('violet')} data-fc-accent="violet">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">What best describes your situation?</h2>
            <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>Pick one — we'll ask one or two follow-ups based on this.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {WIZARD_CATEGORIES.map((c, idx) => {
                const accent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
                return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => chooseCategory(c.id)}
                  className={`${finelyOsCatalogCard(accent)} flex items-start gap-4 text-left transition-all hover:brightness-110`}
                  data-fc-accent={accent}
                >
                  <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/25 text-white">
                    {CATEGORY_ICON[c.id]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-lg font-extrabold text-white">{c.label}</span>
                    <span className={`mt-1 block text-base leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{c.blurb}</span>
                  </span>
                </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Step: debt balance + situation escalation (debt_legal only) ── */}
        {step === 'debt_details' && category === 'debt_legal' && (
          <section className={finelyOsCatalogCard('rose')} data-fc-accent="rose">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Roughly, what's your total debt balance?</h2>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
              Illustrative only — your exact package and pricing are confirmed after intake.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {WIZARD_DEBT_BALANCE_BANDS.map((band) => (
                <button
                  key={band.label}
                  type="button"
                  onClick={() => setDebtBalanceCents(band.amountCents)}
                  className={finelyOsViewTab(debtBalanceCents === band.amountCents, 'rose')}
                >
                  {band.label}
                </button>
              ))}
            </div>

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-white/80">Has anything escalated?</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEBT_LITIGATION_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLitigationStatus(opt.id)}
                  className={finelyOsViewTab(litigationStatus === opt.id, 'rose')}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button type="button" onClick={goBack} className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}>
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                disabled={debtBalanceCents == null}
                onClick={() => setStep('starting_score')}
                className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2 disabled:opacity-50`}
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

        {/* ── Step: starting credit score band ────────────────────── */}
        {step === 'starting_score' && category && (
          <section className={finelyOsCatalogCard('emerald')} data-fc-accent="emerald">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Roughly, what's your starting credit score?</h2>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
              We'll show a real outcome range from documented case studies in a similar starting band — with the sample
              size, honestly.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {STARTING_SCORE_BANDS.map((band) => (
                <button
                  key={band.id}
                  type="button"
                  onClick={() => {
                    setStartingScoreBand(band.id);
                    setStep('result');
                  }}
                  className={finelyOsViewTab(startingScoreBand === band.id, 'emerald')}
                >
                  {band.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button type="button" onClick={goBack} className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}>
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep('result')}
                className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
              >
                Skip — show sitewide average instead <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

        {/* ── Step: result ─────────────────────────────────────────── */}
        {step === 'result' && category && result && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={FINELY_OS_ENTITY_CHIP}>{WIZARD_CATEGORIES.find((c) => c.id === category)?.label}</span>
              {debtBalanceCents != null ? (
                <span className={FINELY_OS_ENTITY_CHIP}>
                  {WIZARD_DEBT_BALANCE_BANDS.find((b) => b.amountCents === debtBalanceCents)?.label}
                </span>
              ) : null}
              {litigationStatus ? (
                <span className={FINELY_OS_ENTITY_CHIP}>
                  {DEBT_LITIGATION_STATUS_OPTIONS.find((o) => o.id === litigationStatus)?.label}
                </span>
              ) : null}
              {startingScoreBand ? (
                <span className={FINELY_OS_ENTITY_CHIP}>
                  Starting: {STARTING_SCORE_BANDS.find((b) => b.id === startingScoreBand)?.label}
                </span>
              ) : null}
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white/80"
              >
                <RotateCcw size={12} /> Start over
              </button>
            </div>

            {/* Urgency note (debt_legal, escalated situations) */}
            {result.urgencyNote ? (
              <div className={FINELY_OS_NOTICE_WARN}>
                <div className="flex items-start gap-2.5">
                  <Info size={16} className="mt-0.5 shrink-0 text-fuchsia-300" />
                  <p className={FINELY_OS_ENTITY_BODY}>{result.urgencyNote}</p>
                </div>
              </div>
            ) : null}

            {/* Recommended package (debt_legal only) */}
            {category === 'debt_legal' && result.recommendedPackage ? (
              <div className={finelyOsCatalogCard('rose')} data-fc-accent="rose">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">Recommended tier</h2>
                  <span className={finelyOsStatusChip('warn')}>Illustrative guidance</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] p-6">
                  <div>
                    <div className={`text-base font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{result.recommendedPackage.name}</div>
                    <div className="mt-0.5 text-sm text-white/60">{result.recommendedPackage.tagline}</div>
                    <div className="mt-1 text-base font-extrabold text-rose-200">
                      {result.recommendedPackage.isCustomQuote ? 'Custom quote' : formatPrice(result.recommendedPackage.priceAmount)}
                    </div>
                  </div>
                  <button type="button" onClick={primaryCtaOnResult} className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2`}>
                    {result.urgencyLevel !== 'normal' ? 'Book a strategy session' : 'Start with this tier'} <ArrowRight size={14} />
                  </button>
                </div>
                {result.packageGuidanceNote ? <p className="mt-2 text-xs text-white/50">{result.packageGuidanceNote}</p> : null}
              </div>
            ) : null}

            {/* Outcome range */}
            <div className={finelyOsCatalogCard('emerald')} data-fc-accent="emerald">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-white">Real outcome range</h2>
                <span className={FINELY_OS_ENTITY_SUBLABEL}>From documented case studies</span>
              </div>
              {result.outcomeRange.hasData ? (
                <>
                  <div className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] p-4">
                    <div className="text-2xl font-black tabular-nums text-emerald-200">
                      {result.outcomeRange.lowDelta === result.outcomeRange.highDelta
                        ? formatSignedDelta(result.outcomeRange.lowDelta as number)
                        : `${formatSignedDelta(result.outcomeRange.lowDelta as number)} to ${formatSignedDelta(result.outcomeRange.highDelta as number)}`}{' '}
                      <span className="text-sm font-semibold text-emerald-100/80">points</span>
                    </div>
                    {result.outcomeRange.medianDelta != null ? (
                      <div className="mt-1 text-sm text-white/60">
                        Median change: {formatSignedDelta(result.outcomeRange.medianDelta)} points
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-xs text-white/60">
                    <Info size={13} className="mt-0.5 shrink-0" />
                    {result.outcomeRange.sampleSizeNote}
                  </p>
                </>
              ) : (
                <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>{result.outcomeRange.sampleSizeNote}</p>
              )}
              <button
                type="button"
                onClick={() => navigate('/testimonials?tab=case_studies')}
                className={`${FINELY_OS_SECONDARY_BTN} mt-4 inline-flex items-center gap-2`}
              >
                See the real case studies behind this number <ArrowRight size={14} />
              </button>
            </div>

            {/* CTA band */}
            <div className={finelyOsCatalogCard('violet')} data-fc-accent="violet">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">Ready for the next step?</h2>
                  <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                    Talk to a strategist or see full pricing for {WIZARD_CATEGORIES.find((c) => c.id === category)?.label.toLowerCase()}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!(category === 'debt_legal' && result.recommendedPackage) ? (
                    <button type="button" onClick={primaryCtaOnResult} className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2`}>
                      Get started <ArrowRight size={14} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => finelyCtaNavigate(navigate, 'consultation', { consultationLane: consultationLaneForCategory(category) })}
                    className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
                  >
                    Book a strategy session
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/pricing?tab=${category}`)}
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    See full pricing
                  </button>
                </div>
              </div>
              <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>{result.disclaimer}</p>
            </div>
          </section>
        )}

        <MarketingStaffChatStrip
          roleId="dispute_coach"
          goal={category === 'business_credit' ? 'business' : category === 'debt_legal' ? 'debt' : 'personal'}
          roleLabel="strategy"
          subline="Not sure which answer applies to you? Ask before you pick."
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
