import React, { useState } from 'react';
import { ArrowRight, Building2, LogIn, Scale, Users, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { reconcileCtaBridgeConversion } from '../lib/funnelCtaBridge';
import { finelyCtaNavigate } from '../lib/finelyCtaIntent';
import { useAuth } from '../auth/AuthProvider';
import { LandingSellAtmosphere } from '../components/landing/LandingSellAtmosphere';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsLandingContrastSection,
  finelyOsSolidIconChip,
} from '../features/os/finelyOsLightUi';

const PATHS = [
  {
    id: 'personal-credit',
    title: 'Fix personal credit',
    desc: 'Start the free restore guide — disputes, utilization, and your next clear step.',
    icon: Wrench,
    accent: 'emerald' as const,
    featured: true,
    primary: { label: 'Start free guide', intent: 'personal_free_guide' as const },
    secondary: { label: 'See pricing', to: '/pricing' },
  },
  {
    id: 'debt',
    title: 'Handle debt pressure',
    desc: 'Collections, validation, and summons education — get the free debt response guide.',
    icon: Scale,
    accent: 'rose' as const,
    primary: { label: 'Get debt guide', to: '/free-debt-guide' },
    secondary: { label: 'Book a strategy call', to: '/enlightenment-session' },
  },
  {
    id: 'business-credit',
    title: 'Build business credit',
    desc: 'Fundability sequencing and vendor depth — open the free business credit power guide.',
    icon: Building2,
    accent: 'violet' as const,
    primary: { label: 'Get business guide', to: '/free-business-guide' },
    secondary: { label: 'Book a strategy call', to: '/enlightenment-session' },
  },
  {
    id: 'earn',
    title: 'Earn as a Credit Specialist',
    desc: 'Learn the craft, then join when ready — guide first, pricing separate.',
    icon: Users,
    accent: 'emerald' as const,
    primary: { label: 'Credit Specialist path', to: '/credit-specialist' },
    secondary: { label: 'Read free CS guide', to: '/credit-specialist-guide' },
  },
  {
    id: 'login',
    title: 'Sign in to portal',
    desc: 'Open your partner portal — dashboard, letters, checklist, and cases.',
    icon: LogIn,
    accent: 'sky' as const,
    primary: { label: 'Sign in', to: '/login' },
    secondary: { label: 'Partner portal', to: '/portal/dashboard' },
  },
] as const;

const MORE_LANES = [
  { label: 'Score roadmap', to: '/free-score-roadmap' },
  { label: 'Tradeline guide', to: '/free-tradeline-guide' },
  { label: 'Agency guide', to: '/free-agency-guide' },
  { label: 'Agency partners', to: '/agency-partners' },
] as const;

export default function StartHerePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [activeId, setActiveId] = useState<string>('personal-credit');
  const activePath = PATHS.find((p) => p.id === activeId) ?? PATHS[0];
  const ActiveIcon = activePath.icon;

  usePublicSeoMeta({
    title: 'Start here',
    description:
      'Pick your path — fix personal credit, handle debt, build business credit, earn as a Credit Specialist, or sign in.',
    path: '/start-here',
  });

  const handlePrimary = (path: (typeof PATHS)[number]) => {
    reconcileCtaBridgeConversion('homepage_hero');
    if ('intent' in path.primary) {
      finelyCtaNavigate(navigate, path.primary.intent, { isAuthed: Boolean(auth.user) });
    } else {
      navigate(path.primary.to);
    }
  };

  return (
    <PageShell badge="Start here" title="What do you need help with?" subtitle="Pick a path. Your next step appears on the right." hideHero>
      <div className={`${FINELY_OS_PAGE} fc-senior-simple space-y-0`}>
        {/* Path doors + selected next step */}
        <section
          className={`fc-sell relative overflow-hidden -mx-4 px-4 py-12 sm:-mx-6 sm:px-6 sm:py-14 lg:-mx-8 lg:px-8 2xl:-mx-10 2xl:px-10 ${finelyOsLandingContrastSection('fc-band-violet')}`}
          data-fc-contrast-band="1"
        >
          <LandingSellAtmosphere tone="platinum" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-stretch">
            <div className={`${finelyOsCatalogCard('violet')} flex flex-col justify-between`} data-fc-accent="violet">
              <div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Start here</div>
                <h2 className={`mt-2 text-3xl sm:text-4xl font-extrabold leading-tight ${FINELY_OS_ENTITY_VALUE}`}>
                  Choose your lane
                </h2>
                <p className={`mt-4 text-base leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>
                  Select a lane — your next step appears here.
                </p>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className={finelyOsSolidIconChip(activePath.accent, 'lg')}>
                    <ActiveIcon size={24} />
                  </div>
                  <div>
                    <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{activePath.title}</div>
                    <p className={`mt-1 text-sm leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{activePath.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center !py-3.5 !text-base`}
                  onClick={() => handlePrimary(activePath)}
                >
                  {activePath.primary.label} <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center !py-3`}
                  onClick={() => navigate(activePath.secondary.to)}
                >
                  {activePath.secondary.label}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 content-start">
              {PATHS.map((path) => {
                const Icon = path.icon;
                const isActive = path.id === activeId;
                return (
                  <button
                    key={path.id}
                    type="button"
                    onClick={() => setActiveId(path.id)}
                    className={`text-left ${finelyOsCatalogCard(path.accent)} !p-5 transition-all ${
                      isActive ? 'ring-2 ring-white/30 brightness-110' : 'opacity-90 hover:opacity-100 hover:brightness-105'
                    }`}
                    data-fc-accent={path.accent}
                  >
                    <div className="flex items-center gap-3">
                      <div className={finelyOsSolidIconChip(path.accent)}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{path.title}</div>
                        {'featured' in path && path.featured ? (
                          <span className={`${FINELY_OS_ENTITY_SUBLABEL} !text-[10px] text-emerald-300`}>Most popular</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="py-8 space-y-6">
          <div className={`${finelyOsCatalogCard('sky')}`} data-fc-accent="sky">
            <p className={`${FINELY_OS_ENTITY_SUBLABEL} mb-4`}>More free guides</p>
            <div className="flex flex-wrap gap-2">
              {MORE_LANES.map((lane) => (
                <button
                  key={lane.to}
                  type="button"
                  className={`${FINELY_OS_SECONDARY_BTN} !py-2.5 !px-4 !text-sm`}
                  onClick={() => navigate(lane.to)}
                >
                  {lane.label}
                </button>
              ))}
            </div>
          </div>

          <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>
            Results vary · not legal advice · funding subject to underwriting
          </p>

          <FinelyOsPageFooter />
        </div>
      </div>
    </PageShell>
  );
}
