/** Rich editorial copy for premium credit analysis PDF — matches Finely Cred voice. */

export const MINDSET_INTRO = {
  title: 'How people actually use credit',
  subtitle:
    'Before we walk through your file, it helps to understand the three mindsets we see — because your report is not just a score. It is a mirror of which tier you have been operating in.',
  paragraphs: [
    'Most adults were never taught credit as a system. They were taught to pay bills and hope for the best. That is why a strong income can still sit beside a bruised file — and why a decent score can still cap you below the products you deserve.',
    'At Finely Cred we sort clients into three levels. Not to judge — to orient. Once you see the level you have been living in, the items on your report stop feeling random. They become levers.',
    'This section is intentional. We place it before the negative accounts on purpose: your file is not a list of failures. It is a picture of where you have been operating, and what becomes possible when the file is engineered with intention.',
  ],
};

export const MINDSET_TIERS_EXTENDED = [
  {
    level: 'Level 01',
    title: 'Credit is just there',
    paragraphs: [
      'At this level, credit is background noise. Statements arrive, minimums get paid, and the score is checked only when something breaks — a denial, a co-sign request, a collection letter that was never expected.',
      'People here often have solid jobs and real responsibilities, but no credit strategy. Accounts age without plan. Utilization drifts. Old items linger because nobody showed them the sequence to remove or reframe them.',
      'If this sounds familiar, you are not behind — you are uncoached. The gap is not discipline. It is structure.',
    ],
  },
  {
    level: 'Level 02',
    title: 'Credit is good enough',
    paragraphs: [
      'This is the most common tier we see among high earners. You have approvals. You have history. Life works — so optimization stops feeling urgent.',
      'Good enough credit gets good enough terms: mid-tier limits, standard pricing, mainstream products. That is comfortable. It is also expensive over a lifetime, because lenders reserve their best economics for files that look engineered, consistent, and low-friction.',
      'Many clients sit here for years without realizing how close they are to a different tier of access — not because their income changed, but because their file never got the same attention as their career.',
    ],
  },
  {
    level: 'Level 03',
    title: 'Credit builds wealth',
    paragraphs: [
      'At the top tier, credit is treated as capital infrastructure. Limits are sequenced. Inquiries are timed. Personal and business lanes are aligned so one does not sabotage the other.',
      'This is where relationship banking, premium cards, and invitation-only products become realistic — not as luck, but as an outcome of a file that reads clean, deep, and intentional to underwriters.',
      'You do not need to be wealthy to think at this level. You need clarity, sequence, and a file that tells the story lenders want to fund.',
    ],
  },
] as const;

export const BLACK_CARD_ESSAY = {
  title: 'The ceiling you cannot see',
  subtitle: 'Why a clean file is not only about approvals — it is about access you have never been offered.',
  paragraphs: [
    'There is a difference between being approved and being invited. Mainstream credit gets you in the door. Premium credit gets you seated without asking.',
    'Black-card-level products — ultra-high limits, metal tiers, concierge lanes, and relationship pricing — are not marketed to everyone. They are extended to profiles that signal stability, low friction, and long-term value. Underwriters read your tradelines, utilization patterns, inquiry cadence, and negative history as a single narrative.',
    'When that narrative is cluttered — collections that should have been addressed, duplicate entries, stale charge-offs, identity inconsistencies — you are not only fighting denials. You are invisible to the tier that would change your terms.',
    'We say this plainly: not knowing your ceiling is often the most expensive line item on your report. You may be one disciplined restore cycle away from a file that qualifies for a different conversation with lenders.',
    'This report is designed to show you that ceiling. Not with hype — with sequence. Restore what should not remain. Protect what is working. Build depth where it matters. Then fund — personally or in business — from strength instead of hope.',
  ],
};

export const PATH_FORWARD_ESSAY = {
  title: 'Your path forward',
  subtitle: 'Restore · Build · Fundability — always in that order.',
  intro: [
    'Jumping straight to new applications is the most common mistake we correct. Lenders read the whole file, not just the score. This plan respects that reality.',
    'Each phase below has a purpose. Skipping restore to chase a card is how inquiries stack on top of negatives. Skipping build to chase funding is how approvals arrive with weak limits. The sequence protects you.',
  ],
  restore: {
    title: 'Phase 1 — Restore',
    paragraphs: [
      'Restore means stabilizing the truth on your report. Identity and address alignment across TransUnion, Experian, and Equifax come first — disputes fail when the bureaus cannot match you cleanly.',
      'Next, we target negatives in impact order: items that suppress score, skew utilization, or create underwriter friction. One tradeline per dispute round, evidence-backed, logged in your portal. That discipline is what separates busy work from movement.',
      'Re-pull reports 30–45 days after bureau responses post. If you only need utilization wins on open positives, you may re-pull sooner — but never dispute and apply blindly in the same cycle.',
    ],
  },
  build: {
    title: 'Phase 2 — Build',
    paragraphs: [
      'Build begins when the file is stable enough that new activity helps instead of hurts. Keep revolving utilization under 30% overall — under 10% on cards you will lean on for a major application.',
      'Protect on-time streaks on open positive tradelines. They are the foundation lenders trust when negatives fall off or update.',
      'Add depth only when it makes sense: secured products where needed, authorized-user tradelines where appropriate, vendor or business lines when your personal lane is clean. Depth without restore is decoration.',
    ],
  },
  fundability: {
    title: 'Phase 3 — Fundability',
    paragraphs: [
      'Fundability is where personal and business lanes stop fighting each other. Income, banking history, and updated reports live in your vault so conversations with lenders start from proof, not memory.',
      'Sequence applications after disputes settle and scores stabilize. Align inquiry timing so a business pull does not undermine a mortgage window — or vice versa.',
      'This is the tier where credit stops being a monthly bill and starts being a tool — if the file underneath it is engineered to support the story you tell.',
    ],
  },
};

