/** Homepage — four clear paths (Restore · Debt · Business · Earn). */
import React from 'react';
import { ArrowRight, Briefcase, Building2, CreditCard, Languages, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { resolveHaitianCommunityHref } from '../../lib/haitianCompanionDesk';
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
    desc: 'Dispute what Equifax, Experian, and TransUnion actually show — do-it-yourself tools or a done-for-you desk.',
    path: '/pricing/personal-credit-restore',
    cta: 'See restore',
    accent: 'emerald',
  },
  {
    icon: Scale,
    title: 'Debt & legal',
    desc: 'Collections, validation, and summons support with a packet matched to the matter.',
    path: '/pricing/debt-legal',
    cta: 'See debt help',
    accent: 'fuchsia',
  },
  {
    icon: Building2,
    title: 'Business credit',
    desc: 'Stand up the company file vendors actually check — EIN, vendors, then terms.',
    path: '/pricing/business-credit',
    cta: 'See business',
    accent: 'sky',
  },
  {
    icon: Briefcase,
    title: 'Earn · Careers',
    desc: 'Credit Specialist, agency, affiliate, real estate, and authorized-user seller tracks.',
    path: '/credit-specialist',
    cta: 'Explore careers',
    accent: 'rose',
  },
];

export function LandingPathChooserSection() {
  const navigate = useNavigate();
  const auth = useAuth();
  const haitianHref = resolveHaitianCommunityHref({
    isAdmin: isAdminEmail(auth.user?.email),
    isAuthed: Boolean(auth.user),
  });
  return (
    <section className={`py-14 sm:py-16 ${finelyOsLandingContrastSection('fc-band-emerald')}`} data-fc-contrast-band="1">
      <div className="fc-viewport-floor">
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
            Choose the work that fits this visit: restore a personal file, handle debt paper, build business credit, or
            earn with Finely Cred.
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
        <Reveal delay={280}>
          <button
            type="button"
            className={`${finelyOsCatalogCard('emerald')} mt-6 w-full text-left !p-6 lg:!p-8`}
            data-fc-accent="emerald"
            onClick={() => navigate(haitianHref)}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <FlashyIcon icon={Languages} color="emerald" size="md" />
                <div>
                  <p className="text-xs font-extrabold tracking-[0.2em] uppercase text-emerald-300">Haitian Americans living in the U.S.</p>
                  <h3 className="mt-2 text-2xl font-extrabold text-white">Haitian community</h3>
                  <p className="mt-2 text-base font-bold text-white/70">
                    Credit help for Haitian Americans — letters, collections, and a clear next step in English and
                    Kreyòl.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 text-base font-extrabold text-emerald-300">
                Open Haitian community <ArrowRight size={18} />
              </span>
            </div>
          </button>
        </Reveal>
      </div>
    </section>
  );
}
