/**
 * Business Credit Power Guide — in-app chapter content.
 *
 * Educational only. Funding is always subject to underwriting.
 * Public copy uses partner terminology.
 */
import type { GuideChapter, GuideMeta } from './guideReaderBlocks';

export const BC_GUIDE_LANDING_PATH = '/free-business-guide';
export const BC_GUIDE_READ_PATH = '/free-business-guide/read';
export const BC_BOOKING_PATH = '/enlightenment-session';
export const BC_ONE_SHEETS_PATH = '/resources/business-credit-one-sheets';

export const BC_GUIDE_META: GuideMeta = {
  title: 'The Business Credit Power Guide',
  shortTitle: 'Power Guide',
  tagline: 'Entity truth · Business files · Vendor ladder · Capital stack',
  description:
    'A free in-app guide to building business credit funders respect: fundability fundamentals, entity hygiene, the three business bureaus, vendor tier sequencing, bank rating, the capital stack, application discipline, and a 12-month build calendar.',
  compliance: 'Educational only · results vary · funding subject to underwriting',
  edition: 'Finely Cred edition',
  landingPath: BC_GUIDE_LANDING_PATH,
  readPath: BC_GUIDE_READ_PATH,
};

export const BC_GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: 'fundability-doctrine',
    number: '01',
    title: 'The Fundability Doctrine',
    subtitle: 'Why capable businesses get declined — and what underwriters are actually reading',
    kicker: 'Start here',
    teaser: 'Fundability is a state your file is in, not a score you chase.',
    readMinutes: 8,
    promise: 'You will be able to name the four pillars underwriters check before they ever look at revenue.',
    takeaway: 'Fundability is built before the application, not argued after the decline.',
    sections: [
      {
        heading: 'A decline is rarely about the business',
        kicker: 'Reframe',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Most funding declines have nothing to do with whether the business is good. They come from a file that is inconsistent, invisible, or unverifiable — three problems that are entirely fixable and almost never fixed in the week the money is needed.',
              'Underwriting is a verification exercise under time pressure. An analyst has minutes, not hours. Everything that makes verification slow reads as risk, and risk at speed becomes a decline.',
            ],
          },
          {
            kind: 'stats',
            items: [
              { value: 'Minutes', label: 'Typical time an analyst spends on first-pass verification' },
              { value: '4 pillars', label: 'Identity, files, financial optics, application behavior' },
              { value: '6–12 mo', label: 'Realistic runway to build a fundable profile from zero' },
            ],
          },
          {
            kind: 'compare',
            left: {
              title: 'What owners think is evaluated',
              items: [
                'The quality of the product or service',
                'How hard the team works',
                'The story behind the business',
                'How much money is needed right now',
              ],
            },
            right: {
              title: 'What actually gets checked',
              items: [
                'Does the entity verify against public records',
                'Do the business files exist and agree with each other',
                'Do bank statements show stable, explainable cash flow',
                'Does application behavior look disciplined or desperate',
              ],
            },
          },
        ],
      },
      {
        heading: 'The four pillars, in order',
        kicker: 'Framework',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'These pillars are sequential. Working on pillar three while pillar one is broken is the most common and most expensive mistake in business credit.',
            ],
          },
          {
            kind: 'steps',
            items: [
              {
                label: 'Entity truth',
                body: 'The legal name, address, phone, and EIN that appear identically everywhere a verifier can look. Chapter 02.',
              },
              {
                label: 'File presence',
                body: 'A D-U-N-S number and live files at the business bureaus with real trade data flowing in. Chapters 03–04.',
              },
              {
                label: 'Financial optics',
                body: 'Bank rating, average daily balance, and clean statement behavior. Chapter 06.',
              },
              {
                label: 'Application discipline',
                body: 'Sequenced, matched, and spaced applications instead of a shotgun week. Chapter 08.',
              },
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'The out-of-order penalty',
            body: 'Applying before the entity verifies wastes inquiries and creates declines that sit in underwriting memory. Build the base, then apply once.',
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'How to read this guide',
            body: 'Nine chapters, roughly one per week of build work. Educational only · results vary · funding subject to underwriting.',
          },
        ],
      },
    ],
  },
  {
    id: 'entity-truth',
    number: '02',
    title: 'Entity Truth',
    subtitle: 'The identity ledger every verifier will check against',
    kicker: 'Pillar one',
    teaser: 'One legal name, one address, one phone — matched across every system that matters.',
    readMinutes: 9,
    promise: 'A single verified identity record that survives an underwriter checking three public sources.',
    takeaway: 'One character of difference between your Secretary of State record and your application is a verification failure.',
    sections: [
      {
        heading: 'The exact-match rule',
        kicker: 'Discipline',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Verification systems match strings. "Finely Holdings LLC" and "Finely Holdings, L.L.C." are two different businesses to an automated check, and a human analyst under time pressure will not resolve the difference for you.',
              'Pick the exact legal name from your formation documents and use it everywhere without variation — bank, bureaus, licenses, invoices, applications, and your website footer.',
            ],
          },
          {
            kind: 'table',
            caption: 'The identity ledger — every field must match everywhere',
            columns: ['Field', 'Source of truth', 'Where it must also match'],
            rows: [
              ['Legal entity name', 'Secretary of State filing', 'IRS EIN letter, bank, bureaus, applications'],
              ['EIN', 'IRS CP-575 or 147C letter', 'Bank account, bureau files, tax filings'],
              ['Physical address', 'Lease or deed', 'SOS record, bank, bureaus, licenses, website'],
              ['Business phone', 'Carrier account in the business name', 'Directory listing, bureaus, website, applications'],
              ['Business email', 'Domain-based address', 'Applications, vendor accounts, invoices'],
              ['Website', 'Registered domain', 'Directory, bureaus, applications'],
              ['NAICS / SIC code', 'Selected at formation or filing', 'Bureau files, bank, applications'],
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'Address quality is scored',
            body: 'Residential and mailbox-service addresses are recognized by underwriting systems. A verifiable commercial address — including a genuine coworking or executive suite agreement — is materially stronger than a mailbox.',
          },
        ],
      },
      {
        heading: 'Industry classification is a silent gatekeeper',
        kicker: 'Classification',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Lenders maintain restricted and high-risk industry lists. A code chosen carelessly at formation can quietly route your applications into a restricted bucket regardless of how healthy the business is.',
              'Choose the code that accurately describes your primary revenue activity. Accuracy is the goal — misrepresenting your industry to dodge a restriction is fraud, not strategy.',
            ],
          },
          {
            kind: 'bullets',
            items: [
              'Confirm the NAICS code that genuinely matches your dominant revenue line.',
              'Check whether that code is commonly restricted by the lenders you intend to approach.',
              'If your business genuinely spans two activities, make sure your primary code reflects where the revenue actually comes from.',
              'Keep the same code across the bank, the bureaus, and every application.',
            ],
          },
          {
            kind: 'checklist',
            title: 'Entity truth completion checklist',
            items: [
              'Entity active and in good standing with the Secretary of State',
              'EIN letter located and stored in the document vault',
              'Business bank account open in the exact legal name',
              'Verifiable commercial address consistent everywhere',
              'Dedicated business phone listed in a directory',
              'Domain email and live website with matching contact details',
              'Licenses and permits current for the industry and locality',
              'NAICS/SIC code accurate and consistent across systems',
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: 'Do this once, correctly',
            body: 'Entity truth takes a focused week and then holds for years. Every later chapter compounds on top of it.',
          },
        ],
      },
    ],
  },
  {
    id: 'business-files',
    number: '03',
    title: 'The Three Business Files',
    subtitle: 'Dun & Bradstreet, Experian Business, and Equifax Business',
    kicker: 'Pillar two',
    teaser: 'Three bureaus, three different data models, three different ways to be invisible.',
    readMinutes: 9,
    promise: 'You will know which file each funder pulls and what actually populates it.',
    takeaway: 'Business bureaus do not populate themselves. Reporting trade lines are the only reliable fuel.',
    sections: [
      {
        heading: 'Who holds what',
        kicker: 'Landscape',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Personal credit has three bureaus reading roughly the same data. Business credit has three bureaus reading substantially different data, built for different audiences, and updated on different schedules.',
              'Suppliers and government contracting lean on Dun & Bradstreet. Banks and commercial lenders lean on Experian Business and Equifax Business. A strong PAYDEX with an empty Experian file is a partial build, not a finished one.',
            ],
          },
          {
            kind: 'table',
            caption: 'The three files at a glance',
            columns: ['Bureau', 'Headline metric', 'Primarily driven by', 'Who pulls it'],
            rows: [
              ['Dun & Bradstreet', 'PAYDEX (0–100)', 'Reported supplier payment timing', 'Suppliers, contractors, government'],
              ['Experian Business', 'Intelliscore Plus', 'Trade, public records, demographics', 'Banks, card issuers, lessors'],
              ['Equifax Business', 'Business Credit Risk / Failure scores', 'Trade, financial, public data', 'Banks, leasing companies'],
            ],
          },
          {
            kind: 'chips',
            label: 'Terms you will meet',
            items: [
              { label: 'D-U-N-S', note: 'D&B identifier, free to request' },
              { label: 'PAYDEX', note: 'Payment timing index' },
              { label: 'Intelliscore', note: 'Experian risk model' },
              { label: 'Trade line', note: 'A reporting credit relationship' },
              { label: 'Aging bucket', note: 'How late, in day ranges' },
              { label: 'Comprehensive report', note: 'Combined credit and public data' },
            ],
          },
        ],
      },
      {
        heading: 'Getting the files open — and populated',
        kicker: 'Execution',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'A D-U-N-S number is free and can be requested directly from Dun & Bradstreet. Paid expedite and monitoring products exist, but they are optional and are not required to establish the number itself.',
              'The Experian and Equifax business files typically come into existence when trade or public data appears — you cannot simply open them. That is why the vendor ladder in Chapter 04 is the engine of the whole build.',
            ],
          },
          {
            kind: 'steps',
            items: [
              { label: 'Request the D-U-N-S number', body: 'Free directly from D&B. Use the exact identity ledger from Chapter 02.' },
              { label: 'Verify what already exists', body: 'Check whether files exist under old addresses or name variants and get them consolidated.' },
              { label: 'Confirm the basics on file', body: 'Industry code, year started, employee count, and address should be accurate — errors here follow you into every pull.' },
              { label: 'Open reporting trade', body: 'Vendor accounts that report are the only dependable way to populate a thin business file.' },
              { label: 'Monitor quarterly', body: 'Confirm new accounts appear, and that payment timing posts the way you expect.' },
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'PAYDEX is about timing, not size',
            body: 'Paying on the due date is not the top of the scale — early payment is what drives the highest PAYDEX values. Small accounts paid early build the index faster than large accounts paid on time.',
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Duplicate file warning',
            body: 'Moving offices or changing your name without updating every source is the leading cause of duplicate business files. Two thin files score worse than one real one.',
          },
        ],
      },
    ],
  },
  {
    id: 'vendor-ladder',
    number: '04',
    title: 'The Vendor Tier Ladder',
    subtitle: 'How thin files become thick files, one reporting account at a time',
    kicker: 'The engine',
    teaser: 'Tier by tier, with the only rule that matters: does it report?',
    readMinutes: 10,
    promise: 'A concrete sequencing plan that turns an empty file into a fundable trade history.',
    takeaway: 'Five reporting accounts with clean timing beat twenty relationships that never report.',
    sections: [
      {
        heading: 'The one qualifying question',
        kicker: 'Filter',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Before you open any vendor account, ask one question: does this vendor report to a business bureau, and to which one? A net-30 account that never reports is a purchase order, not a credit builder.',
              'Vendors change reporting practices without notice. Verify before opening, and verify again 60 days later by checking whether the account actually appears on your file.',
            ],
          },
          {
            kind: 'table',
            caption: 'The tier ladder — climb in order',
            columns: ['Tier', 'What it is', 'Typical requirement', 'Purpose'],
            rows: [
              ['Tier 1', 'Starter net-30 suppliers', 'Entity truth + D-U-N-S', 'Create the first reporting trade lines'],
              ['Tier 2', 'Retail and fleet accounts', '3–5 reporting trades, some age', 'Add recognizable names and higher limits'],
              ['Tier 3', 'Fleet cards and larger suppliers', '6–10 trades with clean timing', 'Depth and utilization history'],
              ['Tier 4', 'Bank products and business cards', 'Strong file plus bank rating', 'Real capital access'],
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: 'Buy what you already need',
            body: 'The strongest vendor accounts are ones your business genuinely uses — shipping supplies, software, office goods. Manufactured purchases to "build credit" waste cash and often report inconsistently.',
          },
        ],
      },
      {
        heading: 'Pace, timing, and what actually posts',
        kicker: 'Cadence',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Two variables determine how quickly a thin file becomes usable: how many accounts report, and how early you pay them. Both are within your control and neither requires a large budget.',
              'Reporting is not instant. Most vendors report on a monthly cycle, and it is common for an account to take one to two full cycles to appear. Plan the calendar accordingly instead of assuming something failed.',
            ],
          },
          {
            kind: 'timeline',
            items: [
              { when: 'Weeks 1–2', what: 'Entity truth finalized. D-U-N-S requested. Two Tier 1 accounts opened.' },
              { when: 'Weeks 3–6', what: 'Place small orders on each account. Pay early — well before the due date.' },
              { when: 'Weeks 6–10', what: 'Confirm accounts appear on file. Add two more Tier 1 accounts.' },
              { when: 'Months 3–4', what: 'With 4–5 clean reporting trades, begin Tier 2 retail accounts.' },
              { when: 'Months 5–8', what: 'Add Tier 3 depth. Keep utilization moderate and timing early.' },
              { when: 'Months 9–12', what: 'Approach Tier 4 bank products with a real file behind the application.' },
            ],
          },
          {
            kind: 'checklist',
            title: 'Per-account discipline',
            items: [
              'Confirmed reporting bureau before opening the account',
              'Application details identical to the identity ledger',
              'First order placed within 30 days so the account has activity',
              'Invoice paid early, not on the due date',
              'Account verified on the bureau file within 60 days',
              'Utilization kept moderate on accounts with a stated limit',
            ],
          },
          {
            kind: 'quote',
            text: 'A business file is a record of promises kept on schedule. Early payment is the cheapest signal you will ever buy.',
            attribution: 'Finely Cred business lane doctrine',
          },
        ],
      },
    ],
  },
  {
    id: 'revolving',
    number: '05',
    title: 'Revolving and Store Credit',
    subtitle: 'Where limits, utilization, and personal guarantees enter the picture',
    kicker: 'Depth',
    teaser: 'The difference between a card in your business name and a card that builds your business file.',
    readMinutes: 8,
    promise: 'A clear-eyed view of guarantees, reporting behavior, and utilization on business revolving accounts.',
    takeaway: 'Know before you sign whether an account reports to your business file, your personal file, or both.',
    sections: [
      {
        heading: 'Personal guarantees and where accounts report',
        kicker: 'Structure',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Most small business cards require a personal guarantee, which means the owner is personally responsible if the business does not pay. That is normal and not a red flag by itself — but it should be a conscious decision, not a surprise.',
              'Reporting behavior varies by issuer. Some report business card activity only to business bureaus, some report to personal bureaus if the account goes delinquent, and some report to both continuously. This single detail changes how the account affects your personal utilization.',
            ],
          },
          {
            kind: 'compare',
            left: {
              title: 'Personally guaranteed',
              items: [
                'Owner is liable if the business does not pay',
                'Usually easier to obtain on a young business',
                'May affect personal credit depending on issuer policy',
                'Common on nearly all starter business cards',
              ],
            },
            right: {
              title: 'No personal guarantee',
              items: [
                'Liability rests with the entity',
                'Generally requires an established file and real revenue',
                'Often higher revenue and time-in-business thresholds',
                'A realistic goal for later, not a starting point',
              ],
            },
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'Ask before you apply',
            body: 'Ask the issuer two questions: does this account report to business bureaus, and does routine activity report to personal bureaus? The answers determine where the account belongs in your sequence.',
          },
        ],
      },
      {
        heading: 'Utilization optics on the business side',
        kicker: 'Optics',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Business revolving accounts carry the same optics problem as personal cards: the balance that gets reported is generally the one on the statement date, not the balance after you pay. A card paid in full every month can still report high utilization if payment lands after the statement closes.',
            ],
          },
          {
            kind: 'steps',
            items: [
              { label: 'Find each statement date', body: 'Not the due date. The statement close date is what gets reported.' },
              { label: 'Pay before the close', body: 'Bring the balance down before the statement generates, then pay any remainder by the due date.' },
              { label: 'Spread rather than max', body: 'Two accounts at 20% read far better than one account at 80%.' },
              { label: 'Request increases on schedule', body: 'Higher limits with the same spend lower reported utilization — ask on the issuer\'s stated cadence.' },
              { label: 'Never carry avoidable interest', body: 'Optics are free. Interest is not.' },
            ],
          },
          {
            kind: 'stats',
            items: [
              { value: 'Statement date', label: 'The balance that reports' },
              { value: '2+ accounts', label: 'Spread spend rather than concentrating it' },
              { value: 'Zero surprises', label: 'Automate minimums so timing never fails' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'bank-rating',
    number: '06',
    title: 'Bank Rating and Cash Flow Optics',
    subtitle: 'The number your bank knows and rarely says out loud',
    kicker: 'Pillar three',
    teaser: 'Average daily balance, deposit rhythm, and the statement pages underwriters actually read.',
    readMinutes: 8,
    promise: 'A 90-day plan to present bank statements that read as stable rather than volatile.',
    takeaway: 'Underwriters read three months of bank statements more carefully than any score you can quote.',
    sections: [
      {
        heading: 'What a bank rating measures',
        kicker: 'Mechanics',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Banks commonly assess a business by its average daily balance over a rolling period — often around 90 days — and translate it into an internal rating. Low four figures is a low rating; consistent five figures is materially stronger.',
              'The word doing the work is average. A single large deposit that leaves within a week barely moves the number. A stable floor maintained across the whole period moves it substantially.',
            ],
          },
          {
            kind: 'table',
            caption: 'How balance behavior is read',
            columns: ['Pattern', 'What underwriting infers'],
            rows: [
              ['Stable floor, regular deposits', 'Predictable operations, low volatility'],
              ['Spiky deposits with fast drawdowns', 'Lumpy revenue, higher risk of shortfall'],
              ['Frequent negative days or NSF items', 'Cash management risk — often a hard stop'],
              ['Balance built only in the month before applying', 'Visible window dressing'],
              ['Owner draws that empty the account monthly', 'No retained buffer for debt service'],
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'NSF items are disproportionately damaging',
            body: 'A handful of overdrafts in the review window can outweigh months of good behavior. Overdraft protection and a maintained buffer are cheap insurance.',
          },
        ],
      },
      {
        heading: 'The 90-day statement clean-up',
        kicker: 'Execution',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Because the review window is usually the last three months, the work has to start before the money is needed. This is the most common reason a good business gets a small offer: the statements were not ready.',
            ],
          },
          {
            kind: 'checklist',
            title: 'Before you request statements for an application',
            items: [
              'Personal and business spending fully separated',
              'A maintained balance floor rather than a month-end spike',
              'No NSF or overdraft items in the review window',
              'Owner draws regularized instead of erratic',
              'Deposits traceable to invoices or a merchant processor',
              'Any large one-time deposit documented and explainable',
              'Transfers between own accounts clearly labeled',
            ],
          },
          {
            kind: 'quote',
            text: 'Nobody funds a mystery. Every unusual line on a statement should have a one-sentence explanation ready before it is asked about.',
            attribution: 'Finely Cred funding lane doctrine',
          },
        ],
      },
    ],
  },
  {
    id: 'capital-stack',
    number: '07',
    title: 'The Capital Stack',
    subtitle: 'Matching the instrument to the need instead of chasing whatever approves',
    kicker: 'Capital',
    teaser: 'Lines, terms, equipment, SBA, and revenue-based capital — with honest cost framing.',
    readMinutes: 9,
    promise: 'You will match the right instrument to the right need before you apply for anything.',
    takeaway: 'The cheapest capital goes to the business that prepared first. Mismatched capital is expensive twice.',
    sections: [
      {
        heading: 'Five instruments, five different jobs',
        kicker: 'Selection',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Business capital is not one product. Each instrument exists for a specific job, and using the wrong one is how a profitable business ends up servicing debt it never needed.',
            ],
          },
          {
            kind: 'table',
            caption: 'Instrument selection guide',
            columns: ['Instrument', 'Right job', 'Typical expectation', 'Watch for'],
            rows: [
              ['Business line of credit', 'Working capital gaps, seasonality', 'Time in business, bank rating, file depth', 'Draw fees and annual renewal reviews'],
              ['Term loan', 'A defined project with a payback horizon', 'Documented revenue and profitability', 'Prepayment terms and total cost'],
              ['Equipment financing', 'A specific asset purchase', 'The asset itself supports the deal', 'Useful life shorter than the term'],
              ['SBA-backed loan', 'Larger, longer, lower-cost capital', 'Heavy documentation, longer timeline', 'Months, not days — start early'],
              ['Revenue-based / advance', 'Short bridges when nothing else fits', 'Processor or deposit history', 'Effective cost can be very high'],
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'Read cost as a rate, not a fee',
            body: 'A "1.35 factor over six months" is not a 35% annual cost. Convert every offer to an annualized figure before comparing, and confirm what happens if you repay early.',
          },
        ],
      },
      {
        heading: 'Preparing the package once',
        kicker: 'Package',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Assemble one funding package and reuse it. Every hour spent assembling documents during an application is an hour the file sits unreviewed while the analyst moves to the next deal.',
            ],
          },
          {
            kind: 'checklist',
            title: 'The standing funding package',
            items: [
              'Formation documents and current good-standing certificate',
              'EIN letter',
              'Last three to six months of business bank statements',
              'Most recent business tax return, if filed',
              'Year-to-date profit and loss plus balance sheet',
              'Accounts receivable and payable aging, if applicable',
              'Voided business check and proof of address',
              'A one-page use-of-funds summary in plain language',
            ],
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Underwriting reality',
            body: 'No preparation guarantees approval. Every offer depends on the funder\'s criteria at that moment. Educational only · results vary · funding subject to underwriting.',
          },
        ],
      },
    ],
  },
  {
    id: 'application-discipline',
    number: '08',
    title: 'Application Discipline',
    subtitle: 'Inquiry choreography and the sequence that protects your file',
    kicker: 'Pillar four',
    teaser: 'How you apply is itself a data point — and it is one of the easiest to get wrong.',
    readMinutes: 7,
    promise: 'A sequencing rule you can follow that keeps inquiries productive instead of scattered.',
    takeaway: 'Apply narrow and prepared. A scattered application week reads as distress and prices like it.',
    sections: [
      {
        heading: 'What a burst of applications signals',
        kicker: 'Signal',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Six applications in five days does not read as ambition. Underwriting systems and analysts both interpret clustered inquiries as a business searching urgently for cash — which is precisely the profile that gets smaller offers at higher cost.',
              'The alternative is not applying less. It is applying deliberately: fewer, better-matched applications with the package already assembled.',
            ],
          },
          {
            kind: 'steps',
            items: [
              { label: 'Qualify before you apply', body: 'Confirm stated minimums for time in business, revenue, industry, and state before submitting anything.' },
              { label: 'Ask about the pull', body: 'Soft pre-qualification versus hard inquiry, and which bureau — personal, business, or both.' },
              { label: 'Sequence by strictness', body: 'Approach the tightest, best-priced funder first while your file is untouched.' },
              { label: 'Space deliberately', body: 'Leave room between applications unless you are intentionally rate-shopping a single product in a short window.' },
              { label: 'Debrief every decline', body: 'Request the adverse action reason in writing and fix that specific thing before the next attempt.' },
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: 'Declines are data',
            body: 'Adverse action notices name the reason. Three declines with the same stated reason is not bad luck — it is a specific, fixable defect in the file.',
          },
        ],
      },
      {
        heading: 'Consistency at the point of application',
        kicker: 'Precision',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'The application form is where entity truth is tested. Every field should be copied from the identity ledger, not typed from memory at eleven at night.',
            ],
          },
          {
            kind: 'checklist',
            title: 'Pre-submit verification',
            items: [
              'Legal name matches the Secretary of State record exactly',
              'Address matches the bank, bureaus, and licenses',
              'Phone number matches the directory listing',
              'Business start date consistent with public records',
              'Revenue figures reconcilable to bank statements',
              'Industry code the same as on file elsewhere',
              'Requested amount proportionate to demonstrated revenue',
            ],
          },
          {
            kind: 'chips',
            label: 'Fast decline triggers',
            items: [
              { label: 'Name mismatch', note: 'Verification failure' },
              { label: 'Mailbox address', note: 'Address quality flag' },
              { label: 'Restricted NAICS', note: 'Policy decline' },
              { label: 'Recent NSF', note: 'Cash management risk' },
              { label: 'Inquiry cluster', note: 'Distress signal' },
              { label: 'Ask vs revenue', note: 'Disproportionate request' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'build-calendar',
    number: '09',
    title: 'The 12-Month Build Calendar',
    subtitle: 'The whole guide, sequenced into work you can actually schedule',
    kicker: 'Execution plan',
    teaser: 'Quarter by quarter, with a defined checkpoint at the end of each.',
    readMinutes: 7,
    promise: 'A dated plan with checkpoints — not a list of ideas.',
    takeaway: 'Twelve months of ordered work beats twelve months of scattered applications every time.',
    sections: [
      {
        heading: 'Four quarters, four objectives',
        kicker: 'Calendar',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Each quarter has one dominant objective and one checkpoint. If a checkpoint is not met, repeat the quarter rather than advancing — climbing the ladder on a broken rung is how builds stall at month nine.',
            ],
          },
          {
            kind: 'timeline',
            items: [
              { when: 'Q1 — Foundation', what: 'Entity truth complete, D-U-N-S requested, business bank account funded and stable, first two Tier 1 vendors opened. Checkpoint: every identity field matches across five systems.' },
              { when: 'Q2 — Trade depth', what: 'Four to six reporting trade lines with early payment history. Files verified at all three business bureaus. Checkpoint: accounts visibly reporting, not merely opened.' },
              { when: 'Q3 — Optics', what: 'Bank rating improved through a maintained balance floor. Tier 2 and Tier 3 accounts added. Utilization managed to statement dates. Checkpoint: 90 clean statement days with no NSF.' },
              { when: 'Q4 — Capital', what: 'Funding package assembled. Instruments matched to a defined need. Applications sequenced narrowly. Checkpoint: an offer you understood before accepting.' },
            ],
          },
          {
            kind: 'table',
            caption: 'Quarterly review — score each honestly',
            columns: ['Question', 'Pass looks like'],
            rows: [
              ['Does every system show the same identity?', 'Five sources checked, zero mismatches'],
              ['How many trades actually report?', 'Verified on the bureau file, not just opened'],
              ['What is the 90-day average daily balance?', 'A stable floor you did not have last quarter'],
              ['Were there any NSF items?', 'Zero in the review window'],
              ['How many inquiries this quarter?', 'Few, matched, and intentional'],
              ['Is the funding package current?', 'Assembled and dated within 30 days'],
            ],
          },
        ],
      },
      {
        heading: 'Where a specialist changes the timeline',
        kicker: 'Support',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Everything in this guide can be done alone. What a specialist changes is sequence quality and error cost — catching a name mismatch before ten applications carry it, or flagging a vendor that stopped reporting last quarter.',
              'Partners run this calendar inside the Finely Cred business workspace: identity ledger, vendor tracker, bureau checkpoints, and the funding package in one place.',
            ],
          },
          {
            kind: 'checklist',
            title: 'Ready-to-fund self-audit',
            items: [
              'Entity in good standing with a verifiable commercial address',
              'D-U-N-S active and all three business files verified',
              'Six or more reporting trades with early payment history',
              'Revolving accounts managed to statement-date utilization',
              '90 days of clean statements with a maintained floor',
              'Funding package assembled and current',
              'A specific use of funds you can state in one sentence',
            ],
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Compliance',
            body: 'Educational only · results vary · funding subject to underwriting. Nothing in this guide is a promise of approval, an offer of credit, or legal or tax advice.',
          },
        ],
      },
    ],
  },
];
