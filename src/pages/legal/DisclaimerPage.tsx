import React from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import './legalStudio.css';

const LAST_UPDATED_ISO = '2026-02-05';
const ARTICLES = [
  {
    accent: 'rose' as const,
    title: 'Not legal or financial advice',
    body: 'Finely Cred teaches credit work and gives you the software to run it. We do not act as your attorney or financial advisor. For a legal or tax question that belongs to your facts and your state, speak with a licensed professional.',
  },
  {
    accent: 'sky' as const,
    title: 'Templates and generated text',
    body: 'Letters, scripts, and any text the platform drafts are educational workflow aids. You decide whether to send them. If you need representation, hire counsel licensed in the right jurisdiction.',
  },
  {
    accent: 'violet' as const,
    title: 'Outcomes vary',
    body: 'Bureaus, furnishers, collectors, and underwriters make their own decisions. We do not promise a score change, a deletion, an approval, or a funding result.',
  },
  {
    accent: 'emerald' as const,
    title: 'Third-party services',
    body: 'Payment processors, financing partners, and monitoring tools operate under their own terms. We do not control those services.',
  },
  {
    accent: 'rose' as const,
    title: 'Accuracy',
    body: 'We work to keep the platform current. You still verify dates, balances, and legal requirements with the bureau, the creditor, or your advisor.',
  },
  {
    accent: 'sky' as const,
    title: 'Debt and court calendars',
    body: 'Validation letters and collection responses do not create an attorney-client relationship and do not stop a court deadline. You remain responsible for service, filing, payment, settlement, or litigation decisions.',
  },
  {
    accent: 'violet' as const,
    title: 'Contact',
    body: 'Questions about this disclaimer go to the Contact page or the address in the site footer.',
  },
];

export default function DisclaimerPage() {
  usePublicSeoMeta({
    title: 'Disclaimer · Educational credit tools, not legal advice',
    description:
      'Finely Cred is education and workflow software. Outcomes vary. This is not legal advice and not a promise of score changes, deletions, or funding.',
    path: '/disclaimer',
  });

  return (
    <PageShell hideHero hideLaunchHelpStrip surface="ivory" contentWidth="full" title="Disclaimer">
      <div data-fc-legal-studio="1">
        <div className="lg-wrap">
          <header className="lg-hero" data-accent="rose">
            <p className="lg-kicker">Legal</p>
            <h1>Disclaimer</h1>
            <p>
              Last updated {new Date(LAST_UPDATED_ISO).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              Read this before you treat a template, a chat reply, or a package page as a promise.
            </p>
            <Link className="lg-link" to="/terms">
              Read the terms of service
            </Link>
          </header>
          {ARTICLES.map((article) => (
            <article key={article.title} className="lg-article" data-fc-accent={article.accent}>
              <h2>{article.title}</h2>
              <p>{article.body}</p>
            </article>
          ))}
        </div>
        <MarketingStaffChatStrip
          roleId="support_specialist"
          goal="not_sure"
          roleLabel="partner success specialist"
          subline="Need the scope of the work stated plainly? Ask the specialist on duty."
          buttonTone="secondary"
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
