/**
 * Finely Training Academy — unified LMS architecture.
 *
 * Design decision (recommended & implemented):
 * - ONE signup via /onboarding (lane = role). No separate training signup.
 * - EVERYONE completes Core Foundation (compliance, doctrine, platform safety).
 * - Role tracks unlock automatically from partner lane + optional specialties.
 * - Certifications gate advanced hub features (soft gates — configurable).
 */

import type { PartnerLane } from './partners';
import type { AgentSpecialtyId } from './agentProgram';
import { LAUNCH_ROLE_COURSES } from '../config/launchRoleCourses';

export type TrainingRoleId =
  | 'partner_client'
  | 'affiliate'
  | 'credit_specialist'
  | 'au_seller'
  | 'business'
  | 'debt_legal'
  | 'admin'
  | 'agency';

export type TrainingLesson = {
  id: string;
  title: string;
  objectives: string[];
  estimatedMinutes: number;
  sopIds?: string[];
  tourIds?: string[];
  hubPath?: string;
  guideId?: string;
  resourcePath?: string;
  /** Pass quiz to mark lesson complete (when present). */
  quiz?: Array<{ question: string; options: string[]; correctIndex: number }>;
};

export type TrainingModule = {
  id: string;
  trackId: string;
  title: string;
  description: string;
  roles: TrainingRoleId[] | 'core';
  lessons: TrainingLesson[];
  certification?: { id: string; title: string; badge: string };
  /** Soft gate — recommend before advanced hub tabs. */
  recommendedBefore?: string[];
};

export type TrainingTrack = {
  id: string;
  role: TrainingRoleId | 'core';
  title: string;
  subtitle: string;
  accent: 'emerald' | 'violet' | 'amber' | 'sky' | 'fuchsia';
  hubPath: string;
  moduleIds: string[];
};

export const TRAINING_ACADEMY_VERSION = 1;

export const CORE_TRACK_ID = 'track_core_foundation';

function lesson(
  id: string,
  title: string,
  objectives: string[],
  mins: number,
  extra?: Partial<TrainingLesson>,
): TrainingLesson {
  return { id, title, objectives, estimatedMinutes: mins, ...extra };
}

function quizCompliance(): TrainingLesson['quiz'] {
  return [
    {
      question: 'Before mailing a dispute letter, what must pass first?',
      options: ['Client verbal OK', 'Evidence gate + compliance review', 'Payment received', 'Social post approval'],
      correctIndex: 1,
    },
    {
      question: 'Our default stance on charge-offs and collections is:',
      options: ['Pay immediately', 'Validation-first challenge', 'Ignore them', 'Settle first'],
      correctIndex: 1,
    },
  ];
}

/** Core foundation — required for every role. */
export const TRAINING_CORE_MODULES: TrainingModule[] = [
  {
    id: 'core_welcome',
    trackId: CORE_TRACK_ID,
    title: 'Welcome & platform ethics',
    description: 'What Finely Cred is, partner-first voice, educational-only boundaries.',
    roles: 'core',
    lessons: [
      lesson('core_l1_platform', 'Platform overview', ['Navigate portal vs public site', 'Know your lane and journey map'], 15, {
        tourIds: ['tour-onboarding-start'],
        hubPath: '/portal/dashboard',
      }),
      lesson('core_l2_ethics', 'Ethics & FTC-safe language', ['No guaranteed outcomes', 'Document — do not promise deletions'], 20, {
        sopIds: ['sop-compliance-letter-gate'],
        hubPath: '/help-center',
      }),
    ],
  },
  {
    id: 'core_compliance',
    trackId: CORE_TRACK_ID,
    title: 'Compliance before you mail',
    description: 'Evidence gates, identity vault, letter language review.',
    roles: 'core',
    lessons: [
      lesson('core_l3_evidence', 'Evidence discipline', ['Documents vault taxonomy', 'One claim per letter'], 25, {
        sopIds: ['sop-compliance-letter-gate', 'sop-portal-dispute-letter'],
        tourIds: ['tour-portal-dispute-letter'],
        hubPath: '/portal/documents',
        quiz: quizCompliance(),
      }),
      lesson('core_l4_identity', 'Identity & consent', ['Consent flags', 'Marketing opt-in rules'], 15, {
        hubPath: '/account/settings',
      }),
    ],
    certification: { id: 'cert_core_compliance', title: 'Compliance Foundations', badge: '🛡️' },
  },
  {
    id: 'core_doctrine',
    trackId: CORE_TRACK_ID,
    title: 'Validation-first doctrine',
    description: 'Challenge debt on consumer-law terms — never pay charge-offs/collections as default.',
    roles: 'core',
    lessons: [
      lesson('core_l5_validation', 'FDCPA validation sequence', ['30-day window', 'Certified mail discipline'], 30, {
        guideId: 'certified-mail-evidence-system',
        hubPath: '/portal/debt',
        resourcePath: '/resources',
      }),
      lesson('core_l6_law_per_negative', 'Law per negative', ['FCRA vs FDCPA lanes', 'Affidavit awareness'], 25, {
        guideId: 'round-2-method-verification',
        hubPath: '/portal/letters',
      }),
    ],
  },
  {
    id: 'core_ops',
    trackId: CORE_TRACK_ID,
    title: 'Communication & tasks',
    description: 'Hub, calendar, tasks — how work actually flows.',
    roles: 'core',
    lessons: [
      lesson('core_l7_comms', 'Communication Hub', ['AI coach vs team threads', 'Book strategy calls'], 20, {
        tourIds: ['tour-portal-messages', 'tour-portal-calendar'],
        hubPath: '/portal/messages',
      }),
      lesson('core_l8_tasks', 'Tasks & follow-up cadence', ['Dispute round clocks', 'Re-pull reminders'], 15, {
        tourIds: ['tour-portal-my-tasks'],
        hubPath: '/portal/my-tasks',
      }),
    ],
    certification: { id: 'cert_core_graduate', title: 'Finely Academy Core Graduate', badge: '🎓' },
  },
];

