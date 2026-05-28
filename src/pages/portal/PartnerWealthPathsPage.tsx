import React, { useMemo } from 'react';
import { ArrowRight, Lock, Sparkles, Crown, Building2, Landmark, BriefcaseBusiness } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { hasEntitlement } from '../../data/billingRepo';
import { getFeatureFlags } from '../../data/settingsRepo';

type Lane = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  entitlementKey?: string;
  icon: React.ReactNode;
};

const LANES: Lane[] = [
  {
    id: 'lane_funding_readiness',
    title: 'Funding Readiness',
    subtitle: 'Blueprint → scorecard → execution',
    description:
      'Structured readiness milestones, lender-facing packaging, and execution checklists.',
    entitlementKey: 'wealth_paths_access',
    icon: <Sparkles size={18} className="text-emerald-400" />,
  },
  {
    id: 'lane_business_credit',
    title: 'Business Credit Build',
    subtitle: 'Vendor sequencing + fundability',
    description:
      'Corporate credit build steps, vendor sequencing, compliance, and reporting milestones.',
    entitlementKey: 'wealth_builder_dfy',
    icon: <Building2 size={18} className="text-amber-400" />,
  },
  {
    id: 'lane_capital_deployment',
    title: 'Capital Deployment',
    subtitle: 'Where wealth paths begin',
    description:
      'Plan and deploy funding into wealth-building vehicles with structured guardrails.',
    entitlementKey: 'wealth_paths_premium',
    icon: <Landmark size={18} className="text-sky-400" />,
  },
  {
    id: 'lane_nora_capital',
    title: 'Nora Capital Group (Connected Path)',
    subtitle: 'Funding applications + accelerator',
    description:
      'Future: connect to Nora Capital Group for funding applications and wealth accelerator workflows via API.',
    entitlementKey: 'wealth_paths_premium',
    icon: <BriefcaseBusiness size={18} className="text-violet-300" />,
  },
];

export default function PartnerWealthPathsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const features = getFeatureFlags();

  const hasAnyAccess = useMemo(() => {
    if (!partner) return false;
    return hasEntitlement(partner.id, 'wealth_paths_access') || hasEntitlement(partner.id, 'wealth_paths_premium');
  }, [partner]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Wealth Paths"
      subtitle="Lane-based programs that unlock after your build. This is where credit becomes capital."
    >
      <div className="space-y-6">
        {!features.wealthPaths && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-white/80">
            <div className="flex items-center gap-2 text-amber-300">
              <Lock size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Module gated</span>
            </div>
            <div className="mt-2 text-white/70 text-sm">
              Wealth Paths are currently disabled in settings. Enable them in{' '}
              <span className="font-mono text-white/80">/admin/settings</span> → Features.
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <Crown size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider">Wealth Builder</span>
              </div>
              <div className="text-white/70 text-sm max-w-2xl">
                Your Wealth Paths unlock based on your program. Start with Wealth Builder DIY/DFY, then unlock premium lanes
                (including Nora Capital Group connection) in the Advanced Wealth Builder.
              </div>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              View Wealth Builder pricing <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {LANES.map((lane) => {
            const locked = (() => {
              if (!partner) return false;
              if (!lane.entitlementKey) return false;
              return !hasEntitlement(partner.id, lane.entitlementKey);
            })();
            return (
              <div
                key={lane.id}
                className={`rounded-2xl border p-6 transition-all ${
                  locked ? 'border-white/10 bg-black/30 opacity-80' : 'border-emerald-500/20 bg-emerald-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      {lane.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="text-white font-semibold">{lane.title}</div>
                      <div className="text-white/60 text-sm">{lane.subtitle}</div>
                    </div>
                  </div>
                  {locked && (
                    <div className="inline-flex items-center gap-2 text-white/50 text-xs">
                      <Lock size={14} />
                      Locked
                    </div>
                  )}
                </div>

                <p className="mt-4 text-white/60 text-sm leading-relaxed">{lane.description}</p>

                <div className="mt-5">
                  {locked ? (
                    <button
                      onClick={() => navigate('/pricing')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold uppercase tracking-widest text-[10px] transition-all"
                    >
                      Unlock with Wealth Builder <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/portal/dashboard')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
                      Open lane <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {features.wealthPaths && !hasAnyAccess && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/70 text-sm">
            You don’t have access to Wealth Paths yet. Choose a Wealth Builder program to unlock lanes.
          </div>
        )}
      </div>
    </PageShell>
  );
}

