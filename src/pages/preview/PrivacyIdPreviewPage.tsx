import React, { useState } from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import { resolvePackageSelectPath } from '../../lib/packageCheckoutRouting';
import { formatPrice, privacyPackages, type PricingPackage } from '../../config/pricingCatalog';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import './privacyIdPreview.css';

const LIVE_PATH = '/pricing/privacy-id';

const CONTROLS = [
  {
    key: 'freeze',
    accent: 'emerald' as const,
    title: 'Credit freeze',
    body: 'A freeze tells Equifax, Experian, and TransUnion not to open new credit in your name until you thaw the file. We walk you through each bureau’s request, the PIN they issue, and how to lift it when you actually apply.',
  },
  {
    key: 'lock',
    accent: 'violet' as const,
    title: 'File lock',
    body: 'A lock is the bureau’s own switch — faster than a freeze at some shops, and easier to toggle from their app. We show you which lock belongs to which bureau so you are not guessing from three different dashboards.',
  },
  {
    key: 'optout',
    accent: 'sky' as const,
    title: 'Broker opt-out',
    body: 'Data brokers resell the addresses, phones, and relatives that make identity theft easy. The kit includes the opt-out letters and a checklist so the work is a cadence, not a weekend panic.',
  },
  {
    key: 'alert',
    accent: 'rose' as const,
    title: 'Fraud alert',
    body: 'A fraud alert asks a lender to take extra steps before they open an account. It is the right first move after a breach or a stolen wallet — and it is not a substitute for a freeze when you need the file closed.',
  },
] as const;

export default function PrivacyIdPreviewPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [controlKey, setControlKey] = useState<(typeof CONTROLS)[number]['key']>('freeze');
  const [pkgId, setPkgId] = useState(privacyPackages[0]?.id ?? '');
  const control = CONTROLS.find((item) => item.key === controlKey) ?? CONTROLS[0];
  const selected = privacyPackages.find((pkg) => pkg.id === pkgId) ?? privacyPackages[0];

  usePublicSeoMeta({
    title: 'Privacy and identity · Freeze, lock, and opt-out',
    description:
      'Protect the credit file and the name on it. Freeze the bureaus, lock what should stay closed, and opt out of the brokers that resell your address.',
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
    <PageShell hideHero hideLaunchHelpStrip surface="ivory" contentWidth="full" title="Privacy and identity">
      <div data-fc-privacy-id="1">
        <header className="prid-hero">
          <div className="prid-inner prid-hero__grid">
            <div>
              <p className="prid-kicker">Identity hygiene</p>
              <h1>Hold the file closed until you decide it opens.</h1>
              <p className="prid-lede">
                Privacy work is not a slogan. It is the freeze, the lock, the fraud alert, and the broker opt-outs that
                keep a stolen name from becoming a new account. We give you the sequence — then you keep the keys.
              </p>
              <div className="prid-actions">
                <button type="button" className="prid-btn-primary" onClick={() => selected && selectPkg(selected)}>
                  Open this kit <ArrowRight size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  className="prid-btn-secondary"
                  onClick={() => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Privacy and identity' })}
                >
                  Book a session
                </button>
              </div>
              <p className="prid-compliance">Results vary · not legal advice · funding subject to underwriting</p>
            </div>
            <div className="prid-vault" aria-hidden>
              <div className="prid-vault__body">
                <Shield size={36} strokeWidth={1.75} />
                <span>File locked</span>
              </div>
              <i className="prid-vault__shackle" />
            </div>
          </div>
        </header>

        <section className="prid-section">
          <div className="prid-inner">
            <p className="prid-kicker">Control room</p>
            <h2>Four switches. One clear next step.</h2>
            <div className="prid-room">
              <div className="prid-grid" role="tablist" aria-label="Identity controls">
                {CONTROLS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={item.key === controlKey}
                    className="prid-cell"
                    data-fc-accent={item.accent}
                    onClick={() => setControlKey(item.key)}
                  >
                    <strong>{item.title}</strong>
                  </button>
                ))}
              </div>
              <aside className="prid-rail" data-fc-accent={control.accent}>
                <p className="prid-kicker">{control.title}</p>
                <p>{control.body}</p>
              </aside>
            </div>
          </div>
        </section>

        <section className="prid-section prid-section--kits">
          <div className="prid-inner">
            <p className="prid-kicker">Kits</p>
            <h2>Pick the depth that matches the risk.</h2>
            <div className="prid-kits">
              {privacyPackages.map((pkg, index) => (
                <article
                  key={pkg.id}
                  className={`prid-kit${pkg.id === selected?.id ? ' is-on' : ''}`}
                  data-fc-accent={index % 2 === 0 ? 'sky' : 'violet'}
                >
                  <button type="button" className="prid-kit__pick" onClick={() => setPkgId(pkg.id)}>
                    <span>{pkg.delivery}</span>
                    <strong>{pkg.name}</strong>
                    <p>{pkg.description}</p>
                    <em>{formatPrice(pkg.priceAmount)}</em>
                  </button>
                  {pkg.id === selected?.id ? (
                    <ul>
                      {pkg.highlights.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                  <button type="button" className="prid-btn-primary" onClick={() => selectPkg(pkg)}>
                    Select {pkg.name}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
