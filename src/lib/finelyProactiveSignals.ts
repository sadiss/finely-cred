/**
 * Proactive signals (Launch Part E3) — "Finely noticed…" next-best-action.
 * Pure functions over cheap state the dashboards already have. No fabrication:
 * every item maps to a real gap in the file/ops with one obvious button.
 */

import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../config/publicMediaPolicy';

export type FinelyNoticedTone = 'info' | 'warn' | 'success';

export type FinelyNoticedItem = {
  id: string;
  tone: FinelyNoticedTone;
  /** Plain-English, grade-6 sentence */
  text: string;
  actionLabel: string;
  to: string;
};

export type PortalSignalInput = {
  reportsCount: number;
  lettersCount: number;
  openCasesCount: number;
  evidenceCount: number;
  overallScore?: number | null;
};

/** Next-best-actions for the partner portal dashboard. Ordered by urgency. */
export function buildPortalNoticedItems(input: PortalSignalInput): FinelyNoticedItem[] {
  const items: FinelyNoticedItem[] = [];

  if (input.reportsCount === 0) {
    items.push({
      id: 'no-report',
      tone: 'warn',
      text: 'We do not see a credit report yet. Upload one so we can find items to fix.',
      actionLabel: 'Upload report',
      to: '/portal/reports',
    });
  } else if (input.openCasesCount === 0) {
    items.push({
      id: 'review-items',
      tone: 'info',
      text: 'Your report is in. Let us look for items you can dispute.',
      actionLabel: 'Review items',
      to: '/portal/disputes',
    });
  }

  if (input.openCasesCount > 0 && input.lettersCount === 0) {
    items.push({
      id: 'first-letter',
      tone: 'info',
      text: 'You have items to dispute. Write your first letter now.',
      actionLabel: 'Open Letter Studio',
      to: '/portal/letters',
    });
  }

  if (input.lettersCount > 0 && input.evidenceCount === 0) {
    items.push({
      id: 'attach-proof',
      tone: 'warn',
      text: 'Attach proof documents before you mail your letters.',
      actionLabel: 'Upload documents',
      to: '/portal/documents',
    });
  }

  if (!items.length) {
    items.push({
      id: 'keep-moving',
      tone: 'success',
      text: 'Great progress. Keep your disputes moving and check follow-ups.',
      actionLabel: 'Open tasks',
      to: '/portal/projects',
    });
  }

  return items.slice(0, 3);
}

export type DisputesSignalInput = {
  hasReport: boolean;
  needsDisputingCount: number;
  lettersCount: number;
  evidenceMissingForDisputes: boolean;
};

export function buildDisputesNoticedItems(input: DisputesSignalInput): FinelyNoticedItem[] {
  if (!input.hasReport) {
    return [
      {
        id: 'disputes-no-report',
        tone: 'warn',
        text: 'Upload a credit report first. Dispute Center needs tradelines to review.',
        actionLabel: 'Upload report',
        to: '/portal/reports',
      },
    ];
  }
  if (input.needsDisputingCount > 0 && input.lettersCount === 0) {
    return [
      {
        id: 'disputes-ready',
        tone: 'info',
        text: `${input.needsDisputingCount} item${input.needsDisputingCount === 1 ? '' : 's'} may need a dispute. Open Letter Studio next.`,
        actionLabel: 'Letter Studio',
        to: '/portal/letters',
      },
    ];
  }
  if (input.evidenceMissingForDisputes) {
    return [
      {
        id: 'disputes-evidence',
        tone: 'warn',
        text: 'Some dispute items still need proof documents before you mail.',
        actionLabel: 'Upload proof',
        to: '/portal/documents',
      },
    ];
  }
  return [
    {
      id: 'disputes-track',
      tone: 'success',
      text: 'Disputes are tracked. Check tasks for mail dates and follow-ups.',
      actionLabel: 'Open tasks',
      to: '/portal/my-tasks',
    },
  ];
}

export type EducationSignalInput = {
  journeyStage?: string | null;
  guidesCount: number;
};

