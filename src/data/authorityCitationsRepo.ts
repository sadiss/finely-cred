/**
 * Statutory-authority / footnote citation pack — Deep Marketing & Proof Intelligence Sprint (Phase 2).
 *
 * Citations are for informational/marketing-support purposes only — not a substitute for legal
 * advice. Verify current statute text and case status before relying on any citation in an actual
 * filing. Case precedents included below are real, well-known, and cited at a general holding
 * level; always confirm current treatment (subsequent history, circuit split, overruling) before
 * use in litigation.
 *
 * This pack backs:
 * - The Letter Studio "Legal authority" reference panel (footnote-ready text per letter spec).
 * - Marketing/compliance copy that needs a plain-English, no-guarantee summary of a legal right.
 */

import type { PricingCategory } from '../config/pricingCatalog';

export interface AuthorityCitation {
  id: string;
  serviceCategory: PricingCategory | 'dispute_letters' | 'debt_summons';
  /** e.g. "Reinvestigation timeline", "Furnisher duty to investigate", "Validation notice" */
  topic: string;
  /** e.g. "15 U.S.C. § 1681i(a)(1)(A)" */
  statuteOrRegulation: string;
  /** Only REAL, well-known, verifiable precedents — never fabricated. */
  casePrecedent?: string;
  /** e.g. "CFPB Bulletin 2013-09" */
  agencyGuidance?: string;
  /** Full formal citation text suitable as a letter footnote. */
  footnoteText: string;
  /** One plain-English sentence, no guarantees, compliant for public-facing use. */
  marketingSafeSummary: string;
}

