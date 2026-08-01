/**
 * Tradeline Advantage Guide — in-app chapter content.
 *
 * Education only. Honest AU framing: no guaranteed score outcomes, no CPN or
 * synthetic-identity content, no advice to misrepresent anything to a lender.
 */
import type { GuideChapter, GuideMeta } from './guideReaderBlocks';

export const TL_GUIDE_LANDING_PATH = '/free-tradeline-guide';
export const TL_GUIDE_READ_PATH = '/free-tradeline-guide/read';
export const TL_MARKETPLACE_PATH = '/tradelines';
export const TL_BOOKING_PATH = '/enlightenment-session';

export const TL_GUIDE_META: GuideMeta = {
  title: 'The Tradeline Advantage',
  shortTitle: 'Tradeline Advantage',
  tagline: 'Limits · Age · Utilization · Honest sequencing',
  description:
    'A free in-app guide to tradelines without the hype: what a tradeline actually is, authorized user versus primary, what AU can and cannot do, how underwriters read a line, utilization timing, compliance red flags, and where tradelines fit in a real plan.',
  compliance: 'Educational only · results vary · no guaranteed score outcomes',
  edition: 'Finely Cred edition',
  landingPath: TL_GUIDE_LANDING_PATH,
  readPath: TL_GUIDE_READ_PATH,
};

