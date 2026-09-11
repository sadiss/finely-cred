import React, { useState } from 'react';
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
import { PUBLIC_DEDICATED_SHEET_PAGES, PUBLIC_FEATURED_FREE_GUIDES } from '../../config/publicResourcesHub';
import './publicAuthorityPages.css';

const EXTRA = [
  { title: 'What the statute says', desc: 'Live eCFR excerpts. Educational only.', path: '/resources/law', pin: 'Statute reader — start here before you write a letter.', accent: 'sky' as const },
  { title: 'Complaint study', desc: 'Public CFPB sample counts.', path: '/resources/complaint-study', pin: 'A filing is not a verdict. See the sample.', accent: 'rose' as const },
];

const PINS = [
  ...PUBLIC_DEDICATED_SHEET_PAGES.map((s, i) => ({
    title: s.title,
    desc: s.desc,
    path: s.path,
    pin: `${s.title} (${s.sheetLabel}). Free at finelycred.com${s.path}`,
    accent: (['emerald', 'violet', 'sky'] as const)[i % 3],
  })),
  ...PUBLIC_FEATURED_FREE_GUIDES.slice(0, 4).map((g, i) => ({
    title: g.title,
    desc: g.desc,
    path: g.path,
    pin: `${g.title}. Start at finelycred.com${g.path} — results vary.`,
    accent: (['rose', 'emerald', 'violet', 'sky'] as const)[i % 4],
  })),
  ...EXTRA,
];

export default function PinWallPage() {
  const [copied, setCopied] = useState<string | null>(null);

  usePublicSeoMeta({
    title: 'Pin these field kits',
    description: 'Pinterest-ready titles for Finely Cred field kits and free guides. Education only — results vary.',
    path: '/resources/pins',
    faqs: [
      { q: 'Are these paid ads?', a: 'No. Copy the pin text and post it yourself. We do not run paid Pinterest ads from this page.' },
      { q: 'Do you guarantee results?', a: 'No. Results vary. Not legal advice. Funding subject to underwriting.' },
    ],
  });

  const copyPin = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <PageShell hideHero contentWidth="full" title="Pin wall" subtitle="Field kits sized for Pinterest — not a second resource list.">
      <article className="fc-viewport-floor pb-16">
        <p className="text-3xl font-extrabold text-white">Pin these field kits</p>
        <p className="mt-3 text-base text-white/75">
          Copy the pin text, then open the kit. One purpose per pin.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className={FINELY_OS_PRIMARY_BTN} to="/free-guide">Start free guide</Link>
          <Link className={FINELY_OS_SECONDARY_BTN} to="/resources/one-sheets">All one-sheets</Link>
        </div>
        <div className="fc-pin-wall mt-10">
          {PINS.map((pin) => (
            <article key={pin.path} className={`fc-pin-card ${finelyOsCatalogCard(pin.accent)}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">Pin</p>
              <h2 className="mt-2 text-2xl font-extrabold">{pin.title}</h2>
              <p className="mt-2 text-base text-white/75">{pin.desc}</p>
              <p className="mt-4 text-sm font-semibold text-white/85">{pin.pin}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => copyPin(pin.pin, pin.path)}>
                  {copied === pin.path ? 'Copied' : 'Copy pin text'}
                </button>
                <Link className={FINELY_OS_SECONDARY_BTN} to={pin.path}>Open kit</Link>
              </div>
            </article>
          ))}
        </div>
        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-10`}>Results vary · not legal advice · funding subject to underwriting</p>
        <FinelyOsPageFooter />
      </article>
    </PageShell>
  );
}
