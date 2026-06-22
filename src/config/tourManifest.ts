import type { SiteTourDefinition } from '../domain/siteTourVideos';

function step(id: string, label: string, narration: string, path: string, selector?: string, highlightLabel?: string): SiteTourDefinition['steps'][0] {
  return {
    id,
    label,
    narrationPlain: narration,
    instructionLines: [narration, selector ? `Tap the highlighted "${highlightLabel ?? label}" button.` : 'Follow along on screen.'],
    action: selector ? 'click' : 'navigate',
    path,
    selector,
    highlightLabel: highlightLabel ?? label,
    waitMs: 800,
  };
}

export const TOUR_MANIFEST: SiteTourDefinition[] = [
  {
    id: 'tour-home-overview',
    title: 'What is Finely Cred? (2 minutes)',
    lane: 'public',
    auth: 'none',
    startPath: '/',
    relatedSopId: 'sop-public-start-here',
    steps: [
      step('s1', 'Welcome', 'Finely Cred helps you fix credit and get funding-ready with a clear step-by-step system.', '/'),
      step('s2', 'Start Here', 'Tap Start Here to pick your path — fix credit, refer people, or staff login.', '/start-here'),
      step('s3', 'Resources', 'Free guides and monitoring links live under Resources.', '/resources'),
    ],
  },
  {
    id: 'tour-resources-monitoring',
    title: 'How to pick a monitoring service',
    lane: 'public',
    auth: 'none',
    startPath: '/resources',
    relatedSopId: 'sop-public-monitoring-links',
    steps: [
      step('s1', 'Open Resources', 'This page has guides, monitoring links, and videos.', '/resources'),
      step('s2', 'Monitoring section', 'Scroll to Credit monitoring tools. You will see four options.', '/resources#monitoring'),
      step('s3', 'HTML-friendly', 'MyScoreIQ, IdentityIQ, and SmartCredit work best for HTML upload in the portal.', '/resources#monitoring'),
    ],
  },
  {
    id: 'tour-portal-upload-report',
    title: 'How to upload your credit report',
    lane: 'portal',
    auth: 'partner',
    startPath: '/portal/reports',
    relatedSopId: 'sop-portal-upload-report',
    steps: [
      step('s1', 'Reports page', 'Open Reports from your dashboard menu.', '/portal/reports'),
      step('s2', 'Upload file', 'Click Upload and choose your HTML or PDF export.', '/portal/reports', '[data-fc-report-upload] input[type=file]', 'Choose file'),
      step('s3', 'Review results', 'After upload, review scores and tradelines in Credit intel.', '/portal/reports', '[data-fc-hub-tab="reports"]', 'Credit intel'),
    ],
  },
  {
    id: 'tour-portal-dispute-letter',
    title: 'How to write a dispute letter',
    lane: 'portal',
    auth: 'partner',
    startPath: '/portal/disputes',
    relatedSopId: 'sop-portal-dispute-letter',
    steps: [
      step('s1', 'Disputes', 'See items that may need a dispute.', '/portal/disputes'),
      step('s2', 'Letters', 'Open Letter Studio to draft your letter.', '/portal/letters'),
      step('s3', 'Evidence', 'Attach proof documents before you mail.', '/portal/documents'),
    ],
  },
  {
    id: 'tour-portal-billing',
    title: 'How to pay your bill',
    lane: 'portal',
    auth: 'partner',
    startPath: '/portal/billing',
    relatedSopId: 'sop-portal-billing',
    steps: [
      step('s1', 'Billing page', 'See your plan and payment status here.', '/portal/billing'),
      step('s2', 'Update card', 'Use the payment button to update your card.', '/portal/billing'),
    ],
  },
  {
    id: 'tour-admin-partners',
    title: 'How to open a customer file',
    lane: 'admin',
    auth: 'admin',
    startPath: '/admin/partners',
    relatedSopId: 'sop-admin-create-partner',
    steps: [
      step('s1', 'Partner list', 'All customers appear in Partner Management.', '/admin/partners'),
      step('s2', 'Click a card', 'Click the customer name to open their full file.', '/admin/partners'),
      step('s3', 'Create new', 'Use Create partner tab to add someone new.', '/admin/partners'),
    ],
  },
  {
    id: 'tour-admin-workflow',
    title: 'How to triage today\'s work',
    lane: 'admin',
    auth: 'admin',
    startPath: '/admin/workflow',
    relatedSopId: 'sop-admin-workflow-triage',
    steps: [
      step('s1', 'Ops center', 'Start here each day for alerts and tasks.', '/admin/workflow'),
      step('s2', 'CRM', 'Move hot leads from the CRM tab.', '/admin/crm'),
    ],
  },
  {
    id: 'tour-affiliate-toolkit',
    title: 'How to share your referral link',
    lane: 'affiliate',
    auth: 'partner',
    startPath: '/affiliate/hub',
    relatedSopId: 'sop-affiliate-toolkit',
    steps: [
      step('s1', 'Affiliate Hub', 'Your links and tools are on this page.', '/affiliate/hub'),
      step('s2', 'Copy link', 'Copy a tracked link and share it with your audience.', '/affiliate/hub'),
    ],
  },
  {
    id: 'tour-onboarding-start',
    title: 'How to create your account',
    lane: 'public',
    auth: 'none',
    startPath: '/onboarding',
    relatedSopId: 'sop-public-start-here',
    steps: [
      step('s1', 'Onboarding', 'Follow each step to create your account.', '/onboarding'),
      step('s2', 'Monitoring', 'Pick a monitoring partner for HTML exports — optional but recommended.', '/onboarding'),
      step('s3', 'Dashboard', 'When done, you land in your dashboard with next steps.', '/portal/dashboard'),
    ],
  },
  {
    id: 'tour-personal-credit',
    title: 'Personal credit packages explained',
    lane: 'public',
    auth: 'none',
    startPath: '/personal-credit',
    relatedSopId: 'sop-public-personal-credit',
    steps: [
      step('s1', 'Packages tab', 'Compare restore and platinum packages.', '/personal-credit'),
      step('s2', 'Start intake', 'Tap Start intake when you are ready.', '/onboarding'),
    ],
  },
  {
    id: 'tour-agent-client-file',
    title: 'Work a customer file as specialist',
    lane: 'agent',
    auth: 'partner',
    startPath: '/credit-specialist/hub',
    relatedSopId: 'sop-agent-client-file',
    steps: [
      step('s1', 'Specialist Hub', 'Review economics and your capacity.', '/credit-specialist/hub'),
      step('s2', 'Customer dashboard', 'Open the partner dashboard for your assigned customer.', '/portal/dashboard'),
      step('s3', 'Letter Studio', 'Execute the letter and evidence workflow.', '/portal/letters'),
    ],
  },
  {
    id: 'tour-business-vendors',
    title: 'Build your business vendor stack',
    lane: 'business',
    auth: 'partner',
    startPath: '/business/dashboard',
    relatedSopId: 'sop-business-vendor-stack',
    steps: [
      step('s1', 'Business dashboard', 'See your EIN build progress and lanes.', '/business/dashboard'),
      step('s2', 'Business profile', 'Complete entity and NAICS fields.', '/business/profile'),
      step('s3', 'Vendor stack', 'Follow tier-1 vendor sequencing.', '/business/vendors'),
    ],
  },
  {
    id: 'tour-portal-calendar',
    title: 'Book a strategy call',
    lane: 'portal',
    auth: 'partner',
    startPath: '/portal/calendar',
    relatedSopId: 'sop-portal-calendar',
    steps: [
      step('s1', 'Calendar', 'Open Calendar from your portal menu.', '/portal/calendar'),
      step('s2', 'Pick a slot', 'Choose an open time on the booking panel.', '/portal/calendar'),
      step('s3', 'My sessions', 'Join your video room when it is time.', '/portal/calendar'),
    ],
  },
  {
    id: 'tour-portal-education',
    title: 'Learn the credit playbook',
    lane: 'portal',
    auth: 'partner',
    startPath: '/portal/education',
    relatedSopId: 'sop-portal-education',
    steps: [
      step('s1', 'Education library', 'Curriculum and field guides live here.', '/portal/education'),
      step('s2', 'Field guides', 'Pick a guide that matches your stage.', '/portal/education'),
      step('s3', 'Apply it', 'Use what you learned in Dispute Center.', '/portal/disputes'),
    ],
  },
  {
    id: 'tour-portal-messages',
    title: 'Use the Communication Hub',
    lane: 'portal',
    auth: 'partner',
    startPath: '/portal/messages',
    relatedSopId: 'sop-portal-messages',
    steps: [
      step('s1', 'Communication Hub', 'AI coach and team threads are here.', '/portal/messages'),
      step('s2', 'Ask Finely', 'Open the AI tab for step-by-step help.', '/portal/messages?hub=ai'),
      step('s3', 'Book live help', 'Jump to Calendar if you need a call.', '/portal/calendar'),
    ],
  },
  {
    id: 'tour-portal-my-tasks',
    title: 'Stay on top of follow-ups',
    lane: 'portal',
    auth: 'partner',
    startPath: '/portal/my-tasks',
    relatedSopId: 'sop-portal-tasks',
    steps: [
      step('s1', 'My tasks', 'See what is due next on your file.', '/portal/my-tasks'),
      step('s2', 'Clear overdue', 'Handle past-due follow-ups before new work.', '/portal/my-tasks'),
      step('s3', 'Projects board', 'Open Kanban stages for your service bundle.', '/portal/projects'),
    ],
  },
  {
    id: 'tour-fundability-readiness',
    title: 'Check fundability readiness',
    lane: 'public',
    auth: 'none',
    startPath: '/fundability-readiness',
    relatedSopId: 'sop-public-fundability',
    steps: [
      step('s1', 'Fundability hub', 'Personal and business funding readiness live on one page.', '/fundability-readiness'),
      step('s2', 'Pick your lane', 'Use the tabs for personal restore or business EIN build.', '/fundability-readiness'),
      step('s3', 'Start onboarding', 'Create your file when you are ready to move forward.', '/onboarding?lane=funding_readiness'),
    ],
  },
];

export function getTourById(id: string): SiteTourDefinition | null {
  return TOUR_MANIFEST.find((t) => t.id === id) ?? null;
}

export function findTourForPath(pathname: string): SiteTourDefinition | null {
  const path = pathname.split('?')[0] ?? pathname;
  let best: SiteTourDefinition | null = null;
  let bestLen = 0;
  for (const tour of TOUR_MANIFEST) {
    const start = tour.startPath.split('?')[0] ?? tour.startPath;
    if (path === start || (start !== '/' && path.startsWith(start))) {
      if (start.length >= bestLen) {
        best = tour;
        bestLen = start.length;
      }
    }
  }
  return best;
}

export function listToursByLane(lane: SiteTourDefinition['lane']): SiteTourDefinition[] {
  return TOUR_MANIFEST.filter((t) => t.lane === lane);
}
