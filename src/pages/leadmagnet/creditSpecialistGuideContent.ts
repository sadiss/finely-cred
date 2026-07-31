/**
 * Credit Specialist Guide — in-app chapter content.
 * Educational only. Public copy uses partner terminology.
 */

export const CS_GUIDE_PATH = '/credit-specialist-guide';
export const CS_GUIDE_READ_PATH = '/credit-specialist-guide/read';
/** Pricing / signup owned by another lane — landings CTA here. */
export const CS_JOIN_PATH = '/credit-specialist/join';

export type CreditSpecialistGuideSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: string;
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
} as const;

export const CS_GUIDE_CHAPTERS: CreditSpecialistGuideChapter[] = [
  {
    id: 'welcome',
    number: '01',
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
        heading: 'How to use the chapters',
        paragraphs: [
          'Read straight through once. Then return to the chapter that matches the partner sitting in front of you: personal restore, business fundability, debt pressure, or growth opportunity.',
        ],
        callout: 'Educational guide only. Results vary · not legal advice · funding subject to underwriting.',
      },
    ],
  },
  {
    id: 'personal-credit',
    number: '02',
    title: 'Personal Credit Mastery',
    subtitle: 'Scores, utilization, disputes, and the habits that compound',
    kicker: 'Personal lane',
    teaser: 'Teach partners how files actually move — utilization, age, mix, and factual dispute craft.',
    accent: 'lime',
    sections: [
      {
        heading: 'What personal credit really signals',
        paragraphs: [
          'A score is a compressed story about payment history, utilization, age of accounts, mix, and recent inquiries. Specialists who explain the story earn trust faster than specialists who only chase point jumps.',
        ],
        bullets: [
          'Payment history still dominates — late marks need a plan, not a pep talk.',
          'Utilization is often the fastest lever when balances are controllable.',
          'Thin files need depth before they need aggression.',
          'Inquiries cluster; spray-and-pray apps punish the file.',
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
        heading: 'Specialist coaching cadence',
        bullets: [
          'Week 1: pull + organize + prioritize tradelines that matter.',
          'Week 2–3: first round letters with evidence attached.',
          'Ongoing: utilization coaching, good-account protection, next-round strategy.',
          'Always: set expectations — timelines vary; nothing is guaranteed.',
        ],
      },
    ],
  },
  {
    id: 'business-credit',
    number: '03',
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
        heading: 'Mistakes that freeze files',
        paragraphs: [
          'Mismatched records, thin vendor history, inquiry sprawl, and premature applications are the blockers that stop sequencing cold. Teach partners to earn the next stage gate before they chase the next “easy approval” ad.',
        ],
      },
    ],
  },
  {
    id: 'debt-strategy',
    number: '04',
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
        heading: 'Eradication framing that stays compliant',
        paragraphs: [
          'Talk about reducing pressure, correcting inaccurate reporting, and rebuilding optionality — never “wipe any debt guaranteed.” Partners deserve honesty; underwriters and regulators notice the difference.',
        ],
      },
    ],
  },
  {
    id: 'court-summons',
    number: '05',
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
        heading: '“Winning” without overclaiming',
        paragraphs: [
          'Winning, in specialist language, means arriving prepared: complete evidence, clear timeline, and no self-inflicted defaults from ignored mail. Preparation improves options; it does not guarantee a courtroom result.',
        ],
      },
    ],
  },
  {
    id: 'opportunities',
    number: '06',
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
        heading: 'Partner growth compounds',
        paragraphs: [
          'Restored partners refer. Funded partners expand. Specialists who document wins ethically (with permission) build a pipeline that ads alone cannot buy.',
        ],
      },
    ],
  },
  {
    id: 'income-path',
    number: '07',
    title: 'Your Income Path as a Specialist',
    subtitle: 'How Finely Cred specialists earn while delivering real partner work',
    kicker: 'Specialist path',
    teaser: 'Tools, training, white-label OS, and percentage economics — built for operators, not spectators.',
    accent: 'sky',
    sections: [
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
        ],
      },
      {
        heading: 'Next step',
        paragraphs: [
          'Finish this guide, then open the Credit Specialist join path to see program tiers, economics, and application options. The guide teaches the craft; the program gives you the OS to deliver it at scale.',
        ],
        callout: 'Application is not a job offer. Income varies. Educational positioning required.',
      },
    ],
  },
];

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
