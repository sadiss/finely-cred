import type { GeneratedGuidePage } from './disputeLetterGuideContent';

export const SCORE_ROADMAP_PDF_TITLE = 'Boost Your Credit Score in 72 Hours';
export const SCORE_BOOST_READ_PATH = '/free-score-roadmap/read';
export const SCORE_BOOST_COMPLIANCE = 'Results vary · not legal or financial advice · funding subject to underwriting';

export type ScoreBoostMetric = { label: string; value: string; note?: string };

export type ScoreBoostSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  metrics?: ScoreBoostMetric[];
  /** Short imperative "do this now" list. */
  actions?: string[];
  /** Compliance / risk callout rendered with a shield icon. */
  guardrail?: string;
};

export type ScoreBoostChapter = {
  id: string;
  title: string;
  subtitle?: string;
  /** Time window shown as the mission tag, e.g. "0–24 HRS". */
  window?: string;
  /** The single lever this window is about. */
  lever?: string;
  /** How fast this lever moves — drives the reader's speed badge. */
  speed?: 'instant' | 'fast' | 'steady' | 'foundation';
  /** Optional override for the gauge value (0-100); defaults to linear chapter progress. */
  arc?: number;
  readMinutes?: number;
  sections: ScoreBoostSection[];
};

/**
 * Score Boost 72 — in-app "mission dashboard" chapter content + PDF source.
 * Sequenced 72-hour credit score boost roadmap: baseline pull, utilization control,
 * disciplined disputes, inquiry budgeting, and fundability timing.
 * Educational only. Results vary · not legal or financial advice · funding subject to underwriting.
 */
