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
  'Upload reports and preview the real partner portal',
  'Task board + document vault for your lane',
  'AI-assisted checklists (trial features lock after preview)',
  'Specialist follow-up when you want hands-on help',
];

function profile(
  partial: Omit<LeadMagnetPremiumProfile, 'comparison' | 'faqs'> & {
    comparison?: PremiumMagnetComparisonRow[];
    faqs?: PremiumMagnetFaq[];
  },
): LeadMagnetPremiumProfile {
  return {
    comparison: partial.comparison ?? [
      { label: 'Structured playbook', diy: 'Random blogs', guide: 'Step-by-step PDF', finely: 'PDF + live portal' },
      { label: 'Tracking', diy: 'Spreadsheets', guide: 'Printable checklists', finely: 'CRM-grade task board' },
      { label: 'Compliance', diy: 'Guesswork', guide: 'Educational guardrails', finely: 'Built-in compliance copy' },
      { label: 'Support', diy: 'None', guide: 'Email follow-up', finely: 'Assigned specialist lane' },
    ],
    faqs: partial.faqs ?? [],
    ...partial,
  };
}

export const LEAD_MAGNET_PREMIUM_PROFILES: Record<string, LeadMagnetPremiumProfile> = {
  debt: profile({
    accent: 'sky',
    heroProof: ['FDCPA-aware validation workflows', 'Summons-first checklist if court papers arrived', 'Free portal preview — no card'],
    problemTitle: 'Collectors move fast. Your paperwork should move faster.',
    problemBody:
      'Most people freeze when collections hit — not because they lack willpower, but because they lack a sequence. This kit gives you the order of operations: validate, document, respond, escalate.',
    painPoints: [
      'Calls that never stop because nothing is in writing',
      'Accounts re-aging or showing balances you cannot verify',
      'Court papers with a deadline you are afraid to open',
      'No single place to store letters, proofs, and timelines',
    ],
    chapters: [
      { title: 'Validation vs verification', bullets: ['FDCPA 809(b) angles', 'What to request in writing', 'How to log responses'] },
      { title: 'Collector call control', bullets: ['Script card for live calls', 'Cease-contact workflow', 'Evidence logging'] },
      { title: 'Summons response', bullets: ['First 72-hour checklist', 'What not to ignore', 'When to seek licensed counsel'] },
      { title: 'Portal debt lane', bullets: ['Task board for debt items', 'Document vault', 'Specialist handoff option'] },
    ],
    tracks: [
      { id: 'validation', label: 'Validation', promise: 'Force collectors to prove what they claim.', bestFor: 'Unknown debts, wrong balances, duplicate placements.', plan: ['Written request', '30-day log', 'Next-step branch'] },
      { id: 'harassment', label: 'Harassment', promise: 'Document pattern + lawful pushback.', bestFor: 'Excessive calls, wrong-party contacts.', plan: ['Call log template', 'Cease letter', 'CFPB path'] },
      { id: 'summons', label: 'Summons', promise: 'Stop panic — start a deadline plan.', bestFor: 'Court papers received.', plan: ['Answer checklist', 'Evidence gather', 'Counsel referral gate'] },
      { id: 'settlement', label: 'Settlement prep', promise: 'Negotiate from strength, not fear.', bestFor: 'Verified debts you intend to resolve.', plan: ['Verify first', 'Offer ladder', 'Paper trail'] },
    ],
    timeline: [
      { step: 'Day 1', detail: 'Download kit + log every open collection account' },
      { step: 'Day 2–3', detail: 'Send validation requests for unverified items' },
      { step: 'Week 2', detail: 'Review responses — escalate factual disputes' },
      { step: 'Week 4+', detail: 'Stabilize + optional strategist session' },
    ],
    bonusTools: [
      { title: 'Call script wallet card', desc: 'Pocket phrases that keep you in control on live collector calls.' },
      { title: 'Response tracker', desc: 'Dates, methods, and outcomes for every collector contact.' },
      { title: 'Summons red-flag scanner', desc: 'Quick triage if court paperwork landed in your mailbox.' },
    ],
    portalHighlights: SHARED_PORTAL,
    captureHeadline: 'Get the debt validation playbook',
    captureSub: 'PDF + call scripts + portal preview. Educational only — not legal advice.',
    successHeadline: 'Your debt playbook is ready',
    formStepTitle: 'Unlock the validation kit',
    formStepSub: 'Instant PDF. Casey, your debt strategist, can review your next step after download.',
    faqs: [
      { q: 'Is this legal advice?', a: 'No — educational templates and workflows. Licensed counsel for court matters.' },
      { q: 'Will this stop collectors immediately?', a: 'Lawful written requests and documentation change the conversation — outcomes vary.' },
      { q: 'What if I got sued?', a: 'Use the summons checklist first, then consult an attorney in your state.' },
    ],
  }),

  business: profile({
    accent: 'amber',
    heroProof: ['Entity hygiene before applications', 'Vendor credit ladder map', 'Funding-readiness advisor session'],
    problemTitle: 'Funders do not fund chaos. They fund files that look real.',
    problemBody:
      'Business credit fails when the foundation is messy — mismatched addresses, thin vendor depth, inquiry sprawl. This jumpstart aligns your entity story before you apply.',
    painPoints: [
      'Personal guarantees because the business file is thin',
      'Denied vendor accounts with no reporting path',
      'Inquiry spikes from random application sprees',
      'No system tracking vendor limits and reporting dates',
    ],
    chapters: [
      { title: 'Entity hygiene', bullets: ['Secretary of state alignment', 'EIN + address consistency', 'Digital footprint audit'] },
      { title: 'D-U-N-S + bureaus', bullets: ['Registration checklist', 'Profile completeness', 'Monitoring cadence'] },
      { title: 'Vendor ladder', bullets: ['Starter net-30 sequence', 'Reporting vendors', 'Limit growth pacing'] },
      { title: 'Funding readiness', bullets: ['Underwriting signals', 'Document pack', 'Advisor call prep'] },
    ],
    tracks: [
      { id: 'entity', label: 'Entity', promise: 'Look legitimate on paper and online.', bestFor: 'New LLCs, sole props upgrading.', plan: ['SOS filing check', 'Address sync', 'Website + email domain'] },
      { id: 'vendor', label: 'Vendor credit', promise: 'Depth before big-bank apps.', bestFor: 'Thin profiles, first net-30s.', plan: ['Tier-1 vendors', 'Payment discipline', 'Reporting verify'] },
      { id: 'funding', label: 'Funding path', promise: 'Sequence capital asks intelligently.', bestFor: 'Ready for LOC / term review.', plan: ['File review', 'Inquiry budget', 'Advisor session'] },
      { id: 'ops', label: 'Ops stack', promise: 'Run business credit like a system.', bestFor: 'Agencies managing multiple entities.', plan: ['Portal lanes', 'Task cadence', 'Partner OS preview'] },
    ],
    timeline: [
      { step: 'Week 1', detail: 'Entity hygiene + D-U-N-S checklist' },
      { step: 'Week 2–4', detail: 'First reporting vendor accounts' },
      { step: 'Day 45+', detail: 'Review limits + plan first funding conversation' },
      { step: 'Ongoing', detail: 'Track vendors and inquiries in portal preview' },
    ],
    bonusTools: [
      { title: 'Vendor sequencing map', desc: 'Which accounts to open in which order — and which to skip.' },
      { title: 'Inquiry budget worksheet', desc: 'Cap pulls before they cap you.' },
      { title: 'Funding readiness scorecard', desc: 'Self-audit before talking to an advisor.' },
    ],
    portalHighlights: SHARED_PORTAL,
    captureHeadline: 'Download the business credit jumpstart',
    captureSub: 'Entity checklist + vendor map + portal preview.',
    successHeadline: 'Your business credit kit is ready',
    formStepTitle: 'Claim your jumpstart kit',
    formStepSub: 'Morgan, your funding strategist, can map your entity lane after download.',
    faqs: [
      { q: 'Will this guarantee funding?', a: 'No — education and sequencing only. Underwriting decides outcomes.' },
      { q: 'Do I need an LLC?', a: 'The guide covers entity options — consistency matters more than hype.' },
      { q: 'Is personal credit involved?', a: 'Often yes early — we show how to separate paths over time.' },
    ],
  }),

  tradeline: profile({
    accent: 'violet',
    heroProof: ['AU vs primary explained plainly', 'Timing + inquiry discipline', 'Risk-aware education — no hype'],
    problemTitle: 'Tradelines are tools — not magic beans.',
    problemBody:
      'People buy tradelines blind and wonder why underwriters still say no. This insider kit explains what reports, what underwriters see, and how tradelines fit a broader restore plan.',
    painPoints: [
      'Paying for AU slots that do not match your file goals',
      'Inquiry damage from application sprees after a boost',
      'No plan for what happens after the tradeline posts',
      'Confusing marketing that promises impossible jumps',
    ],
    chapters: [
      { title: 'Primary vs authorized user', bullets: ['Reporting differences', 'Underwriter view', 'When AU helps vs hurts'] },
      { title: 'Timing science', bullets: ['Statement dates', 'Utilization windows', 'Application spacing'] },
      { title: 'Risk framing', bullets: ['Compliance-safe language', 'Alternatives to buying', 'Partner pathways'] },
      { title: 'Execution board', bullets: ['Portal preview tasks', 'Document checklist', 'Advisor follow-up'] },
    ],
    tracks: [
      { id: 'au', label: 'Authorized user', promise: 'Know what AU can and cannot do.', bestFor: 'Thin files, age gaps.', plan: ['Match account type', 'Utilization guard', 'Removal plan'] },
      { id: 'primary', label: 'Primary tradelines', promise: 'Understand real reporting depth.', bestFor: 'Building long-term file strength.', plan: ['Product fit', 'Payment history', 'Graduation path'] },
      { id: 'inquiry', label: 'Inquiry control', promise: 'Stop sabotaging gains with pulls.', bestFor: 'Pre-mortgage, pre-funding clients.', plan: ['Freeze strategy', 'App batching', 'Monitoring'] },
      { id: 'plan', label: 'Full restore plan', promise: 'Tradelines as one lever — not the whole engine.', bestFor: 'Serious rebuilds.', plan: ['Dispute lane', 'Utilization', 'Tradeline timing'] },
    ],
    timeline: [
      { step: 'Read', detail: 'AU vs primary — pick your lane' },
      { step: 'Plan', detail: 'Set inquiry budget + target posting window' },
      { step: 'Execute', detail: 'Track in portal preview' },
      { step: 'Review', detail: 'Advisor session for fit check' },
    ],
    bonusTools: [
      { title: 'Tradeline fit matrix', desc: 'Match account types to your current file weaknesses.' },
      { title: 'Inquiry spacing calendar', desc: 'When to apply — and when to wait.' },
      { title: 'Underwriter reality check', desc: 'What funders actually scrutinize beyond score.' },
    ],
    portalHighlights: SHARED_PORTAL,
    captureHeadline: 'Get the tradeline insider kit',
    captureSub: 'Education-first — no outcome guarantees.',
    successHeadline: 'Your tradeline kit is ready',
    formStepTitle: 'Unlock the insider guide',
    formStepSub: 'Riley will help you sanity-check timing before you spend a dollar.',
    faqs: [
      { q: 'Will a tradeline fix everything?', a: 'No — it is one lever in a broader file strategy.' },
      { q: 'Are you selling tradelines here?', a: 'This is education; partner paths are optional and disclosed.' },
      { q: 'Is this legal?', a: 'Educational content — always follow issuer terms and applicable law.' },
    ],
  }),

  score_roadmap: profile({
    accent: 'emerald',
    heroProof: ['700+ sequencing that respects FICO mechanics', 'Utilization-first discipline', 'Dispute priority worksheet included'],
    problemTitle: 'Score jumps are not random — they are sequenced.',
    problemBody:
      'Most DIY restorers dispute everything at once and wonder why the score barely moves. This roadmap orders utilization, mix, age, and disputes so each action has a reason.',
    painPoints: [
      'High utilization hiding behind “I pay on time”',
      'Disputing low-impact items while killers remain',
      'No monthly rhythm — just anxiety scrolling Credit Karma',
      'Applying for cards before the file is ready',
    ],
    chapters: [
      { title: 'Utilization wins', bullets: ['AZEO concepts', 'Statement date strategy', 'Per-card vs aggregate'] },
      { title: 'Mix + age', bullets: ['When to add installment', 'Authorized user timing', 'Closed account impact'] },
      { title: 'Dispute priorities', bullets: ['Impact scoring matrix', 'Evidence-first items', 'Noise to ignore'] },
      { title: 'Monthly cadence', bullets: ['Week-by-week rhythm', 'Portal tracking', 'Specialist review'] },
    ],
    tracks: [
      { id: 'util', label: 'Utilization', promise: 'Fastest lever for many profiles.', bestFor: 'Revolving-heavy files.', plan: ['Paydown map', 'Statement dates', 'AZEO trial'] },
      { id: 'dispute', label: 'Disputes', promise: 'Hit negatives that actually move scores.', bestFor: 'Errors, duplicates, unsupported items.', plan: ['Priority sheet', 'Letter timing', 'Response log'] },
      { id: 'mix', label: 'Mix', promise: 'Add depth without inquiry chaos.', bestFor: 'Thin files, young credit age.', plan: ['Product fit', 'Spacing', 'Graduation'] },
      { id: '700', label: '700+ path', promise: '12-week sequence template.', bestFor: 'Motivated restorers with a goal date.', plan: ['Milestones', 'Check-ins', 'Advisor option'] },
    ],
    timeline: [
      { step: 'Week 1', detail: 'Utilization sweep + statement map' },
      { step: 'Week 2–4', detail: 'Top 3 dispute priorities only' },
      { step: 'Month 2', detail: 'Mix/age levers if utilization stable' },
      { step: 'Month 3+', detail: 'Funding or card readiness review' },
    ],
    bonusTools: [
      { title: 'Dispute priority worksheet', desc: 'Score impact vs effort — pick fights that matter.' },
      { title: 'Utilization calendar', desc: 'Align payments with reporting dates.' },
      { title: '700+ milestone tracker', desc: 'Weekly checkpoints you can actually hit.' },
    ],
    portalHighlights: SHARED_PORTAL,
    captureHeadline: 'Download your score roadmap',
    captureSub: 'PDF + worksheets + portal preview.',
    successHeadline: 'Your score roadmap is ready',
    formStepTitle: 'Get the 5-step roadmap',
    formStepSub: 'Morgan can personalize priorities after you download.',
    faqs: [
      { q: 'How fast will my score rise?', a: 'No guarantees — sequencing improves odds vs random disputes.' },
      { q: 'Do I need the portal?', a: 'PDF stands alone; portal preview helps you execute.' },
      { q: 'Is this the dispute letter guide?', a: 'Different kit — focused on score sequencing; dispute guide is separate.' },
    ],
  }),

  agency: profile({
    accent: 'fuchsia',
    heroProof: ['White-label partner OS overview', 'Compliance-safe promo copy pack', 'Agency onboarding playbook'],
    problemTitle: 'Agencies scale on systems — not heroic burnout.',
    problemBody:
      'If you are running restore or funding clients from group chats and spreadsheets, you are one busy month from chaos. This kit shows how partner-grade OS, compliance workflows, and onboarding discipline unlock scale.',
    painPoints: [
      'Clients slip through cracks between sales and fulfillment',
      'Promo copy that risks compliance complaints',
      'No standard onboarding — every client is custom chaos',
      'Revenue stuck because ops cannot handle more volume',
    ],
    chapters: [
      { title: 'Partner OS map', bullets: ['Restore + funding lanes', 'Client portals', 'Task automation'] },
      { title: 'Compliance promo', bullets: ['Safe headlines', 'Disclosure patterns', 'Social templates'] },
      { title: 'Onboarding 30-day', bullets: ['Sales → fulfillment handoff', 'Document collection', 'Expectation setting'] },
      { title: 'Revenue lanes', bullets: ['DIY vs DFY', 'Tradelines', 'Funding referrals'] },
    ],
    tracks: [
      { id: 'solo', label: 'Solo → team', promise: 'First hire without breaking delivery.', bestFor: '1–3 person shops.', plan: ['SOP starter', 'Role split', 'QA pass'] },
      { id: 'wl', label: 'White-label', promise: 'Brand the OS without building tech.', bestFor: 'Marketing-heavy agencies.', plan: ['Portal skin', 'Client comms', 'Billing lanes'] },
      { id: 'compliance', label: 'Compliance', promise: 'Sell aggressively — safely.', bestFor: 'Affiliates + ad runners.', plan: ['Copy pack', 'Review cadence', 'Complaint playbooks'] },
      { id: 'scale', label: 'Scale', promise: 'Capacity tiers that match reality.', bestFor: '50+ active clients.', plan: ['Partner tiers', 'Overflow routing', 'Recruiting'] },
    ],
    timeline: [
      { step: 'Day 1–7', detail: 'Audit current client journey' },
      { step: 'Week 2', detail: 'Deploy onboarding checklist' },
      { step: 'Week 3–4', detail: 'Swap promo copy to compliance pack' },
      { step: 'Month 2+', detail: 'Partner OS trial + advisor call' },
    ],
    bonusTools: [
      { title: 'Client onboarding checklist', desc: '30-day first-touch to fulfilled.' },
      { title: 'Compliance promo swipe file', desc: 'Headlines and CTAs that do not get you flagged.' },
      { title: 'Capacity tier worksheet', desc: 'Know when to recruit specialists or partners.' },
    ],
    portalHighlights: [
      'Multi-client partner dashboard preview',
      'White-label client portals',
      'Letter ops + task automation',
      'Agency advisor activation call',
    ],
    captureHeadline: 'Get the agency growth kit',
    captureSub: 'White-label overview + onboarding + compliance copy.',
    successHeadline: 'Your agency kit is ready',
    formStepTitle: 'Unlock the agency playbook',
    formStepSub: 'Riley will map white-label fit on your advisor call.',
    faqs: [
      { q: 'Is this a franchise?', a: 'Partner education — you operate your brand under program terms.' },
      { q: 'Do you guarantee client results?', a: 'No — we provide systems; outcomes depend on execution and file facts.' },
      { q: 'Can I see the software first?', a: 'Yes — portal preview included with signup.' },
    ],
  }),

  specialist_apply: profile({
    accent: 'sky',
    heroProof: ['AI dispute workflow primer', 'Partner activation checklist', 'Specialist portal preview'],
    problemTitle: 'Specialists win when workflows are boring — in a good way.',
    problemBody:
      'The Finely specialist network is for operators who want tools, training, and partner OS access — not hype gigs. This application kit shows the activation path before you commit time.',
    painPoints: [
      'Learning dispute ops from random YouTube clips',
      'No evidence vault discipline — clients blame you',
      'Unclear path from “interested” to first paid partner',
      'Compliance mistakes that burn reputation early',
    ],
    chapters: [
      { title: 'Workflow training', bullets: ['Factual findings', 'Evidence vault', 'Letter ops'] },
      { title: 'AI assist primer', bullets: ['Draft review gates', 'Client comms', 'Task templates'] },
      { title: 'Activation path', bullets: ['Application → review → onboarding', 'First partner milestones', 'Support channels'] },
      { title: 'Compliance', bullets: ['Educational positioning', 'Prohibited claims', 'Client expectation scripts'] },
    ],
    tracks: [
      { id: 'new', label: 'New specialist', promise: 'Zero to first workflow in 14 days.', bestFor: 'Career switchers.', plan: ['Training ladder', 'Shadow tasks', 'QA review'] },
      { id: 'experienced', label: 'Experienced', promise: 'Port your clients into OS lanes.', bestFor: 'Existing repair operators.', plan: ['Import playbook', 'Portal setup', 'Activation call'] },
      { id: 'ai', label: 'AI workflows', promise: 'Use AI without sloppy letters.', bestFor: 'Tech-comfortable operators.', plan: ['Prompt guardrails', 'Review gates', 'Audit trail'] },
      { id: 'growth', label: 'Growth', promise: 'Partner acquisition after activation.', bestFor: 'Ready for volume.', plan: ['Referral lanes', 'Capacity tiers', 'CMO handoff'] },
    ],
    timeline: [
      { step: 'Apply', detail: 'Submit application + download toolkit' },
      { step: 'Review', detail: 'Activation specialist screens fit' },
      { step: 'Onboard', detail: 'Portal + workflow training' },
      { step: 'Activate', detail: 'First partner under supervision' },
    ],
    bonusTools: [
      { title: 'Dispute evidence vault template', desc: 'Folder structure clients cannot argue with.' },
      { title: 'Client expectation script', desc: 'Set timelines without over-promising.' },
      { title: 'Activation checklist', desc: 'Every box before you take live files.' },
    ],
    portalHighlights: [
      'Specialist partner OS preview',
      'Dispute + letter workflow boards',
      'AI-assisted draft review',
      'Activation specialist call',
    ],
    captureHeadline: 'Apply + preview the specialist toolkit',
    captureSub: 'Application is not a job offer — education + tools preview.',
    successHeadline: 'Application received — toolkit unlocked',
    formStepTitle: 'Start your specialist application',
    formStepSub: 'Alex from partner activation will follow up after review.',
    faqs: [
      { q: 'Is this employment?', a: 'Independent specialist / partner path — not a W-2 job offer.' },
      { q: 'Do I need experience?', a: 'Helpful but not required — training ladder included.' },
      { q: 'What does it cost?', a: 'Kit is free; partner program terms apply after activation.' },
    ],
  }),

  affiliate: profile({
    accent: 'amber',
    heroProof: ['QR + referral link setup', 'Compliant social copy pack', 'Referral dashboard preview'],
    problemTitle: 'Referrals work when attribution is clean and copy is compliant.',
    problemBody:
      'Affiliates lose money on broken links, vague UTMs, and promo copy that platforms reject. This toolkit installs the boring infrastructure that makes referrals compound.',
    painPoints: [
      'Shares that do not track — so payouts disappear',
      'Copy that sounds like a scam (because it broke compliance rules)',
      'No map of which funnel to send which lead type',
      'Manual screenshot “reporting” instead of a dashboard',
    ],
    chapters: [
      { title: 'Referral mechanics', bullets: ['Links', 'QR codes', 'Attribution windows'] },
      { title: 'Compliant copy', bullets: ['Social posts', 'Email intros', 'Story scripts'] },
      { title: 'Funnel routing', bullets: ['Restore vs debt vs funding', 'Geo tags', 'UTM hygiene'] },
      { title: 'Dashboard preview', bullets: ['Clicks', 'Signups', 'Payout states'] },
    ],
    tracks: [
      { id: 'creator', label: 'Creators', promise: 'Content that converts without bans.', bestFor: 'TikTok, IG, YouTube.', plan: ['Hook pack', 'Disclosure lines', 'Link in bio'] },
      { id: 'community', label: 'Community', promise: 'Serve groups without spamming.', bestFor: 'Facebook groups, forums.', plan: ['Value-first posts', 'DM scripts', 'Office hours'] },
      { id: 'b2b', label: 'B2B intros', promise: 'Warm intros to agency partners.', bestFor: 'Consultants, coaches.', plan: ['Intro email', 'Partner lane map', 'Rev share basics'] },
      { id: 'local', label: 'Local geo', promise: 'City-specific angles that feel human.', bestFor: 'Hyperlocal marketers.', plan: ['City landing links', 'Event flyers', 'QR table cards'] },
    ],
    timeline: [
      { step: 'Hour 1', detail: 'Generate link + QR' },
      { step: 'Day 1', detail: 'Post compliant story using swipe file' },
      { step: 'Week 1', detail: 'Route traffic to best-fit funnel' },
      { step: 'Week 2+', detail: 'Review dashboard + double down on winners' },
    ],
    bonusTools: [
      { title: 'QR print sheet', desc: 'Table tent + flyer layouts for local events.' },
      { title: 'UTM builder', desc: 'Campaign tags that actually parse in reporting.' },
      { title: 'Funnel picker', desc: 'Which URL to send for debt vs business vs restore.' },
    ],
    portalHighlights: [
      'Referral dashboard preview',
      'Payout status tracking',
      'Compliant asset library',
      'Affiliate success specialist chat',
    ],
    captureHeadline: 'Get the affiliate toolkit',
    captureSub: 'Links, QR, copy — no income guarantees.',
    successHeadline: 'Your affiliate toolkit is ready',
    formStepTitle: 'Unlock referral tools',
    formStepSub: 'Jamie will help you wire your first compliant campaign.',
    faqs: [
      { q: 'Are earnings guaranteed?', a: 'No — payouts depend on referred activity and program terms.' },
      { q: 'Can I run paid ads?', a: 'Yes with compliant copy — no deceptive claims.' },
      { q: 'How do I get paid?', a: 'Dashboard preview shows states; full terms in partner agreement.' },
    ],
  }),
};

export function getLeadMagnetPremiumProfile(config: LeadMagnetFunnelConfig): LeadMagnetPremiumProfile | null {
  if (config.id === 'credit') return null;
  return LEAD_MAGNET_PREMIUM_PROFILES[config.id] ?? null;
}
