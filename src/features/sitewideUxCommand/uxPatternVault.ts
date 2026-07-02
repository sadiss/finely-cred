import type { SitewideUxMission, SitewideUxRule } from './types';

export const SITEWIDE_UX_RULES: SitewideUxRule[] = [
  {
    id: 'no-cramped-side-by-side',
    title: 'No cramped side-by-side command pages',
    problem: 'Editors, template lists, and previews were placed beside each other, creating a busy and weak operator experience.',
    replacement: 'Use full-width command sections: KPI deck, tab rail, focused work area, collapsible drawer, preview below or in a modal.',
    appliesTo: ['AdminMediaStudioPage', 'AdminCommsStudioPage', 'AdminAutomationsPage', 'AdminLeadIntelPage'],
    cursorAction: 'Replace grid lg:grid-cols-12 command editors with full-width deck/detail/drawer layouts.',
    severity: 'critical',
  },
  {
    id: 'no-endless-template-lists',
    title: 'No endless template-library pages',
    problem: 'Long vertical lists bury decisions and make the page feel unfinished.',
    replacement: 'Use horizontal card rails, searchable command galleries, compact filters, and paged detail panels.',
    appliesTo: ['AdminTemplatesPage', 'AdminAutomationsPage', 'AdminCommsStudioPage', 'AdminResourcesPage'],
    cursorAction: 'Move repeated lists into SitewideDeckRail or paged gallery sections.',
    severity: 'critical',
  },
  {
    id: 'public-pages-need-premium-funnels',
    title: 'Public pages need funnel-first premium sections',
    problem: 'Public pages can be informational but not always conversion-command ready.',
    replacement: 'Use premium hero, proof strip, lead magnet card, tracked CTA, objection rail, process deck, FAQ drawer, and booking block.',
    appliesTo: ['ResourcesPage', 'PricingPage', 'PricingServicePage', 'PersonalCreditPage', 'AffiliatePage', 'AgentsPage', 'AgencySignupPage', 'ConsultationPage'],
    cursorAction: 'Wrap public pages with premium funnel sections and tracked CTA rail without changing legal disclaimers.',
    severity: 'high',
  },
  {
    id: 'portal-workspaces-need-compact-ops',
    title: 'Portal pages need compact workspaces',
    problem: 'Portal pages should reduce scrolling and make next action obvious.',
    replacement: 'Use status strip, compact task deck, next action cards, timeline drawer, and low-friction upload/message actions.',
    appliesTo: ['PartnerDashboardPage', 'PartnerTasksPage', 'PartnerDocumentsPage', 'PartnerMessagesPage', 'PartnerProjectsPage'],
    cursorAction: 'Prefer compact work boards and avoid changing extracted credit report negative-items layout.',
    severity: 'high',
  },
  {
    id: 'negative-items-protected',
    title: 'Negative items extracted report layout is protected',
    problem: 'This layout is already approved and must not be accidentally refactored during sitewide cleanup.',
    replacement: 'Leave CreditIntelTabs negative/collections/late-payments extracted view untouched.',
    appliesTo: ['CreditIntelTabs'],
    cursorAction: 'Do not patch src/components/creditIntel/CreditIntelTabs.tsx unless Preston explicitly asks.',
    severity: 'protected',
  },
];

export const SITEWIDE_UX_MISSIONS: SitewideUxMission[] = [
  {
    id: 'mission-admin-command-pages',
    title: 'Admin command pages: replace side-by-side + long lists',
    owner: 'Studio UX Director',
    pages: ['AdminMediaStudioPage', 'AdminCommsStudioPage', 'AdminAutomationsPage', 'AdminLeadIntelPage', 'AdminTemplatesPage'],
    expectedOutcome: 'Every command page feels like a premium operator console with clear sections and no weak scroll marathon.',
    acceptanceChecks: ['KPI deck visible above fold', 'No side-by-side editor/list grid', 'Template libraries are paged or railed', 'Action drawer or detail panel exists'],
  },
  {
    id: 'mission-public-funnels',
    title: 'Public funnels: premium conversion flow',
    owner: 'CMO Prime',
    pages: ['ResourcesPage', 'PricingPage', 'PricingServicePage', 'PersonalCreditPage', 'AffiliatePage', 'AgentsPage', 'AgencySignupPage', 'ConsultationPage'],
    expectedOutcome: 'Public pages look premium, explain value fast, and route to tracked lead capture or booking.',
    acceptanceChecks: ['Lead magnet CTA visible', 'Tracked link path defined', 'Proof/FAQ/objection blocks included', 'No guarantee language'],
  },
  {
    id: 'mission-private-workspaces',
    title: 'Private workspaces: compact status + next action',
    owner: 'Switchboard',
    pages: ['PartnerDashboardPage', 'PartnerTasksPage', 'PartnerDocumentsPage', 'PartnerMessagesPage', 'BusinessDashboardPage'],
    expectedOutcome: 'Private portal pages become compact workspaces with clear next actions and less endless scrolling.',
    acceptanceChecks: ['Status cards above fold', 'Next action is obvious', 'Lists are compact or rail-based', 'Negative items extracted layout untouched'],
  },
];
