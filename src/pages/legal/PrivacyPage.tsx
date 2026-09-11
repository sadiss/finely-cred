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
    accent: 'sky' as const,
    title: '1. Information we collect',
    body: 'We collect what you give us — name, email, phone, and mailing address when a file needs it. If you upload a credit report, identification, a bureau letter, or supporting evidence, we keep those documents in your account so you can return to them. We also collect basic device and usage data (browser, timestamps, approximate network information) to keep the platform secure and performing.',
  },
  {
    accent: 'violet' as const,
    title: '2. How we use it',
    body: 'We use this information to run the service, to reach you about your file, to meet the law, and to protect the platform. We do not sell personal information to third parties for marketing. If you operate as an agency on Finely Cred, you are responsible for the partner consents required to store or process that partner’s information here.',
  },
  {
    accent: 'emerald' as const,
    title: '3. Data security',
    body: 'We use industry-standard controls: access permissions, HTTPS in transit, and encryption or short-lived links where they fit the workflow. You remain responsible for the strength of your login and the devices you use to open a partner file.',
  },
  {
    accent: 'rose' as const,
    title: '4. Retention',
    body: 'We keep information for as long as the service, the law, a dispute, or our agreements require. You may request deletion of an account and its associated data, subject to those same obligations.',
  },
  {
    accent: 'sky' as const,
    title: '5. Cookies and tracking',
    body: 'We may use cookies and similar tools for sessions, preferences, and analytics. Your browser settings can limit cookies.',
  },
  {
    accent: 'violet' as const,
    title: '6. Your rights',
    body: 'Depending on where you live, you may have the right to access, correct, delete, or port your data, or to opt out of certain uses. Write us to exercise those rights. California residents may also have rights under the CCPA.',
  },
  {
    accent: 'emerald' as const,
    title: '7. Contact',
    body: 'Send privacy questions or requests through the Contact page or the address in the site footer.',
  },
];

export default function PrivacyPage() {
  usePublicSeoMeta({
    title: 'Privacy policy · How Finely Cred handles your information',
    description:
      'How Finely Cred collects, uses, protects, and retains personal information for partners and guests. We do not sell personal information for marketing.',
    path: '/privacy',
  });

  return (
    <PageShell hideHero hideLaunchHelpStrip surface="ivory" contentWidth="full" title="Privacy policy">
      <div data-fc-legal-studio="1">
        <div className="lg-wrap">
          <header className="lg-hero" data-accent="sky">
            <p className="lg-kicker">Legal</p>
            <h1>Privacy policy</h1>
            <p>
              Last updated {new Date(LAST_UPDATED_ISO).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              This page explains what we collect, why we keep it, and how you can ask for it back.
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
          subline="Privacy questions or a data request? Ask the specialist on duty."
          buttonTone="secondary"
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
