import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer, WhatMakesDifferentSection } from '../../components/landing';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import './aboutPage.css';

type AboutNavView = 'consultation' | 'pricing' | 'resources';

export interface AboutPageProps {
  onNavigate: (view: AboutNavView) => void;
  onFooterNavigate: (page: string) => void;
}

const TIMELINE = [
  {
    year: '2014',
    title: 'A credit practice, not a tip sheet',
    body: 'Finely Cred opens so partners can work a file with evidence, sequenced letters, and a path toward funding — not scattered advice.',
    accent: 'emerald' as const,
    side: 'left' as const,
  },
  {
    year: '2016',
    title: 'Proof stays with the file',
    body: 'Every restore file gets a proof pack, a timeline, and tagged documents so the next letter rests on what the report actually shows.',
    accent: 'violet' as const,
    side: 'right' as const,
  },
  {
    year: '2018',
    title: 'Work it yourself, or we run the work',
    body: 'Partners who want to work the file themselves get the portal. Complex files get a team that executes. Same method, two ways to use it.',
    accent: 'sky' as const,
    side: 'left' as const,
  },
  {
    year: '2020',
    title: 'Debt paper gets its own desk',
    body: 'Validation and dispute workflows expand so collections and summons get a dated file of their own. This is education and process, not a law firm.',
    accent: 'rose' as const,
    side: 'right' as const,
  },
  {
    year: '2022',
    title: 'One partner workspace',
    body: 'Dashboard, disputes, letters, and the Communication Hub sit in one place so restore work, funding prep, and team updates stay together.',
    accent: 'emerald' as const,
    side: 'left' as const,
  },
  {
    year: '2024',
    title: 'Tradelines as a planned lever',
    body: 'Authorized-user listings and primary installment education join the practice — enhancement with clear rules, not a shortcut sold as a score jump.',
    accent: 'violet' as const,
    side: 'right' as const,
  },
  {
    year: 'Today',
    title: 'Ready for capital, not only a cleaner score',
    body: 'Personal restore, business credit, and funding sequencing now live under one roof so a stable file can become a file a lender can actually read.',
    accent: 'sky' as const,
    side: 'left' as const,
  },
];

const STATS = [
  { k: 'Operating since', v: '2014' },
  { k: 'How you work', v: 'Your pace or ours' },
  { k: 'What we keep', v: 'Proof on file' },
  { k: 'Where it leads', v: 'Funding ready' },
];

const CAPABILITIES = [
  { t: 'Personal and business credit', d: 'We clean the personal file, sequence business vendors, and get the profile ready for a real underwrite.' },
  { t: 'Debt and validation', d: 'We help you demand proof, keep a dated file, and choose the next packet. This is education and workflow, not legal advice.' },
  { t: 'Authorized-user tradelines', d: 'Verified revolving inventory and primary-installment education when a broader restore plan calls for them.' },
  { t: 'Funding readiness', d: 'Once the file is stable, we sequence the next capital step — business credit, payment plans, and lender-ready documents.' },
];

const ACCENT_TEXT: Record<string, string> = {
  emerald: 'text-emerald-400 border-emerald-400',
  violet: 'text-violet-400 border-violet-400',
  sky: 'text-sky-400 border-sky-400',
  rose: 'text-rose-400 border-rose-400',
};

