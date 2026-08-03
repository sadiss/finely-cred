import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { 
  Fingerprint, Trophy, Gavel, Building2, ShieldCheck, Clock, 
  ShieldAlert, Briefcase, Flame, Activity, Server, CheckCircle2,
  Target, Lock, ArrowLeft, X, Key, ScanLine, LogOut
} from 'lucide-react';
import { Button, PasswordInput, ProgressBar } from '../ui';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail, listBootstrapAdminEmails } from '../../auth/admin';
import { useLocation, useNavigate } from 'react-router-dom';
import { computeRecommendation } from '../../billing/intakeRecommendation';
import { formatPrice, getAgencyTierById, getPackageById } from '../../config/pricingCatalog';
import { getActiveTenant, getActiveTenantId } from '../../tenancy/activeTenant';
import { getOnboardingStepKeys, getOnboardingStepLabel, getPartnerInviteStepKeys, type OnboardingRole } from '../../onboarding/pipeline';
import { AgentOperatingModelStep } from '../onboarding/AgentOperatingModelStep';
import { ProfileAndAccountStep } from '../onboarding/OnboardingSteps';
import { PartnerSupportRelationshipStep } from '../onboarding/PartnerSupportRelationshipStep';
import { SignupLegalStep } from '../onboarding/SignupLegalStep';
import { OnboardingExperienceShell } from '../onboarding/OnboardingExperienceShell';
import { OnboardingFlowShell } from '../onboarding/OnboardingFlowShell';
import {
  OnboardingExitSetupBar,
  OnboardingWizardDesktopToolbar,
  OnboardingWizardMobileToolbar,
} from '../onboarding/OnboardingExitSetupBar';
import { CS } from '../../config/creditSpecialistProgram';
import { AU_SELLER, AU_SELLER_MARKETING_HEADLINE } from '../../config/auSellerProgram';
import { computeAgentRevenueSplit, defaultAgentOperatingModel } from '../../domain/agentProgram';
import { saveAgentOperatingModel } from '../../data/agentProgramRepo';
import { captureLeadAttributionFromUrl, getLeadAttribution } from '../../lib/leadAttribution';
import { finelyOsInlineListItem } from '../../features/os/finelyOsLightUi';
import { FinelyCredLogo } from '../brand/FinelyCredLogo';
import { CreditMonitoringPartnerGrid } from '../resources/CreditMonitoringPartnerGrid';
import { FinelyNowDoThisStrip } from '../tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../tours/FinelyNoticedStrip';
import { buildOnboardingMonitoringNoticedItems } from '../../lib/finelyProactiveSignals';
import { ONBOARDING_MONITORING_NOW_DO_ITEMS } from '../../config/onboardingMonitoringHelp';
import { HEAD_OF_SOCIETY_NAME, HETA_SOCIETY_SHORT } from '../../config/hetaSocietyProgram';
import {
  applyOnboardingRole,
  laneFromParam,
  laneToOnboardingRole,
  normalizeOnboardingRole,
  stepAfterRoleSelection,
} from '../../lib/onboardingRoleRouting';
import {
  bootstrapInviteUserDataFromUrl,
  completePartnerInviteClaim,
  hydrateInviteUserDataFromPartner,
  isPartnerInviteUrl,
  parsePartnerInviteSearch,
  resetOnboardingStorageForInvite,
} from '../../lib/partnerInviteBootstrap';
import { savePendingInvitePartnerId } from '../../lib/pendingInviteClaim';
import { retryPendingInviteClaim } from '../../lib/retryPendingInviteClaim';
import { landingPathForRole } from '../../lib/signupOpsGuide';
import { resolvePostAuthHomePath } from '../../lib/postAuthRouting';
import { buildPartnerConsentsFromSignup, signupLegalItems, type SignupLegalItemId } from '../../lib/signupLegalPack';
import { clearOnboardingProgress, ONBOARDING_STORAGE_KEY } from '../../lib/onboardingProgressStorage';
import { resolveOnboardingWizardNav } from '../../lib/onboardingWizardNav';
import {
  OnboardingWizardHeaderContinue,
  OnboardingWizardNavBar,
} from '../onboarding/OnboardingStepNavFooter';

type OnboardingLane =
  | 'au_tradelines'
  | 'au_seller'
  | 'primary_tradeline'
  | 'debt_kill'
  | 'business_credit'
  | 'affiliate'
  | 'agent'
  | 'funding_readiness'
  | 'wealth_builder'
  | 'heta_society'
  | 'other';

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function recommendNext(args: {
  lane: OnboardingLane;
  score?: number;
  goal?: string;
  fractures?: string[];
  liabilityTier?: string;
  urgency?: string;
  selectedPackageId?: string;
  selectedRail?: 'stripe' | 'in_house';
}) {
  // If a package is preselected, we route straight to partner checkout after auth.
  if (args.selectedPackageId) {
    const rail = args.selectedRail ? `&rail=${args.selectedRail}` : '';
    return {
      headline: 'Your plan is selected',
      reason:
        'You already chose a package. Next we’ll create your account, then route you to checkout so you can activate access.',
      nextPath: `/portal/checkout?package=${args.selectedPackageId}${rail}`,
      ctaLabel: 'Continue to checkout',
      pills: ['Results-driven', 'Fast setup', 'Secure portal access'],
    };
  }

  if (args.lane === 'au_tradelines') {
    return {
      headline: 'AU Marketplace recommended',
      reason:
        'Authorized User tradelines are best when you want fast profile thickness and clean utilization signals. We’ll still guide you to the safest fit.',
      nextPath: `/tradelines?focus=au`,
      ctaLabel: 'Browse AU inventory',
      pills: ['Fast profile boost', 'Inventory-based', 'Guided match available'],
    };
  }

  if (args.lane === 'au_seller') {
    return {
      headline: AU_SELLER_MARKETING_HEADLINE,
      reason:
        'Pay a one-time $50 activation and Finely markets your verified AU inventory to buyers — intake, orders, and your seller hub included. First 60-day listing season is included; rotate cards after each season to stay protected.',
      nextPath: `/portal/checkout?package=${AU_SELLER.checkoutPackageId}&rail=stripe`,
      ctaLabel: `Activate — ${AU_SELLER.startupFeeLabel}`,
      pills: ['We bring buyers', '60-day seasons', 'Seller payouts', 'No buyer-side fee for you'],
    };
  }

  if (args.lane === 'primary_tradeline') {
    return {
      headline: 'Denefit in-house contract (Primary tradeline)',
      reason:
        'Denefit in-house financing reports to Equifax as you pay — a credit-building installment path. Education-first so it aligns with a responsible plan.',
      nextPath: `/portal/checkout?package=tradeline_starter&rail=in_house`,
      ctaLabel: 'Start Denefit enrollment',
      pills: ['Denefit • Equifax reporting', 'Education-first', 'Credit-building path'],
    };
  }

  if (args.lane === 'debt_kill') {
    return {
      headline: 'Debt Kill path (education-first)',
      reason:
        'Debt defense is high-impact and time-sensitive. A free strategy call helps us confirm the safest plan and timeline for your situation.',
      nextPath: `/consultation?lane=${encodeURIComponent('Debt Kill (Debt & Legal)')}`,
      ctaLabel: 'Book a free strategy call',
      pills: ['High impact', 'Timeline sensitive', 'Evidence-first'],
    };
  }

  if (args.lane === 'affiliate') {
    return {
      headline: 'Affiliate lane',
      reason:
        'You’ll get an affiliate profile and links so you can refer partners, track conversions, and manage payouts as the program expands.',
      nextPath: '/affiliate/hub',
      ctaLabel: 'Open Affiliate Hub',
      pills: ['Commission tracking', 'Referral links', 'Denefit stream', 'Partner-ready'],
    };
  }

  if (args.lane === 'heta_society') {
    return {
      headline: `${HEAD_OF_SOCIETY_NAME} portal`,
      reason:
        `Your ${HETA_SOCIETY_SHORT} restoration file is ready — track disputes, access the free guide, and explore business credit modules.`,
      nextPath: '/portal/hos',
      ctaLabel: 'Open HOS portal',
      pills: ['5 dispute slots', 'Free guide', 'Business credit starter'],
    };
  }

  if (args.lane === 'agent') {
    const tierId = (args as any).agentTierId as string | undefined;
    const tier = tierId ? getAgencyTierById(tierId) : null;
    const model = defaultAgentOperatingModel((args as any).agentOperatingModel ?? { capacityTierId: tierId });
    const split = computeAgentRevenueSplit(model);
    const tierPath = tierId ? `/agency/signup?tier=${encodeURIComponent(tierId)}` : '/agency/signup';
    return {
      headline: tier ? `${tier.name} — ${split.agentSharePct}% your keep` : `${CS.programName} — ${split.agentSharePct}% your keep`,
      reason: `${split.summary} Next: create your workspace, open ${CS.hubName} for training tracks and your Finely partnership line, then run customer files in the portal.`,
      nextPath: CS.hubPath,
      ctaLabel: `Open ${CS.hubName}`,
      pills: tier
        ? [
            `You keep ${split.agentSharePct}%`,
            `${tier.activeClientLimit === -1 ? 'Unlimited' : tier.activeClientLimit} clients`,
            split.phaseLabel,
          ]
        : [`You keep ${split.agentSharePct}%`, 'Training academy', 'Revenue-share pricing'],
    };
  }

  // Default: rules-based recommendation → map to pricing catalog packages
  const rec = computeRecommendation({
    goal: args.goal as any,
    fractures: args.fractures,
    liabilityTier: args.liabilityTier as any,
    urgency: args.urgency as any,
  } as any);

  const packageId =
    rec.productId === 'prod_business_foundation'
      ? 'business_foundation'
      : rec.productId === 'prod_debt_legal'
        ? 'debt_kill_starter_dfy'
        : args.goal === 'build'
          ? 'personal_build_starter'
          : 'personal_restore';

  const railQs = args.selectedRail ? `&rail=${args.selectedRail}` : '';

  return {
    headline: 'Suggested starting point',
    reason: `${rec.reason} (Illustrative estimate — not a guarantee of results or pricing.)`,
    nextPath: `/portal/checkout?package=${packageId}${railQs}`,
    ctaLabel: 'Continue to checkout',
    pills: ['Done-for-you', 'Structured workflow', 'Evidence-first'],
    packageId,
  };
}

