import type { FreeGuide } from './freeGuides';

/**
 * The Agency Guide — real PDF/reader content for AGENCY_FUNNEL.
 * Matches the landing page promise: offer clarity, partner attraction, smart
 * systems, sustainable growth, positioning, and freedom through structure.
 * Educational only — not legal or financial advice; income and results vary.
 */
export const AGENCY_GUIDE_ID = 'the-agency-guide' as const;

export const AGENCY_GUIDE: FreeGuide = {
  id: AGENCY_GUIDE_ID,
  title: 'The Agency Guide — Build a Profitable Agency',
  desc: 'Build a profitable agency, attract better-fit partners, and create more time, income, and freedom — offer clarity, partner attraction, smart systems, and scalable structure for credit-services agencies.',
  sections: [
    {
      heading: '1. What this guide is for',
      bullets: [
        'KEY: Most agencies do not fail from lack of effort — they fail from an unclear offer, no delivery system, and no ceiling on owner hours.',
        'Give you a repeatable framework to define your offer, attract better-fit partners, and deliver consistently without your calendar owning you.',
        'Show how Finely Cred\u2019s partner OS, compliance-first language, and revenue-share tiers turn a solo hustle into a real agency.',
        'This is education, not a guarantee of revenue, partner count, or timeline — results vary by market, effort, and execution.',
        'TIP: Read this once straight through, then come back to the chapter matching your current bottleneck.',
      ],
    },
    {
      heading: '2. Offer clarity — the irresistible offer',
      bullets: [
        'An agency without a named offer is a menu of favors — prospects cannot say yes to something they cannot describe back to you.',
        'Name the transformation, not the task: "we get your business bureau-fundable in 90 days" beats "we help with credit stuff."',
        'Pick one primary lane to lead with (personal restore, business credit sequencing, or debt/documentation support) even if you deliver more later.',
        'Price the outcome and the system, not the hours — hourly framing invites haggling; outcome framing invites commitment.',
        'KEY: If you cannot explain your offer in one sentence a stranger would repeat correctly, it is not clear yet — tighten it before you spend on ads.',
        'TIP: Write your offer as "For [who], we [do what], so that [outcome], without [the pain they are avoiding]."',
      ],
    },
    {
      heading: '3. Partner attraction — position for the right people',
      bullets: [
        'Your ideal partner is not "anyone with a pulse and a credit problem" — define who you serve best and say no to the rest.',
        'Lead with proof and process, not promises: show the framework, the checklist, the before/after documentation style — not guaranteed scores or outcomes.',
        'Referral and testimonial systems outperform cold ad spend for most credit-services agencies in year one — ask for the referral at the moment of a documented win.',
        'Content that teaches (like this guide) builds trust faster than content that sells — teach the "why," then invite the "how" as your paid offer.',
        'WARNING: Never promise specific score increases, guaranteed deletions, or funding amounts in marketing copy — compliance-safe language protects the agency and the partner.',
        'TIP: One clear case study (with permission, no guarantees implied) converts better than ten generic testimonial quotes.',
      ],
    },
    {
      heading: '4. Smart systems — deliver without burning out',
      bullets: [
        'Every recurring task you do manually twice should become a checklist by the third time and a template or automation by the fifth.',
        'Standardize intake: one form, one document checklist, one onboarding sequence — inconsistent intake creates inconsistent delivery.',
        'Use a shared operating system (like the Finely Cred partner OS) so partner files, evidence, and letters live in one place instead of scattered folders and inboxes.',
        'Build a "day 1 to day 30" partner journey map so every new partner gets the same quality experience regardless of who on your team handles it.',
        'KEY: Systems are what let you serve partner 50 the same way you served partner 1 — without you personally touching every file.',
        'TIP: Document the system while you are doing the work, not after — a screen recording plus three bullet points beats a blank SOP page.',
      ],
    },
    {
      heading: '5. Sustainable growth — scale with confidence',
      bullets: [
        'Growth without delivery capacity just produces refunds and reputation damage — confirm you can deliver at your current volume before you scale marketing spend.',
        'Add capacity in this order: better systems, then part-time support, then full hires — most agencies over-hire before they have systems to support a team.',
        'Track a simple weekly scoreboard: new partners, active files, completed milestones, and referrals generated — revenue lags these leading indicators.',
        'Reinvest a fixed percentage of revenue into systems and training before lifestyle upgrades in the first 12 months — compounding beats a fast burn.',
        'COMPLIANCE: Growth projections and income examples in this guide are illustrative only; individual results vary and are not guaranteed.',
      ],
    },
    {
      heading: '6. Strong positioning — stand out in a crowded market',
      bullets: [
        'Most "credit repair" marketing sounds identical — differentiate on process transparency, documentation standards, and partner terminology instead of louder promises.',
        'Publish your actual method (like the 5-step dispute framework or a fundability sequence) — showing your work builds more trust than hiding it as a "secret."',
        'Use compliance-aware language everywhere: "results vary," "not legal advice," "funding subject to underwriting" — this is a market differentiator, not just a disclaimer.',
        'Partner-branded materials (not generic reseller PDFs) signal a real operation — white-label-ready tools matter once you start recruiting sub-agents or staff.',
        'TIP: Ask three current partners why they chose you over a competitor — their exact words are your best positioning copy.',
      ],
    },
    {
      heading: '7. Freedom through structure',
      bullets: [
        'Freedom is not the absence of work — it is work that does not require your personal presence for every file to move forward.',
        'Build toward one weekly "owner review" meeting instead of daily fire-fighting: if you are needed hourly, the system is not done yet.',
        'Decide your non-negotiable hours before you decide your revenue goal — agencies that scale without this usually trade a job for a bigger job.',
        'Revenue-share and tiered agency models (like Finely Cred\u2019s agency partner tiers) let you add capacity and seats without rebuilding compliance and training from scratch.',
        'KEY: The agencies that "win" build smarter systems, not just longer hours — structure is what converts effort into compounding results.',
      ],
    },
    {
      heading: '8. Your 30-day launch checklist',
      bullets: [
        'Week 1 — Write your one-sentence offer; define your ideal partner; set up intake form and document checklist.',
        'Week 2 — Build your onboarding sequence and evidence vault structure; draft compliance-safe marketing copy.',
        'Week 3 — Publish one teaching piece of content; ask two past partners for referrals or testimonials with permission.',
        'Week 4 — Review your weekly scoreboard; identify the first task worth systemizing or delegating; plan next month\u2019s single growth lever.',
        'TIP: Pick one lever per month — agencies that chase five growth tactics at once usually finish zero of them well.',
      ],
    },
    {
      heading: 'Also in your download',
      bullets: [
        'Offer clarity worksheet — turn your services into one named, priced offer.',
        'Ideal-partner positioning checklist — who you serve, who you refer out.',
        'Delivery systems starter kit — intake, onboarding, and file checklist templates.',
        'Agency capacity tiers overview — files, seats, and white-label depth as you grow.',
        `${'Finely Cred'} partner OS preview — see how agencies run restore and funding lanes in one hub.`,
      ],
    },
    {
      heading: 'Disclaimer',
      bullets: [
        'Educational only; not legal, tax, or financial advice. Consult a licensed professional for advice specific to your situation.',
        'COMPLIANCE: Results vary · income and growth examples are not guarantees · not legal advice.',
      ],
    },
  ],
};