export function buildEducationNoticedItems(input: EducationSignalInput): FinelyNoticedItem[] {
  const stage = input.journeyStage ?? 'intake';
  if (stage === 'intake' || stage === 'report_upload') {
    return [
      {
        id: 'edu-upload',
        tone: 'info',
        text: 'Start with the curriculum, then upload your report when ready.',
        actionLabel: 'Reports',
        to: '/portal/reports',
      },
    ];
  }
  if (stage === 'letters' || stage === 'evidence') {
    return [
      {
        id: 'edu-letters',
        tone: 'info',
        text: 'Use field guides while you draft factual dispute language.',
        actionLabel: 'Letter Studio',
        to: '/portal/letters',
      },
    ];
  }
  return [
    {
      id: 'edu-explore',
      tone: 'success',
      text: `${input.guidesCount} field guides are available. Pick one that matches your stage.`,
      actionLabel: 'Browse guides',
      to: '/portal/education',
    },
  ];
}

export type CrmSignalInput = {
  recordsInPipeline: number;
};

export type LettersSignalInput = {
  reportsCount: number;
  casesCount: number;
  lettersCount: number;
};

/** Letter Studio — report → draft → vault nudges. */
export function buildLettersNoticedItems(input: LettersSignalInput): FinelyNoticedItem[] {
  if (input.reportsCount === 0) {
    return [
      {
        id: 'letters-no-report',
        tone: 'warn',
        text: 'Upload a credit report before you draft dispute letters.',
        actionLabel: 'Upload report',
        to: '/portal/reports',
      },
    ];
  }
  if (input.casesCount > 0 && input.lettersCount === 0) {
    return [
      {
        id: 'letters-draft',
        tone: 'info',
        text: 'You have dispute items ready. Build your first letter in the studio.',
        actionLabel: 'Start draft',
        to: '/portal/letters',
      },
    ];
  }
  if (input.lettersCount > 0) {
    return [
      {
        id: 'letters-proof',
        tone: 'info',
        text: 'Attach proof in Documents before you export and mail your letters.',
        actionLabel: 'Upload proof',
        to: '/portal/documents',
      },
    ];
  }
  return [
    {
      id: 'letters-disputes',
      tone: 'info',
      text: 'Review tradelines in Dispute Center, then return here to draft.',
      actionLabel: 'Dispute center',
      to: '/portal/disputes',
    },
  ];
}

export type DocumentsSignalInput = {
  evidenceCount: number;
  idGateOk: boolean;
  lettersCount: number;
};

/** Documents vault — upload → label → attach in letters. */
export function buildDocumentsNoticedItems(input: DocumentsSignalInput): FinelyNoticedItem[] {
  if (!input.idGateOk) {
    return [
      {
        id: 'docs-id',
        tone: 'warn',
        text: 'Upload a government ID scan before mailing dispute letters.',
        actionLabel: 'Upload ID',
        to: '/portal/documents',
      },
    ];
  }
  if (input.evidenceCount === 0) {
    return [
      {
        id: 'docs-empty',
        tone: 'warn',
        text: 'Your proof vault is empty. Add bureau mail, receipts, and screenshots.',
        actionLabel: 'Upload files',
        to: '/portal/documents',
      },
    ];
  }
  if (input.lettersCount === 0) {
    return [
      {
        id: 'docs-letters',
        tone: 'info',
        text: 'Proof is on file. Open Letter Studio to link files before you mail.',
        actionLabel: 'Letter Studio',
        to: '/portal/letters',
      },
    ];
  }
  return [
    {
      id: 'docs-linked',
      tone: 'success',
      text: 'Vault looks good. Confirm each file is labeled and linked in Letter Studio.',
      actionLabel: 'Letter Studio',
      to: '/portal/letters',
    },
  ];
}

export type BillingSignalInput = {
  trialActive: boolean;
  activeModuleCount: number;
  billingStatus?: string | null;
};

