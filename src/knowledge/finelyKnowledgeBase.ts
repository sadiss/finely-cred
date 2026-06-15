/** Finely Cred knowledge corpus — single source for AI coach, public chat, and doc routing hints. */

export type KnowledgeCategory =
  | 'restore'
  | 'disputes'
  | 'letters'
  | 'portal'
  | 'documents'
  | 'funding'
  | 'debt'
  | 'identity'
  | 'specialist'
  | 'affiliate'
  | 'video'
  | 'pricing'
  | 'compliance'
  | 'onboarding';

export type KnowledgeArticle = {
  id: string;
  title: string;
  category: KnowledgeCategory;
  tags: string[];
  /** Searchable body — injected into AI context when relevant */
  content: string;
  /** Portal paths the AI may suggest */
  links?: { label: string; path: string }[];
};

export const FINELY_KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'restore-overview',
    title: 'Personal credit restoration overview',
    category: 'restore',
    tags: ['restore', 'score', 'rounds', 'journey', '720'],
    content:
      'Finely Cred personal restore follows rounds: upload latest report → identify derogatories → dispute with bureau/furnisher letters → track responses → compare next report. Score movement comes from deletions, utilization drops, and time. The Partner Dashboard shows overall readiness, open tasks, and mission-control actions.',
    links: [{ label: 'Partner Dashboard', path: '/portal/dashboard' }],
  },
  {
    id: 'restore-rounds',
    title: 'Dispute rounds explained',
    category: 'disputes',
    tags: ['round 1', 'round 2', 'round 3', 'mov', 'follow up'],
    content:
      'Round 1: initial bureau disputes with specific reasons and evidence. Round 2 (30–45 days later): method-of-verification or reinvestigation if items remain. Round 3+: escalation patterns, furnisher direct disputes, or goodwill where appropriate. Never dispute everything at once — sequence by impact (collections, lates, then inquiries).',
    links: [{ label: 'Dispute Center', path: '/portal/disputes' }],
  },
  {
    id: 'dispute-reasons',
    title: 'Choosing dispute reasons',
    category: 'disputes',
    tags: ['reasons', 'fcra', 'inaccurate', 'unverified', 'obsolete'],
    content:
      'Strong reasons cite FCRA accuracy/verification duties: not mine, wrong balance or dates, duplicate tradeline, account closed but reporting open, paid but showing late. Tie each reason to facts on the report screenshot. Avoid vague "fix my credit" language.',
  },
  {
    id: 'letters-studio',
    title: 'Letter Studio workflow',
    category: 'letters',
    tags: ['letters', 'draft', 'studio', 'pdf', 'vault'],
    content:
      'Letter Studio builds bureau and furnisher letters from your report data, dispute reasons, and partner identity. Generate → preview → edit inline → export PDF/Word → save to Documents Vault. Template Library provides base letters with tone/variant options; save powerful custom versions to the vault for reuse.',
    links: [
      { label: 'Letter Studio', path: '/portal/letters' },
      { label: 'Template Library', path: '/portal/templates' },
    ],
  },
  {
    id: 'letters-example',
    title: 'Writing your own dispute letter',
    category: 'letters',
    tags: ['write', 'example', 'step by step', 'free guide'],
    content:
      'The free Credit Dispute Guide teaches step-by-step letter writing plus one powerful example letter — not a bundle of copy-paste templates. Structure: header with your info, bureau address, account identifiers, specific dispute reasons, FCRA citation, request to delete or correct, enclosures list, signature.',
    links: [{ label: 'Free guide', path: '/free-guide' }],
  },
  {
    id: 'portal-dashboard',
    title: 'Partner Dashboard',
    category: 'portal',
    tags: ['dashboard', 'kpi', 'mission control', 'tasks'],
    content:
      'Partner Dashboard is your home base: overall score, mission-control quick actions, staff notes, proof uploads, journey roadmap, and charts for tasks/cases/reports. Use it daily to see what to do next.',
    links: [{ label: 'Dashboard', path: '/portal/dashboard' }],
  },
  {
    id: 'portal-reports',
    title: 'Credit report upload and compare',
    category: 'portal',
    tags: ['upload', 'report', 'html', 'pdf', 'compare', 'second report'],
    content:
      'Upload HTML or PDF exports from bureaus. The newest file becomes your active baseline; the previous file is archived for round-over-round comparison. On second upload, Finely queues a compare task with score deltas and tradeline add/remove counts.',
    links: [{ label: 'Reports', path: '/portal/reports' }],
  },
  {
    id: 'portal-checklist',
    title: 'AI restoration checklist',
    category: 'portal',
    tags: ['checklist', 'ai', 'tasks', 'restore'],
    content:
      'The restoration checklist ranks next actions based on your file stage — identity proof, report upload, dispute rounds, debt items, funding readiness. Lead magnet includes a 15-day DIY trial with AI checklist access; upgrade to DIY to keep it unlocked.',
    links: [{ label: 'Checklist', path: '/portal/checklist' }],
  },
  {
    id: 'documents-vault',
    title: 'Documents vault and evidence',
    category: 'documents',
    tags: ['vault', 'evidence', 'upload', 'scan', 'id', 'ssn'],
    content:
      'Proof & Documents hub accepts camera scans and file uploads. Use ID/license and SSN profiles for tight auto-crop. Organize by dispute, debt, identity theft, or general. Doc intel (when enabled) classifies uploads and routes to the right center.',
    links: [{ label: 'Documents', path: '/portal/documents' }],
  },
  {
    id: 'documents-capture',
    title: 'How to capture ID and SSN cards',
    category: 'documents',
    tags: ['camera', 'id card', 'license', 'ssn', 'scan', 'photograph'],
    content:
      'Hold the card flat; Finely camera mode detects the document edge even with hands or background clutter and focuses on the card region. Use rear camera, good light, fill the guide frame, then capture. Auto-crop removes background before saving to vault.',
  },
  {
    id: 'communication-hub',
    title: 'Communication Hub',
    category: 'portal',
    tags: ['chat', 'ai coach', 'team', 'meetings', 'hub'],
    content:
      'Communication Hub has four tabs: AI coach (workflow help), Team chat (support threads with specialists/affiliates), Meetings (video sessions), and Hub guide. Floating widget available on dashboard; full page at /portal/messages.',
    links: [{ label: 'Messages hub', path: '/portal/messages' }],
  },
  {
    id: 'video-meetings',
    title: 'Video meetings and instant calls',
    category: 'video',
    tags: ['video', 'call', 'jitsi', 'specialist', 'client', 'affiliate', 'calendar'],
    content:
      'Schedule sessions on Calendar or start an instant video call from Team chat or Meetings tab. Rooms work for clients, credit specialists, affiliates, and Finely staff. Join in-browser with camera/mic; share screen when needed. Instant calls post a join link in the thread.',
    links: [
      { label: 'Calendar', path: '/portal/calendar' },
      { label: 'Meetings hub', path: '/portal/messages?hub=meetings' },
    ],
  },
  {
    id: 'specialist-program',
    title: 'Credit specialist partnership',
    category: 'specialist',
    tags: ['specialist', 'agent', 'splits', 'apprenticeship', 'white label'],
    content:
      'Credit specialists use the partnership line in Team chat, agent program economics (lane splits, apprenticeship floor), and can run client files in the portal. Video sessions support specialist↔client and specialist↔Finely program calls.',
    links: [
      { label: 'Agents page', path: '/agents' },
      { label: 'Specialist thread', path: '/portal/messages?hub=team&topic=credit_specialist_program' },
    ],
  },
  {
    id: 'affiliate-program',
    title: 'Affiliate program',
    category: 'affiliate',
    tags: ['affiliate', 'referral', 'commission', 'payout'],
    content:
      'Affiliates refer leads via tracked links, use the affiliate topic in Team chat for payouts and campaigns, and can schedule video check-ins with the Finely team. Attribution is stored on lead capture.',
    links: [{ label: 'Affiliate thread', path: '/portal/messages?hub=team&topic=affiliate_program' }],
  },
  {
    id: 'debt-summons',
    title: 'Debt and summons help',
    category: 'debt',
    tags: ['debt', 'collection', 'summons', 'validation', 'court'],
    content:
      'Debt Center handles validation letters, collector disputes, and summons intake. Upload collector mail via document scan. Do not ignore court dates — use educational templates and escalate to legal counsel when needed.',
    links: [{ label: 'Debt Center', path: '/portal/debt' }],
  },
  {
    id: 'identity-theft',
    title: 'Identity theft center',
    category: 'identity',
    tags: ['identity theft', 'fraud', 'ftc', 'police report', 'block'],
    content:
      'Identity theft workflow: FTC report, police report if applicable, bureau fraud alerts/blocks, affidavits, and targeted disputes on fraudulent tradelines. Upload ID and supporting docs to vault.',
    links: [{ label: 'Identity theft', path: '/portal/identity-theft' }],
  },
  {
    id: 'funding-readiness',
    title: 'Funding and wealth builder path',
    category: 'funding',
    tags: ['funding', 'utilization', 'dti', 'business credit', 'stacking'],
    content:
      'After restore stabilizes scores, funding readiness looks at utilization, inquiry age, mix, and DTI signals. Business credit lane builds vendor/trade lines separately. Wealth Builder packages cover capital readiness.',
    links: [{ label: 'Pricing', path: '/pricing' }],
  },
  {
    id: 'diy-vs-dfy',
    title: 'DIY vs Done-For-You',
    category: 'pricing',
    tags: ['diy', 'dfy', 'pricing', 'trial', 'portal'],
    content:
      'DIY: portal tools, templates, checklist, report upload. DFY: Finely executes dispute strategy and tracking. Free guide includes 15-day DIY portal trial (report upload, AI checklist, dashboard preview) — locks after 15 days unless you upgrade to DIY.',
    links: [{ label: 'Pricing', path: '/pricing' }, { label: 'Free guide', path: '/free-guide' }],
  },
  {
    id: 'fcra-rights',
    title: 'FCRA rights summary',
    category: 'compliance',
    tags: ['fcra', 'rights', 'bureau', 'verify', 'delete', '30 days'],
    content:
      'Under FCRA, bureaus must investigate disputes within ~30 days, mark items disputed, and delete or correct unverifiable data. You may dispute directly with furnishers. This is educational — not legal advice.',
  },
  {
    id: 'bureau-mailing',
    title: 'Bureau mailing kit',
    category: 'letters',
    tags: ['equifax', 'experian', 'transunion', 'certified mail', 'address'],
    content:
      'Send disputes via certified mail with return receipt when possible. Include ID copy, SSN last-4 proof, report copy with items circled, and your letter. Keep tracking numbers in the vault and log send dates in Letter Studio.',
  },
  {
    id: 'onboarding-session',
    title: 'Strategy call and onboarding',
    category: 'onboarding',
    tags: ['session', 'onboarding', 'consult', 'strategy call'],
    content:
      'New partners can book a free strategy call or complete onboarding to set lane (personal restore, business, debt). Onboarding connects you to dashboard, checklist, and Communication Hub.',
    links: [
      { label: 'Book a strategy call', path: '/enlightenment-session' },
      { label: 'Onboarding', path: '/onboarding' },
    ],
  },
  {
    id: 'tradelines-au',
    title: 'Authorized user tradelines',
    category: 'funding',
    tags: ['tradelines', 'au', 'authorized user', 'marketplace'],
    content:
      'AU tradelines may help aged credit history when used responsibly. Finely marketplace lists inventory with utilization and verification signals. Understand risk and issuer policies before buying.',
    links: [{ label: 'Tradelines', path: '/tradelines' }],
  },
  {
    id: 'business-credit',
    title: 'Business credit lane',
    category: 'funding',
    tags: ['business', 'ein', 'vendor', 'duns', 'corporate'],
    content:
      'Business credit builds on EIN, entity structure, vendor net-30 accounts, and separation from personal file. Use Business dashboard for structure checklist and funding pathways.',
    links: [{ label: 'Business dashboard', path: '/business/dashboard' }],
  },
  {
    id: 'templates-vault-save',
    title: 'Saving powerful letters to vault',
    category: 'letters',
    tags: ['template', 'vault', 'save', 'edit', 'admin'],
    content:
      'In Template Library: select base → configure partner/variant/tone → generate → Edit & Export → Save to Templates Vault or partner Documents Vault. Saved letters include reason metadata for dispute rounds.',
    links: [{ label: 'Templates', path: '/portal/templates' }],
  },
  {
    id: 'escalations',
    title: 'When to escalate',
    category: 'portal',
    tags: ['escalate', 'case', 'stuck', 'legal'],
    content:
      'Escalate when bureaus fail to respond, collectors sue, identity theft is active, or DFY clients need case management. Open escalation from portal; continue documenting in Team chat.',
    links: [{ label: 'Escalations', path: '/portal/escalations' }],
  },
  {
    id: 'mental-wellbeing',
    title: 'Mental well-being during credit restoration',
    category: 'portal',
    tags: ['wellbeing', 'stress', 'anxiety', 'owner', 'burnout', 'calm'],
    content:
      'Credit restoration can feel overwhelming. Finely separates what you control (tasks, evidence, letters) from what your case team controls (journey stage). Use the AI coach for next-step clarity, book video check-ins instead of late-night spirals, and take breaks between dispute rounds. Your score is a file — not your worth.',
    links: [
      { label: 'AI coach', path: '/portal/messages?hub=ai' },
      { label: 'Calendar', path: '/portal/calendar' },
    ],
  },
  {
    id: 'video-meetings-controls',
    title: 'Video meetings — controls & layouts',
    category: 'video',
    tags: ['video', 'meeting', 'jitsi', 'camera', 'mic', 'layout'],
    content:
      'Instant and scheduled video rooms open in-browser with a control bar: mic/cam toggles, grid/spotlight/sidebar layouts, meeting notes, people panel, and invite link copy. Use Team chat to start a call with your specialist or case manager selected.',
    links: [{ label: 'Meetings hub', path: '/portal/messages?hub=meetings' }],
  },
  {
    id: 'letter-builder',
    title: 'Real-time letter builder',
    category: 'letters',
    tags: ['template', 'builder', 'edit', 'font', 'preview', 'word'],
    content:
      'Template Library uses a split Builder + Live Preview workspace: fonts, colors, images, tables, and attachments in the rich editor sync instantly to the print preview. Export PDF or Word from your edited version; save to Templates Vault.',
    links: [{ label: 'Admin templates', path: '/admin/templates' }],
  },
  {
    id: 'resource-section-attachments',
    title: 'Guide section attachments',
    category: 'portal',
    tags: ['resources', 'attachment', 'upload', 'pdf', 'section'],
    content:
      'Admins can attach PDFs, images, or worksheets to each section of a free guide in Admin Resources. Partners download section attachments from the resource library alongside guide content.',
    links: [{ label: 'Admin resources', path: '/admin/resources' }],
  },
];