export const TL_GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: 'what-is-a-tradeline',
    number: '01',
    title: 'What a Tradeline Actually Is',
    subtitle: 'Strip away the marketing and a tradeline is a row of reported data',
    kicker: 'Foundations',
    teaser: 'Every claim about tradelines has to survive contact with the fields that actually report.',
    readMinutes: 7,
    promise: 'You will know exactly which data fields a tradeline contributes to your file.',
    takeaway: 'A tradeline is a data row. Judge every offer by the fields it will actually add to your file.',
    sections: [
      {
        heading: 'The row behind the pitch',
        kicker: 'Definition',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'A tradeline is a single credit account as it appears on a credit report. Card, auto loan, mortgage, student loan, store card — each one is a tradeline, and each is described by a small set of standardized fields furnished by the creditor.',
              'Everything a tradeline can do for a file, and everything it cannot, comes down to those fields. When someone promises a result, the honest question is: which field are you changing, and how much weight does that field carry in my specific situation?',
            ],
          },
          {
            kind: 'table',
            caption: 'The fields that describe every tradeline',
            columns: ['Field', 'What it reports', 'Why it matters'],
            rows: [
              ['Account type', 'Revolving, installment, mortgage', 'Feeds credit mix'],
              ['Date opened', 'When the account originated', 'Drives age of accounts'],
              ['Credit limit / high credit', 'The ceiling on the account', 'Denominator for utilization'],
              ['Current balance', 'Balance as of the report date', 'Numerator for utilization'],
              ['Payment history grid', 'Month-by-month status', 'The heaviest scoring factor'],
              ['Account status', 'Open, closed, transferred', 'Whether the line still counts as active'],
              ['Responsibility code', 'Individual, joint, authorized user', 'How the account is attributed to you'],
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: 'Responsibility is the field to watch',
            body: 'The responsibility code is what separates an authorized user line from a primary account. It is visible on the report, and some manual underwriters look at it directly.',
          },
        ],
      },
      {
        heading: 'Furnishing is voluntary and inconsistent',
        kicker: 'Reality check',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Creditors furnish data voluntarily. Some report to all three consumer bureaus, some to one, and some report authorized users differently than primary borrowers. Reporting also runs on cycles — typically monthly — so nothing appears instantly.',
              'This is why an honest conversation about tradelines always includes uncertainty. Anyone quoting an exact score increase on an exact date is describing a projection, not a mechanism.',
            ],
          },
          {
            kind: 'chips',
            label: 'Variables outside anyone\'s control',
            items: [
              { label: 'Which bureaus', note: 'Issuer policy' },
              { label: 'When it posts', note: 'Monthly cycle' },
              { label: 'AU treatment', note: 'Varies by issuer' },
              { label: 'Scoring model', note: 'Version differences' },
              { label: 'Your file', note: 'Thin vs thick behaves differently' },
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'The honesty standard for this guide',
            body: 'No page here will tell you a tradeline guarantees an approval or a score. Educational only · results vary · no guaranteed score outcomes.',
          },
        ],
      },
    ],
  },
  {
    id: 'au-vs-primary',
    number: '02',
    title: 'Authorized User vs Primary',
    subtitle: 'Two very different things that get sold with the same words',
    kicker: 'The core distinction',
    teaser: 'One adds someone else\'s history to your report. The other is your own obligation.',
    readMinutes: 8,
    promise: 'You will never again confuse an AU placement with a primary account you own.',
    takeaway: 'AU borrows history. Primary builds it. Only one of them is still yours next year.',
    sections: [
      {
        heading: 'The plain definitions',
        kicker: 'Definitions',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'An authorized user is added to someone else\'s existing account. You gain spending privileges the account holder grants, you carry no legal obligation to repay, and the account\'s history may appear on your report while you are attached to it.',
              'A primary account is yours. You applied, you were approved, you owe the balance, and the history belongs to you permanently — including if it goes badly.',
              'Adding a family member as an authorized user is a long-standing, entirely legitimate practice. The complexity comes from the commercial market that grew around it.',
            ],
          },
          {
            kind: 'compare',
            left: {
              title: 'Authorized user',
              items: [
                'Added to an account someone else owns',
                'No legal obligation for the balance',
                'History may appear while attached',
                'Can be removed at any time by the holder',
                'Flagged with an AU responsibility code',
                'Value disappears when you are removed',
              ],
            },
            right: {
              title: 'Primary account',
              items: [
                'You applied and were approved',
                'You are legally responsible for the balance',
                'History is permanently attributed to you',
                'Stays on your file per normal reporting rules',
                'Individual or joint responsibility code',
                'Compounds with age as long as you keep it',
              ],
            },
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'The removal cliff',
            body: 'When an AU placement ends, the account generally stops reporting for you. Any effect it had can reverse. Build a plan that assumes the line is temporary, because it is.',
          },
        ],
      },
      {
        heading: 'Where the market gets murky',
        kicker: 'Market',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'A commercial market exists for paid authorized user placements on strangers\' accounts. It is not the same thing as a parent adding a child, and the differences matter — for durability, for cost, and for how lenders view the resulting file.',
              'Some lenders discount or ignore authorized user lines during manual review, particularly on larger applications, precisely because the borrower has no obligation on the account.',
            ],
          },
          {
            kind: 'table',
            caption: 'Honest expectations by scenario',
            columns: ['Scenario', 'Durability', 'Underwriter view'],
            rows: [
              ['Family member adds you long term', 'Lasting while the account stays open', 'Common and unremarkable'],
              ['Paid placement for a fixed term', 'Ends when the term ends', 'May be discounted in manual review'],
              ['Primary account you open and keep', 'Permanent history', 'Fully counted'],
              ['Secured card you fund yourself', 'Permanent history', 'Fully counted, modest limit'],
            ],
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Where Finely Cred stands',
            body: 'We describe AU as profile enhancement with a defined lifespan — never as a substitute for accuracy work or your own accounts. Educational only · results vary.',
          },
        ],
      },
    ],
  },
  {
    id: 'what-au-does',
    number: '03',
    title: 'What AU Really Does — and Does Not',
    subtitle: 'The mechanism, the limits, and the claims to walk away from',
    kicker: 'Mechanism',
    teaser: 'Thin files and thick files respond very differently to the same placement.',
    readMinutes: 8,
    promise: 'A realistic read on whether an AU line would change anything in your specific situation.',
    takeaway: 'AU can improve the picture. It cannot remove a derogatory, and it cannot manufacture income.',
    sections: [
      {
        heading: 'The mechanism, stated plainly',
        kicker: 'How it works',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'If the issuer reports authorized users, the account\'s data may appear on the AU\'s report. That can influence the fields the account touches: age of accounts, total available credit, utilization, and the count of accounts with clean payment history.',
              'How much any of that matters depends entirely on the file receiving it. A thin file with two accounts can shift noticeably. A thick file with fifteen accounts and a recent charge-off will barely register the addition.',
            ],
          },
          {
            kind: 'compare',
            left: {
              title: 'What an AU line can influence',
              items: [
                'Average age of accounts, if the line is well seasoned',
                'Total available credit and therefore utilization ratios',
                'The count of accounts with clean payment history',
                'The appearance of a thin file at a glance',
              ],
            },
            right: {
              title: 'What it cannot do',
              items: [
                'Remove or offset a collection, charge-off, or late payment',
                'Create income or a debt-to-income improvement',
                'Change your own payment behavior going forward',
                'Guarantee an approval from any lender',
              ],
            },
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'Derogatories do not dilute',
            body: 'Adding good history next to a charge-off does not neutralize it. Accuracy work and time are what address negative items — not additional lines.',
          },
        ],
      },
      {
        heading: 'Fit test: would this even help you?',
        kicker: 'Self-assessment',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Before spending anything, run the fit test. Most people who are disappointed by tradelines were never in the profile that responds to them.',
            ],
          },
          {
            kind: 'steps',
            items: [
              { label: 'Count your open accounts', body: 'Fewer than three open revolving accounts means a genuinely thin file, where depth matters most.' },
              { label: 'Check for derogatories', body: 'Active collections, charge-offs, or recent lates mean accuracy work comes first, not additions.' },
              { label: 'Calculate current utilization', body: 'If you are above roughly 50%, paying down existing balances is usually the cheaper lever.' },
              { label: 'Note your file age', body: 'A file under two years old is the profile where seasoned age contributes most.' },
              { label: 'Define the actual goal and date', body: 'Manual-underwriting scenarios treat AU lines differently than automated ones. Know which you are walking into.' },
            ],
          },
          {
            kind: 'stats',
            items: [
              { value: 'Thin file', label: 'Where AU tends to matter most' },
              { value: 'Derogatories', label: 'Accuracy work comes first — always' },
              { value: 'High utilization', label: 'Paydown usually beats purchase' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'read-like-underwriter',
    number: '04',
    title: 'Read a Tradeline Like an Underwriter',
    subtitle: 'Four numbers decide whether a line is worth anything',
    kicker: 'Evaluation',
    teaser: 'Age, limit, utilization, and reporting behavior — in that order.',
    readMinutes: 8,
    promise: 'A scoring rubric you can apply to any line before you commit to it.',
    takeaway: 'Age and limit are what you are actually buying. Everything else is packaging.',
    sections: [
      {
        heading: 'The four numbers',
        kicker: 'Rubric',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Every tradeline can be evaluated the same way, whether it is your own account or a placement someone is offering. Score these four and the decision usually makes itself.',
            ],
          },
          {
            kind: 'steps',
            items: [
              { label: 'Age', body: 'Date opened, not date added. A line opened in 2011 contributes very differently from one opened last year.' },
              { label: 'Limit', body: 'The reported credit limit sets the utilization denominator. Higher limits with low balances improve the ratio picture.' },
              { label: 'Utilization on the line', body: 'A high-limit account carrying a large balance can hurt more than it helps. Ask what balance the account actually reports.' },
              { label: 'Reporting behavior', body: 'Which bureaus, on what cycle, and with a perfect payment grid. One reported late erases the appeal entirely.' },
            ],
          },
          {
            kind: 'table',
            caption: 'Quick evaluation grid',
            columns: ['Signal', 'Weak', 'Strong'],
            rows: [
              ['Age', 'Opened in the last 2 years', 'Seasoned 7+ years'],
              ['Limit', 'Low relative to your balances', 'High enough to move your ratio'],
              ['Reported balance', 'Consistently high utilization', 'Low and stable'],
              ['Payment grid', 'Any late in recent history', 'Unbroken on-time record'],
              ['Bureau coverage', 'One bureau only', 'Reports to all three'],
              ['Account status', 'Closed or near limit', 'Open, active, in good standing'],
            ],
          },
        ],
      },
      {
        heading: 'Questions to ask before any placement',
        kicker: 'Due diligence',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'A legitimate provider answers all of these without hesitation and without promising a number. Hesitation on any of them is your answer.',
            ],
          },
          {
            kind: 'checklist',
            title: 'Pre-purchase due diligence',
            items: [
              'What is the exact date the account was opened?',
              'What is the reported credit limit?',
              'What balance does the account typically report?',
              'Which bureaus does this issuer report authorized users to?',
              'What is the statement date, and when would I expect to see it post?',
              'How long will the placement remain, and what happens after?',
              'What is the refund policy if it never posts?',
              'Has any late payment ever been reported on this account?',
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'Two answers that end the conversation',
            body: '"It will raise you 100 points" and "everyone gets approved after this." Both are outcome guarantees nobody can make.',
          },
        ],
      },
    ],
  },
  {
    id: 'utilization-theater',
    number: '05',
    title: 'The Utilization Theater',
    subtitle: 'The free lever most people never pull correctly',
    kicker: 'Free leverage',
    teaser: 'Statement date beats due date. This one detail is worth more than most purchases.',
    readMinutes: 7,
    promise: 'A timing routine that improves what reports without spending anything.',
    takeaway: 'You are graded on the statement-date balance. Pay before it closes, not just before it is due.',
    sections: [
      {
        heading: 'Statement date versus due date',
        kicker: 'Timing',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Most issuers report the balance as of the statement closing date. Pay the card in full every month after that date and your report can still show high utilization all year — you have perfect payment history and a poor-looking ratio at the same time.',
              'Moving your payment ahead of the statement close costs nothing and changes what every lender sees. It is the highest-return five minutes in this entire guide.',
            ],
          },
          {
            kind: 'timeline',
            items: [
              { when: 'Day 1', what: 'New statement cycle begins. Spending accumulates.' },
              { when: 'Day 22', what: 'Pay the balance down here — a few days before the statement closes.' },
              { when: 'Day 25', what: 'Statement closes. This is the balance most issuers report.' },
              { when: 'Day 26', what: 'The reported figure is set for the cycle.' },
              { when: 'Day 46', what: 'Payment due date. Pay any remainder to protect payment history.' },
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: 'Find your dates once',
            body: 'Statement close dates are printed on every statement and shown in most issuer apps. Write them down once and set recurring reminders three days earlier.',
          },
        ],
      },
      {
        heading: 'Spreading, limits, and the zero trap',
        kicker: 'Ratios',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Scoring models look at both overall utilization and individual account utilization. One maxed card among several low ones is visible even when the overall ratio looks acceptable.',
              'Reporting a small balance rather than zero across the board is a widely discussed nuance — some models treat all-zero as slightly less informative than a small reported balance. It is a refinement, not a foundation, and it is never worth carrying interest for.',
            ],
          },
          {
            kind: 'bullets',
            items: [
              'Spread spending so no single account reports near its limit.',
              'Request limit increases on the issuer\'s stated cadence — same spend, better ratio.',
              'Avoid closing old revolving accounts; closing removes available credit and eventually age.',
              'Automate at least the minimum on every account so payment history never becomes the failure point.',
            ],
          },
          {
            kind: 'quote',
            text: 'Before you buy a limit, use the one you already have correctly. Timing is free and it works every single month.',
            attribution: 'Finely Cred restore lane doctrine',
          },
        ],
      },
    ],
  },
  {
    id: 'risk-compliance',
    number: '06',
    title: 'Risk, Compliance, and Red Flags',
    subtitle: 'The lines that separate legitimate enhancement from fraud',
    kicker: 'Guardrails',
    teaser: 'Some things sold next to tradelines are crimes. Know them by name.',
    readMinutes: 8,
    promise: 'You will recognize a fraudulent offer before you have paid for it.',
    takeaway: 'If a strategy requires a new identity or a false statement, it is fraud — regardless of how it is marketed.',
    sections: [
      {
        heading: 'The absolute lines',
        kicker: 'Non-negotiable',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'The tradeline market sits next to a much darker market. Being able to name the difference protects your money, your file, and in some cases your freedom.',
            ],
          },
          {
            kind: 'table',
            caption: 'Recognize these immediately',
            columns: ['Offer', 'What it actually is'],
            rows: [
              ['"CPN" or credit privacy number', 'Typically a stolen or fabricated SSN — identity fraud'],
              ['"New credit file" or "credit sweep"', 'Misrepresentation to bureaus and lenders'],
              ['EIN used in place of an SSN on personal credit', 'Application fraud'],
              ['Guaranteed score increase by a specific date', 'An outcome nobody can promise'],
              ['Advance fee for removal of accurate information', 'Accurate information cannot be removed on request'],
              ['Instructions to misstate income or address', 'Application fraud'],
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'There is no legal second identity',
            body: 'Using any number other than your own Social Security number to apply for credit is fraud. No packaging, disclaimer, or terminology changes that.',
          },
        ],
      },
      {
        heading: 'Evaluating a provider',
        kicker: 'Vetting',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Legitimate providers describe mechanisms and probabilities. Illegitimate ones describe outcomes and urgency. The vocabulary difference is usually visible in the first two minutes.',
            ],
          },
          {
            kind: 'compare',
            left: {
              title: 'Green flags',
              items: [
                'Explains what AU does and does not do without prompting',
                'Discloses age, limit, and reporting bureaus in writing',
                'States that results vary and offers no score guarantee',
                'Has a written refund policy if the line never posts',
                'Recommends accuracy work first when your file needs it',
              ],
            },
            right: {
              title: 'Red flags',
              items: [
                'Promises a specific score by a specific date',
                'Sells or mentions CPNs, new files, or sweeps',
                'Pressures you to decide today',
                'Will not disclose the account age or limit',
                'Takes payment only through untraceable channels',
              ],
            },
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Compliance posture',
            body: 'Finely Cred positions authorized user placements as compliance-first profile enhancement with no guaranteed outcomes, and declines to participate in identity-based schemes of any kind. Educational only · results vary.',
          },
        ],
      },
    ],
  },
  {
    id: 'sequencing',
    number: '07',
    title: 'Where Tradelines Fit in a Real Plan',
    subtitle: 'Order of operations, from accuracy to approval',
    kicker: 'Sequencing',
    teaser: 'Tradelines are step four. Doing them first is why people spend money twice.',
    readMinutes: 7,
    promise: 'A five-step order that puts every dollar where it earns the most.',
    takeaway: 'Accuracy, then utilization, then your own accounts, then enhancement, then the application.',
    sections: [
      {
        heading: 'The five-step order',
        kicker: 'Order of operations',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Each step is cheaper than the one after it and makes the next step work better. Skipping ahead is the single most expensive habit in credit building.',
            ],
          },
          {
            kind: 'steps',
            items: [
              { label: 'Accuracy first', body: 'Pull all three reports and dispute genuinely inaccurate information with documentation. This costs nothing but time.' },
              { label: 'Utilization second', body: 'Fix statement-date timing and pay down what you can. Free, fast, and repeats every month.' },
              { label: 'Your own accounts third', body: 'A secured card or credit-builder account creates permanent history that nobody can remove from you.' },
              { label: 'Enhancement fourth', body: 'If the file is genuinely thin and the timeline is real, consider AU placement with clear expectations.' },
              { label: 'Apply last', body: 'Sequence applications deliberately once the file reflects the work.' },
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: 'Why order matters financially',
            body: 'Steps one through three are largely free. Buying step four before doing them means paying for an effect you could have produced without spending anything.',
          },
        ],
      },
      {
        heading: 'Matching the plan to the goal',
        kicker: 'Goals',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Different objectives reward different work. A mortgage timeline and a business-card timeline are not the same project, and manual underwriting treats authorized user lines with more scrutiny than automated approvals do.',
            ],
          },
          {
            kind: 'table',
            caption: 'Goal-to-lever mapping',
            columns: ['Goal', 'Highest-value work', 'Where AU sits'],
            rows: [
              ['Mortgage in 12 months', 'Accuracy, utilization, no new debt, documented income', 'Low priority — expect manual scrutiny'],
              ['Auto loan in 90 days', 'Utilization timing, avoiding new inquiries', 'Situational, thin files only'],
              ['Business credit build', 'Entity truth and vendor trade lines', 'Largely unrelated — different file'],
              ['General rebuild after derogatories', 'Accuracy work and time', 'Later, after the file stabilizes'],
              ['Genuinely thin file, no negatives', 'Own accounts plus depth', 'Reasonable supporting role'],
            ],
          },
          {
            kind: 'checklist',
            title: 'Before you spend a dollar on enhancement',
            items: [
              'All three reports pulled and reviewed within the last 30 days',
              'Every inaccurate item disputed with documentation attached',
              'Statement-date timing corrected on all revolving accounts',
              'At least one account of your own reporting on time',
              'A specific goal with a specific date written down',
              'An honest read on whether the decision will be manually underwritten',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ninety-day-calendar',
    number: '08',
    title: 'The 90-Day Optimization Calendar',
    subtitle: 'Everything in this guide, scheduled',
    kicker: 'Execution plan',
    teaser: 'Three months of free work first — then a decision made with data.',
    readMinutes: 6,
    promise: 'A dated plan where the paid decision comes last and is optional.',
    takeaway: 'Do the free work for 90 days. Then decide about enhancement with a report in front of you.',
    sections: [
      {
        heading: 'Month by month',
        kicker: 'Calendar',
        blocks: [
          {
            kind: 'timeline',
            items: [
              { when: 'Days 1–7', what: 'Pull all three reports. Build a line-by-line inventory of every tradeline: age, limit, balance, status, responsibility code.' },
              { when: 'Days 8–21', what: 'Dispute genuinely inaccurate items with documentation. Record every statement close date across your accounts.' },
              { when: 'Days 22–45', what: 'Run the first full statement-date payment cycle. Pay before close on every revolving account.' },
              { when: 'Days 46–60', what: 'Request limit increases where your issuer allows. Do not close old accounts. Open a secured card if your file is thin.' },
              { when: 'Days 61–75', what: 'Re-pull your reports and measure what actually changed. Compare against your day-one inventory.' },
              { when: 'Days 76–90', what: 'With real data in hand, decide whether enhancement is warranted — and only for a defined goal and date.' },
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: 'Measure before you buy',
            body: 'The day-75 re-pull is the point of the calendar. Most people discover the free levers moved more than they expected.',
          },
        ],
      },
      {
        heading: 'Your tradeline inventory sheet',
        kicker: 'Tooling',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'One row per account. Update it monthly. This single sheet replaces every guess you would otherwise make about your own file.',
            ],
          },
          {
            kind: 'table',
            caption: 'Inventory columns to track',
            columns: ['Column', 'Why you track it'],
            rows: [
              ['Creditor and account type', 'Shows your mix at a glance'],
              ['Date opened', 'Feeds average age — your oldest account is an asset'],
              ['Credit limit', 'Denominator for every ratio calculation'],
              ['Statement close date', 'The date your timing routine revolves around'],
              ['Reported balance', 'What lenders actually see'],
              ['Responsibility code', 'Flags AU lines and their expiration'],
              ['Bureaus reporting', 'Reveals coverage gaps across your three files'],
            ],
          },
          {
            kind: 'checklist',
            title: 'Monthly maintenance — 15 minutes',
            items: [
              'Confirm every account paid before its statement close',
              'Check that no balance is near its individual limit',
              'Verify no new inquiries you did not authorize',
              'Note any AU line approaching the end of its term',
              'Update the inventory sheet with current balances',
            ],
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Compliance',
            body: 'Educational only · results vary · no guaranteed score outcomes. Authorized user placement is profile enhancement, not credit repair, and never a substitute for accuracy work or your own accounts.',
          },
        ],
      },
    ],
  },
];
