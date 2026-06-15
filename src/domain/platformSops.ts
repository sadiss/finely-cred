/** Platform-wide SOP registry — ops, portal, admin, roles, compliance (Launch OS Part A). */

export type PlatformSopLane =
  | 'public'
  | 'portal'
  | 'admin'
  | 'affiliate'
  | 'agent'
  | 'business'
  | 'compliance';

export type PlatformSopAudience = 'visitor' | 'partner' | 'affiliate' | 'agent' | 'admin' | 'all';

export type PlatformSopStep = {
  order: number;
  label: string;
  detail: string;
  route?: string;
};

export type PlatformSop = {
  id: string;
  title: string;
  lane: PlatformSopLane;
  audience: PlatformSopAudience;
  whenToUse: string;
  ownerRole: string;
  steps: PlatformSopStep[];
  relatedRoutes: string[];
  relatedTourId?: string;
  complianceNotes?: string[];
  checklistItems?: string[];
};

export const PLATFORM_SOP_LIBRARY: PlatformSop[] = [
  {
    id: 'sop-public-start-here',
    title: 'Start here — pick your path',
    lane: 'public',
    audience: 'visitor',
    whenToUse: 'Someone lands on Finely and is not sure where to go.',
    ownerRole: 'finely_advisor',
    steps: [
      { order: 1, label: 'Open Start Here', detail: 'Choose fix credit, refer people, or staff login.', route: '/start-here' },
      { order: 2, label: 'Watch the overview', detail: 'Play the 2-minute site overview video.', route: '/resources#videos' },
      { order: 3, label: 'Begin intake', detail: 'Start onboarding when ready.', route: '/onboarding' },
    ],
    relatedRoutes: ['/start-here', '/', '/onboarding', '/personal-credit'],
    relatedTourId: 'tour-home-overview',
  },
  {
    id: 'sop-public-help-center',
    title: 'Find a step-by-step playbook',
    lane: 'public',
    audience: 'all',
    whenToUse: 'User wants written instructions or search across all workflows.',
    ownerRole: 'finely_advisor',
    steps: [
      { order: 1, label: 'Open Help center', detail: 'Browse or search playbooks by lane.', route: '/help-center' },
      { order: 2, label: 'Preview a tour', detail: 'Tap Preview tour on any playbook card.', route: '/help-center' },
      { order: 3, label: 'Ask Finely', detail: 'Type your question on any page for instant guidance.', route: '/start-here' },
    ],
    relatedRoutes: ['/help-center', '/admin/launch-os'],
    relatedTourId: 'tour-home-overview',
  },
  {
    id: 'sop-public-monitoring-links',
    title: 'Choose a credit monitoring service',
    lane: 'public',
    audience: 'visitor',
    whenToUse: 'User needs a tri-merge report source for HTML upload in the portal.',
    ownerRole: 'finely_advisor',
    steps: [
      { order: 1, label: 'Open Resources monitoring section', detail: 'Compare the four partner options.', route: '/resources#monitoring' },
      { order: 2, label: 'Pick HTML-friendly provider', detail: 'IdentityIQ, SmartCredit, or MyScoreIQ for best parse quality.', route: '/resources#monitoring' },
      { order: 3, label: 'Use official free report if needed', detail: 'AnnualCreditReport.com for baseline accuracy checks.', route: '/resources#monitoring' },
    ],
    relatedRoutes: ['/resources'],
    relatedTourId: 'tour-resources-monitoring',
    complianceNotes: ['Educational only — we do not guarantee score outcomes.'],
  },
  {
    id: 'sop-onboarding-monitoring',
    title: 'Pick monitoring during onboarding',
    lane: 'public',
    audience: 'visitor',
    whenToUse: 'User is in onboarding and needs a tri-merge monitoring account.',
    ownerRole: 'finely_advisor',
    steps: [
      { order: 1, label: 'Open a partner card', detail: 'Same affiliate links as Resources — all four partners including SmartCredit.', route: '/onboarding' },
      { order: 2, label: 'Prefer HTML export', detail: 'IdentityIQ, SmartCredit, and MyScoreIQ parse best in the portal.', route: '/resources#monitoring' },
      { order: 3, label: 'Skip if not ready', detail: 'Connect monitoring later from Resources.', route: '/onboarding' },
    ],
    relatedRoutes: ['/onboarding'],
    relatedTourId: 'tour-onboarding-start',
  },
  {
    id: 'sop-portal-upload-report',
    title: 'Upload your credit report',
    lane: 'portal',
    audience: 'partner',
    whenToUse: 'Partner has a monitoring export (HTML or PDF) ready to parse.',
    ownerRole: 'dispute_coach',
    steps: [
      { order: 1, label: 'Go to Reports', detail: 'Open the Reports module from your dashboard.', route: '/portal/reports' },
      { order: 2, label: 'Upload HTML if possible', detail: 'HTML parses tradelines and payment history best.', route: '/portal/reports' },
      { order: 3, label: 'Review parsed items', detail: 'Check scores and dispute candidates after upload.', route: '/portal/reports' },
    ],
    relatedRoutes: ['/portal/reports', '/portal/dashboard'],
    relatedTourId: 'tour-portal-upload-report',
  },
  {
    id: 'sop-portal-dispute-letter',
    title: 'Write and mail a dispute letter',
    lane: 'portal',
    audience: 'partner',
    whenToUse: 'Partner is ready to dispute an item with evidence.',
    ownerRole: 'letter_ops_agent',
    steps: [
      { order: 1, label: 'Open Disputes', detail: 'See items that need attention.', route: '/portal/disputes' },
      { order: 2, label: 'Open Letter Studio', detail: 'Draft factual dispute language.', route: '/portal/letters' },
      { order: 3, label: 'Attach evidence', detail: 'Upload supporting documents before mailing.', route: '/portal/documents' },
      { order: 4, label: 'Export PDF and mail', detail: 'Send via certified mail and log the round.', route: '/portal/letters' },
    ],
    relatedRoutes: ['/portal/disputes', '/portal/letters', '/portal/documents'],
    relatedTourId: 'tour-portal-dispute-letter',
    complianceNotes: ['Educational dispute workflow only — not legal advice.'],
  },
  {
    id: 'sop-portal-billing',
    title: 'Pay or update billing',
    lane: 'portal',
    audience: 'partner',
    whenToUse: 'Partner needs to pay, update card, or unlock entitlements.',
    ownerRole: 'support_specialist',
    steps: [
      { order: 1, label: 'Open Billing', detail: 'See your plan and payment status.', route: '/portal/billing' },
      { order: 2, label: 'Update payment method', detail: 'Use Stripe checkout when enabled.', route: '/portal/billing' },
      { order: 3, label: 'Contact support if locked', detail: 'Message team from Messages if access blocked.', route: '/portal/messages' },
    ],
    relatedRoutes: ['/portal/billing'],
    relatedTourId: 'tour-portal-billing',
  },
  {
    id: 'sop-admin-create-partner',
    title: 'Create a client file (partner)',
    lane: 'admin',
    audience: 'admin',
    whenToUse: 'New client needs a partner record before reports or letters.',
    ownerRole: 'processing_agent',
    steps: [
      { order: 1, label: 'Open Partner Management', detail: 'Browse the partner directory.', route: '/admin/partners' },
      { order: 2, label: 'Create partner', detail: 'Enter name, email, and primary route.', route: '/admin/partners#create-partner' },
      { order: 3, label: 'Send claim link', detail: 'Partner sets password and links their account.', route: '/admin/partners' },
    ],
    relatedRoutes: ['/admin/partners'],
    relatedTourId: 'tour-admin-partners',
  },
  {
    id: 'sop-admin-upload-client-report',
    title: 'Upload report for a client',
    lane: 'admin',
    audience: 'admin',
    whenToUse: 'Staff receives a client report and uploads on their behalf.',
    ownerRole: 'processing_agent',
    steps: [
      { order: 1, label: 'Open client profile', detail: 'Find partner in directory.', route: '/admin/partners' },
      { order: 2, label: 'Reports tab', detail: 'Upload HTML or PDF export.', route: '/admin/partners' },
      { order: 3, label: 'Verify parse', detail: 'Check analysis and dispute candidates.', route: '/admin/partners' },
    ],
    relatedRoutes: ['/admin/partners'],
    relatedTourId: 'tour-admin-partners',
  },
  {
    id: 'sop-public-personal-credit',
    title: 'Pick a personal credit package',
    lane: 'public',
    audience: 'visitor',
    whenToUse: 'Visitor is comparing restore packages and wants a clear next step.',
    ownerRole: 'sales_closer',
    steps: [
      { order: 1, label: 'Compare packages', detail: 'See restore vs platinum coverage and pricing.', route: '/personal-credit' },
      { order: 2, label: 'Start intake', detail: 'Create your account and pick your lane.', route: '/onboarding' },
      { order: 3, label: 'Set up monitoring', detail: 'Use the same partner links as Resources before upload.', route: '/resources#monitoring' },
    ],
    relatedRoutes: ['/personal-credit'],
    relatedTourId: 'tour-personal-credit',
  },
  {
    id: 'sop-public-fundability',
    title: 'Check fundability readiness',
    lane: 'public',
    audience: 'visitor',
    whenToUse: 'User wants personal + business funding readiness in one view.',
    ownerRole: 'funding_strategist',
    steps: [
      { order: 1, label: 'Open fundability hub', detail: 'See personal and business lanes side by side.', route: '/fundability-readiness' },
      { order: 2, label: 'Pick your lane', detail: 'Personal restore or business EIN build.', route: '/fundability-readiness' },
      { order: 3, label: 'Start onboarding', detail: 'Create your file when ready.', route: '/onboarding' },
    ],
    relatedRoutes: ['/fundability-readiness'],
    relatedTourId: 'tour-fundability-readiness',
  },
  {
    id: 'sop-portal-templates',
    title: 'Build letter templates and reasons',
    lane: 'portal',
    audience: 'partner',
    whenToUse: 'Partner wants reusable dispute language before Letter Studio.',
    ownerRole: 'letter_ops_agent',
    steps: [
      { order: 1, label: 'Browse template vault', detail: 'Upload or pick saved letter scaffolds.', route: '/portal/templates' },
      { order: 2, label: 'Save dispute reasons', detail: 'Build factual reason packs for repeat use.', route: '/portal/templates?section=reasons' },
      { order: 3, label: 'Open Letter Studio', detail: 'Draft with your saved reasons attached.', route: '/portal/letters' },
    ],
    relatedRoutes: ['/portal/templates'],
    relatedTourId: 'tour-portal-dispute-letter',
  },
  {
    id: 'sop-portal-documents',
    title: 'Upload proof documents',
    lane: 'portal',
    audience: 'partner',
    whenToUse: 'Partner needs ID scans, bureau mail, or screenshots for disputes.',
    ownerRole: 'dispute_coach',
    steps: [
      { order: 1, label: 'Upload files', detail: 'Add ID, mail receipts, and bureau screenshots.', route: '/portal/documents' },
      { order: 2, label: 'Review vault', detail: 'Confirm each item is labeled and linked.', route: '/portal/documents' },
      { order: 3, label: 'Attach in Letter Studio', detail: 'Link proof before you export PDFs.', route: '/portal/letters' },
    ],
    relatedRoutes: ['/portal/documents'],
    relatedTourId: 'tour-portal-dispute-letter',
  },
  {
    id: 'sop-portal-tasks',
    title: 'Stay on top of follow-ups',
    lane: 'portal',
    audience: 'partner',
    whenToUse: 'Partner has mail dates, bureau deadlines, or staff-assigned work.',
    ownerRole: 'finely_advisor',
    steps: [
      { order: 1, label: 'Open My tasks', detail: 'See what is due next on your file.', route: '/portal/my-tasks' },
      { order: 2, label: 'Clear overdue items', detail: 'Handle past-due follow-ups first.', route: '/portal/my-tasks' },
      { order: 3, label: 'Open projects board', detail: 'See Kanban stages for your service bundle.', route: '/portal/projects' },
    ],
    relatedRoutes: ['/portal/my-tasks', '/portal/projects'],
    relatedTourId: 'tour-portal-my-tasks',
  },
  {
    id: 'sop-portal-calendar',
    title: 'Book a strategy call',
    lane: 'portal',
    audience: 'partner',
    whenToUse: 'Partner wants a strategy call or calendar invite.',
    ownerRole: 'appointment_setter',
    steps: [
      { order: 1, label: 'Pick a time slot', detail: 'Choose an open slot on the booking panel.', route: '/portal/calendar' },
      { order: 2, label: 'Add agenda notes', detail: 'Tell us what you want to cover.', route: '/portal/calendar' },
      { order: 3, label: 'Join video room', detail: 'Open My sessions when it is time.', route: '/portal/calendar' },
    ],
    relatedRoutes: ['/portal/calendar'],
    relatedTourId: 'tour-portal-calendar',
  },
  {
    id: 'sop-portal-education',
    title: 'Learn the playbook',
    lane: 'portal',
    audience: 'partner',
    whenToUse: 'Partner wants context before disputing or funding.',
    ownerRole: 'education_coach',
    steps: [
      { order: 1, label: 'Open curriculum', detail: 'Start with the three core tracks.', route: '/portal/education' },
      { order: 2, label: 'Read a field guide', detail: 'Pick a guide that matches your stage.', route: '/portal/education' },
      { order: 3, label: 'Apply in Disputes', detail: 'Use what you learned on your tradelines.', route: '/portal/disputes' },
    ],
    relatedRoutes: ['/portal/education'],
    relatedTourId: 'tour-portal-education',
  },
  {
    id: 'sop-portal-messages',
    title: 'Message your team or AI coach',
    lane: 'portal',
    audience: 'partner',
    whenToUse: 'Partner needs help, billing unlock, or specialist line.',
    ownerRole: 'support_specialist',
    steps: [
      { order: 1, label: 'Open Communication Hub', detail: 'AI coach and team threads live here.', route: '/portal/messages' },
      { order: 2, label: 'Pick AI or team tab', detail: 'Ask Finely for step help or message staff.', route: '/portal/messages?hub=ai' },
      { order: 3, label: 'Book if needed', detail: 'Jump to Calendar for a live session.', route: '/portal/calendar' },
    ],
    relatedRoutes: ['/portal/messages'],
    relatedTourId: 'tour-portal-messages',
  },
  {
    id: 'sop-admin-crm-pulse',
    title: 'Move hot leads in CRM',
    lane: 'admin',
    audience: 'admin',
    whenToUse: 'Inbound leads need follow-up or pipeline stage updates.',
    ownerRole: 'crm_intake_specialist',
    steps: [
      { order: 1, label: 'Open CRM workspace', detail: 'Review inbound and pipeline lanes.', route: '/admin/crm' },
      { order: 2, label: 'Work oldest hot lead', detail: 'Call or message the highest-intent prospect.', route: '/admin/crm' },
      { order: 3, label: 'Log next step', detail: 'Create a task or sequence follow-up.', route: '/admin/workflow' },
    ],
    relatedRoutes: ['/admin/crm', '/admin/leads'],
    relatedTourId: 'tour-admin-workflow',
  },
  {
    id: 'sop-admin-workflow-triage',
    title: 'Triage today\'s ops queue',
    lane: 'admin',
    audience: 'admin',
    whenToUse: 'Start of day — SLA breaches, tasks, CRM follow-ups.',
    ownerRole: 'ops_copilot',
    steps: [
      { order: 1, label: 'Open Ops command center', detail: 'Review triage briefing.', route: '/admin/workflow' },
      { order: 2, label: 'Handle SLA breaches first', detail: 'Assign or complete overdue items.', route: '/admin/workflow' },
      { order: 3, label: 'CRM pulse', detail: 'Move hot leads forward.', route: '/admin/crm' },
    ],
    relatedRoutes: ['/admin/workflow', '/admin/crm', '/admin/dashboard'],
    relatedTourId: 'tour-admin-workflow',
  },
  {
    id: 'sop-admin-go-live',
    title: 'Production go-live checklist',
    lane: 'admin',
    audience: 'admin',
    whenToUse: 'Before pointing Twilio, Supabase, or public light theme at production traffic.',
    ownerRole: 'ops_copilot',
    steps: [
      { order: 1, label: 'Open Go-live center', detail: 'Review pillars, wave audits, and terminal commands.', route: '/admin/launch-os#go-live' },
      { order: 2, label: 'Run wave rollup', detail: 'npm run launch:waves:audit — all closure gates 54–59.', route: '/admin/launch-os#go-live' },
      { order: 3, label: 'Deploy edge functions', detail: 'npm run deploy:functions — includes twilio-webhook.', route: '/admin/phone-hub' },
      { order: 4, label: 'Light theme spot-check', detail: 'Preview 9 priority routes, run theme:audit, then enable public light.', route: '/admin/settings?tab=appearance' },
      { order: 5, label: 'Human QA', detail: 'Mic + read aloud on Ask Finely; senior walkthrough sign-off.', route: '/start-here' },
    ],
    relatedRoutes: ['/admin/launch-os', '/admin/phone-hub', '/admin/settings', '/admin/monitoring'],
    relatedTourId: 'tour-admin-workflow',
    checklistItems: [
      'Supabase keys in .env.local',
      'TWILIO_AUTH_TOKEN secret on edge',
      'Twilio Console webhook URL pasted',
      'npm run launch:go-live passes',
    ],
  },
  {
    id: 'sop-affiliate-toolkit',
    title: 'Share your referral link',
    lane: 'affiliate',
    audience: 'affiliate',
    whenToUse: 'Affiliate is ready to promote Finely services.',
    ownerRole: 'affiliate_specialist',
    steps: [
      { order: 1, label: 'Open Affiliate Hub', detail: 'See your toolkit and links.', route: '/affiliate/hub' },
      { order: 2, label: 'Copy tracked link', detail: 'Use landing or onboarding link with your code.', route: '/affiliate/hub' },
      { order: 3, label: 'Estimate earnings', detail: 'Use commission calculator for scenarios.', route: '/affiliate/hub' },
    ],
    relatedRoutes: ['/affiliate/hub', '/affiliate'],
    relatedTourId: 'tour-affiliate-toolkit',
    complianceNotes: ['No income guarantees in marketing copy.'],
  },
  {
    id: 'sop-affiliate-denefits-pitch',
    title: 'Pitch Denefit contracts',
    lane: 'affiliate',
    audience: 'affiliate',
    whenToUse: 'Prospect may benefit from in-house Equifax-reporting contracts.',
    ownerRole: 'affiliate_specialist',
    steps: [
      { order: 1, label: 'Open Denefits tab', detail: 'Review calculator and story.', route: '/affiliate/hub' },
      { order: 2, label: 'Explain reporting path', detail: 'Educational — results vary.', route: '/affiliate/hub' },
      { order: 3, label: 'Message partnership line', detail: 'Ask ops for compliance review if unsure.', route: '/portal/messages' },
    ],
    relatedRoutes: ['/affiliate/hub'],
    relatedTourId: 'tour-affiliate-toolkit',
  },
  {
    id: 'sop-agent-client-file',
    title: 'Work a client file as specialist',
    lane: 'agent',
    audience: 'agent',
    whenToUse: 'Credit specialist managing assigned client disputes.',
    ownerRole: 'dispute_coach',
    steps: [
      { order: 1, label: 'Specialist Hub', detail: 'Review economics and capacity.', route: '/credit-specialist/hub' },
      { order: 2, label: 'Open client dashboard', detail: 'Select partner context if admin.', route: '/portal/dashboard' },
      { order: 3, label: 'Execute letter workflow', detail: 'Letters → evidence → mail log.', route: '/portal/letters' },
    ],
    relatedRoutes: ['/credit-specialist/hub', '/portal/dashboard'],
    relatedTourId: 'tour-agent-client-file',
  },
  {
    id: 'sop-business-vendor-stack',
    title: 'Build business vendor stack',
    lane: 'business',
    audience: 'partner',
    whenToUse: 'Business credit client sequencing tier-1 vendors.',
    ownerRole: 'funding_strategist',
    steps: [
      { order: 1, label: 'Business profile', detail: 'Complete entity and NAICS fields.', route: '/business/profile' },
      { order: 2, label: 'Vendor stack', detail: 'Follow sequenced vendor recommendations.', route: '/business/vendors' },
      { order: 3, label: 'Lender logic', detail: 'Model fit and next actions.', route: '/business/lender-logic' },
    ],
    relatedRoutes: ['/business/dashboard', '/business/profile'],
    relatedTourId: 'tour-business-vendors',
  },
  {
    id: 'sop-compliance-letter-gate',
    title: 'Compliance check before mailing',
    lane: 'compliance',
    audience: 'all',
    whenToUse: 'Before any dispute letter is marked mailed or sent.',
    ownerRole: 'compliance_agent',
    steps: [
      { order: 1, label: 'Evidence gate', detail: 'Required docs attached per policy.', route: '/portal/letters' },
      { order: 2, label: 'Language review', detail: 'Factual, educational tone — no legal threats.', route: '/portal/letters' },
      { order: 3, label: 'Identity vault', detail: 'ID docs on file when required.', route: '/portal/documents' },
    ],
    relatedRoutes: ['/portal/letters'],
    relatedTourId: 'tour-portal-dispute-letter',
    complianceNotes: ['Not legal advice. No guaranteed deletions.'],
  },
];

export function getPlatformSop(id: string): PlatformSop | null {
  return PLATFORM_SOP_LIBRARY.find((s) => s.id === id) ?? null;
}

export function listPlatformSopsByLane(lane: PlatformSopLane): PlatformSop[] {
  return PLATFORM_SOP_LIBRARY.filter((s) => s.lane === lane);
}

export function findPlatformSopForRoute(pathname: string): PlatformSop | null {
  const path = pathname.split('?')[0] ?? pathname;
  let best: PlatformSop | null = null;
  let bestLen = 0;
  for (const sop of PLATFORM_SOP_LIBRARY) {
    for (const r of sop.relatedRoutes) {
      if (path === r || (r !== '/' && path.startsWith(r))) {
        if (r.length >= bestLen) {
          best = sop;
          bestLen = r.length;
        }
      }
    }
  }
  return best;
}
