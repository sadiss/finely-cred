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
    accent: 'violet' as const,
    title: '1. Acceptance',
    body: 'By using Finely Cred you agree to these terms and to the privacy policy. If you do not agree, do not use the platform.',
  },
  {
    accent: 'sky' as const,
    title: '2. What the service is',
    body: 'Finely Cred provides education and software for credit work — case tracking, document storage, templates, reminders, and reporting insight. We are not a law firm. Use of the platform does not create an attorney-client relationship and is not legal or financial advice. Results vary. We do not promise deletions, score changes, approvals, funding, or timelines.',
  },
  {
    accent: 'emerald' as const,
    title: '3. Your responsibilities',
    body: 'You are responsible for the accuracy of what you enter, for keeping the account secure, and for staying inside the law. You may not use the platform for fraud or any illegal purpose. Agency and white-label operators must have the authority and partner consents required to upload and process that partner’s information, and they remain responsible for their own consumer-protection duties.',
  },
  {
    accent: 'rose' as const,
    title: '4. Payments and third parties',
    body: 'Checkout may run on a card or bank rail, or through a financing partner. Approvals, rates, and repayment schedules belong to that provider. Their terms and privacy policies apply to their services.',
  },
  {
    accent: 'violet' as const,
    title: '5. Confidentiality',
    body: 'Partner files can hold sensitive personal and financial information. Both sides agree to use that information only for authorized workflow and to protect it with reasonable care. Templates, pricing, workflows, and non-public methods remain Finely Cred confidential information.',
  },
  {
    accent: 'sky' as const,
    title: '6. Intellectual property',
    body: 'The content, brand, and technology on the platform belong to Finely Cred or its licensors. You may not copy, modify, or distribute those materials without permission.',
  },
  {
    accent: 'emerald' as const,
    title: '7. Electronic records',
    body: 'You consent to receive agreements and notices electronically. Electronic signatures in the portal have the same effect as handwritten signatures where the law allows.',
  },
  {
    accent: 'rose' as const,
    title: '8. Limitation of liability',
    body: 'To the fullest extent permitted by law, Finely Cred is not liable for indirect, incidental, or consequential damages arising from use of the platform. Total liability is limited to the amount you paid for services in the twelve months before the claim.',
  },
  {
    accent: 'violet' as const,
    title: '9. Disputes',
    body: 'Contact us first and give us a chance to resolve the concern. Any legal claim must proceed as the law allows and as any additional dispute terms you accept at checkout or financing require.',
  },
  {
    accent: 'sky' as const,
    title: '10. Changes',
    body: 'We may update these terms. Continued use after a change is acceptance. Material changes may arrive by email or an in-app notice.',
  },
  {
    accent: 'emerald' as const,
    title: '11. Contact',
    body: 'Questions about these terms go to the Contact page or the address in the site footer.',
  },
];

export default function TermsPage() {
  usePublicSeoMeta({
    title: 'Terms of service · Finely Cred',
    description:
      'The agreement for using Finely Cred — education and software for credit work, not a law firm, and not a promise of a specific outcome.',
    path: '/terms',
  });

  return (
    <PageShell hideHero hideLaunchHelpStrip surface="ivory" contentWidth="full" title="Terms of service">
      <div data-fc-legal-studio="1">
        <div className="lg-wrap">
          <header className="lg-hero" data-accent="violet">
            <p className="lg-kicker">Legal</p>
            <h1>Terms of service</h1>
            <p>
              Last updated {new Date(LAST_UPDATED_ISO).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              Read these terms before you open an account or upload a file.
            </p>
            <Link className="lg-link" to="/privacy">
              Read the privacy policy
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
          subline="Questions about these terms? Ask the specialist on duty."
          buttonTone="secondary"
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
