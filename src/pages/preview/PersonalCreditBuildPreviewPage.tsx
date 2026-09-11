import React, { useMemo, useState } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import { resolvePackageSelectPath } from '../../lib/packageCheckoutRouting';
import { formatPrice, personalCreditPackages, type PricingPackage } from '../../config/pricingCatalog';
import { ServicePackageDetailModal } from '../../components/pricing/ServicePackageDetailModal';
import { usePreviewReveal } from '../../features/personalCredit/preview/usePreviewReveal';
import './personalCreditBuildPreview.css';

const LIVE_PATH = '/pricing/personal-credit-building';

const BUILD_IDS = ['personal_build_starter', 'personal_build_pro', 'personal_build_elite'] as const;
const MAINTAIN_IDS = ['personal_maintenance_starter', 'personal_maintenance_pro', 'personal_maintenance_elite'] as const;

const ROOMS = [
  {
    key: 'util',
    accent: 'sky' as const,
    title: 'Utilization',
    body: 'Keep revolving balances in the healthy band. Lenders read the ratio, not a mood.',
  },
  {
    key: 'lines',
    accent: 'emerald' as const,
    title: 'Tradelines',
    body: 'A thin file needs reporting lines that actually post. Sequence beats a pile of applications.',
  },
  {
    key: 'au',
    accent: 'violet' as const,
    title: 'Seasoned seats',
    body: 'Authorized-user seats can thicken a file when utilization is already honest. They complement a build; they do not replace restore.',
  },
  {
    key: 'hold',
    accent: 'rose' as const,
    title: 'Maintain',
    body: 'After the file looks fundable, keep it there. Missed payments undo the work.',
  },
] as const;

const FAQ = [
  {
    q: 'Is building the same as restore?',
    a: 'No. Restore disputes what is already on Equifax, Experian, or TransUnion. Building adds and manages positive reporting after the file is clean enough to grow.',
  },
  {
    q: 'What is the utilization sweep?',
    a: 'Most files look healthier when revolving use sits near 20–30 percent — not maxed, and not a single unused card. We sequence that work.',
  },
  {
    q: 'Do you guarantee a score?',
    a: 'No. Building is education and workflow — tradelines, utilization, and maintenance. Movement depends on reporting and payment habits.',
  },
];

function priceLabel(pkg: PricingPackage): string {
  if (pkg.isCustomQuote) return 'Custom quote';
  return formatPrice(pkg.priceAmount);
}

export default function PersonalCreditBuildPreviewPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [detailPkg, setDetailPkg] = useState<PricingPackage | null>(null);
  const sweep = usePreviewReveal<HTMLDivElement>(0.2);

  const buildPkgs = useMemo(
    () => BUILD_IDS.map((id) => personalCreditPackages.find((p) => p.id === id)).filter(Boolean) as PricingPackage[],
    [],
  );
  const maintainPkgs = useMemo(
    () => MAINTAIN_IDS.map((id) => personalCreditPackages.find((p) => p.id === id)).filter(Boolean) as PricingPackage[],
    [],
  );

  usePublicSeoMeta({
    title: 'Credit building | Finely Cred',
    description:
      'Build a thicker personal credit file with healthy utilization, reporting tradelines, and a maintenance cadence. This is a different product from restore.',
    path: LIVE_PATH,
  });

  const checkout = (pkg: PricingPackage) => {
    navigate(
      resolvePackageSelectPath({
        packageId: pkg.id,
        rail: pkg.rail === 'in_house' ? 'in_house' : pkg.rail === 'stripe' ? 'stripe' : undefined,
        isAuthed: Boolean(auth.user),
      }),
    );
  };

  const bookSession = () => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Credit building' });
  const scrollPackages = () => document.getElementById('pb-packages')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <PageShell
        hideHero
        hideLaunchHelpStrip
        surface="ivory"
        contentWidth="full"
        title="Finely Cred · Credit building"
      >
        <div data-fc-credit-build="1">
          <header className="pb-hero">
            <div className="pb-inner">
              <p className="pb-eyebrow">Personal credit · utilization · tradelines</p>
              <h1 className="pb-hero__title">
                <span className="pb-hero__brand">Finely Cred</span>
                Credit building
              </h1>
              <p className="pb-hero__lede">
                Restore removes what should not be on the file. Building is the next engagement: healthy utilization,
                more lines that actually report, and a maintenance cadence so the profile does not slide.
              </p>
              <div className="pb-hero__actions">
                <button type="button" className="pb-btn-primary" onClick={scrollPackages}>
                  See packages <ArrowRight size={15} aria-hidden />
                </button>
                <button type="button" className="pb-btn-secondary" onClick={bookSession}>
                  Book a session
                </button>
                <Link className="pb-btn-ghost" to="/pricing/personal-credit-restore">
                  Need restore first?
                </Link>
              </div>
              <div
                ref={sweep.ref}
                className={`pb-sweep${sweep.visible ? ' is-on' : ''}`}
                aria-label="Utilization sweep"
              >
                <div className="pb-sweep__meta">
                  <span>Thin</span>
                  <strong>Sweet spot ~20–30%</strong>
                  <span>Loaded</span>
                </div>
                <div className="pb-sweep__rail">
                  <div className="pb-sweep__fill" />
                  <div className="pb-sweep__gem" />
                </div>
                <div className="pb-stack" aria-hidden>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </header>

          <section className="pb-section">
            <div className="pb-inner">
              <p className="pb-kicker">The work</p>
              <h2 className="pb-h2">Utilization first, then more lines that report.</h2>
              <div className="pb-rooms">
                {ROOMS.map((room) => (
                  <article key={room.key} className="pb-plaque" data-fc-accent={room.accent}>
                    <strong>{room.title}</strong>
                    <p>{room.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="pb-section pb-section--tight">
            <div className="pb-inner">
              <div className="pb-au">
                <p className="pb-kicker" style={{ color: '#c4b5fd' }}>
                  Seasoned seats
                </p>
                <h2>Authorized-user lines can thicken a file.</h2>
                <p>
                  A seasoned authorized-user seat can add age and available limit on the personal file. Use it after
                  utilization is honest. Browse the tradeline marketplace if that is the next step, or stay on a build
                  package.
                </p>
                <div className="pb-hero__actions" style={{ justifyContent: 'flex-start', marginTop: '1.1rem' }}>
                  <Link className="pb-btn-primary" to="/tradelines">
                    Tradeline marketplace
                  </Link>
                  <button type="button" className="pb-btn-secondary" onClick={bookSession}>
                    Book a session
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="pb-section" id="pb-packages">
            <div className="pb-inner">
              <p className="pb-kicker">Packages</p>
              <h2 className="pb-h2">Build the file, or keep it there.</h2>
              <p className="pb-lede">
                Choose a build package if the file is still thin. Choose maintenance if the file is already reporting
                cleanly and you want it to stay that way.
              </p>
              <div className="pb-group">
                <p className="pb-group__label">Build</p>
                <div className="pb-plaques">
                  {buildPkgs.map((pkg, index) => (
                    <article
                      key={pkg.id}
                      className="pb-plaque pb-plaque--pkg"
                      data-fc-accent={(['sky', 'emerald', 'violet'] as const)[index] ?? 'sky'}
                    >
                      <span>Build</span>
                      <strong>{pkg.name.replace('Advanced Credit Building — ', '')}</strong>
                      <em>{priceLabel(pkg)}</em>
                      <p>{pkg.tagline}</p>
                      <ul>
                        {(pkg.highlights ?? []).slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <div className="pb-plaque__actions">
                        <button type="button" className="pb-btn-primary" onClick={() => checkout(pkg)}>
                          Select
                        </button>
                        <button type="button" className="pb-btn-ghost" onClick={() => setDetailPkg(pkg)}>
                          <Info size={14} aria-hidden /> Included
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              <div className="pb-group">
                <p className="pb-group__label">Maintain</p>
                <div className="pb-plaques">
                  {maintainPkgs.map((pkg, index) => (
                    <article
                      key={pkg.id}
                      className="pb-plaque pb-plaque--pkg"
                      data-fc-accent={(['rose', 'sky', 'emerald'] as const)[index] ?? 'rose'}
                    >
                      <span>Maintain</span>
                      <strong>{pkg.name.replace('Credit Maintenance — ', '')}</strong>
                      <em>{priceLabel(pkg)}</em>
                      <p>{pkg.tagline}</p>
                      <ul>
                        {(pkg.highlights ?? []).slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <div className="pb-plaque__actions">
                        <button type="button" className="pb-btn-primary" onClick={() => checkout(pkg)}>
                          Select
                        </button>
                        <button type="button" className="pb-btn-ghost" onClick={() => setDetailPkg(pkg)}>
                          <Info size={14} aria-hidden /> Included
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="pb-section pb-section--tight">
            <div className="pb-inner">
              <p className="pb-kicker">Questions</p>
              <h2 className="pb-h2">How building differs from restore</h2>
              <div className="pb-faq">
                {FAQ.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
              <p className="pb-compliance">Results vary · not legal advice · funding subject to underwriting</p>
            </div>
          </section>
        </div>
      </PageShell>
      <ServicePackageDetailModal
        pkg={detailPkg}
        onClose={() => setDetailPkg(null)}
        onSelect={(packageId) => {
          const pkg = [...buildPkgs, ...maintainPkgs].find((item) => item.id === packageId) ?? null;
          setDetailPkg(null);
          if (pkg) checkout(pkg);
        }}
        selectLabel="Select package"
      />
    </>
  );
}
