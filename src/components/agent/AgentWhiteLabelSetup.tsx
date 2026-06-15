import React from 'react';
import { CheckCircle2, Crown, Globe, Palette, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AgencyTier } from '../../config/pricingCatalog';
import { getAgencyTierById } from '../../config/pricingCatalog';
import { CS } from '../../config/creditSpecialistProgram';
import { AgencySplitBreakdown } from '../pricing/AgencySplitBreakdown';

const WHITE_LABEL_STEPS: Record<
  NonNullable<AgencyTier['whiteLabelLevel']>,
  { title: string; items: string[]; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  finely_branded: {
    title: 'Finely-branded workspace',
    icon: Shield,
    items: [
      'Complete apprenticeship modules in Specialist Hub',
      'Run 3 practice files with mentor review',
      'Use Finely lead magnets & Comms templates as-is',
      'Graduate to Guided tier when ready for co-branding',
    ],
  },
  co_branded: {
    title: 'Co-branded portal setup',
    icon: Palette,
    items: [
      'Upload logo + brand colors in Tenants settings',
      'Enable co-branded client portal emails',
      'Connect your domain CNAME (optional subpath)',
      'Launch co-branded lead magnet funnel',
    ],
  },
  white_label: {
    title: 'White-label Pro launch',
    icon: Crown,
    items: [
      'Create agency workspace with full white-label theme',
      'Map custom domain to client portal',
      'Configure Comms Studio from-address + DNS',
      'Publish paid ebooks & products under your brand',
      'Assign team seats and client routing rules',
    ],
  },
  enterprise_white_label: {
    title: 'Enterprise white-label program',
    icon: Globe,
    items: [
      'Book enterprise onboarding for custom split agreement',
      'Dedicated infrastructure + SLA provisioning',
      'Custom domain, API keys, and webhook governance',
      'Multi-seat org with regional agent training pods',
      'Quarterly strategy reviews + certification for your trainers',
    ],
  },
};

export function AgentWhiteLabelSetup({ capacityTierId }: { capacityTierId: string }) {
  const navigate = useNavigate();
  const tier = getAgencyTierById(capacityTierId);
  const level = tier?.whiteLabelLevel ?? 'finely_branded';
  const config = WHITE_LABEL_STEPS[level];
  const Icon = config.icon;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-400">
            <Icon size={18} />
            <span className="text-sm font-semibold text-white">{config.title}</span>
          </div>
          <p className="mt-2 text-white/55 text-sm max-w-2xl">
            {tier?.name ?? 'Specialist tier'} — {tier?.description}
          </p>
          {tier && (tier.splitBreakdown?.length || tier.platformShareMinPct != null) ? (
            <div className="mt-3">
              <AgencySplitBreakdown tier={tier} variant="compact" />
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => navigate(`/agency/signup?tier=${encodeURIComponent(capacityTierId)}`)}
          className="px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110"
        >
          {level === 'enterprise_white_label' ? 'Book enterprise' : 'Create workspace'}
        </button>
      </div>
      <ul className="grid md:grid-cols-2 gap-2">
        {config.items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-white/70">
            <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      {(level === 'white_label' || level === 'enterprise_white_label') && (
        <div className="flex flex-wrap gap-2 pt-2">
          <button type="button" onClick={() => navigate('/admin/settings?tab=site')} className="px-3 py-2 rounded-xl border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-white/60">
            Branding settings
          </button>
          <button type="button" onClick={() => navigate('/admin/comms')} className="px-3 py-2 rounded-xl border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-white/60">
            Comms Studio
          </button>
        </div>
      )}
    </div>
  );
}
