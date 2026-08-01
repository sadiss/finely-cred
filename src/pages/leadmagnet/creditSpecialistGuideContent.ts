/**
 * Credit Specialist Guide — in-app chapter content.
 * Educational only. Public copy uses partner terminology.
 */

export const CS_GUIDE_PATH = '/credit-specialist-guide';
export const CS_GUIDE_READ_PATH = '/credit-specialist-guide/read';
/** Pricing / signup owned by another lane — landings CTA here. */
export const CS_JOIN_PATH = '/credit-specialist/join';
export const CS_PRICING_PATH = '/credit-specialist';

/** Coaching dialogue rendered as a binder role-play card. */
export type CreditSpecialistScript = {
  label: string;
  lines: Array<{ speaker: 'you' | 'partner'; text: string }>;
};

/** Tear-out checklist rendered with binder checkbox glyphs. */
export type CreditSpecialistChecklist = {
  label: string;
  items: string[];
};

/** Real, clickable references — escalation portals, statutes, internal routes. */
export type CreditSpecialistResource = {
  label: string;
  href: string;
  note?: string;
};

export type CreditSpecialistGuideSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: string;
  script?: CreditSpecialistScript;
  checklist?: CreditSpecialistChecklist;
  resources?: CreditSpecialistResource[];
};

export type CreditSpecialistGuideChapter = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  kicker: string;
  teaser: string;
  accent: 'gold' | 'lime' | 'sky' | 'rose';
  sections: CreditSpecialistGuideSection[];
};

export const CS_GUIDE_META = {
  title: 'The Credit Specialist Playbook',
  shortTitle: 'Specialist Playbook',
  tagline: 'Personal credit · Business credit · Debt strategy · Opportunity everywhere',
  description:
    'A free in-app guide for Credit Specialists: personal and business credit, debt challenge insight, court/summons education, funding and tradeline opportunity framing, and specialist income growth with Finely Cred.',
  compliance: 'Results vary · not legal advice · funding subject to underwriting',
  edition: 'Finely Cred edition',
  valueLabel: '$297+',
  onesheetLabel: 'Credit Specialist one-sheet',
} as const;

/** Chapter numbers are derived from order so chapters can be inserted safely. */
type CreditSpecialistChapterInput = Omit<CreditSpecialistGuideChapter, 'number'>;

