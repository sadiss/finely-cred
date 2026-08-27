/** Homepage — four clear paths (Restore · Debt · Business · Earn). */
import React from 'react';
import { ArrowRight, Briefcase, Building2, CreditCard, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Reveal, FlashyIcon } from '../ui';
import { finelyOsCatalogCard, finelyOsLandingContrastSection, type FinelyOsPublicAccent } from '../../features/os/finelyOsLightUi';
import { LandingTypewriterTitle } from './LandingTypewriterTitle';
import './landingSellBands.css';

const PATHS: Array<{
  icon: typeof CreditCard;
  title: string;
  desc: string;
  path: string;
  cta: string;
  accent: FinelyOsPublicAccent;
}> = [
  {
    icon: CreditCard,
    title: 'Restore credit',
    desc: 'Personal restore, disputes, and score strategy — DIY or done-for-you.',
    path: '/pricing/personal-credit-restore',
    cta: 'See restore',
    accent: 'emerald',
  },
  {
    icon: Scale,
    title: 'Debt & legal',
    desc: 'Collections, validation, and summons support with a clear playbook.',
    path: '/pricing/debt-legal',
    cta: 'See debt help',
    accent: 'fuchsia',
  },
  {
    icon: Building2,
    title: 'Business credit',
    desc: 'Entity setup, vendor credit, and fundability for your company.',
    path: '/pricing/business-credit',
    cta: 'See business',
    accent: 'sky',
  },
  {
    icon: Briefcase,
    title: 'Earn · Careers',
    desc: 'Credit Specialist, agency, affiliate, real estate, and AU seller tracks.',
    path: '/credit-specialist',
    cta: 'Explore careers',
    accent: 'rose',
  },
];

export function LandingPathChooserSection() {
  const navigate = useNavigate();
  return (
    <section className={`py-14 sm:py-16 ${finelyOsLandingContrastSection('fc-band-emerald')}`} data-fc-contrast-band="1">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.3em] text-emerald-300 uppercase mb-3 text-center">Who is this for?</p>
          <LandingTypewriterTitle
            text="Pick your "
            accentText="path"
            className="text-3xl lg:text-4xl font-light text-white text-center mb-3"
            accentClassName="text-emerald-400 font-medium"
            speedMs={40}
            delayMs={80}
          />
          <p className="text-white/55 text-center max-w-2xl mx-auto mb-10">
            One clear next step — restore personal credit, handle debt, build business credit, or earn with Finely.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PATHS.map((path, i) => (
            <Reveal key={path.title} delay={i * 70}>
              <div className={`${finelyOsCatalogCard(path.accent)} !p-5 h-full flex flex-col`} data-fc-accent={path.accent}>
                <FlashyIcon icon={path.icon} color={path.accent} size="md" className="mb-4" />
                <h3 className="text-lg font-semibold text-white">{path.title}</h3>
                <p className="text-sm text-white/50 mt-2 flex-1 leading-relaxed">{path.desc}</p>
                <Button variant="platinum" size="sm" className="mt-4 w-full justify-center" onClick={() => navigate(path.path)}>
                  {path.cta} <ArrowRight size={14} />
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