// --- STEP 1: SOVEREIGN IDENTITY ---
interface StepProps {
  next: () => void;
  prev?: () => void;
  data: any;
  update: (data: any) => void;
}

function StepNavFooter({ prev, onNext, nextLabel = 'Continue', nextDisabled }: {
  prev?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div
      data-fc-onboarding-nav="1"
      className="fc-onboarding-step-nav sticky bottom-0 z-40 -mx-4 sm:-mx-6 md:-mx-12 px-4 sm:px-6 md:px-12 py-4 mt-8 bg-gradient-to-t from-fc-shell from-70% via-fc-shell/98 to-transparent border-t border-white/[0.08] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 max-w-4xl mx-auto">
        {prev ? (
          <button
            type="button"
            onClick={prev}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.04] hover:border-white/20 transition-all"
          >
            <ArrowLeft size={14} /> Previous
          </button>
        ) : (
          <div className="hidden sm:block sm:w-[140px]" aria-hidden />
        )}
        <Button onClick={onNext} disabled={nextDisabled} size="lg" className="w-full sm:w-auto min-h-[48px] sm:min-w-[200px] shadow-lg shadow-fuchsia-500/10">
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

// --- STEP 4: FOUNDATIONAL FRACTURES ---
export function FoundationalFractures({ next, prev, data, update }: StepProps) {
  if ((data.lane || '') === 'business_credit') {
    const canContinue = Boolean((data.businessName || '').trim()) && Boolean((data.entityState || '').trim());
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
        <div className="space-y-4">
          <p className="text-[10px] font-black tracking-[0.6em] text-fuchsia-400 uppercase">Step 04 // Business persona</p>
          <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
            Treat the business like its <span className="text-fuchsia-400">own person</span>
          </h2>
          <p className="text-white/55 text-lg font-light max-w-2xl">
            Business credit is built on business identity + fundability signals. This creates a separate profile from your personal credit.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <div className="fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/5 p-6 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-white/45">Business name</div>
            <input
              value={data.businessName || ''}
              onChange={(e) => update({ businessName: e.target.value })}
              placeholder="Acme Holdings LLC"
              className="w-full rounded-xl border border-white/[0.08] bg-fc-input px-4 py-3 text-white/90 text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 backdrop-blur-sm transition-all"
            />
          </div>
          <div className="fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/5 p-6 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-white/45">Entity state</div>
            <input
              value={data.entityState || ''}
              onChange={(e) => update({ entityState: e.target.value })}
              placeholder="CA"
              className="w-full rounded-xl border border-white/[0.08] bg-fc-input px-4 py-3 text-white/90 text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 backdrop-blur-sm transition-all"
            />
            <div className="text-white/45 text-xs">Where the entity is registered (SOS).</div>
          </div>
          <div className="fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/5 p-6 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-white/45">EIN last 4 (optional)</div>
            <input
              value={data.einLast4 || ''}
              onChange={(e) => update({ einLast4: e.target.value.replace(/[^\d]/g, '').slice(0, 4) })}
              placeholder="1234"
              className="w-full rounded-xl border border-white/[0.08] bg-fc-input px-4 py-3 text-white/90 text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 backdrop-blur-sm transition-all font-mono tracking-wider"
              inputMode="numeric"
            />
            <div className="text-white/45 text-xs">We never need full EIN here.</div>
          </div>
          <div className="fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/5 p-6 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-white/45">NAICS (optional)</div>
            <input
              value={data.naics || ''}
              onChange={(e) => update({ naics: e.target.value.replace(/[^\d]/g, '').slice(0, 6) })}
              placeholder="541611"
              className="w-full rounded-xl border border-white/[0.08] bg-fc-input px-4 py-3 text-white/90 text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 backdrop-blur-sm transition-all font-mono tracking-wider"
              inputMode="numeric"
            />
          </div>
        </div>

        <StepNavFooter prev={prev} onNext={next} nextLabel="Continue" nextDisabled={!canContinue} />
      </div>
    );
  }

  const issues = [
    { id: 'clean', label: 'No Derogatories (Building)', icon: ShieldCheck },
    { id: 'late', label: 'Late Payments', icon: Clock },
    { id: 'charge', label: 'Charge-Offs', icon: ShieldAlert },
    { id: 'bk', label: 'Bankruptcies', icon: Gavel },
    { id: 'repo', label: 'Repossessions', icon: Briefcase },
    { id: 'coll', label: 'Collections', icon: Flame },
    { id: 'inq', label: 'Excessive Inquiries', icon: Activity }
  ];

  const toggle = (id: string) => {
    const list = data.fractures || [];
    // "Clean file" is exclusive.
    if (id === 'clean') {
      update({ fractures: list.includes('clean') ? [] : ['clean'] });
      return;
    }
    const withoutClean = list.filter((x: string) => x !== 'clean');
    const newList = withoutClean.includes(id) ? withoutClean.filter((i: string) => i !== id) : [...withoutClean, id];
    update({ fractures: newList });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-fuchsia-400 uppercase">Step 04 // Credit issues</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          What holds your <span className="text-fuchsia-400">score back?</span>
        </h2>
        <p className="text-white/55 text-lg font-light">Tap everything on your reports today. Choose &ldquo;No issues&rdquo; if you are building from a clean file.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl">
        {issues.map((i) => {
          const FractureIcon = i.icon;
          const isActive = (data.fractures || []).includes(i.id);
          return (
            <div
              key={i.id}
              onClick={() => toggle(i.id)}
              className={`group cursor-pointer p-8 fc-light-glass-panel fc-light-chrome-panel rounded-xl ring-1 ring-inset ring-white/5 transition-all duration-500 flex flex-col items-center justify-center gap-4 hover:brightness-[1.02] hover:shadow-md hover:shadow-lg ${
                isActive ? 'border-fuchsia-500/50 bg-fuchsia-500/10 shadow-[0_0_20px_rgba(217,70,239,0.2)]' : 'border-white/[0.08] bg-white/[0.05] hover:bg-white/[0.04]'
              }`}
            >
              <FractureIcon className={isActive ? 'text-fuchsia-400' : 'text-white/45 group-hover:text-white'} size={32} strokeWidth={1.5} />
              <span className={`text-xs font-black uppercase tracking-widest text-center ${isActive ? 'text-white' : 'text-white/45 group-hover:text-white'}`}>{i.label}</span>
            </div>
          );
        })}
      </div>
      <StepNavFooter prev={prev} onNext={next} nextLabel="Continue" nextDisabled={!(data.fractures?.length > 0)} />
    </div>
  );
}

