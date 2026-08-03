/**
 * The Agency Guide — in-app reader chapters.
 *
 * Separate from AGENCY_GUIDE (the bullet-only FreeGuide used for the PDF) so the
 * reader can carry blueprint-specific blocks (spec tables, worksheets, ledger
 * tiles) without changing PDF output.
 *
 * Educational only. Income and growth examples are illustrative, not guarantees.
 */

export const AGENCY_GUIDE_LANDING_PATH = '/free-agency-guide';
export const AGENCY_GUIDE_READ_PATH = '/free-agency-guide/read';

export const AGENCY_GUIDE_COMPLIANCE =
  'Educational only · not legal advice · income and growth examples are not guarantees';

export type AgencyGuideAccent = 'cyan' | 'amber' | 'violet';

/** Ledger tiles — a small number plus what it means. */
export type AgencyGuideMetric = {
  value: string;
  label: string;
  note?: string;
};

/** Drafting worksheet — dashed fill-in lines the reader completes offline. */
export type AgencyGuideWorksheet = {
  label: string;
  lines: Array<{ prompt: string; hint?: string }>;
};

/** Titleblock spec table — key/value rows in the corner of a plan sheet. */
export type AgencyGuideSpec = {
  label: string;
  rows: Array<{ k: string; v: string }>;
};

export type AgencyGuideSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: string;
  metrics?: AgencyGuideMetric[];
  worksheet?: AgencyGuideWorksheet;
  spec?: AgencyGuideSpec;
};

export type AgencyGuideChapter = {
  id: string;
  sheet: string;
  title: string;
  subtitle: string;
  kicker: string;
  teaser: string;
  accent: AgencyGuideAccent;
  readMinutes: number;
  sections: AgencyGuideSection[];
};

