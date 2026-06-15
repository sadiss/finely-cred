/** Landing — unified journey strip (signup → fundability → portal). */
import React from 'react';
import { ArrowRight, Building2, CreditCard, Sparkles, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Reveal, FlashyIcon } from '../ui';
import { finelyOsCatalogCard, finelyOsLandingContrastSection, type FinelyOsPublicAccent } from '../../features/os/finelyOsLightUi';

const STEPS: Array<{
  icon: typeof Sparkles;
  title: string;
  desc: string;
  path: string;
  cta: string;
  accent: FinelyOsPublicAccent;
}> = [
  {
    icon: Sparkles,
    title: 'Create your profile',
    desc: '2-minute onboarding — pick personal, business, or funding lane.',
    path: '/onboarding',
    cta: 'Start free',
    accent: 'emerald',
  },
  {
    icon: Target,
    title: 'Fundability scan',
    desc: 'See utilization, entity, and vendor pillars in one calm hub.',
    path: '/fundability-readiness',
    cta: 'Open hub',
    accent: 'sky',
  },
  {
    icon: CreditCard,
    title: 'Restore & build',
    desc: 'Disputes, evidence vault, Work OS tasks — DIY or DFY.',
    path: '/portal/dashboard',
    cta: 'Enter portal',
    accent: 'violet',
  },
  {
    icon: Building2,
    title: 'Capital readiness',
    desc: 'Lender logic, Nora handoff, wealth builder paths.',
    path: '/pricing/wealth-builder',
    cta: 'Wealth builder',
    accent: 'amber',
  },
];

export function LandingUnifiedJourneySection() {
  const navigate = useNavigate();
  return (
    <section className={`py-20 ${finelyOsLandingContrastSection('fc-band-emerald')}`} data-fc-contrast-band="1">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.3em] text-emerald-300 uppercase mb-3 text-center">One unified path</p>
          <h2 className="text-3xl lg:text-4xl font-light text-white text-center mb-4">
            From signup to <span className="text-emerald-400 font-medium">fundability</span> — without the overwhelm
          </h2>
          <p className="text-white/55 text-center max-w-2xl mx-auto mb-12">
            Finely Cred is one OS: marketing, onboarding, portal, Work OS, CRM, and automations that run like your best staff — not robotic blasts.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 80}>
              <div className={`${finelyOsCatalogCard(step.accent)} !p-5 h-full flex flex-col`} data-fc-accent={step.accent}>
                <FlashyIcon icon={step.icon} color={step.accent} size="md" className="mb-4" />
                <div className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">Step {i + 1}</div>
                <h3 className="text-lg font-semibold text-white mt-1">{step.title}</h3>
                <p className="text-sm text-white/50 mt-2 flex-1 leading-relaxed">{step.desc}</p>
                <Button variant="platinum" size="sm" className="mt-4 w-full justify-center" onClick={() => navigate(step.path)}>
                  {step.cta} <ArrowRight size={14} />
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
