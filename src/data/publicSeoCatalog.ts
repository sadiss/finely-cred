/** Public route SEO catalog for admin health panel (Phase 35). */

export type PublicSeoRoute = {
  path: string;
  title: string;
  description: string;
  hasSchema?: boolean;
  /** When false, omitted from sitemap.xml (still tracked in admin SEO health). */
  sitemap?: boolean;
};

export const PUBLIC_SEO_CATALOG: PublicSeoRoute[] = [
  {
    path: '/',
    title: 'Finely Cred homepage',
    description: 'Credit restore, business credit, debt strategy, tradelines, and funding readiness operating system.',
    hasSchema: true,
  },
  {
    path: '/enlightenment-session',
    title: 'Book a strategy call',
    description: 'Free consultation for personal credit, business credit, debt, tradelines, and funding paths.',
    hasSchema: true,
  },
  {
    path: '/pricing/personal-credit-restore',
    title: 'Personal credit restore',
    description: 'Dispute letters, bureau sequencing, and a restore path lenders can actually read.',
    hasSchema: true,
  },
  {
    path: '/pricing/privacy-id',
    title: 'Privacy and identity',
    description: 'Freeze, lock, fraud alerts, and broker opt-outs for the name on the credit file.',
    hasSchema: true,
  },
  {
    path: '/pricing/bundles',
    title: 'Program bundles',
    description: 'Combined restore, debt, business, and tradeline programs on one ticket.',
    hasSchema: true,
  },
  {
    path: '/pricing/wealth-builder',
    title: 'Wealth builder',
    description: 'Credit, company file, and capital sequenced for the years after restore.',
    hasSchema: true,
  },
  {
    path: '/resources',
    title: 'Free credit resources',
    description: 'Field guides, dispute templates, and educational downloads.',
    hasSchema: true,
  },
  {
    path: '/resources/videos',
    title: 'Video library',
    description:
      'Finely Cred watch-how tours and resource videos for credit restore, dispute workflows, and funding readiness.',
    hasSchema: true,
  },
  {
    path: '/resources/business-credit-one-sheets',
    title: 'Business Credit Partner One-Sheets',
    description:
      'The 3-sheet Business Credit Process Brief plus premium partner one-sheets — fundability roadmap, tier ladder & capital outlook, four tiers, comparison, and named-cards path PDF downloads.',
    hasSchema: true,
  },
  {
    path: '/resources/personal-credit-restore-sheet',
    title: 'Personal Credit Restore — 3-Sheet Field Kit',
    description:
      'Free 3-sheet personal credit restore field kit: the FCRA and FDCPA rights you invoke, the round-one dispute sequence with reason language and evidence pairing, and the escalation ladder with a 90-day hold plan.',
    hasSchema: true,
  },
  {
    path: '/resources/personal-credit-build-sheet',
    title: 'Personal Credit Build — 2-Sheet Blueprint',
    description:
      'Free 2-sheet personal credit build blueprint: the five-rung instrument ladder from secured card to first unsecured approval, scoring weights, worked utilization math, statement-date timing, and a twelve-month calendar.',
    hasSchema: true,
  },
  {
    path: '/resources/au-teen-credit-sheet',
    title: 'Authorized User & Teen Credit — 2-Sheet Parent Kit',
    description:
      'Free 2-sheet authorized user and teen credit parent kit: issuer minimum ages including the ~13 policies, which issuers commonly report a minor AU, the four gates an AU line must clear, a parent checklist, and the 18th-birthday handoff.',
    hasSchema: true,
  },
  {
    path: '/resources/which-program-fits',
    title: 'Which program fits your situation? — Free outcome wizard',
    description:
      'Answer a few questions about your debt balance, situation, and starting credit score to see which Finely Cred program fits and a real, sample-sized outcome range from documented case studies.',
    hasSchema: true,
  },
  {
    path: '/resources/diy-vs-traditional-vs-finely',
    title: 'DIY vs. Done-For-You vs. Traditional Credit Repair — An Honest Comparison',
    description:
      'A factual, feature-based comparison of pure self-directed DIY dispute work, Finely Cred\u2019s done-for-you programs, and the traditional credit-repair-agency category — price, who does the work, legal grounding, and real documented outcomes.',
    hasSchema: true,
  },
  // ── C1 doctrine articles (debt-litigation, business-credit, non-citizen/international) ──
  // Each of these carries a `ComplianceReviewRecord` (see complianceReviewRepo.ts) that must be
  // flipped to `approved` before the route is considered publish-ready per the C0 compliance gate.
  {
    path: '/resources/debt-defense-validation-letters',
    title: 'Debt Validation Letters & Cease-Communication Rights',
    description:
      'How to demand written debt validation and send a cease-communication letter before a collector sues — by debt type, with the real FDCPA/FCRA citations behind each right.',
    hasSchema: true,
  },
  {
    path: '/resources/debt-defense-summons-answer',
    title: 'Answering a Debt Collection Lawsuit — Deadlines & Affirmative Defenses',
    description:
      'What to do when you are served a summons for credit card, medical, auto, mortgage, student loan, or other debt — answer deadlines, affirmative defenses, and default-judgment risk.',
    hasSchema: true,
  },
  {
    path: '/resources/debt-defense-discovery-demands',
    title: 'Discovery Demands Against a Debt Buyer — Forcing Proof of the Debt',
    description:
      'What to request in discovery once an answer is filed — the original agreement, the full chain of assignment, and account records — and why many debt buyers cannot produce them.',
    hasSchema: true,
  },
  {
    path: '/resources/debt-defense-post-judgment',
    title: 'Post-Judgment Emergencies — Wage Garnishment & Bank Levy Exemptions',
    description:
      'A creditor won a judgment and is moving to garnish wages or levy a bank account — what federal and state law protects, how to claim an exemption, and the deadlines that matter.',
    hasSchema: true,
  },
  {
    path: '/resources/fdcpa-collector-violations',
    title: 'FDCPA Counter-Suits — When the Debt Collector Breaks the Law',
    description:
      'Repeated calls after a cease-and-desist, false statements about a debt, or unfair collection tactics can give you an independent FDCPA claim — how it works and what evidence it needs.',
    hasSchema: true,
  },
  {
    path: '/resources/business-credit-tier-matrix',
    title: 'Business Credit Tier Matrix — The 5-Tier Path From Vendor Credit to Institutional Lines',
    description:
      'Tier 1 no-PG vendor accounts through Tier 5 institutional unsecured lines — real vendor names, Paydex/Intelliscore targets, personal-guarantee release strategy, and common mistakes at each tier.',
    hasSchema: true,
  },
  {
    path: '/resources/business-credit-funding-instruments',
    title: 'Business Funding Instruments — SBA Loans, Lines of Credit, Equipment Financing & More',
    description:
      'Nine business-funding instruments compared: SBA 7(a)/504, lines of credit, equipment financing, invoice factoring, merchant cash advances, term loans, commercial real estate, and card stacking.',
    hasSchema: true,
  },
  {
    path: '/resources/business-credit-building-mistakes',
    title: 'Common Business Credit-Building Mistakes That Trigger Denials',
    description:
      'The mistakes that most often sink a business-credit file at every tier — from over-applying to Tier 1 vendors to carrying high utilization on a new store card — organized by tier.',
    hasSchema: true,
  },
  {
    path: '/resources/non-citizen-business-credit',
    title: 'Non-Citizen & International Business Credit — Funding Paths by Applicant Type',
    description:
      'Business funding paths for ITIN holders, E-2/EB-5 investors, non-resident LLC owners, DACA recipients, and green card holders — underwriting optics, SSN/ITIN requirements, and proof documents.',
    hasSchema: true,
  },
  {
    path: '/resources/international-credit-systems-guide',
    title: 'How Credit Reporting Works Abroad — Canada, UK, Germany & the EU Compared to the U.S.',
    description:
      'Score scales, major bureaus, data-protection regimes, and dispute rights in Canada, the UK, Germany, and the EU generally — compared point-by-point to the U.S. FCRA/FICO system.',
    hasSchema: true,
  },
  // ── C4 state-specific debt-defense landing pages — highest compliance scrutiny in the plan (C0.3).
  // Each carries a `state_landing_page` ComplianceReviewRecord with `highestScrutiny: true` and a
  // 3-month re-verification cadence (vs. 6 months for the C1 articles above); left `needs_review`.
  {
    path: '/resources/debt-defense-texas',
    title: 'Debt Defense in Texas — Federal Rights, Wage Garnishment, and What Actually Varies by State',
    description:
      'Debt collection defense for Texas residents: federal FDCPA and CCPA garnishment-cap protections, the one Texas-specific wage-garnishment note in our doctrine repository, and what still requires a Texas attorney to confirm.',
    hasSchema: true,
  },
  {
    path: '/resources/debt-defense-new-york',
    title: 'Debt Defense in New York — Confession-of-Judgment Protections & Federal Rights',
    description:
      'New York is one of the few states with a documented, specific civil-procedure protection against confessions of judgment (N.Y. C.P.L.R. § 3218) — plus the federal rights every state shares.',
    hasSchema: true,
  },
  {
    path: '/resources/debt-defense-pennsylvania',
    title: 'Debt Defense in Pennsylvania — Federal Rights, Wage Garnishment, and What Actually Varies by State',
    description:
      'Debt collection defense for Pennsylvania residents: federal FDCPA and CCPA garnishment-cap protections, the one Pennsylvania-specific wage-garnishment note in our doctrine repository, and what still requires a Pennsylvania attorney to confirm.',
    hasSchema: true,
  },
  // ── C2 public before/after proof gallery — visual companion to /results (Phase B1). ──
  {
    path: '/results/before-after',
    title: 'Before & after — visual proof gallery',
    description:
      'Real credit-score before/after graphics generated directly from our documented case studies — visual, at-a-glance proof, sourced from the same numbers on our results page.',
    hasSchema: true,
  },
  {
    path: '/bookstore',
    title: 'Finely Cred bookstore',
    description: 'Bundles, courses, and credit mastery books.',
    hasSchema: true,
  },
  {
    path: '/free-guide',
    title: 'Free dispute letter guide',
    description: 'Download the credit dispute letter guide and start your restore journey.',
    hasSchema: true,
  },
  {
    path: '/free-debt-guide',
    title: 'Free debt validation guide',
    description: 'Collections validation playbook — FDCPA workflows, summons checklist, and portal preview.',
    hasSchema: true,
  },
  {
    path: '/haitian',
    title: 'Haitian community · Credit help for Haitian Americans',
    description:
      'Credit help for Haitian Americans — letters, collections, and a next step. Pale Kreyòl.',
    hasSchema: true,
  },
  {
    path: '/kreyol',
    title: 'Haitian community',
    description: 'Credit help for Haitian Americans. Pale Kreyòl. Open a kit. Book a session.',
    hasSchema: true,
  },
  {
    path: '/free-kreyol-guide',
    title: 'Credit kits · Haitian community',
    description: 'Four credit kits for Haitian Americans — what credit is, what the letter says, helping family, church flyer.',
    hasSchema: true,
  },
  {
    path: '/free-kreyol-guide/what-is-credit',
    title: 'What is credit? · Haitian community',
    description: 'Your SSN file, three bureaus, and the words on a U.S. credit report.',
    hasSchema: true,
  },
  {
    path: '/free-kreyol-guide/letter-meaning',
    title: 'What this letter says · Haitian community',
    description: 'A collector or bureau letter, line by line, with a clear Kreyòl meaning.',
    hasSchema: true,
  },
  {
    path: '/free-kreyol-guide/helper',
    title: 'For the person helping · Haitian community',
    description: 'Family and specialists: sit together, one next step, what not to promise.',
    hasSchema: true,
  },
  {
    path: '/free-kreyol-guide/community-flyer',
    title: 'Church / community flyer · Haitian community',
    description: 'One page. One QR. Pale Kreyòl. finelycred.com/haitian',
    hasSchema: true,
  },
  {
    path: '/case-desk-guide',
    title: 'Case Desk Operator Guide',
    description:
      'Free operator handbook for Finely Cred case help — packet anatomy, scope discipline, validate-first playbook, and complaint ladders.',
    hasSchema: true,
  },
  {
    path: '/case-desk-guide/read',
    title: 'Read the Case Desk Operator Guide',
    description: 'Read every chapter of the Case Desk Operator handbook free in your browser.',
    hasSchema: false,
  },
  {
    path: '/free-business-guide',
    title: 'Free business credit guide',
    description: 'Entity hygiene, vendor credit sequencing, and D-U-N-S checklist.',
    hasSchema: true,
  },
  {
    path: '/free-tradeline-guide',
    title: 'Free tradeline insider guide',
    description: 'Authorized user tradelines explained — timing, risk, and restore plan fit.',
    hasSchema: true,
  },
  {
    path: '/free-score-roadmap',
    title: 'Boost Your Credit Score in 72 Hours — Free Guide',
    description:
      'Quick-win credit actions, profile optimization, and a practical 72-hour roadmap for stronger funding readiness.',
    hasSchema: true,
  },
  {
    path: '/free-agency-guide',
    title: 'Free agency white-label guide',
    description: 'Scale a credit services agency with Finely Cred partner OS and compliance workflows.',
    hasSchema: true,
  },
  {
    path: '/credit-specialist',
    title: 'Credit Specialist pricing',
    description: 'You run partner files; Finely supplies the method. Transparent tiers, a 3-lead minimum, and revenue share — no platform fee.',
    hasSchema: true,
  },
  {
    path: '/credit-specialist/join',
    title: 'Join as a Credit Specialist',
    description: 'Commit to the 3-lead minimum, pick a tier, and create your Credit Specialist account.',
    hasSchema: true,
  },
  {
    path: '/credit-specialist-guide',
    title: 'Free Credit Specialist e-guide',
    description: 'A free in-app playbook for Credit Specialists: personal and business credit, debt education, and a clear join path.',
    hasSchema: true,
  },
  {
    path: '/credit-specialist-apply',
    title: 'Credit specialist program',
    description: 'Apply to the Finely Cred specialist network — tools, training, and activation support.',
    hasSchema: true,
  },
  {
    path: '/affiliate-toolkit',
    title: 'Free affiliate toolkit',
    description: 'Referral links, QR kits, and compliant promo templates for Finely Cred partners.',
    hasSchema: true,
  },
  {
    path: '/affiliate',
    title: 'Affiliate program',
    description: 'Earn by referring partners to Finely Cred restore and funding programs.',
    hasSchema: true,
  },
  {
    path: '/partners/refer',
    title: 'Partner referral — credit restore | Finely Cred',
    description:
      'A trusted partner referred you to Finely Cred. Leave your name, email, and phone — we call within 1 business day to map a credit restore and wealth plan.',
    hasSchema: true,
  },
  {
    path: '/partner-refer',
    title: 'Partner referral — credit restore | Finely Cred',
    description:
      'A trusted partner referred you to Finely Cred. Leave your name, email, and phone — we call within 1 business day to map a credit restore and wealth plan.',
    hasSchema: true,
  },
  {
    path: '/credit-specialists',
    title: 'Credit specialists',
    description: 'Join the Finely Cred specialist network and grow your agency.',
    hasSchema: true,
  },
  {
    path: '/pricing/personal-credit-restore',
    title: 'Personal credit restore',
    description: 'DIY and done-for-you personal credit restore with dispute automation.',
    hasSchema: true,
  },
  {
    path: '/pricing/personal-credit-building',
    title: 'Credit building',
    description: 'Build a thicker personal credit file — utilization, tradelines, and maintenance.',
    hasSchema: true,
  },
  {
    path: '/pricing/debt-legal',
    title: 'Debt and legal',
    description: 'Validation desk for collections, summons, and foreclosure — require proof first.',
    hasSchema: true,
  },
  {
    path: '/tradelines',
    title: 'Tradelines',
    description: 'Authorized-user seats and Equifax installment tradelines — check open seats, packages, and posting windows.',
    hasSchema: true,
  },
  {
    path: '/au/marketplace',
    title: 'AU tradeline marketplace',
    description: 'Browse authorized user tradelines and submit buyer intake.',
    hasSchema: true,
  },
  {
    path: '/au/request',
    title: 'AU tradeline request',
    description: 'Structured buyer intake for authorized user tradeline placement.',
    hasSchema: true,
  },
  {
    path: '/au/orders',
    title: 'AU order tracking',
    description: 'Track authorized user tradeline order status and fulfillment.',
    hasSchema: true,
    sitemap: false,
  },
  {
    path: '/agency/signup',
    title: 'Agency white-label signup',
    description: 'Launch a credit services agency on Finely Cred partner OS.',
    hasSchema: true,
  },
  {
    path: '/about',
    title: 'About Finely Cred',
    description: 'Credit systems architecture since 2014 — DIY and done-for-you restore, funding, and partner OS.',
    hasSchema: true,
  },
  {
    path: '/resources/rules-this-week',
    title: 'Rules this week',
    description: 'Federal Register items on credit, collections, and consumer finance. Educational — not legal advice.',
    hasSchema: true,
  },
  {
    path: '/resources/complaints',
    title: 'Complaint board',
    description: 'CFPB complaint issues for major bureaus and collectors — educational counts, no promises.',
    hasSchema: true,
  },
  {
    path: '/resources/law',
    title: 'What the statute says',
    description: 'Live eCFR excerpts for credit and payment rules. Educational — not legal advice.',
    hasSchema: true,
  },
  {
    path: '/resources/debt-opinions',
    title: 'Debt opinions — education',
    description: 'How summons and collection opinions show up in public sources. Educational — not legal advice.',
    hasSchema: true,
  },
  {
    path: '/resources/funding/tx',
    title: 'Funding pressure in TX',
    description: 'HMDA mortgage originations and SBA activity for Texas. Funding subject to underwriting.',
    hasSchema: true,
  },
  {
    path: '/resources/funding/ca',
    title: 'Funding pressure in CA',
    description: 'HMDA mortgage originations and SBA activity for California. Funding subject to underwriting.',
    hasSchema: true,
  },
  {
    path: '/resources/funding/ny',
    title: 'Funding pressure in NY',
    description: 'HMDA mortgage originations and SBA activity for New York. Funding subject to underwriting.',
    hasSchema: true,
  },
  {
    path: '/resources/funding/fl',
    title: 'Funding pressure in FL',
    description: 'HMDA mortgage originations and SBA activity for Florida. Funding subject to underwriting.',
    hasSchema: true,
  },
  {
    path: '/resources/funding/il',
    title: 'Funding pressure in IL',
    description: 'HMDA mortgage originations and SBA activity for Illinois. Funding subject to underwriting.',
    hasSchema: true,
  },
  {
    path: '/resources/funding/ga',
    title: 'Funding pressure in GA',
    description: 'HMDA mortgage originations and SBA activity for Georgia. Funding subject to underwriting.',
    hasSchema: true,
  },
  {
    path: '/resources/funding/pa',
    title: 'Funding pressure in PA',
    description: 'HMDA mortgage originations and SBA activity for Pennsylvania. Funding subject to underwriting.',
    hasSchema: true,
  },
  {
    path: '/resources/funding/oh',
    title: 'Funding pressure in OH',
    description: 'HMDA mortgage originations and SBA activity for Ohio. Funding subject to underwriting.',
    hasSchema: true,
  },
  {
    path: '/resources/funding/nc',
    title: 'Funding pressure in NC',
    description: 'HMDA mortgage originations and SBA activity for North Carolina. Funding subject to underwriting.',
    hasSchema: true,
  },
  {
    path: '/resources/funding/az',
    title: 'Funding pressure in AZ',
    description: 'HMDA mortgage originations and SBA activity for Arizona. Funding subject to underwriting.',
    hasSchema: true,
  },
  {
    path: '/faq',
    title: 'FAQ',
    description: 'Answers about credit restore, disputes, tradelines, billing, and the Finely Cred platform.',
    hasSchema: true,
  },
  {
    path: '/contact',
    title: 'Contact Finely Cred',
    description: 'Reach support, sales, or partnerships — we respond within one business day.',
    hasSchema: true,
  },
  {
    path: '/terms',
    title: 'Terms of service',
    description: 'Finely Cred terms of service and platform usage agreement.',
    hasSchema: true,
  },
  {
    path: '/privacy',
    title: 'Privacy policy',
    description: 'How Finely Cred collects, uses, and protects your personal information.',
    hasSchema: true,
  },
  {
    path: '/disclaimer',
    title: 'Disclaimer',
    description: 'Educational services disclaimer — not legal advice or credit repair guarantees.',
    hasSchema: true,
  },
  {
    path: '/testimonials',
    title: 'Partner success stories',
    description: 'Real stories from Finely Cred partners — credit restore, funding readiness, and results-driven workflows.',
    hasSchema: true,
  },
  {
    path: '/events',
    title: 'Events & workshops',
    description: 'Live workshops and community sessions for credit and funding education.',
    hasSchema: true,
  },
  {
    path: '/claim',
    title: 'Claim your partner profile',
    description: 'Connect your imported Finely Cred profile to your account and resume your journey.',
    hasSchema: true,
  },
  {
    path: '/unsubscribe',
    title: 'Unsubscribe from marketing',
    description: 'Opt out of Finely Cred promotional email and SMS.',
    hasSchema: true,
    sitemap: false,
  },
  {
    path: '/services',
    title: 'Services & packages',
    description: 'Personal restore, business credit, debt strategy, tradelines, and partnership tiers.',
    hasSchema: true,
  },
  {
    path: '/credit/new-york-ny',
    title: 'Credit restore in New York, NY',
    description: 'Collections volume in a dense metro — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/los-angeles-ca',
    title: 'Credit restore in Los Angeles, CA',
    description: 'Auto and medical mix on the file — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/chicago-il',
    title: 'Credit restore in Chicago, IL',
    description: 'Municipal and utility reporting — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/houston-tx',
    title: 'Credit restore in Houston, TX',
    description: 'Paycheck swings and revolving use — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/phoenix-az',
    title: 'Credit restore in Phoenix, AZ',
    description: 'Growth-market thin files — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/philadelphia-pa',
    title: 'Credit restore in Philadelphia, PA',
    description: 'Older tradelines and student mix — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/san-antonio-tx',
    title: 'Credit restore in San Antonio, TX',
    description: 'Military and multi-state history — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/san-diego-ca',
    title: 'Credit restore in San Diego, CA',
    description: 'Housing cost vs revolving load — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/dallas-tx',
    title: 'Credit restore in Dallas, TX',
    description: 'Business and personal file crossover — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/san-jose-ca',
    title: 'Credit restore in San Jose, CA',
    description: 'High-income thin-file paradox — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/austin-tx',
    title: 'Credit restore in Austin, TX',
    description: 'New-city address churn in Travis County — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/jacksonville-fl',
    title: 'Credit restore in Jacksonville, FL',
    description: 'Insurance and auto furnishers — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/fort-worth-tx',
    title: 'Credit restore in Fort Worth, TX',
    description: 'Dallas–Fort Worth file split and mixed furnisher addresses — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/columbus-oh',
    title: 'Credit restore in Columbus, OH',
    description: 'Student and medical overlap — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/charlotte-nc',
    title: 'Credit restore in Charlotte, NC',
    description: 'Banking-hub inquiries and same-month product shopping — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/san-francisco-ca',
    title: 'Credit restore in San Francisco, CA',
    description: 'High-limit cards, high utilization — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/indianapolis-in',
    title: 'Credit restore in Indianapolis, IN',
    description: 'Auto-heavy Midwest files with installment and late-pay mix — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/seattle-wa',
    title: 'Credit restore in Seattle, WA',
    description: 'Tech-income vs thin history — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/denver-co',
    title: 'Credit restore in Denver, CO',
    description: 'Front Range new-account spikes — start the free guide before opening more products.',
    hasSchema: true,
  },
  {
    path: '/credit/washington-dc',
    title: 'Credit restore in Washington, DC',
    description: 'Federal and contractor mobility — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/atlanta-ga',
    title: 'Credit restore in Atlanta, GA',
    description: 'Banking-hub files with a southern collection mix — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/detroit-mi',
    title: 'Credit restore in Detroit, MI',
    description: 'Auto lending and insurance on one file — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/miami-fl',
    title: 'Credit restore in Miami, FL',
    description: 'Condo, HOA, and multi-country address history — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/resources/complaint-study',
    title: 'What public CFPB filings show',
    description:
      'A live sample of CFPB complaint issues for bureaus and collectors. The number on screen is the sample — not a larger unseen pool.',
    hasSchema: true,
  },
  {
    path: '/resources/pins',
    title: 'Pin these field kits',
    description: 'Pinterest-ready titles for Finely Cred field kits and free guides. Education only — results vary.',
    hasSchema: true,
  },
  {
    path: '/credit-lab',
    title: 'Credit Lab',
    description: 'Ask Finely in the room that matches your file. Site chat captures the conversation — no second messenger.',
    hasSchema: true,
  },
  {
    path: '/credit/boston-ma',
    title: 'Credit restore in Boston, MA',
    description: 'Student loans next to old medical in Greater Boston — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/baltimore-md',
    title: 'Credit restore in Baltimore, MD',
    description: 'Port-city collections and utility mix on the DC corridor — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/nashville-tn',
    title: 'Credit restore in Nashville, TN',
    description: 'Gig income and new-account bursts — start the free guide before opening more products.',
    hasSchema: true,
  },
  {
    path: '/credit/las-vegas-nv',
    title: 'Credit restore in Las Vegas, NV',
    description: 'Hospitality hours versus revolving load — start the free guide.',
    hasSchema: true,
  },
  {
    path: '/credit/portland-or',
    title: 'Credit restore in Portland, OR',
    description: 'Relocation files with thin local history — start the free guide.',
    hasSchema: true,
  },
];

/** Paths indexed for sitemap generation (Phase 35). */
export const PUBLIC_SEO_PATHS = PUBLIC_SEO_CATALOG.filter((r) => r.sitemap !== false).map((r) => r.path);
