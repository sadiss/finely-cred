import React, { useEffect, useMemo, useState } from 'react';
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
const KPI_ACCENTS = ['emerald', 'violet', 'sky', 'rose', 'emerald'] as const;
const RAIL_ACCENTS = ['violet', 'sky', 'rose', 'emerald'] as const;

function flatten(hits?: { hits?: Array<{ _source?: CfpbComplaintHit }> }): CfpbComplaintHit[] {
  return (hits?.hits ?? []).map((h) => h._source).filter((s): s is CfpbComplaintHit => Boolean(s));
}

export default function ComplaintStudyPage() {
  const [rows, setRows] = useState<CfpbComplaintHit[]>([]);
  const [status, setStatus] = useState('Loading public CFPB filings…');

  usePublicSeoMeta({
    title: 'What public CFPB filings show',
    description:
      'A live sample of CFPB complaint issues for bureaus and collectors. Counts are the filings we loaded — not a national census. Not legal advice.',
    path: '/resources/complaint-study',
    faqs: [
      { q: 'Did you read 10,000 complaints?', a: 'We show the public sample this page loaded. The number on screen is the sample size — not a larger unseen pool.' },
      { q: 'Does a filing mean the company is wrong?', a: 'No. A complaint is a filing, not a finding. Results vary. Not legal advice.' },
    ],
  });

  useEffect(() => {
    let cancelled = false;
    void Promise.all(COMPANIES.map((company) => searchCfpbComplaints({ company, size: 20 }))).then((results) => {
      if (cancelled) return;
      const next = results.flatMap((r) => flatten(r.data?.hits));
      setRows(next);
      setStatus(
        results.some((r) => r.ok)
          ? `${next.length} public filings in this sample`
          : 'Deploy public-data to load the live sample.',
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const byCompany = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = row.company || 'Unnamed company';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [rows]);

  const byIssue = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = row.issue || row.product || 'Issue on file';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [rows]);

  return (
    <PageShell hideHero contentWidth="full" title="Complaint study" subtitle="Public CFPB filings — the sample is the study.">
      <article className="fc-viewport-floor pb-16">
        <p className="text-3xl font-extrabold text-white">What public filings show</p>
        <p className="mt-3 text-base text-white/75">
          A control room of bureau and collector issues from the CFPB. {status}. This is education — not a finding against any company.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className={FINELY_OS_PRIMARY_BTN} to="/free-guide">Start free guide</Link>
          <Link className={FINELY_OS_SECONDARY_BTN} to="/resources/complaints">Open the board</Link>
        </div>

        <div className="fc-study-control mt-10">
          <div className="fc-study-kpis">
            {byCompany.length ? (
              byCompany.map(([name, count], i) => (
                <div key={name} className={finelyOsCatalogCard(KPI_ACCENTS[i % 4])}>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50">{name}</p>
                  <p className="mt-2 text-4xl font-extrabold">{count}</p>
                  <p className="mt-2 text-base text-white/70">filings in this sample</p>
                </div>
              ))
            ) : (
              <div className={finelyOsCatalogCard('sky')}>
                <p className="text-xl font-extrabold">Sample not loaded</p>
                <p className="mt-2 text-base text-white/75">{status}</p>
              </div>
            )}
          </div>
          <aside className="fc-study-rail" aria-label="Top issues">
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Issues that show up</p>
            {byIssue.length ? (
              byIssue.map(([issue, count], i) => (
                <div key={issue} className={finelyOsCatalogCard(RAIL_ACCENTS[i % 4])}>
                  <p className="text-lg font-extrabold">{issue}</p>
                  <p className="mt-1 text-base text-white/70">{count} in this sample</p>
                </div>
              ))
            ) : (
              <div className={finelyOsCatalogCard('violet')}>
                <p className="text-base">Issue rail fills when public-data is live.</p>
              </div>
            )}
          </aside>
        </div>

        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-10`}>
          Results vary · not legal advice · funding subject to underwriting · a complaint is a filing, not a verdict
        </p>
        <FinelyOsPageFooter />
      </article>
    </PageShell>
  );
}
