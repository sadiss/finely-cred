import React from 'react';
import { ArrowRight, Building2, LogIn, Scale, Users, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyNowDoThisStrip } from '../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../components/tours/FinelyNoticedStrip';
import { buildStartHereNoticedItems } from '../lib/finelyProactiveSignals';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

const PATHS = [
  {
    id: 'personal-credit',
    title: 'Fix personal credit',
    desc: 'Start the free restore guide — disputes, utilization, and your next clear step.',
    icon: Wrench,
    accent: 'emerald' as const,
    primary: { label: 'Start free guide', to: '/free-guide' },
    secondary: { label: 'See pricing', to: '/pricing' },
  },
  {
    id: 'debt',
    title: 'Handle debt pressure',
    desc: 'Collections, validation, and summons education — get the free debt response guide.',
    icon: Scale,
    accent: 'fuchsia' as const,
    primary: { label: 'Get debt guide', to: '/free-debt-guide' },
    secondary: { label: 'Book a session', to: '/enlightenment-session' },
  },
  {
    id: 'business-credit',
    title: 'Build business credit',
    desc: 'Fundability sequencing and vendor depth — open the free business credit power guide.',
    icon: Building2,
    accent: 'violet' as const,
    primary: { label: 'Get business guide', to: '/free-business-guide' },
    secondary: { label: 'Book a session', to: '/enlightenment-session' },
  },
  {
    id: 'earn',
    title: 'Earn as a Credit Specialist',
    desc: 'Learn the craft, then join when ready — guide first, pricing separate.',
    icon: Users,
    accent: 'amber' as const,
    primary: { label: 'Credit Specialist path', to: '/credit-specialist' },
    secondary: { label: 'Read free CS guide', to: '/credit-specialist-guide' },
  },
  {
    id: 'login',
    title: 'Login / portal',
    desc: 'Open your partner portal — dashboard, letters, checklist, and cases.',
    icon: LogIn,
    accent: 'sky' as const,
    primary: { label: 'Sign in', to: '/login' },
    secondary: { label: 'Partner portal', to: '/portal/partner' },
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
  usePublicSeoMeta({
    title: 'Start here',
    description:
      'Pick your path — fix personal credit, handle debt, build business credit, earn as a Credit Specialist, or sign in.',
    path: '/start-here',
  });

  return (
    <PageShell
      badge="Start here"
      title="What do you need help with?"
      subtitle="One clear next step per lane. Tap a tile — or open chat in the corner if you are unsure."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple space-y-6`}>
        <FinelyNoticedStrip items={buildStartHereNoticedItems()} />
        <FinelyNowDoThisStrip title="Your first step" currentIndex={0} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PATHS.map((path) => {
            const Icon = path.icon;
            return (
              <div
                key={path.id}
                className={`${finelyOsCatalogCard(path.accent)} !p-5 space-y-4`}
                data-fc-accent={path.accent}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border bg-black/10">
                    <Icon size={20} />
                  </div>
                  <h2 className={`text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>{path.title}</h2>
                </div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed`}>{path.desc}</p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className={`${FINELY_OS_PRIMARY_BTN} !py-3 !text-sm justify-center`}
                    onClick={() => navigate(path.primary.to)}
                  >
                    {path.primary.label} <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    className={`${FINELY_OS_SECONDARY_BTN} !py-2.5 !text-sm justify-center`}
                    onClick={() => navigate(path.secondary.to)}
                  >
                    {path.secondary.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`${finelyOsCatalogCard('sky')} !p-4`}>
          <p className={`text-xs font-bold uppercase tracking-widest text-white/45 mb-3`}>More free guides</p>
          <div className="flex flex-wrap gap-2">
            {MORE_LANES.map((lane) => (
              <button
                key={lane.to}
                type="button"
                className={`${FINELY_OS_SECONDARY_BTN} !py-2 !px-3 !text-xs`}
                onClick={() => navigate(lane.to)}
              >
                {lane.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-white/40">
          Results vary · not legal advice · funding subject to underwriting
        </p>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