export const SCORE_BOOST_CHAPTERS: ScoreBoostChapter[] = [
  {
    id: 'mission-brief',
    title: 'The 72-Hour Mission Brief',
    subtitle: 'A disciplined sequence — not hype, not shortcuts',
    window: 'T-MINUS',
    lever: 'Lock your target',
    speed: 'instant',
    arc: 8,
    readMinutes: 3,
    sections: [
      {
        paragraphs: [
          'This roadmap is the same sequencing Finely operators use before recommending funding applications. Each step builds on the last — skip a step and you usually pay for it later in inquiries, volatility, or denials.',
          'The "72 hours" is your first sprint, not the whole race. Hours 0–72 cover the fastest, highest-control moves. What follows carries the gains into the next 30, 60, and 90 days.',
        ],
      },
      {
        heading: 'Set your target before you touch anything',
        paragraphs: ['Decide what you are optimizing for — mortgage, auto, credit cards, or business funding — before you start. Triage priorities change depending on the goal, so lock it in now.'],
        bullets: [
          'Mortgage-adjacent goals need wider inquiry spacing and more caution around new accounts.',
          'Card-building goals tolerate faster utilization experiments.',
          'Business funding goals should weight entity and business tradelines over personal ones.',
        ],
      },
      {
        heading: 'How the mission is organized',
        paragraphs: ['Four windows: 0–24 hours, 24–48 hours, 48–72 hours, and beyond. Each window has one job — do not skip ahead, the sequence is the strategy.'],
        guardrail: 'Educational only; not legal or financial advice. Results vary by file and lender policy.',
      },
    ],
  },
  {
    id: 'five-factors',
    title: 'Where Your Points Actually Live',
    subtitle: 'The five factors, weighted honestly — then find the one bucket that describes you',
    window: 'T-MINUS',
    lever: 'Diagnosis',
    speed: 'instant',
    arc: 14,
    readMinutes: 4,
    sections: [
      {
        heading: 'The weighting most people never see',
        paragraphs: [
          'Scoring models differ, but the architecture is consistent enough to plan around. Knowing roughly where the weight sits tells you which lever to pull first — and stops you spending a week on a factor that carries a tenth of the influence.',
        ],
        metrics: [
          { label: 'Payment history', value: '~35%', note: 'Structural — months, not days' },
          { label: 'Amounts owed', value: '~30%', note: 'Your fastest lever this week' },
          { label: 'Length of history', value: '~15%', note: 'Protect it; never close old accounts casually' },
          { label: 'Credit mix', value: '~10%', note: 'Revolving plus installment reads healthier' },
          { label: 'New credit', value: '~10%', note: 'Inquiries and new accounts — budget them' },
        ],
      },
      {
        heading: 'Find your bucket before you act',
        paragraphs: [
          'Most files are limited by one dominant factor, not five. Decide honestly which of these describes you, because the rest of the sequence changes depending on the answer.',
        ],
        bullets: [
          'High-utilization file — decent history, cards near their limits. This roadmap moves fast for you.',
          'Damaged file — accurate late marks and collections. Accuracy work first, then patience and habit.',
          'Thin file — few accounts, short history. Nothing dramatic in 72 hours; the right foundations start now.',
          'Inaccurate file — the data is wrong. Disputes are the lever, and the clock starts the day you mail.',
          'Mixed file — usually high utilization plus one or two disputable items. Run both tracks in parallel.',
        ],
        actions: [
          'Write down your bucket before reading further.',
          'Record your current score, the model it came from, and the date — that is your baseline.',
        ],
        guardrail:
          'Payment history and account age will not move this week. Anyone guaranteeing a specific point gain in a specific window is selling you something.',
      },
    ],
  },
  {
    id: 'window-0-24',
    title: 'Hour 0–24 — Baseline & Utilization',
    subtitle: 'Pull everything first, then control the fastest lever you own',
    window: '0–24 HRS',
    lever: 'Utilization control',
    speed: 'fast',
    arc: 30,
    readMinutes: 4,
    sections: [
      {
        heading: 'Baseline tri-bureau pull',
        bullets: [
          'Pull all three bureaus the same week — not months apart — so your baseline is one snapshot, not three.',
          'Screenshot tradeline fields, payment grids, and inquiry lists before any dispute goes out.',
          'Label every file consistently: [BUREAU]_[CREDITOR]_[YYYY-MM-DD]_[TYPE].',
        ],
        actions: ['Pull Equifax, Experian, and TransUnion this week.', 'Screenshot every tradeline before you touch a dispute.'],
      },
      {
        heading: 'Utilization control — the fastest lever',
        paragraphs: [
          'Know each card\'s statement close date, not just its payment due date. Balances report on statement close — control the number that gets reported, not just the number you eventually pay.',
        ],
        metrics: [
          { label: 'Target utilization', value: '< 9%', note: 'Aggregate across reporting cards' },
          { label: 'Runway before judging', value: '30–45 days', note: 'One full reporting cycle' },
        ],
        bullets: [
          'Avoid an "all zeros" pattern if you are actively building; one card lightly reporting can help file thickness.',
          'Do not close old accounts abruptly — average account age still matters.',
        ],
      },
      {
        heading: 'Build the utilization table',
        paragraphs: [
          'Before you pay a dollar, build one small table. Twenty minutes of work, and it is the single most useful artifact in this roadmap: one row per revolving account, five columns.',
        ],
        metrics: [
          { label: 'Column 1', value: 'Card', note: 'Issuer and last four' },
          { label: 'Column 2', value: 'Balance', note: 'What is reporting right now' },
          { label: 'Column 3', value: 'Limit', note: 'Blank limits distort utilization — flag them' },
          { label: 'Column 4', value: 'Ratio', note: 'Balance divided by limit, per card' },
          { label: 'Column 5', value: 'Close date', note: 'Statement close, not payment due date' },
        ],
        bullets: [
          'Scoring reads aggregate utilization and each card individually — a single maxed card is visible even when the total looks fine.',
          'Pay in band order: anything above 90% first, then above 50%, then the highest-limit card (it moves aggregate the most per dollar).',
          'Ask each issuer for a soft-pull limit increase — it lowers utilization without requiring cash.',
        ],
        guardrail:
          'If a revolving account shows no credit limit, flag it. A missing limit can cause utilization to be calculated against your high balance instead — that is a reporting accuracy issue worth disputing.',
      },
    ],
  },
  {
    id: 'reporting-date',
    title: 'Statement Close, Not Due Date',
    subtitle: 'The mechanic that makes a paid-down card actually show up paid down',
    window: '0–24 HRS',
    lever: 'Reporting timing',
    speed: 'fast',
    arc: 38,
    readMinutes: 4,
    sections: [
      {
        heading: 'The most misunderstood mechanic in consumer credit',
        paragraphs: [
          'Your issuer reports your balance at or shortly after the statement closing date — not on the payment due date, and not on the day you pay. Someone who pays in full every month can still show 80% utilization on their report, because the statement closed before the payment posted.',
          'Once you know each card\'s closing date, you control what the bureaus see. Pay down two to three days before the statement closes and the low number is the number that reports.',
        ],
        metrics: [
          { label: 'Reports to bureaus', value: 'Statement close', note: 'On your statement or in the issuer app' },
          { label: 'Does not report', value: 'Due date', note: 'Paying on time protects history, not ratio' },
          { label: 'Pay window', value: 'Close minus 3 days', note: 'Allows posting time' },
        ],
      },
      {
        heading: 'Running the play',
        bullets: [
          'Write every close date onto your utilization table.',
          'Set a calendar reminder three days before each close.',
          'Pay down to your target before that date — the target, not the whole balance, if cash is tight.',
          'Let one card report 1–9% of its limit so the file shows active, managed use.',
          'Re-pull that bureau two to three weeks later to confirm the new figure landed.',
        ],
        actions: ['Find and log all statement close dates today.'],
        guardrail:
          'Paying before the close does not replace paying by the due date. Miss the due date and you trade a utilization win for a late mark that lasts years.',
      },
    ],
  },
  {
    id: 'window-24-48',
    title: 'Hour 24–48 — Dispute With Discipline',
    subtitle: 'Accuracy first — one claim per letter, evidence over adjectives',
    window: '24–48 HRS',
    lever: 'Dispute discipline',
    speed: 'fast',
    arc: 50,
    readMinutes: 3,
    sections: [
      {
        heading: 'Dispute discipline rules',
        bullets: [
          'One claim per letter, per bureau branch — never merge unrelated evidence sets into a single dispute.',
          'Dispute reporting errors and unverifiable items first — not emotional language about how a creditor treated you.',
          'Track the 30-day CRA clock on every dispute; escalate only with documented non-response.',
          'Pause new disputes on any account that will get re-pulled before a mortgage or major funding application.',
        ],
        actions: ['Draft one letter per disputed tradeline — no bundling.', 'Calendar the 30-day response deadline the moment you mail it.'],
      },
      {
        heading: 'Evidence over adjectives',
        paragraphs: [
          'A dispute that reads like a factual finding — citing the exact field, date, or balance that is wrong — holds up better than a dispute that reads like a complaint. Cite what you can see on the screenshot; never invent a status or outcome.',
        ],
        guardrail: 'Auto-generated reasons should reference what you can see on the bureau screenshot — never invent a status or outcome.',
      },
      {
        heading: 'Triage by cost and evidence',
        paragraphs: [
          'Go down your list of negatives and ask two questions about each one. How much is this costing me right now, and can I point at something on the page that is wrong? Items scoring high on both are your round-one targets.',
        ],
        metrics: [
          { label: 'Highest cost', value: 'Recent collections', note: 'Reported in the last 24 months' },
          { label: 'High cost', value: 'Recent 90+ lates', note: 'Severity compounds with recency' },
          { label: 'Moderate', value: 'Charge-offs', note: 'Especially with balance contradictions' },
          { label: 'Lower', value: 'Aged 30-day lates', note: 'Often better left to age off' },
        ],
        bullets: [
          'Status field and payment grid disagree within the same account block.',
          'The same account reports different dates or balances across two bureaus.',
          'A balance exceeds the credit limit or original high balance without explanation.',
          'The date of first delinquency does not match the first late mark on the grid.',
          'A collection and the original creditor both report a balance for the same debt.',
        ],
        actions: [
          'Rank negatives into three tiers: dispute now, dispute after evidence, leave to age.',
          'Screenshot the full account block for every tier-one item.',
          'Work the free Credit Dispute Letter Guide framework for your single highest-impact item.',
        ],
      },
    ],
  },
  {
    id: 'goodwill-fork',
    title: 'The Goodwill vs Factual Fork',
    subtitle: 'Two very different letters — sending the wrong one wastes the round',
    window: '24–48 HRS',
    lever: 'Pick the right letter',
    speed: 'steady',
    arc: 58,
    readMinutes: 4,
    sections: [
      {
        heading: 'When the mark is accurate',
        paragraphs: [
          'If a late payment genuinely happened, a factual dispute is dishonest and usually ineffective. The honest path is a goodwill request: a short, specific note to the furnisher explaining the circumstance, the correction you made, and the record you have kept since. It is a courtesy, not an entitlement, and it works most often on long-tenured accounts with one isolated blemish.',
        ],
        bullets: [
          'Write to the furnisher, not the bureau — the bureau cannot grant goodwill.',
          'One page. State the account, the month, what happened, and what changed.',
          'Point to your record since: number of on-time payments, current standing.',
          'Ask specifically for removal of the reported late, not for a general review.',
          'Accept a no gracefully. Repeated requests do not improve the odds.',
        ],
      },
      {
        heading: 'When the data is wrong',
        paragraphs: [
          'If the field is inaccurate, incomplete, inconsistent, or unverifiable, this is a factual dispute and it runs through the credit reporting agency under the FCRA reinvestigation process. Different letter, different recipient, different footing.',
        ],
        metrics: [
          { label: 'Goodwill', value: 'Furnisher', note: 'Accurate mark · courtesy request' },
          { label: 'Factual dispute', value: 'Bureau', note: 'Inaccurate data · reinvestigation duty' },
          { label: 'Validation', value: 'Collector', note: 'Separate statute · separate letter' },
        ],
        guardrail:
          'Never combine the two in one letter. A goodwill paragraph inside a factual dispute reads as an admission and undercuts the dispute.',
      },
    ],
  },
  {
    id: 'window-48-72',
    title: 'Hour 48–72 — Inquiry Budget',
    subtitle: 'Treat every hard pull as a limited resource, not a free action',
    window: '48–72 HRS',
    lever: 'Inquiry budget',
    speed: 'fast',
    arc: 70,
    readMinutes: 3,
    sections: [
      {
        heading: 'Build your inquiry budget',
        bullets: [
          'Track every hard pull: bureau, date, lender, result, and next eligible date.',
          'Space consumer applications 30–45 days minimum when actively building.',
          '90 days is safer when a mortgage-adjacent goal is on the table.',
          'Apply right after statement close, when utilization is reporting low.',
        ],
        metrics: [
          { label: 'Building spacing', value: '30–45 days' },
          { label: 'Mortgage-adjacent spacing', value: '90 days' },
        ],
      },
      {
        heading: 'Real strategy vs spray-and-pray',
        paragraphs: [
          'Five to ten targeted applications matched to your actual file outperform "500-app lists" every time. Volume without targeting looks like desperation to an underwriter — and it wastes your limited inquiry budget.',
        ],
        actions: ['List every planned application for the next 90 days before you submit the first one.'],
        metrics: [
          { label: 'Visible for', value: '2 years', note: 'Scored for roughly 12 months' },
          { label: 'Realistic app count', value: '5–10', note: 'Targeted to your file, not a mass list' },
        ],
        guardrail: 'Funding is subject to underwriting. No amount of preparation guarantees an approval.',
      },
    ],
  },
  {
    id: 'thin-file',
    title: 'Thickness, Mix, and Age',
    subtitle: 'Structural work you start in hour 72 and collect on in ninety days',
    window: '48–72 HRS',
    lever: 'File depth',
    speed: 'foundation',
    arc: 78,
    readMinutes: 4,
    sections: [
      {
        heading: 'Thin files need depth before they need aggression',
        paragraphs: [
          'If you have two accounts and eleven months of history, no dispute strategy is going to help you. What helps is adding responsible, reporting depth and then leaving it alone. This chapter will not move your score by Friday — it is what makes the next ninety days compound instead of stall.',
        ],
        bullets: [
          'A secured card from an issuer that reports to all three bureaus is the standard entry point.',
          'A credit-builder loan adds installment history to a revolving-only file.',
          'Authorized-user standing on a seasoned, low-utilization account can add age and limit — vet the primary holder carefully, because their behavior reports to you.',
          'Every new account lowers your average age in the short term. Add deliberately, then stop.',
        ],
        guardrail:
          'Tradeline purchases and authorized-user placements carry real cost and risk. Understand what reports, for how long, and what happens if the primary account changes. Never expect a guaranteed point delta.',
      },
      {
        heading: 'Protect what is already old',
        paragraphs: [
          'Your oldest account is an asset you cannot replace. Closing it removes its limit from your utilization calculation immediately, and its age eventually stops helping you. Keep it open, keep a small recurring charge on it, and keep autopay on that charge.',
        ],
        actions: [
          'Set a small recurring charge on your oldest revolving account.',
          'Turn on autopay for at least the minimum on every account you hold.',
          'Do not close accounts to simplify your life this week — simplify after the file is stable.',
        ],
      },
    ],
  },
  {
    id: 'beyond-72',
    title: 'Beyond 72 — Fundability Timing',
    subtitle: 'Mix, age, and the re-pull discipline that locks in gains',
    window: 'DAY 3–90',
    lever: 'Fundability timing',
    speed: 'steady',
    arc: 85,
    readMinutes: 3,
    sections: [
      {
        heading: 'Re-pull and verify',
        paragraphs: [
          'Re-pull your reports at day 90 after any major changes — disputes resolving, new accounts posting, or utilization shifts. Verify the fields actually match what you expected before you act on them.',
        ],
      },
      {
        heading: 'Match the product to the file',
        bullets: [
          'Installment history matters most for auto lending.',
          'Thick revolving history matters most for card approvals.',
          'A business file needs its own track record before a business line-of-credit application.',
        ],
      },
      {
        heading: 'Protect what you built',
        paragraphs: [
          'Document approval letters and terms in your evidence vault — they are leverage for future refinancing conversations. Maintain autopay and a deadline calendar; one 30-day late mark can erase months of stacking work.',
        ],
        guardrail: 'Educational only; not legal or financial advice. Results vary by file and lender policy.',
      },
    ],
  },
  {
    id: 'myths',
    title: 'The Plateau, the Bounce, and the Myths',
    subtitle: 'What to expect when the fast wins stop arriving',
    window: 'DAY 3–90',
    lever: 'Reality check',
    speed: 'instant',
    arc: 90,
    readMinutes: 4,
    sections: [
      {
        heading: 'Why scores bounce back down',
        paragraphs: [
          'People pay a card down, watch the score rise, then let the balance climb again over the following two months. The score falls back, and they conclude that credit work does not work. It worked. The behavior reverted.',
          'Most files also see their fastest movement early, when utilization drops and obvious inaccuracies clear. Then progress slows, because what remains is structural. The plateau is not failure — it is the point where the work changes from sprinting to maintaining.',
        ],
      },
      {
        heading: 'Myths worth retiring',
        bullets: [
          'Checking your own credit lowers your score — false. That is a soft pull.',
          'Carrying a balance builds credit — false. You pay interest for nothing; report a small balance, then pay it.',
          'Closing old cards helps — false. It removes limit and eventually removes age.',
          'Paying a collection always removes it — false. Payment can change the balance, not the history, absent a written agreement.',
          'One dispute letter fixes everything — false. It opens a reinvestigation on one item.',
          'A specific score guarantees approval — false. Underwriting reads the whole file.',
        ],
        guardrail: SCORE_BOOST_COMPLIANCE,
      },
    ],
  },
  {
    id: 'habit-loop',
    title: 'The Habit Loop That Keeps Gains',
    subtitle: 'Turning a 72-hour sprint into a permanent operating rhythm',
    window: 'ONGOING',
    lever: 'Sustain the gains',
    speed: 'foundation',
    arc: 95,
    readMinutes: 2,
    sections: [
      {
        heading: 'A simple weekly rhythm',
        bullets: [
          'Weekly: check statement close dates and adjust balances before they report.',
          'Monthly: review open disputes against their 30-day clocks and escalate only with documentation.',
          'Quarterly: re-pull tri-bureau reports and compare against your baseline screenshots.',
        ],
      },
      {
        heading: 'The habits that protect the sprint',
        paragraphs: [
          'Autopay on every account you keep open, a standing inquiry log, and a single evidence vault for everything you have ever disputed or financed — these three habits do more long-term work than any single "hack."',
        ],
        actions: ['Turn on autopay for every open account today.', 'Start one inquiry log and one evidence vault — and never let either go stale.'],
      },
      {
        heading: 'Track disputes on the same calendar',
        paragraphs: [
          'If you mailed disputes during hour 24–48, day 30 to 35 is when the reinvestigation window closes. Scan whatever arrives the day it arrives, note what changed, and build Round 2 from their answer rather than resending Round 1.',
        ],
        bullets: [
          'Day 30–35: reinvestigation results are due. Log what changed and what did not.',
          'No response: follow up in writing referencing your certified mail tracking number.',
          '"Verified" with no explanation: request the method of verification in writing.',
          'Corrected on one bureau only: that mismatch is now new evidence for the other two.',
        ],
      },
    ],
  },
  {
    id: 'next-90-days',
    title: 'Your Next 30 / 60 / 90 Days',
    subtitle: 'A concrete plan to carry the mission past hour 72',
    window: 'HANDOFF',
    lever: 'Mission complete',
    speed: 'foundation',
    arc: 97,
    readMinutes: 3,
    sections: [
      {
        heading: 'Day 30',
        paragraphs: ['First dispute responses should be arriving. Compare bureau responses against your original screenshots and escalate only documented non-responses.'],
      },
      {
        heading: 'Day 60',
        paragraphs: ['Reassess utilization and inquiry spacing. If a funding goal is close, hold off on new applications until day 90 unless your file is clearly ready.'],
      },
      {
        heading: 'Day 90',
        paragraphs: ['Re-pull, verify, and decide on funding applications with a complete picture — not a guess. This is also a good checkpoint to talk with a Finely Cred specialist about next moves.'],
        guardrail: 'Results vary · not legal or financial advice · funding subject to underwriting.',
      },
    ],
  },
  {
    id: 'worksheet',
    title: 'Your 72-Hour Worksheet',
    subtitle: 'Everything above, condensed into what you actually do',
    window: 'HANDOFF',
    lever: 'Execute',
    speed: 'instant',
    arc: 100,
    readMinutes: 3,
    sections: [
      {
        heading: 'Hour by hour',
        bullets: [
          'Hour 0–24: pull all three reports, screenshot every revolving panel, build the utilization table, record your baseline score and date, pay down the highest bands, log every statement close date.',
          'Hour 24–48: rank negatives by cost and evidence, screenshot tier-one account blocks, choose goodwill or factual for each, mail one dispute for your highest-impact item.',
          'Hour 48–72: build the inquiry ledger, decide on any foundation accounts, set autopay everywhere, set close-date reminders.',
          'Beyond 72: re-pull on a rotation, work Round 2 from their responses, and time applications to a quiet, low-utilization file.',
        ],
      },
      {
        heading: 'The four artifacts you should own by hour 72',
        bullets: [
          'A dated utilization table with close dates on every revolving account.',
          'A screenshot folder of every negative item you intend to work.',
          'One mailed dispute with a certified tracking number logged against a date.',
          'A calendar with close-date reminders, autopay confirmations, and a day-35 dispute follow-up.',
        ],
        actions: [
          'Pair this roadmap with the free Credit Dispute Letter Guide for the letter-writing half of the work.',
          'Re-pull one bureau in thirty days and compare against your baseline snapshot.',
        ],
        guardrail: SCORE_BOOST_COMPLIANCE,
      },
    ],
  },
];