// --- STEP 10: RECOMMENDATION (RESULTS + NEXT ACTION) ---
export function BlueprintRecommendation({ next, prev, data, update }: StepProps) {
  const rec = useMemo(() => {
    return recommendNext({
      lane: (data.lane || 'other') as OnboardingLane,
      score: typeof data.score === 'number' ? data.score : undefined,
      goal: data.goal,
      fractures: data.fractures,
      liabilityTier: data.liabilityTier,
      urgency: data.urgency,
      selectedPackageId: data.selectedPackageId || undefined,
      selectedRail: data.selectedRail || undefined,
      agentTierId: data.agentTierId || undefined,
      agentOperatingModel: data.agentOperatingModel || undefined,
    } as any);
  }, [data.fractures, data.goal, data.lane, data.liabilityTier, data.score, data.selectedPackageId, data.selectedRail, data.urgency, data.agentTierId, data.agentOperatingModel]);

  const selectedPackage = useMemo(() => {
    const id = (data.selectedPackageId || '').trim();
    return id ? getPackageById(id) : null;
  }, [data.selectedPackageId]);

  const recommendedPackage = useMemo(() => {
    const id = (rec as any).packageId as string | undefined;
    return id ? getPackageById(id) : null;
  }, [rec]);

  useEffect(() => {
    update({
      recommendedNextPath: rec.nextPath,
      recommendedHeadline: rec.headline,
      recommendedReason: rec.reason,
    });
  }, [rec.headline, rec.nextPath, rec.reason]);

  const setPathAndContinue = (nextPath: string) => {
    update({ recommendedNextPath: nextPath });
    next();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-top-8 duration-700 text-left min-w-0">
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-[0.55em] text-fuchsia-400 uppercase">Recommendation</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Your next step is <span className="text-fuchsia-400">clear.</span>
        </h2>
        <p className="text-white/45 text-lg font-light max-w-2xl">
          We use your intake to route you to the safest lane. No hype — just a clean, results-driven plan.
        </p>
      </div>

      <div className="rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-7 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-white font-semibold text-xl">{rec.headline}</div>
            <div className="text-white/70 text-sm leading-relaxed max-w-2xl">{rec.reason}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(rec.pills || []).slice(0, 4).map((p: string) => (
              <span
                key={p}
                className="px-3 py-1.5 rounded-full fc-light-glass-panel fc-light-chrome-panel border ring-1 ring-inset ring-white/5 text-[10px] font-black uppercase tracking-widest text-white/70"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {(selectedPackage || recommendedPackage) && (
          <div className="fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/5 p-5">
            <div className="text-[10px] uppercase tracking-widest text-white/45 font-black">
              {selectedPackage ? 'Selected package' : 'Suggested package'}
            </div>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-white font-semibold">{(selectedPackage || recommendedPackage)!.name}</div>
                <div className="text-white/50 text-sm">{(selectedPackage || recommendedPackage)!.tagline}</div>
              </div>
              <div className="text-amber-300 font-black text-lg">
                {formatPrice((selectedPackage || recommendedPackage)!.priceAmount)}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setPathAndContinue(rec.nextPath)}
            className="fc-button-brand px-6 py-4"
          >
            {rec.ctaLabel} <Target size={14} />
          </button>
          <button
            onClick={next}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/90 transition-all"
          >
            Create account first <ArrowLeft size={14} className="rotate-180" />
          </button>
        </div>

        <p className="text-white/45 text-xs leading-relaxed">
          You'll create your account next. After signup, we'll route you to{' '}
          {rec.nextPath.includes('/portal/checkout') ? (
            <span className="text-emerald-300">Partner Checkout</span>
          ) : (
            'your recommended next step'
          )}
          {rec.nextPath.includes('/portal/checkout') && (selectedPackage || recommendedPackage) ? (
            <> — <span className="font-mono text-white/70">{(selectedPackage || recommendedPackage)!.id}</span></>
          ) : null}
          .
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="fc-light-glass-panel fc-light-chrome-panel p-6 space-y-2">
          <div className="text-white font-semibold">Prefer to browse AU inventory?</div>
          <div className="text-white/50 text-sm">Browse and secure a seat — then checkout.</div>
          <button
            onClick={() => setPathAndContinue('/tradelines?focus=au')}
            className="inline-flex items-center gap-2 text-fuchsia-300 text-sm font-semibold hover:text-fuchsia-200 transition-colors"
          >
            Browse AU marketplace <ArrowLeft size={14} className="rotate-180" />
          </button>
        </div>
        <div className="fc-light-glass-panel fc-light-chrome-panel p-6 space-y-2">
          <div className="text-white font-semibold">Need a strategist?</div>
          <div className="text-white/50 text-sm">Book a free strategy call and we&apos;ll match you to the safest lane.</div>
          <button
            onClick={() => setPathAndContinue(`/consultation?lane=${encodeURIComponent('Other')}`)}
            className="inline-flex items-center gap-2 text-fuchsia-300 text-sm font-semibold hover:text-fuchsia-200 transition-colors"
          >
            Book a free strategy call <ArrowLeft size={14} className="rotate-180" />
          </button>
        </div>
        <div className="fc-light-glass-panel fc-light-chrome-panel p-6 space-y-2">
          <div className="text-white font-semibold">Want to compare pricing?</div>
          <div className="text-white/50 text-sm">See do-it-yourself vs done-for-you options by category.</div>
          <button
            onClick={() => setPathAndContinue('/pricing')}
            className="inline-flex items-center gap-2 text-fuchsia-300 text-sm font-semibold hover:text-fuchsia-200 transition-colors"
          >
            View pricing <ArrowLeft size={14} className="rotate-180" />
          </button>
        </div>
      </div>

      {prev && (
        <div className="pt-6">
          <button
            type="button"
            onClick={prev}
            className="inline-flex items-center gap-2 px-5 py-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.04] hover:border-white/20 transition-all"
          >
            <ArrowLeft size={14} /> Previous
          </button>
        </div>
      )}
    </div>
  );
}

// --- STEP 11: CREDENTIAL CREATION ---
export function CredentialCreation({
  onSubmit,
  onPrev,
  isBusy = false,
  error,
  isConfigured = true,
}: {
  onSubmit: (email: string, password: string) => void;
  onPrev?: () => void;
  isBusy?: boolean;
  error?: string | null;
  isConfigured?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="space-y-12 animate-in zoom-in duration-1000 text-center max-w-xl mx-auto">
      <div className="flex justify-center">
        <Lock size={64} className="text-fuchsia-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
      </div>
      <h2 className="text-4xl font-light text-white leading-tight">
        Initialize the <br /> <span className="text-fuchsia-400">Secure Vault.</span>
      </h2>

      {!isConfigured && (
        <div className="p-4 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 text-left">
          <p className="text-xs text-fuchsia-200/90 leading-relaxed">
            Supabase is not configured yet. Add <span className="font-mono">VITE_SUPABASE_URL</span> and <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> to your <span className="font-mono">.env.local</span> (see <span className="font-mono">.env.example</span>).
          </p>
        </div>
      )}

      <div className="space-y-4 text-left">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/45 uppercase tracking-widest">Account Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            className="w-full bg-fc-input border border-white/[0.08] p-5 rounded-lg focus:border-violet-500 focus:outline-none text-white font-mono tracking-wider text-sm transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/45 uppercase tracking-widest">Vault Access Key</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full bg-fc-input border border-white/[0.08] p-5 rounded-lg focus:border-violet-500 focus:outline-none text-white font-mono tracking-wider text-sm transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-left">
          <p className="text-xs text-red-200/90 leading-relaxed">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        {onPrev ? (
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-2 px-5 py-3 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.04] hover:border-white/20 transition-all"
          >
            <ArrowLeft size={14} /> Previous
          </button>
        ) : <div />}
        <Button
          onClick={() => onSubmit(email, password)}
          disabled={!email || !password || isBusy}
          size="lg"
        >
          {isBusy ? 'Initializing…' : 'Access Protocol'}
        </Button>
      </div>
    </div>
  );
}

// --- SOVEREIGN PORTAL (MAIN WRAPPER) ---
interface SovereignPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (nextPath?: string) => void;
}

function createDefaultOnboardingUserData() {
  return {
    name: '',
    email: '',
    password: '',
    role: '' as '' | 'client' | 'au_seller' | 'agent' | 'affiliate',
    focuses: [] as string[],
    agentTierId: '',
    agentSpecialties: [] as string[],
    agentTrainingPhase: 'apprenticeship' as const,
    agentOperatingModel: null as any,
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    goal: '',
    lane: 'other' as OnboardingLane,
    businessName: '',
    entityState: '',
    einLast4: '',
    naics: '',
    fractures: [] as string[],
    liabilityTier: '',
    fundingTarget: '' as string,
    urgency: '',
    selectedPackageId: '' as string,
    selectedRail: '' as '' | 'stripe' | 'in_house',
    recommendedNextPath: '' as string,
    recommendedHeadline: '' as string,
    recommendedReason: '' as string,
    referralCode: '',
    promoterRole: '',
    promoType: '',
    promoAsset: '',
    legalChecks: {} as Partial<Record<SignupLegalItemId, boolean>>,
    legalAcceptedName: '',
    confirmPassword: '',
    invitePartnerId: '' as string,
    supportModel: '' as string,
    helperName: '',
    priorCompany: '',
  };
}

function OnboardingShellChrome({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="fixed z-[120] inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-[#0a1018]/90 text-white/90 shadow-lg backdrop-blur-sm hover:text-white hover:border-white/40 hover:bg-white/[0.12] transition-colors fc-focus-ring top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] sm:top-5 sm:right-6"
      aria-label="Close and return to homepage"
      title="Back to homepage"
    >
      <X size={20} />
    </button>
  );
}

// --- STEP: ROLE (defines the user's primary role first) ---
const ROLE_CARDS: Array<{
  id: 'client' | 'au_seller' | 'agent' | 'affiliate';
  title: string;
  desc: string;
  Icon: any;
  lane?: OnboardingLane;
  goal?: string;
}> = [
  { id: 'client', title: 'Customer', desc: 'Improve my credit, kill debt, build business credit, or get funding. (Most people choose this.)', Icon: ShieldCheck },
  { id: 'au_seller', title: 'AU Seller', desc: 'We market your AU tradelines — $50 activation, 60-day seasons, seller payouts.', Icon: Building2, lane: 'au_seller', goal: 'au_seller' },
  { id: 'agent', title: 'Credit Specialist', desc: 'Run customer files as a Finely partner — revenue share, training, white-label, and a direct line to our team.', Icon: Briefcase, lane: 'agent', goal: 'agent' },
  { id: 'affiliate', title: 'Affiliate', desc: 'Refer partners and earn payouts with tracked links.', Icon: Trophy, lane: 'affiliate', goal: 'affiliate' },
];

export function RoleStep({ next, data, update }: StepProps) {
  const role = data.role || '';

  const pickRole = (r: (typeof ROLE_CARDS)[number]) => {
    update(
      applyOnboardingRole(
        {
          ...data,
          agentTierId: r.id === 'agent' ? data.agentTierId || '' : '',
        },
        r.id,
      ),
    );
    window.requestAnimationFrame(() => {
      document.querySelector('[data-fc-onboarding-scroll]')?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      <div className="space-y-2 sm:space-y-3">
        <p className="text-[10px] font-black tracking-[0.6em] text-fuchsia-400 uppercase">Step 01 // Role</p>
        <h2 className="fc-onboarding-step-title">
          Which best <span className="text-fuchsia-400">describes you?</span>
        </h2>
        <p className="text-white/45 text-sm sm:text-base font-light max-w-xl">
          Pick one to continue — you can refine details on the next screens.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {ROLE_CARDS.map((r) => {
          const active = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => pickRole(r)}
              className={`group text-left rounded-2xl border p-3.5 sm:p-5 transition-all min-h-[48px] ${
                active ? 'border-fuchsia-500/50 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/25' : 'border-white/[0.08] bg-white/[0.05] hover:border-violet-500/30'
              }`}
            >
              <r.Icon size={22} className={active ? 'text-fuchsia-400' : 'text-white/45 group-hover:text-white'} />
              <div className="mt-2 text-white font-semibold text-base sm:text-lg">{r.title}</div>
              <div className="mt-1 text-white/45 text-xs sm:text-sm leading-relaxed line-clamp-3">{r.desc}</div>
              {active ? (
                <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-300">Selected — tap Continue above</div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- STEP: FOCUS (clients pick what they want to work on; multi-select) ---
const FOCUS_CARDS: Array<{ id: string; title: string; desc: string; Icon: any; goal: string; lane: OnboardingLane }> = [
  { id: 'personal_restore', title: 'Personal Credit Restore', desc: 'Dispute and remove inaccurate negative items.', Icon: ShieldAlert, goal: 'restore', lane: 'other' },
  { id: 'personal_build', title: 'Personal Credit Building', desc: 'Build positive history and raise your score.', Icon: Activity, goal: 'build', lane: 'other' },
  { id: 'business_credit', title: 'Business Credit', desc: 'Establish business credit and funding readiness.', Icon: Building2, goal: 'business', lane: 'business_credit' },
  { id: 'debt_kill', title: 'Debt & Legal', desc: 'Validate and defend against debts and collections.', Icon: Gavel, goal: 'debt', lane: 'debt_kill' },
  { id: 'tradelines', title: 'Tradelines', desc: 'Authorized-user or primary tradelines.', Icon: Trophy, goal: 'funding', lane: 'au_tradelines' },
  { id: 'funding', title: 'Funding readiness', desc: 'Get capital-ready and pursue funding pathways.', Icon: Target, goal: 'funding', lane: 'funding_readiness' },
];

export function FocusStep({ next, prev, data, update }: StepProps) {
  const focuses: string[] = Array.isArray(data.focuses) ? data.focuses : [];
  const toggle = (id: string) => {
    const has = focuses.includes(id);
    const nextFocuses = has ? focuses.filter((x) => x !== id) : [...focuses, id];
    // The first selected focus is the "primary" and drives goal/lane/route.
    const primary = FOCUS_CARDS.find((c) => c.id === nextFocuses[0]);
    update({ focuses: nextFocuses, ...(primary ? { goal: primary.goal, lane: primary.lane } : {}) });
  };
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0">
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-[0.6em] text-fuchsia-400 uppercase">Step 02 // Focus</p>
        <h2 className="fc-onboarding-step-title">
          What do you want to <span className="text-fuchsia-400">work on?</span>
        </h2>
        <p className="text-white/45 text-base sm:text-lg font-light max-w-xl">
          Pick your main focus — you can add more now or later in your dashboard. Some tools unlock right away; paid
          services activate after checkout (your admin can unlock them too).
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {FOCUS_CARDS.map((c) => {
          const active = focuses.includes(c.id);
          const isPrimary = focuses[0] === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`group text-left rounded-2xl border p-4 sm:p-6 transition-all min-h-[48px] ${
                active ? 'border-fuchsia-500/50 bg-fuchsia-500/10' : 'border-white/[0.08] bg-white/[0.05] hover:border-violet-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <c.Icon size={24} className={active ? 'text-fuchsia-400' : 'text-white/45 group-hover:text-white'} />
                {isPrimary ? (
                  <span className="text-[9px] font-black uppercase tracking-widest text-fuchsia-300 border border-fuchsia-500/30 bg-fuchsia-500/10 rounded-full px-2 py-0.5">
                    Primary
                  </span>
                ) : active ? (
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200 border border-emerald-500/25 bg-emerald-500/10 rounded-full px-2 py-0.5">
                    Added
                  </span>
                ) : null}
              </div>
              <div className="mt-3 text-white font-semibold text-lg">{c.title}</div>
              <div className="mt-1 text-white/45 text-sm leading-relaxed">{c.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SovereignPortal({ isOpen, onClose, onComplete }: SovereignPortalProps) {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'select' | 'login' | 'signup' | 'forgot'>(() => {
    if (typeof window === 'undefined') return 'select';
    if (isPartnerInviteUrl(window.location.search)) return 'signup';
    if (window.location.pathname === '/signup') return 'signup';
    if (window.location.pathname === '/login') return 'login';
    if (window.location.pathname === '/forgot-password') return 'forgot';
    return 'select';
  });
  const [step, setStep] = useState(1);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [userData, setUserData] = useState(() => {
    const base = createDefaultOnboardingUserData();
    if (typeof window === 'undefined') return base;
    const boot = bootstrapInviteUserDataFromUrl(window.location.search);
    return boot ? ({ ...base, ...boot } as typeof base) : base;
  });
  const onboardingScrollRef = useRef<HTMLDivElement | null>(null);
  const storageHydratedRef = useRef(false);
  const inviteStorageClearedRef = useRef('');
  const urlContextBootstrappedRef = useRef('');
  const partnerInviteFlow = useMemo(() => isPartnerInviteUrl(location.search), [location.search]);

  const stepKeys = useMemo(
    () =>
      partnerInviteFlow
        ? getPartnerInviteStepKeys((userData.role || 'client') as OnboardingRole)
        : getOnboardingStepKeys({ role: userData.role, focuses: userData.focuses, lane: userData.lane, agentTierId: userData.agentTierId }),
    [partnerInviteFlow, userData.role, userData.focuses, userData.lane, userData.agentTierId],
  );
  const TOTAL_STEPS = stepKeys.length;
  const currentKey = stepKeys[Math.min(Math.max(1, step), TOTAL_STEPS) - 1] ?? 'role';

  const estimatedWizardSteps = useMemo(() => {
    if (partnerInviteFlow) return Math.max(TOTAL_STEPS, 3);
    const role = userData.role;
    if (role === 'client') return 7;
    if (role === 'agent') return 5;
    if (role === 'au_seller' || role === 'affiliate') return 4;
    return 7;
  }, [partnerInviteFlow, TOTAL_STEPS, userData.role]);

  const progressTotal = userData.role || partnerInviteFlow ? TOTAL_STEPS : estimatedWizardSteps;

  useEffect(() => {
    if (step > TOTAL_STEPS) setStep(TOTAL_STEPS);
  }, [TOTAL_STEPS, step]);

  useEffect(() => {
    if (!isOpen) {
      storageHydratedRef.current = false;
      inviteStorageClearedRef.current = '';
      return;
    }
    if (isPartnerInviteUrl(location.search)) {
      if (inviteStorageClearedRef.current !== location.search) {
        resetOnboardingStorageForInvite(location.search);
        inviteStorageClearedRef.current = location.search;
      }
      return;
    }
    if (storageHydratedRef.current) return;
    storageHydratedRef.current = true;
    try {
      const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { userData?: any; step?: number; authMode?: 'select' | 'login' | 'signup' | 'forgot' };
      if (parsed?.userData) setUserData((prev) => ({ ...prev, ...parsed.userData }));
      if (typeof parsed?.step === 'number') setStep(Math.min(Math.max(1, parsed.step), TOTAL_STEPS));
      if (parsed?.authMode) setAuthMode(parsed.authMode);
    } catch {
      // ignore
    }
  }, [isOpen, location.search, TOTAL_STEPS]);

  const resetOnboardingState = useCallback((opts?: { authMode?: 'select' | 'login' | 'signup' | 'forgot' }) => {
    clearOnboardingProgress();
    storageHydratedRef.current = false;
    setUserData(createDefaultOnboardingUserData());
    setStep(1);
    setAuthError(null);
    setAuthNotice(null);
    setLoginEmail('');
    setLoginPassword('');
    setForgotEmail('');
    if (opts?.authMode) setAuthMode(opts.authMode);
  }, []);

  const handleExitSetup = useCallback(() => {
    resetOnboardingState({ authMode: 'select' });
    onClose();
  }, [onClose, resetOnboardingState]);

  const handleStartOver = useCallback(() => {
    resetOnboardingState({ authMode: 'signup' });
    navigate('/onboarding', { replace: true });
    window.requestAnimationFrame(() => {
      onboardingScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [navigate, resetOnboardingState]);

  useEffect(() => {
    if (!isOpen) return;
    onboardingScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [isOpen, step, currentKey]);

  // URL-driven onboarding context (e.g., /onboarding?package=personal_restore&rail=in_house)
  useEffect(() => {
    if (!isOpen) {
      urlContextBootstrappedRef.current = '';
      return;
    }
    const bootKey = `${location.pathname}${location.search}`;
    if (urlContextBootstrappedRef.current === bootKey) return;
    urlContextBootstrappedRef.current = bootKey;

    const sp = new URLSearchParams(location.search);
    const authParam = (sp.get('auth') || sp.get('mode') || '').toLowerCase();
    const packageId = sp.get('package');
    const rail = sp.get('rail') as 'stripe' | 'in_house' | null;
    const laneParam = sp.get('lane');
    const roleParam = normalizeOnboardingRole(sp.get('role'));
    const skipRole = sp.get('skipRole') === '1' || sp.get('skip') === '1';
    const nextRaw = sp.get('next');
    const emailParam = safeDecode(sp.get('email') || '').trim();
    const partnerIdParam = safeDecode(sp.get('partnerId') || '').trim();
    const focusParam = safeDecode(sp.get('focus') || '').trim();
    const isInvite = sp.get('invite') === '1';
    const attr = captureLeadAttributionFromUrl(location.search, location.pathname);
    if (attr && !(isInvite && partnerIdParam)) {
      const promoterRole = (attr.promoterRole || '').toLowerCase();
      const mappedRole =
        promoterRole === 'seller'
          ? 'au_seller'
          : promoterRole === 'agent'
            ? 'agent'
            : promoterRole === 'affiliate'
              ? 'affiliate'
              : '';
      setUserData((prev) => {
        const next = {
          ...prev,
          referralCode: attr.referralCode || prev.referralCode,
          promoterRole: attr.promoterRole || prev.promoterRole,
          promoType: attr.promoType || prev.promoType,
          promoAsset: attr.promoAsset || prev.promoAsset,
          goal: prev.goal || (mappedRole === 'au_seller' ? 'au_seller' : mappedRole || prev.goal),
        };
        return mappedRole ? applyOnboardingRole(next, mappedRole) : next;
      });
    }

    // Direct routes + query-driven mode
    if (location.pathname === '/login') setAuthMode('login');
    if (location.pathname === '/signup') setAuthMode('signup');
    if (location.pathname === '/forgot-password') setAuthMode('forgot');
    if (authParam === 'login' || authParam === 'signin') setAuthMode('login');
    if (authParam === 'signup' || authParam === 'register') setAuthMode('signup');
    if (authParam === 'forgot' || authParam === 'reset') setAuthMode('forgot');

    if (emailParam && (location.pathname === '/signup' || authParam === 'signup' || isInvite)) {
      setUserData((prev) => ({ ...prev, email: prev.email || emailParam }));
      setLoginEmail((prev) => prev || emailParam);
      setForgotEmail((prev) => prev || emailParam);
    }

    if (isInvite) {
      setAuthMode('signup');
      setStep(1);
      const invite = parsePartnerInviteSearch(location.search);
      if (invite) {
        setUserData((prev) => ({
          ...prev,
          ...applyOnboardingRole(
            {
              ...prev,
              invitePartnerId: invite.partnerId,
              email: prev.email || invite.email,
              recommendedNextPath: prev.recommendedNextPath || invite.nextPath,
              focuses: prev.focuses?.length ? prev.focuses : invite.focus ? [invite.focus] : prev.focuses,
            },
            invite.role,
          ),
        }));
        void hydrateInviteUserDataFromPartner(createDefaultOnboardingUserData(), invite).then((hydrated) => {
          setUserData((prev) => ({
            ...(hydrated as ReturnType<typeof createDefaultOnboardingUserData>),
            confirmPassword: prev.confirmPassword,
            legalChecks: prev.legalChecks,
            legalAcceptedName: prev.legalAcceptedName,
          }));
        });
      } else if (roleParam) {
        setUserData((prev) => ({
          ...applyOnboardingRole(prev, roleParam),
          recommendedNextPath: prev.recommendedNextPath || landingPathForRole(roleParam),
        }));
      }
      if (partnerIdParam) {
        setUserData((prev) => ({ ...prev, invitePartnerId: partnerIdParam }));
      }
      if (focusParam) {
        setUserData((prev) => ({
          ...prev,
          focuses: prev.focuses?.length ? prev.focuses : [focusParam],
        }));
      }
    }

    if (packageId) {
      const pkg = getPackageById(packageId);
      if (pkg) {
        setUserData((prev) => ({
          ...prev,
          selectedPackageId: pkg.id,
          selectedRail: rail ?? prev.selectedRail,
          lane: prev.lane === 'other' ? 'funding_readiness' : prev.lane,
          goal: prev.goal || 'funding',
        }));
      }
    }

    // Explicit next-path override (e.g., send Pricing → Checkout after intake)
    if (nextRaw) {
      const decoded = safeDecode(nextRaw).trim();
      if (decoded.startsWith('/')) {
        setUserData((prev) => ({
          ...prev,
          recommendedNextPath: decoded,
        }));
      }
    }

    let mappedLane: OnboardingLane | null = null;
    if (laneParam && !isInvite) {
      mappedLane = laneFromParam(safeDecode(laneParam)) as OnboardingLane;
      const laneRole = laneToOnboardingRole(mappedLane);
      setUserData((prev) => {
        const nextRole = roleParam || laneRole || prev.role;
        const base = {
          ...prev,
          lane: mappedLane!,
          goal:
            prev.goal ||
            (mappedLane === 'debt_kill'
              ? 'debt'
              : mappedLane === 'business_credit'
                ? 'business'
                : mappedLane === 'au_seller'
                  ? 'au_seller'
                  : mappedLane === 'affiliate'
                    ? 'affiliate'
                    : mappedLane === 'agent'
                      ? 'agent'
                      : 'funding'),
        };
        return nextRole ? applyOnboardingRole(base, nextRole as any) : base;
      });
    } else if (roleParam && !isInvite) {
      setUserData((prev) => applyOnboardingRole(prev, roleParam));
    }

    const effectiveRole = roleParam || (mappedLane ? laneToOnboardingRole(mappedLane) : '');
    if (!isInvite && effectiveRole && skipRole && (authMode === 'signup' || location.pathname === '/signup' || authParam === 'signup')) {
      setAuthMode('signup');
      setStep((prevStep) => {
        const afterRole = stepAfterRoleSelection({
          role: effectiveRole,
          focuses: userData.focuses,
          lane: mappedLane ?? userData.lane,
          agentTierId: userData.agentTierId,
        });
        return Math.max(prevStep, afterRole);
      });
    }
  }, [isOpen, location.search, location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    if (isPartnerInviteUrl(location.search)) return;
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ userData, step, authMode }));
    } catch {
      // ignore
    }
  }, [authMode, isOpen, location.search, step, userData]);

  useEffect(() => {
    if (!isOpen) return;
    const invite = parsePartnerInviteSearch(location.search);
    if (!invite?.email || !auth.user?.email) return;
    const sessionEmail = auth.user.email.trim().toLowerCase();
    const inviteEmail = invite.email.trim().toLowerCase();
    if (sessionEmail && inviteEmail && sessionEmail !== inviteEmail) {
      void auth.signOut();
    }
  }, [auth, isOpen, location.search]);

  const updateData = (newData: Partial<typeof userData>) => {
    setAuthError(null);
    setUserData((prev) => ({ ...prev, ...newData }));
  };

  const goToAuthMode = (mode: 'select' | 'login' | 'signup' | 'forgot') => {
    setAuthError(null);
    setAuthNotice(null);
    if (mode === 'signup') {
      setStep(1);
    }
    setAuthMode(mode);
    if (mode === 'login') navigate('/login', { replace: location.pathname === '/login' });
    else if (mode === 'signup') navigate('/signup', { replace: location.pathname === '/signup' });
    else if (mode === 'forgot') navigate('/forgot-password?auth=forgot', { replace: location.pathname === '/forgot-password' });
    else if (location.pathname !== '/onboarding') navigate('/onboarding', { replace: true });
  };

  const nextStep = () => {
    if (step >= TOTAL_STEPS) return;
    setStep(s => s + 1);
  };

  const prevStep = () => {
    if (step <= 1) return;
    setStep(s => s - 1);
  };

  const handleQuickDevAdminLogin = async () => {
    const email = listBootstrapAdminEmails()[0] || 'sanzstlouis@finelycred.com';
    setLoginEmail(email);
    setLoginPassword('dev');
    setAuthError(null);
    setAuthNotice(null);
    setAuthBusy(true);
    try {
      const res = await auth.signInWithEmail({ email, password: 'dev' });
      if (res.error) {
        setAuthError(res.error);
        return;
      }
      const user = res.user ?? auth.user;
      if (user?.id && user.email) {
        await retryPendingInviteClaim({ userId: user.id, email: user.email });
      }
      const nextPath = isAdminEmail(email) ? '/admin' : resolvePostAuthHomePath(user);
      clearOnboardingProgress();
      onComplete(nextPath);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogin = async () => {
    const email = loginEmail.trim();
    if (!email || !loginPassword) {
      setAuthError('Email and password are required.');
      return;
    }
    setAuthError(null);
    setAuthNotice(null);
    setAuthBusy(true);
    try {
      const res = await auth.signInWithEmail({ email, password: loginPassword });
      if (res.error) {
        setAuthError(res.error);
        return;
      }
      const user = res.user ?? auth.user;
      if (user?.id && user.email) {
        await retryPendingInviteClaim({ userId: user.id, email: user.email });
        const { trackPartnerSignIn } = await import('../../lib/partnerAuthActivity');
        await trackPartnerSignIn(user).catch(() => null);
      }
      const nextPath = userData.recommendedNextPath || (isAdminEmail(user?.email) ? '/admin' : resolvePostAuthHomePath(user));
      clearOnboardingProgress();
      onComplete(nextPath);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = forgotEmail.trim() || loginEmail.trim();
    if (!email) {
      setAuthError('Enter your account email.');
      return;
    }
    setAuthError(null);
    setAuthNotice(null);
    setAuthBusy(true);
    try {
      const res = await auth.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (res.error) {
        setAuthError(res.error);
        return;
      }
      setAuthNotice(`If an account exists for ${email}, a reset link was sent via email. Check spam, then open the link to set a new password. The link expires in about an hour.`);
      setForgotEmail(email);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignup = async () => {
    const email = (userData.email || '').trim();
    const password = userData.password || '';
    if (!email || !password) {
      setAuthError('Email and password are required.');
      return;
    }
    const legalCtx = {
      role: (userData.role || '') as import('../../onboarding/pipeline').OnboardingRole,
      focuses: userData.focuses ?? [],
      lane: userData.lane,
      goal: userData.goal,
    };
    const requiredLegal = signupLegalItems(legalCtx).filter((i) => i.required);
    const missingLegal = requiredLegal.filter((i) => !userData.legalChecks?.[i.id]);
    if (missingLegal.length > 0 || !(userData.legalAcceptedName || userData.name || '').trim()) {
      setAuthError('Complete the Legal & agreements step before creating your account.');
      setAuthMode('signup');
      const legalStepIndex = stepKeys.indexOf('legal');
      if (legalStepIndex >= 0) setStep(legalStepIndex + 1);
      return;
    }
    const legalConsents = buildPartnerConsentsFromSignup({
      acceptedIds: requiredLegal.map((i) => i.id).filter((id) => userData.legalChecks?.[id]),
      acceptedName: (userData.legalAcceptedName || userData.name || '').trim(),
    });
    setAuthError(null);
    setAuthBusy(true);
    try {
      const res = await auth.signUpWithEmail({
        email,
        password,
        metadata: {
          name: userData.name,
          role: userData.role,
          focuses: userData.focuses,
          agentTierId: userData.agentTierId,
          agentSpecialties: userData.agentSpecialties,
          agentTrainingPhase: userData.agentTrainingPhase,
          agentOperatingModel: userData.agentOperatingModel,
          phone: userData.phone,
          address1: userData.address1,
          address2: userData.address2,
          city: userData.city,
          state: userData.state,
          postalCode: userData.postalCode,
          goal: userData.goal,
          lane: userData.lane,
          tenantId: getActiveTenantId(),
          businessName: userData.businessName,
          entityState: userData.entityState,
          einLast4: userData.einLast4,
          naics: userData.naics,
          fractures: userData.fractures,
          liabilityTier: userData.liabilityTier,
          funding_target: userData.fundingTarget ? Number(userData.fundingTarget) : undefined,
          urgency: userData.urgency,
          selectedPackageId: userData.selectedPackageId,
          selectedRail: userData.selectedRail,
          recommendedNextPath: userData.recommendedNextPath,
          recommendedHeadline: userData.recommendedHeadline,
          recommendedReason: userData.recommendedReason,
          referralCode: userData.referralCode,
          promoterRole: userData.promoterRole,
          promoType: userData.promoType,
          promoAsset: userData.promoAsset,
          legalConsents,
          legalAcceptedName: userData.legalAcceptedName,
          supportModel: userData.supportModel,
          helperName: userData.helperName,
          priorCompany: userData.priorCompany,
        },
      });

      if (res.error) {
        setAuthError(res.error);
        return;
      }

      // If email confirmations are enabled, the session may not be available immediately.
      const signedInUser = res.user ?? auth.user;
      if (!signedInUser) {
        setAuthNotice(null);
        if (userData.invitePartnerId) {
          savePendingInvitePartnerId(userData.invitePartnerId);
        }
        void (async () => {
          try {
            const { getPartner, findPartnerByEmail } = await import('../../data/partnersRepo');
            const { trackPartnerSignup } = await import('../../lib/partnerAuthActivity');
            let partner = userData.invitePartnerId ? await getPartner(userData.invitePartnerId) : null;
            if (!partner) partner = await findPartnerByEmail(email);
            if (partner) await trackPartnerSignup({ partner, email, pendingEmailConfirmation: true });
          } catch {
            // non-blocking
          }
        })();
        setAuthError(
          'Account created. Check your email to confirm your address (if required by Supabase), then log in with the password you just set. We will finish linking your invite automatically on first login.',
        );
        goToAuthMode('login');
        setLoginEmail(email);
        setLoginPassword('');
        return;
      }

      try {
        if (userData.invitePartnerId) {
          const claimed = await completePartnerInviteClaim({
            partnerId: userData.invitePartnerId,
            userId: signedInUser.id,
            email,
          });
          if (userData.supportModel || userData.helperName || userData.priorCompany) {
            const { upsertPartner } = await import('../../data/partnersRepo');
            await upsertPartner({
              ...claimed,
              journeySignals: {
                ...(claimed.journeySignals ?? {}),
                ...(userData.supportModel ? { supportModel: userData.supportModel } : {}),
                ...(userData.helperName ? { helperName: userData.helperName } : {}),
                ...(userData.priorCompany ? { priorCompany: userData.priorCompany } : {}),
              },
            });
          }
        } else {
          const { getOrCreatePartnerForSession } = await import('../../portal/getOrCreatePartnerForSession');
          await getOrCreatePartnerForSession({ user: signedInUser });
        }
      } catch (claimErr: unknown) {
        const message = claimErr instanceof Error ? claimErr.message : 'Could not link this invite to your account.';
        if (userData.invitePartnerId) {
          savePendingInvitePartnerId(userData.invitePartnerId);
        }
        await retryPendingInviteClaim({ userId: signedInUser.id, email }).catch(() => null);
        try {
          const { getOrCreatePartnerForSession } = await import('../../portal/getOrCreatePartnerForSession');
          await getOrCreatePartnerForSession({ user: signedInUser });
        } catch {
          // Partner record may sync on next login — auth account is still valid.
        }
        setAuthNotice(
          `Account created successfully. We are finishing your profile link${message ? ` (${message})` : ''} — you can continue into the portal.`,
        );
      }

      if (userData.role === 'agent' && signedInUser.id && userData.agentOperatingModel) {
        saveAgentOperatingModel(signedInUser.id, defaultAgentOperatingModel(userData.agentOperatingModel));
      }

      void (async () => {
        try {
          const { getPartner, findPartnerByEmail } = await import('../../data/partnersRepo');
          const { trackPartnerSignup } = await import('../../lib/partnerAuthActivity');
          let partner = userData.invitePartnerId ? await getPartner(userData.invitePartnerId) : null;
          if (!partner) partner = await findPartnerByEmail(email);
          if (!partner) {
            const { getOrCreatePartnerForSession } = await import('../../portal/getOrCreatePartnerForSession');
            partner = await getOrCreatePartnerForSession({ user: signedInUser });
          }
          if (partner) await trackPartnerSignup({ partner, email, pendingEmailConfirmation: false });
        } catch {
          // non-blocking
        }
      })();

      const invite = parsePartnerInviteSearch(location.search);
      const inviteLanding =
        userData.recommendedNextPath ||
        (invite ? invite.nextPath : '') ||
        (userData.role ? landingPathForRole(userData.role as 'client' | 'au_seller' | 'agent' | 'affiliate') : '');
      const nextPath = inviteLanding || resolvePostAuthHomePath(signedInUser);
      clearOnboardingProgress();
      onComplete(nextPath);
    } finally {
      setAuthBusy(false);
    }
  };

  const wizardNav = useMemo(
    () =>
      resolveOnboardingWizardNav({
        currentKey,
        userData,
        authBusy,
        nextStep,
        prevStep,
        onSubmitSignup: () => void handleSignup(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSignup closes over latest userData
    [currentKey, userData, authBusy, step],
  );

  if (!isOpen) return null;

  // Initial Selection Screen
  if (authMode === 'select') {
    const tenant = getActiveTenant();
    const brand = (tenant.settings.brandName || tenant.name || 'Finely Cred').trim() || 'Finely Cred';

    return (
      <OnboardingFlowShell
        active={isOpen}
        chrome={<OnboardingShellChrome onClose={handleExitSetup} />}
        header={<OnboardingExitSetupBar onExit={handleExitSetup} />}
        shellClassName="bg-fc-shell/95 backdrop-blur-2xl animate-in zoom-in duration-500"
        scrollClassName="fc-onboarding-shell-scroll"
      >
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 sm:gap-6 lg:gap-8 min-w-0 p-4 sm:p-6 pb-10">
          <div className="fc-light-glass-panel fc-light-chrome-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 relative overflow-hidden min-w-0">
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute -top-24 left-1/2 -translate-x-1/2 w-[920px] h-[420px] blur-3xl opacity-35"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(var(--brand-primary-rgb),0.22) 0%, transparent 62%)',
                }}
              />
            </div>

            <div className="relative">
              <div className="mb-6 flex justify-center md:justify-start">
                <FinelyCredLogo size="md" forceLight />
                <span className="sr-only">{brand}</span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] sm:tracking-[0.35em] text-white/55">Partner access</div>
              <h2 className="mt-3 sm:mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight">
                Sign in or create your account.
              </h2>
              <p className="mt-3 sm:mt-4 text-white/60 text-sm md:text-base leading-relaxed max-w-2xl">
                Choose an option on the right to continue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5 lg:gap-6 min-w-0">
            <button
              type="button"
              onClick={() => goToAuthMode('signup')}
              className="group w-full text-left p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-violet-100/80 border-white/[0.08] bg-white/[0.05] hover:bg-white/[0.04] hover:border-violet-500/30 transition-all duration-500 flex flex-col items-center text-center gap-4 sm:gap-5 min-h-[48px] touch-manipulation"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border fc-metal-icon-box group-hover:scale-110 transition-transform shrink-0">
                <Fingerprint size={32} className="sm:hidden text-[#0b1110]" />
                <Fingerprint size={38} className="hidden sm:block text-[#0b1110]" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-xl sm:text-2xl font-light text-white">Create account</h3>
                <p className="text-sm text-white/45">
                  Complete the intake, get a recommended path, and enter the dashboard.
                </p>
              </div>
              <div className="pt-1 w-full">
                <div className="w-full fc-button-brand">Get started</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => goToAuthMode('login')}
              className="group w-full text-left p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-violet-100/80 border-white/[0.08] bg-white/[0.05] hover:bg-white/[0.04] hover:border-violet-500/30 transition-all duration-500 flex flex-col items-center text-center gap-4 sm:gap-5 min-h-[48px] touch-manipulation"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border fc-metal-icon-box group-hover:scale-110 transition-transform shrink-0">
                <Key size={32} className="sm:hidden text-[#0b1110]" />
                <Key size={38} className="hidden sm:block text-[#0b1110]" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-xl sm:text-2xl font-light text-white">Sign in</h3>
                <p className="text-sm text-white/45">Return to your dashboard, documents, and workflows.</p>
              </div>
              <div className="pt-1 w-full">
                <div className="w-full fc-button-brand">Open dashboard</div>
              </div>
            </button>
          </div>
        </div>
      </OnboardingFlowShell>
    );
  }

  // Forgot password
  if (authMode === 'forgot') {
    return (
      <OnboardingFlowShell
        active={isOpen}
        chrome={<OnboardingShellChrome onClose={handleExitSetup} />}
        header={<OnboardingExitSetupBar onExit={handleExitSetup} />}
        shellClassName="animate-in slide-in-from-bottom duration-500"
        scrollClassName="fc-onboarding-shell-scroll flex flex-col"
      >
        <div className="max-w-md w-full mx-auto min-w-0 p-5 sm:p-8 fc-light-glass-panel fc-light-chrome-panel rounded-2xl sm:rounded-3xl relative overflow-visible mb-8">
          <div className="text-center space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center border fc-metal-icon-box">
              <Key size={22} className="text-[#0b1110]" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-light text-white">Reset password</h3>
            <p className="text-white/45 text-sm">We&apos;ll email a secure link. You choose a new password on the reset page — admins never see your password.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-white/55 uppercase tracking-widest">Account email</label>
              <input
                type="email"
                value={forgotEmail || loginEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoComplete="email"
                className="w-full min-h-[48px] rounded-xl border border-white/[0.08] bg-fc-input px-4 py-3 text-white/90 focus:outline-none focus:border-violet-500"
              />
            </div>
            {authNotice ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left">
                <p className="text-xs text-emerald-200/90">{authNotice}</p>
              </div>
            ) : null}
            {authError ? (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-left">
                <p className="text-xs text-red-200/90">{authError}</p>
              </div>
            ) : null}
            <Button onClick={() => void handleForgotPassword()} disabled={authBusy || !(forgotEmail.trim() || loginEmail.trim())} size="lg" className="w-full min-h-[48px]">
              {authBusy ? 'Sending…' : 'Send reset link'}
            </Button>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <button type="button" onClick={() => goToAuthMode('login')} className="w-full min-h-[44px] text-white/45 hover:text-white text-[10px] uppercase tracking-widest">
              Back to sign in
            </button>
          </div>
        </div>
      </OnboardingFlowShell>
    );
  }

  // Login Screen
  if (authMode === 'login') {
    const sessionEmail = (auth.user?.email || '').trim();
    const hasActiveSession = Boolean(sessionEmail);

    const continueWithSession = () => {
      const nextPath = userData.recommendedNextPath || resolvePostAuthHomePath(auth.user);
      clearOnboardingProgress();
      onComplete(nextPath);
    };

    const signOutForFreshLogin = async () => {
      setAuthBusy(true);
      setAuthError(null);
      try {
        await auth.signOut();
        setLoginPassword('');
      } finally {
        setAuthBusy(false);
      }
    };

    return (
      <OnboardingFlowShell
        active={isOpen}
        chrome={<OnboardingShellChrome onClose={handleExitSetup} />}
        header={<OnboardingExitSetupBar onExit={handleExitSetup} />}
        shellClassName="animate-in slide-in-from-bottom duration-500"
        scrollClassName="fc-onboarding-shell-scroll flex flex-col p-4 sm:p-6"
      >
        <div className="max-w-md w-full mx-auto min-w-0 p-5 sm:p-8 fc-light-glass-panel fc-light-chrome-panel rounded-2xl sm:rounded-3xl relative overflow-visible mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-60" />
          <div className="text-center space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border fc-metal-icon-box">
              <Key size={22} className="sm:hidden text-[#0b1110]" />
              <Key size={24} className="hidden sm:block text-[#0b1110]" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-light text-white">Sign in</h3>
          </div>

          {hasActiveSession ? (
            <div className="mb-5 space-y-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-left">
              <p className="text-sm text-amber-100/95">
                You are already signed in as <span className="font-mono font-semibold">{sessionEmail}</span>.
              </p>
              <p className="text-xs text-amber-100/75">
                For security, sign out first if you need to enter a password for a different account.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button onClick={continueWithSession} disabled={authBusy} size="lg" className="w-full min-h-[44px]">
                  Continue to portal
                </Button>
                <button
                  type="button"
                  onClick={() => void signOutForFreshLogin()}
                  disabled={authBusy}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold uppercase tracking-widest text-white/80 hover:bg-white/10"
                >
                  <LogOut size={14} /> Sign out & enter password
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!authBusy && loginEmail && loginPassword) void handleLogin();
              }}
            >
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-white/55 uppercase tracking-widest">Email</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                className="w-full min-h-[48px] rounded-xl border border-white/[0.08] bg-fc-input px-4 py-3 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 backdrop-blur-sm transition-all" 
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-white/45 uppercase tracking-widest">Password</label>
              <PasswordInput
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full min-h-[48px] rounded-xl border border-white/[0.08] bg-fc-input px-4 py-3 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 backdrop-blur-sm transition-all"
              />
            </div>
            {!auth.isConfigured && auth.isDevAuthEnabled && (
              <div className="p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 text-left space-y-2">
                <p className="text-[10px] text-fuchsia-200/90 uppercase tracking-widest font-bold">
                  Local dev mode — any password works
                </p>
                <p className="text-xs text-fuchsia-200/70">
                  Admin emails: {listBootstrapAdminEmails().join(', ')}
                </p>
                <button
                  type="button"
                  onClick={() => void handleQuickDevAdminLogin()}
                  disabled={authBusy || hasActiveSession}
                  className="w-full min-h-[40px] rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/15 px-3 text-[10px] font-black uppercase tracking-widest text-fuchsia-100 hover:bg-fuchsia-500/25 disabled:opacity-50"
                >
                  Quick sign in as admin (local)
                </button>
              </div>
            )}
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-left">
                <p className="text-xs text-red-200/90">{authError}</p>
              </div>
            )}
            <Button
              onClick={() => void handleLogin()}
              disabled={authBusy || !loginEmail || !loginPassword || hasActiveSession}
              size="lg"
              className="w-full min-h-[48px]"
            >
              {authBusy ? 'Signing in…' : 'Sign in'}
            </Button>
            </form>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <button 
            type="button"
            onClick={() => goToAuthMode('select')} 
            className="w-full min-h-[44px] text-center text-white/45 hover:text-white text-[10px] uppercase tracking-widest transition-colors px-2 py-2"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => goToAuthMode('signup')}
            className="w-full min-h-[44px] text-center text-white/45 hover:text-fuchsia-300 text-[10px] uppercase tracking-widest transition-colors px-2 py-2"
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => goToAuthMode('forgot')}
            className="w-full min-h-[44px] text-center text-white/55 hover:text-white text-[10px] uppercase tracking-widest transition-colors px-2 py-2 sm:col-span-2"
          >
            Forgot password?
          </button>
          </div>
        </div>
      </OnboardingFlowShell>
    );
  }

  // Signup Wizard
  const attr = getLeadAttribution();
  const promoContext = userData.referralCode || attr?.referralCode ? {
    code: userData.referralCode || attr?.referralCode,
    role: userData.promoterRole || attr?.promoterRole,
    type: userData.promoType || attr?.promoType,
    asset: userData.promoAsset || attr?.promoAsset,
  } : null;

  const wizardPrev =
    wizardNav.prev ?? (currentKey === 'role' ? () => goToAuthMode('select') : undefined);

  const wizardHeader = (
    <>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[-20%] h-[520px] w-[520px] rounded-full bg-fuchsia-600/12 blur-3xl" />
        <div className="absolute -bottom-56 right-[-25%] h-[680px] w-[680px] rounded-full bg-violet-600/10 blur-3xl" />
      </div>
      <div className="relative bg-fc-shell/90 backdrop-blur-2xl border-b border-slate-800/60 px-4 sm:px-6 md:px-12 py-2.5 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-6xl mx-auto space-y-2 sm:space-y-3">
          <OnboardingWizardMobileToolbar
            onExit={handleExitSetup}
            prev={wizardPrev}
            continueSlot={
              <OnboardingWizardHeaderContinue
                onNext={wizardNav.onNext}
                nextLabel={wizardNav.nextLabel}
                nextDisabled={wizardNav.nextDisabled}
              />
            }
          />
          <div className="hidden lg:flex items-center justify-end">
            <button
              type="button"
              onClick={handleStartOver}
              className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-fuchsia-300 transition-colors min-h-[44px] px-2 shrink-0"
              title="Clear progress and begin again from step 1"
            >
              Start over
            </button>
          </div>
          <div className="flex justify-center lg:hidden">
            <button
              type="button"
              onClick={() => goToAuthMode('login')}
              className="text-[10px] font-black uppercase tracking-widest text-white/45 hover:text-white transition-colors min-h-[36px] px-2"
            >
              Already have an account? Sign in
            </button>
          </div>
          <div className="w-full max-w-lg mx-auto">
            <ProgressBar current={step} total={progressTotal} estimatedTotal={estimatedWizardSteps} />
            <div className="mt-2 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.35em] text-white/45">
              {getOnboardingStepLabel(currentKey)}
            </div>
            {partnerInviteFlow ? (
              <div className="mt-1 text-center text-[10px] text-amber-200/90">
                Finely Cred invite setup — email and access lane already attached
              </div>
            ) : userData.recommendedNextPath?.includes('/portal/checkout') ? (
              <div className="mt-1 text-center text-[10px] text-emerald-300/90">Checkout queued after signup</div>
            ) : null}
          </div>
          <OnboardingWizardDesktopToolbar
            onExit={handleExitSetup}
            onSignIn={() => goToAuthMode('login')}
            center={
              currentKey === 'role' ? (
                ROLE_CARDS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      updateData(
                        applyOnboardingRole(
                          { ...userData, agentTierId: r.id === 'agent' ? userData.agentTierId || '' : '' },
                          r.id,
                        ),
                      );
                    }}
                    className={`rounded-full px-3 py-1.5 min-h-[36px] text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      userData.role === r.id
                        ? 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200'
                        : 'border-white/10 bg-white/[0.04] text-white/55 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {r.title}
                  </button>
                ))
              ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-white/45">
                  {getOnboardingStepLabel(currentKey)}
                </span>
              )
            }
          />
        </div>
      </div>
    </>
  );

  return (
    <OnboardingFlowShell
      active={isOpen}
      chrome={<OnboardingShellChrome onClose={handleExitSetup} />}
      header={wizardHeader}
      scrollRef={onboardingScrollRef}
      scrollClassName="fc-onboarding-wizard-scroll w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-4 sm:py-6 lg:py-10 bg-fc-shell/95 backdrop-blur-md"
      footer={
        <OnboardingWizardNavBar
          {...wizardNav}
          prev={wizardPrev}
          onStartOver={handleStartOver}
        />
      }
    >
      <div className="max-w-4xl mx-auto min-w-0">
        {promoContext ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <div className="text-[10px] uppercase tracking-widest font-black text-emerald-200/80">Tracked signup</div>
            <div className="mt-1">
              Code <span className="font-mono text-white">{promoContext.code}</span>
              {promoContext.role ? <> • Role {promoContext.role}</> : null}
              {promoContext.asset ? <> • Asset {promoContext.asset}</> : null}
            </div>
          </div>
        ) : null}
        <OnboardingExperienceShell
          stepKeys={stepKeys}
          currentKey={currentKey}
          stepIndex={step - 1}
          showProgressRail={partnerInviteFlow || Boolean(userData.role)}
          laneLabel={userData.lane && userData.lane !== 'other' ? userData.lane.replace(/_/g, ' ') : userData.goal || undefined}
        >
        <div key={currentKey} className="min-w-0">
        {currentKey === 'role' && <RoleStep next={nextStep} data={userData} update={updateData} />}
        {currentKey === 'focus' && <FocusStep next={nextStep} prev={prevStep} data={userData} update={updateData} />}
        {currentKey === 'support' && (
          <PartnerSupportRelationshipStep data={userData} update={updateData} />
        )}
        {currentKey === 'agentTier' && <AgentOperatingModelStep next={nextStep} prev={prevStep} data={userData} update={updateData} />}
        {currentKey === 'context' && <FoundationalFractures next={nextStep} prev={prevStep} data={userData} update={updateData} />}
        {currentKey === 'recommendation' && <BlueprintRecommendation next={nextStep} prev={prevStep} data={userData} update={updateData} />}
        {currentKey === 'legal' && <SignupLegalStep next={nextStep} prev={prevStep} data={userData} update={updateData} />}
        {currentKey === 'profile' && (
          <ProfileAndAccountStep
            prev={prevStep}
            data={userData}
            update={updateData}
            onSubmit={() => void handleSignup()}
            isBusy={authBusy}
            error={authError}
            isConfigured={auth.isConfigured}
            inviteMode={partnerInviteFlow}
            emailLocked={partnerInviteFlow && Boolean(userData.email)}
          />
        )}
        </div>
        </OnboardingExperienceShell>
      </div>
    </OnboardingFlowShell>
  );
}
