import React, { useMemo, useState, useEffect } from 'react';
import { 
  Fingerprint, Trophy, Gavel, Building2, ShieldCheck, Clock, 
  ShieldAlert, Briefcase, Flame, Activity, Server, CheckCircle2,
  Cpu, FastForward, Target, Lock, ArrowLeft, X, Key, ScanLine, UploadCloud
} from 'lucide-react';
import { Button, ProgressBar } from '../ui';
import { useAuth } from '../../auth/AuthProvider';
import { useLocation } from 'react-router-dom';
import { computeRecommendation } from '../../billing/intakeRecommendation';
import { formatPrice, getPackageById } from '../../config/pricingCatalog';
import { getActiveTenant, getActiveTenantId } from '../../tenancy/activeTenant';

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
  score: number;
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
      headline: 'AU Seller onboarding',
      reason:
        'Sellers submit verified supply listings with proof artifacts. We’ll guide contract acceptance, payouts, and inventory review.',
      nextPath: `/seller/dashboard`,
      ctaLabel: 'Open seller portal',
      pills: ['Supply side', 'Proof required', 'Verification workflow'],
    };
  }

  if (args.lane === 'primary_tradeline') {
    return {
      headline: 'Education-first primary lane',
      reason:
        'Primary tradelines via in‑house financing should be used as a credit-building tool — education-first so it’s aligned with a responsible plan (not debt swapping).',
      nextPath: `/consultation?lane=${encodeURIComponent('In‑House Financing (Primary Tradeline)')}`,
      ctaLabel: 'Book a free enlightenment session',
      pills: ['Reports to Equifax', 'Education-first', 'Credit-building path'],
    };
  }

  if (args.lane === 'debt_kill') {
    return {
      headline: 'Debt Kill path (education-first)',
      reason:
        'Debt defense is high-impact and time-sensitive. A quick enlightenment session helps us confirm the safest plan and timeline for your jurisdiction and facts.',
      nextPath: `/consultation?lane=${encodeURIComponent('Debt Kill (Debt & Legal)')}`,
      ctaLabel: 'Book a free enlightenment session',
      pills: ['High impact', 'Timeline sensitive', 'Evidence-first'],
    };
  }

  if (args.lane === 'affiliate') {
    return {
      headline: 'Affiliate lane',
      reason:
        'You’ll get an affiliate profile and links so you can refer partners, track conversions, and manage payouts as the program expands.',
      nextPath: `/affiliate`,
      ctaLabel: 'Open affiliate portal',
      pills: ['Commission tracking', 'Referral links', 'Partner-ready'],
    };
  }

  if (args.lane === 'agent') {
    return {
      headline: 'Agent lane (operations)',
      reason:
        'Agents operate client files with evidence discipline, tasks, and communications. Team access is granted by an admin owner.',
      nextPath: `/portal/messages`,
      ctaLabel: 'Open messages',
      pills: ['Ops-ready', 'Evidence-first', 'Team workflows'],
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
        : 'personal_restore';

  return {
    headline: 'Recommended DFY program',
    reason: rec.reason,
    nextPath: `/portal/checkout?package=${packageId}`,
    ctaLabel: 'Continue to checkout',
    pills: ['Done-for-you', args.score < 640 ? 'Thin/new credit friendly' : 'Approval readiness', 'Structured workflow'],
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
    <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
      {prev ? (
        <button
          type="button"
          onClick={prev}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.09] text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-all"
        >
          <ArrowLeft size={14} /> Previous
        </button>
      ) : <div />}
      <Button onClick={onNext} disabled={nextDisabled} size="lg">
        {nextLabel}
      </Button>
    </div>
  );
}

export function SovereignIdentity({ next, data, update }: StepProps) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 01 // Identity</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Who are we building <br /> <span className="text-amber-500">results</span> for?
        </h2>
        <p className="text-white/45 text-lg font-light">
          This takes ~60 seconds. We’ll use your answers to recommend the safest lane and next step.
        </p>
      </div>
      <div className="relative max-w-xl group">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-transparent blur opacity-25 group-hover:opacity-50 transition duration-1000" />
        <input
          type="text"
          value={data.name || ''}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Full name"
          className="relative w-full bg-transparent border-b-2 border-white/10 py-6 text-2xl md:text-4xl font-light text-white placeholder:text-white/15 focus:outline-none focus:border-amber-500 transition-all duration-700"
        />
        <div className="absolute right-0 bottom-6 opacity-20 group-hover:opacity-100 transition-opacity">
          <Fingerprint size={48} strokeWidth={1} className="text-amber-500" />
        </div>
      </div>
      <StepNavFooter onNext={next} nextLabel="Continue" nextDisabled={!data.name} />
    </div>
  );
}