export default function AboutPage({ onNavigate, onFooterNavigate }: AboutPageProps) {
  usePublicSeoMeta({
    title: 'About Finely Cred',
    description:
      'Since 2014, Finely Cred has helped partners restore credit, organize disputes, and prepare for funding — with self-guided tools or a team that runs the work.',
    path: '/about',
    faqs: [
      { q: 'What does Finely Cred do?', a: 'We help partners restore credit, organize disputes, understand debt paper, and prepare for funding. Results vary. Not legal advice.' },
      { q: 'Do you guarantee score or funding results?', a: 'No. We do not promise score changes, approvals, or funding amounts. Funding is subject to underwriting.' },
    ],
  });

  return (
    <div className="fc-about min-h-screen pt-28 pb-0">
      <header className="fc-about-hero fc-viewport-floor">
        <p className="fc-about-kicker">About Finely Cred</p>
        <h1 className="fc-about-title">We restore credit files. Then we make them fundable.</h1>
        <p className="fc-about-lead">
          Since <strong className="text-white">2014</strong>, Finely Cred has helped partners turn a messy report into a
          dated file of evidence, letters, and next steps — whether you work the portal yourself or we run the work with
          you.
        </p>
        <div className="fc-about-actions">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => onNavigate('consultation')}>
            Book a session <ArrowRight size={16} />
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onNavigate('pricing')}>
            Explore pricing <ArrowRight size={16} />
          </button>
          <Link className={FINELY_OS_SECONDARY_BTN} to="/free-guide">
            Start free guide <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <div className="fc-viewport-floor">
        <div className="fc-about-stats">
          {STATS.map((s, i) => {
            const accent = (['emerald', 'violet', 'sky', 'rose'] as const)[i % 4];
            return (
              <div key={s.k} className={finelyOsCatalogCard(accent)} data-fc-accent={accent}>
                <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/55">{s.k}</div>
                <div className="mt-2 text-3xl font-extrabold text-white">{s.v}</div>
              </div>
            );
          })}
        </div>
        <p className={`mt-4 px-6 ${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
          Results vary · not legal advice · funding subject to underwriting
        </p>

        <div className="fc-about-partner-band">
          <div className="text-xs font-extrabold uppercase tracking-[0.24em] text-violet-300">What is a Finely partner?</div>
          <p className="mt-3 text-base leading-relaxed text-white/80">
            A <strong className="text-white">partner</strong> is anyone working with Finely Cred on restore, funding, or
            education — self-guided portal access, a team that runs the file, or both. After you onboard, the portal and
            Communication Hub unlock under that same name.
          </p>
        </div>

        <section className="fc-about-timeline-wrap" aria-label="Finely Cred journey since 2014">
          <div className="fc-about-spine" aria-hidden="true" />
          <div className="fc-about-milestones">
            {TIMELINE.map((m) => {
              const card = (
                <div className={`fc-about-milestone-card ${finelyOsCatalogCard(m.accent)}`} data-fc-accent={m.accent}>
                  <h3>{m.title}</h3>
                  <p>{m.body}</p>
                </div>
              );
              const empty = <div className="fc-about-milestone-side--empty" />;
              return (
                <div key={m.year} className="fc-about-milestone">
                  {m.side === 'left' ? card : empty}
                  <div className={`fc-about-year-node ${ACCENT_TEXT[m.accent]}`}>{m.year}</div>
                  {m.side === 'right' ? card : empty}
                </div>
              );
            })}
          </div>
        </section>

        <section className="px-6 pb-4">
          <div className={`${finelyOsCatalogCard('emerald')} p-8`}>
            <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>What we do</h2>
            <p className={`mt-4 text-base leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>
              We help partners improve the file, lower friction at underwriting, and get ready to borrow through a
              structured process: learn the report, keep the proof, run the letters, then choose the next funding step. We
              do not sell magic. We sell the work.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {CAPABILITIES.map((x, i) => {
                const accent = (['violet', 'sky', 'rose', 'emerald'] as const)[i % 4];
                return (
                  <div key={x.t} className={finelyOsCatalogCard(accent)} data-fc-accent={accent}>
                    <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{x.t}</div>
                    <div className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>{x.d}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="fc-about-operate px-6">
          <div className={`${finelyOsCatalogCard('rose')} p-8`}>
            <h2 className="text-3xl font-extrabold text-white">How we operate</h2>
            <ul>
              <li>
                <strong className="text-white">Evidence first</strong> — We organize proof packs and track timelines so
                every letter rests on what the report shows.
              </li>
              <li>
                <strong className="text-white">Fit before financing</strong> — For payment plans and primary tradelines, we
                confirm the file can carry the product before we recommend it.
              </li>
              <li>
                <strong className="text-white">Honest process</strong> — We do not promise score changes, approvals, or
                funding amounts. We promise a file you can actually work.
              </li>
            </ul>
          </div>
        </section>

        <WhatMakesDifferentSection />

        <section className="fc-about-cta-band">
          <h2 className="text-3xl font-extrabold leading-tight text-white">
            Start with the free guide, or sit with the team.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/70">
            If the file is messy, begin with the dispute guide. If you already know you want a specialist, book a session.
          </p>
          <div className="fc-about-cta-grid">
            {[
              { t: 'Evidence vault', d: 'Upload, tag, and keep proof organized by dispute and timeline.' },
              { t: 'Letter studio', d: 'Write dispute letters from factual findings, then keep every round in one place.' },
              { t: 'Tasks and milestones', d: 'Stay on sequence with checklists, deadlines, and a clear next step.' },
            ].map((x, i) => {
              const accent = (['emerald', 'violet', 'sky'] as const)[i % 3];
              return (
                <div key={x.t} className={finelyOsCatalogCard(accent)} data-fc-accent={accent}>
                  <div className="text-lg font-extrabold text-white">{x.t}</div>
                  <div className="mt-2 text-base text-white/75">{x.d}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className={FINELY_OS_PRIMARY_BTN} to="/free-guide">
              Start free guide <ArrowRight size={16} />
            </Link>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onNavigate('consultation')}>
              Book a session <ArrowRight size={16} />
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onNavigate('pricing')}>
              Explore pricing <ArrowRight size={16} />
            </button>
          </div>
          <div className="fc-about-trust">
            <span>
              <span className="fc-about-trust-dot bg-emerald-400" /> SSL secured
            </span>
            <span>
              <span className="fc-about-trust-dot bg-violet-400" /> Verified business
            </span>
            <span>
              <span className="fc-about-trust-dot bg-sky-400" /> Data protected
            </span>
            <span>
              <span className="fc-about-trust-dot bg-rose-400" /> FCRA compliant
            </span>
          </div>
          <button type="button" className={`mt-6 ${FINELY_OS_SECONDARY_BTN}`} onClick={() => onNavigate('resources')}>
            Explore resources <ArrowRight size={14} />
          </button>
        </section>
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-8 pt-10">
        <MarketingStaffChatStrip
          roleId="finely_advisor"
          goal="not_sure"
          roleLabel="credit restoration specialist"
          subline="New to Finely Cred? Ask which path fits your file — restore, debt paper, business credit, or a session with the team."
          buttonTone="secondary"
        />
      </div>

      <Footer onNavigate={onFooterNavigate} />
    </div>
  );
}
