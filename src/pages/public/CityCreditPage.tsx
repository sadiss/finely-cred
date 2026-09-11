import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { CITY_CREDIT_PAGES, getCityCreditPage } from '../../config/cityCreditPages';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import './cityCreditPage.css';

const FUNDING_STATES = new Set(['TX', 'CA', 'NY', 'FL', 'IL', 'GA', 'PA', 'OH', 'NC', 'AZ']);

export default function CityCreditPage() {
  const { citySlug } = useParams();
  const city = getCityCreditPage(citySlug || '');

  usePublicSeoMeta({
    title: city ? `Credit restore in ${city.city}, ${city.state}` : 'Credit restore',
    description: city ? `${city.angle}. ${city.localFact}` : 'Credit restore for major U.S. cities.',
    path: city ? `/credit/${city.slug}` : '/',
    local: city ? { city: city.city, state: city.state } : undefined,
    faqs: city
      ? [
          {
            q: `How do I start credit restore in ${city.city}?`,
            a: 'Start the free guide, then upload a bureau report. We map tradelines from what you upload. Results vary. Not legal advice.',
          },
          {
            q: 'Do you guarantee score changes?',
            a: 'No. Results vary. Funding is subject to underwriting. We organize disputes and evidence from the report you upload.',
          },
        ]
      : undefined,
    howTo: city
      ? {
          name: `Start credit restore in ${city.city}`,
          description: city.nextStep,
          steps: ['Start the free guide', 'Upload a bureau report', 'Book a session if you are stuck'],
        }
      : undefined,
  });

  if (!city) return <Navigate to="/" replace />;

  const neighbors = CITY_CREDIT_PAGES.filter((c) => c.slug !== city.slug).slice(0, 4);

  return (
    <PageShell hideHero contentWidth="full" title={`Credit restore in ${city.city}`} subtitle={city.angle}>
      <article className={`fc-city-credit fc-city-credit-${city.layout}`}>
        <header className="fc-city-credit-hero">
          <p className="fc-city-credit-kicker" style={{ color: city.layout === 'harbor' ? '#6ee7b7' : '#93c5fd' }}>
            {city.metro}
          </p>
          <h1 className="fc-city-credit-title">Credit restore in {city.city}</h1>
          <p className="fc-city-credit-lead">{city.angle}. {city.localFact}</p>
          <div className="fc-city-credit-actions">
            <Link className={FINELY_OS_PRIMARY_BTN} to="/free-guide">
              Start free guide
            </Link>
            <Link className={FINELY_OS_SECONDARY_BTN} to="/enlightenment-session">
              Book a session
            </Link>
          </div>
        </header>

        {city.layout === 'split' ? (
          <div className="fc-city-credit-split px-6 pb-12">
            <div className={`${finelyOsCatalogCard('emerald')} p-8`} data-fc-accent="emerald">
              <h2 className="text-2xl font-extrabold">What to do in {city.city} this week</h2>
              <p className="mt-3 text-base leading-relaxed text-white/80">{city.nextStep}</p>
            </div>
            <div className={`${finelyOsCatalogCard('violet')} p-8`} data-fc-accent="violet">
              <h2 className="text-2xl font-extrabold">Not a score promise</h2>
              <p className="mt-3 text-base leading-relaxed text-white/80">
                We organize disputes and evidence from the report you upload. Results vary. Not legal advice.
              </p>
            </div>
          </div>
        ) : city.layout === 'spine' ? (
          <div className="fc-city-credit-spine mx-6 mb-12">
            <div className={`${finelyOsCatalogCard('sky')} p-8`} data-fc-accent="sky">
              <h2 className="text-2xl font-extrabold">The {city.city} next step</h2>
              <p className="mt-3 text-base leading-relaxed text-white/80">{city.nextStep}</p>
            </div>
          </div>
        ) : (
          <div className={`fc-city-credit-fact mx-6 mb-12 ${finelyOsCatalogCard(city.layout === 'harbor' ? 'rose' : 'sky')}`}>
            <strong>This week in {city.city}:</strong> {city.nextStep}
          </div>
        )}

        <section className="px-6 pb-16">
          <div className="mb-10 grid gap-3 sm:grid-cols-3">
            {FUNDING_STATES.has(city.state) ? (
              <Link to={`/resources/funding/${city.state.toLowerCase()}`} className={finelyOsCatalogCard('emerald')}>
                <span className="text-lg font-extrabold">Funding pressure in {city.state}</span>
                <span className="mt-1 block text-sm text-white/70">HMDA and SBA context for a conversation, not an approval.</span>
              </Link>
            ) : null}
            <Link to="/resources/complaints" className={finelyOsCatalogCard('violet')}>
              <span className="text-lg font-extrabold">Complaint board</span>
              <span className="mt-1 block text-sm text-white/70">Public CFPB issues about bureaus and collectors.</span>
            </Link>
            <Link to="/resources/law" className={finelyOsCatalogCard('sky')}>
              <span className="text-lg font-extrabold">What the statute says</span>
              <span className="mt-1 block text-sm text-white/70">Live eCFR excerpts you can read in the room.</span>
            </Link>
          </div>
          <h2 className="text-xl font-extrabold">Other cities</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {neighbors.map((n, i) => (
              <Link
                key={n.slug}
                to={`/credit/${n.slug}`}
                className={finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[i % 4])}
                data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[i % 4]}
              >
                <span className="text-lg font-extrabold">
                  {n.city}, {n.state}
                </span>
                <span className="mt-1 block text-sm text-white/70">{n.angle}</span>
              </Link>
            ))}
          </div>
          <p className={`mt-8 ${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
            Results vary · not legal advice · funding subject to underwriting
          </p>
        </section>
        <FinelyOsPageFooter />
      </article>
    </PageShell>
  );
}
