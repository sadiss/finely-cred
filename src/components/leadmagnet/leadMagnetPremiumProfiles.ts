import type { FinelyOsPublicAccent } from '../../features/os/finelyOsLightUi';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';

export type PremiumMagnetChapter = { title: string; bullets: string[] };
export type PremiumMagnetTrack = { id: string; label: string; promise: string; bestFor: string; plan: string[] };
export type PremiumMagnetFaq = { q: string; a: string };
export type PremiumMagnetComparisonRow = { label: string; diy: string; guide: string; finely: string };

export type LeadMagnetPremiumProfile = {
  accent: FinelyOsPublicAccent;
  heroProof: string[];
  problemTitle: string;
  problemBody: string;
  painPoints: string[];
  chapters: PremiumMagnetChapter[];
  tracks: PremiumMagnetTrack[];
  timeline: Array<{ step: string; detail: string }>;
  comparison: PremiumMagnetComparisonRow[];
  bonusTools: Array<{ title: string; desc: string }>;
  faqs: PremiumMagnetFaq[];
  portalHighlights: string[];
  captureHeadline: string;
  captureSub: string;
  successHeadline: string;
  formStepTitle: string;
  formStepSub: string;
};

const SHARED_PORTAL = [
  'Open Letter Studio and a live task board after you claim the guide.',
  'Upload reports and preview the partner portal workspace.',
  'Use guided checklists to keep the next step obvious.',
  'Request a specialist follow-up when you want a guided review.',
];

const ONE_COMPLIANCE = 'Results vary · not legal advice · funding subject to underwriting';

function profile(
  partial: Omit<LeadMagnetPremiumProfile, 'comparison' | 'faqs'> & {
    comparison?: PremiumMagnetComparisonRow[];
    faqs?: PremiumMagnetFaq[];
  },
): LeadMagnetPremiumProfile {
  return {
    comparison: partial.comparison ?? [
      { label: 'Structured playbook', diy: 'Scattered blog posts', guide: 'A sequenced guide you can follow', finely: 'The guide plus a live partner portal' },
      { label: 'Tracking', diy: 'Spreadsheets and screenshots', guide: 'Printable checklists', finely: 'A task board built for credit work' },
      { label: 'Compliance', diy: 'Guesswork', guide: 'Educational guardrails', finely: 'Built-in educational copy' },
      { label: 'Support', diy: 'None', guide: 'Email follow-up', finely: 'An assigned specialist lane' },
    ],
    faqs: partial.faqs ?? [],
    ...partial,
  };
}

