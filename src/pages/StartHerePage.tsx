import React from 'react';
import { ArrowRight, Handshake, LogIn, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyNowDoThisStrip } from '../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../components/tours/FinelyNoticedStrip';
import { buildStartHereNoticedItems } from '../lib/finelyProactiveSignals';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

const PATHS = [
  {
    id: 'fix-credit',
    title: 'Fix my credit',
    desc: 'See packages, upload reports, and start dispute letters — step by step.',
    icon: Wrench,
    accent: 'emerald' as const,
    primary: { label: 'Personal credit lane', to: '/personal-credit' },
    secondary: { label: 'Start onboarding', to: '/onboarding' },
  },
  {
    id: 'refer',
    title: 'Refer people & earn',
    desc: 'Share Finely Cred, track referrals, and open your affiliate toolkit.',
    icon: Handshake,
    accent: 'violet' as const,
    primary: { label: 'Affiliate overview', to: '/affiliate' },
    secondary: { label: 'Affiliate hub (sign in)', to: '/affiliate/hub' },
  },
  {
    id: 'staff',
    title: 'Staff or partner login',
    desc: 'Open your portal dashboard, cases, letters, and client files.',
    icon: LogIn,
    accent: 'sky' as const,
    primary: { label: 'Partner portal', to: '/portal/partner' },
    secondary: { label: 'Admin dashboard', to: '/admin' },
  },
] as const;

export default function StartHerePage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Start here',
    description: 'Pick your path — fix credit, refer people, or sign in as staff or partner.',
    path: '/start-here',
  });

  return (
    <PageShell
      badge="Start here"
      title="What do you want to do today?"
      subtitle="One obvious next step — no jargon. Tap a lane below or open chat in the corner for help."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple space-y-8`}>
        <FinelyNoticedStrip items={buildStartHereNoticedItems()} />
        <FinelyNowDoThisStrip title="Your first step" currentIndex={0} />

        <div className="grid gap-6 lg:grid-cols-3">
          {PATHS.map((path) => {
            const Icon = path.icon;
            return (
              <div key={path.id} className={`${finelyOsCatalogCard(path.accent)} !p-6 space-y-5`} data-fc-accent={path.accent}>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-black/10">
                    <Icon size={22} />
                  </div>
                  <h2 className={`text-xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{path.title}</h2>
                </div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-base leading-relaxed`}>{path.desc}</p>
                <div className="flex flex-col gap-3">
                  <button type="button" className={`${FINELY_OS_PRIMARY_BTN} !py-4 !text-base justify-center`} onClick={() => navigate(path.primary.to)}>
                    {path.primary.label} <ArrowRight size={16} />
                  </button>
                  <button type="button" className={`${FINELY_OS_SECONDARY_BTN} !py-3 justify-center`} onClick={() => navigate(path.secondary.to)}>
                    {path.secondary.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