export const NEGATIVE_SECTION_INTRO = {
  title: 'Reading your negative accounts',
  paragraphs: [
    'The accounts below are grouped by category so you can scan without overwhelm. Each card shows the fields that matter for strategy — balance, status, dates, responsibility — not a full payment grid.',
    'We deliberately place mindset and your path forward before this section. Negatives are data points in a plan, not a verdict on your future.',
    'Items marked for dispute in your portal may appear here with strategist notes. Your uploaded bureau report remains the source of record for line-by-line history.',
  ],
};

export const NEGATIVE_CATEGORY_COPY: Record<string, { intro: string; action: string }> = {
  collections: {
    intro:
      'Collection accounts often hit twice: score impact and underwriter hesitation. Validation, duplication, and date-of-first-delinquency accuracy are common leverage points when the reporting is sloppy.',
    action: 'Prioritize collections with balances or recent activity first — they read louder on automated approvals.',
  },
  charge_offs: {
    intro:
      'Charge-offs signal a lender closed the relationship with loss. Status wording, balance reporting, and whether the same debt also appears as a collection are frequent review targets.',
    action: 'Confirm whether the balance is still reporting after settlement — stale balances keep the wound open on your file.',
  },
  repossessions: {
    intro:
      'Repossessions and foreclosures are high-friction items. Accuracy of dates, deficiency balances, and whether the account is reporting past statutory relevance all matter for your sequence.',
    action: 'These items often need documented timelines — gather contracts and disposition letters into your portal vault.',
  },
  delinquencies: {
    intro:
      'Delinquency notation on otherwise open accounts can suppress scores even when balances are current. Look for late marks that contradict payment history or re-age without basis.',
    action: 'On open positives, goodwill and data-furnisher accuracy are sometimes viable after a sustained on-time streak.',
  },
  other: {
    intro:
      'Other derogatory marks — public records, medical clusters, or ambiguous status language — still deserve a place in your plan even when they do not fit a neat bucket.',
    action: 'Your strategist can tag these for manual review when automation cannot classify them cleanly.',
  },
};

export const PRIORITY_SECTION_INTRO = {
  title: 'Priority action plan',
  subtitle: 'Your next dispute round — ranked by impact, explained in plain language.',
  paragraphs: [
    'Below are your highest-leverage targets based on the parsed report and dispute intelligence in Finely Cred. Each item includes why it ranks where it does — not legal citations, not jargon for its own sake.',
    'Work one tradeline per letter. Log mail dates. Upload responses. Re-run analysis when the bureaus update. That loop is the job — we built the portal to hold it in one place.',
  ],
};

export const ROADMAP_ESSAY = {
  title: '90-day execution roadmap',
  subtitle: 'A quarter is enough time to see bureau movement when the sequence is disciplined.',
  paragraphs: [
    'This roadmap assumes you are executing restore first. Timelines compress when your file is already clean and you are in build or fundability — your strategist can shorten phases in the portal.',
    'Treat each window as a checkpoint, not a deadline. Credit rewards documentation and patience more than volume.',
  ],
};

export const FINELY_PARTNERSHIP = {
  title: 'How Finely Cred supports you',
  paragraphs: [
    'Your portal is the operating system for this plan — not a PDF warehouse. Upload reports, generate letters, store evidence, and track dispute rounds in one place.',
    'When you want hands-on sequencing — funding prep, business credit lanes, or a restore sprint — book a strategist session. The report you are reading is the map; the portal is where the work lives.',
    'Re-upload credit reports after bureau responses post. We will re-parse, re-rank, and regenerate analysis so you are never guessing whether the file moved.',
    'Questions about an item on this report? Bring it to your next session with the page number and account name. We will walk the tradeline against your uploaded source file together.',
  ],
};

export const CLOSING_ESSAY = {
  title: 'What happens next',
  paragraphs: [
    'You now have an oriented view of your file — readiness, positives, inquiries, negatives by category, and a ranked action plan. The next step is execution, not re-reading.',
    'Start with your priority list. Prepare evidence before you mail. Use certified tracking and log dates in Finely Cred so response windows are visible at a glance.',
    'When updates post — typically 30 to 45 days after a dispute round — upload fresh reports. We will measure movement, adjust the plan, and tell you whether you are ready to build or fund.',
    'If you are pursuing business credit, keep personal restore and business sequencing aligned. Nothing stalls fundability faster than competing inquiries on both lanes in the same month.',
    'This document is educational strategy support — not legal advice, not a guarantee of outcomes. Your situation is unique; your strategist helps you apply this plan to your goals.',
    'We are glad you are here. A file engineered with intention is one of the highest-return projects you can run this year — and you do not have to run it alone.',
  ],
};
