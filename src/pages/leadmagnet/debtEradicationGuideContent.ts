/**
 * Debt Eradication Field Manual — in-app chapter content.
 *
 * Educational only. Nothing here is legal advice, and nothing here promises an
 * outcome. Public copy uses partner terminology.
 */
import type { GuideChapter, GuideMeta } from './guideReaderBlocks';

export const DEBT_GUIDE_LANDING_PATH = '/free-debt-guide';
export const DEBT_GUIDE_READ_PATH = '/free-debt-guide/read';
export const DEBT_BOOKING_PATH = '/enlightenment-session';

export const DEBT_GUIDE_META: GuideMeta = {
  title: 'The Debt Eradication Field Manual',
  shortTitle: 'Debt Field Manual',
  tagline: 'Collections · Validation · Summons response · Rebuild',
  description:
    'A free in-app field manual for partners under debt pressure: the first 72 hours, who actually owns the debt, validation leverage, evidence discipline, summons and answer education, settlement math, and the rebuild after resolution.',
  compliance: 'Educational only · not legal advice · results vary',
  edition: 'Finely Cred edition',
  landingPath: DEBT_GUIDE_LANDING_PATH,
  readPath: DEBT_GUIDE_READ_PATH,
};

export const DEBT_GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: 'first-72-hours',
    number: 'I',
    title: 'The First 72 Hours',
    subtitle: 'Triage before tactics — what to do the moment debt pressure lands',
    kicker: 'Open here',
    teaser: 'Stabilize, inventory, and calendar. Panic costs more than any single debt.',
    readMinutes: 7,
    promise: 'Leave this chapter with a written inventory, a deadline calendar, and zero decisions made under pressure.',
    takeaway: 'Nothing gets paid, promised, or admitted until the debt is inventoried and the deadlines are on paper.',
    sections: [
      {
        heading: 'Stop the bleeding before you start the fight',
        kicker: 'Triage',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Debt pressure is engineered to make you move fast. The call script, the bold red envelope, the "this offer expires today" line — all of it exists because a rushed decision favors the collector. Your first advantage is refusing to be rushed.',
              'For the next 72 hours your job is not to win. Your job is to gather. Every action in this manual gets easier when you know exactly what you owe, who claims to own it, and what dates are actually running against you.',
            ],
          },
          {
            kind: 'steps',
            items: [
              {
                label: 'Freeze verbal commitments',
                body: 'Make no payment, no payment promise, and no acknowledgment of a balance over the phone. A single "yes, that\'s mine" can restart clocks and undo leverage you have not measured yet.',
              },
              {
                label: 'Open a debt file',
                body: 'One folder — physical or digital — per account. Envelope, letter, and postmark scanned the day it arrives. Screenshots of voicemails and texts with visible dates.',
              },
              {
                label: 'Inventory every claim',
                body: 'Creditor name on the letter, alleged original creditor, amount, account number fragment, date of the letter, and how it reached you (mail, call, portal, process server).',
              },
              {
                label: 'Calendar the hard dates',
                body: 'Write the postmark date and count forward. Validation windows and court answer deadlines are counted in days, not vibes.',
              },
              {
                label: 'Pull your three reports',
                body: 'Compare what the letter claims to what is actually reporting. Mismatched balances, dates, and duplicate listings are the first sign of a weak file.',
              },
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'The most expensive 60 seconds',
            body: 'A small "good faith" payment on an old account can, in many states, restart the statute of limitations on the entire balance. Never send goodwill money to an account you have not researched.',
          },
        ],
      },
      {
        heading: 'Sort the pile: pressure is not all the same',
        kicker: 'Classification',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Three envelopes can look identical and mean radically different things. Sorting by urgency — not by loudness — is what keeps you from spending your energy on the least dangerous item in the stack.',
            ],
          },
          {
            kind: 'table',
            caption: 'Triage grid — handle top row first',
            columns: ['What arrived', 'Real urgency', 'Your first move'],
            rows: [
              ['Summons / complaint (court caption, case number)', 'Highest — a hard deadline is running', 'Confirm the answer deadline for your court, then read Chapters V–VI'],
              ['Notice of garnishment or judgment', 'Highest — a judgment already exists', 'Verify the case, check for defective service, seek licensed counsel'],
              ['First contact letter from a collector', 'High — validation window is open', 'Send a written validation request (Chapter III)'],
              ['Repeat dunning letter or call campaign', 'Medium — leverage still available', 'Document contacts, request written communication only'],
              ['Credit report listing with no letter', 'Medium — accuracy dispute lane', 'Audit the data fields against your records'],
            ],
          },
          {
            kind: 'checklist',
            title: 'Your 72-hour completion checklist',
            items: [
              'Every letter scanned with its envelope and postmark',
              'One line per account in a single inventory sheet',
              'Answer deadlines and validation windows written on a calendar',
              'All three credit reports pulled and saved as PDFs',
              'A dedicated email folder and a call log started',
              'No payments, no promises, no admissions made',
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: 'How to use this manual',
            body: 'Read straight through once so you know what exists. Then return to the chapter that matches the envelope in your hand. Educational only · not legal advice · results vary.',
          },
        ],
      },
    ],
  },
  {
    id: 'who-is-talking',
    number: 'II',
    title: 'Who Is Actually Talking To You',
    subtitle: 'Original creditor, debt buyer, or agency — the answer changes everything',
    kicker: 'Identify the party',
    teaser: 'Chain of title is the hinge. Most modern collection files are thinner than they look.',
    readMinutes: 8,
    promise: 'You will be able to name the party, their role, and the proof burden that role carries.',
    takeaway: 'The further a debt travels from the original creditor, the more paper the collector needs and the less they usually have.',
    sections: [
      {
        heading: 'Three parties, three very different files',
        kicker: 'Roles',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Every collection letter comes from one of three positions, and each position carries a different amount of documentation. Reading the letterhead correctly tells you what to ask for before you ask for anything.',
            ],
          },
          {
            kind: 'chips',
            label: 'Read the letterhead',
            items: [
              { label: 'Original creditor', note: 'Has the account records' },
              { label: 'Collection agency', note: 'Servicing on commission' },
              { label: 'Debt buyer', note: 'Bought a spreadsheet' },
              { label: 'Collection law firm', note: 'Files suits at volume' },
            ],
          },
          {
            kind: 'bullets',
            items: [
              'The original creditor issued the credit and generally holds statements, the application, and the terms in force.',
              'A collection agency works the account for a fee. It usually receives a data file, not a document library.',
              'A debt buyer purchased a portfolio — often pennies on the dollar — and inherits whatever documents the sale agreement actually transferred, which may be very little.',
              'A collection law firm may act for any of the three, and the filing of a lawsuit does not by itself prove that documents exist behind it.',
            ],
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Why this matters',
            body: 'A party seeking to collect generally must be able to show it has the right to collect that specific account. When a debt has changed hands two or three times, that showing depends on documents that were never priced into the purchase.',
          },
        ],
      },
      {
        heading: 'Chain of title — the paper trail behind the number',
        kicker: 'Provenance',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Chain of title is the documented path from the original creditor to whoever is contacting you now. Portfolio sales typically produce a bill of sale, a purchase agreement, and an electronic data file. What they often do not produce is an account-level assignment naming you.',
              'You are not looking for a technicality to hide behind. You are asking a fair question that a legitimate holder can answer easily: show me that this specific account was transferred to you.',
            ],
          },
          {
            kind: 'steps',
            items: [
              { label: 'Name the current claimant', body: 'Exact legal entity from the letter, not the trade name on the envelope.' },
              { label: 'Name the alleged original creditor', body: 'Compare it to what appears on your credit reports — mismatches are common and meaningful.' },
              { label: 'Count the hops', body: 'Original creditor → buyer one → buyer two. Each hop needs its own transfer documentation.' },
              { label: 'Request account-level proof', body: 'A generic bill of sale for a portfolio of 40,000 accounts does not identify yours. Ask for the document that does.' },
              { label: 'Compare balances', body: 'Original balance, charge-off balance, and claimed balance should reconcile. Added fees and interest need a contractual basis.' },
            ],
          },
          {
            kind: 'table',
            caption: 'What each party should be able to produce',
            columns: ['Party', 'Reasonable to expect', 'Frequently missing'],
            rows: [
              ['Original creditor', 'Statements, terms, payment history', 'Signed application on old accounts'],
              ['Collection agency', 'Placement file, balance data', 'Underlying statements and terms'],
              ['Debt buyer', 'Bill of sale, purchase agreement', 'Account-level assignment naming you'],
              ['Law firm', 'Its authority to act for the holder', 'The document library behind the complaint'],
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: 'Tone matters',
            body: 'Every request you make should be businesslike, dated, and in writing. Hostility creates no leverage. A clean paper trail creates all of it.',
          },
        ],
      },
    ],
  },
  {
    id: 'validation-leverage',
    number: 'III',
    title: 'Validation Is Leverage',
    subtitle: 'The written request that converts a phone fight into a paper case',
    kicker: 'Core mechanic',
    teaser: 'What validation is, what it is not, and how the 30-day window actually works.',
    readMinutes: 9,
    promise: 'You will send one clean written request that shifts the burden and starts your evidence file.',
    takeaway: 'A printed balance is not validation. Ask in writing, ask early, and keep the proof of mailing.',
    sections: [
      {
        heading: 'What the law actually gives you',
        kicker: 'Framework',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'The Fair Debt Collection Practices Act requires most third-party collectors to give you written notice about the debt and your right to dispute it. If you dispute in writing within the stated window, the collector must generally cease collection on that debt until it mails you verification.',
              'Separately, the Fair Credit Reporting Act governs the accuracy of what appears on your credit reports. These are two different lanes with two different targets: the collector versus the furnisher and the bureaus.',
            ],
          },
          {
            kind: 'chips',
            label: 'Statutes worth knowing by name',
            items: [
              { label: 'FDCPA § 1692g', note: 'Validation notice and dispute rights' },
              { label: 'FDCPA § 1692e', note: 'False or misleading representations' },
              { label: 'FDCPA § 1692f', note: 'Unfair practices, unauthorized fees' },
              { label: 'FCRA § 1681s-2(b)', note: 'Furnisher duty after a dispute' },
              { label: 'FCRA § 1681i', note: 'Bureau reinvestigation duty' },
            ],
          },
          {
            kind: 'compare',
            left: {
              title: 'Validation (collector lane)',
              items: [
                'Target: the debt collector contacting you',
                'Trigger: your written dispute in the notice window',
                'Effect: collection generally pauses pending verification',
                'Goal: force paper before payment',
              ],
            },
            right: {
              title: 'Dispute (reporting lane)',
              items: [
                'Target: the bureaus and the furnisher',
                'Trigger: your written dispute of specific data fields',
                'Effect: a reinvestigation duty attaches',
                'Goal: accuracy of what lenders actually see',
              ],
            },
          },
        ],
      },
      {
        heading: 'Writing the request that gets a real answer',
        kicker: 'Execution',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'A validation request is short, specific, and unemotional. Long letters full of internet legalese get filed as noise. A page that names the account, states the dispute, and lists the documents you expect gets handled by a human.',
            ],
          },
          {
            kind: 'steps',
            items: [
              { label: 'Identify yourself and the account', body: 'Your name, address, their reference number. Do not include a full Social Security number.' },
              { label: 'State the dispute plainly', body: 'One sentence: you dispute the debt and request verification. No confessions, no theories.' },
              { label: 'List what you expect', body: 'Name of the original creditor, the amount claimed and how it was calculated, and documentation showing this party has the right to collect this account.' },
              { label: 'Request written communication only', body: 'Ask that further contact come by mail so the record stays clean.' },
              { label: 'Send it so it is provable', body: 'Certified mail with return receipt. Keep the green card, the receipt, and a copy of the letter you sent.' },
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'What validation is not',
            body: 'A computer printout with your name and a balance is not the same as documentation of the debt and the right to collect it. Read what arrives against what you asked for — that gap is your record.',
          },
          {
            kind: 'timeline',
            items: [
              { when: 'Day 0', what: 'Collector letter arrives — photograph the envelope and postmark.' },
              { when: 'Day 1–5', what: 'Draft and mail the validation request by certified mail.' },
              { when: 'Day 5–35', what: 'Log every contact. Collection on that debt should generally pause pending verification.' },
              { when: 'On response', what: 'File the response, compare it to your request, and note what is missing.' },
              { when: 'No response', what: 'Keep the record. Silence on a disputed account is itself evidence of file quality.' },
            ],
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Compliance note',
            body: 'Windows, wording, and effects vary by state and by the posture of your account. Educational only · not legal advice · consult a licensed attorney for your situation.',
          },
        ],
      },
    ],
  },
  {
    id: 'evidence-discipline',
    number: 'IV',
    title: 'Evidence Discipline',
    subtitle: 'Build the file that makes every later move cheaper',
    kicker: 'Operations',
    teaser: 'Certified mail, call logs, and a document index that a stranger could follow.',
    readMinutes: 6,
    promise: 'A file so organized that a specialist or attorney can act on it in one sitting.',
    takeaway: 'You do not win on memory. You win on dated documents someone else can read without you in the room.',
    sections: [
      {
        heading: 'The four-drawer file',
        kicker: 'Structure',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Every debt file has four drawers. Keep them separate and your case tells itself. Mix them and you will spend hours reconstructing dates at exactly the moment you need to be responsive.',
            ],
          },
          {
            kind: 'bullets',
            items: [
              'Inbound — everything they sent: letters, envelopes, statements, court papers, voicemail screenshots.',
              'Outbound — everything you sent: letters, certified mail receipts, return receipts, tracking printouts.',
              'Reporting — dated credit report pulls showing what the account looked like on specific days.',
              'Log — a running, timestamped record of calls, contacts, and what was said by whom.',
            ],
          },
          {
            kind: 'table',
            caption: 'Call log fields — capture these every time',
            columns: ['Field', 'Why it matters'],
            rows: [
              ['Date and time', 'Establishes frequency and pattern of contact'],
              ['Caller name and company', 'Identifies which entity is acting'],
              ['Number that called', 'Ties contacts together across weeks'],
              ['What was claimed', 'Balance, ownership, and threats stated aloud'],
              ['What you said', 'Proves you made no admissions or promises'],
            ],
          },
        ],
      },
      {
        heading: 'Certified mail as a habit, not an event',
        kicker: 'Proof of service',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Certified mail with return receipt is inexpensive relative to what it protects. It converts "I sent that" into a tracked, dated fact. Online dispute portals are convenient and leave you holding a confirmation number instead of a record.',
              'Scan the receipt the day you mail and the green card the day it returns. Name files by date so they sort themselves.',
            ],
          },
          {
            kind: 'checklist',
            title: 'Per-letter proof pack',
            items: [
              'PDF of the exact letter you mailed',
              'Certified mail receipt with the tracking number visible',
              'Delivery confirmation or returned green card',
              'A one-line index entry: date sent, recipient, subject, outcome',
              'Any response filed next to the request it answers',
            ],
          },
          {
            kind: 'quote',
            text: 'The partner who arrives with a labeled, dated file gets a strategy conversation. The partner who arrives with a shoebox gets an intake appointment.',
            attribution: 'Finely Cred debt lane doctrine',
          },
        ],
      },
    ],
  },
  {
    id: 'summons',
    number: 'V',
    title: 'When Court Papers Arrive',
    subtitle: 'Reading a summons and complaint without panic',
    kicker: 'Hard deadline',
    teaser: 'Service, caption, deadline, and the single most expensive mistake — doing nothing.',
    readMinutes: 8,
    promise: 'You will be able to read the caption, find your deadline, and understand what a default judgment costs.',
    takeaway: 'Most consumer debt suits are won by default because nobody responded. Responding is the whole ballgame.',
    sections: [
      {
        heading: 'Anatomy of the papers',
        kicker: 'Read the caption',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'A lawsuit arrives as two documents: a summons that tells you where and when to respond, and a complaint that states what the plaintiff claims. Read both completely before you form an opinion about either.',
            ],
          },
          {
            kind: 'table',
            caption: 'What to extract in the first reading',
            columns: ['Element', 'Where it appears', 'Why you need it'],
            rows: [
              ['Court and county', 'Top of the caption', 'Determines the rules and the answer deadline'],
              ['Case number', 'Caption, right side', 'Every filing and every call references it'],
              ['Plaintiff legal name', 'Caption, above "vs."', 'Tells you if this is a buyer or the original creditor'],
              ['Plaintiff attorney', 'Signature block', 'The party you will actually correspond with'],
              ['Amount claimed', 'Body of the complaint', 'Compare with your records and reports'],
              ['Attached exhibits', 'End of the complaint', 'Often thin — note exactly what is and is not attached'],
              ['Response deadline', 'Face of the summons', 'The one date that cannot slip'],
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'The default judgment trap',
            body: 'If no response is filed by the deadline, the court may enter judgment for the amount claimed without hearing anything from you. Judgments can lead to wage garnishment, bank levies, and liens depending on your state.',
          },
        ],
      },
      {
        heading: 'Service, timing, and getting help',
        kicker: 'Procedure',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'How you received the papers matters. Rules vary by state, but defective service — papers left with the wrong person, at an old address, or never delivered at all — is a real and commonly raised issue.',
              'Deadlines are counted differently across courts. Some count calendar days from service, some exclude weekends and holidays, and limited-jurisdiction courts often run on shorter clocks than general civil courts. Confirm your specific deadline with the court clerk or a licensed attorney rather than assuming.',
            ],
          },
          {
            kind: 'steps',
            items: [
              { label: 'Record how you were served', body: 'Date, time, location, who accepted the papers, and what the process server said.' },
              { label: 'Confirm the case exists', body: 'Look up the case number on the court portal. Verify the parties and the filing date.' },
              { label: 'Confirm the deadline with the court', body: 'Call the clerk and ask how many days you have to file a response in that court. Clerks answer procedural questions.' },
              { label: 'Do not ignore, do not improvise alone', body: 'Consult a licensed attorney or a legal aid organization in your county. Many offer limited-scope help on consumer debt cases.' },
              { label: 'Assemble the file', body: 'Bring the four-drawer file from Chapter IV. Preparation converts an expensive consultation into a productive one.' },
            ],
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Scope note',
            body: 'This chapter is education about how debt litigation works, not legal advice about your case. Court rules, deadlines, and defenses are state-specific. A licensed attorney in your jurisdiction is the right person to advise you.',
          },
        ],
      },
    ],
  },
  {
    id: 'answer-defenses',
    number: 'VI',
    title: 'The Answer and Common Defenses',
    subtitle: 'What a response document does, and the arguments you will hear about',
    kicker: 'Court education',
    teaser: 'Denials, affirmative defenses, and why standing and the statute of limitations come up so often.',
    readMinutes: 9,
    promise: 'You will understand the vocabulary well enough to have a real conversation with counsel.',
    takeaway: 'An answer preserves your position. Filing one on time is what keeps every other option alive.',
    sections: [
      {
        heading: 'What an answer actually is',
        kicker: 'Mechanics',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'An answer is a document filed with the court that responds to each numbered allegation in the complaint and raises any defenses you intend to rely on. It is usually short. Its power is procedural: filing it on time means the case proceeds on the merits instead of ending in default.',
              'Responses to allegations typically fall into three categories, and picking the right one for each paragraph is a matter of accuracy rather than strategy.',
            ],
          },
          {
            kind: 'bullets',
            items: [
              'Admit — the allegation is true as written (for example, your name and county of residence).',
              'Deny — the allegation is not true as written.',
              'Lack sufficient knowledge — you genuinely cannot confirm or deny, which is common for internal account histories you were never given.',
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'Filing is not the same as mailing',
            body: 'Most courts require the answer to be filed with the clerk and served on the plaintiff\'s attorney, and many charge a filing fee with a waiver available for hardship. Ask the clerk what that court requires.',
          },
        ],
      },
      {
        heading: 'Defenses you will hear discussed',
        kicker: 'Vocabulary',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Affirmative defenses are reasons the plaintiff should not prevail even if parts of the complaint are true. They must generally be raised in the answer or they can be considered waived — which is another reason the answer deadline carries so much weight.',
            ],
          },
          {
            kind: 'table',
            caption: 'Frequently raised defenses in consumer debt cases',
            columns: ['Defense', 'The question it asks'],
            rows: [
              ['Lack of standing', 'Has this plaintiff shown it owns or holds this specific account?'],
              ['Statute of limitations', 'Has the state time limit for filing suit on this type of debt already run?'],
              ['Failure to state a claim', 'Does the complaint, even if true, actually establish a legal claim?'],
              ['Improper service', 'Were the papers delivered as the rules require?'],
              ['Account stated / accord', 'Was there a prior settlement or payment arrangement that resolves this?'],
              ['Identity or amount error', 'Is this the right person, and is the number correct and contractually supported?'],
            ],
          },
          {
            kind: 'chips',
            label: 'Terms worth understanding before your consultation',
            items: [
              { label: 'Standing', note: 'Right to bring the claim' },
              { label: 'SOL', note: 'Statute of limitations, state-specific' },
              { label: 'Discovery', note: 'Formal exchange of evidence' },
              { label: 'Affidavit', note: 'Sworn written statement' },
              { label: 'Default judgment', note: 'Entered when no answer is filed' },
              { label: 'Vacate', note: 'Ask the court to undo a judgment' },
            ],
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Honest framing',
            body: 'Raising a defense is not a magic phrase and there are no guaranteed outcomes. These are the arguments courts actually consider — whether any of them fit your facts is a question for a licensed attorney.',
          },
        ],
      },
    ],
  },
  {
    id: 'discovery-affidavits',
    number: 'VII',
    title: 'Discovery and the Affidavit Problem',
    subtitle: 'Where thin files show themselves',
    kicker: 'Proof pressure',
    teaser: 'What discovery asks for, and why sworn statements from portfolio buyers draw scrutiny.',
    readMinutes: 7,
    promise: 'You will understand why documentation requests change the economics of a volume collection case.',
    takeaway: 'Volume litigation is priced on the assumption that nobody asks for documents. Asking is the whole leverage.',
    sections: [
      {
        heading: 'What discovery is for',
        kicker: 'Process',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Discovery is the formal, court-supervised exchange of information between parties. It is where "we have records" either becomes actual records or becomes an objection. For a plaintiff that bought a data file, producing account-level documents can cost more than the account is worth.',
            ],
          },
          {
            kind: 'bullets',
            items: [
              'Interrogatories — written questions the other side must answer under oath.',
              'Requests for production — demands for specific documents such as the account agreement, statements, and transfer records.',
              'Requests for admission — statements the other side must admit or deny.',
              'Depositions — sworn oral testimony, less common in small consumer cases.',
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: 'Discovery cuts both ways',
            body: 'You can be required to answer as well, truthfully and on time. This is one of several reasons discovery should be conducted with counsel rather than from a template found online.',
          },
        ],
      },
      {
        heading: 'Affidavits and the business records question',
        kicker: 'Scrutiny',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Collection plaintiffs frequently rely on an affidavit — a sworn statement from an employee attesting to the balance and the account history. Courts have examined whether such an affiant has genuine personal knowledge of records created by a different company years earlier.',
              'The recurring issues are the same across jurisdictions: who created the record, whether it was made in the regular course of business at the time of the events, and whether the person signing has any actual basis to swear to it.',
            ],
          },
          {
            kind: 'table',
            caption: 'What a court may look for in a records affidavit',
            columns: ['Question', 'Why it matters'],
            rows: [
              ['Who is the affiant?', 'Title and employer relative to the original creditor'],
              ['What is the basis of knowledge?', 'Personal knowledge versus a recitation of a data field'],
              ['Were records made contemporaneously?', 'Business records treatment generally depends on it'],
              ['Are the attached documents complete?', 'A single screenshot rarely establishes a full account history'],
              ['Does the balance reconcile?', 'Principal, interest, and fees should be traceable'],
            ],
          },
          {
            kind: 'quote',
            text: 'Portfolio economics assume silence. Documentation requests are not hostile — they are simply the moment the file has to be worth what it was sold for.',
            attribution: 'Finely Cred debt lane doctrine',
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Not a loophole',
            body: 'None of this means a debt is not owed. It means a party asking a court for a judgment should be able to prove what it claims. Educational only · not legal advice.',
          },
        ],
      },
    ],
  },
  {
    id: 'settlement',
    number: 'VIII',
    title: 'Settlement Without Self-Harm',
    subtitle: 'Negotiating from information instead of fear',
    kicker: 'Resolution',
    teaser: 'Lump sum math, terms in writing, and the tax surprise nobody mentions.',
    readMinutes: 8,
    promise: 'A settlement you can actually afford, documented before a dollar moves.',
    takeaway: 'Never fund a settlement without the terms in writing, in advance, signed by the party that can bind the account.',
    sections: [
      {
        heading: 'What you are actually negotiating',
        kicker: 'Terms',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Most people negotiate only the number. The number is one of five terms, and the other four determine whether the settlement actually ends the problem or simply reduces it temporarily.',
            ],
          },
          {
            kind: 'steps',
            items: [
              { label: 'Amount and structure', body: 'Lump sum versus installments. A single payment usually commands a better figure; installments must be affordable on your worst month, not your best.' },
              { label: 'Full and final language', body: 'The agreement should state the payment resolves the account in full and that no balance remains to be pursued or sold.' },
              { label: 'Reporting treatment', body: 'Specify in writing how the account will be reported after payment. Get it in the document — verbal assurances do not survive staff turnover.' },
              { label: 'No further sale or transfer', body: 'The agreement should prevent the remaining balance from being resold to another buyer.' },
              { label: 'Payment method and proof', body: 'Traceable payment only. Never give live bank account access over the phone to a collector you cannot verify.' },
            ],
          },
          {
            kind: 'callout',
            tone: 'warn',
            title: 'Written first, funded second',
            body: 'Get the complete agreement in writing, signed by the party with authority over the account, before any money moves. A settlement funded on a phone promise is a donation with a receipt.',
          },
        ],
      },
      {
        heading: 'The tax line nobody mentions',
        kicker: 'Consequences',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Forgiven debt above the IRS reporting threshold may be reported to you and the IRS on a Form 1099-C and can be treated as taxable income. A settlement that forgives a large balance can therefore create a tax bill in the following filing year.',
              'Exclusions and exceptions exist, including certain insolvency situations. Whether any applies to you is a question for a tax professional — factor it into the negotiation rather than discovering it in January.',
            ],
          },
          {
            kind: 'stats',
            items: [
              { value: '1099-C', label: 'Form used to report cancelled debt' },
              { value: 'Same year', label: 'Forgiveness is generally reported for the year it occurs' },
              { value: 'Ask first', label: 'Model the tax effect before you agree to terms' },
            ],
          },
          {
            kind: 'checklist',
            title: 'Before you send the money',
            items: [
              'Signed written agreement in hand, matching what was discussed',
              'Full and final satisfaction language present',
              'Reporting treatment stated explicitly',
              'No-resale and no-further-collection language present',
              'Traceable payment method with a receipt',
              'Tax effect discussed with a qualified professional',
              'A calendar reminder to verify reporting 45 days after payment',
            ],
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Compliance',
            body: 'Educational only · not legal or tax advice · results vary. Consult a licensed attorney and a tax professional before settling a significant balance.',
          },
        ],
      },
    ],
  },
  {
    id: 'rebuild',
    number: 'IX',
    title: 'The Rebuild After Resolution',
    subtitle: 'Turning a closed chapter into a stronger file',
    kicker: 'Forward',
    teaser: 'Verify the reporting, understand the aging clock, and rebuild depth deliberately.',
    readMinutes: 7,
    promise: 'A 90-day rebuild sequence that starts the day the account resolves.',
    takeaway: 'Resolution is a data event. Verify how it reported, then rebuild in the order that actually compounds.',
    sections: [
      {
        heading: 'Verify what actually reported',
        kicker: 'Audit',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'Settlement or dismissal does not update your credit file automatically or instantly. Roughly 30 to 45 days after resolution, pull all three reports and compare every field against the agreement you signed.',
              'The date of first delinquency is the field that governs how long most negative information can remain. It should reflect the original delinquency on the account — not the date the debt was sold, transferred, or settled. Re-aging is one of the most consequential reporting errors to catch.',
            ],
          },
          {
            kind: 'table',
            caption: 'Post-resolution field audit',
            columns: ['Field', 'What it should show'],
            rows: [
              ['Balance', 'Consistent with the resolution — no phantom remainder'],
              ['Account status', 'Matches the written agreement'],
              ['Date of first delinquency', 'The original delinquency date, unchanged by sale or settlement'],
              ['Duplicate listings', 'Original creditor and buyer should not both show an active balance'],
              ['Payment history grid', 'No new derogatory marks after the resolution date'],
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: 'Dispute the field, not the feeling',
            body: 'Reporting disputes work best when they cite a specific inaccurate field and attach the document that proves it — the settlement agreement, the receipt, the dismissal order.',
          },
        ],
      },
      {
        heading: 'Rebuild in the order that compounds',
        kicker: 'Sequence',
        blocks: [
          {
            kind: 'paragraphs',
            items: [
              'After debt pressure, the instinct is to apply for everything that will approve you. That is how thin files get thinner. Depth first, utilization discipline second, new credit last.',
            ],
          },
          {
            kind: 'timeline',
            items: [
              { when: 'Days 1–30', what: 'Verify reporting on all three bureaus. Document what resolved and how it posted.' },
              { when: 'Days 30–60', what: 'Stabilize utilization on any surviving revolving accounts. Automate minimums so no new late marks appear.' },
              { when: 'Days 60–90', what: 'Add one reporting anchor — a secured card or credit-builder product used lightly and paid in full.' },
              { when: 'Months 3–6', what: 'Let age accumulate. Avoid new applications while the file stabilizes.' },
              { when: 'Months 6–12', what: 'Reassess with a specialist. Then sequence toward personal or business objectives deliberately.' },
            ],
          },
          {
            kind: 'checklist',
            title: 'Rebuild guardrails',
            items: [
              'One new account at a time, never a burst of applications',
              'Utilization kept low on the statement date, not just the due date',
              'Every payment automated so history is never the failure point',
              'Documents retained for at least seven years after resolution',
              'Annual report pull calendared so nothing reappears unnoticed',
            ],
          },
          {
            kind: 'callout',
            tone: 'law',
            title: 'Where Finely Cred fits',
            body: 'Partners run this sequence with a specialist inside the portal — validation tracking, document vault, and rebuild checkpoints in one place. Educational only · not legal advice · results vary.',
          },
        ],
      },
    ],
  },
];
