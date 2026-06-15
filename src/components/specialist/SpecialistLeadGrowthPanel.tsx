import React, { useMemo } from 'react';
import { ArrowRight, BookOpen, Megaphone, PenLine, Target, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AgentOperatingModel } from '../../domain/agentProgram';
import { computeAgentRevenueSplit } from '../../domain/agentProgram';
import { getAgencyTierById } from '../../config/pricingCatalog';
import { CS } from '../../config/creditSpecialistProgram';
import { DENEFITS, DENEFITS_SPECIALIST_COPY } from '../../config/denefitsProgram';
import { formatUsdFromCents, computeDenefitsContractProjection } from '../../domain/partnerEconomics';
import { RolePromoLinksPanel } from '../promotions/RolePromoLinksPanel';

type Props = {
  model: AgentOperatingModel;
};

export function SpecialistLeadGrowthPanel({ model }: Props) {
  const navigate = useNavigate();
  const split = computeAgentRevenueSplit(model);
  const tier = getAgencyTierById(model.capacityTierId);
  const leadIntelPerformer = model.levers.lead_intelligence ?? 'platform';

  const denefitsPreview = useMemo(
    () =>
      computeDenefitsContractProjection({
        contractValueCents: DENEFITS.exampleContractValue * 100,
        termMonths: DENEFITS.exampleTermYears * 12,
        monthlyPaymentCents: DENEFITS.exampleMonthlyPayment * 100,
        specialistSharePct: DENEFITS.defaultSpecialistSharePct,
      }),
    [],
  );

  const pitchCards = [
    {
      title: 'Service fee split',
      value: `${split.agentSharePct}% keep`,
      sub: `${split.phaseLabel} • ${tier?.name ?? CS.singular}`,
      path: `${CS.hubPath}?tab=economics`,
    },
    {
      title: 'Denefit contract stream',
      value: formatUsdFromCents(denefitsPreview.specialistTotalCents),
      sub: `Example ${DENEFITS.defaultSpecialistSharePct}% over ${DENEFITS.exampleTermYears}yr • Equifax reporting`,
      path: `${CS.hubPath}?tab=economics`,
    },
    {
      title: 'Lead intelligence lever',
      value: leadIntelPerformer === 'agent' ? 'You run' : leadIntelPerformer === 'shared' ? 'Shared' : 'Finely runs',
      sub: 'Prospecting & enrichment ownership in your operating model',
      path: `${CS.hubPath}?tab=overview`,
    },
  ];

  const actions = [
    { label: 'Template library', path: '/portal/templates', icon: BookOpen, note: 'Vault templates + reasons library for client disputes' },
    { label: 'Letter studio', path: '/portal/letters', icon: PenLine, note: 'Draft and generate bureau letters' },
    { label: 'Public specialist page', path: CS.publicPath, icon: Target, note: 'Share your program link with prospects' },
    { label: 'Partner CRM intake', path: '/admin/partners', icon: Users, note: 'Create client files and route to portal' },
    { label: 'Partnership line', path: CS.messagesDeepLink, icon: Users, note: 'Finely support for pricing & tier questions' },
  ];

  return (
    <div className="space-y-6">
      <div className="fc-hub-hero">
        <div className="text-[10px] uppercase tracking-widest text-amber-300 font-black">Growth & lead agents</div>
        <h3 className="mt-2 text-xl font-semibold text-white">Connect pricing, percentages, and profiles</h3>
        <p className="mt-2 text-white/60 text-sm max-w-3xl">
          Use one story for prospects: your revenue share on services, Denefit in-house contracts that report to Equifax, and the operating stack you run from Specialist Hub.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {pitchCards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.path)}
            className="fc-metric-tile text-left hover:border-amber-500/30 transition-colors"
          >
            <div className="text-[10px] uppercase tracking-widest text-white/45">{card.title}</div>
            <div className="text-2xl font-bold text-white mt-2">{card.value}</div>
            <div className="text-xs text-white/45 mt-2">{card.sub}</div>
          </button>
        ))}
      </div>

      <div className="fc-elevated-card p-5 space-y-3">
        <div className="text-white font-semibold">{DENEFITS_SPECIALIST_COPY.title}</div>
        <p className="text-sm text-white/60">{DENEFITS_SPECIALIST_COPY.description}</p>
        <ul className="text-sm text-white/55 space-y-1">
          {DENEFITS_SPECIALIST_COPY.bullets.map((b) => (
            <li key={b}>• {b}</li>
          ))}
        </ul>
      </div>

      <RolePromoLinksPanel role="agent" title="Credit Specialist promo links: guides, ebooks, services" />

      <div className="grid md:grid-cols-2 gap-4">
        {actions.map(({ label, path, icon: Icon, note }) => (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className="fc-light-glass-panel fc-light-chrome-panel p-5 text-left hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <Icon size={16} />
              <span className="text-sm font-semibold text-white">{label}</span>
              <ArrowRight size={14} className="ml-auto text-white/30" />
            </div>
            <p className="mt-2 text-xs text-white/45">{note}</p>
          </button>
        ))}
      </div>

      {leadIntelPerformer !== 'platform' ? (
        <div className="fc-spotlight-panel p-5 text-sm text-white/65">
          Your operating model assigns <span className="text-white font-semibold">lead intelligence</span> to{' '}
          <span className="text-amber-300">{leadIntelPerformer === 'agent' ? 'you' : 'shared Finely + you'}</span>. Use CRM intake, education assets, and Letters studio templates as your prospecting kit while Finely expands scoped lead tools.
        </div>
      ) : (
        <div className="fc-light-glass-panel fc-light-chrome-panel p-5 text-sm text-white/55">
          Lead intelligence is on Finely platform mode in your model — move the lever to Shared or You in Economics to unlock more prospecting ownership and higher keep.
        </div>
      )}
    </div>
  );
}
