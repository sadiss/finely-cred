export type OwnersGuideSection = {
  id: string;
  title: string;
  emoji: string;
  summary: string;
  bullets: string[];
  paths: { label: string; path: string; access?: 'partner' | 'public' | 'admin' }[];
  audience?: 'all' | 'partner' | 'specialist' | 'admin';
};

export const OWNERS_GUIDE_INTRO =
  'Your Partner Access Manual — plus Ruth (AI Co-Owner) intelligence across credit, debt validation, phone ops, and launch readiness. Bookmark after onboarding.';

export const PARTNER_ACCESS_SUMMARY = {
  title: 'What your partner account includes',
  included: [
    'Partner Portal — reports, disputes, Letter Studio, documents vault, and your journey map.',
    'Communication Hub + Calendar — live chat with your team, book strategy calls, join video rooms.',
    'Work OS — assigned tasks with success criteria, timers, and outcome tracking (not internal admin queues).',
    'Education & courses — curriculum, self-paced modules, and My Library audiobooks tied to your lane.',
    'Billing & entitlements — packages, trials, and upgrade paths visible in /portal/billing.',
  ],
  notIncluded: [
    'Admin dashboard (/admin/*) — Finely internal ops only; partners never need these routes.',
    'Leads OS, CRM workspace, Automation Studio, and Comms Studio — staff-only unless you join the Credit Specialist program.',
    'Other partners’ files — your vault, disputes, and threads are scoped to your partner record only.',
  ],
};