function roleTrackModules(role: TrainingRoleId): TrainingModule[] {
  const map: Record<TrainingRoleId, TrainingModule[]> = {
    partner_client: [
      {
        id: 'client_restore',
        trackId: `track_${role}`,
        title: 'Credit restore workflow',
        description: 'Upload → analyze → dispute → mail → follow-up.',
        roles: [role],
        lessons: [
          lesson('client_l1_monitor', 'Monitoring & reports', ['Tri-bureau pulls', 'Store baseline PDF'], 20, {
            sopIds: ['sop-public-monitoring-links', 'sop-portal-upload-report'],
            tourIds: ['tour-resources-monitoring', 'tour-portal-upload-report'],
            hubPath: '/portal/reports',
          }),
          lesson('client_l2_disputes', 'Dispute rounds', ['Round 1 vs 2 vs 3', 'MOFV requests'], 35, {
            sopIds: ['sop-portal-dispute-letter'],
            tourIds: ['tour-portal-dispute-letter'],
            hubPath: '/portal/disputes',
          }),
          lesson('client_l3_letters', 'Letter Studio', ['One tradeline per letter', 'Certified mail'], 30, {
            hubPath: '/portal/letters',
          }),
        ],
        certification: { id: 'cert_client_restore', title: 'Restore Operator', badge: '✨' },
      },
      {
        id: 'client_funding',
        trackId: `track_${role}`,
        title: 'Funding readiness',
        description: 'Utilization, inquiry budget, fundability sequencing.',
        roles: [role],
        lessons: [
          lesson('client_l4_fundability', 'Fundability hub', ['Personal → business layering', 'Inquiry ledger'], 25, {
            tourIds: ['tour-fundability-readiness'],
            hubPath: '/fundability-readiness',
          }),
        ],
      },
    ],
    affiliate: [
      {
        id: 'affiliate_toolkit',
        trackId: `track_${role}`,
        title: 'Affiliate toolkit & compliance',
        description: 'Links, commissions, FTC-safe promo copy.',
        roles: [role],
        lessons: [
          lesson('aff_l1_toolkit', 'Referral toolkit', ['Build links', 'QR kits'], 20, {
            sopIds: ['sop-affiliate-toolkit'],
            tourIds: ['tour-affiliate-toolkit'],
            hubPath: '/affiliate/hub',
          }),
          lesson('aff_l2_denefits', 'Denefits & residual pitch', ['Contract stacking', 'Compliance copy'], 25, {
            sopIds: ['sop-affiliate-denefits-pitch'],
            hubPath: '/affiliate/hub?tab=denefits',
          }),
        ],
        certification: { id: 'cert_affiliate', title: 'Affiliate Certified', badge: '🤝' },
      },
    ],
    credit_specialist: [
      {
        id: 'agent_file_ops',
        trackId: `track_${role}`,
        title: 'Client file operations',
        description: 'Run files end-to-end as a credit specialist partner.',
        roles: [role],
        lessons: [
          lesson('agent_l1_hub', 'Specialist hub economics', ['Revenue share phases', 'Training ladder'], 30, {
            sopIds: ['sop-agent-client-file'],
            tourIds: ['tour-agent-client-file'],
            hubPath: '/credit-specialist/hub',
          }),
          lesson('agent_l2_white_label', 'White-label & client portal', ['Brand setup', 'Client onboarding'], 25, {
            hubPath: '/credit-specialist/hub',
          }),
        ],
        certification: { id: 'cert_agent_apprentice', title: 'Specialist Apprentice', badge: '⭐' },
      },
      {
        id: 'agent_specialty_depth',
        trackId: `track_${role}`,
        title: 'Specialty depth modules',
        description: 'Pick your lane — restore, business, debt, tradelines, funding.',
        roles: [role],
        lessons: [
          lesson('agent_l3_specialty', 'Specialty track selection', ['Module checklists', 'Certification path'], 20, {
            hubPath: '/portal/training/academy',
          }),
        ],
      },
    ],
    au_seller: [
      {
        id: 'au_listing',
        trackId: `track_${role}`,
        title: 'AU seller compliance',
        description: 'Listing review, payouts, identity verification.',
        roles: [role],
        lessons: [
          lesson('au_l1_compliance', 'Listing compliance', ['Manual review queue', 'Evidence pack'], 25, {
            hubPath: '/au-seller/hub',
            guideId: 'primary-tradeline-insider',
          }),
          lesson('au_l2_payouts', 'Payouts & contracts', ['Denefit contracts', 'Payout setup'], 20, {
            hubPath: '/au-seller/hub?tab=payouts',
          }),
        ],
        certification: { id: 'cert_au_seller', title: 'AU Seller Certified', badge: '🔐' },
      },
    ],
    business: [
      {
        id: 'biz_vendor',
        trackId: `track_${role}`,
        title: 'Business credit operator',
        description: 'Entity hygiene, vendor tiers, Paydex discipline.',
        roles: [role],
        lessons: [
          lesson('biz_l1_entity', 'Entity & bureau alignment', ['SOS, EIN, D-U-N-S'], 30, {
            sopIds: ['sop-business-vendor-stack'],
            tourIds: ['tour-business-vendors'],
            hubPath: '/business/dashboard',
          }),
          lesson('biz_l2_vendors', 'Vendor sequencing', ['Tier 1–3 spacing', 'Early pay optics'], 25, {
            guideId: 'vendor-tier-matrix-free',
            hubPath: '/business/dashboard',
          }),
        ],
        certification: { id: 'cert_business', title: 'Business Credit Operator', badge: '🏢' },
      },
    ],
    debt_legal: [
      {
        id: 'debt_validation',
        trackId: `track_${role}`,
        title: 'Debt & summons operator',
        description: 'Validation letters, affidavits, court timelines.',
        roles: [role],
        lessons: [
          lesson('debt_l1_validation', 'Validation request mastery', ['FDCPA §809', 'Cease contact'], 35, {
            hubPath: '/portal/debt',
            guideId: 'debt-settlement-tax-traps',
          }),
          lesson('debt_l2_summons', 'Summons & affidavits', ['Response deadlines', 'Service challenges'], 40, {
            hubPath: '/portal/debt',
            guideId: 'identity-theft-block-unblock',
          }),
        ],
        certification: { id: 'cert_debt_legal', title: 'Validation Operator', badge: '⚖️' },
      },
    ],
    admin: [
      {
        id: 'admin_ops',
        trackId: `track_${role}`,
        title: 'Admin daily ops',
        description: 'Partners, workflow queue, launch readiness.',
        roles: [role],
        lessons: [
          lesson('admin_l1_partners', 'Partner management', ['Create partner', 'Upload client report'], 25, {
            sopIds: ['sop-admin-create-partner', 'sop-admin-upload-client-report'],
            tourIds: ['tour-admin-partners'],
            hubPath: '/admin/partners',
          }),
          lesson('admin_l2_workflow', 'Workflow triage', ['SLA', 'Automation dry-run'], 25, {
            sopIds: ['sop-admin-workflow-triage'],
            tourIds: ['tour-admin-workflow'],
            hubPath: '/admin/workflow',
          }),
          lesson('admin_l3_coowner', 'Co-owner Ruth command', ['Daily ops', 'Phone hub'], 20, {
            hubPath: '/admin/ops-agent',
          }),
        ],
        certification: { id: 'cert_admin_ops', title: 'Ops Certified', badge: '👑' },
      },
      {
        id: 'admin_staff_roles',
        trackId: `track_${role}`,
        title: 'Staff role mastery (Ruth curriculum)',
        description: 'Train every internal lane — setter through co-CEO, IT, and developer.',
        roles: [role],
        lessons: [
          lesson('staff_setter_l1', 'Appointment setter L1', ['Booking scripts', 'Objection handling', 'CRM hygiene'], 25, {
            hubPath: '/admin/crm',
          }),
          lesson('staff_dispute_l1', 'Dispute coach L1', ['Factual reasons only', 'Evidence gates'], 30, {
            hubPath: '/portal/letters',
          }),
          lesson('staff_success_l1', 'Partner success L1', ['Onboarding', 'Report upload nudges'], 25, {
            hubPath: '/admin/partners',
          }),
          lesson('staff_comms_l1', 'Comms director L1', ['Template QA', 'Nurture dry-run'], 25, {
            hubPath: '/admin/comms-studio',
          }),
          lesson('staff_billing_l1', 'Billing ops L1', ['Dunning cadence', 'Entitlements'], 20, {
            hubPath: '/admin/billing',
          }),
          lesson('staff_it_l1', 'IT support L1', ['Monitoring', 'Launch gates'], 20, {
            hubPath: '/admin/monitoring',
          }),
          lesson('staff_dev_l1', 'Developer L1', ['Parsing lab', 'Regression harness'], 30, {
            hubPath: '/admin/parsing-lab',
          }),
          lesson('staff_coceo_l1', 'Co-CEO operator L1', ['Executive brief', 'Hire/promote doctrine'], 35, {
            hubPath: '/admin/ops-agent',
          }),
        ],
      },
    ],
    agency: [
      {
        id: 'agency_white_label',
        trackId: `track_${role}`,
        title: 'Agency white-label',
        description: 'Tenant setup, team seats, client intake at scale.',
        roles: [role],
        lessons: [
          lesson('agency_l1_tenant', 'Workspace setup', ['Branding', 'Team roles'], 30, {
            hubPath: '/admin/access',
          }),
          lesson('agency_l2_intake', 'Client intake at scale', ['CRM routing', 'Comms templates'], 25, {
            hubPath: '/admin/crm',
          }),
        ],
        certification: { id: 'cert_agency', title: 'Agency Operator', badge: '🏛️' },
      },
    ],
  };
  return map[role] ?? [];
}