const CS_GUIDE_CHAPTER_INPUTS: CreditSpecialistChapterInput[] = [
  {
    id: 'welcome',
    title: 'The Specialist Advantage',
    subtitle: 'Why operators who teach systems outperform operators who chase leads',
    kicker: 'Start here',
    teaser: 'Position, language, and the partner-first posture that makes every chapter usable.',
    accent: 'gold',
    sections: [
      {
        heading: 'What this guide is',
        paragraphs: [
          'This is a field manual for Credit Specialists — people who help partners restore personal files, sequence business credit, respond to debt pressure, and unlock funding opportunity without hype.',
          'You will not find miracle guarantees. You will find frameworks Finely Cred trains specialists to use: factual findings, evidence discipline, fundability stage gates, and compliant opportunity framing.',
          'Open any chapter from the landing preview. Read freely in the in-app reader. Join the program later when you want the full operating stack — reading never requires signup.',
        ],
      },
      {
        heading: 'Partner, not “client”',
        paragraphs: [
          'In public and portal language, the people you serve are partners. That single word shifts the relationship from extractive sales to co-owned progress — and it keeps your messaging aligned with Finely Cred’s brand standard.',
        ],
        bullets: [
          'Partners upload reports, approve letters, and own outcomes.',
          'Specialists coach, document, sequence, and escalate with clarity.',
          'The OS holds the work — your expertise directs it.',
        ],
      },
      {
        heading: 'The four craft lanes',
        paragraphs: [
          'Every partner conversation maps to at least one lane. Master the language of each before you sell anything.',
        ],
        bullets: [
          'Personal restore & build — scores, utilization, factual disputes, habits.',
          'Business credit — entity truth, vendors, revolving, capital packaging.',
          'Debt & laws insight — validation, documentation, summons education (not legal advice).',
          'Opportunity & freedom framing — funding, depth, referrals, specialist craft.',
        ],
      },
      {
        heading: 'How to use the chapters',
        paragraphs: [
          'Read straight through once. Then return to the chapter that matches the partner sitting in front of you: personal restore, business fundability, debt pressure, or growth opportunity.',
        ],
        callout: 'Educational guide only. Results vary · not legal advice · funding subject to underwriting.',
      },
    ],
  },
  {
    id: 'first-conversation',
    title: 'The First Partner Conversation',
    subtitle: 'A discovery call that diagnoses instead of pitches',
    kicker: 'Field skill',
    teaser: 'The eight questions that reveal the real bottleneck — and the four sentences you never say.',
    accent: 'rose',
    sections: [
      {
        heading: 'Diagnose before you prescribe',
        paragraphs: [
          'Most specialists lose the first call by answering a question nobody asked. A partner says “I need my score fixed,” and the untrained response is a program pitch. The trained response is a diagnosis: what is on the file, what is the deadline behind the request, and which of the four lanes the work actually lives in.',
          'A partner who feels examined rather than sold to will hand you the documents you need on the same call. That is the entire economic difference between a specialist who closes on discovery and one who chases paperwork for three weeks.',
        ],
        script: {
          label: 'Discovery — first four minutes',
          lines: [
            { speaker: 'partner', text: 'I need my credit fixed. How much do you charge?' },
            {
              speaker: 'you',
              text: 'Before price, I need to know what we would actually be fixing. What made today the day you looked this up?',
            },
            { speaker: 'partner', text: 'I got denied on a car loan last week.' },
            {
              speaker: 'you',
              text: 'Did the denial letter list reasons? Those reason codes tell us in about two minutes whether this is a utilization problem, a derogatory problem, or a thin-file problem — and each one has a completely different plan.',
            },
          ],
        },
      },
      {
        heading: 'The eight discovery questions',
        paragraphs: [
          'Run these in order. Each answer narrows the lane. Write the answers into the partner record while you are on the call — memory is not documentation.',
        ],
        bullets: [
          'What happened recently that made you look for help? (Reveals the deadline.)',
          'Have you pulled all three bureau reports in the last 30 days? (Reveals whether you can work today.)',
          'What is the single account you would remove if you could only pick one? (Reveals priority.)',
          'Is anyone currently calling, emailing, or mailing you about a debt? (Reveals collection pressure.)',
          'Have you received any court papers — a summons, complaint, or garnishment notice? (Reveals urgency; deadlines override everything.)',
          'Do you have a business entity, or plans for one in the next year? (Reveals the business lane.)',
          'What do your card balances look like against their limits? (Reveals the fastest lever.)',
          'What has already been tried, and what happened? (Reveals what not to repeat.)',
        ],
        callout:
          'If the answer to the court-papers question is yes, stop the credit conversation and address the deadline first. Everything else can wait a week; a default judgment cannot be un-entered by a dispute letter.',
      },
      {
        heading: 'Four sentences that end careers',
        paragraphs: [
          'Language on a discovery call is a compliance surface. These four constructions are the ones that create refund demands, complaints, and regulatory exposure — and every one of them can be replaced with something both honest and stronger.',
        ],
        bullets: [
          '“I can get that deleted.” → “That item is reporting a status that contradicts the payment grid — that contradiction is disputable, and here is what the bureau has to do with it.”',
          '“You will be at 700 in 90 days.” → “Here is the specific lever we would pull first, and here is what typically changes when it works. Timelines and results vary.”',
          '“That debt is not yours anymore.” → “Whether the obligation is valid is a legal question. What I can do is document what the collector has and has not proven in writing.”',
          '“Just do not pay them.” → “Never take payment direction from me. What I can do is make sure every contact and every claim is captured in writing before you decide anything.”',
        ],
        callout:
          'Educational only · not legal advice. Specialists document and educate; licensed attorneys advise on legal strategy.',
      },
    ],
  },
  {
    id: 'intake-evidence',
    title: 'Intake & Evidence Discipline',
    subtitle: 'The file you build in week one decides every round after it',
    kicker: 'Operating craft',
    teaser: 'One intake standard, one naming convention, one evidence vault — the boring habit that wins rounds.',
    accent: 'sky',
    sections: [
      {
        heading: 'Why intake quality predicts outcomes',
        paragraphs: [
          'A dispute is only as strong as the exhibit attached to it. Specialists who work from screenshots taken months ago, unlabelled PDFs, and half-remembered phone calls end up writing letters that assert things they cannot show. Reinvestigations resolve against unsupported assertions almost every time.',
          'The fix is unglamorous: one intake standard applied to every partner, regardless of how urgent they sound. Ten disciplined minutes at intake removes hours of reconstruction later, and it is what lets a second specialist pick up the file without calling you.',
        ],
      },
      {
        heading: 'The intake standard',
        checklist: {
          label: 'Collect before round one',
          items: [
            'All three bureau reports, pulled within the last 30 days, saved as PDFs — not screenshots of a phone app.',
            'Government-issued photo ID and a proof of current address dated within 60 days.',
            'Every collection letter, notice, and envelope the partner still has, photographed front and back.',
            'Any prior dispute correspondence and the bureau responses to it — repeats of a failed argument are wasted rounds.',
            'A one-page account inventory: creditor, account number fragment, balance, status, and which bureaus report it.',
            'Written confirmation of what the partner wants and what they were told to expect.',
          ],
        },
        paragraphs: [
          'Name every file the same way: date, bureau or furnisher, and item. A vault where “Equifax-2026-03-11-collection-midland.pdf” sits next to “IMG_4471.png” is a vault that will fail you in round two.',
        ],
      },
      {
        heading: 'What makes an exhibit usable',
        paragraphs: [
          'An exhibit has to prove one specific thing that a data analyst can act on. A full 40-page report attached to a letter proves nothing because it points at nothing. A cropped account block with the contradiction visible, labelled “Exhibit A,” proves exactly one thing and demands exactly one correction.',
        ],
        bullets: [
          'Crop to the account block, not the whole page — the reader should not have to hunt.',
          'Keep the bureau name, the pull date, and the account identifier visible in the crop.',
          'Label each exhibit and reference it by label in the letter body.',
          'One claim per exhibit. Two contradictions in one image become one vague complaint.',
          'Never annotate on top of data in a way that could be read as altering the record — annotate in the letter, not the image.',
        ],
        callout:
          'As you can see here on Equifax, the status field reads “Current” while the same account block shows three 90-day late marks — cite the screen, name the contradiction, and let the finding do the work.',
      },
    ],
  },
  {
    id: 'personal-credit',
    title: 'Personal Credit Mastery',
    subtitle: 'Restore accuracy, build depth, and coach habits that compound',
    kicker: 'Personal lane',
    teaser: 'Teach partners how files actually move — utilization, age, mix, and factual dispute craft.',
    accent: 'lime',
    sections: [
      {
        heading: 'What personal credit really signals',
        paragraphs: [
          'A score is a compressed story about payment history, utilization, age of accounts, mix, and recent inquiries. Specialists who explain the story earn trust faster than specialists who only chase point jumps.',
          'Restore work removes or corrects inaccurate reporting. Build work strengthens the healthy parts of the file. Partners need both — sequenced honestly.',
        ],
        bullets: [
          'Payment history still dominates — late marks need a plan, not a pep talk.',
          'Utilization is often the fastest lever when balances are controllable.',
          'Thin files need depth before they need aggression.',
          'Inquiries cluster; spray-and-pray apps punish the file.',
        ],
      },
      {
        heading: 'Restore: accuracy before aggression',
        paragraphs: [
          'Start with a clean inventory: every tradeline, collection, public record, and inquiry across bureaus. Highlight mismatches the partner can see on screenshots — dates, balances, status codes, ownership.',
          'Prioritize items that are inaccurate, incomplete, or unverifiable over “everything negative.” Volume without evidence looks like spam; evidence without prioritization wastes rounds.',
        ],
        bullets: [
          'Pull organized reports and label accounts by impact and evidence readiness.',
          'Protect good accounts — never sacrifice a clean revolving line for a vanity dispute.',
          'Set round expectations: replies take time; nothing is guaranteed.',
        ],
      },
      {
        heading: 'Dispute craft that holds up',
        paragraphs: [
          'Auto-generated reasons should read like factual findings tied to what the partner can see on the bureau screenshot — not procedural commands like “please verify and delete.”',
          'Evidence vault discipline (IDs, statements, prior letters, screenshots with dates) is what separates serious operators from template spam.',
        ],
        callout: 'As you can see here on Equifax… — cite the screen. Never invent a seal, status, or outcome.',
      },
      {
        heading: 'Build: habits that compound',
        paragraphs: [
          'After pressure items are in motion, coach the file that remains: on-time payments, utilization bands, account age protection, and responsible new credit only when the story supports it.',
        ],
        bullets: [
          'Week 1: pull + organize + prioritize tradelines that matter.',
          'Week 2–3: first round letters with evidence attached.',
          'Ongoing: utilization coaching, good-account protection, next-round strategy.',
          'Always: set expectations — timelines vary; results vary; nothing is guaranteed.',
        ],
      },
    ],
  },
  {
    id: 'business-credit',
    title: 'Business Credit Power',
    subtitle: 'EIN files, fundability pillars, and sequencing that lenders respect',
    kicker: 'Business lane',
    teaser: 'Entity truth → bureau match → vendors → revolving → capital asks — in that order.',
    accent: 'sky',
    sections: [
      {
        heading: 'Why business credit is a different game',
        paragraphs: [
          'Personal FICO and commercial fundability are related but not the same. Funders evaluate entity truth, address/phone match, time in business optics, vendor reporting depth, and capital-pack readiness.',
          'Specialists who conflate “I have a personal score” with “my LLC is fundable” create rejection cycles. Teach the commercial story as its own file.',
        ],
      },
      {
        heading: 'The sequencing blueprint',
        bullets: [
          'Entity pillars: legal name, EIN, addresses, phones, and SOS status must match.',
          'Bureau readiness: D&B / Experian Biz / Equifax Biz presence before volume apps.',
          'Vendor depth: Tier-1 net-30 reporters paid early, spaced intentionally.',
          'Revolving + tradelines: strengthen optics before large capital asks.',
          'Capital pack: bank statements, projections, and use-of-funds narrative.',
        ],
        callout: 'Funding is subject to underwriting. Sequence first — ask second.',
      },
      {
        heading: 'What “fundable” looks like in practice',
        paragraphs: [
          'Fundability is a file state, not a program fee. Partners become commercially identifiable, reportable, and document-ready before they chase named products.',
        ],
        bullets: [
          'Green lights: matched identity, reporting vendors, clean payment optics, packaged docs.',
          'Blockers: mismatched SOS data, thin vendor history, inquiry sprawl, premature apps.',
          'Your job: show the next stage gate — not the next ad promise.',
        ],
      },
      {
        heading: 'Mistakes that freeze files',
        paragraphs: [
          'Mismatched records, thin vendor history, inquiry sprawl, and premature applications are the blockers that stop sequencing cold. Teach partners to earn the next stage gate before they chase the next “easy approval” ad.',
        ],
      },
    ],
  },
  {
    id: 'debt-strategy',
    title: 'Debt: Challenge & Eradicate Pressure',
    subtitle: 'Validation, documentation, and calm response under collection heat',
    kicker: 'Debt lane',
    teaser: 'Turn chaos into a paper trail — validation first, emotion second, outcomes never promised.',
    accent: 'rose',
    sections: [
      {
        heading: 'Pressure is a process problem',
        paragraphs: [
          'Collections thrive on confusion. Specialists restore control by organizing accounts, capturing every notice, and teaching partners to respond with documentation — not panic payments or silence.',
          '“Eradicate pressure” in Finely language means reducing chaos and correcting inaccurate reporting — never a guaranteed wipe of lawful obligations.',
        ],
      },
      {
        heading: 'Validation-first doctrine (educational)',
        bullets: [
          'Identify who is contacting the partner: original creditor, collector, or buyer.',
          'Request validation / verification where applicable — keep certified mail receipts.',
          'Never admit liability casually on a recorded call; ask for writing.',
          'Log dates, amounts claimed, and contradictions across letters.',
          'Separate “stop the chaos” moves from “rebuild the file” moves.',
        ],
        callout: 'Educational only — not legal advice. Results vary by account, state, and facts.',
      },
      {
        heading: 'Laws & rights insight (high level)',
        paragraphs: [
          'Partners often hear acronyms — FDCPA, FCRA, FDCPA mini-Miranda language, state consumer protections — without knowing what they mean for day-to-day response. Specialists teach orientation, not courtroom strategy.',
        ],
        bullets: [
          'Communication rules: know who may contact whom, and keep everything in writing when possible.',
          'Reporting accuracy: inaccurate or incomplete credit reporting is a documentation problem first.',
          'Deadlines matter: ignore mail long enough and options shrink — calendar every date.',
          'Escalate ethically: CFPB, FTC, state AG, and BBB paths exist for complaints; they are not magic wands.',
          'When legal strategy is needed, refer to a licensed attorney in the partner’s jurisdiction.',
        ],
        callout: 'Not legal advice. Statutes and remedies vary. Educate and organize — do not practice law.',
      },
      {
        heading: 'Eradication framing that stays compliant',
        paragraphs: [
          'Talk about reducing pressure, correcting inaccurate reporting, and rebuilding optionality — never “wipe any debt guaranteed.” Partners deserve honesty; underwriters and regulators notice the difference.',
        ],
      },
    ],
  },
  {
    id: 'court-summons',
    title: 'Court & Summons Insight',
    subtitle: 'Deadlines, documentation, and a winning educational posture',
    kicker: 'Court education',
    teaser: 'Summons panic is common. Calm calendars, evidence folders, and counsel when needed are the antidote.',
    accent: 'gold',
    sections: [
      {
        heading: 'What a summons actually means',
        paragraphs: [
          'A summons is a formal notice that a lawsuit has been filed — not an automatic judgment. Missing deadlines is often more dangerous than the complaint itself. Specialists help partners understand urgency without playing lawyer.',
        ],
      },
      {
        heading: 'Educational response map',
        bullets: [
          'Calendar every deadline the moment papers arrive.',
          'Preserve the envelope, stamp, complaint, and all exhibits.',
          'Inventory what the plaintiff claims vs what the partner’s records show.',
          'Seek licensed counsel for court strategy — specialists educate and organize.',
          'Continue bureau hygiene in parallel so the credit file is not abandoned.',
        ],
        callout: 'Not legal advice. Court outcomes vary. When in doubt, consult a licensed attorney in the partner’s jurisdiction.',
      },
      {
        heading: 'Documentation that helps counsel',
        paragraphs: [
          'Your value before and beside counsel is organization: timelines, payment records, prior validation letters, bureau screenshots, and a clear list of contradictions. Prepared partners get better options from attorneys; unprepared partners burn hours.',
        ],
      },
      {
        heading: '“Winning” without overclaiming',
        paragraphs: [
          'Winning, in specialist language, means arriving prepared: complete evidence, clear timeline, and no self-inflicted defaults from ignored mail. Preparation improves options; it does not guarantee a courtroom result.',
        ],
      },
    ],
  },
  {
    id: 'escalation-ladder',
    title: 'The Escalation Ladder',
    subtitle: 'Where a stalled file goes next — and what each rung actually does',
    kicker: 'Pressure with paper',
    teaser: 'Bureau, furnisher, regulator, state — real portals, real records, realistic expectations.',
    accent: 'rose',
    sections: [
      {
        heading: 'Escalation is a record, not a threat',
        paragraphs: [
          'Partners often imagine escalation as shouting louder. In practice, each rung of the ladder creates a durable, timestamped record held by a third party. That record is the value — it survives staff turnover at the furnisher, it forces a written response, and it becomes the paper trail an attorney would want if the matter ever needs one.',
          'Escalation also has an order. Filing a regulator complaint before you have a bureau response to attach wastes the strongest move you have. Work the rungs in sequence and each one arrives with evidence the previous one produced.',
        ],
      },
      {
        heading: 'The rungs, in order',
        bullets: [
          'Rung 1 — Bureau reinvestigation. The standard round with a specific field and a labelled exhibit. Most correctable errors resolve here.',
          'Rung 2 — Direct furnisher dispute. The bank, lender, or collector that supplies the data has its own investigation duty. Send this when the bureau reply says “verified” with no detail.',
          'Rung 3 — Method of verification request. Ask the bureau to describe how it verified. A thin or generic answer is itself documentation.',
          'Rung 4 — Regulator complaint. CFPB for consumer reporting and collection conduct; FTC for broader unfair-practice patterns. Attach the prior responses.',
          'Rung 5 — State attorney general and BBB. Slower and less technical, but they reach compliance teams that ignore consumer mail.',
          'Rung 6 — Licensed counsel. When the dispute has become a legal claim rather than a documentation problem, refer out. This is the specialist boundary.',
        ],
        callout:
          'Escalation improves the odds that a claim is actually reviewed. It does not guarantee deletion, correction, or any specific outcome. Results vary · not legal advice.',
      },
      {
        heading: 'The portals worth bookmarking',
        paragraphs: [
          'Send partners to the official source every time. Third-party “complaint filing services” add cost and lose control of the record.',
        ],
        resources: [
          {
            label: 'CFPB — submit a complaint',
            href: 'https://www.consumerfinance.gov/complaint/',
            note: 'Consumer reporting, debt collection, and credit product conduct. Companies must respond.',
          },
          {
            label: 'FTC — ReportFraud',
            href: 'https://reportfraud.ftc.gov/',
            note: 'Pattern and practice reporting. Feeds enforcement data rather than producing a direct reply.',
          },
          {
            label: 'National Association of Attorneys General — find your state AG',
            href: 'https://www.naag.org/find-my-ag/',
            note: 'State consumer protection divisions; rules and remedies vary by state.',
          },
          {
            label: 'BBB — file a complaint',
            href: 'https://www.bbb.org/file-a-complaint',
            note: 'Non-regulatory, but reaches company reputation teams that route to compliance.',
          },
          {
            label: 'Cornell LII — Fair Credit Reporting Act (15 U.S.C. §1681)',
            href: 'https://www.law.cornell.edu/uscode/text/15/chapter-41/subchapter-III',
            note: 'Read the statute text before you paraphrase it to a partner.',
          },
          {
            label: 'AnnualCreditReport.com',
            href: 'https://www.annualcreditreport.com/',
            note: 'The federally authorized source for partner report pulls.',
          },
        ],
      },
    ],
  },
  {
    id: 'compliance-language',
    title: 'Compliance Language That Protects You',
    subtitle: 'How to say true things persuasively without promising outcomes',
    kicker: 'Guardrails',
    teaser: 'Swap every guarantee for a mechanism — the honest version converts better anyway.',
    accent: 'gold',
    sections: [
      {
        heading: 'The promise trap',
        paragraphs: [
          'Guarantee language is tempting because it sounds decisive. It is also the fastest route to a refund demand, a regulator complaint, and a reputation that cannot be rebuilt. A specialist who promises a deletion owns that outcome personally — and the outcome is controlled by a bureau and a furnisher, neither of whom answers to you.',
          'The replacement is not weaker language. It is mechanism language: describe precisely what will be done, what the counterparty is obligated to do in response, and what typically happens. Specificity reads as competence. Guarantees read as desperation to anyone who has been burned before.',
        ],
      },
      {
        heading: 'Say this, not that',
        bullets: [
          'Not “guaranteed removal” → “a documented contradiction the bureau has to reinvestigate.”',
          'Not “we fix credit” → “we correct inaccurate reporting and build the parts of the file that are healthy.”',
          'Not “pre-approved funding” → “funding subject to underwriting; here are the stage gates that make an approval more likely.”',
          'Not “clients” → “partners,” in every public and portal surface.',
          'Not “erase your debt” → “reduce chaos, capture everything in writing, and correct inaccurate reporting.”',
          'Not “this always works” → “this is the lever we pull first; results and timelines vary by file.”',
        ],
        callout:
          'Every stat, testimonial, or funding reference in your marketing needs a compliance line near it: results vary · not legal advice · funding subject to underwriting.',
      },
      {
        heading: 'Where the specialist boundary sits',
        paragraphs: [
          'Specialists educate, organize, document, and coach. Attorneys advise on legal rights and strategy, and appear in court. The line is not a formality — crossing it exposes the partner to bad guidance and exposes you to an unauthorized-practice claim.',
        ],
        checklist: {
          label: 'Refer to licensed counsel when',
          items: [
            'A summons, complaint, garnishment, or levy notice has been served.',
            'The partner asks whether a debt is legally enforceable, or about statutes of limitation.',
            'A bankruptcy, divorce decree, or estate matter is affecting the reporting.',
            'Identity theft involves an active criminal report or a police investigation.',
            'The partner wants to sue, or a furnisher has threatened to sue them.',
          ],
        },
        callout:
          'Referring out is not losing the file. The credit work continues in parallel — and partners remember the specialist who told them the truth about the boundary.',
      },
    ],
  },
  {
    id: 'opportunities',
    title: 'Opportunity Everywhere',
    subtitle: 'Funding, tradelines strategy framing, and partner growth lanes',
    kicker: 'Growth lanes',
    teaser: 'Once pressure drops and files stabilize, open the doors — capital, depth, and referrals.',
    accent: 'lime',
    sections: [
      {
        heading: 'Funding readiness (not hype)',
        paragraphs: [
          'Partners ask for capital when optics and cash-flow story align. Teach stage gates, capital packs, and underwriting reality — never “pre-approved” language you cannot prove.',
        ],
        callout: 'Funding subject to underwriting. Results vary.',
      },
      {
        heading: 'Tradelines — strategy framing',
        paragraphs: [
          'Authorized-user and primary tradeline conversations are about file depth and responsible use — not shortcuts that ignore payment behavior. Position tradelines as one lever inside a broader plan: utilization, age, mix, and dispute hygiene still matter.',
        ],
        bullets: [
          'Match the instrument to the file gap (thin vs thick, young vs aged).',
          'Disclose risks and costs plainly.',
          'Never promise a score delta.',
        ],
      },
      {
        heading: 'Helping others compounds your craft',
        paragraphs: [
          'Restored partners refer. Funded partners expand. Specialists who document wins ethically (with permission) build a pipeline that ads alone cannot buy.',
          'Opportunity is not only capital — it is the chance to teach neighbors, founders, and families a calmer financial operating system. That is how specialists create lasting impact without overselling outcomes.',
        ],
      },
    ],
  },
  {
    id: 'weekly-rhythm',
    title: 'Your Weekly Operating Rhythm',
    subtitle: 'The cadence that keeps thirty files moving without heroics',
    kicker: 'Cadence',
    teaser: 'Four blocks a week, one scoreboard, and a follow-up rule that removes guesswork.',
    accent: 'sky',
    sections: [
      {
        heading: 'Files do not stall from difficulty — they stall from silence',
        paragraphs: [
          'A dispute round has a clock. A vendor account has a reporting date. A funding pack has a document that expires. Almost every stalled file traces back to nobody being scheduled to look at it on the day it needed attention. Specialists who run on inbox impulse serve the loudest partner, not the most urgent file.',
          'The fix is a fixed weekly shape. Four blocks, same days, every week. Inside the blocks the work varies; the blocks themselves do not move.',
        ],
      },
      {
        heading: 'The four blocks',
        bullets: [
          'Monday — Clock review. Every file with a deadline inside 14 days: round-35 checks, response due dates, document expirations. Nothing else touched.',
          'Wednesday — Production. Letters drafted, exhibits cropped and labelled, packets assembled and queued for certified mail.',
          'Friday — Partner contact. One update to every active partner, even the ones with no news. “No response yet, day 22 of 30” is an update and it prevents the anxious call on Saturday.',
          'Monthly — Intake and system. New partner onboarding, template repairs, and the one process you kept working around all month.',
        ],
        callout:
          'A partner who hears from you on a schedule stops checking in randomly. Predictability is a delivery feature, not a courtesy.',
      },
      {
        heading: 'The scoreboard',
        paragraphs: [
          'Revenue is a lagging number and a bad steering wheel. Track the leading indicators instead — the ones you can change this week. Five numbers, reviewed Monday, written down where you can see the trend across months.',
        ],
        checklist: {
          label: 'Five numbers, every Monday',
          items: [
            'Active files with a round in flight.',
            'Files with no action in the last 14 days — this number should be zero.',
            'Rounds mailed last week.',
            'Responses received and logged last week.',
            'Referrals or documented wins produced last month.',
          ],
        },
      },
      {
        heading: 'The follow-up rule',
        paragraphs: [
          'Do not resend a letter. A resend restarts nothing and signals that you did not read the response. Round two is built from what round one produced: the bureau said “verified” with no method, so round two requests the method; the furnisher corrected one field but not the other, so round two names the field that remains wrong.',
          'If a response produces no new information at all, that absence is itself the next argument — and the next rung on the escalation ladder.',
        ],
        callout:
          'Day 30, check for a reply. Day 35, act on it. Never before day 30, never later than day 40. Timelines vary by bureau and by matter.',
      },
    ],
  },
  {
    id: 'income-path',
    title: 'Your Income Path as a Specialist',
    subtitle: 'Financial freedom through craft — tools, partners, and honest economics',
    kicker: 'Specialist path',
    teaser: 'Tools, training, white-label OS, and percentage economics — built for operators, not spectators.',
    accent: 'sky',
    sections: [
      {
        heading: 'Freedom means optionality',
        paragraphs: [
          'Financial freedom, in this playbook, means you can earn by delivering real partner work: restore, build, business credit, and debt education — with an OS that holds the files. It is not a salary promise, passive-income fantasy, or guaranteed commission schedule.',
          'Specialists who stay educational, document carefully, and graduate training tend to own more of the delivery — and that is where economics improve. Results and income vary.',
        ],
      },
      {
        heading: 'The operator model',
        paragraphs: [
          'Credit Specialists run partner files on Finely Cred’s stack: dispute studio, evidence vault, business fundability tools, and partner portals. Pay is percentage-based and grows with training graduation and file ownership — not vanity titles.',
        ],
      },
      {
        heading: 'What you get when you join',
        bullets: [
          'Operating stack for personal restore, business credit, and debt lanes.',
          'Training that emphasizes factual findings and compliance-safe language.',
          'White-label-ready partner experience so your brand can lead.',
          'Activation path from application → first supervised partners.',
          'Opportunity to help others while building a craft-based practice.',
        ],
      },
      {
        heading: 'Next step',
        paragraphs: [
          'Finish this guide, then open the Credit Specialist join path to see program tiers, economics, and application options. The guide teaches the craft; the program gives you the OS to deliver it at scale.',
          'Keep reading as long as you want — signup is optional and separate from this e-guide and one-sheet.',
        ],
        callout: 'Application is not a job offer. Income varies. Educational positioning required. Results vary · not legal advice · funding subject to underwriting.',
      },
    ],
  },
];

export const CS_GUIDE_CHAPTERS: CreditSpecialistGuideChapter[] = CS_GUIDE_CHAPTER_INPUTS.map(
  (chapter, i) => ({ ...chapter, number: String(i + 1).padStart(2, '0') }),
);

export function getCreditSpecialistChapter(idOrIndex: string | number): CreditSpecialistGuideChapter {
  if (typeof idOrIndex === 'number') {
    return CS_GUIDE_CHAPTERS[Math.max(0, Math.min(CS_GUIDE_CHAPTERS.length - 1, idOrIndex))]!;
  }
  return CS_GUIDE_CHAPTERS.find((c) => c.id === idOrIndex) ?? CS_GUIDE_CHAPTERS[0]!;
}

export function creditSpecialistChapterIndex(id: string): number {
  const idx = CS_GUIDE_CHAPTERS.findIndex((c) => c.id === id);
  return idx >= 0 ? idx : 0;
}