/** Billing — trial, checkout, and module access nudges. */
export function buildBillingNoticedItems(input: BillingSignalInput): FinelyNoticedItem[] {
  if (input.trialActive) {
    return [
      {
        id: 'billing-trial',
        tone: 'info',
        text: 'Your free trial is active. Upgrade before it ends to keep portal access.',
        actionLabel: 'View plans',
        to: '/portal/billing',
      },
    ];
  }
  if (input.activeModuleCount === 0) {
    return [
      {
        id: 'billing-unlock',
        tone: 'warn',
        text: 'No modules unlocked yet. Pick a plan to open reports, letters, and disputes.',
        actionLabel: 'Open checkout',
        to: '/portal/checkout',
      },
    ];
  }
  if (input.billingStatus === 'past_due' || input.billingStatus === 'delinquent') {
    return [
      {
        id: 'billing-past-due',
        tone: 'warn',
        text: 'Payment needs attention. Update your card so modules stay unlocked.',
        actionLabel: 'Update billing',
        to: '/portal/billing',
      },
    ];
  }
  return [
    {
      id: 'billing-ok',
      tone: 'success',
      text: 'Billing looks current. Review module access if a feature feels locked.',
      actionLabel: 'Module access',
      to: '/portal/billing',
    },
  ];
}

export type FundabilitySignalInput = {
  tab: string;
};

/** Public fundability hub — lane picker nudges. */
export function buildFundabilityNoticedItems(input: FundabilitySignalInput): FinelyNoticedItem[] {
  if (input.tab === 'personal') {
    return [
      {
        id: 'fund-personal',
        tone: 'info',
        text: 'Personal restore starts with a report upload and dispute workflow.',
        actionLabel: 'Personal credit',
        to: '/personal-credit',
      },
    ];
  }
  if (input.tab === 'business') {
    return [
      {
        id: 'fund-business',
        tone: 'info',
        text: 'Business fundability needs EIN hygiene and a tier-1 vendor stack.',
        actionLabel: 'Business dashboard',
        to: '/business/dashboard',
      },
    ];
  }
  if (input.tab === 'roadmap') {
    return [
      {
        id: 'fund-roadmap',
        tone: 'info',
        text: 'Follow the 90-day sprint, then book a strategy call to review your file.',
        actionLabel: 'Book strategy call',
        to: '/enlightenment-session?focus=funding',
      },
    ];
  }
  return [
    {
      id: 'fund-start',
      tone: 'info',
      text: 'Pick personal or business lane, then start onboarding when you are ready.',
      actionLabel: 'Start onboarding',
      to: '/onboarding?lane=funding_readiness',
    },
  ];
}

export function buildCrmNoticedItems(input: CrmSignalInput): FinelyNoticedItem[] {
  if (input.recordsInPipeline === 0) {
    return [
      {
        id: 'crm-empty',
        tone: 'info',
        text: 'Pipeline is empty. Capture a lead or import from Leads OS.',
        actionLabel: 'Leads OS',
        to: '/admin/leads',
      },
    ];
  }
  return [
    {
      id: 'crm-work',
      tone: 'info',
      text: `${input.recordsInPipeline} deal${input.recordsInPipeline === 1 ? '' : 's'} in view. Move the hottest one forward today.`,
      actionLabel: 'Ops queue',
      to: '/admin/workflow',
    },
  ];
}

export type PortalWorkSignalInput = {
  overdueTasks: number;
  openTasks: number;
  projectsCount: number;
};

/** Work OS — projects and task queue nudges. */
export function buildPortalWorkNoticedItems(input: PortalWorkSignalInput): FinelyNoticedItem[] {
  const items: FinelyNoticedItem[] = [];

  if (input.overdueTasks > 0) {
    items.push({
      id: 'overdue-tasks',
      tone: 'warn',
      text: `${input.overdueTasks} task${input.overdueTasks === 1 ? '' : 's'} past due. Handle these before new work.`,
      actionLabel: 'View overdue',
      to: '/portal/my-tasks',
    });
  } else if (input.openTasks > 0) {
    items.push({
      id: 'open-tasks',
      tone: 'info',
      text: `You have ${input.openTasks} open task${input.openTasks === 1 ? '' : 's'}. Stay current so nothing slips.`,
      actionLabel: 'Open tasks',
      to: '/portal/my-tasks',
    });
  }

  if (input.projectsCount === 0) {
    items.push({
      id: 'no-projects',
      tone: 'info',
      text: 'No project board yet. Your service bundle will create one — check back after onboarding.',
      actionLabel: 'Dashboard',
      to: '/portal/dashboard',
    });
  }

  if (!items.length) {
    items.push({
      id: 'work-clear',
      tone: 'success',
      text: 'Task queue looks good. Keep dispute follow-ups on schedule.',
      actionLabel: 'Dispute center',
      to: '/portal/disputes',
    });
  }

  return items.slice(0, 3);
}