export const LEAD_MAGNET_PREMIUM_PROFILES: Record<string, LeadMagnetPremiumProfile> = {
  debt: profile({
    accent: 'sky',
    heroProof: [
      'Written validation requests you can send this week',
      'A summons checklist if court papers already arrived',
      'A live debt lane in the partner portal — no card required',
    ],
    problemTitle: 'Collectors move on a clock. This guide gives you a written sequence.',
    problemBody:
      'Most partners freeze when collections begin because they do not have an order of operations. This guide sells a calmer plan: request proof in writing, document every contact, and decide the next step from evidence rather than from the last phone call.',
    painPoints: [
      'Calls continue because nothing is in writing.',
      'Balances reappear that you cannot verify on a report.',
      'Court papers sit unopened while a deadline keeps running.',
      'Letters, proofs, and dates live in three different inboxes.',
    ],
    chapters: [
      {
        title: 'Validation versus verification',
        bullets: ['What a written request can ask for', 'How to log the response window', 'When silence is still a fact'],
      },
      {
        title: 'Collector call control',
        bullets: ['A script card for live calls', 'A cease-contact workflow', 'An evidence log you can keep'],
      },
      {
        title: 'Summons response',
        bullets: ['A first seventy-two-hour checklist', 'What not to ignore', 'When to seek licensed counsel'],
      },
      {
        title: 'The portal debt lane',
        bullets: ['A task board for debt items', 'A document vault', 'An optional specialist handoff'],
      },
    ],
    tracks: [
      {
        id: 'validation',
        label: 'Validation',
        promise: 'Ask collectors to prove what they claim before you pay.',
        bestFor: 'Unknown debts, disputed balances, and duplicate placements.',
        plan: ['Write the request', 'Log thirty days', 'Choose the next branch'],
      },
      {
        id: 'harassment',
        label: 'Harassment',
        promise: 'Document the pattern and answer it in writing.',
        bestFor: 'Excessive calls and wrong-party contacts.',
        plan: ['Keep a call log', 'Send a cease letter', 'Use the CFPB path when needed'],
      },
      {
        id: 'summons',
        label: 'Summons',
        promise: 'Replace panic with a deadline plan.',
        bestFor: 'Partners who already received court papers.',
        plan: ['Run the answer checklist', 'Gather evidence', 'Refer to counsel when the file requires it'],
      },
      {
        id: 'settlement',
        label: 'Settlement prep',
        promise: 'Negotiate from a verified file, not from a threat.',
        bestFor: 'Debts you have confirmed and intend to resolve.',
        plan: ['Verify first', 'Build an offer ladder', 'Keep the paper trail'],
      },
    ],
    timeline: [
      { step: 'Day 1', detail: 'Download the guide and list every open collection account.' },
      { step: 'Day 2–3', detail: 'Send validation requests for items you cannot verify.' },
      { step: 'Week 2', detail: 'Review responses and escalate factual disputes.' },
      { step: 'Week 4+', detail: 'Stabilize the file and book a strategist session if you want a review.' },
    ],
    bonusTools: [
      { title: 'Call script wallet card', desc: 'Short phrases that keep a live collector call on your terms.' },
      { title: 'Response tracker', desc: 'Dates, methods, and outcomes for every collector contact.' },
      { title: 'Summons red-flag scanner', desc: 'A quick triage if court paperwork landed in the mailbox.' },
    ],
    portalHighlights: SHARED_PORTAL,
    captureHeadline: 'Download the debt validation guide',
    captureSub: `Live portal tools, call scripts, and validation letters. ${ONE_COMPLIANCE}`,
    successHeadline: 'Your debt validation guide is ready',
    formStepTitle: 'Unlock the validation kit',
    formStepSub: 'The PDF arrives instantly. Casey, your debt strategist, can review the next step after you download.',
    faqs: [
      { q: 'Is this legal advice?', a: 'No. The guide is educational. Licensed counsel handles court matters in your state.' },
      { q: 'Will this stop collectors immediately?', a: 'Written requests and a clean log change the conversation. Outcomes vary by file and collector.' },
      { q: 'What if I was already sued?', a: 'Start with the summons checklist, then consult an attorney licensed in your state.' },
    ],
  }),

  business: profile({
    accent: 'amber',
    heroProof: [
      'Entity hygiene before the first application',
      'A vendor credit ladder you can sequence',
      'A funding-readiness session with an advisor',
    ],
    problemTitle: 'Funders finance a file that looks real. This guide builds that file in order.',
    problemBody:
      'Business credit stalls when the foundation is messy — mismatched addresses, thin vendor depth, and inquiry sprawl. This jumpstart aligns the entity story before you apply, so partners ask for capital in a sequence funders can actually underwrite.',
    painPoints: [
      'Personal guarantees persist because the business file is thin.',
      'Vendor accounts are denied and never report.',
      'Inquiry spikes follow a weekend of random applications.',
      'No workspace tracks vendor limits and reporting dates.',
    ],
    chapters: [
      {
        title: 'Entity hygiene',
        bullets: ['Secretary of state alignment', 'EIN and address consistency', 'A digital footprint audit'],
      },
      {
        title: 'D-U-N-S and the bureaus',
        bullets: ['A registration checklist', 'Profile completeness', 'A monitoring cadence'],
      },
      {
        title: 'The vendor ladder',
        bullets: ['A starter net-30 sequence', 'Vendors that report', 'Limit growth that does not rush the file'],
      },
      {
        title: 'Funding readiness',
        bullets: ['Underwriting signals', 'A document pack', 'Advisor-call prep'],
      },
    ],
    tracks: [
      {
        id: 'entity',
        label: 'Entity',
        promise: 'Look consistent on paper and online before you apply.',
        bestFor: 'New LLCs and sole proprietors moving up.',
        plan: ['Check the SOS filing', 'Sync the address', 'Match the website and email domain'],
      },
      {
        id: 'vendor',
        label: 'Vendor credit',
        promise: 'Build reporting depth before the first bank application.',
        bestFor: 'Thin profiles and first net-30 accounts.',
        plan: ['Open tier-one vendors', 'Pay on the reported cycle', 'Confirm that they furnish'],
      },
      {
        id: 'funding',
        label: 'Funding path',
        promise: 'Sequence capital asks instead of spraying applications.',
        bestFor: 'Partners ready for a line or term review.',
        plan: ['Review the file', 'Set an inquiry budget', 'Book the advisor session'],
      },
      {
        id: 'ops',
        label: 'Ops stack',
        promise: 'Run business credit as a weekly system.',
        bestFor: 'Agencies managing more than one entity.',
        plan: ['Use the portal lanes', 'Keep a task cadence', 'Preview the partner operating system'],
      },
    ],
    timeline: [
      { step: 'Week 1', detail: 'Complete entity hygiene and the D-U-N-S checklist.' },
      { step: 'Week 2–4', detail: 'Open the first reporting vendor accounts.' },
      { step: 'Day 45+', detail: 'Review limits and plan the first funding conversation.' },
      { step: 'Ongoing', detail: 'Track vendors and inquiries in the portal preview.' },
    ],
    bonusTools: [
      { title: 'Vendor sequencing map', desc: 'Which accounts to open in which order — and which to skip.' },
      { title: 'Inquiry budget worksheet', desc: 'Cap pulls before they cap the file.' },
      { title: 'Funding readiness scorecard', desc: 'A self-audit before you talk to an advisor.' },
    ],
    portalHighlights: SHARED_PORTAL,
    captureHeadline: 'Download the business credit jumpstart',
    captureSub: `Entity checklist, vendor map, and a portal preview. ${ONE_COMPLIANCE}`,
    successHeadline: 'Your business credit kit is ready',
    formStepTitle: 'Claim your jumpstart kit',
    formStepSub: 'Morgan, your funding strategist, can map the entity lane after you download.',
    faqs: [
      { q: 'Will this guarantee funding?', a: 'No. The guide teaches sequencing. Underwriting decides outcomes.' },
      { q: 'Do I need an LLC?', a: 'The guide covers entity options. Consistency matters more than a trendy structure.' },
      { q: 'Is personal credit involved?', a: 'Often yes at the start. The guide shows how to separate the paths over time.' },
    ],
  }),

  tradeline: profile({
    accent: 'violet',
    heroProof: [
      'Authorized user versus primary, explained in plain English',
      'Timing and inquiry discipline before you spend',
      'Risk-aware education with no score promises',
    ],
    problemTitle: 'A tradeline is a tool. This guide teaches you how to use it.',
    problemBody:
      'Partners buy tradelines without a file plan and then wonder why an underwriter still declines. This insider kit explains what actually reports, what a funder sees, and how a tradeline fits a broader restore sequence — before a dollar leaves the account.',
    painPoints: [
      'You paid for an authorized-user slot that does not match the file goal.',
      'Inquiry damage followed a boost because applications piled up.',
      'Nothing was planned for the week after the line posted.',
      'Marketing promised jumps that no honest operator would quote.',
    ],
    chapters: [
      {
        title: 'Primary versus authorized user',
        bullets: ['Reporting differences', 'The underwriter view', 'When an authorized user helps and when it does not'],
      },
      {
        title: 'Timing',
        bullets: ['Statement dates', 'Utilization windows', 'Application spacing'],
      },
      {
        title: 'Risk framing',
        bullets: ['Compliance-safe language', 'Alternatives to buying a line', 'Partner pathways'],
      },
      {
        title: 'The execution board',
        bullets: ['Portal preview tasks', 'A document checklist', 'Advisor follow-up'],
      },
    ],
    tracks: [
      {
        id: 'au',
        label: 'Authorized user',
        promise: 'Know what an authorized-user line can and cannot do.',
        bestFor: 'Thin files and age gaps.',
        plan: ['Match the account type', 'Guard utilization', 'Plan the removal'],
      },
      {
        id: 'primary',
        label: 'Primary tradelines',
        promise: 'Understand real reporting depth, not a rented headline.',
        bestFor: 'Partners building long-term file strength.',
        plan: ['Fit the product', 'Protect payment history', 'Graduate the file'],
      },
      {
        id: 'inquiry',
        label: 'Inquiry control',
        promise: 'Stop giving back gains with extra pulls.',
        bestFor: 'Pre-mortgage and pre-funding partners.',
        plan: ['Set a freeze strategy', 'Batch applications', 'Monitor the file'],
      },
      {
        id: 'plan',
        label: 'Full restore plan',
        promise: 'Treat tradelines as one lever inside a restore plan.',
        bestFor: 'Serious rebuilds.',
        plan: ['Run the dispute lane', 'Control utilization', 'Time the tradeline'],
      },
    ],
    timeline: [
      { step: 'Read', detail: 'Choose authorized user or primary after you understand the difference.' },
      { step: 'Plan', detail: 'Set an inquiry budget and a target posting window.' },
      { step: 'Execute', detail: 'Track the work in the portal preview.' },
      { step: 'Review', detail: 'Book an advisor session for a fit check.' },
    ],
    bonusTools: [
      { title: 'Tradeline fit matrix', desc: 'Match account types to the weaknesses on the current file.' },
      { title: 'Inquiry spacing calendar', desc: 'When to apply — and when to wait.' },
      { title: 'Underwriter reality check', desc: 'What funders scrutinize beyond the score.' },
    ],
    portalHighlights: SHARED_PORTAL,
    captureHeadline: 'Download the tradeline insider kit',
    captureSub: `Education first. No outcome promises. ${ONE_COMPLIANCE}`,
    successHeadline: 'Your tradeline kit is ready',
    formStepTitle: 'Unlock the insider guide',
    formStepSub: 'Riley will help you check timing before you spend a dollar.',
    faqs: [
      { q: 'Will a tradeline fix everything?', a: 'No. It is one lever in a broader file strategy.' },
      { q: 'Are you selling tradelines on this page?', a: 'This page is education. Partner paths are optional and disclosed.' },
      { q: 'Is this legal?', a: 'The guide is educational. Follow issuer terms and applicable law.' },
    ],
  }),

  score_roadmap: profile({
    accent: 'emerald',
    heroProof: [
      'A 700+ sequence that respects how FICO actually weights a file',
      'Utilization-first discipline you can run this week',
      'A dispute-priority worksheet inside the download',
    ],
    problemTitle: 'Score movement is sequenced. This roadmap tells you what to do first.',
    problemBody:
      'Most do-it-yourself restorers dispute everything at once and then wonder why the score barely moves. This guide orders utilization, mix, age, and disputes so each action has a reason — and so partners stop treating Credit Karma as a strategy.',
    painPoints: [
      'High utilization hides behind “I pay on time.”',
      'Low-impact items get disputed while heavier items stay put.',
      'There is no monthly rhythm — only late-night score checks.',
      'New cards get applied for before the file is ready.',
    ],
    chapters: [
      {
        title: 'Utilization wins',
        bullets: ['AZEO concepts', 'Statement-date strategy', 'Per-card versus aggregate'],
      },
      {
        title: 'Mix and age',
        bullets: ['When to add an installment', 'Authorized-user timing', 'Closed-account impact'],
      },
      {
        title: 'Dispute priorities',
        bullets: ['An impact scoring matrix', 'Evidence-first items', 'Noise you can ignore'],
      },
      {
        title: 'Monthly cadence',
        bullets: ['A week-by-week rhythm', 'Portal tracking', 'Specialist review'],
      },
    ],
    tracks: [
      {
        id: 'util',
        label: 'Utilization',
        promise: 'Use the fastest lever on many revolving-heavy files.',
        bestFor: 'Partners carrying high balances on cards.',
        plan: ['Map the paydown', 'Align statement dates', 'Trial AZEO'],
      },
      {
        id: 'dispute',
        label: 'Disputes',
        promise: 'Challenge negatives that can actually move a score.',
        bestFor: 'Errors, duplicates, and unsupported items.',
        plan: ['Fill the priority sheet', 'Time the letters', 'Log the responses'],
      },
      {
        id: 'mix',
        label: 'Mix',
        promise: 'Add depth without inquiry chaos.',
        bestFor: 'Thin files and young credit age.',
        plan: ['Fit the product', 'Space the applications', 'Graduate the mix'],
      },
      {
        id: '700',
        label: '700+ path',
        promise: 'Follow a twelve-week sequence template.',
        bestFor: 'Motivated restorers with a goal date.',
        plan: ['Set milestones', 'Keep the check-ins', 'Add an advisor if you want a review'],
      },
    ],
    timeline: [
      { step: 'Week 1', detail: 'Run a utilization sweep and map statement dates.' },
      { step: 'Week 2–4', detail: 'Work only the top three dispute priorities.' },
      { step: 'Month 2', detail: 'Add mix or age levers once utilization is stable.' },
      { step: 'Month 3+', detail: 'Review funding or card readiness.' },
    ],
    bonusTools: [
      { title: 'Dispute priority worksheet', desc: 'Score impact versus effort — pick the fights that matter.' },
      { title: 'Utilization calendar', desc: 'Align payments with reporting dates.' },
      { title: '700+ milestone tracker', desc: 'Weekly checkpoints a busy partner can actually hit.' },
    ],
    portalHighlights: SHARED_PORTAL,
    captureHeadline: 'Download your score roadmap',
    captureSub: `PDF, worksheets, and a portal preview. ${ONE_COMPLIANCE}`,
    successHeadline: 'Your score roadmap is ready',
    formStepTitle: 'Get the five-step roadmap',
    formStepSub: 'Morgan can personalize priorities after you download.',
    faqs: [
      { q: 'How fast will my score rise?', a: 'No one can promise a jump. Sequencing is more honest than random disputes.' },
      { q: 'Do I need the portal?', a: 'The PDF stands alone. The portal preview helps you execute the same plan.' },
      { q: 'Is this the dispute letter guide?', a: 'No. This kit sequences the score. The dispute letter guide is a separate download.' },
    ],
  }),

  agency: profile({
    accent: 'fuchsia',
    heroProof: [
      'A white-label partner operating-system overview',
      'A compliance-safe promo copy pack',
      'A thirty-day agency onboarding playbook',
    ],
    problemTitle: 'Agencies scale on systems. This guide installs the operating rhythm.',
    problemBody:
      'If restore or funding partners still live in group chats and spreadsheets, one busy month becomes chaos. This kit shows how a partner-grade operating system, compliance workflows, and disciplined onboarding unlock volume without burning the team.',
    painPoints: [
      'Partners slip between sales and fulfillment.',
      'Promo copy invites compliance complaints.',
      'Every new partner file is custom chaos.',
      'Revenue stalls because operations cannot take more volume.',
    ],
    chapters: [
      {
        title: 'Partner operating-system map',
        bullets: ['Restore and funding lanes', 'Partner portals', 'Task automation'],
      },
      {
        title: 'Compliance promo',
        bullets: ['Safe headlines', 'Disclosure patterns', 'Social templates'],
      },
      {
        title: 'Thirty-day onboarding',
        bullets: ['Sales-to-fulfillment handoff', 'Document collection', 'Expectation setting'],
      },
      {
        title: 'Revenue lanes',
        bullets: ['Do-it-yourself versus done-for-you', 'Tradelines', 'Funding referrals'],
      },
    ],
    tracks: [
      {
        id: 'solo',
        label: 'Solo to team',
        promise: 'Make the first hire without breaking delivery.',
        bestFor: 'One-to-three-person shops.',
        plan: ['Start the SOP', 'Split the roles', 'Add a quality pass'],
      },
      {
        id: 'wl',
        label: 'White-label',
        promise: 'Brand the operating system without building software.',
        bestFor: 'Marketing-heavy agencies.',
        plan: ['Skin the portal', 'Set partner communications', 'Open billing lanes'],
      },
      {
        id: 'compliance',
        label: 'Compliance',
        promise: 'Sell with energy and stay inside the rules.',
        bestFor: 'Affiliates and paid-media operators.',
        plan: ['Use the copy pack', 'Set a review cadence', 'Keep a complaint playbook'],
      },
      {
        id: 'scale',
        label: 'Scale',
        promise: 'Match capacity tiers to the volume you can actually serve.',
        bestFor: 'Agencies with fifty or more active partners.',
        plan: ['Define partner tiers', 'Route overflow', 'Recruit specialists'],
      },
    ],
    timeline: [
      { step: 'Day 1–7', detail: 'Audit the current partner journey.' },
      { step: 'Week 2', detail: 'Deploy the onboarding checklist.' },
      { step: 'Week 3–4', detail: 'Swap promo copy to the compliance pack.' },
      { step: 'Month 2+', detail: 'Start the partner operating-system trial and book an advisor call.' },
    ],
    bonusTools: [
      { title: 'Partner onboarding checklist', desc: 'Thirty days from first touch to fulfilled work.' },
      { title: 'Compliance promo swipe file', desc: 'Headlines and calls to action that stay inside the rules.' },
      { title: 'Capacity tier worksheet', desc: 'Know when to recruit specialists or agency partners.' },
    ],
    portalHighlights: [
      'A multi-partner dashboard preview',
      'White-label partner portals',
      'Letter operations and task automation',
      'An agency advisor activation call',
    ],
    captureHeadline: 'Download the agency growth kit',
    captureSub: `White-label overview, onboarding, and compliance copy. ${ONE_COMPLIANCE}`,
    successHeadline: 'Your agency kit is ready',
    formStepTitle: 'Unlock the agency playbook',
    formStepSub: 'Riley will map white-label fit on your advisor call.',
    faqs: [
      { q: 'Is this a franchise?', a: 'No. This is partner education. You operate your brand under program terms.' },
      { q: 'Do you guarantee partner results?', a: 'No. We provide systems. Outcomes depend on execution and file facts. Lawsuit and score outcomes are never guaranteed.' },
      { q: 'Can I see the software first?', a: 'Yes. A portal preview is included with signup.' },
    ],
  }),

  credit_specialist_guide: profile({
    accent: 'amber',
    heroProof: [
      'A seven-page in-app playbook you can open today',
      'Personal and business credit lanes in one guide',
      'A clear join path after you finish the reading',
    ],
    problemTitle: 'Specialists need craft, a lane, and a door that is not a job posting.',
    problemBody:
      'This playbook teaches personal credit, business credit, and debt-pressure education — then routes serious operators into the Credit Specialist join flow. You learn first. You bring partners when you are ready. Nothing here is an employment offer.',
    painPoints: [
      'YouTube tips with no partner-safe sequence.',
      'Business credit sold as magic with no fundability hygiene.',
      'Debt panic without a documentation habit.',
      'No clear path from learning to bringing partners onto the platform.',
    ],
    chapters: [
      {
        title: 'Personal credit craft',
        bullets: ['Factual findings', 'Utilization and mix', 'A partner coaching cadence'],
      },
      {
        title: 'Business credit',
        bullets: ['Entity hygiene', 'Vendor sequencing', 'Capital-pack readiness'],
      },
      {
        title: 'Debt and court insight',
        bullets: ['Validation first', 'Summons education', 'Not legal advice'],
      },
      {
        title: 'Specialist opportunity',
        bullets: ['The three-lead gate', 'A thirty-day free-leads window', 'Revenue-share tiers'],
      },
    ],
    tracks: [
      {
        id: 'learn',
        label: 'Learn first',
        promise: 'Open the in-app guide before you pitch anyone.',
        bestFor: 'New specialists.',
        plan: ['Claim the guide', 'Read the pages', 'Join when you are ready'],
      },
      {
        id: 'recruit',
        label: 'Recruit now',
        promise: 'Commit to three leads in thirty days.',
        bestFor: 'Operators who already have a network.',
        plan: ['Join', 'Use promo links', 'Bring partners'],
      },
      {
        id: 'debt',
        label: 'Debt lane',
        promise: 'Teach validation-first pressure response.',
        bestFor: 'Collections-heavy markets.',
        plan: ['Read the guide pages', 'Use Letter Studio', 'Stay inside compliance'],
      },
      {
        id: 'business',
        label: 'Business lane',
        promise: 'Teach fundability before capital asks.',
        bestFor: 'Entrepreneur niches.',
        plan: ['Entity hygiene', 'Vendor ladder', 'Underwriting optics'],
      },
    ],
    timeline: [
      { step: 'Capture', detail: 'Unlock the in-app playbook.' },
      { step: 'Read', detail: 'Open pages from the preview.' },
      { step: 'Join', detail: 'Make the three-lead commitment and choose a tier.' },
      { step: 'Activate', detail: 'Open the Specialist Hub and bring partners.' },
    ],
    bonusTools: [
      { title: 'In-app page reader', desc: 'Click the book preview. No PDF required.' },
      { title: 'Join commitment checklist', desc: 'Three leads and a thirty-day free-leads window — clear on day one.' },
      { title: 'Pricing hub', desc: 'Foundation through Certified Partner revenue-share tiers.' },
    ],
    portalHighlights: [
      'Specialist Hub after signup',
      'Promo links for partner funnels',
      'Letters and CRM for the partners you bring',
      'A partnership line for activation',
    ],
    captureHeadline: 'Unlock the Credit Specialist playbook',
    captureSub: `In-app guide and specialist nurture. Not an employment offer. ${ONE_COMPLIANCE}`,
    successHeadline: 'Playbook unlocked — open the guide',
    formStepTitle: 'Get the specialist playbook',
    formStepSub: 'The in-app reader opens instantly. Join with your three-lead commitment when you are ready.',
    faqs: [
      { q: 'Is this a job offer?', a: 'No. It is a partnership program with a three-lead minimum to unlock full system access.' },
      { q: 'Is court content legal advice?', a: 'No. It is education. Licensed counsel handles court matters.' },
      { q: 'What are free leads?', a: 'You keep partners you bring during the thirty-day window using Finely capture tools.' },
    ],
  }),

  specialist_apply: profile({
    accent: 'sky',
    heroProof: [
      'An AI dispute-workflow primer',
      'A partner activation checklist',
      'A specialist portal preview',
    ],
    problemTitle: 'Specialists win when the workflow is boring — in the best way.',
    problemBody:
      'The Finely specialist network is for operators who want tools, training, and partner-operating-system access. This application kit shows the activation path before you commit time, so the first live file is not a guessing game.',
    painPoints: [
      'Dispute operations learned from random video clips.',
      'No evidence-vault discipline when a partner asks what happened.',
      'An unclear path from interest to the first paid partner.',
      'Early compliance mistakes that stain a reputation.',
    ],
    chapters: [
      {
        title: 'Workflow training',
        bullets: ['Factual findings', 'Evidence vault', 'Letter operations'],
      },
      {
        title: 'AI assist primer',
        bullets: ['Draft review gates', 'Partner communications', 'Task templates'],
      },
      {
        title: 'Activation path',
        bullets: ['Application, review, onboarding', 'First partner milestones', 'Support channels'],
      },
      {
        title: 'Compliance',
        bullets: ['Educational positioning', 'Prohibited claims', 'Partner expectation scripts'],
      },
    ],
    tracks: [
      {
        id: 'new',
        label: 'New specialist',
        promise: 'Move from zero to a first workflow in fourteen days.',
        bestFor: 'Career switchers.',
        plan: ['Climb the training ladder', 'Shadow tasks', 'Pass a quality review'],
      },
      {
        id: 'experienced',
        label: 'Experienced',
        promise: 'Port your partners into operating-system lanes.',
        bestFor: 'Existing repair operators.',
        plan: ['Import the playbook', 'Set up the portal', 'Take the activation call'],
      },
      {
        id: 'ai',
        label: 'AI workflows',
        promise: 'Use AI without sloppy letters.',
        bestFor: 'Tech-comfortable operators.',
        plan: ['Use prompt guardrails', 'Keep review gates', 'Leave an audit trail'],
      },
      {
        id: 'growth',
        label: 'Growth',
        promise: 'Acquire partners after activation.',
        bestFor: 'Operators ready for volume.',
        plan: ['Open referral lanes', 'Set capacity tiers', 'Hand off to marketing'],
      },
    ],
    timeline: [
      { step: 'Apply', detail: 'Submit the application and download the toolkit.' },
      { step: 'Review', detail: 'An activation specialist screens fit.' },
      { step: 'Onboard', detail: 'Open the portal and complete workflow training.' },
      { step: 'Activate', detail: 'Take the first partner under supervision.' },
    ],
    bonusTools: [
      { title: 'Dispute evidence vault template', desc: 'A folder structure partners can follow without debate.' },
      { title: 'Partner expectation script', desc: 'Set timelines without over-promising.' },
      { title: 'Activation checklist', desc: 'Every box before you take live files.' },
    ],
    portalHighlights: [
      'A specialist partner-operating-system preview',
      'Dispute and letter workflow boards',
      'AI-assisted draft review',
      'An activation specialist call',
    ],
    captureHeadline: 'Apply and preview the specialist toolkit',
    captureSub: `The application is not a job offer. ${ONE_COMPLIANCE}`,
    successHeadline: 'Application received — toolkit unlocked',
    formStepTitle: 'Start your specialist application',
    formStepSub: 'Alex from partner activation will follow up after review.',
    faqs: [
      { q: 'Is this employment?', a: 'No. This is an independent specialist path, not a W-2 job offer.' },
      { q: 'Do I need experience?', a: 'It helps. It is not required. A training ladder is included.' },
      { q: 'What does it cost?', a: 'The kit is free. Partner program terms apply after activation.' },
    ],
  }),

  affiliate: profile({
    accent: 'amber',
    heroProof: [
      'QR codes and referral links that actually attribute',
      'A compliant social copy pack',
      'A referral dashboard preview',
    ],
    problemTitle: 'Referrals compound when the link is clean and the copy is legal.',
    problemBody:
      'Affiliates lose money on broken links, vague campaign tags, and promo copy platforms reject. This toolkit installs the unglamorous infrastructure that makes referrals countable — and keeps the language inside the rules.',
    painPoints: [
      'Shares do not track, so payouts disappear.',
      'Copy reads like a promise the program cannot make.',
      'There is no map of which funnel fits which guest.',
      'Reporting is still a folder of screenshots.',
    ],
    chapters: [
      {
        title: 'Referral mechanics',
        bullets: ['Links', 'QR codes', 'Attribution windows'],
      },
      {
        title: 'Compliant copy',
        bullets: ['Social posts', 'Email intros', 'Story scripts'],
      },
      {
        title: 'Funnel routing',
        bullets: ['Restore versus debt versus funding', 'Geo tags', 'Campaign-tag hygiene'],
      },
      {
        title: 'Dashboard preview',
        bullets: ['Clicks', 'Signups', 'Payout states'],
      },
    ],
    tracks: [
      {
        id: 'creator',
        label: 'Creators',
        promise: 'Publish content that converts without getting banned.',
        bestFor: 'TikTok, Instagram, and YouTube.',
        plan: ['Use the hook pack', 'Keep disclosure lines', 'Put the link in the bio'],
      },
      {
        id: 'community',
        label: 'Community',
        promise: 'Serve groups without spamming them.',
        bestFor: 'Facebook groups and forums.',
        plan: ['Lead with value', 'Use the direct-message scripts', 'Hold office hours'],
      },
      {
        id: 'b2b',
        label: 'Business intros',
        promise: 'Make warm intros to agency partners.',
        bestFor: 'Consultants and coaches.',
        plan: ['Send the intro email', 'Map the partner lane', 'Learn the revenue-share basics'],
      },
      {
        id: 'local',
        label: 'Local geo',
        promise: 'Use city-specific angles that still sound human.',
        bestFor: 'Hyperlocal marketers.',
        plan: ['Use city landing links', 'Print event flyers', 'Set QR table cards'],
      },
    ],
    timeline: [
      { step: 'Hour 1', detail: 'Generate the link and QR code.' },
      { step: 'Day 1', detail: 'Post a compliant story from the swipe file.' },
      { step: 'Week 1', detail: 'Route traffic to the best-fit funnel.' },
      { step: 'Week 2+', detail: 'Review the dashboard and double down on winners.' },
    ],
    bonusTools: [
      { title: 'QR print sheet', desc: 'Table-tent and flyer layouts for local events.' },
      { title: 'Campaign-tag builder', desc: 'Tags that actually parse in reporting.' },
      { title: 'Funnel picker', desc: 'Which destination to send for debt, business, or restore.' },
    ],
    portalHighlights: [
      'A referral dashboard preview',
      'Payout status tracking',
      'A compliant asset library',
      'Affiliate success specialist chat',
    ],
    captureHeadline: 'Download the affiliate toolkit',
    captureSub: `Links, QR codes, and copy. No income promises. ${ONE_COMPLIANCE}`,
    successHeadline: 'Your affiliate toolkit is ready',
    formStepTitle: 'Unlock referral tools',
    formStepSub: 'Jamie will help you wire the first compliant campaign.',
    faqs: [
      { q: 'Are earnings guaranteed?', a: 'No. Payouts depend on referred activity and program terms.' },
      { q: 'Can I run paid ads?', a: 'Yes, with compliant copy and no deceptive claims.' },
      { q: 'How do I get paid?', a: 'The dashboard preview shows payout states. Full terms live in the partner agreement.' },
    ],
  }),
  kreyol: profile({
    accent: 'emerald',
    heroProof: ['Credit help for Haitian Americans', 'Pale Kreyòl', 'Four credit kits you can open today'],
    problemTitle: 'Credit, letters, and collectors — one clear next step for Haitian families.',
    problemBody:
      'Finely Cred helps Haitian Americans read a U.S. credit file, understand a collector letter, and choose a next step. Speak Kreyòl. Open a credit kit. Book a session when you are ready.',
    painPoints: [
      'An Equifax letter you cannot read clearly.',
      'A child or specialist trying to help Manman on the phone.',
      'Too many pages and no obvious next button.',
      'Institutions that feel cold when you need a respectful voice.',
    ],
    chapters: [
      { title: 'What is credit?', bullets: ['The SSN file', 'Three bureaus', 'One next step'] },
      { title: 'What this letter says', bullets: ['Collectors', 'Bureaus', 'What they are asking'] },
      { title: 'For the person helping', bullets: ['Sit together', 'One step', 'No score promises'] },
      { title: 'Church and community flyer', bullets: ['A large QR', 'Pale Kreyòl', 'Book a session'] },
    ],
    tracks: [
      {
        id: 'self',
        label: 'For you',
        promise: 'Understand the letter, then tap one button.',
        bestFor: 'Kreyòl-first guests on a phone.',
        plan: ['Listen', 'Read the words', 'Take one step'],
      },
      {
        id: 'helper',
        label: 'For the helper',
        promise: 'Sit down. Listen. Complete one step.',
        bestFor: 'Family members and specialists.',
        plan: ['Open Haitian community', 'Pale Kreyòl', 'Take one step'],
      },
      {
        id: 'church',
        label: 'Church and community',
        promise: 'One flyer. One QR code.',
        bestFor: 'Event tables.',
        plan: ['Print', 'Scan', 'Speak'],
      },
      {
        id: 'specialist',
        label: 'Specialist',
        promise: 'Serve the community with the kits and the Credit Specialist path.',
        bestFor: 'Credit specialists.',
        plan: ['Open kit three', 'Visit Credit Specialist', 'Book a session'],
      },
    ],
    timeline: [
      { step: 'Now', detail: 'Download the four flyer sheets.' },
      { step: 'Today', detail: 'Open Haitian community and Pale Kreyòl.' },
      { step: 'Next', detail: 'Choose restore or debt — one button.' },
      { step: 'When ready', detail: 'Open a partner account or book a session.' },
    ],
    bonusTools: [
      { title: 'Pale Kreyòl', desc: 'Chat with the Haitian community team.' },
      { title: 'Listen', desc: 'Hear the message — do not only read it.' },
      { title: 'QR flyer', desc: 'One page. One QR code. Pale Kreyòl.' },
    ],
    portalHighlights: [
      'Haitian community — credit, letters, collectors',
      'Six Haitian guides',
      'Four credit kits to download',
      'One clear next step',
    ],
    captureHeadline: 'Get the credit kits',
    captureSub: `Four flyers: credit, letters, helping family, and a church sheet. ${ONE_COMPLIANCE}`,
    successHeadline: 'Your credit kits are ready',
    formStepTitle: 'Send the four flyers',
    formStepSub: 'Marie-Claire and the Haitian community team can speak with you after you download.',
    faqs: [
      { q: 'What do I receive?', a: 'Four credit kits: what credit is, what the letter says, how to help someone, and a church flyer.' },
      { q: 'Is this legal advice?', a: 'No. This is education and a workflow. Results vary.' },
      { q: 'Where can I speak Kreyòl?', a: 'Open Haitian community and tap Pale Kreyòl.' },
    ],
  }),
};

export function getLeadMagnetPremiumProfile(config: LeadMagnetFunnelConfig): LeadMagnetPremiumProfile | null {
  if (config.id === 'credit') return null;
  return LEAD_MAGNET_PREMIUM_PROFILES[config.id] ?? null;
}