export const TRAINING_ROLE_TRACKS: TrainingTrack[] = [
  {
    id: CORE_TRACK_ID,
    role: 'core',
    title: 'Core Foundation',
    subtitle: 'Required for everyone — compliance, doctrine, platform safety',
    accent: 'emerald',
    hubPath: '/portal/training/academy',
    moduleIds: TRAINING_CORE_MODULES.map((m) => m.id),
  },
  {
    id: 'track_partner_client',
    role: 'partner_client',
    title: 'Partner / Client Track',
    subtitle: 'Restore credit, disputes, funding readiness',
    accent: 'sky',
    hubPath: '/portal/dashboard',
    moduleIds: ['client_restore', 'client_funding'],
  },
  {
    id: 'track_affiliate',
    role: 'affiliate',
    title: 'Affiliate Track',
    subtitle: 'Refer responsibly, earn residual income',
    accent: 'violet',
    hubPath: '/affiliate/hub',
    moduleIds: ['affiliate_toolkit'],
  },
  {
    id: 'track_credit_specialist',
    role: 'credit_specialist',
    title: 'Credit Specialist Track',
    subtitle: 'Run client files, revenue share, white-label',
    accent: 'amber',
    hubPath: '/credit-specialist/hub',
    moduleIds: ['agent_file_ops', 'agent_specialty_depth'],
  },
  {
    id: 'track_au_seller',
    role: 'au_seller',
    title: 'AU Seller Track',
    subtitle: 'Listings, compliance, payouts',
    accent: 'fuchsia',
    hubPath: '/au-seller/hub',
    moduleIds: ['au_listing'],
  },
  {
    id: 'track_business',
    role: 'business',
    title: 'Business Credit Track',
    subtitle: 'Entity, vendors, fundability',
    accent: 'fuchsia',
    hubPath: '/business/dashboard',
    moduleIds: ['biz_vendor'],
  },
  {
    id: 'track_debt_legal',
    role: 'debt_legal',
    title: 'Debt & Validation Track',
    subtitle: 'Validation-first, affidavits, summons',
    accent: 'amber',
    hubPath: '/portal/debt',
    moduleIds: ['debt_validation'],
  },
  {
    id: 'track_admin',
    role: 'admin',
    title: 'Admin & Ops Track',
    subtitle: 'Daily ops, workflow, co-owner tools',
    accent: 'sky',
    hubPath: '/admin',
    moduleIds: ['admin_ops', 'admin_staff_roles'],
  },
  {
    id: 'track_agency',
    role: 'agency',
    title: 'Agency Track',
    subtitle: 'White-label tenants at scale',
    accent: 'violet',
    hubPath: '/agency/signup',
    moduleIds: ['agency_white_label'],
  },
];

