import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import { resolvePackageSelectPath } from '../../lib/packageCheckoutRouting';
import { bundlePackages, formatPrice, type PricingPackage } from '../../config/pricingCatalog';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import './bundlesPreview.css';

const LIVE_PATH = '/pricing/bundles';
const ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export default function BundlesPreviewPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [pkgId, setPkgId] = useState(bundlePackages[0]?.id ?? '');
  const selected = bundlePackages.find((pkg) => pkg.id === pkgId) ?? bundlePackages[0];

  usePublicSeoMeta({
    title: 'Program bundles · Restore, debt, business, and tradelines together',
    description:
      'Combined Finely Cred programs for partners who need more than one desk at once — restore with debt, business with personal, or a funding accelerator with authorized-user placements.',
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
    <PageShell hideHero hideLaunchHelpStrip surface="ivory" contentWidth="full" title="Program bundles">
      <div data-fc-bundles="1">
        <header className="bdl-hero">
          <div className="bdl-inner">
            <p className="bdl-kicker">Combined programs</p>
            <h1>One ticket when the file needs more than one desk.</h1>
            <p className="bdl-lede">
              A bundle is not a discount bin. It is the restore work, the collector packet, the EIN file, or the
              authorized-user placement sitting in one program so the sequence stays honest. Open a ticket. See what is
              inside. Select only if that combination is the job.
            </p>
            <div className="bdl-sheaf" aria-hidden>
              <span data-fc-accent="emerald" />
              <span data-fc-accent="violet" />
              <span data-fc-accent="sky" />
            </div>
            <p className="bdl-compliance">Results vary · not legal advice · funding subject to underwriting</p>
          </div>
        </header>

        <section className="bdl-section">
          <div className="bdl-inner bdl-split">
            <ol className="bdl-stack">
              {bundlePackages.map((pkg, index) => (
                <li key={pkg.id}>
                  <button
                    type="button"
                    className={`bdl-ticket${pkg.id === selected?.id ? ' is-on' : ''}`}
                    data-fc-accent={ACCENTS[index % ACCENTS.length]}
                    onClick={() => setPkgId(pkg.id)}
                  >
                    <i>{String(index + 1).padStart(2, '0')}</i>
                    <div>
                      <strong>{pkg.name}</strong>
                      <p>{pkg.tagline}</p>
                    </div>
                    <em>{formatPrice(pkg.priceAmount)}</em>
                  </button>
                </li>
              ))}
            </ol>

            {selected ? (
              <article className="bdl-inspector" data-fc-accent="violet">
                <p className="bdl-kicker">{selected.badge || selected.delivery}</p>
                <h2>{selected.name}</h2>
                <p className="bdl-lede">{selected.description}</p>
                {selected.valueAmount ? (
                  <p className="bdl-value">
                    Separate desks {formatPrice(selected.valueAmount)} · this ticket {formatPrice(selected.priceAmount)}
                  </p>
                ) : null}
                <ul>
                  {selected.highlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className="bdl-actions">
                  <button type="button" className="bdl-btn-primary" onClick={() => selectPkg(selected)}>
                    Select this bundle <ArrowRight size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="bdl-btn-secondary"
                    onClick={() => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Program bundles' })}
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
