import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';

export type FlyerProcessStep = { label: string; title: string };
export type FlyerMetric = { value: string; label: string };
export type FlyerAccessItem = { title: string; desc: string };
export type FlyerFoundation = { title: string; desc: string };

export type LeadMagnetFlyerContent = {
  powerLine: string;
  categoryLabel: string;
  taglineBar: string;
  benefitsTitle: string;
  processTitle: string;
  resultsTitle: string;
  accessTitle: string;
  foundationTitle: string;
  ctaBannerLine: string;
  ctaBannerSub: string;
  process: FlyerProcessStep[];
  metrics: FlyerMetric[];
  access: FlyerAccessItem[];
  foundation: FlyerFoundation[];
};

const FLYER: Record<string, LeadMagnetFlyerContent> = {
  debt: {
    powerLine: 'VALIDATE. DOCUMENT. DECIDE.',
    categoryLabel: 'DEBT VALIDATION GUIDE',
    taglineBar: 'A WRITTEN PLAN FOR COLLECTIONS — AND A CALMER NEXT STEP.',
    benefitsTitle: 'With this guide you can:',
    processTitle: 'The validation sequence',
    resultsTitle: 'What the kit gives you',
    accessTitle: 'What you unlock',
    foundationTitle: 'The foundation',
    ctaBannerLine: 'YOUR FILE. YOUR TIMELINE. YOUR NEXT LETTER.',
    ctaBannerSub: 'Download the playbook that puts proof before payment.',
    process: [
      { label: '01', title: 'Download the guide' },
      { label: '02', title: 'Send validation' },
      { label: '03', title: 'Log responses' },
      { label: '04', title: 'Escalate facts' },
      { label: '05', title: 'Stabilize the file' },
    ],
    metrics: [
      { value: '72hr', label: 'Summons checklist' },
      { value: 'FDCPA', label: 'Workflow guardrails' },
      { value: '$0', label: 'No card required' },
    ],
    access: [
      { title: 'Validation letters', desc: 'Written workflows that ask for proof before you pay.' },
      { title: 'Call scripts', desc: 'Stay in control on a live collector call.' },
      { title: 'Portal preview', desc: 'Track debt tasks the way a specialist would.' },
      { title: 'Strategist lane', desc: 'Specialist follow-up when you want a review.' },
    ],
    foundation: [
      { title: 'Paper-trail discipline', desc: 'Every contact logged and dated.' },
      { title: 'Educational only', desc: 'Results vary · not legal advice · funding subject to underwriting' },
      { title: 'Instant PDF', desc: 'Download in seconds after you unlock.' },
    ],
  },
  business: {
    powerLine: 'ALIGN. SEQUENCE. ASK.',
    categoryLabel: 'BUSINESS CREDIT JUMPSTART',
    taglineBar: 'ENTITY TRUTH FIRST. VENDOR DEPTH NEXT. CAPITAL AFTER THE FILE IS READY.',
    benefitsTitle: 'With this guide you can:',
    processTitle: 'The business credit sequence',
    resultsTitle: 'What the kit gives you',
    accessTitle: 'What you can access',
    foundationTitle: 'The sequencing advantage',
    ctaBannerLine: 'YOUR ENTITY. YOUR LIMITS. YOUR FUNDING CONVERSATION.',
    ctaBannerSub: 'Build the credibility funders can actually verify.',
    process: [
      { label: '01', title: 'Entity hygiene' },
      { label: '02', title: 'Bureau setup' },
      { label: '03', title: 'Vendor ladder' },
      { label: '04', title: 'Depth and limits' },
      { label: '05', title: 'Funding ready' },
    ],
    metrics: [
      { value: '45 days', label: 'Vendor sequence' },
      { value: 'Net-30', label: 'Reporting path' },
      { value: 'Advisor', label: 'Session included' },
    ],
    access: [
      { title: 'Vendor accounts', desc: 'A net-30 sequence designed to report.' },
      { title: 'Line-of-credit readiness', desc: 'File optics funders actually scrutinize.' },
      { title: 'Entity checklist', desc: 'Secretary of state, EIN, and address alignment.' },
      { title: 'Portal lane', desc: 'A business credit workspace preview.' },
    ],
    foundation: [
      { title: 'Predictable sequencing', desc: 'Apply in order — not in a weekend spree.' },
      { title: 'Bureau reporting', desc: 'Depth before the first big-bank application.' },
      { title: 'Inquiry discipline', desc: 'Protect the personal file and the business file.' },
    ],
  },
  tradeline: {
    powerLine: 'LEARN. TIME. PLACE.',
    categoryLabel: 'TRADELINE INSIDER KIT',
    taglineBar: 'SMART TIMING TODAY. A CLEANER FILE TOMORROW.',
    benefitsTitle: 'With this education you can:',
    processTitle: 'A disciplined tradeline process',
    resultsTitle: 'What changes',
    accessTitle: 'Inside the insider kit',
    foundationTitle: 'Before you spend a dollar',
    ctaBannerLine: 'KNOW THE TOOL. OWN THE PLAN.',
    ctaBannerSub: 'Tradelines are leverage. This guide teaches the fit before the purchase.',
    process: [
      { label: '01', title: 'Authorized user versus primary' },
      { label: '02', title: 'Match file gaps' },
      { label: '03', title: 'Time the post' },
      { label: '04', title: 'Control inquiries' },
      { label: '05', title: 'Review results' },
    ],
    metrics: [
      { value: 'Timing', label: 'Statement windows' },
      { value: 'Risk', label: 'Plain language' },
      { value: 'Advisor', label: 'Fit-check call' },
    ],
    access: [
      { title: 'Authorized-user education', desc: 'What underwriters actually see.' },
      { title: 'Inquiry budget', desc: 'Stop giving back gains with extra pulls.' },
      { title: 'Fit matrix', desc: 'Match accounts to the weaknesses on the file.' },
      { title: 'Portal track', desc: 'Execute the plan in the Finely Cred preview.' },
    ],
    foundation: [
      { title: 'No hype', desc: 'Education first. No outcome promises.' },
      { title: 'Compliance copy', desc: 'Safe language for partners and affiliates.' },
      { title: 'Full restore context', desc: 'Tradelines as one lever, not the whole engine.' },
    ],
  },
  score_roadmap: {
    powerLine: 'SEQUENCE. LIFT. PREPARE.',
    categoryLabel: '700+ SCORE ROADMAP',
    taglineBar: 'A SEQUENCED PLAN TODAY. CLEANER OPTIONS WHEN YOU APPLY.',
    benefitsTitle: 'With a sequenced plan you can:',
    processTitle: 'The score sequence',
    resultsTitle: 'What the kit gives you',
    accessTitle: 'What you can access',
    foundationTitle: 'The sequencing advantage',
    ctaBannerLine: 'YOUR SCORE. YOUR SEQUENCE. YOUR NEXT APPLICATION.',
    ctaBannerSub: 'Stop random disputing. Start a plan you can run every week.',
    process: [
      { label: '01', title: 'Utilization' },
      { label: '02', title: 'Priority disputes' },
      { label: '03', title: 'Mix and age' },
      { label: '04', title: 'Monthly rhythm' },
      { label: '05', title: 'Funding ready' },
    ],
    metrics: [
      { value: '700+', label: 'Roadmap template' },
      { value: 'AZEO', label: 'Utilization map' },
      { value: '12 wk', label: 'Milestone track' },
    ],
    access: [
      { title: 'Score roadmap PDF', desc: 'Week-by-week sequencing you can follow.' },
      { title: 'Dispute priorities', desc: 'An impact-versus-effort worksheet.' },
      { title: 'Portal preview', desc: 'Track progress in the live tools.' },
      { title: 'Specialist review', desc: 'Personalize the lane after you download.' },
    ],
    foundation: [
      { title: 'Utilization first', desc: 'The fastest lever on many revolving-heavy files.' },
      { title: 'Evidence disputes', desc: 'Hit the items that can actually move a score.' },
      { title: 'No card required', desc: 'A free kit and a portal preview.' },
    ],
  },
  agency: {
    powerLine: 'SYSTEMIZE. COMPLY. SCALE.',
    categoryLabel: 'AGENCY GROWTH KIT',
    taglineBar: 'SYSTEMS TODAY. VOLUME WITHOUT BURNOUT TOMORROW.',
    benefitsTitle: 'With a partner-grade operating system you can:',
    processTitle: 'The agency scale process',
    resultsTitle: 'Operator results',
    accessTitle: 'What agencies unlock',
    foundationTitle: 'Scale without burnout',
    ctaBannerLine: 'YOUR BRAND. YOUR SYSTEM. YOUR CAPACITY.',
    ctaBannerSub: 'Replace heroic late nights with partner-grade operations.',
    process: [
      { label: '01', title: 'Audit the journey' },
      { label: '02', title: 'Onboarding SOP' },
      { label: '03', title: 'Compliance copy' },
      { label: '04', title: 'Portal operating system' },
      { label: '05', title: 'Capacity tiers' },
    ],
    metrics: [
      { value: '30 day', label: 'Onboarding map' },
      { value: 'WL', label: 'Operating-system overview' },
      { value: '50+', label: 'Partner capacity' },
    ],
    access: [
      { title: 'Partner operating system', desc: 'Restore and funding in one hub.' },
      { title: 'Promo swipe file', desc: 'Sell with energy and stay inside the rules.' },
      { title: 'Partner portals', desc: 'A white-label preview.' },
      { title: 'Revenue lanes', desc: 'Do-it-yourself, done-for-you, and referrals.' },
    ],
    foundation: [
      { title: 'Compliance first', desc: 'Educational positioning — no repair-shop hype.' },
      { title: 'Handoff discipline', desc: 'A sales-to-fulfillment standard operating procedure.' },
      { title: 'Advisor activation', desc: 'A solutions call is included.' },
    ],
  },
  specialist_apply: {
    powerLine: 'TRAIN. ACTIVATE. SERVE.',
    categoryLabel: 'SPECIALIST NETWORK',
    taglineBar: 'TRAINING TODAY. ACTIVATED PARTNERS TOMORROW.',
    benefitsTitle: 'As a Finely specialist you can:',
    processTitle: 'The activation process',
    resultsTitle: 'What you get',
    accessTitle: 'Toolkit preview',
    foundationTitle: 'Built for operators',
    ctaBannerLine: 'YOUR SKILLS. OUR OPERATING SYSTEM. REAL PARTNERS.',
    ctaBannerSub: 'Apply to the specialist network — tools, training, and activation.',
    process: [
      { label: '01', title: 'Apply' },
      { label: '02', title: 'Review' },
      { label: '03', title: 'Train' },
      { label: '04', title: 'Activate' },
      { label: '05', title: 'First partner' },
    ],
    metrics: [
      { value: '14 day', label: 'Training ladder' },
      { value: 'AI', label: 'Workflow primer' },
      { value: 'OS', label: 'Portal preview' },
    ],
    access: [
      { title: 'Letter operations', desc: 'Dispute workflow boards.' },
      { title: 'Evidence vault', desc: 'A partner-ready folder system.' },
      { title: 'AI assist', desc: 'Draft-review guardrails.' },
      { title: 'Activation call', desc: 'Partner specialist support.' },
    ],
    foundation: [
      { title: 'Not a job offer', desc: 'An independent partner path.' },
      { title: 'Compliance training', desc: 'Educational positioning built in.' },
      { title: 'Free toolkit', desc: 'Preview before you commit time.' },
    ],
  },
  kreyol: {
    powerLine: 'KONPRANN. APRANN. MACHE.',
    categoryLabel: 'CREDIT KITS',
    taglineBar: 'CREDIT HELP FOR HAITIAN AMERICANS — PALE KREYÒL LÈ W PARE.',
    benefitsTitle: 'Avèk kit sa a ou ka:',
    processTitle: 'Kat kit, yon pwochen etap',
    resultsTitle: 'Sa w jwenn',
    accessTitle: 'Kat kit',
    foundationTitle: 'Sa ki rete vre',
    ctaBannerLine: 'KREDI. LÈT. YON PWOCHEN ETAP.',
    ctaBannerSub: 'Pale Kreyòl lè w pare. Apre sa, yon sèl pwochen etap.',
    process: [
      { label: '01', title: 'Telechaje kit' },
      { label: '02', title: 'Li lèt la' },
      { label: '03', title: 'Aprann mo yo' },
      { label: '04', title: 'Pale Kreyòl' },
      { label: '05', title: 'Yon pwochen etap' },
    ],
    metrics: [
      { value: '4', label: 'Credit kits' },
      { value: 'IPN', label: 'Òtograf ofisyèl' },
      { value: 'QR', label: 'Haitian community' },
    ],
    access: [
      { title: 'Kisa kredi ye?', desc: 'Dosye SSN, twa biwo, ak mo sou rapò a.' },
      { title: 'Lèt sa a di kisa?', desc: 'Fraz sou lèt la ak sans Kreyòl.' },
      { title: 'Pou moun k ap ede', desc: 'Fanmi ak espesyalis. Yon etap.' },
      { title: 'Feyè legliz', desc: 'QR gwo. Pale Kreyòl.' },
    ],
    foundation: [
      { title: 'Kat kit inik', desc: 'Kredi, lèt, ede fanmi, ak feyè legliz.' },
      { title: 'Edikasyon sèlman', desc: 'Rezilta yo varye. Sa a pa konsèy legal. Si w bezwen lajen, sa depann si yo apwouve w.' },
      { title: 'Haitian community', desc: 'Sis espesyalis. Kreyòl ak angle.' },
    ],
  },
  partner_refer: {
    powerLine: 'REFERRED. RESTORE. READY.',
    categoryLabel: 'PARTNER REFERRAL',
    taglineBar: 'A TRUSTED PARTNER SENT YOU — WE CALL WITHIN 1 BUSINESS DAY.',
    benefitsTitle: 'After you submit you get:',
    processTitle: 'The warm-handoff sequence',
    resultsTitle: 'What this door does',
    accessTitle: 'What you unlock',
    foundationTitle: 'How we work',
    ctaBannerLine: 'YOUR PHONE. OUR CALL. A RESTORE PLAN.',
    ctaBannerSub: 'Credit restore and wealth sequencing — not a repair-shop pitch.',
    process: [
      { label: '01', title: 'Leave name, email, phone' },
      { label: '02', title: 'We call within 1 business day' },
      { label: '03', title: 'Map restore vs debt vs funding' },
      { label: '04', title: 'Optional enlightenment session' },
      { label: '05', title: 'Open the portal preview' },
    ],
    metrics: [
      { value: '1 day', label: 'Call SLA' },
      { value: 'Phone', label: 'Required' },
      { value: '$0', label: 'No card' },
    ],
    access: [
      { title: 'Specialist callback', desc: 'A human calls the number you leave.' },
      { title: 'Restore playbook', desc: 'The same dispute guide as the public free kit.' },
      { title: 'Enlightenment session', desc: 'Book a 60-minute strategy call when you want a set time.' },
      { title: 'Partner attribution', desc: 'ref / partner_id and UTMs stay on the lead.' },
    ],
    foundation: [
      { title: 'Restore, not repair hype', desc: 'Education-first. Results vary. Not legal advice.' },
      { title: 'No partner blast', desc: 'We do not auto-email the person who referred you.' },
      { title: 'Consent required', desc: 'We only call when you agree to be contacted.' },
    ],
  },
  affiliate: {
    powerLine: 'LINK. SHARE. TRACK.',
    categoryLabel: 'AFFILIATE TOOLKIT',
    taglineBar: 'CLEAN LINKS TODAY. COUNTABLE REFERRALS TOMORROW.',
    benefitsTitle: 'With clean attribution you can:',
    processTitle: 'The referral growth process',
    resultsTitle: 'Partner metrics',
    accessTitle: 'The toolkit includes',
    foundationTitle: 'Referral infrastructure',
    ctaBannerLine: 'YOUR LINK. YOUR AUDIENCE. YOUR PAYOUTS.',
    ctaBannerSub: 'Compliant copy, QR codes, and a dashboard preview.',
    process: [
      { label: '01', title: 'Get the link and QR' },
      { label: '02', title: 'Post compliant copy' },
      { label: '03', title: 'Route the funnels' },
      { label: '04', title: 'Track clicks' },
      { label: '05', title: 'Scale the winners' },
    ],
    metrics: [
      { value: 'UTM', label: 'Clean attribution' },
      { value: 'QR', label: 'Print-ready kit' },
      { value: 'Dashboard', label: 'Payout preview' },
    ],
    access: [
      { title: 'Referral links', desc: 'Attribution that actually parses.' },
      { title: 'Social swipe file', desc: 'Compliant hooks and disclosures.' },
      { title: 'Funnel picker', desc: 'Debt, restore, or funding — pick the fit.' },
      { title: 'Local angles', desc: 'City-specific landing links.' },
    ],
    foundation: [
      { title: 'No income hype', desc: 'Payouts depend on referred activity.' },
      { title: 'Compliant copy', desc: 'Platform-safe language.' },
      { title: 'Success specialist', desc: 'Jamie helps wire the first campaign.' },
    ],
  },
};

export function getLeadMagnetFlyerContent(config: LeadMagnetFunnelConfig): LeadMagnetFlyerContent {
  return FLYER[config.id] ?? FLYER.debt!;
}