export type CalendarSignalInput = {
  upcomingCount: number;
};

export type MessagesSignalInput = {
  hubTab: string;
  journeyStage?: string | null;
  isSpecialist: boolean;
};

/** Communication Hub — AI coach vs live help nudges. */
export function buildMessagesNoticedItems(input: MessagesSignalInput): FinelyNoticedItem[] {
  if (input.isSpecialist && input.hubTab !== 'team') {
    return [
      {
        id: 'messages-specialist-team',
        tone: 'info',
        text: 'Credit Specialist threads live in Team chat. Keep program questions there.',
        actionLabel: 'Team chat',
        to: '/portal/messages?hub=team',
      },
    ];
  }
  if (!input.isSpecialist && input.hubTab !== 'ai') {
    return [
      {
        id: 'messages-ai',
        tone: 'info',
        text: 'Open the AI coach when you need step-by-step help on disputes or documents.',
        actionLabel: 'AI coach',
        to: '/portal/messages?hub=ai',
      },
    ];
  }
  if (input.journeyStage === 'intake' || input.journeyStage === 'report_upload') {
    return [
      {
        id: 'messages-report',
        tone: 'warn',
        text: 'Upload your credit report so the coach and team can help with real tradelines.',
        actionLabel: 'Upload report',
        to: '/portal/reports',
      },
    ];
  }
  if (input.hubTab !== 'meetings') {
    return [
      {
        id: 'messages-book',
        tone: 'info',
        text: 'Book a live strategy call if you want hands-on help between disputes.',
        actionLabel: 'Book session',
        to: '/portal/calendar',
      },
    ];
  }
  return [
    {
      id: 'messages-clear',
      tone: 'success',
      text: 'Threads and meetings are in one place. Check tasks for mail dates and follow-ups.',
      actionLabel: 'Open tasks',
      to: '/portal/my-tasks',
    },
  ];
}

export function buildCalendarNoticedItems(input: CalendarSignalInput): FinelyNoticedItem[] {
  if (input.upcomingCount === 0) {
    return [
      {
        id: 'book-session',
        tone: 'info',
        text: 'No sessions booked yet. Pick a time for a free strategy call.',
        actionLabel: 'Book session',
        to: '/portal/calendar',
      },
    ];
  }
  return [
    {
      id: 'session-soon',
      tone: 'success',
      text: `You have ${input.upcomingCount} upcoming session${input.upcomingCount === 1 ? '' : 's'}. Open My sessions when it is time.`,
      actionLabel: 'My sessions',
      to: '/portal/calendar',
    },
  ];
}

export type AgentSignalInput = {
  managedClients: number;
  openTasks: number;
  hasOperatingModel: boolean;
};

export function buildAgentNoticedItems(input: AgentSignalInput): FinelyNoticedItem[] {
  const items: FinelyNoticedItem[] = [];

  if (input.openTasks > 0) {
    items.push({
      id: 'agent-tasks',
      tone: 'warn',
      text: `${input.openTasks} open task${input.openTasks === 1 ? '' : 's'} on your file. Clear these before taking new clients.`,
      actionLabel: 'My tasks',
      to: '/portal/my-tasks',
    });
  }

  if (input.managedClients === 0) {
    items.push({
      id: 'no-clients',
      tone: 'info',
      text: 'No assigned client files yet. Use Growth to share your specialist link.',
      actionLabel: 'Growth tab',
      to: '/credit-specialist/hub?tab=growth',
    });
  } else if (!input.hasOperatingModel) {
    items.push({
      id: 'save-model',
      tone: 'info',
      text: 'Save your operating model so splits and capacity stay accurate.',
      actionLabel: 'Setup tab',
      to: '/credit-specialist/hub?tab=setup',
    });
  }

  if (!items.length) {
    items.push({
      id: 'agent-go',
      tone: 'success',
      text: 'Hub is ready. Open a client dashboard and run the letter workflow.',
      actionLabel: 'Client dashboard',
      to: '/portal/dashboard',
    });
  }

  return items.slice(0, 3);
}