export const ALL_TRAINING_MODULES: TrainingModule[] = [
  ...TRAINING_CORE_MODULES,
  ...(['partner_client', 'affiliate', 'credit_specialist', 'au_seller', 'business', 'debt_legal', 'admin', 'agency'] as TrainingRoleId[]).flatMap(
    roleTrackModules,
  ),
];

export function partnerLaneToTrainingRole(lane?: PartnerLane): TrainingRoleId {
  switch (lane) {
    case 'affiliate':
      return 'affiliate';
    case 'agent':
      return 'credit_specialist';
    case 'au_tradelines':
      return 'au_seller';
    case 'business_credit':
      return 'business';
    case 'debt_kill':
      return 'debt_legal';
    default:
      return 'partner_client';
  }
}

export function resolveTrainingRoles(args: {
  lane?: PartnerLane;
  isAdmin?: boolean;
  isAgencyTenant?: boolean;
  specialties?: AgentSpecialtyId[];
}): TrainingRoleId[] {
  const roles = new Set<TrainingRoleId>();
  roles.add(partnerLaneToTrainingRole(args.lane));
  if (args.isAdmin) roles.add('admin');
  if (args.isAgencyTenant) roles.add('agency');
  if (args.specialties?.includes('debt_legal')) roles.add('debt_legal');
  if (args.specialties?.includes('business_credit')) roles.add('business');
  return [...roles];
}

