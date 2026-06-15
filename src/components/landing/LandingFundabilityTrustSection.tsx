/** Landing — fundability trust band + unified OS proof (Part AT). */
import React from 'react';
import { ArrowRight, Bot, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Reveal, FlashyIcon } from '../ui';
import { finelyOsCatalogCard, finelyOsLandingContrastSection, type FinelyOsPublicAccent } from '../../features/os/finelyOsLightUi';

const PROOF: Array<{
  icon: typeof Layers;
  title: string;
  desc: string;
  accent: FinelyOsPublicAccent;
}> = [
  {
    icon: Layers,
    title: 'One OS — not ten tabs',
    desc: 'Marketing, onboarding, portal, Work OS, CRM, and automations share the same lane logic.',
    accent: 'violet',
  },
  {
    icon: Bot,
    title: 'Automations that feel human',
    desc: '40+ persona-driven recipes with cadence delays — not blast-and-pray email bots.',
    accent: 'fuchsia',
  },
  {
    icon: ShieldCheck,
    title: 'Factual dispute discipline',
    desc: 'Reasons OS ranks library findings for fundability impact before letters go out.',
    accent: 'amber',
  },
];

export function LandingFundabilityTrustSection() {
  const navigate = useNavigate();
  return (
    <section className={`py-16 ${finelyOsLandingContrastSection('fc-band-violet')}`} data-fc-contrast-band="1">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-[0.3em] text-violet-300 uppercase mb-3">Built to unify</p>
              <h2 className="text-3xl lg:text-4xl font-light text-white">
                Fundability-first — with <span className="text-violet-300 font-medium">calm layouts</span> everywhere
              </h2>
              <p className="text-white/55 mt-3 leading-relaxed">
                Dense credit work belongs in tab-first hubs, not infinite scroll walls. Finely Cred routes you from signup →
                fundability scan → portal execution without losing context.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button variant="gold" size="lg" onClick={() => navigate('/fundability-readiness')}>
                Open fundability hub <ArrowRight size={16} />
              </Button>
              <Button variant="platinum" size="lg" onClick={() => navigate('/onboarding')}>
                Get started
              </Button>
            </div>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-4">
          {PROOF.map((item, i) => (
            <Reveal key={item.title} delay={i * 90}>
              <div className={`${finelyOsCatalogCard(item.accent)} !p-6 h-full`} data-fc-accent={item.accent}>
                <FlashyIcon icon={item.icon} color={item.accent} size="md" className="mb-4" />
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-white/50 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={300}>
          <div className={`mt-8 ${finelyOsCatalogCard('emerald')} !p-5 flex flex-col sm:flex-row items-center justify-between gap-4`} data-fc-accent="emerald">
            <div className="flex items-center gap-3">
              <FlashyIcon icon={Sparkles} color="emerald" size="sm" className="!w-12 !h-12 shrink-0" />
              <p className="text-sm text-white/70">
                <span className="text-white font-semibold">Reasons OS + Letter Studio</span> — AI-ranked factual findings with fundability lens.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/personal-credit')}
              className="text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:text-white transition-colors"
            >
              See personal restore path →
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
