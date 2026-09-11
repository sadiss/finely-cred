import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { fetchHmdaStateSummary, fetchSbaStateSummary } from '../../lib/publicDataClient';
import './publicAuthorityPages.css';

const STATES = ['TX', 'CA', 'NY', 'FL', 'IL', 'GA', 'PA', 'OH', 'NC', 'AZ'] as const;

export default function StateFundingPage() {
  const { stateSlug } = useParams();
  const state = (stateSlug || 'TX').toUpperCase().slice(0, 2);
  const safe = STATES.includes(state as (typeof STATES)[number]) ? state : 'TX';

  usePublicSeoMeta({
    title: `Funding pressure in ${safe}`,
    description: `HMDA mortgage originations and SBA activity for ${safe}. Educational overlay — funding subject to underwriting.`,
    path: `/resources/funding/${safe.toLowerCase()}`,
    faqs: [
      { q: 'Does this mean I am approved?', a: 'No. These are public HMDA and SBA counts. Funding is subject to underwriting.' },
      { q: 'What should I do next?', a: 'Start the free guide to get the personal file ready first. Results vary.' },
    ],
  });

  const [hmda, setHmda] = useState<string>('Loading HMDA…');
  const [sba, setSba] = useState<string>('Loading SBA…');

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchHmdaStateSummary({ state: safe }), fetchSbaStateSummary({ state: safe })]).then(
      ([h, s]) => {
        if (cancelled) return;
        if (h.ok && h.data) {
          setHmda(`${h.data.originated.toLocaleString()} originated · ${h.data.denied.toLocaleString()} denied (${h.data.year})`);
        } else {
          setHmda(h.error === 'not_configured' ? 'Deploy public-data to load HMDA.' : h.error || 'HMDA unavailable');
        }
        if (s.ok && s.data) {
          setSba(
            s.data.available
              ? `${s.data.loanCount.toLocaleString()} SBA loans · ${s.data.lenderNames.slice(0, 3).join(', ') || 'lenders on file'}`
              : s.data.hint || 'SBA summary not published for this state.',
          );
        } else {
          setSba(s.error === 'not_configured' ? 'Deploy public-data to load SBA.' : s.error || 'SBA unavailable');
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [safe]);

  return (
    <PageShell hideHero contentWidth="full" title={`Funding in ${safe}`} subtitle="Mortgage and SBA overlays — not a second lender list.">
      <article className="fc-viewport-floor pb-16">
        <p className="text-3xl font-extrabold text-white">Funding pressure in {safe}</p>
        <p className="mt-3 text-base text-white/75">
          Official HMDA and SBA counts for this state. We do not sell a loan here.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className={FINELY_OS_PRIMARY_BTN} to="/free-guide">Start free guide</Link>
          <Link className={FINELY_OS_SECONDARY_BTN} to="/enlightenment-session">Book a session</Link>
        </div>
        <div className="fc-funding-deck mt-10">
          <div className="fc-funding-states" aria-label="States">
            {STATES.map((st) => (
              <Link key={st} to={`/resources/funding/${st.toLowerCase()}`} className={finelyOsViewTab(st === safe, 'sky')}>
                {st}
              </Link>
            ))}
          </div>
          <div className="space-y-4">
            <div className={finelyOsCatalogCard('emerald')}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">HMDA</p>
              <p className="mt-2 text-2xl font-extrabold">{hmda}</p>
            </div>
            <div className={finelyOsCatalogCard('violet')}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">SBA</p>
              <p className="mt-2 text-2xl font-extrabold">{sba}</p>
            </div>
            <div className={finelyOsCatalogCard('rose')}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">What this is not</p>
              <p className="mt-2 text-base text-white/80">
                Not an approval. Funding is subject to underwriting. Use the free guide to get the personal file ready first.
              </p>
            </div>
          </div>
        </div>
        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-10`}>Results vary · not legal advice · funding subject to underwriting</p>
        <FinelyOsPageFooter />
      </article>
    </PageShell>
  );
}