const CHAPTERS: AgencyGuideChapter[] = [
  {
    id: 'why-agencies-stall',
    sheet: 'A-01',
    title: 'Why Agencies Stall',
    subtitle: 'Three failures cause almost every plateau — and none of them is effort',
    kicker: 'Orientation',
    teaser: 'The unclear offer, the missing system, and the owner ceiling.',
    accent: 'cyan',
    readMinutes: 4,
    sections: [
      {
        heading: 'Effort is almost never the problem',
        paragraphs: [
          'Agency owners who plateau are usually working more hours than the ones who do not. That is what makes the plateau so disorienting: the obvious lever — try harder — is already pulled all the way down. What stalls is structural, and structure does not respond to effort.',
          'Across credit-services agencies the same three failures appear again and again. An offer nobody can repeat back. A delivery process that lives in the owner\u2019s head. And a ceiling set by the number of hours that owner can personally touch a file. Every sheet after this one attacks one of those three.',
        ],
        metrics: [
          { value: '1', label: 'Named offer', note: 'One sentence a stranger can repeat correctly.' },
          { value: '1', label: 'Delivery system', note: 'Same experience for partner 1 and partner 50.' },
          { value: '0', label: 'Owner-only steps', note: 'Steps only you can perform are your ceiling.' },
        ],
      },
      {
        heading: 'Failure one — the menu of favors',
        paragraphs: [
          'An agency without a named offer sells a menu of favors. Every conversation starts from scratch, every price is negotiated fresh, and referrals stop at the door because nobody can describe what you do without you in the room.',
          'The test is brutal and simple. Ask someone you helped six months ago to explain your service to a friend. If what comes back is “he helps with credit stuff,” you do not have an offer yet — you have a reputation for being helpful, which does not scale.',
        ],
      },
      {
        heading: 'Failures two and three — the head and the ceiling',
        paragraphs: [
          'When the process lives in your head, quality varies by how tired you were that week. Two partners who bought the same thing receive different experiences, and the one who got the worse version is the one who tells people about it.',
          'The owner ceiling is arithmetic, not attitude. If a file needs 40 minutes of your personal attention per week and you have 25 working hours after sales and admin, your maximum roster is about 37 files no matter how motivated you are. Raising the ceiling means removing yourself from steps, not finding more hours.',
        ],
        callout:
          'Diagnose before you build. Most owners try to fix the marketing when the actual constraint is delivery — and adding leads to a broken delivery system produces refunds, not growth.',
      },
    ],
  },
  {
    id: 'one-sentence-offer',
    sheet: 'A-02',
    title: 'The One-Sentence Offer',
    subtitle: 'Name the transformation, not the tasks',
    kicker: 'Offer clarity',
    teaser: 'The four-part sentence, and the worksheet that produces it.',
    accent: 'amber',
    readMinutes: 5,
    sections: [
      {
        heading: 'Transformation beats task list',
        paragraphs: [
          'Prospects do not buy activities. They buy the state they will be in when the activities are finished. “We send dispute letters and monitor your report” is a task list; “we get inaccurate reporting off your file and document every round so you know exactly where you stand” is a transformation with proof attached.',
          'Notice what the strong version does not do: it does not promise a score, a deletion, or a timeline. Specificity about method is what makes an offer feel credible. Specificity about outcomes is what makes it a compliance problem.',
        ],
        spec: {
          label: 'Offer spec',
          rows: [
            { k: 'For', v: 'The narrowest group you serve better than anyone' },
            { k: 'We', v: 'The concrete work performed, in plain language' },
            { k: 'So that', v: 'The state they are in when it is done' },
            { k: 'Without', v: 'The pain or risk they are avoiding by choosing you' },
          ],
        },
      },
      {
        heading: 'Pick one lane to lead with',
        paragraphs: [
          'You may deliver personal restore, business credit sequencing, and debt documentation support. You should still lead with one. A lead offer is a door, not a fence — partners walk through the door you named and then discover the rest of the house.',
          'Owners resist this because narrowing feels like turning down revenue. In practice the opposite happens: a narrow door is easier to describe, easier to refer to, and easier to price, so more people walk through it.',
        ],
        bullets: [
          'Personal restore and build — accuracy work plus habit coaching for individuals.',
          'Business credit sequencing — entity truth, vendor depth, and fundability stage gates.',
          'Debt and documentation support — validation, paper trails, and calm response under collection pressure.',
          'Choose the lane where your last five best outcomes came from, not the one with the biggest imagined market.',
        ],
      },
      {
        heading: 'Draft it now',
        worksheet: {
          label: 'Offer worksheet — fill this in before you spend on ads',
          lines: [
            { prompt: 'For', hint: 'e.g. founders whose LLC keeps getting declined for vendor accounts' },
            { prompt: 'We', hint: 'the concrete work — no adjectives' },
            { prompt: 'So that', hint: 'the state, not a number' },
            { prompt: 'Without', hint: 'the risk they fear most' },
            { prompt: 'Read it aloud. Would a stranger repeat it correctly?', hint: 'yes / not yet' },
          ],
        },
        callout:
          'If you cannot say it in one breath, it is not finished. Tighten the sentence before you buy traffic — paid clicks against a vague offer just make the vagueness more expensive.',
      },
    ],
  },
  {
    id: 'pricing-the-outcome',
    sheet: 'A-03',
    title: 'Pricing the Outcome',
    subtitle: 'Why hourly framing invites haggling and packages invite commitment',
    kicker: 'Economics',
    teaser: 'Three pricing shapes, and the numbers that tell you which one fits.',
    accent: 'violet',
    readMinutes: 5,
    sections: [
      {
        heading: 'What you are actually charging for',
        paragraphs: [
          'Hourly pricing tells the buyer that your time is the product, which invites them to negotiate the quantity. It also punishes you for getting faster — the better your systems, the less you earn per file. That is a structural trap, not a preference.',
          'Price the system and the outcome instead: a defined scope, a defined cadence, and a defined set of artifacts the partner receives. What they are buying is that the work happens on schedule, documented, whether or not you personally felt like doing it that Tuesday.',
        ],
      },
      {
        heading: 'Three shapes that work',
        bullets: [
          'Monthly engagement — a fixed fee for an ongoing cadence of rounds, reviews, and updates. Predictable for both sides; requires real delivery discipline to justify month four.',
          'Milestone package — a fixed price for a defined stage, such as an intake and first-round build or a business fundability sequence up to a named stage gate.',
          'Hybrid — a setup fee covering intake and file construction, then a smaller monthly for maintenance. This is the most common shape for credit-services agencies because the first month is genuinely the heaviest.',
          'Whatever the shape: publish what is included and what is not. Scope ambiguity is the number one cause of refund requests.',
        ],
        spec: {
          label: 'Unit economics — know these four before you price',
          rows: [
            { k: 'Delivery hours', v: 'Hours your team spends per file per month' },
            { k: 'Hard costs', v: 'Postage, report pulls, software seats, per file' },
            { k: 'Acquisition cost', v: 'Total marketing spend ÷ new partners signed' },
            { k: 'Expected tenure', v: 'Average months a partner stays engaged' },
          ],
        },
      },
      {
        heading: 'The compliance line in pricing conversations',
        paragraphs: [
          'Pricing conversations are where guarantee language sneaks in, because the buyer is asking “what do I get for this?” and outcomes feel like the honest answer. They are not the honest answer — they are the unknowable one.',
          'What you can commit to is the work: the number of rounds, the documentation standard, the response times, the reporting cadence. Commit to those in writing and you have something enforceable that you can actually deliver.',
        ],
        callout:
          'Never price against a promised score, deletion, or funding amount. Results vary · funding subject to underwriting · nothing here is legal or financial advice.',
      },
    ],
  },
  {
    id: 'who-you-serve',
    sheet: 'A-04',
    title: 'Who You Serve',
    subtitle: 'Definition is a growth tool, not a limitation',
    kicker: 'Positioning',
    teaser: 'The fit profile, the disqualification list, and why saying no raises revenue.',
    accent: 'cyan',
    readMinutes: 4,
    sections: [
      {
        heading: 'Define the partner you serve best',
        paragraphs: [
          '“Anyone with a credit problem” is not a market — it is an absence of a decision. And the cost of that absence is paid in delivery: mismatched partners take more hours, produce worse outcomes, and generate the complaints that shape your reputation.',
          'Build the profile from evidence rather than aspiration. Look at your last ten engagements and mark which ones went well. The pattern in that column — situation, urgency, documentation quality, expectations — is your actual fit profile.',
        ],
        worksheet: {
          label: 'Fit profile — from your last ten engagements',
          lines: [
            { prompt: 'Situation they were in', hint: 'the trigger that made them look for help' },
            { prompt: 'What they already had ready', hint: 'documents, reports, realistic expectations' },
            { prompt: 'What made delivery smooth', hint: 'responsiveness? clear goal? single lane?' },
            { prompt: 'What they said when it worked', hint: 'their words become your positioning copy' },
          ],
        },
      },
      {
        heading: 'The disqualification list',
        paragraphs: [
          'Every agency needs a written list of who it refers out. Written, because in the moment — when the phone rings and revenue is short — you will talk yourself into the exception. The list is a decision made in advance by a calmer version of you.',
        ],
        bullets: [
          'Anyone who wants a guaranteed deletion, score, or funding amount, and cannot be talked out of that expectation.',
          'Anyone with an active court deadline who needs legal strategy rather than documentation support — refer to licensed counsel.',
          'Anyone who will not or cannot produce reports and identification during intake.',
          'Situations outside your lane, where the honest answer is that another operator will serve them better.',
          'Anyone whose stated goal requires you to say something in writing that you know is not true.',
        ],
        callout:
          'A referral out is not lost revenue. It is a reputation deposit — and referred-out prospects send you the ones who do fit more often than you would expect.',
      },
    ],
  },
  {
    id: 'attraction-engine',
    sheet: 'A-05',
    title: 'The Attraction Engine',
    subtitle: 'Teaching, proof, and referrals — in that order of return',
    kicker: 'Demand',
    teaser: 'Why showing the method outperforms hiding it, and how to ask for the referral.',
    accent: 'amber',
    readMinutes: 5,
    sections: [
      {
        heading: 'Teach the why, sell the how',
        paragraphs: [
          'Owners hoard their method out of a fear that never materializes: that a prospect will read the framework and do it themselves. The people who would do it themselves were never going to buy. The people who do buy read the framework, recognize how much disciplined work it represents, and hire you specifically because you showed them.',
          'This guide is the argument for itself. Teaching content builds trust faster than selling content because it demonstrates competence instead of asserting it — and it keeps working while you sleep.',
        ],
        bullets: [
          'Publish the framework, not just the promise — a numbered method reads as real work.',
          'Show artifacts: a labelled exhibit, a redacted round-two letter, a fundability stage-gate chart.',
          'Answer the question the prospect is actually googling at 11pm, not the one your ad copy wishes they were.',
          'One thorough teaching piece outperforms ten promotional posts, and it keeps earning for years.',
        ],
      },
      {
        heading: 'Proof without promises',
        paragraphs: [
          'A case study converts better than a testimonial wall because it shows the shape of the work: what the file looked like, what was done, what changed. Written carefully, it stays entirely inside compliance — you are describing one documented history, not projecting it onto the reader.',
          'Get written permission, redact identifying detail, describe the method in more depth than the result, and put the compliance line next to it. “Results vary” is not a legal fig leaf here; it is literally true and the reader knows it.',
        ],
        callout:
          'Never publish a score screenshot as an implied promise. Describe what was done, note what changed for that file, and place the compliance line adjacent: results vary · not legal advice · funding subject to underwriting.',
      },
      {
        heading: 'Ask at the moment of the documented win',
        paragraphs: [
          'Referrals are the highest-margin channel available to a credit-services agency and most owners ask for them at the worst possible moment — at the end of an engagement, over email, generically.',
          'Ask when something verifiable just happened: a correction posts, a vendor account reports, a collection stops. The partner is holding proof in their hand. Ask specifically — “who else in your circle is dealing with this exact thing?” — because a specific question produces a name and a general one produces a nod.',
        ],
        metrics: [
          { value: 'Day 0', label: 'Documented win', note: 'Ask within 48 hours, while the proof is fresh.' },
          { value: '1', label: 'Specific question', note: 'Who, not whether. Names come from specificity.' },
          { value: '1', label: 'Easy handoff', note: 'A link or one-sheet they can forward without explaining you.' },
        ],
      },
    ],
  },
  {
    id: 'delivery-system',
    sheet: 'A-06',
    title: 'The Delivery System',
    subtitle: 'One intake, one journey, one place the work lives',
    kicker: 'Operations',
    teaser: 'The rule of three, the day-1-to-30 map, and why scattered folders cost you files.',
    accent: 'violet',
    readMinutes: 5,
    sections: [
      {
        heading: 'The rule of three',
        paragraphs: [
          'Here is the whole systemization philosophy in one line: anything you do manually twice becomes a checklist the third time, and a template or automation by the fifth. Not a project, not a quarter-long initiative — a checklist, written while the task is still in front of you.',
          'Owners fail at documentation because they schedule it for later, and later is always the week that a partner emergency eats. Record your screen while you do the thing, write three bullets underneath it, and move on. A rough SOP that exists beats a polished one that does not.',
        ],
      },
      {
        heading: 'Standardize intake or standardize nothing',
        paragraphs: [
          'Inconsistent intake produces inconsistent delivery, always. If one partner arrives with three current reports and identification and another arrives with a screenshot of a phone app, you are running two different businesses at the same price.',
          'One form. One document checklist. One onboarding sequence. Applied to everyone, including the urgent ones — especially the urgent ones, because urgency is exactly when skipped steps get expensive.',
        ],
        spec: {
          label: 'Day 1 → Day 30 journey map',
          rows: [
            { k: 'Day 1', v: 'Intake form, document checklist, expectations set in writing' },
            { k: 'Day 2–5', v: 'Reports pulled and organized, account inventory built, priorities named' },
            { k: 'Day 6–10', v: 'Round one drafted with labelled exhibits, partner reviews and approves' },
            { k: 'Day 11', v: 'Mailed and logged, tracking recorded, day-35 check scheduled' },
            { k: 'Day 12–30', v: 'Weekly update even with no news; parallel build work begins' },
          ],
        },
      },
      {
        heading: 'One place the work lives',
        paragraphs: [
          'Files scattered across inboxes, phone photos, and personal drives are not a filing problem. They are a continuity problem: nobody but you can pick up the work, which means you can never be away and can never delegate.',
          'A shared operating system — partner records, evidence vault, letters, and history in one hub — is what converts a solo practice into something transferable. That transferability is the entire difference between owning a job and owning an agency.',
        ],
        callout:
          'The test: could a competent teammate open a file tomorrow and know exactly what happened and what is next, without calling you? Until the answer is yes, you are the system.',
      },
    ],
  },
  {
    id: 'capacity-ladder',
    sheet: 'A-07',
    title: 'The Capacity Ladder',
    subtitle: 'Systems, then support, then hires — in that order, every time',
    kicker: 'Scale',
    teaser: 'Why most agencies over-hire, and the signal that says you are actually ready.',
    accent: 'cyan',
    readMinutes: 4,
    sections: [
      {
        heading: 'Growth without capacity produces refunds',
        paragraphs: [
          'Adding demand to a delivery system already running at its limit does not produce growth. It produces missed deadlines, angry updates, refund requests, and public complaints — and it damages the referral engine that was your cheapest channel.',
          'Before increasing marketing spend, answer one question honestly: if ten new partners signed next week, what specifically would break? The answer is your next build project, and it comes before the ad budget.',
        ],
      },
      {
        heading: 'Climb in order',
        bullets: [
          'Rung 1 — Systems. Templates, checklists, and automation remove hours at zero marginal cost. Exhaust this rung before considering the next.',
          'Rung 2 — Part-time support. An assistant handling intake, scanning, mailing, and scheduling typically returns the most hours per dollar in a credit-services agency.',
          'Rung 3 — Specialist capacity. A trained operator who can carry files end to end. Only viable once rung 1 exists, because you are hiring someone to run a system, not to invent one.',
          'Rung 4 — Management. Needed only when you have more operators than you can personally review. Most agencies never need this rung and hire it anyway.',
        ],
        callout:
          'Hiring before systems means paying someone to be confused. The new person asks you every question, and your hours go up, not down, for the first two months.',
      },
      {
        heading: 'The readiness signal',
        paragraphs: [
          'You are ready for the next rung when the current one is saturated and documented: the systems exist, they are written down, and they are still not enough. Saturation without documentation is not readiness — it is just being busy.',
        ],
        metrics: [
          { value: '2 mo.', label: 'Sustained demand', note: 'Not one good month. Two, at capacity.' },
          { value: '100%', label: 'Documented core', note: 'Intake through round two, written down.' },
          { value: '3 mo.', label: 'Runway for the role', note: 'Payable from current revenue, not projected revenue.' },
        ],
      },
    ],
  },
  {
    id: 'scoreboard',
    sheet: 'A-08',
    title: 'The Weekly Scoreboard',
    subtitle: 'Five leading numbers beat one lagging one',
    kicker: 'Instrumentation',
    teaser: 'Revenue tells you about last quarter. These tell you about next one.',
    accent: 'amber',
    readMinutes: 4,
    sections: [
      {
        heading: 'Revenue is a rear-view mirror',
        paragraphs: [
          'Revenue reports what already happened. By the time a bad month shows up in the bank account, the decisions that caused it were made six to ten weeks earlier — and the decisions that would have fixed it are also already behind you.',
          'Leading indicators are the numbers you can still change this week. Five of them, reviewed the same day each week, written where you can see the trend line across months. Not a dashboard project. A single page.',
        ],
        spec: {
          label: 'The five numbers',
          rows: [
            { k: 'Conversations', v: 'Qualified discovery calls held this week' },
            { k: 'Signed', v: 'New partners started this week' },
            { k: 'Active files', v: 'Files with work in flight right now' },
            { k: 'Stalled files', v: 'No action in 14 days — target is zero' },
            { k: 'Wins + referrals', v: 'Documented outcomes and names produced this month' },
          ],
        },
      },
      {
        heading: 'What each number tells you to do',
        bullets: [
          'Conversations falling → the attraction engine needs attention, and you have roughly six weeks of warning.',
          'Conversations steady but signed falling → the offer or the price conversation is the problem, not the traffic.',
          'Active files rising while wins stay flat → delivery is clogged; stop selling and go fix the pipe.',
          'Stalled files above zero → someone is not being looked at on the day they needed attention. This is the most expensive number on the page.',
          'Referrals near zero while wins occur → you are not asking, or not asking at the moment of the win.',
        ],
        callout:
          'Review the same day every week, even when the numbers are bad. The habit is worth more than any individual reading, and bad weeks are the ones worth catching early.',
      },
    ],
  },
  {
    id: 'compliance-positioning',
    sheet: 'A-09',
    title: 'Compliance as Positioning',
    subtitle: 'In a market full of guarantees, honesty is the differentiator',
    kicker: 'Trust',
    teaser: 'Say the true thing more specifically and it converts better than the promise.',
    accent: 'violet',
    readMinutes: 4,
    sections: [
      {
        heading: 'Everyone else sounds the same',
        paragraphs: [
          'Open ten credit-services websites and you will read the same four promises in the same four fonts. Guaranteed removals, fast results, a number that will supposedly appear by a date. Prospects have seen those pages before — often right before a bad experience — and the promises now register as noise or as warning.',
          'Which means the differentiated position is available and nearly unoccupied: describe your actual method, state plainly what is and is not knowable, and let the specificity carry the persuasion. Buyers who have been burned once are actively scanning for the operator who does not overclaim.',
        ],
      },
      {
        heading: 'Language that protects and sells',
        bullets: [
          'Not “guaranteed deletion” → “a documented contradiction the bureau is obligated to reinvestigate.”',
          'Not “we fix credit” → “we correct inaccurate reporting and strengthen the parts of the file that are healthy.”',
          'Not “pre-approved funding” → “funding subject to underwriting — here are the stage gates that make approval more likely.”',
          'Not “clients” → “partners,” on every public and portal surface.',
          'Place the compliance line adjacent to every stat, testimonial, and funding reference — not buried in the footer.',
        ],
        callout: AGENCY_GUIDE_COMPLIANCE,
      },
      {
        heading: 'Where your boundary sits',
        paragraphs: [
          'Agencies educate, organize, document, and coach. Attorneys advise on legal rights and represent partners in court. Crossing that line exposes the partner to bad guidance and exposes the agency to an unauthorized-practice claim — and it is crossed most often by accident, in a reassuring sentence on a stressful call.',
          'Write the boundary into your onboarding language and your team training. Partners consistently report that the operator who told them where the limits were is the one they trusted with everything inside them.',
        ],
      },
    ],
  },
  {
    id: 'thirty-day-build',
    sheet: 'A-10',
    title: 'The 30-Day Build',
    subtitle: 'One lever a week, then a rhythm you can hold',
    kicker: 'Execution',
    teaser: 'Four weeks of specific work, and the owner review that keeps it from unravelling.',
    accent: 'cyan',
    readMinutes: 5,
    sections: [
      {
        heading: 'One lever at a time',
        paragraphs: [
          'Agencies that chase five growth tactics simultaneously finish zero of them well. The constraint is not ambition; it is that every tactic needs iteration to work, and iteration needs attention that five parallel projects will not leave you.',
          'Pick one lever per week for the next four weeks. Finish it badly rather than starting it perfectly. A rough intake form in use on Friday teaches you more than a beautiful one still in draft.',
        ],
        spec: {
          label: 'Four weeks',
          rows: [
            { k: 'Week 1', v: 'Write the one-sentence offer. Define the fit profile and the disqualification list.' },
            { k: 'Week 2', v: 'Build intake: one form, one document checklist, one onboarding sequence.' },
            { k: 'Week 3', v: 'Publish one teaching piece. Ask two past partners for a referral at a documented win.' },
            { k: 'Week 4', v: 'Stand up the five-number scoreboard. Systemize the one task you kept working around.' },
          ],
        },
      },
      {
        heading: 'The owner review',
        paragraphs: [
          'After the build, the thing that keeps it standing is a single weekly review — same day, same hour, whether or not the week was calm. Read the five numbers, look at every stalled file, and pick the one lever for the coming week.',
          'If you find yourself needed hourly instead of weekly, that is not a discipline failure. It is the system telling you which step still has your name on it — and that step is your next build project.',
        ],
        worksheet: {
          label: 'Owner review — same day, every week',
          lines: [
            { prompt: 'The five numbers', hint: 'conversations · signed · active · stalled · wins' },
            { prompt: 'Stalled files, by name', hint: 'why did each one stop, specifically?' },
            { prompt: 'One task to systemize', hint: 'the thing you worked around twice this week' },
            { prompt: 'One lever for next week', hint: 'only one' },
          ],
        },
      },
      {
        heading: 'What freedom actually means here',
        paragraphs: [
          'Freedom is not the absence of work. It is work that does not require your personal presence for every file to move forward. That is a structural condition, and it is reachable — but only in the order this guide laid out: offer, then system, then capacity.',
          'Decide your non-negotiable hours before you decide your revenue goal. Owners who skip that step generally succeed at the revenue goal and discover they traded a job for a larger job.',
        ],
        callout: AGENCY_GUIDE_COMPLIANCE,
      },
    ],
  },
];

export const AGENCY_GUIDE_CHAPTERS: AgencyGuideChapter[] = CHAPTERS;

export function agencyGuideChapterIndex(idOrNumber: string): number {
  const asNum = Number(idOrNumber);
  if (Number.isFinite(asNum) && asNum >= 1 && asNum <= CHAPTERS.length) return asNum - 1;
  const idx = CHAPTERS.findIndex((c) => c.id === idOrNumber);
  return idx >= 0 ? idx : 0;
}