function flattenChapterForPdf(chapter: ScoreBoostChapter): GeneratedGuidePage {
  return {
    id: chapter.id,
    title: chapter.title,
    subtitle: chapter.subtitle,
    readMinutes: chapter.readMinutes,
    sections: chapter.sections.map((sec) => {
      const bullets = [...(sec.bullets ?? [])];
      if (sec.metrics?.length) bullets.push(...sec.metrics.map((m) => `${m.label}: ${m.value}${m.note ? ` (${m.note})` : ''}`));
      if (sec.actions?.length) bullets.push(...sec.actions.map((a) => `Do this now: ${a}`));
      const paragraphs = [...(sec.paragraphs ?? [])];
      if (sec.guardrail) paragraphs.push(`Note — ${sec.guardrail}`);
      return {
        ...(sec.heading ? { heading: sec.heading } : {}),
        ...(paragraphs.length ? { paragraphs } : {}),
        ...(bullets.length ? { bullets } : {}),
      };
    }),
  };
}

/** Printable pages derived from the chapters above — used by buildScoreRoadmapPdf.ts. */
export const SCORE_ROADMAP_PAGES: GeneratedGuidePage[] = [
  ...SCORE_BOOST_CHAPTERS.map(flattenChapterForPdf),
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    sections: [
      { bullets: ['Educational only; not legal or financial advice. Results vary by file and lender policy. Funding subject to underwriting.'] },
    ],
  },
];
