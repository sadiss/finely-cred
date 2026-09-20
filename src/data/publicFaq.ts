/** String FAQ copy for FAQPage JSON-LD + prerender snapshots. Matches /faq. */

export type PublicFaqItem = {
  id: string;
  q: string;
  a: string;
};

export const PUBLIC_FAQ_ITEMS: PublicFaqItem[] = [
  {
    id: 'what-is-credit-restore',
    q: 'What is credit restore?',
    a: 'Credit restore is the work of finding information on your reports that may be inaccurate, incomplete, duplicated, or outdated, then challenging it with the bureaus and the companies that furnished it. Accurate, properly verified information can stay on a report. This is not a promise that a score will rise or that an accurate item will be deleted.',
  },
  {
    id: 'getting-started',
    q: 'How do I get started?',
    a: 'Begin with a short intake, then upload your credit reports in the partner portal. You will see the tradelines we detected, the items worth reviewing, and an evidence checklist for the first round. You can also start with a free guide if you want to read first.',
  },
  {
    id: 'reports',
    q: 'What credit reports can I upload?',
    a: 'You can upload HTML or PDF credit reports. We extract tradelines and flag inconsistencies such as dates, balances, or status codes that do not match across the file. If the PDF is scanned, upload the best-quality version or a text-based export.',
  },
  {
    id: 'evidence',
    q: 'What kind of evidence should I upload?',
    a: 'Upload anything that supports your dispute position: ID plus proof of address, payment receipts, account statements, creditor letters, police/FTC reports for identity theft, and bureau mail responses.',
  },
  {
    id: 'credit-repair-disclaimer',
    q: 'Is this legal advice? Do you guarantee results?',
    a: 'No. Finely Cred is not a law firm and does not provide legal advice. We provide education, software tools, letter templates, and a workspace for the file. Results vary. We do not guarantee deletions, approvals, or specific score increases.',
  },
  {
    id: 'what-can-be-removed',
    q: 'Can accurate negative items be removed?',
    a: 'In general, accurate and properly verified information can remain on your reports for the reporting period allowed by law. Disputes focus on accuracy, completeness, duplications, outdated reporting, and verification.',
  },
  {
    id: 'how-long-does-it-take',
    q: 'How long does credit restore take?',
    a: 'Timelines vary. Many workflows operate in rounds: gather documentation, submit challenges, wait for responses, then follow up. Some updates can appear in 30–45 days; complex files take longer. We focus on the quality of the round, not an instant fix.',
  },
  {
    id: 'will-disputes-hurt-score',
    q: 'Will disputing items hurt my score?',
    a: 'Disputing an item does not automatically lower your score. Scores can change when the underlying report data changes. If you are about to apply for credit, consider timing around utilization and new inquiries.',
  },
  {
    id: 'restore-vs-building',
    q: 'What’s the difference between Credit Restore vs Credit Building?',
    a: 'Restore focuses on cleanup: disputing inaccurate or negative reporting and fixing inconsistencies. Building focuses on strengthening: adding or optimizing positive reporting, utilization strategy, and long-term maintenance. Many partners restore first, then build.',
  },
  {
    id: 'late-payments',
    q: 'Can late payments be disputed?',
    a: 'Sometimes — if the reporting is inaccurate, incomplete, duplicated, or not properly verified. If the late payment is accurate, goodwill or other options may still be available, but outcomes vary.',
  },
  {
    id: 'identity-theft',
    q: 'What if I’m dealing with identity theft?',
    a: 'Prioritize safety first: secure accounts, set alerts, and document the event. Consider a fraud alert or credit freeze, collect supporting reports, and track disputes by bureau. Consult a licensed attorney if you need legal advice.',
  },
  {
    id: 'billing',
    q: 'How does billing and module access work?',
    a: 'Each plan unlocks the portal modules you need — reports, documents, disputes, debt, and escalations. You can see what is unlocked under Profile and Billing.',
  },
  {
    id: 'refunds-cancellations',
    q: 'Do you offer refunds or cancellations?',
    a: 'Refund and cancellation policies depend on what you purchased, delivery status, and the terms shown at checkout. Contact support with your email and purchase details if you need help.',
  },
  {
    id: 'business-credit-basics',
    q: 'What is business credit building?',
    a: 'Business credit building establishes a fundable business profile and payment history with vendors and business bureaus. It usually starts with a real entity, vendor accounts opened in a sensible order, and on-time payments. Lenders make independent decisions.',
  },
  {
    id: 'support',
    q: 'How do I contact support?',
    a: 'Partners can use Messages & Support inside the portal. For large attachments, email partnersupport@finelycred.com.',
  },
];