export function getTrainingPlan(args: {
  lane?: PartnerLane;
  isAdmin?: boolean;
  isAgencyTenant?: boolean;
  specialties?: AgentSpecialtyId[];
}) {
  const roles = resolveTrainingRoles(args);
  const coreModules = TRAINING_CORE_MODULES;
  const roleModules = ALL_TRAINING_MODULES.filter(
    (m) => m.roles !== 'core' && (m.roles as TrainingRoleId[]).some((r) => roles.includes(r)),
  );
  const tracks = TRAINING_ROLE_TRACKS.filter((t) => t.role === 'core' || roles.includes(t.role as TrainingRoleId));
  const launchCourses = LAUNCH_ROLE_COURSES.filter((c) => {
    const r = c.role.toLowerCase();
    if (r.includes('all')) return true;
    if (roles.includes('partner_client') && (r.includes('partner') || r.includes('client'))) return true;
    if (roles.includes('affiliate') && r.includes('affiliate')) return true;
    if (roles.includes('credit_specialist') && r.includes('specialist')) return true;
    if (roles.includes('admin') && r.includes('admin')) return true;
    if (roles.includes('business') && r.includes('business')) return true;
    return false;
  });
  const lessonCount = [...coreModules, ...roleModules].reduce((n, m) => n + m.lessons.length, 0);
  return { roles, coreModules, roleModules, tracks, launchCourses, lessonCount };
}

export function getTrainingModule(id: string): TrainingModule | undefined {
  return ALL_TRAINING_MODULES.find((m) => m.id === id);
}

export function getTrainingLesson(lessonId: string): { module: TrainingModule; lesson: TrainingLesson } | undefined {
  for (const mod of ALL_TRAINING_MODULES) {
    const hit = mod.lessons.find((l) => l.id === lessonId);
    if (hit) return { module: mod, lesson: hit };
  }
  return undefined;
}

export function getAllLessonIdsForPlan(plan: ReturnType<typeof getTrainingPlan>): string[] {
  return [...plan.coreModules, ...plan.roleModules].flatMap((m) => m.lessons.map((l) => l.id));
}
