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
import { searchFederalRegister } from '../../lib/publicDataClient';
import './publicAuthorityPages.css';

const ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export default function RulesThisWeekPage() {
  usePublicSeoMeta({
    title: 'Rules this week',
    description: 'Federal Register items on credit, collections, and consumer finance — educational, not legal advice.',
    path: '/resources/rules-this-week',
    faqs: [
      { q: 'Is this legal advice?', a: 'No. These are published federal notices. Consult a licensed attorney for legal advice.' },
      { q: 'What should I do next?', a: 'Read the rule, then start the free guide if your file is affected. Results vary.' },
    ],
  });

  const [rows, setRows] = useState<Array<{ title: string; date?: string; href?: string; abstract?: string }>>([]);
  const [status, setStatus] = useState('Loading Federal Register…');

  useEffect(() => {
    let cancelled = false;
    void searchFederalRegister({ term: 'credit consumer collection', perPage: 8 }).then((res) => {
      if (cancelled) return;
      const list = (res.data?.results ?? []).map((r) => ({
        title: r.title || 'Untitled notice',
        date: r.publication_date,
        href: r.html_url,
        abstract: r.abstract,
      }));
      setRows(list);
      setStatus(res.ok ? `${list.length} notices` : res.error === 'not_configured' ? 'Deploy public-data to load live rules.' : res.error || 'Could not load');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell hideHero contentWidth="full" title="Rules this week" subtitle="What the Federal Register just published.">
      <article className="fc-viewport-floor pb-16">
        <p className="text-3xl font-extrabold text-white">Rules this week</p>
        <p className="mt-3 text-base text-white/75">A timeline of official notices — not a news blog. {status}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className={FINELY_OS_PRIMARY_BTN} to="/free-guide">Start free guide</Link>
          <Link className={FINELY_OS_SECONDARY_BTN} to="/enlightenment-session">Book a session</Link>
        </div>
        <div className="fc-rules-runway">
          {rows.map((row, i) => (
            <div key={`${row.title}-${i}`} className="fc-rules-item">
              <div className={`fc-rules-dot bg-${ACCENTS[i % 4]}-600`} style={{ background: ['#059669', '#7c3aed', '#0284c7', '#e11d48'][i % 4] }}>
                {i + 1}
              </div>
              <div className={finelyOsCatalogCard(ACCENTS[i % 4])}>
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">{row.date || 'This week'}</p>
                <h2 className="mt-1 text-xl font-extrabold">{row.title}</h2>
                {row.abstract ? <p className="mt-2 text-base text-white/75 line-clamp-4">{row.abstract}</p> : null}
                {row.href ? (
                  <a className="mt-3 inline-block font-bold text-sky-300" href={row.href} target="_blank" rel="noreferrer">
                    Open the notice
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {!rows.length ? <p className="mt-8 text-base text-white/60">{status}</p> : null}
        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-10`}>Results vary · not legal advice · funding subject to underwriting</p>
        <FinelyOsPageFooter />
      </article>
    </PageShell>
  );
}