export const OWNERS_GUIDE_SECTIONS: OwnersGuideSection[] = [
  {
    id: 'partner_access',
    title: 'Partner access — what you get',
    emoji: '🎁',
    audience: 'partner',
    summary: 'Everything included in your partner portal vs what stays internal to Finely ops.',
    bullets: [
      ...PARTNER_ACCESS_SUMMARY.included.map((line) => `✓ ${line}`),
      ...PARTNER_ACCESS_SUMMARY.notIncluded.map((line) => `✗ ${line}`),
      'Owner’s guide (this page) — searchable reference for partner routes only; admin sections appear only for Finely staff.',
      'Claim profile (/claim) — legacy partners use a token link to attach their login before portal access.',
    ],
    paths: [
      { label: 'Partner portal home', path: '/portal/dashboard', access: 'partner' },
      { label: 'Communication Hub', path: '/portal/messages', access: 'partner' },
      { label: 'Book a strategy call', path: '/portal/calendar', access: 'partner' },
      { label: 'Public pricing (pre-partner)', path: '/pricing', access: 'public' },
    ],
  },
  {
    id: 'start',
    title: 'Start here',
    emoji: '🚀',
    audience: 'partner',
    summary: 'First week as a partner — portal home, onboarding lane, and account settings.',
    bullets: [
      'Partner Portal (/portal/dashboard) — your home base: journey map, proof hub, tasks, and lane-specific shortcuts.',
      'Onboarding (/onboarding) — lane selection (restore, build, affiliate, specialist) sets default routes and nurture.',
      'Account settings (/account/settings) — profile, notifications, Communication Hub + Calendar shortcuts.',
      'Finely Cred Dashboard (/dashboard) — optional Mastery OS view for power users; most partners live in /portal.',
    ],
    paths: [
      { label: 'Partner portal', path: '/portal/dashboard', access: 'partner' },
      { label: 'Onboarding', path: '/onboarding', access: 'partner' },
      { label: 'Account settings', path: '/account/settings', access: 'partner' },
    ],
  },  {
    id: 'wellbeing',
    title: 'Partner mental well-being',
    emoji: '🧘',
    audience: 'partner',
    summary: 'Credit work is stressful — Finely builds in calm, clarity, and sustainable pace.',
    bullets: [
      'Communication Hub AI coach — grounding prompts, next-step clarity, no judgment on score shame.',
      'Journey map is read-only for partners — your case team carries stage pressure so you focus on actions, not progress anxiety.',
      'Tasks board shows only what needs your hand — internal ops work stays invisible until you must act.',
      'Take breaks between dispute rounds; use Calendar to book check-ins instead of late-night portal spirals.',
      'Escalations and legal lanes exist when collectors or courts add stress — you are not alone in the file.',
    ],
    paths: [
      { label: 'Communication Hub', path: '/portal/messages?hub=ai', access: 'partner' },
      { label: 'Book a strategy call', path: '/portal/calendar', access: 'partner' },
      { label: 'Hub guide tab', path: '/portal/messages?hub=guide', access: 'partner' },
    ],
  },  {
    id: 'comms',
    title: 'Communication Hub & Calendar',
    emoji: '💬',
    audience: 'partner',
    summary: 'Live chat vs scheduled video — one workspace, no duplicate inboxes.',
    bullets: [
      'Communication Hub (/portal/messages) — AI coach, team threads, meetings preview. Floating widget on most portal pages.',
      'Calendar (/portal/calendar) — book strategy calls: pick date, time slots, agenda, instant confirm + video room.',
      'Comms Studio (/admin/comms) — Finely staff only: outbound templates post into your Hub threads.',
      'Video meetings (/portal/meeting/:id) — in-app browser rooms for confirmed sessions.',
    ],
    paths: [
      { label: 'Communication Hub', path: '/portal/messages', access: 'partner' },
      { label: 'Calendar & video', path: '/portal/calendar', access: 'partner' },
      { label: 'Hub guide tab', path: '/portal/messages?hub=guide', access: 'partner' },
    ],
  },
  {
    id: 'leads',
    title: 'Lead magnets & marketing (public)',
    emoji: '📣',
    audience: 'partner',
    summary: 'Public funnels you can share before someone becomes a partner.',
    bullets: [
      'Free guide funnel (/free-guide) — Credit Dispute Letter Guide: landing → form → PDF → onboarding.',
      'Short referral links (/g/your-code) — for business cards, brochures, and QR codes.',
      'Resource library (/resources) — free field guides + lead capture; use ?ref= for attribution.',
      'Affiliate / specialist toolkit — tracked links + QR PDF in affiliate hub (if enrolled).',
      'Admin leads (/admin/leads) — Finely staff only; not part of partner portal access.',
    ],
    paths: [
      { label: 'Free guide funnel', path: '/free-guide', access: 'public' },
      { label: 'Resource library', path: '/resources', access: 'public' },
      { label: 'Strategy call (book online)', path: '/enlightenment-session', access: 'public' },
    ],
  },
  {
    id: 'training_academy',
    title: 'Finely Training Academy',
    emoji: '🎓',
    audience: 'partner',
    summary: 'One signup, one academy — core for everyone, role tracks from your onboarding lane.',
    bullets: [
      'No separate training signup — /onboarding lane (restore, affiliate, specialist, AU seller, business, debt) selects your role track.',
      'Core Foundation (required) — compliance before mail, validation-first doctrine, Communication Hub, tasks cadence.',
      'Role tracks unlock automatically — customer restore, affiliate toolkit, credit specialist file ops, AU seller compliance, business vendors, debt validation, admin ops.',
      'Lessons link to tours, SOPs, field guides, and Course Builder modules — one curriculum, no duplicate tracks.',
      'Certifications issue on module completion — visible in academy and certificates store.',
      'Affiliate / specialist / AU hub Training tabs deep-link to the same academy progress.',
    ],
    paths: [
      { label: 'Training Academy', path: '/portal/training/academy', access: 'partner' },
      { label: 'Education library', path: '/portal/education', access: 'partner' },
      { label: 'Courses LMS', path: '/portal/courses', access: 'partner' },
      { label: 'Help center SOPs', path: '/help-center', access: 'public' },
    ],
  },
  {
    id: 'restore',
    title: 'Credit restore workflow',
    emoji: '⚖️',
    audience: 'partner',
    summary: 'Your dispute lane — upload reports, run rounds in Dispute Center, generate letters, and vault proof.',
    bullets: [
      'Upload reports (/portal/reports) — parse bureau data into dispute candidates.',
      'Dispute center (/portal/disputes) — rounds, reasons, evidence linking.',
      'Template Library (/portal/templates) — configure bases before Letter Studio.',
      'Letter Studio (/portal/letters) — generate, mail, and track bureau letters.',
      'Documents vault (/portal/documents) — evidence capture, camera scan, proof hub on dashboard.',
      'Tasks & Projects (/portal/projects, /portal/projects) — kanban + calendar views for due dates.',
    ],
    paths: [
      { label: 'Reports', path: '/portal/reports', access: 'partner' },
      { label: 'Disputes', path: '/portal/disputes', access: 'partner' },
      { label: 'Letter Studio', path: '/portal/letters', access: 'partner' },
    ],
  },
  {
    id: 'journey',
    title: 'Journey map & case management',
    emoji: '🗺️',
    summary: 'Visual roadmap — case team advances steps; partners are read-only on the map.',
    bullets: [
      '3D journey map on partner dashboard — sky/road milestones; contact Communication Hub with questions.',
      'Admin sets journey step on Partner Detail — partners cannot self-advance (case team control).',
      'Journey signals update from portal activity; stage does not auto-advance.',
    ],
    paths: [
      { label: 'Partner dashboard', path: '/portal/dashboard' },
      { label: 'Communication Hub', path: '/portal/messages' },
    ],
  },
  {
    id: 'specialist',
    title: 'Credit Specialist Program',
    emoji: '🎓',
    summary: 'Revenue share, operating stack, partnership line, lead tools.',
    bullets: [
      'Apply at /credit-specialists — preview split by specialty + training phase (Apprenticeship → Guided → Independent).',
      'Specialist hub (/credit-specialist/hub) — command center, training tracks, white-label, lead magnet links.',
      'Partnership line — dedicated thread with Finely (not partner-to-partner comms).',
      'Partner threads — Communication Hub team tab; template sends from Finely appear there.',
      'Agency capacity tiers (/pricing?tab=agency) — scale client volume and platform limits.',
    ],
    paths: [
      { label: 'Credit specialists page', path: '/credit-specialists' },
      { label: 'Specialist hub', path: '/credit-specialist/hub' },
      { label: 'Agency tiers', path: '/pricing?tab=agency' },
    ],
  },
  {
    id: 'education',
    title: 'Education, resources & bookstore',
    emoji: '📚',
    summary: 'Curriculum, free guides, and paid playbooks.',
    bullets: [
      'Education library (/portal/education) — core curriculum and score models.',
      'Courses (/portal/courses) — self-paced modules tied to portal workflow.',
      'Public resources (/resources) — free guides with PDF download after lead capture.',
      'Bookstore (/bookstore) — paid ebooks and playbooks.',
    ],
    paths: [
      { label: 'Education', path: '/portal/education' },
      { label: 'Courses', path: '/portal/courses' },
      { label: 'Bookstore', path: '/bookstore' },
    ],
  },
  {
    id: 'admin',
    title: 'Admin operations',
    emoji: '🛡️',
    summary: 'For Finely ops — settings, calendar triage, leads, partners.',
    audience: 'admin',
    bullets: [
      'Admin dashboard (/admin) — workflow queue, quick links.',
      'Admin guide (/admin/guide) — ops playbook for settings, templates, billing, security.',
      'Calendar (/admin/calendar) — triage requests, schedule sessions, post-meeting notes.',
      'Partner management (/admin/partners) — profiles, journey step, entitlements.',
      'Leads & CRM (/admin/leads, /admin/crm) — inbound captures and conversion.',
      'Resources editor (/admin/resources) — edit free guides (not on public resources page).',
    ],
    paths: [
      { label: 'Admin dashboard', path: '/admin' },
      { label: 'Admin guide', path: '/admin/guide' },
      { label: 'Admin calendar', path: '/admin/calendar' },
    ],
  },
  {
    id: 'work_os',
    title: 'Work OS (results-driven tasks & projects)',
    emoji: '⚡',
    summary: 'AI task create, SLA timers, success criteria, and project outcome KPIs.',
    audience: 'all',
    bullets: [
      'AI Create wizard on project workspace — describe work → AI fills fields + success criteria.',
      'Task detail pane — success criteria, target metric, actual result required on complete.',
      'TaskTimerChip — SLA countdown, overdue badges, 25-min focus timer on task cards.',
      'Project outcomes panel — FICO/deletion/funding targets with progress on overview.',
      'Platform events — task.created, task.started, task.completed, task.result_recorded, task.overdue.',
      'Cron tick scans overdue tasks and notifies assignees via platform notification bridge.',
      'Playbook integration — pick template when creating tasks for checklist + instructions.',
    ],
    paths: [
      { label: 'Admin projects', path: '/admin/projects' },
      { label: 'Partner projects', path: '/portal/projects' },
      { label: 'Workflow queue', path: '/admin/workflow' },
    ],
  },
  {
    id: 'automation_studio',
    title: 'Automation Studio (event triggers)',
    emoji: '⚙️',
    summary: 'Platform events drive rules — funnel, purchase, tasks, lead scoring.',
    audience: 'admin',
    bullets: [
      'Event bridge matches platform events to automation rules in real time.',
      'Live triggers: funnel signup, purchase, task created/completed/overdue, lead scored.',
      'Hot lead rule assigns sales closer persona when score band is hot+.',
      'Interval + seed rules for invite reminders, lane nudges, bundle prompts.',
      'See docs/AUTOMATION_STUDIO.md for trigger catalog and wiring.',
    ],
    paths: [
      { label: 'Automations', path: '/admin/automations' },
      { label: 'Monitoring', path: '/admin/monitoring' },
    ],
  },
  {
    id: 'agent_staff',
    title: 'AI Agent Staff & shift routing',
    emoji: '🤖',
    summary: 'Persona registry with time-based shifts for public chat and portal.',
    audience: 'admin',
    bullets: [
      'Shift schedule routes public chat to on-duty persona when no goal is selected.',
      'Intent classifier upgrades persona when confidence ≥ 55%.',
      'Portal Communication Hub uses lane-based persona tabs (support, funding, debt).',
      'Admin Agent Staff page shows current on-duty persona + shift editor.',
    ],
    paths: [
      { label: 'Agent staff', path: '/admin/agent-staff' },
      { label: 'Public chat', path: '/' },
    ],
  },
  {
    id: 'platform_os',
    title: 'Platform OS (automations, notifications, ops)',
    emoji: '🛰️',
    summary: 'Unified events, notifications bell, support SLA, webhooks, and ops health.',
    audience: 'admin',
    bullets: [
      'Platform events feed on Admin dashboard — leads, purchases, trial expiry, automations.',
      'Notifications bell (top-right) — task due, trial ending, billing dunning, new leads.',
      'Support inbox SLA — 4h first-response target; breached threads spawn urgent tasks.',
      'Webhook hub (local config) — outbound on lead.created and purchase.completed.',
      'Ops health panel — automations enabled, SLA breaches, revenue snapshot.',
      'Funding Ladder + Tradeline Marketplace in partner portal (/portal/wealth-paths, /portal/tradelines).',
    ],
    paths: [
      { label: 'Support inbox', path: '/admin/support' },
      { label: 'Tradeline marketplace', path: '/portal/tradelines' },
      { label: 'Wealth paths + funding ladder', path: '/portal/wealth-paths' },
    ],
  },
  {
    id: 'co_owner_ruth',
    title: 'AI Co-Owner — Ruth',
    emoji: '👑',
    audience: 'admin',
    summary: 'Ruth is your AI co-owner — not a chatbot. Command center, 100+ executive hats, autonomous hiring, validation-first doctrine.',
    bullets: [
      'Co-Owner Command Center (/admin/ops-agent) — daily ops, launch audit, faithful stewardship coaching.',
      'Registered persona finely_coowner — premium Claude routing, phone escalation, Intelligence OS recognition.',
      'Autonomous hiring — CFO, CMO, COO, CHRO, CLO, and division leaders with biblical names on roster.',
      'Doctrine: challenge debt before pay; validation letters; affidavits for summons; never settle-as-default.',
      'Traits span credit, debt validation, funding, ops, leadership, and executive org management.',
      'Ask Ruth to hire executives, activate automations, audit nurture, or coach through partner stress without shame.',
    ],
    paths: [
      { label: 'Co-Owner Command Center', path: '/admin/ops-agent' },
      { label: 'Phone Hub', path: '/admin/phone-hub' },
      { label: 'Owner’s guide', path: '/owners-guide#co_owner_ruth' },
    ],
  },
  {
    id: 'phone_voice_hub',
    title: 'Phone Hub & Voice Studio',
    emoji: '📞',
    audience: 'admin',
    summary: 'Desktop softphone — SMS threads, inbound/outbound calls, voicemail → co-owner summaries.',
    bullets: [
      'Phone Hub (/admin/phone-hub) — dialer, agent routing, CRM click-to-call, callback tasks.',
      'Outbound SMS via Twilio edge; inbound queue routes to sales, support, debt, affiliate personas.',
      'Missed calls / voicemail escalate to Ruth (co-owner) for transcription summary + task creation.',
      'Voice Studio (/admin/voice-studio) — neural TTS for guides, ebooks, tours, co-owner voice replies.',
      'Configure twilioFromPhone + Comms Delivery. Point Twilio SMS/Voice webhooks to the twilio-webhook edge function URL.',
      'Consent logging on all outbound SMS/calls — FTC-safe discipline.',
    ],
    paths: [
      { label: 'Phone Hub', path: '/admin/phone-hub' },
      { label: 'Voice Studio', path: '/admin/voice-studio' },
      { label: 'Comms settings', path: '/admin/settings' },
    ],
  },
  {
    id: 'debt_validation_doctrine',
    title: 'Debt validation & challenge doctrine',
    emoji: '⚖️',
    audience: 'all',
    summary: 'Validation-first — challenge on consumer-law terms. Never pay charge-offs/collections as default.',
    bullets: [
      'FDCPA §809: validation letter within 30 days of first collector contact — cease collection until verified.',
      'We challenge debt; we do not default to settlement or pay-for-delete as first option.',
      'Affidavit of dispute + summons response workflows in Debt & Summons Center (/portal/debt).',
      'Law-per-negative: each dispute cites specific statute (FCRA field, FDCPA validation, TILA, UCC, state SOL).',
      'Collector licensing, proper service, chain of title — situation-specific challenges.',
      'Foreclosure/bankruptcy lanes: educational framing only — consult licensed counsel for filing.',
      'Wage garnishment: respond with procedure + affidavit support — document everything in vault.',
    ],
    paths: [
      { label: 'Debt & Summons Center', path: '/portal/debt', access: 'partner' },
      { label: 'Free dispute guide', path: '/resources', access: 'public' },
      { label: 'Letter Studio', path: '/portal/letters', access: 'partner' },
    ],
  },
  {
    id: 'dispute_law_engine',
    title: 'Dispute law engine (per-negative citations)',
    emoji: '📜',
    audience: 'partner',
    summary: 'Every negative gets its governing law — Letter Studio and guides embed citations automatically.',
    bullets: [
      'Charge-off → FCRA §1681s-2 accuracy + Metro2 status/grid contradictions — not payment.',
      'Collection → FDCPA §809 validation + state collector license verification.',
      'Inquiry → FCRA §1681b permissible purpose challenge.',
      'Foreclosure → state procedure + TILA; evaluate bankruptcy stay with counsel if needed.',
      'Re-aging → FCRA §1681c DOFD anchor; re-aged dates are accuracy disputes.',
      'Use Reasons OS + Letter Studio — pick reason, law block auto-attaches to draft.',
    ],
    paths: [
      { label: 'Letter Studio', path: '/portal/letters', access: 'partner' },
      { label: 'Dispute reasons', path: '/portal/reasons', access: 'partner' },
      { label: 'Resources guides', path: '/resources', access: 'public' },
    ],
  },
];

export function filterOwnersGuideSections(
  query: string,
  isAdmin: boolean,
  sections: OwnersGuideSection[] = OWNERS_GUIDE_SECTIONS,
): OwnersGuideSection[] {
  const q = query.trim().toLowerCase();
  return sections
    .filter((s) => {
      if (s.audience === 'admin' && !isAdmin) return false;
      if (!q) return true;
      const hay = `${s.title} ${s.summary} ${s.bullets.join(' ')}`.toLowerCase();
      return hay.includes(q);
    })
    .map((s) => ({
      ...s,
      paths: isAdmin ? s.paths : s.paths.filter((p) => p.access !== 'admin' && !p.path.startsWith('/admin')),
    }));
}