// --- STEP 2: ARCHITECTURAL INTENT ---
export function ArchitecturalIntent({ next, prev, data, update }: StepProps) {
  const goals = [
    {
      id: 'au_tradelines',
      title: 'AU Marketplace (Tradelines)',
      desc: 'Browse inventory for a fast profile boost and thickness.',
      icon: Trophy,
      goal: 'funding',
      lane: 'au_tradelines' as OnboardingLane,
    },
    {
      id: 'au_seller',
      title: 'AU Seller (Supply)',
      desc: 'Submit verified listings with proof artifacts. Get approved and start selling inventory.',
      icon: UploadCloud,
      goal: 'au_seller',
      lane: 'au_seller' as OnboardingLane,
    },
    {
      id: 'primary_tradeline',
      title: 'Primary Tradeline (Education‑First)',
      desc: 'In‑house financing used as a credit‑building installment tradeline path (education-first).',
      icon: ShieldCheck,
      goal: 'funding',
      lane: 'primary_tradeline' as OnboardingLane,
    },
    {
      id: 'debt_kill',
      title: 'Debt Kill (Debt & Legal)',
      desc: 'Validation, challenge packets, and workflow support for debt/collections.',
      icon: Gavel,
      goal: 'debt',
      lane: 'debt_kill' as OnboardingLane,
    },
    {
      id: 'business_credit',
      title: 'Business Credit',
      desc: 'Entity/fundability sequencing and corporate stacking.',
      icon: Building2,
      goal: 'business',
      lane: 'business_credit' as OnboardingLane,
    },
    {
      id: 'affiliate',
      title: 'Affiliate',
      desc: 'Refer partners, track conversions, and build recurring commissions.',
      icon: Target,
      goal: 'affiliate',
      lane: 'affiliate' as OnboardingLane,
    },
    {
      id: 'agent',
      title: 'Agent / Team',
      desc: 'Operate client files with workflows, tasks, and communications.',
      icon: Cpu,
      goal: 'agent',
      lane: 'agent' as OnboardingLane,
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 02 // Lane</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Choose your <span className="text-amber-500">lane</span>
        </h2>
        <p className="text-white/45 text-lg font-light max-w-2xl">
          Pick the outcome you want first. We’ll route you to the right experience (inventory, enlightenment session, or DFY execution).
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {goals.map((g) => {
          const GoalIcon = g.icon;
          return (
            <div
              key={g.id}
              onClick={() => {
                update({ goal: g.goal, lane: g.lane });
                next();
              }}
              className={`group cursor-pointer p-10 rounded-2xl border-t border-l border-white/10 border-b border-r border-black/50 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(245,158,11,0.15)] ${
                data.lane === g.lane ? 'border-amber-500/50 bg-amber-500/10' : 'hover:border-white/20'
              }`}
            >
              <GoalIcon 
                className={`mb-6 transition-all duration-500 ${
                  data.lane === g.lane ? 'text-amber-500 scale-110' : 'text-white/40 group-hover:text-white group-hover:scale-110'
                }`} 
                size={36} 
                strokeWidth={1} 
              />
              <h4 className="text-2xl font-light mb-2 text-white">{g.title}</h4>
              <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">{g.desc}</p>
            </div>
          );
        })}
      </div>
      <StepNavFooter prev={prev} onNext={next} nextLabel="Continue" />
    </div>
  );
}

// --- STEP 3: CONTACT + MAILING (letters auto-fill) ---
export function ContactAndMailing({ next, prev, data, update }: StepProps) {
  const [useMailing, setUseMailing] = useState<boolean>(Boolean((data.address1 || '').trim() || (data.city || '').trim()));
  const canContinue = Boolean((data.phone || '').trim()) && (!useMailing || Boolean((data.address1 || '').trim() && (data.city || '').trim() && (data.state || '').trim() && (data.postalCode || '').trim()));

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 03 // Contact + Mailing</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Add your <span className="text-amber-500">contact</span> + letter header details
        </h2>
        <p className="text-white/45 text-lg font-light max-w-2xl">
          This is used to auto-fill your letter header and keep your file operational (no missing name/address when generating PDFs).
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Phone (required)</div>
          <input
            value={data.phone || ''}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="(555) 555-5555"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
            inputMode="tel"
          />
          <div className="text-white/40 text-xs">We use this for workflow contact. It is not printed on mailed dispute letters unless you choose to include it later.</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Mailing address (recommended)</div>
            <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
              <input type="checkbox" checked={useMailing} onChange={(e) => setUseMailing(e.target.checked)} /> Capture address now
            </label>
          </div>

          {useMailing ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Address line 1</div>
                <input
                  value={data.address1 || ''}
                  onChange={(e) => update({ address1: e.target.value })}
                  placeholder="123 Main St"
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Address line 2 (optional)</div>
                <input
                  value={data.address2 || ''}
                  onChange={(e) => update({ address2: e.target.value })}
                  placeholder="Apt / Unit"
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">City</div>
                <input
                  value={data.city || ''}
                  onChange={(e) => update({ city: e.target.value })}
                  placeholder="City"
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">State</div>
                <input
                  value={data.state || ''}
                  onChange={(e) => update({ state: e.target.value.toUpperCase().slice(0, 2) })}
                  placeholder="TX"
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">ZIP / Postal</div>
                <input
                  value={data.postalCode || ''}
                  onChange={(e) => update({ postalCode: e.target.value.replace(/[^\d\-]/g, '').slice(0, 10) })}
                  placeholder="75001"
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                />
              </div>
              <div className="md:col-span-2 text-white/40 text-xs">
                This address is used for the letter header and for identity validation checks when you upload credit reports.
              </div>
            </div>
          ) : (
            <div className="text-white/45 text-sm">You can skip this for now and add it later, but letters may require it before export.</div>
          )}
        </div>
      </div>

      <StepNavFooter prev={prev} onNext={next} nextLabel="Continue" nextDisabled={!canContinue} />
    </div>
  );
}

