/** Head of Society (HOS) — men's restoration program partner lane. */

export const HEAD_OF_SOCIETY_NAME = 'Head of Society' as const;
export const HETA_SOCIETY_PROGRAM_ID = 'heta_society' as const;
export const HETA_SOCIETY_SHORT = 'HOS' as const;
export const HEAD_OF_SOCIETY_PATH = '/head-of-society' as const;
export const HETA_SOCIETY_DISPUTE_LIMIT = 5;
export const HETA_SOCIETY_TAGLINE = 'Restoration and building for men.' as const;
export const HETA_SOCIETY_HERO_ACCENT = 'Restore credit. Build business. Grow with discipline.' as const;

export const HETA_SOCIETY_MANIFESTO =
  'A private lane for men who restore with evidence, build with structure, and grow without hype.' as const;

export const HETA_SOCIETY_STATS = [
  { value: String(HETA_SOCIETY_DISPUTE_LIMIT), label: 'Dispute slots', sub: 'FCRA-tracked rounds' },
  { value: '4', label: 'Vendor tiers', sub: 'Business credit ladder' },
  { value: '1', label: 'Member file', sub: 'Restore + build hub' },
  { value: '0', label: 'Public signup', sub: 'Invite key required' },
] as const;

export const HETA_SOCIETY_PILLARS = [
  {
    id: 'restore',
    title: 'Personal restoration',
    desc: 'Evidence-first disputes, round-one letters, and bureau timelines — up to five active items.',
    accent: 'amber',
  },
  {
    id: 'business',
    title: 'Business credit OS',
    desc: 'Foundation gate, entity hygiene, and Tier 1–4 vendor sequencing matched to your industry.',
    accent: 'violet',
  },
  {
    id: 'discipline',
    title: 'Disciplined growth',
    desc: 'No hype, no guarantees — just a tracked file, clear next steps, and compliance-safe education.',
    accent: 'emerald',
  },
  {
    id: 'legacy',
    title: 'Paths to serve',
    desc: 'When you are ready: credit specialist, agent operator, or referral partner lanes open inside Finely.',
    accent: 'sky',
  },
] as const;

export const HETA_SOCIETY_BENEFITS = [
  { id: 'disputes', title: `${HETA_SOCIETY_DISPUTE_LIMIT} personal disputes`, desc: 'Track collection and negative items with round-one workflow and FCRA timing.' },
  { id: 'guide', title: 'Free dispute letter guide', desc: 'Full PDF guide plus portal tools to send and track your first rounds.' },
  { id: 'business', title: 'Business credit starter', desc: 'Entity checklist, vendor sequencing, and funding-readiness modules.' },
  { id: 'careers', title: 'Growth paths', desc: 'Explore credit specialist and agent lanes when you are ready to serve others.' },
] as const;

export const HETA_SOCIETY_CAREER_PATHS = [
  { id: 'specialist', title: 'Credit specialist', desc: 'Train on dispute workflow and customer file management.', path: '/credit-specialist-apply' },
  { id: 'agent', title: 'Agent / team operator', desc: 'Run files with tasks, letters, and partner communications.', path: '/onboarding?lane=agent' },
  { id: 'affiliate', title: 'Referral partner', desc: 'Share restoration resources and earn on qualified referrals.', path: '/affiliate' },
] as const;

export const HETA_SOCIETY_FAQ = [
  {
    id: 'what-is',
    q: `What is ${HEAD_OF_SOCIETY_NAME} (HOS)?`,
    a: `${HEAD_OF_SOCIETY_NAME} is an invite-only men's program — restore personal credit and build business credit with discipline. You get a private member file, up to ${HETA_SOCIETY_DISPUTE_LIMIT} tracked disputes, business credit starter tools, and the full letter guide.`,
  },
  {
    id: 'access',
    q: 'How do I get an access key?',
    a: 'HOS is not open public signup. You need an access key from Finely or someone authorized to invite members. Enter your key on this page to unlock membership registration.',
  },
  {
    id: 'vs-guide',
    q: 'How is HOS different from the free dispute guide?',
    a: 'The free guide gives you the PDF and a single-lead funnel. HOS adds a member portal, multiple dispute slots with FCRA timing, report uploads, business credit modules, and career paths when you are ready to grow.',
  },
  {
    id: 'cost',
    q: 'Does it cost anything to join?',
    a: 'HOS membership is free once you have a valid access key. Create your login and open your restoration and business-building file. Optional paid services elsewhere on Finely are never required for your HOS dispute slots.',
  },
  {
    id: 'login',
    q: 'I already signed up — where do I log in?',
    a: 'Use Member login with the email you registered. That opens onboarding for the HOS lane and routes you to /portal/hos with your dispute tracker ready.',
  },
  {
    id: 'disputes',
    q: `How do the ${HETA_SOCIETY_DISPUTE_LIMIT} dispute slots work?`,
    a: 'Each slot tracks one negative or collection item through intake, letter prep, send, and the 30-day bureau response window. Upload your credit report in the portal to attach evidence per item.',
  },
  {
    id: 'who',
    q: 'Who is HOS for?',
    a: 'Men restoring personal credit and building business credit with discipline — whether you are clearing collections, standing up an entity, or eventually training to help others through specialist paths.',
  },
] as const;

export const HOS_VS_FREE_GUIDE = [
  { feature: 'Dispute letter PDF guide', freeGuide: true, hos: true },
  { feature: 'Private member portal', freeGuide: false, hos: true },
  { feature: `${HETA_SOCIETY_DISPUTE_LIMIT} tracked dispute slots`, freeGuide: false, hos: true },
  { feature: 'Report upload & FCRA timeline', freeGuide: false, hos: true },
  { feature: 'Business credit starter', freeGuide: false, hos: true },
  { feature: 'Career & specialist paths', freeGuide: false, hos: true },
] as const;