export type AdminSignalInput = {
  slaBreaches: number;
  partnersWithoutReports: number;
  openCases: number;
  autopilotSuggestions?: number;
  validationClocks?: number;
  disputeFollowUps?: number;
  goLiveBlocked?: number;
};

/** Next-best-actions for the admin dashboard / ops command center. */
export function buildAdminNoticedItems(input: AdminSignalInput): FinelyNoticedItem[] {
  const items: FinelyNoticedItem[] = [];

  if (input.slaBreaches > 0) {
    items.push({
      id: 'sla',
      tone: 'warn',
      text: `${input.slaBreaches} item${input.slaBreaches === 1 ? '' : 's'} past the response window. Handle these first.`,
      actionLabel: 'Open ops queue',
      to: '/admin/workflow',
    });
  }

  if ((input.validationClocks ?? 0) > 0) {
    items.push({
      id: 'validation-clocks',
      tone: 'warn',
      text: `${input.validationClocks} validation or summons clock${input.validationClocks === 1 ? '' : 's'} need action — validation-first doctrine.`,
      actionLabel: 'View clocks',
      to: '/admin/workflow',
    });
  }

  if ((input.goLiveBlocked ?? 0) > 0) {
    items.push({
      id: 'go-live-blocked',
      tone: 'warn',
      text: `${input.goLiveBlocked} production go-live pillar(s) blocked — Supabase keys and deploy steps needed.`,
      actionLabel: 'Production sequencer',
      to: '/admin/launch-os#production-sequencer',
    });
  }

  if ((input.disputeFollowUps ?? 0) > 0) {
    items.push({
      id: 'dispute-followups',
      tone: 'info',
      text: `${input.disputeFollowUps} dispute case${input.disputeFollowUps === 1 ? '' : 's'} need mail or bureau window follow-up.`,
      actionLabel: 'Open triage',
      to: '/admin/workflow',
    });
  }

  if (input.partnersWithoutReports > 0) {
    items.push({
      id: 'no-report-partners',
      tone: 'info',
      text: `${input.partnersWithoutReports} client${input.partnersWithoutReports === 1 ? '' : 's'} have no report on file. Nudge or upload for them.`,
      actionLabel: 'View partners',
      to: '/admin/partners',
    });
  }

  if ((input.autopilotSuggestions ?? 0) > 0) {
    items.push({
      id: 'autopilot',
      tone: 'info',
      text: `${input.autopilotSuggestions} autopilot action${input.autopilotSuggestions === 1 ? '' : 's'} waiting for your approval.`,
      actionLabel: 'Review autopilot',
      to: '/admin/ops-autopilot',
    });
  }

  if (!items.length) {
    items.push({
      id: 'all-clear',
      tone: 'success',
      text: 'No breaches right now. Move hot leads forward in the CRM.',
      actionLabel: 'Open CRM',
      to: '/admin/crm',
    });
  }

  return items.slice(0, 3);
}

export type PersonalCreditSignalInput = {
  tab: string;
};

/** Public personal credit lane — package vs intake nudges. */
export function buildPersonalCreditNoticedItems(input: PersonalCreditSignalInput): FinelyNoticedItem[] {
  if (input.tab === 'packages') {
    return [
      {
        id: 'pc-compare',
        tone: 'info',
        text: 'Compare restore vs platinum, then start intake when you pick a lane.',
        actionLabel: 'Start intake',
        to: '/onboarding',
      },
    ];
  }
  if (input.tab === 'funding') {
    return [
      {
        id: 'pc-funding',
        tone: 'info',
        text: 'Funding handoff works best after your file hits readiness milestones.',
        actionLabel: 'Fundability hub',
        to: '/fundability-readiness',
      },
    ];
  }
  if (input.tab === 'platform') {
    return [
      {
        id: 'pc-monitoring',
        tone: 'info',
        text: 'Set up tri-merge monitoring before you upload your first report.',
        actionLabel: 'Monitoring partners',
        to: '/resources#monitoring',
      },
    ];
  }
  return [
    {
      id: 'pc-start',
      tone: 'info',
      text: 'Most people start with a package review, then open onboarding.',
      actionLabel: 'View packages',
      to: '/personal-credit',
    },
  ];
}

