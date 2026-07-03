import React, { useMemo } from 'react';
import { ArrowRight, Building2, Crown, Layers, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import { BUSINESS_ROADMAP_STEPS } from '../../domain/businessCredit';
import { getBusinessCreditProfile, listBusinessScoreSnapshots } from '../../data/businessCreditRepo';
import { evaluateFoundationSteps } from '../../lib/businessVendorSequencing';
import { buildPartnerFundingReadiness } from '../../lib/partnerFundingReadiness';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partner: Partner | null;
};

export function BusinessCreditWorkspaceHero({ partner }: Props) {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (!partner) return null;
    const profile = getBusinessCreditProfile(partner.id);
    const roadmapDone = BUSINESS_ROADMAP_STEPS.filter((s) => profile.roadmap?.[s.id]?.done).length;
    const roadmapPct = Math.round((roadmapDone / BUSINESS_ROADMAP_STEPS.length) * 100);
    const foundation = evaluateFoundationSteps({
      business: (partner.routes as { business_build?: { business?: Record<string, unknown> } })?.business_build?.business,
      partnerId: partner.id,
    });
    const scores = listBusinessScoreSnapshots(partner.id);
    const latestScore = scores[0]?.scoreValue;
    const funding = buildPartnerFundingReadiness(partner);
    return { roadmapDone, roadmapPct, foundation, latestScore, funding, vendorTier: profile.roadmap?.vendor_tier1?.done ? 'Tier 1+' : 'Pre-tier' };
  }, [partner]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-950/80 via-[#0c1018] to-violet-950/60 p-6 sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_50%)]" />
      <div className="relative grid lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-300/90`}>Business Credit Command Center</div>
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            Build fundability with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
              sequencing, not luck
            </span>
          </h2>
          <p className={`text-sm sm:text-base max-w-xl ${FINELY_OS_ENTITY_BODY}`}>
            Entity hygiene → reporting vendors → bureau scores → lender logic → capital package.
            Every module in this portal connects to the same fundability story.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/business/profile')} className={FINELY_OS_PRIMARY_BTN}>
              Complete profile <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/business/vendors')} className="py-2.5 px-4 rounded-xl border border-white/20 bg-white/5 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10">
              Vendor center
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          {[
            {
              icon: Layers,
              label: 'Roadmap',
              value: stats ? `${stats.roadmapPct}%` : '—',
              hint: stats ? `${stats.roadmapDone}/${BUSINESS_ROADMAP_STEPS.length} steps` : 'Sign in',
              accent: 'amber',
            },
            {
              icon: Building2,
              label: 'Foundation',
              value: stats ? `${stats.foundation.percent}%` : '—',
              hint: stats?.foundation.complete ? 'Entity ready' : 'Entity signals',
              accent: 'emerald',
            },
            {
              icon: TrendingUp,
              label: 'Biz score',
              value: stats?.latestScore != null ? String(stats.latestScore) : '—',
              hint: 'Latest snapshot',
              accent: 'sky',
            },
            {
              icon: Crown,
              label: 'Vendor stack',
              value: stats?.vendorTier ?? '—',
              hint: 'Reporting depth',
              accent: 'violet',
            },
          ].map(({ icon: Icon, label, value, hint, accent }) => (
            <div key={label} className={`${finelyOsCatalogCard(accent as 'amber')} !p-4 backdrop-blur-sm`} data-fc-accent={accent}>
              <Icon size={16} className="text-amber-400 mb-2" />
              <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>{label}</div>
              <div className={`text-xl font-black mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{value}</div>
              <div className={`text-[10px] mt-1 ${FINELY_OS_ENTITY_BODY}`}>{hint}</div>
            </div>
          ))}
        </div>
      </div>

      {stats?.funding?.blockers?.[0] ? (
        <div className="relative mt-4 flex items-start gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <Sparkles size={16} className="text-amber-300 shrink-0 mt-0.5" />
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            <span className="font-bold text-amber-200">Next priority:</span> {stats.funding.blockers[0]}
          </p>
        </div>
      ) : null}
    </div>
  );
}
