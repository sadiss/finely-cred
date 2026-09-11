import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import { resolvePackageSelectPath } from '../../lib/packageCheckoutRouting';
import { formatPrice, wealthBuilderPackages, type PricingPackage } from '../../config/pricingCatalog';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import './wealthBuilderPreview.css';

const LIVE_PATH = '/pricing/wealth-builder';
const ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

const YEARS = [
  { n: '01', title: 'Stabilize the file', body: 'The personal bureau file has to be readable before a larger ask. Restore and hygiene come first.' },
  { n: '02', title: 'Stand up the company', body: 'Entity, EIN, and a vendor sequence that can report. Capital talks to the company file, not only the Social Security number.' },
  { n: '03', title: 'Package the ask', body: 'Readiness, documents, and a funding band that matches what the file can actually carry.' },
  { n: '04', title: 'Keep the cadence', body: 'Wealth is a calendar. Payments, utilization, and the next application stay sequenced so last year’s work does not unwind.' },
] as const;

export default function WealthBuilderPreviewPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [pkgId, setPkgId] = useState(wealthBuilderPackages[0]?.id ?? '');
  const selected = wealthBuilderPackages.find((pkg) => pkg.id === pkgId) ?? wealthBuilderPackages[0];

  usePublicSeoMeta({
    title: 'Wealth builder · Credit, company file, and capital in sequence',
    description:
      'A long-horizon program for partners who have stabilized a personal file and now need the company file, the funding package, and a calendar that holds.',
    path: LIVE_PATH,
  });

  const selectPkg = (pkg: PricingPackage) => {
    navigate(
      resolvePackageSelectPath({
        packageId: pkg.id,
        rail: pkg.rail === 'in_house' ? 'in_house' : pkg.rail === 'stripe' ? 'stripe' : undefined,
        isAuthed: Boolean(auth.user),
      }),
    );
  };

  return (
    <PageShell hideHero hideLaunchHelpStrip surface="ivory" contentWidth="full" title="Wealth builder">
      <div data-fc-wealth="1">
        <header className="wb-hero">
          <div className="wb-inner">
            <p className="wb-kicker">Long game</p>
            <h1>Credit first. Then the company. Then the ask.</h1>
            <p className="wb-lede">
              Wealth builder is the years after restore — entity, EIN, vendor depth, and a funding package that matches
              the file. It is not a shortcut around underwriting. It is the sequence that keeps last year’s work from
              unwinding.
            </p>
            <div className="wb-ribbon" aria-hidden>
              <i />
              <span>Year 1</span>
              <span>Year 2</span>
              <span>Year 3</span>
              <span>Hold</span>
            </div>
            <p className="wb-compliance">Results vary · not legal advice · funding subject to underwriting</p>
          </div>
        </header>

        <section className="wb-section">
          <div className="wb-inner">
            <p className="wb-kicker">The runway</p>
            <h2>Four years of work, named in order.</h2>
            <ol className="wb-years">
              {YEARS.map((year, index) => (
                <li key={year.n} data-fc-accent={ACCENTS[index]}>
                  <em>{year.n}</em>
                  <strong>{year.title}</strong>
                  <p>{year.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="wb-section">
          <div className="wb-inner wb-split">
            <ol className="wb-lanes">
              {wealthBuilderPackages.map((pkg, index) => (
                <li key={pkg.id}>
                  <button
                    type="button"
                    className={`wb-lane${pkg.id === selected?.id ? ' is-on' : ''}`}
                    data-fc-accent={ACCENTS[index % ACCENTS.length]}
                    onClick={() => setPkgId(pkg.id)}
                  >
                    <span>{pkg.badge || pkg.delivery}</span>
                    <strong>{pkg.name.replace('Advanced Wealth Builder — ', '').replace('Wealth Builder ', '')}</strong>
                    <em>{formatPrice(pkg.priceAmount)}</em>
                  </button>
                </li>
              ))}
            </ol>

            {selected ? (
              <article className="wb-inspect">
                <p className="wb-kicker">{selected.badge || selected.delivery}</p>
                <h2>{selected.name}</h2>
                <p className="wb-lede">{selected.description}</p>
                <p className="wb-tag">{selected.tagline}</p>
                <ul>
                  {selected.highlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className="wb-actions">
                  <button type="button" className="wb-btn-primary" onClick={() => selectPkg(selected)}>
                    Select this program <ArrowRight size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="wb-btn-secondary"
                    onClick={() => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Wealth builder' })}
                  >
                    Book a session
                  </button>
                </div>
              </article>
            ) : null}
          </div>
        </section>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