export type ResourcesSignalInput = {
  section: string;
};

export type OnboardingMonitoringSignalInput = {
  synced: boolean;
};

/** Onboarding BureauSync — monitoring partner nudges. */
export function buildOnboardingMonitoringNoticedItems(input: OnboardingMonitoringSignalInput): FinelyNoticedItem[] {
  if (input.synced) {
    return [
      {
        id: 'onboard-mon-synced',
        tone: 'success',
        text: 'Partner link opened. Upload your HTML report in the portal when the export is ready.',
        actionLabel: 'Resources',
        to: '/resources#monitoring',
      },
    ];
  }
  return [
    {
      id: 'onboard-mon-pick',
      tone: 'info',
      text: 'Pick MyScoreIQ, IdentityIQ, or SmartCredit — HTML exports parse best in your portal.',
      actionLabel: 'Compare partners',
      to: '/resources#monitoring',
    },
  ];
}

/** Public resources — guides vs monitoring vs videos. */
export function buildResourcesNoticedItems(input: ResourcesSignalInput): FinelyNoticedItem[] {
  if (input.section === 'monitoring') {
    return [
      {
        id: 'res-monitoring',
        tone: 'info',
        text: 'Pick an HTML-friendly monitor so portal upload parses cleanly.',
        actionLabel: 'Start onboarding',
        to: '/onboarding',
      },
    ];
  }
  if (input.section === 'videos') {
    return [
      {
        id: 'res-videos',
        tone: 'info',
        text: 'Watch a tour, then jump to the page it covers from Help Center.',
        actionLabel: 'Help center',
        to: '/help-center',
      },
    ];
  }
  if (input.section === 'references') {
    return [
      {
        id: 'res-refs',
        tone: 'info',
        text: 'Use quick references while you work disputes in the portal.',
        actionLabel: 'Personal credit',
        to: '/personal-credit',
      },
    ];
  }
  return [
    {
      id: 'res-guides',
      tone: 'info',
      text: 'Download a free guide, then upload your report when ready.',
      actionLabel: 'Free dispute guide',
      to: '/free-guide',
    },
  ];
}

/** Start Here — default path nudge for new visitors. */
export function buildStartHereNoticedItems(): FinelyNoticedItem[] {
  return [
    {
      id: 'start-fix-credit',
      tone: 'info',
      text: 'Most visitors want to fix credit first — packages and onboarding are one click away.',
      actionLabel: 'Personal credit',
      to: '/personal-credit',
    },
  ];
}

export type BusinessSignalInput = {
  tab: string;
  workflowStepsComplete: number;
  workflowStepsTotal: number;
};

/** Business dashboard — profile vs vendor sequencing. */
export function buildBusinessNoticedItems(input: BusinessSignalInput): FinelyNoticedItem[] {
  if (input.workflowStepsComplete < 1) {
    return [
      {
        id: 'biz-profile',
        tone: 'warn',
        text: 'Complete your business profile and EIN fields before vendor sequencing.',
        actionLabel: 'Business profile',
        to: '/business/profile',
      },
    ];
  }
  if (input.tab === 'readiness' || input.workflowStepsComplete < 2) {
    return [
      {
        id: 'biz-vendors',
        tone: 'info',
        text: 'Follow tier-1 vendor order — do not skip reporting sequence.',
        actionLabel: 'Vendor stack',
        to: '/business/vendors',
      },
    ];
  }
  return [
    {
      id: 'biz-lender',
      tone: 'success',
      text: 'Foundation looks solid. Review lender logic when your file is green.',
      actionLabel: 'Lender logic',
      to: '/business/lender-logic',
    },
  ];
}

export type AffiliateSignalInput = {
  hasReferralCode: boolean;
  tab: string;
};

