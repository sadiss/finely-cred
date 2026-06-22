/** Landing — hero OS refresh band with fundability KPIs (Part AV). */
import React from 'react';
import { ArrowRight, Bot, Layers, Sparkles, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Reveal, FlashyIcon } from '../ui';
import { finelyOsCatalogCard, finelyOsLightMeshSection } from '../../features/os/finelyOsLightUi';

const OS_KPIS = [
  { value: '6 lanes', label: 'Role OS coverage', accent: 'violet' as const },
  { value: '40+', label: 'Human automations', accent: 'emerald' as const },
  { value: 'Tab-first', label: 'Unified hubs', accent: 'amber' as const },
];

export function LandingHeroOsRefreshSection() {
  const navigate = useNavigate();
  return (
    <section className={`py-10 ${finelyOsLightMeshSection('fc-band-violet')} border-b border-white/5`}>
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <Reveal>
          <div className={`${finelyOsCatalogCard('fuchsia')} !p-6 md:!p-8`} data-fc-accent="fuchsia">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-fuchsia-600">
                  <Sparkles size={14} />
                  Finely OS 400% — unified experience
                </div>
                <h2 className="text-2xl md:text-3xl font-light leading-snug">
                  One operating system from <span className="text-fuchsia-700 font-medium">signup → fundability → portal</span>
                </h2>
                <p className="text-sm leading-relaxed opacity-80">
                  Tab-first hubs replace wall-of-scroll pages. Human automations, Reasons OS, and Work OS share the same lane logic — so
                  customers always know the next step.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button variant="gold" size="md" onClick={() => navigate('/fundability-readiness')}>
                    Fundability hub <ArrowRight size={16} />
                  </Button>
                  <Button variant="platinum" size="md" onClick={() => navigate('/onboarding')}>
                    Get started
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 shrink-0 w-full lg:w-auto lg:min-w-[320px]">
                {OS_KPIS.map((kpi, i) => (
                  <Reveal key={kpi.label} delay={i * 80}>
                    <div className={`${finelyOsCatalogCard(kpi.accent)} !p-4 text-center`} data-fc-accent={kpi.accent}>
                      <div className="text-lg md:text-xl font-semibold">{kpi.value}</div>
                      <div className="text-[9px] uppercase tracking-wider opacity-60 mt-1">{kpi.label}</div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <div className="mt-6 grid sm:grid-cols-3 gap-3 border-t border-black/10 pt-6">
              {[
                { icon: Layers, title: 'Progressive hubs', desc: 'Personal credit, business, pricing, resources — one tab at a time.', accent: 'violet' as const },
                { icon: Bot, title: 'Human cadence', desc: 'Persona-driven automations with delays, not blast bots.', accent: 'emerald' as const },
                { icon: Target, title: 'Fundability lens', desc: 'Reasons OS ranks findings before letters go out.', accent: 'sky' as const },
              ].map((item, i) => (
                <Reveal key={item.title} delay={120 + i * 60}>
                  <div className="flex items-start gap-3">
                    <FlashyIcon icon={item.icon} color={item.accent} size="xs" className="shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold">{item.title}</div>
                      <p className="text-xs opacity-65 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
