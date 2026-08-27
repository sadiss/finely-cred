/** Landing — hero band with fundability next steps. */
import React from 'react';
import { ArrowRight, Bot, Layers, Sparkles, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import { Button, Reveal, FlashyIcon } from '../ui';
import { finelyOsCatalogCard, finelyOsLightMeshSection } from '../../features/os/finelyOsLightUi';

const OS_KPIS = [
  { value: '6 lanes', label: 'Partner paths', accent: 'violet' as const },
  { value: '40+', label: 'Guided follow-ups', accent: 'emerald' as const },
  { value: 'One step', label: 'Always clear next', accent: 'sky' as const },
];

export function LandingHeroOsRefreshSection() {
  const navigate = useNavigate();
  return (
    <section className={`py-10 ${finelyOsLightMeshSection('fc-band-violet')} border-b border-white/5`}>
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <Reveal>
          <div className={`${finelyOsCatalogCard('violet')} !p-6 md:!p-8`} data-fc-accent="violet">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-violet-300">
                  <Sparkles size={14} />
                  From signup to fundability
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold leading-snug">
                  One workspace from <span className="text-violet-200">signup to fundability</span>
                </h2>
                <p className="text-base leading-relaxed opacity-80">
                  Personal restore, business credit, and debt help share the same next step — so you always know what to do now.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button variant="gold" size="md" onClick={() => navigate('/fundability-readiness')}>
                    Fundability hub <ArrowRight size={16} />
                  </Button>
                  <Button variant="platinum" size="md" onClick={() => finelyCtaNavigate(navigate, 'personal_free_guide')}>
                    Start free guide
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
                { icon: Layers, title: 'Clear rooms', desc: 'Personal credit, business, and pricing — one path at a time.', accent: 'violet' as const },
                { icon: Bot, title: 'Human follow-up', desc: 'Timed check-ins from the team, not blast messages.', accent: 'emerald' as const },
                { icon: Target, title: 'Fundability lens', desc: 'Findings are ranked before letters go out.', accent: 'sky' as const },
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
