import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { loadDataFeedsToday, type DataFeedStory } from '../../lib/dataFeedsToday';
import './publicAuthorityPages.css';

export default function DebtOpinionsPage() {
  usePublicSeoMeta({
    title: 'Debt opinions — education',
    description: 'How summons and collection opinions show up in public sources. Educational — not legal advice.',
    path: '/resources/debt-opinions',
    faqs: [
      { q: 'Is this a court filing service?', a: 'No. This page explains public debt-education headlines. Consult a licensed attorney for your case.' },
      { q: 'What should I do if I was sued?', a: 'Read the summons, start the free debt guide, and book a session if you need a walkthrough. Not legal advice.' },
    ],
    howTo: {
      name: 'If you were served a summons',
      description: 'Education first. Not legal advice.',
      steps: ['Read the paper and note the answer date', 'Match the plaintiff to your bureau file', 'Start the debt guide'],
    },
  });

  const [stories, setStories] = useState<DataFeedStory[]>([]);

  useEffect(() => {
    let cancelled = false;
    void loadDataFeedsToday().then((pack) => {
      if (cancelled) return;
      setStories(pack.stories.filter((s) => s.topic === 'debt').slice(0, 6));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell hideHero contentWidth="full" title="Debt opinions" subtitle="Education from public sources — not a court search.">
      <article className="fc-viewport-floor pb-16">
        <p className="text-3xl font-extrabold text-white">Debt opinions</p>
        <p className="mt-3 text-base text-white/75">
          A two-column explainer: what a summons usually asks, and what public feeds are saying this week.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className={FINELY_OS_PRIMARY_BTN} to="/free-debt-guide">Start debt guide</Link>
          <Link className={FINELY_OS_SECONDARY_BTN} to="/enlightenment-session">Book a session</Link>
        </div>
        <div className="fc-opinions-spine mt-10">
          <div className={finelyOsCatalogCard('rose')}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">If you were served</p>
            <h2 className="mt-2 text-2xl font-extrabold">Read the paper. Deadline first.</h2>
            <ul className="mt-4 space-y-3 text-base text-white/80">
              <li>Note the answer date. Missing it is the real emergency.</li>
              <li>Match the plaintiff and account to what is on your bureau file.</li>
              <li>Validation and evidence come before generic language.</li>
            </ul>
          </div>
          <div className="space-y-4">
            {stories.length ? (
              stories.map((s, i) => (
                <div key={s.id} className={finelyOsCatalogCard((['violet', 'sky', 'emerald'] as const)[i % 3])}>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50">{s.source}</p>
                  <h3 className="mt-1 text-xl font-extrabold">{s.headline}</h3>
                  <p className="mt-2 text-base text-white/75">{s.detail}</p>
                </div>
              ))
            ) : (
              <div className={finelyOsCatalogCard('sky')}>
                <p className="text-base">Live debt headlines appear when public-data is deployed.</p>
              </div>
            )}
          </div>
        </div>
        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-10`}>Results vary · not legal advice · funding subject to underwriting</p>
        <FinelyOsPageFooter />
      </article>
    </PageShell>
  );
}
