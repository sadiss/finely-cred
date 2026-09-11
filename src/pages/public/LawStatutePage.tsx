import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { fetchCfrSection } from '../../lib/publicDataClient';
import { POST_JUDGMENT_ECFR_CITES } from '../../lib/ecfrLiveCites';
import './publicAuthorityPages.css';

type PublicStatuteCite = {
  id: string;
  label: string;
  title: string;
  part: string;
  section: string;
  why: string;
  viewerUrl: string;
};

const PUBLIC_STATUTES: PublicStatuteCite[] = [
  {
    id: 'reg-f-1006-34',
    label: 'Reg F — validation notice',
    title: '12',
    part: '1006',
    section: '1006.34',
    why: 'What a debt collector’s validation notice must include.',
    viewerUrl: 'https://www.ecfr.gov/current/title-12/part-1006/section-1006.34',
  },
  {
    id: 'fcra-1022-43',
    label: 'FCRA — furnisher disputes',
    title: '12',
    part: '1022',
    section: '1022.43',
    why: 'How furnishers must handle a direct dispute.',
    viewerUrl: 'https://www.ecfr.gov/current/title-12/part-1022/section-1022.43',
  },
  ...POST_JUDGMENT_ECFR_CITES.map((cite) => ({
    id: cite.id,
    label: cite.label,
    title: cite.title,
    part: cite.part,
    section: cite.section,
    why: cite.why,
    viewerUrl: cite.viewerUrl,
  })),
];

function stripXml(xml: string) {
  return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3600);
}

export default function LawStatutePage() {
  const [selected, setSelected] = useState<PublicStatuteCite>(PUBLIC_STATUTES[0]);
  const [body, setBody] = useState('Pick a statute on the left.');
  const [status, setStatus] = useState('');

  usePublicSeoMeta({
    title: 'What the statute says',
    description: 'Live eCFR excerpts for credit and payment rules. Educational — not legal advice.',
    path: '/resources/law',
    faqs: [
      { q: 'Is this legal advice?', a: 'No. These are official eCFR excerpts. Consult a licensed attorney for legal advice.' },
      { q: 'What should I do after reading?', a: 'Start the free guide and upload a bureau report. Results vary. Not legal advice.' },
    ],
    howTo: {
      name: 'Read a statute, then act on your file',
      description: 'Use the official text, then upload a report.',
      steps: ['Open the section', 'Read the excerpt', 'Start the free guide'],
    },
  });

  useEffect(() => {
    let cancelled = false;
    setStatus('Loading eCFR…');
    void fetchCfrSection({ title: selected.title, part: selected.part, section: selected.section }).then((res) => {
      if (cancelled) return;
      if (res.ok && res.data?.xml) {
        setBody(stripXml(res.data.xml));
        setStatus(`eCFR as of ${res.data.date || 'current'}`);
      } else {
        setBody(selected.why);
        setStatus(res.error === 'not_configured' ? 'Deploy public-data to load live text.' : res.error || 'Excerpt unavailable');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  return (
    <PageShell hideHero contentWidth="full" title="What the statute says" subtitle="Official eCFR text next to the next step.">
      <article className="fc-viewport-floor pb-16">
        <p className="text-3xl font-extrabold text-white">What the statute says</p>
        <p className="mt-3 text-base text-white/75">A statute reader — not a blog post. {status}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className={FINELY_OS_PRIMARY_BTN} to="/free-guide">Start free guide</Link>
          <Link className={FINELY_OS_SECONDARY_BTN} to="/enlightenment-session">Book a session</Link>
        </div>
        <div className="fc-law-reader mt-8">
          <nav className="fc-law-nav" aria-label="Statutes">
            {PUBLIC_STATUTES.map((cite) => (
              <button
                key={cite.id}
                type="button"
                className={finelyOsListItem(selected.id === cite.id, 'violet')}
                onClick={() => setSelected(cite)}
              >
                <div className="font-extrabold">{cite.label}</div>
                <div className="text-sm opacity-70">{cite.why}</div>
              </button>
            ))}
          </nav>
          <div className={finelyOsCatalogCard('sky')}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">{selected.label}</p>
            <h2 className="mt-2 text-2xl font-extrabold">{selected.why}</h2>
            <p className="fc-law-body mt-4 text-white/80">{body}</p>
            <a className="mt-4 inline-block font-bold text-sky-300" href={selected.viewerUrl} target="_blank" rel="noreferrer">
              Open on eCFR
            </a>
          </div>
        </div>
        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-10`}>Results vary · not legal advice · funding subject to underwriting</p>
        <FinelyOsPageFooter />
      </article>
    </PageShell>
  );
}