/** Affiliate hub — referral link and toolkit nudges. */
export function buildAffiliateNoticedItems(input: AffiliateSignalInput): FinelyNoticedItem[] {
  if (!input.hasReferralCode) {
    return [
      {
        id: 'aff-code',
        tone: 'warn',
        text: 'Generate your referral link first — every share should be tracked.',
        actionLabel: 'Operate tab',
        to: '/affiliate/hub?tab=operate',
      },
    ];
  }
  if (input.tab === 'denefits') {
    return [
      {
        id: 'aff-denefits',
        tone: 'info',
        text: 'Explain Denefit reporting paths clearly — outcomes vary by file.',
        actionLabel: 'Training',
        to: '/affiliate/hub?tab=training',
      },
    ];
  }
  return [
    {
      id: 'aff-share',
      tone: 'success',
      text: 'Link is ready. Copy your toolkit and share the public application page.',
      actionLabel: 'Share application',
      to: '/affiliate',
    },
  ];
}

export type TemplatesSignalInput = {
  vaultCount: number;
  savedReasonCount: number;
  section: string;
};

/** Template library — reasons before Letter Studio. */
export function buildTemplatesNoticedItems(input: TemplatesSignalInput): FinelyNoticedItem[] {
  if (input.savedReasonCount === 0 && input.section !== 'reasons') {
    return [
      {
        id: 'tpl-reasons',
        tone: 'info',
        text: 'Save dispute reasons here so Letter Studio drafts stay factual and repeatable.',
        actionLabel: 'Reasons library',
        to: '/portal/templates?section=reasons',
      },
    ];
  }
  if (input.vaultCount === 0) {
    return [
      {
        id: 'tpl-vault',
        tone: 'info',
        text: 'Upload or pick a template scaffold before you open Letter Studio.',
        actionLabel: 'My templates',
        to: '/portal/templates?section=vault',
      },
    ];
  }
  return [
    {
      id: 'tpl-studio',
      tone: 'success',
      text: 'Templates and reasons are in place. Draft your next letter in the studio.',
      actionLabel: 'Letter Studio',
      to: '/portal/letters',
    },
  ];
}

export type PartnersAdminSignalInput = {
  partnerCount: number;
  hubTab: string;
};

/** Admin partner directory — create vs triage. */
export function buildPartnersAdminNoticedItems(input: PartnersAdminSignalInput): FinelyNoticedItem[] {
  if (input.hubTab === 'create') {
    return [
      {
        id: 'adm-create',
        tone: 'info',
        text: 'After creating a partner, send the claim link so they can set a password.',
        actionLabel: 'Ops queue',
        to: '/admin/workflow',
      },
    ];
  }
  if (input.partnerCount === 0) {
    return [
      {
        id: 'adm-empty',
        tone: 'warn',
        text: 'No partners yet. Create a client file or import from legacy export.',
        actionLabel: 'Create partner',
        to: '/admin/partners#create-partner',
      },
    ];
  }
  return [
    {
      id: 'adm-open',
      tone: 'info',
      text: 'Open a client profile to upload reports or run letters on their behalf.',
      actionLabel: 'Ops queue',
      to: '/admin/workflow',
    },
  ];
}

export type HelpCenterSignalInput = {
  hasSearchQuery: boolean;
  lane: string;
};

/** Help center — search vs browse nudges. */
export function buildHelpCenterNoticedItems(input: HelpCenterSignalInput): FinelyNoticedItem[] {
  if (input.hasSearchQuery) {
    return [
      {
        id: 'help-search',
        tone: 'info',
        text: PUBLIC_DEMO_VIDEOS_ENABLED
          ? 'Open the matching playbook, then tap Watch how for a video walkthrough.'
          : 'Open the matching playbook for step-by-step instructions, or ask in chat.',
        actionLabel: PUBLIC_DEMO_VIDEOS_ENABLED ? 'Video tours' : 'Playbooks',
        to: PUBLIC_DEMO_VIDEOS_ENABLED ? '/resources#videos' : '/help-center',
      },
    ];
  }
  if (input.lane === 'portal') {
    return [
      {
        id: 'help-portal',
        tone: 'info',
        text: 'Portal playbooks match your dispute workflow — start with upload report.',
        actionLabel: 'Portal dashboard',
        to: '/portal/dashboard',
      },
    ];
  }
  return [
    {
      id: 'help-browse',
      tone: 'info',
      text: 'Search or pick a lane. Every playbook has plain steps and a video when available.',
      actionLabel: 'Start here',
      to: '/start-here',
    },
  ];
}