// --- STEP 3: BUREAU SYNC ---
export function BureauSync({ next, prev }: { next: () => void; prev?: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
      setTimeout(next, 1000);
    }, 2500);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 03 // Credit monitoring (optional)</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Connect your <span className="text-amber-500">credit monitoring</span>
        </h2>
        <p className="text-white/45 text-lg font-light">
          Optional for now. This step will power “AI suggestions” later (report parsing + actionable next steps).
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
        {['IdentityIQ', 'SmartCredit', 'MyScoreIQ'].map(provider => (
          <div 
            key={provider} 
            onClick={!synced ? handleSync : undefined} 
            className={`group relative p-8 rounded-2xl border-t border-l border-white/10 border-b border-r border-black/50 transition-all duration-500 cursor-pointer hover:-translate-y-2 ${
              synced ? 'border-green-500/50 bg-green-500/10' : 'bg-white/[0.02] hover:bg-white/[0.05]'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <Server size={32} className={synced ? "text-green-500" : "text-white/40 group-hover:text-amber-500 transition-colors"} />
              {synced && <CheckCircle2 size={20} className="text-green-500" />}
            </div>
            <h4 className="text-xl font-light text-white mb-2">{provider}</h4>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{synced ? 'Connected' : 'Connect Account'}</p>
            {syncing && !synced && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm rounded-2xl">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ))}
      </div>

      <StepNavFooter prev={prev} onNext={next} nextLabel="Skip for now" />
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
          <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 04 // Business persona</p>
          <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
            Treat the business like its <span className="text-amber-500">own person</span>
          </h2>
          <p className="text-white/45 text-lg font-light max-w-2xl">
            Business credit is built on business identity + fundability signals. This creates a separate profile from your personal credit.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Business name</div>
            <input
              value={data.businessName || ''}
              onChange={(e) => update({ businessName: e.target.value })}
              placeholder="Acme Holdings LLC"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Entity state</div>
            <input
              value={data.entityState || ''}
              onChange={(e) => update({ entityState: e.target.value })}
              placeholder="CA"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <div className="text-white/40 text-xs">Where the entity is registered (SOS).</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-white/40">EIN last 4 (optional)</div>
            <input
              value={data.einLast4 || ''}
              onChange={(e) => update({ einLast4: e.target.value.replace(/[^\d]/g, '').slice(0, 4) })}
              placeholder="1234"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors font-mono tracking-wider"
              inputMode="numeric"
            />
            <div className="text-white/40 text-xs">We never need full EIN here.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-white/40">NAICS (optional)</div>
            <input
              value={data.naics || ''}
              onChange={(e) => update({ naics: e.target.value.replace(/[^\d]/g, '').slice(0, 6) })}
              placeholder="541611"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors font-mono tracking-wider"
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
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Terrain Audit // Fractures</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Locate the <span className="text-amber-500">Foundation Fractures.</span>
        </h2>
        <p className="text-white/40 text-lg font-light">Mark every derogatory asset currently limiting your borrowing power.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl">
        {issues.map((i) => {
          const FractureIcon = i.icon;
          const isActive = (data.fractures || []).includes(i.id);
          return (
            <div
              key={i.id}
              onClick={() => toggle(i.id)}
              className={`group cursor-pointer p-8 rounded-xl border-t border-l border-white/10 border-b border-r border-black/50 transition-all duration-500 flex flex-col items-center justify-center gap-4 hover:-translate-y-1 hover:shadow-lg ${
                isActive ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <FractureIcon className={isActive ? 'text-amber-500' : 'text-white/20 group-hover:text-white'} size={32} strokeWidth={1.5} />
              <span className={`text-xs font-black uppercase tracking-widest text-center ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>{i.label}</span>
            </div>
          );
        })}
      </div>
      <StepNavFooter prev={prev} onNext={next} nextLabel="Continue" nextDisabled={!(data.fractures?.length > 0)} />
    </div>
  );
}

// --- STEP 5: LIABILITY VOLUME ---
export function LiabilityVolume({ next, prev, data, update }: StepProps) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Assessment // Liability Volume</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Total <span className="text-amber-500">Derogatory Volume.</span>
        </h2>
        <p className="text-white/40 text-lg font-light">Estimate the aggregate dollar amount of items requiring vacation.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
        {[
          { id: 'low', label: 'Under $10,000', rate: 'Standard' },
          { id: 'mid', label: '$10k - $50k', rate: 'Institutional' },
          { id: 'high', label: '$50k - $1M+', rate: 'High Stakes' }
        ].map(opt => (
          <div
            key={opt.id}
            onClick={() => { update({ liabilityTier: opt.id }); next(); }}
            className={`p-10 rounded-2xl border-t border-l border-white/10 border-b border-r border-black/50 transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-2xl ${
              data.liabilityTier === opt.id ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'bg-white/[0.02] hover:bg-white/[0.05]'
            }`}
          >
            <p className="text-3xl font-light text-white mb-4">{opt.label}</p>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500/60">{opt.rate} Remediation</p>
          </div>
        ))}
      </div>
      <StepNavFooter prev={prev} onNext={next} nextLabel="Continue" />
    </div>
  );
}

// --- STEP 6: LANDSCAPE AUDIT (SCORE SLIDER) ---
export function LandscapeAudit({ next, prev, data, update }: StepProps) {
  const score = data.score || 550;
  const percentage = ((score - 300) / 550) * 100;

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 06 // Terrain</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Current <span className="text-amber-500">Structural Integrity.</span>
        </h2>
        <p className="text-white/40 text-lg font-light max-w-xl">Move the slider to indicate your estimated score threshold.</p>
      </div>
      
      <div className="py-24 max-w-2xl relative">
        <div className="h-3 w-full bg-black/50 rounded-full relative border-b border-white/10 shadow-inner overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 rounded-full relative transition-all duration-300"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
          </div>
        </div>
        <input
          type="range"
          min="300"
          max="850"
          step="10"
          value={score}
          onChange={(e) => update({ score: parseInt(e.target.value) })}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-[-70px] -translate-x-1/2 px-6 py-4 bg-[#1a1a1a] border border-white/10 rounded-xl flex flex-col items-center justify-center shadow-2xl pointer-events-none transition-all duration-100 ease-out"
          style={{ left: `${percentage}%` }}
        >
          <span className="text-3xl font-bold text-white tabular-nums">{score}</span>
          <span className="text-[8px] text-white/40 uppercase tracking-widest mt-1">
            {score < 580 ? 'Sub-Prime' : score < 670 ? 'Fair' : score < 740 ? 'Good' : 'Excellent'}
          </span>
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a1a] border-b border-r border-white/10 rotate-45" />
        </div>
        <div className="flex justify-between mt-8 text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
          <span>Sub-Prime (300)</span>
          <span>Prime (850)</span>
        </div>
      </div>
      
      <StepNavFooter prev={prev} onNext={next} nextLabel="Analyze Structural Depth" />
    </div>
  );
}

// --- STEP 7: FINANCIAL VELOCITY ---
export function FinancialVelocity({ next, prev, data, update }: StepProps) {
  const target = data.target || 50000;
  const percentage = (target / 1000000) * 100;

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Step 07 // Velocity</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Target <span className="text-amber-500">Asset Liquidity.</span>
        </h2>
        <p className="text-white/40 text-lg font-light max-w-xl">Define the capital requirement for your next wealth deployment.</p>
      </div>
      
      <div className="py-24 max-w-2xl relative">
        <div className="h-3 w-full bg-black/50 rounded-full relative border-b border-white/10 shadow-inner overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-900 to-emerald-400 rounded-full relative transition-all duration-300"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
          </div>
        </div>
        <input
          type="range"
          min="10000"
          max="1000000"
          step="10000"
          value={target}
          onChange={(e) => update({ target: parseInt(e.target.value) })}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-[-70px] -translate-x-1/2 px-6 py-4 bg-[#1a1a1a] border border-emerald-500/30 rounded-xl flex flex-col items-center justify-center shadow-2xl pointer-events-none transition-all duration-100 ease-out"
          style={{ left: `${percentage}%` }}
        >
          <span className="text-2xl font-bold text-emerald-400 tabular-nums">${target.toLocaleString()}</span>
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a1a] border-b border-r border-emerald-500/30 rotate-45" />
        </div>
        <div className="flex justify-between mt-8 text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
          <span>$10,000</span>
          <span>$1,000,000</span>
        </div>
      </div>
      
      <StepNavFooter prev={prev} onNext={next} nextLabel="Validate Liquidity Vector" />
    </div>
  );
}

// --- STEP 8: STRATEGIC URGENCY ---
export function StrategicUrgency({ next, prev, data, update }: StepProps) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-[0.6em] text-amber-500 uppercase">Deployment // Urgency</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Restoration <span className="text-amber-500">Timeline.</span>
        </h2>
        <p className="text-white/40 text-lg font-light">How rapidly do you require the vacation of liabilities for funding?</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
        {[
          { id: 'rapid', label: 'ASAP', desc: 'Critical funding window closing.', icon: FastForward },
          { id: 'planned', label: '30-60 Days', desc: 'Strategic scaling phase.', icon: Target },
          { id: 'build', label: 'Long Term', desc: 'Total foundational overhaul.', icon: Building2 }
        ].map(opt => {
          const UrgencyIcon = opt.icon;
          return (
            <div
              key={opt.id}
              onClick={() => { update({ urgency: opt.id }); next(); }}
              className={`p-10 rounded-2xl border-t border-l border-white/10 border-b border-r border-black/50 transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-2xl ${
                data.urgency === opt.id ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <UrgencyIcon className={`mb-6 transition-colors ${data.urgency === opt.id ? 'text-amber-500' : 'text-white/40'}`} size={36} />
              <p className="text-2xl font-light text-white mb-2">{opt.label}</p>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{opt.desc}</p>
            </div>
          );
        })}
      </div>
      <StepNavFooter prev={prev} onNext={next} nextLabel="Continue" />
    </div>
  );
}

// --- STEP 9: STATUTORY SCAN ---
export function StatutoryScan({ next, prev }: { next: () => void; prev?: () => void }) {
  const [progress, setProgress] = useState(0);
  const logs = [
    "Initializing Statutory Engine...",
    "Scanning FCRA § 611 Compliance...",
    "Cross-referencing FDCPA § 807 Violations...",
    "Identifying Reporting Fragments...",
    "Calibrating Wealth Projection..."
  ];
  const [logIdx, setLogIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(next, 1000);
          return 100;
        }
        return p + 1;
      });
    }, 40);

    const logTimer = setInterval(() => {
      setLogIdx(i => (i + 1) % logs.length);
    }, 800);

    return () => { clearInterval(timer); clearInterval(logTimer); };
  }, [next, logs.length]);

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-12 animate-in fade-in duration-1000 min-h-[60vh]">
      <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-white/5 animate-ping" />
        <div className="absolute inset-4 rounded-full border border-amber-500/20 animate-pulse" />
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
          <Cpu className="text-amber-500 animate-pulse" size={64} strokeWidth={1} />
          <p className="text-4xl font-light tabular-nums text-white">{progress}%</p>
        </div>
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="48%"
            fill="none"
            stroke="rgba(245, 158, 11, 0.3)"
            strokeWidth="4"
          />
          <circle
            cx="50%"
            cy="50%"
            r="48%"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${progress * 3.02} 302`}
            className="transition-all duration-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
          />
        </svg>
      </div>
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-light text-white tracking-widest uppercase">AI Statutory Calibration</h2>
        <p className="text-amber-500/60 font-mono text-xs tracking-[0.3em] uppercase h-4">{logs[logIdx]}</p>
      </div>
      <StepNavFooter prev={prev} onNext={next} nextLabel="Skip scan" />
    </div>
  );
}

// --- STEP 10: RECOMMENDATION (RESULTS + NEXT ACTION) ---
export function BlueprintRecommendation({ next, prev, data, update }: StepProps) {
  const rec = useMemo(() => {
    return recommendNext({
      lane: (data.lane || 'other') as OnboardingLane,
      score: typeof data.score === 'number' ? data.score : 550,
      goal: data.goal,
      fractures: data.fractures,
      liabilityTier: data.liabilityTier,
      urgency: data.urgency,
      selectedPackageId: data.selectedPackageId || undefined,
      selectedRail: data.selectedRail || undefined,
    });
  }, [data.fractures, data.goal, data.lane, data.liabilityTier, data.score, data.selectedPackageId, data.selectedRail, data.urgency]);

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
    <div className="space-y-10 animate-in fade-in slide-in-from-top-8 duration-700 text-left">
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-[0.55em] text-amber-500 uppercase">Recommendation</p>
        <h2 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
          Your next step is <span className="text-amber-500">clear.</span>
        </h2>
        <p className="text-white/55 text-lg font-light max-w-2xl">
          We use your intake to route you to the safest lane. No hype — just a clean, results-driven plan.
        </p>
      </div>

      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-7 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-white font-semibold text-xl">{rec.headline}</div>
            <div className="text-white/70 text-sm leading-relaxed max-w-2xl">{rec.reason}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(rec.pills || []).slice(0, 4).map((p: string) => (
              <span
                key={p}
                className="px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-[10px] font-black uppercase tracking-widest text-white/70"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {(selectedPackage || recommendedPackage) && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">
              {selectedPackage ? 'Selected package' : 'Suggested package'}
            </div>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-white font-semibold">{(selectedPackage || recommendedPackage)!.name}</div>
                <div className="text-white/60 text-sm">{(selectedPackage || recommendedPackage)!.tagline}</div>
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
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
          >
            Create account first <ArrowLeft size={14} className="rotate-180" />
          </button>
        </div>

        <p className="text-white/40 text-xs leading-relaxed">
          You’ll create your account next. After signup, we’ll automatically route you to this recommended lane.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-2">
          <div className="text-white font-semibold">Prefer to browse AU inventory?</div>
          <div className="text-white/60 text-sm">Browse and secure a seat — then checkout.</div>
          <button
            onClick={() => setPathAndContinue('/tradelines?focus=au')}
            className="inline-flex items-center gap-2 text-amber-300 text-sm font-semibold hover:text-amber-200 transition-colors"
          >
            Browse AU marketplace <ArrowLeft size={14} className="rotate-180" />
          </button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-2">
          <div className="text-white font-semibold">Need a strategist?</div>
          <div className="text-white/60 text-sm">Book a free enlightenment session and we’ll match you to the safest lane.</div>
          <button
            onClick={() => setPathAndContinue(`/consultation?lane=${encodeURIComponent('Other')}`)}
            className="inline-flex items-center gap-2 text-amber-300 text-sm font-semibold hover:text-amber-200 transition-colors"
          >
            Book a free enlightenment session <ArrowLeft size={14} className="rotate-180" />
          </button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-2">
          <div className="text-white font-semibold">Want to compare pricing?</div>
          <div className="text-white/60 text-sm">See DIY vs DFY options by category.</div>
          <button
            onClick={() => setPathAndContinue('/pricing')}
            className="inline-flex items-center gap-2 text-amber-300 text-sm font-semibold hover:text-amber-200 transition-colors"
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
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.09] text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-all"
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
        <Lock size={64} className="text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
      </div>
      <h2 className="text-4xl font-light text-white leading-tight">
        Initialize the <br /> <span className="text-amber-500">Secure Vault.</span>
      </h2>

      {!isConfigured && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left">
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Supabase is not configured yet. Add <span className="font-mono">VITE_SUPABASE_URL</span> and <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> to your <span className="font-mono">.env.local</span> (see <span className="font-mono">.env.example</span>).
          </p>
        </div>
      )}

      <div className="space-y-4 text-left">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Account Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            className="w-full bg-white/5 border border-white/10 p-5 rounded-lg focus:border-amber-500 focus:outline-none text-white font-mono tracking-wider text-sm shadow-inner transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Vault Access Key</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full bg-white/5 border border-white/10 p-5 rounded-lg focus:border-amber-500 focus:outline-none text-white font-mono tracking-wider text-sm shadow-inner transition-colors"
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
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.09] text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-all"
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

export function SovereignPortal({ isOpen, onClose, onComplete }: SovereignPortalProps) {
  const auth = useAuth();
  const location = useLocation();
  const [authMode, setAuthMode] = useState<'select' | 'login' | 'signup'>('select');
  const [step, setStep] = useState(1);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    goal: '',
    lane: 'other' as OnboardingLane,
    // Business persona (captured when lane === business_credit)
    businessName: '',
    entityState: '',
    einLast4: '',
    naics: '',
    fractures: [] as string[],
    liabilityTier: '',
    score: 550,
    target: 50000,
    urgency: '',
    selectedPackageId: '' as string,
    selectedRail: '' as '' | 'stripe' | 'in_house',
    recommendedNextPath: '' as string,
    recommendedHeadline: '' as string,
    recommendedReason: '' as string,
  });

  const ONBOARDING_STORAGE_KEY = 'finely.onboarding.v1';
  const TOTAL_STEPS = 12;

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { userData?: any; step?: number; authMode?: 'select' | 'login' | 'signup' };
      if (parsed?.userData) setUserData((prev) => ({ ...prev, ...parsed.userData }));
      if (typeof parsed?.step === 'number') setStep(Math.min(Math.max(1, parsed.step), TOTAL_STEPS));
      if (parsed?.authMode) setAuthMode(parsed.authMode);
    } catch {
      // ignore
    }
  }, [isOpen]);

  // URL-driven onboarding context (e.g., /onboarding?package=personal_restore&rail=in_house)
  useEffect(() => {
    if (!isOpen) return;
    const sp = new URLSearchParams(location.search);
    const authParam = (sp.get('auth') || sp.get('mode') || '').toLowerCase();
    const packageId = sp.get('package');
    const rail = sp.get('rail') as 'stripe' | 'in_house' | null;
    const lane = sp.get('lane');
    const nextRaw = sp.get('next');

    // Direct routes + query-driven mode
    if (location.pathname === '/login') setAuthMode('login');
    if (location.pathname === '/signup') setAuthMode('signup');
    if (authParam === 'login' || authParam === 'signin') setAuthMode('login');
    if (authParam === 'signup' || authParam === 'register') setAuthMode('signup');

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

    if (lane) {
      const l = safeDecode(lane).toLowerCase();
      const mapped: OnboardingLane =
        l.includes('seller')
          ? 'au_seller'
          :
        l.includes('au')
          ? 'au_tradelines'
          : l.includes('primary')
            ? 'primary_tradeline'
            : l.includes('debt')
              ? 'debt_kill'
              : l.includes('business')
                ? 'business_credit'
                : l.includes('affiliate')
                  ? 'affiliate'
                  : l.includes('agent')
                    ? 'agent'
                    : 'other';
      setUserData((prev) => ({
        ...prev,
        lane: mapped,
        goal:
          prev.goal ||
          (mapped === 'debt_kill'
            ? 'debt'
            : mapped === 'business_credit'
              ? 'business'
              : mapped === 'au_seller'
                ? 'au_seller'
              : mapped === 'affiliate'
                ? 'affiliate'
                : mapped === 'agent'
                  ? 'agent'
                  : 'funding'),
      }));
    }
  }, [isOpen, location.search]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ userData, step, authMode }));
    } catch {
      // ignore
    }
  }, [authMode, isOpen, step, userData]);

  const updateData = (newData: Partial<typeof userData>) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (step >= TOTAL_STEPS) return;
    setStep(s => s + 1);
  };

  const prevStep = () => {
    if (step <= 1) return;
    setStep(s => s - 1);
  };

  const handleLogin = async () => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      const res = await auth.signInWithEmail({ email: loginEmail, password: loginPassword });
      if (res.error) {
        setAuthError(res.error);
        return;
      }
      onComplete(userData.recommendedNextPath || undefined);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignup = async (email: string, password: string) => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      const res = await auth.signUpWithEmail({
        email,
        password,
        metadata: {
          name: userData.name,
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
          score: userData.score,
          target: userData.target,
          urgency: userData.urgency,
          selectedPackageId: userData.selectedPackageId,
          selectedRail: userData.selectedRail,
          recommendedNextPath: userData.recommendedNextPath,
          recommendedHeadline: userData.recommendedHeadline,
          recommendedReason: userData.recommendedReason,
        },
      });

      if (res.error) {
        setAuthError(res.error);
        return;
      }

      // If email confirmations are enabled, the session may not be available immediately.
      // In that case, we keep the user in the portal with a clear message.
      if (!auth.user) {
        setAuthError('Account created. Please check your email to confirm, then return and log in.');
        setAuthMode('login');
        setLoginEmail(email);
        setLoginPassword('');
        return;
      }

      onComplete(userData.recommendedNextPath || undefined);
    } finally {
      setAuthBusy(false);
    }
  };

  if (!isOpen) return null;

  // Initial Selection Screen
  if (authMode === 'select') {
    const tenant = getActiveTenant();
    const brand = (tenant.settings.brandName || tenant.name || 'Finely Cred').trim() || 'Finely Cred';

    return (
      <div className="fixed inset-0 z-[100] bg-[#0b1110]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500">
        <div className="max-w-6xl w-full grid md:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-10 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute -top-24 left-1/2 -translate-x-1/2 w-[920px] h-[420px] blur-3xl opacity-35"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(var(--brand-primary-rgb),0.22) 0%, transparent 62%)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/20" />
            </div>

            <div className="relative">
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">{brand} • Access</div>
              <h2 className="mt-4 text-4xl md:text-5xl font-light text-white leading-tight">
                Your file, organized like an operator.
              </h2>
              <p className="mt-4 text-white/60 text-sm md:text-base leading-relaxed max-w-2xl">
                Create your account, complete the blueprint intake, and land straight in your dashboard with next steps,
                dispute candidates, evidence, and letters—sequenced so you always know what to do next.
              </p>

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                {[
                  { icon: Target, t: 'Guided next actions', d: 'Now / Next / Later with a real sequence.' },
                  { icon: UploadCloud, t: 'Upload → Intel', d: 'Reports parse into evidence + disputes.' },
                  { icon: Gavel, t: 'Letters Command Center', d: 'Edit, preview, attach evidence, export.' },
                  { icon: ShieldCheck, t: 'Secure by design', d: 'No secrets in the browser for integrations.' },
                ].map((x) => (
                  <div key={x.t} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center">
                        <x.icon size={16} className="text-[color:var(--brand-primary)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-semibold">{x.t}</div>
                        <div className="mt-1 text-white/60 text-sm">{x.d}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/55">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-black/20">
                  <Clock size={14} className="text-white/60" /> ~2 minutes
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-black/20">
                  <Lock size={14} className="text-white/60" /> Private by default
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-black/20">
                  <CheckCircle2 size={14} className="text-emerald-300" /> Instant dashboard access
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div
              onClick={() => setAuthMode('signup')}
              className="group cursor-pointer p-8 rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-500 flex flex-col items-center text-center gap-5"
            >
              <div
                className="w-18 h-18 w-20 h-20 rounded-2xl flex items-center justify-center border border-white/15 group-hover:scale-110 transition-transform"
                style={{
                  background:
                    'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.92) 0%, rgba(245,245,245,0.86) 22%, rgba(210,210,210,0.86) 55%, rgba(168,169,173,0.90) 100%)',
                }}
              >
                <Fingerprint size={38} className="text-[#0b1110]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-light text-white">Create account</h3>
                <p className="text-sm text-white/55">
                  Complete the intake, get a recommended path, and enter the dashboard.
                </p>
              </div>
              <div className="pt-1 w-full">
                <div className="w-full fc-button-brand">Start blueprint</div>
              </div>
            </div>

            <div
              onClick={() => setAuthMode('login')}
              className="group cursor-pointer p-8 rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-500 flex flex-col items-center text-center gap-5"
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center border border-white/15 group-hover:scale-110 transition-transform"
                style={{
                  background:
                    'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.92) 0%, rgba(245,245,245,0.86) 22%, rgba(210,210,210,0.86) 55%, rgba(168,169,173,0.90) 100%)',
                }}
              >
                <Key size={38} className="text-[#0b1110]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-light text-white">Sign in</h3>
                <p className="text-sm text-white/55">Return to your dashboard, documents, and workflows.</p>
              </div>
              <div className="pt-1 w-full">
                <div className="w-full fc-button-brand">Open dashboard</div>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="mt-12 text-white/40 hover:text-white uppercase tracking-widest text-xs flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={14} /> Back to website
        </button>
      </div>
    );
  }

  // Login Screen
  if (authMode === 'login') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0f0d] flex items-center justify-center p-6 animate-in slide-in-from-bottom duration-500">
        <div className="max-w-md w-full p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-60" />
          <div className="text-center space-y-6 mb-8">
            <div
              className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border border-white/15"
              style={{
                background:
                  'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.92) 0%, rgba(245,245,245,0.86) 22%, rgba(210,210,210,0.86) 55%, rgba(168,169,173,0.90) 100%)',
              }}
            >
              <Key size={24} className="text-[#0b1110]" />
            </div>
            <h3 className="text-3xl font-light text-white">Sign in</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Node ID / Email</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/85 placeholder:text-white/30 focus:outline-none focus:border-white/35 transition-colors" 
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Secure Token</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/85 placeholder:text-white/30 focus:outline-none focus:border-white/35 transition-colors" 
              />
            </div>
            {!auth.isConfigured && auth.isDevAuthEnabled && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left">
                <p className="text-[10px] text-amber-200/90 uppercase tracking-widest font-bold">
                  Dev Auth Enabled (Local Only)
                </p>
                <p className="text-xs text-amber-200/70 mt-1">
                  Supabase isn’t configured yet—login will still work for testing. This does not create real accounts.
                </p>
              </div>
            )}
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-left">
                <p className="text-xs text-red-200/90">{authError}</p>
              </div>
            )}
            <Button
              onClick={handleLogin}
              disabled={authBusy || !loginEmail || !loginPassword}
              size="lg"
              className="w-full"
            >
              {authBusy ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
          <button 
            onClick={() => setAuthMode('select')} 
            className="w-full mt-6 text-center text-white/20 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
          >
            Cancel Access Request
          </button>
          <button
            onClick={() => {
              setAuthError(null);
              setAuthMode('signup');
            }}
            className="w-full mt-3 text-center text-white/40 hover:text-amber-300 text-[10px] uppercase tracking-widest transition-colors"
          >
            Need an account? Create one
          </button>
        </div>
      </div>
    );
  }

  // Signup Wizard
  return (
    <div className="fixed inset-0 z-[100] bg-[#0b1110] overflow-y-auto flex flex-col relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[-20%] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-56 right-[-25%] h-[680px] w-[680px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent" />
      </div>
      {/* Header */}
      <div className="sticky top-0 bg-black/40 backdrop-blur-2xl border-b border-white/5 px-6 md:px-12 py-4 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={16} /> Exit Blueprint
          </button>
          <div className="flex-1 max-w-md mx-8">
            <ProgressBar current={step} total={TOTAL_STEPS} />
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="max-w-6xl mx-auto mt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              setAuthError(null);
              setAuthMode('login');
            }}
            className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            title="Already have an account?"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 container mx-auto px-6 md:px-12 py-12 md:py-24">
        <div className="max-w-4xl mx-auto">
          {step === 1 && <SovereignIdentity next={nextStep} data={userData} update={updateData} />}
          {step === 2 && <ArchitecturalIntent next={nextStep} prev={prevStep} data={userData} update={updateData} />}
          {step === 3 && <ContactAndMailing next={nextStep} prev={prevStep} data={userData} update={updateData} />}
          {step === 4 && <BureauSync next={nextStep} prev={prevStep} />}
          {step === 5 && <FoundationalFractures next={nextStep} prev={prevStep} data={userData} update={updateData} />}
          {step === 6 && <LiabilityVolume next={nextStep} prev={prevStep} data={userData} update={updateData} />}
          {step === 7 && <LandscapeAudit next={nextStep} prev={prevStep} data={userData} update={updateData} />}
          {step === 8 && <FinancialVelocity next={nextStep} prev={prevStep} data={userData} update={updateData} />}
          {step === 9 && <StrategicUrgency next={nextStep} prev={prevStep} data={userData} update={updateData} />}
          {step === 10 && <StatutoryScan next={nextStep} prev={prevStep} />}
          {step === 11 && <BlueprintRecommendation next={nextStep} prev={prevStep} data={userData} update={updateData} />}
          {step === 12 && (
            <CredentialCreation
              onSubmit={handleSignup}
              onPrev={prevStep}
              isBusy={authBusy}
              error={authError}
              isConfigured={auth.isConfigured}
            />
          )}
        </div>
      </div>
    </div>
  );
}
