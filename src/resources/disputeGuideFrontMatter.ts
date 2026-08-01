import type { GeneratedGuidePage } from './disputeLetterGuideContent';

/**
 * Opening chapters of the Free Credit Dispute Letter Guide.
 * These run before the 5-step framework so the first half of the guide teaches
 * how the reporting system actually works before asking anyone to write a word.
 * Educational only — not legal advice.
 */
export const DISPUTE_GUIDE_FRONT_MATTER_PAGES: GeneratedGuidePage[] = [
  {
    id: 'read-this-first',
    title: 'Read This First',
    subtitle: 'What a dispute actually is — and why most of them fail before the envelope is sealed',
    kicker: 'Orientation',
    accent: 'sky',
    readMinutes: 4,
    sections: [
      {
        heading: 'A dispute is a request for a reinvestigation — not an argument',
        paragraphs: [
          'When you dispute something on your credit report, you are not filing a lawsuit and you are not negotiating. You are telling a credit reporting agency that a specific piece of data in your file does not match reality, and you are asking them to reinvestigate it. That is the whole mechanism. Everything else in this guide exists to make that one request impossible to brush aside.',
          'The reason so many disputes come back “verified” is not that the consumer was wrong. It is that the request arrived without a specific field, without a document, and without a reason a data analyst could act on. A letter that says “this account is not mine, please remove” gives the reinvestigation nothing to check. A letter that says “the status field reads Current while the payment grid in the same account block shows three 90-day lates, as shown in Exhibit A” gives them something they have to resolve.',
        ],
        annotation: 'Specific field + attached proof + one account = a dispute that has to be worked, not clicked.',
      },
      {
        heading: 'The three parties, and what each one owes you',
        paragraphs: [
          'Almost every frustration in this process comes from writing to the wrong party. There are three, and they have different jobs and different legal duties.',
        ],
        bullets: [
          'You — you supply the facts and the exhibits. Nothing moves until you pull your own report and document what you see.',
          'The credit reporting agency (Equifax, Experian, TransUnion) — receives your dispute and must conduct a reasonable reinvestigation, generally within 30 days, then send you the results in writing.',
          'The furnisher (the bank, lender, collector, or debt buyer reporting the data) — receives the dispute from the agency and must investigate and correct or stop reporting information it cannot verify.',
        ],
        evidence: {
          label: 'Keep this straight',
          text: 'Bureau disputes are about accuracy of reporting. Debt validation is a separate conversation with a collector under a different statute. Mixing the two in one letter weakens both.',
        },
      },
      {
        heading: 'How to use this guide',
        bullets: [
          'Read the first five chapters before you write anything — they are the difference between a letter and a filing.',
          'Work the 5-step framework in order. Each step gets its own chapter with a power move at the end.',
          'Use the example letter as a shape, not a script. Copy the structure; write the facts in your own words.',
          'Come back to the escalation chapters only after Round 1 has a documented response or a documented silence.',
        ],
      },
    ],
  },
  {
    id: 'report-anatomy',
    title: 'Read Your Report Like an Analyst',
    subtitle: 'The eleven fields that decide whether a tradeline is defensible',
    kicker: 'Chapter 02 · Fundamentals',
    accent: 'ink',
    readMinutes: 6,
    sections: [
      {
        heading: 'Stop reading the score. Read the account block.',
        paragraphs: [
          'The three-digit number at the top of your report tells you how you are being judged. It tells you nothing about why. Every dispute you will ever write comes from the account block — the panel of fields underneath each tradeline — and from the payment grid that sits beside it.',
          'Open one negative account and read these fields in order, writing down what each one says. You are not looking for anything “illegal.” You are looking for two facts that cannot both be true at the same time.',
        ],
        bullets: [
          'Furnisher / creditor name — is this a company you recognize, or a buyer you have never done business with?',
          'Account number (masked) — does the visible portion match anything in your records?',
          'Account type and responsibility — individual, joint, authorized user, co-signer. A misclassified responsibility is a factual error.',
          'Date opened — does it fall in a period when you were actually opening credit?',
          'Date of first delinquency (DOFD) — the anchor for the seven-year reporting clock. This is the single most consequential date on the block.',
          'Date of last activity / last reported — a collection that keeps “refreshing” its activity date is worth a hard look.',
          'Balance and high balance — a balance that grows on a charged-off account, or exceeds the original limit without explanation.',
          'Credit limit — missing on a revolving account, this can distort utilization calculations against you.',
          'Account status — Current, Paid, Charge-off, Collection, Closed. Compare it to the grid.',
          'Payment history grid — the 24-month strip of OK / 30 / 60 / 90 / 120 marks. This is where contradictions hide.',
          'Remarks and comment codes — “Account information disputed,” “Settled for less,” “Included in bankruptcy.” These carry weight with underwriters long after the balance is gone.',
        ],
      },
      {
        heading: 'The contradiction hunt',
        paragraphs: [
          'Now compare the fields against each other, and then compare the same account across all three bureaus. You are hunting for internal inconsistency, because internal inconsistency is the cleanest thing a reinvestigation can confirm without needing your side of the story at all.',
        ],
        bullets: [
          'Status says Paid or Current, but the grid shows derogatory marks in the same block.',
          'Balance exceeds the credit limit or the original high balance with no explanation.',
          'DOFD does not line up with the first late mark on the grid — or moved between two pulls.',
          'A collection and the original account both report a balance for the same debt.',
          'Equifax shows one open date, Experian shows another, TransUnion shows a third.',
          'A closed account still reports a monthly payment obligation.',
        ],
        annotation: 'Screenshot the whole account block — not a crop. The reviewer needs to see the contradiction in context.',
      },
    ],
  },
  {
    id: 'finding-not-feeling',
    title: 'A Finding, Not a Feeling',
    subtitle: 'The evidence standard that separates a worked dispute from a discarded one',
    kicker: 'Chapter 03 · Standard',
    accent: 'amber',
    readMinutes: 5,
    sections: [
      {
        heading: 'Write what the screen shows',
        paragraphs: [
          'A factual finding describes something visible. A feeling describes something you believe. Reinvestigations resolve findings and discard feelings, so every reason you write should be something a stranger could confirm by looking at the same exhibit you attached.',
          'The easiest way to hold yourself to this standard is to write each reason as if you were pointing at the page: “As you can see on the Equifax report dated March 4, the status field for this account reads Current while the payment history for the same account shows a 90-day late in November.” No adjectives. No accusation. Just the two facts that cannot coexist.',
        ],
        comparison: {
          badLabel: 'Discarded',
          bad: [
            'This account is not mine, please delete immediately.',
            'This is illegal reporting and I demand removal.',
            'Please verify and delete this unverifiable account.',
            'I never agreed to this and it is destroying my life.',
          ],
          goodLabel: 'Worked',
          good: [
            'As shown in Exhibit A, the account status reads “Paid as agreed” while the same block reports a charge-off balance of $2,431.',
            'Exhibit B shows this account with a date opened of 06/2019 on TransUnion and 11/2020 on Experian for the same account number ending 4471.',
            'The credit limit field is blank on this revolving account, as shown in Exhibit C, which prevents accurate utilization reporting.',
            'The date of first delinquency shown in Exhibit D (03/2021) is later than the first 30-day mark on the payment grid (08/2020) in the same block.',
          ],
        },
      },
      {
        heading: 'The four honest lanes',
        paragraphs: [
          'Every legitimate dispute reason falls into one of four lanes. Pick one lane per letter and stay in it. A letter that wanders across all four reads as a template and gets treated like one.',
        ],
        bullets: [
          'Inaccurate — a field states something that is demonstrably not true (wrong balance, wrong status, wrong date).',
          'Incomplete — a required field is missing or blank in a way that distorts how the account reads.',
          'Inconsistent — two fields in the same block, or the same account across two bureaus, contradict each other.',
          'Unverifiable — the furnisher cannot produce documentation supporting what is being reported as reported.',
        ],
        evidence: {
          label: 'Compliance note',
          text: 'Never dispute accurate information hoping it falls off. Educational only — not legal advice. Results vary.',
        },
      },
    ],
  },
  {
    id: 'who-you-write-to',
    title: 'Bureau or Furnisher',
    subtitle: 'Two envelopes, two duties, two very different letters',
    kicker: 'Chapter 04 · Targeting',
    accent: 'violet',
    readMinutes: 5,
    sections: [
      {
        heading: 'The bureau letter',
        paragraphs: [
          'You write to a credit reporting agency when the problem is what your file says. The agency has a duty to reinvestigate and to forward all relevant information you provide to the furnisher. This is your primary lane for contradictions, wrong dates, wrong balances, and accounts that do not belong to you.',
        ],
        bullets: [
          'Send to the dispute address printed on your own report — not an address from a forum post.',
          'One tradeline per letter, one lane per letter, one bureau per envelope.',
          'Attach identity documents if the bureau has asked for them; otherwise attach only the exhibit that proves your claim.',
          'Ask for two things in the close: the reinvestigation result in writing, and an updated copy of the report.',
        ],
      },
      {
        heading: 'The furnisher letter',
        paragraphs: [
          'You write directly to the furnisher when you need something only they hold — a statement, a payment record, the account history that contradicts what they sent to the bureaus. A furnisher letter is also how you create a record that they were told directly, which matters if the same error survives two bureau rounds.',
          'A furnisher letter is not a substitute for the bureau dispute. Run them as a pair when the item is serious: bureau letter for the reinvestigation duty, furnisher letter for the source of the data.',
        ],
        bullets: [
          'Address it to the customer service or credit reporting department listed on your statement or their website.',
          'Reference the account, the specific field, and what your own records show instead.',
          'Request that they correct their reporting to all three bureaus, not just the one you disputed with.',
          'Keep it short. One page, one issue, one attachment.',
        ],
        annotation: 'Same facts, different audience. Never send the bureau a letter written for the furnisher.',
      },
    ],
  },
  {
    id: 'round-map',
    title: 'The 90-Day Round Map',
    subtitle: 'What actually happens after you drop the envelope — week by week',
    kicker: 'Chapter 05 · Timeline',
    accent: 'emerald',
    readMinutes: 5,
    sections: [
      {
        heading: 'Round 1 — days 0 to 35',
        paragraphs: [
          'The clock does not start when you write the letter. It starts when the agency receives it, which is exactly why certified mail with return receipt is worth the few dollars. Your delivery date is the anchor for every follow-up in this map.',
        ],
        bullets: [
          'Day 0 — mail certified with return receipt. Log the tracking number and the tradeline it covers.',
          'Day 3 to 7 — delivery confirmation arrives. Save the green card or the electronic proof with your file copy.',
          'Day 30 to 35 — the reinvestigation window closes. Scan whatever arrives the same day it arrives.',
          'No response by day 35 — send a short follow-up referencing the tracking number and the delivery date. Do not restate the whole dispute.',
        ],
      },
      {
        heading: 'Round 2 — days 35 to 90',
        paragraphs: [
          'Round 2 is not Round 1 sent again. It is a response to what they told you. If the item came back “verified” with no explanation of how, that silence is itself the new fact you write about — request the method of verification and name the specific field that was supposedly confirmed.',
          'If the item was corrected but only on one bureau, that mismatch is now a fresh contradiction you can document across the other two. Every round should be shorter and more specific than the one before it.',
        ],
        bullets: [
          'Read the response for what changed, what did not, and what language they used to justify keeping it.',
          'Request method of verification in writing when a “verified” arrives with no detail.',
          'Compare the post-dispute report to your original screenshots and document any new discrepancy.',
          'Escalate to CFPB or your state attorney general only when your timeline, exhibits, and tracking are organized.',
        ],
        evidence: {
          label: 'One page, always',
          text: 'Keep a single-page timeline per tradeline: sent, delivered, responded, result, next action. It is the artifact that makes an attorney or a regulator take you seriously in under a minute.',
        },
      },
    ],
  },
];
