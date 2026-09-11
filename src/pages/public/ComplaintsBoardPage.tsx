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
import { searchCfpbComplaints, type CfpbComplaintHit } from '../../lib/publicDataClient';
import './publicAuthorityPages.css';

const COMPANIES = ['Equifax', 'Experian', 'TransUnion', 'Portfolio Recovery Associates', 'Midland Credit Management'];
const ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

function flatten(hits?: { hits?: Array<{ _source?: CfpbComplaintHit }> }): CfpbComplaintHit[] {
  return (hits?.hits ?? []).map((h) => h._source).filter((s): s is CfpbComplaintHit => Boolean(s));
}

export default function ComplaintsBoardPage() {
  usePublicSeoMeta({
    title: 'Complaint board',
    description: 'CFPB complaint issues for major bureaus and collectors — educational counts, no promises.',
    path: '/resources/complaints',
    faqs: [
      { q: 'Does a complaint mean the company is wrong?', a: 'No. A complaint is a filing, not a finding. We use it to see common issues.' },
      { q: 'Can you delete a collection?', a: 'We do not promise deletions. Results vary. Not legal advice.' },
    ],
  });

  const [tiles, setTiles] = useState<CfpbComplaintHit[]>([]);
  const [status, setStatus] = useState('Loading CFPB complaints…');

  useEffect(() => {
    let cancelled = false;
    void Promise.all(COMPANIES.map((company) => searchCfpbComplaints({ company, size: 3 }))).then((results) => {
      if (cancelled) return;
      const rows = results.flatMap((r) => flatten(r.data?.hits));
      setTiles(rows.slice(0, 12));
      setStatus(results.some((r) => r.ok) ? `${rows.length} recent filings` : 'Deploy public-data to load live complaints.');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell hideHero contentWidth="full" title="Complaint board" subtitle="What people just filed with the CFPB.">
      <article className="fc-viewport-floor pb-16">
        <p className="text-3xl font-extrabold text-white">Complaint board</p>
        <p className="mt-3 text-base text-white/75">A mosaic of public CFPB issues — not a score promise. {status}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className={FINELY_OS_PRIMARY_BTN} to="/free-guide">Start free guide</Link>
          <Link className={FINELY_OS_SECONDARY_BTN} to="/enlightenment-session">Book a session</Link>
        </div>
        <div className="fc-complaints-mosaic mt-8">
          {tiles.map((t, i) => (
            <div key={`${t.complaint_id ?? i}`} className={`fc-complaints-tile ${finelyOsCatalogCard(ACCENTS[i % 4])}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">{t.company || 'Company'}</p>
              <h2 className="mt-2 text-xl font-extrabold">{t.issue || t.product || 'Issue on file'}</h2>
              <p className="mt-2 text-base text-white/70">
                {t.state || 'US'} · {t.date_received || 'recent'} · {t.product || 'credit'}
              </p>
            </div>
          ))}
        </div>
        {!tiles.length ? <p className="mt-8 text-base text-white/60">{status}</p> : null}
        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-10`}>Results vary · not legal advice · funding subject to underwriting</p>
        <FinelyOsPageFooter />
      </article>
    </PageShell>
  );
}