export const AUTHORITY_CITATIONS: AuthorityCitation[] = [
  // ── FCRA — dispute / reinvestigation rights ──────────────────────────────
  {
    id: 'fcra-1681i-reinvestigation-timeline',
    serviceCategory: 'dispute_letters',
    topic: 'Reinvestigation timeline',
    statuteOrRegulation: '15 U.S.C. § 1681i(a)(1)(A)',
    casePrecedent: 'Cushman v. Trans Union Corp., 115 F.3d 220 (3d Cir. 1997)',
    footnoteText:
      '15 U.S.C. § 1681i(a)(1)(A) (Fair Credit Reporting Act § 611) requires a consumer reporting agency to conduct a reasonable reinvestigation of disputed information, generally within 30 days of receiving the dispute, free of charge. See also Cushman v. Trans Union Corp., 115 F.3d 220 (3d Cir. 1997) (reinvestigation duty may require going beyond the original furnisher when circumstances suggest the source may be unreliable).',
    marketingSafeSummary:
      'Federal law gives you the right to dispute inaccurate credit report items and have the bureau investigate — typically within about 30 days.',
  },
  {
    id: 'fcra-1681i-deletion-unverifiable',
    serviceCategory: 'dispute_letters',
    topic: 'Deletion of unverifiable information',
    statuteOrRegulation: '15 U.S.C. § 1681i(a)(5)(A)',
    footnoteText:
      '15 U.S.C. § 1681i(a)(5)(A) requires a consumer reporting agency to promptly delete or modify disputed information that is found to be inaccurate, incomplete, or that cannot be verified.',
    marketingSafeSummary:
      'If a bureau can\u2019t verify a disputed item, the law requires it to be corrected or removed.',
  },
  {
    id: 'fcra-1681i-notice-of-results',
    serviceCategory: 'dispute_letters',
    topic: 'Notice of reinvestigation results',
    statuteOrRegulation: '15 U.S.C. § 1681i(a)(6)',
    footnoteText:
      '15 U.S.C. § 1681i(a)(6) requires a consumer reporting agency to provide written notice of the results of a reinvestigation, including a statement that the consumer may add a statement of dispute and request the agency furnish notices of any correction to recent recipients of the report.',
    marketingSafeSummary:
      'Bureaus must tell you in writing what they decided after investigating your dispute — you don\u2019t have to guess.',
  },
  {
    id: 'fcra-1681i-reinsertion-certification',
    serviceCategory: 'dispute_letters',
    topic: 'Reinsertion certification requirement',
    statuteOrRegulation: '15 U.S.C. § 1681i(a)(5)(B)',
    footnoteText:
      '15 U.S.C. § 1681i(a)(5)(B) prohibits a consumer reporting agency from reinserting previously deleted information unless the furnisher certifies that the information is complete and accurate, and the agency notifies the consumer of the reinsertion within 5 business days.',
    marketingSafeSummary:
      'Once an item is deleted, a bureau can\u2019t just put it back — the furnisher has to re-certify it\u2019s accurate first, and you must be notified.',
  },
  {
    id: 'fcra-1681s2a-furnisher-accuracy',
    serviceCategory: 'personal_credit',
    topic: 'Furnisher duty of accuracy',
    statuteOrRegulation: '15 U.S.C. § 1681s-2(a)',
    footnoteText:
      '15 U.S.C. § 1681s-2(a) (FCRA § 623(a)) prohibits a furnisher from providing information to a consumer reporting agency that it knows or has reasonable cause to believe is inaccurate.',
    marketingSafeSummary:
      'Creditors and collectors have a legal duty not to report information they know — or should know — is inaccurate.',
  },
  {
    id: 'fcra-1681s2b-furnisher-investigate',
    serviceCategory: 'dispute_letters',
    topic: 'Furnisher duty to investigate disputes',
    statuteOrRegulation: '15 U.S.C. § 1681s-2(b)',
    agencyGuidance: 'CFPB Consumer Financial Protection Circular 2022-07 (Reasonable Investigation of Consumer Reporting Disputes)',
    footnoteText:
      '15 U.S.C. § 1681s-2(b) (FCRA § 623(b)) requires a furnisher, upon receiving notice of a dispute from a consumer reporting agency, to conduct a reasonable investigation and report the results back to the agency. CFPB Circular 2022-07 (Nov. 10, 2022) clarifies that furnishers and CRAs may not impose extra-statutory documentation hurdles as a precondition to investigating a non-frivolous dispute.',
    marketingSafeSummary:
      'When a bureau forwards your dispute, the furnisher is legally required to actually investigate it — not just rubber-stamp its own prior report.',
  },
  {
    id: 'fcra-1681s2a8-direct-dispute',
    serviceCategory: 'personal_credit',
    topic: 'Direct dispute to furnisher',
    statuteOrRegulation: '15 U.S.C. § 1681s-2(a)(8); 12 C.F.R. § 1022.43 (Regulation V)',
    footnoteText:
      '15 U.S.C. § 1681s-2(a)(8), implemented by Regulation V at 12 C.F.R. § 1022.43, allows a consumer to submit a dispute directly to the furnisher (not only through the credit bureau) regarding the accuracy of information it furnished.',
    marketingSafeSummary:
      'You can dispute an error directly with the company that reported it, not just with the credit bureau.',
  },
  {
    id: 'fcra-1681e-b-reasonable-procedures',
    serviceCategory: 'personal_credit',
    topic: 'CRA duty of reasonable procedures for accuracy',
    statuteOrRegulation: '15 U.S.C. § 1681e(b)',
    casePrecedent: 'Cushman v. Trans Union Corp., 115 F.3d 220 (3d Cir. 1997)',
    footnoteText:
      '15 U.S.C. § 1681e(b) requires a consumer reporting agency to follow reasonable procedures to assure maximum possible accuracy of the information in a consumer report. See Cushman v. Trans Union Corp., 115 F.3d 220 (3d Cir. 1997) (distinguishing the ongoing § 1681e(b) accuracy duty from the post-dispute § 1681i(a) reinvestigation duty).',
    marketingSafeSummary:
      'Credit bureaus have an ongoing legal duty to use reasonable procedures so your file is as accurate as possible — not just when you complain.',
  },
  {
    id: 'fcra-1681g-full-file-disclosure',
    serviceCategory: 'personal_credit',
    topic: 'Right to full file disclosure',
    statuteOrRegulation: '15 U.S.C. § 1681g(a)',
    footnoteText:
      '15 U.S.C. § 1681g(a) (FCRA § 609) entitles a consumer, upon request, to disclosure of all information in the consumer\u2019s file, the sources of that information, and the identity of parties who obtained the report for certain purposes.',
    marketingSafeSummary:
      'You have a federal right to see everything in your credit file and who has been pulling your report.',
  },
  {
    id: 'fcra-1681c-a5-obsolescence-general',
    serviceCategory: 'dispute_letters',
    topic: 'Obsolescence period — most adverse items',
    statuteOrRegulation: '15 U.S.C. § 1681c(a)(5)',
    footnoteText:
      '15 U.S.C. § 1681c(a)(5) generally prohibits consumer reporting agencies from reporting most adverse items of information that antedate the report by more than seven years.',
    marketingSafeSummary:
      'Most negative items are only allowed to stay on your credit report for about seven years.',
  },
  {
    id: 'fcra-1681c-a1-bankruptcy-obsolescence',
    serviceCategory: 'dispute_letters',
    topic: 'Obsolescence period — bankruptcy',
    statuteOrRegulation: '15 U.S.C. § 1681c(a)(1)',
    footnoteText:
      '15 U.S.C. § 1681c(a)(1) generally limits reporting of cases under Title 11 (bankruptcy) that antedate the report by more than ten years.',
    marketingSafeSummary:
      'Bankruptcy reporting is time-limited by federal law — it isn\u2019t allowed to follow you forever.',
  },
  {
    id: 'fcra-1681c2-identity-theft-block',
    serviceCategory: 'privacy_id',
    topic: 'Identity theft block (605B)',
    statuteOrRegulation: '15 U.S.C. § 1681c-2 (FCRA § 605B)',
    footnoteText:
      '15 U.S.C. § 1681c-2 (FCRA § 605B) requires a consumer reporting agency to block the reporting of information the consumer identifies as resulting from identity theft within 4 business days of receiving proof of identity, an identity theft report, identification of the fraudulent item(s), and a statement that the information does not relate to any transaction by the consumer.',
    marketingSafeSummary:
      'If items on your report came from identity theft, federal law gives you a fast-track right to have them blocked once you file the required proof.',
  },
  {
    id: 'fcra-1681c1-security-freeze',
    serviceCategory: 'privacy_id',
    topic: 'Security freeze rights',
    statuteOrRegulation: '15 U.S.C. § 1681c-1',
    footnoteText:
      '15 U.S.C. § 1681c-1 governs fraud alerts and security freezes, including the consumer\u2019s right to place, lift, and remove a security freeze on a consumer report free of charge.',
    marketingSafeSummary:
      'You have a federal right to freeze your credit file for free to help block new-account fraud.',
  },
  {
    id: 'fcra-1681m-adverse-action-notice',
    serviceCategory: 'personal_credit',
    topic: 'Adverse action notice duty',
    statuteOrRegulation: '15 U.S.C. § 1681m(a)',
    casePrecedent: 'Safeco Ins. Co. of America v. Burr, 551 U.S. 47 (2007)',
    footnoteText:
      '15 U.S.C. § 1681m(a) requires a person who takes adverse action based in whole or in part on a consumer report to provide notice of the adverse action to the consumer. See Safeco Ins. Co. of America v. Burr, 551 U.S. 47 (2007) (construing "willfully fails to comply" under § 1681n(a) to include reckless, not just knowing, violations of the § 1681m notice duty).',
    marketingSafeSummary:
      'If a company denies you credit, insurance, or a rate because of your credit report, it must tell you and explain why.',
  },
  {
    id: 'fcra-1681n-willful-noncompliance',
    serviceCategory: 'dispute_letters',
    topic: 'Civil liability — willful noncompliance',
    statuteOrRegulation: '15 U.S.C. § 1681n',
    casePrecedent: 'Safeco Ins. Co. of America v. Burr, 551 U.S. 47 (2007)',
    footnoteText:
      '15 U.S.C. § 1681n provides civil liability (including statutory and punitive damages) for any person who willfully fails to comply with the FCRA. Safeco Ins. Co. of America v. Burr, 551 U.S. 47 (2007), held that "willfully" reaches both knowing and reckless violations, but not merely erroneous, objectively reasonable interpretations of the statute.',
    marketingSafeSummary:
      'Companies that knowingly or recklessly violate your credit reporting rights can be held liable under federal law.',
  },
  {
    id: 'fcra-1681o-negligent-noncompliance',
    serviceCategory: 'dispute_letters',
    topic: 'Civil liability — negligent noncompliance',
    statuteOrRegulation: '15 U.S.C. § 1681o',
    casePrecedent: 'Cushman v. Trans Union Corp., 115 F.3d 220 (3d Cir. 1997)',
    footnoteText:
      '15 U.S.C. § 1681o provides civil liability for actual damages caused by negligent noncompliance with the FCRA. Cushman v. Trans Union Corp., 115 F.3d 220 (3d Cir. 1997), reversed a judgment as a matter of law against a consumer\u2019s § 1681o negligence claim, holding the adequacy of a reinvestigation was a jury question.',
    marketingSafeSummary:
      'Even careless (not just intentional) violations of credit reporting law can create liability for actual damages.',
  },
  {
    id: 'fcra-standing-spokeo',
    serviceCategory: 'dispute_letters',
    topic: 'Standing to sue — concrete injury requirement',
    statuteOrRegulation: 'Article III standing in FCRA litigation',
    casePrecedent: 'Spokeo, Inc. v. Robins, 578 U.S. 330 (2016)',
    footnoteText:
      'Spokeo, Inc. v. Robins, 578 U.S. 330 (2016), holds that a plaintiff asserting a statutory violation under the FCRA must allege a concrete and particularized injury-in-fact — a bare procedural violation, divorced from any real harm, does not by itself satisfy Article III standing.',
    marketingSafeSummary:
      'Courts require a real, concrete harm — not just a technical paperwork violation — before a credit reporting lawsuit can proceed.',
  },
  {
    id: 'fcra-standing-transunion-ramirez',
    serviceCategory: 'dispute_letters',
    topic: 'Standing — class-wide concrete harm',
    statuteOrRegulation: 'Article III standing in FCRA class litigation',
    casePrecedent: 'TransUnion LLC v. Ramirez, 594 U.S. 413 (2021)',
    footnoteText:
      'TransUnion LLC v. Ramirez, 594 U.S. 413 (2021), holds that every class member in a federal court money-damages suit, including under the FCRA, must have Article III standing (i.e., a concrete injury) to recover individual damages, reaffirming and applying the Spokeo concrete-injury requirement.',
    marketingSafeSummary:
      'In FCRA class actions, each person still has to show they were actually harmed — not just that a rule was technically broken.',
  },
  {
    id: 'cfpb-supervisory-highlights-furnisher',
    serviceCategory: 'dispute_letters',
    topic: 'Recurring furnisher dispute-handling failures',
    statuteOrRegulation: '15 U.S.C. § 1681s-2(b) enforcement context',
    agencyGuidance: 'CFPB Supervisory Highlights — Consumer Reporting editions',
    footnoteText:
      'CFPB Supervisory Highlights (Consumer Reporting editions) have repeatedly identified furnisher and consumer reporting agency dispute-handling deficiencies as a recurring examination finding under 15 U.S.C. § 1681s-2(b) and § 1681i.',
    marketingSafeSummary:
      'Regulators have repeatedly flagged furnisher dispute-handling as an area of ongoing compliance concern in the industry.',
  },

  // ── FDCPA — debt collection ───────────────────────────────────────────────
  {
    id: 'fdcpa-1692g-validation-notice',
    serviceCategory: 'debt_summons',
    topic: 'Validation notice',
    statuteOrRegulation: '15 U.S.C. § 1692g',
    footnoteText:
      '15 U.S.C. § 1692g (FDCPA § 809) requires a debt collector, within 5 days of initial communication, to send a written validation notice identifying the debt amount and creditor and informing the consumer of the right to dispute the debt within 30 days.',
    marketingSafeSummary:
      'When a collector first contacts you, federal law requires them to tell you the debt amount, the creditor, and your 30-day right to dispute it.',
  },
  {
    id: 'fdcpa-1692g-b-cease-pending-verification',
    serviceCategory: 'debt_summons',
    topic: 'Cease collection pending verification',
    statuteOrRegulation: '15 U.S.C. § 1692g(b)',
    footnoteText:
      '15 U.S.C. § 1692g(b) requires a debt collector to cease collection of a disputed debt until it obtains verification of the debt (or a copy of a judgment) and mails it to the consumer, if the consumer disputes the debt in writing within the 30-day validation period.',
    marketingSafeSummary:
      'If you dispute a debt in writing within 30 days, the collector must pause collection until they send you proof.',
  },
  {
    id: 'fdcpa-1692e-false-misleading',
    serviceCategory: 'debt_summons',
    topic: 'False or misleading representations',
    statuteOrRegulation: '15 U.S.C. § 1692e',
    footnoteText:
      '15 U.S.C. § 1692e prohibits a debt collector from using any false, deceptive, or misleading representation or means in connection with the collection of a debt.',
    marketingSafeSummary:
      'Debt collectors are legally barred from lying to you or misrepresenting the debt to pressure payment.',
  },
  {
    id: 'fdcpa-1692e11-mini-miranda',
    serviceCategory: 'debt_summons',
    topic: 'Mini-Miranda disclosure',
    statuteOrRegulation: '15 U.S.C. § 1692e(11)',
    footnoteText:
      '15 U.S.C. § 1692e(11) generally requires a debt collector to disclose in communications that it is attempting to collect a debt and that any information obtained will be used for that purpose (subject to statutory exceptions, including certain formal pleadings).',
    marketingSafeSummary:
      'Collectors generally must disclose that they are debt collectors and that anything you say may be used to collect the debt.',
  },
  {
    id: 'fdcpa-1692c-communication-restrictions',
    serviceCategory: 'debt_summons',
    topic: 'Communication restrictions',
    statuteOrRegulation: '15 U.S.C. § 1692c',
    footnoteText:
      '15 U.S.C. § 1692c restricts when, where, and how a debt collector may communicate with a consumer, including limits on inconvenient times/places and communications after the consumer is known to be represented by counsel.',
    marketingSafeSummary:
      'There are legal limits on when, where, and how often a collector may contact you.',
  },
  {
    id: 'fdcpa-1692c-c-cease-and-desist',
    serviceCategory: 'debt_summons',
    topic: 'Cease and desist demand',
    statuteOrRegulation: '15 U.S.C. § 1692c(c)',
    footnoteText:
      '15 U.S.C. § 1692c(c) provides that if a consumer notifies a debt collector in writing that they wish the collector to cease further communication, the collector must stop contact except for limited statutory purposes (e.g., to confirm no further contact, or to notify of specific remedies such as a lawsuit).',
    marketingSafeSummary:
      'You can send a written cease-and-desist letter, and the collector must stop contacting you with only narrow exceptions.',
  },
  {
    id: 'fdcpa-1692f-unfair-practices',
    serviceCategory: 'debt_summons',
    topic: 'Unfair practices — unauthorized fees/interest',
    statuteOrRegulation: '15 U.S.C. § 1692f',
    footnoteText:
      '15 U.S.C. § 1692f prohibits a debt collector from using unfair or unconscionable means to collect or attempt to collect any debt.',
    marketingSafeSummary:
      'Collectors cannot use unfair or unconscionable tactics to try to collect a debt from you.',
  },
  {
    id: 'fdcpa-1692f1-unauthorized-amounts',
    serviceCategory: 'debt_summons',
    topic: 'Collection of unauthorized amounts',
    statuteOrRegulation: '15 U.S.C. § 1692f(1)',
    footnoteText:
      '15 U.S.C. § 1692f(1) generally prohibits collection of any amount (including interest, fees, charges, or expenses) unless expressly authorized by the underlying agreement or permitted by law.',
    marketingSafeSummary:
      'A collector generally can\u2019t tack on extra fees or interest unless your original agreement or the law specifically allows it.',
  },
  {
    id: 'fdcpa-1692k-civil-liability',
    serviceCategory: 'debt_summons',
    topic: 'Civil liability for FDCPA violations',
    statuteOrRegulation: '15 U.S.C. § 1692k',
    footnoteText:
      '15 U.S.C. § 1692k provides for civil liability, including actual damages, statutory damages up to $1,000, and attorney\u2019s fees, for a debt collector who fails to comply with the FDCPA.',
    marketingSafeSummary:
      'Collectors who break these rules can be held financially liable, including statutory damages and attorney\u2019s fees.',
  },

  // ── Civil procedure / statute of limitations ─────────────────────────────
  {
    id: 'civ-pro-state-sol-affirmative-defense',
    serviceCategory: 'debt_summons',
    topic: 'Time-barred debt as affirmative defense',
    statuteOrRegulation: 'State statute of limitations for contract / open-account claims (varies by state and claim type, commonly 3–6 years)',
    footnoteText:
      'State statutes of limitations for contract, open-account, and written-agreement claims typically range from roughly 3 to 6 years depending on jurisdiction and claim type. An expired limitations period is generally an affirmative defense that must be raised by the defendant; it does not automatically dismiss a case.',
    marketingSafeSummary:
      'Every state puts a time limit on how long a creditor can sue you over a debt — but you generally have to raise it as a defense, it isn\u2019t automatic.',
  },
  {
    id: 'civ-pro-answer-deadline-default-risk',
    serviceCategory: 'debt_summons',
    topic: 'Answer deadline / default judgment risk',
    statuteOrRegulation: 'State rules of civil procedure governing answer deadlines (commonly 20–35 days after service, varies by jurisdiction)',
    footnoteText:
      'State rules of civil procedure set a deadline (commonly 20–35 days after service, depending on jurisdiction) to file a written answer to a summons and complaint. Failure to answer by the deadline can result in a default judgment against the defendant.',
    marketingSafeSummary:
      'If you\u2019re served with a lawsuit, most states give you only a few weeks to respond in writing — missing that deadline can lead to an automatic loss.',
  },

  // ── Contract law / evidence (debt defense angles) ─────────────────────────
  {
    id: 'contract-law-formation-consideration',
    serviceCategory: 'debt_summons',
    topic: 'Contract formation — offer, acceptance, consideration',
    statuteOrRegulation: 'Common law contract formation principles (Restatement (Second) of Contracts)',
    footnoteText:
      'Under common-law contract principles (see generally Restatement (Second) of Contracts), an enforceable obligation requires offer, acceptance, and consideration. A party asserting the right to enforce an alleged debt bears the burden of proving these elements and, where applicable, a valid chain of assignment.',
    marketingSafeSummary:
      'A debt collector claiming you owe money generally has to prove there was a real, valid agreement — not just assert a balance.',
  },
  {
    id: 'evidence-best-evidence-burden-of-proof',
    serviceCategory: 'debt_summons',
    topic: 'Burden of proof on the claimant',
    statuteOrRegulation: 'Best evidence rule / burden-of-proof principles (state evidence codes and common law)',
    footnoteText:
      'Under general evidentiary and burden-of-proof principles, the party asserting a claim (here, that a debt is owed in a specific amount and is properly assigned) bears the burden of proving it with competent evidence, which may include the original agreement and account-level records.',
    marketingSafeSummary:
      'In a debt dispute, the burden is on the person or company claiming you owe money — you don\u2019t have to prove a negative.',
  },
  {
    id: 'ucc-3-308-holder-in-due-course-burden',
    serviceCategory: 'debt_summons',
    topic: 'Burden of proving signature / holder in due course',
    statuteOrRegulation: 'UCC § 3-308 (Uniform Commercial Code, negotiable instruments)',
    footnoteText:
      'UCC § 3-308 places the burden of establishing validity of a signature and status as a person entitled to enforce a negotiable instrument on the party asserting the right to enforce it, once the signature is placed in issue.',
    marketingSafeSummary:
      'If a debt involves a note or negotiable instrument, the party trying to enforce it may have to prove the signature and their right to collect.',
  },

  // ── Business credit / UCC Article 9 (secured transactions) ───────────────
  {
    id: 'ucc-9-102-secured-transactions-scope',
    serviceCategory: 'business_credit',
    topic: 'Secured transactions scope',
    statuteOrRegulation: 'UCC Article 9, § 9-102 (Uniform Commercial Code, secured transactions)',
    footnoteText:
      'UCC Article 9 (see § 9-102 for scope and definitions) governs security interests in personal property and fixtures, including inventory, equipment, and accounts commonly used as collateral in business credit and financing arrangements.',
    marketingSafeSummary:
      'Business financing that uses company assets as collateral is governed by a well-established body of commercial law (UCC Article 9).',
  },
  {
    id: 'ucc-9-502-financing-statement-sufficiency',
    serviceCategory: 'business_credit',
    topic: 'UCC-1 financing statement sufficiency',
    statuteOrRegulation: 'UCC § 9-502',
    footnoteText:
      'UCC § 9-502 sets the minimum content required for a financing statement (UCC-1) to be sufficient — generally the debtor\u2019s name, the secured party\u2019s name, and an indication of the collateral covered.',
    marketingSafeSummary:
      'A UCC-1 filing has specific legal requirements to be valid — it isn\u2019t just paperwork, it perfects a lender\u2019s claim to collateral.',
  },
  {
    id: 'ucc-9-509-authorization-to-file',
    serviceCategory: 'business_credit',
    topic: 'Authorization to file a financing statement',
    statuteOrRegulation: 'UCC § 9-509',
    footnoteText:
      'UCC § 9-509 generally requires that a person may file a financing statement only if the debtor authorizes the filing in an authenticated record (e.g., by signing a security agreement covering the collateral described).',
    marketingSafeSummary:
      'A lender generally needs your authorization before it can file a lien against your business assets.',
  },
  {
    id: 'ucc-9-513-termination-statement-duty',
    serviceCategory: 'business_credit',
    topic: 'Duty to file termination statement',
    statuteOrRegulation: 'UCC § 9-513',
    footnoteText:
      'UCC § 9-513 generally requires a secured party to file or send a termination statement within a specified period after the secured obligation is satisfied and there is no further commitment to extend credit, so the UCC-1 no longer clouds the debtor\u2019s title.',
    marketingSafeSummary:
      'Once a business loan is paid off, the lender has a legal duty to clear its lien filing so it doesn\u2019t keep clouding your credit.',
  },

  // ── Credit Repair Organizations Act (agency / consumer-facing credit repair) ─
  {
    id: 'croa-1679-scope-disclosures',
    serviceCategory: 'agency',
    topic: 'Credit Repair Organizations Act — scope & disclosures',
    statuteOrRegulation: '15 U.S.C. § 1679 et seq. (Credit Repair Organizations Act)',
    footnoteText:
      'The Credit Repair Organizations Act, 15 U.S.C. § 1679 et seq., regulates entities that offer, for a fee, to improve a consumer\u2019s credit record or obtain an extension of credit, including required written contracts, disclosures of consumer rights, and a 3-business-day right to cancel.',
    marketingSafeSummary:
      'Credit repair services are governed by a federal law (CROA) that requires clear contracts, honest disclosures, and a right to cancel.',
  },
  {
    id: 'croa-1679b-prohibited-practices',
    serviceCategory: 'agency',
    topic: 'CROA prohibited practices — no advance fee',
    statuteOrRegulation: '15 U.S.C. § 1679b',
    footnoteText:
      '15 U.S.C. § 1679b prohibits a credit repair organization from charging or receiving payment for services before those services are fully performed, and prohibits making untrue or misleading statements about the consumer\u2019s credit file or bureau services.',
    marketingSafeSummary:
      'Federal law prohibits credit repair companies from charging you before the work is actually done, or making misleading promises about results.',
  },

  // ── Equal Credit Opportunity Act (funding / wealth-building denial notices) ─
  {
    id: 'ecoa-1691-adverse-action-reasons',
    serviceCategory: 'wealth_builder',
    topic: 'Equal credit opportunity — adverse action & reasons',
    statuteOrRegulation: '15 U.S.C. § 1691(d) (Equal Credit Opportunity Act); Regulation B, 12 C.F.R. § 1002.9',
    footnoteText:
      '15 U.S.C. § 1691(d) (ECOA), implemented by Regulation B at 12 C.F.R. § 1002.9, requires a creditor to notify an applicant of action taken on a credit application and, upon request (or automatically for adverse action), to provide the specific reasons for denial.',
    marketingSafeSummary:
      'If a lender denies your application, federal law says you\u2019re entitled to know the specific reasons why.',
  },

  // ── Privacy / identity theft (FTC) ────────────────────────────────────────
  {
    id: 'ftc-identity-theft-report-requirements',
    serviceCategory: 'privacy_id',
    topic: 'Identity Theft Report requirements',
    statuteOrRegulation: 'FCRA § 603(q) definition of "identity theft report"; 16 C.F.R. § 603.3',
    agencyGuidance: 'FTC IdentityTheft.gov affidavit + report process',
    footnoteText:
      'FCRA § 603(q) (as implemented at 16 C.F.R. § 603.3) defines the "identity theft report" required to invoke certain FCRA remedies (e.g., the § 605B block). The FTC\u2019s IdentityTheft.gov process generates a report that generally satisfies this definition when paired with any required law enforcement filing.',
    marketingSafeSummary:
      'Filing an identity theft report through the FTC\u2019s process is often the key document that unlocks stronger legal remedies for fraud-related credit damage.',
  },

  // ── Tradelines / authorized user reporting (honest, non-statutory framing) ─
  {
    id: 'au-reporting-industry-practice',
    serviceCategory: 'tradeline_promo',
    topic: 'Authorized user tradeline reporting',
    statuteOrRegulation:
      'No federal statute mandates authorized-user reporting; card issuers voluntarily furnish AU tradelines under their own policies and industry furnishing standards (e.g., Metro 2 data-reporting format).',
    footnoteText:
      'Authorized-user tradeline reporting is not required by the FCRA or any other federal statute. Whether, and how, an authorized-user account is furnished to consumer reporting agencies is a matter of each card issuer\u2019s internal policy, subject to general furnisher-accuracy duties under 15 U.S.C. § 1681s-2(a) once reported.',
    marketingSafeSummary:
      'Authorized user reporting is industry practice, not a statutory right — issuers can report, limit, or stop reporting AU tradelines at their own discretion, and results vary.',
  },
  {
    id: 'au-reporting-furnisher-accuracy-once-reported',
    serviceCategory: 'tradeline_promo',
    topic: 'Furnisher accuracy duty once an AU tradeline is reported',
    statuteOrRegulation: '15 U.S.C. § 1681s-2(a)',
    footnoteText:
      'While no statute compels authorized-user reporting, once an issuer elects to furnish an authorized-user tradeline to a consumer reporting agency, the general furnisher accuracy duty under 15 U.S.C. § 1681s-2(a) applies to the information reported.',
    marketingSafeSummary:
      'Once an issuer does report an authorized-user account, it still has to be accurate — but there\u2019s no guarantee an account will be reported at all.',
  },
];

export function getAllAuthorityCitations(): AuthorityCitation[] {
  return AUTHORITY_CITATIONS;
}

export function getCitationsForCategory(
  category: AuthorityCitation['serviceCategory'],
): AuthorityCitation[] {
  return AUTHORITY_CITATIONS.filter((c) => c.serviceCategory === category);
}

/** Simple case-insensitive substring match across topic + statute/regulation text — not exhaustive by design. */
export function getCitationsForTopic(topic: string): AuthorityCitation[] {
  const needle = String(topic || '').trim().toLowerCase();
  if (!needle) return [];
  return AUTHORITY_CITATIONS.filter((c) => {
    const haystack = `${c.topic} ${c.statuteOrRegulation} ${c.agencyGuidance || ''}`.toLowerCase();
    return haystack.includes(needle);
  });
}
