/**
 * Credit specialist careers copy — training phases, tasks, and per-file revenue share.
 * Agency partners live on /agency-partners (see agencyPartnersProgram.ts).
 */
import type { AgentTrainingPhaseId } from '../domain/agentProgram';
import { AGENT_TRAINING_PHASES, formatAgentMoney } from '../domain/agentProgram';
import { AGENCY } from './agencyPartnersProgram';

export type TrainingPhaseCareerDetail = {
  id: AgentTrainingPhaseId;
  label: string;
  tagline: string;
  /** Typical agent keep on client service fees at this phase (before capacity tier bonuses). */
  agentKeepPctTypical: number;
  platformKeepPctTypical: number;
  yourTasks: string[];
  finelyProvides: string[];
  leadsAndMarketing: string;
  whyThisSplit: string;
  graduateWhen: string;
};

export const TRAINING_PHASE_CAREER_DETAILS: TrainingPhaseCareerDetail[] = [
  {
    id: 'apprenticeship',
    label: 'Apprenticeship',
    tagline: 'Learn while we co-run files with you',
    agentKeepPctTypical: 30,
    platformKeepPctTypical: 70,
    yourTasks: [
      'Join customer calls and intake with mentor backup',
      'Upload reports, tag negatives, and draft dispute angles',
      'Send portal messages and document evidence with QA review',
      'Practice pitch and file organization — you lead relationship, we back fulfillment',
    ],
    finelyProvides: [
      'Full software stack (CRM, portal, letters, vault, tasks)',
      'Hands-on dispute drafting & mailing on early rounds',
      'Weekly mentor checkpoints + academy modules',
      'Lead magnets, nurture email, and optional shared lead routing',
    ],
    leadsAndMarketing:
      'Finely typically sources or co-markets early files — you focus on learning the workflow. Your keep is lower because we carry fulfillment, mentoring, and growth tooling.',
    whyThisSplit:
      'You keep ~30% because Finely runs most fulfillment levers, provides training, and often contributes leads. As you take on more work yourself, your share rises.',
    graduateWhen: 'Pass file QA, complete core academy modules, and close 3+ customer files with mentor sign-off.',
  },
  {
    id: 'guided',
    label: 'Guided operator',
    tagline: 'You run day-to-day — we back complex fulfillment',
    agentKeepPctTypical: 42,
    platformKeepPctTypical: 58,
    yourTasks: [
      'Own customer relationships, intake, and portal communication',
      'Run dispute rounds, evidence packs, and task sequencing',
      'Close sales and set service fees within program guidelines',
      'Escalate complex legal/debt lanes to Finely QA when needed',
    ],
    finelyProvides: [
      'Platform, Comms Studio, and co-branded portal options',
      'Shared fulfillment on complex disputes & mailings',
      'Marketing asset library + Lead Intelligence tools',
      'Mentor office hours — not daily co-piloting',
    ],
    leadsAndMarketing:
      'You bring most of your own prospects OR use Finely lead magnets with shared marketing. Split balances your sales effort with platform fulfillment support.',
    whyThisSplit:
      'You keep ~42% because you run the file and sales motion while Finely still powers software, shared QA, and part of marketing infrastructure.',
    graduateWhen: 'Consistent monthly volume, clean compliance record, and certification in your specialty lane.',
  },
  {
    id: 'independent',
    label: 'Independent specialist',
    tagline: 'You operate the file — platform is your engine',
    agentKeepPctTypical: 52,
    platformKeepPctTypical: 48,
    yourTasks: [
      'Full-cycle customer files: sales, onboarding, disputes, follow-up',
      'Brand your portal (co-branded or white-label tier)',
      'Manage your pipeline, tasks, and team seats if applicable',
      'Optional: run your own ads using Finely creative kits',
    ],
    finelyProvides: [
      'Software, billing rails, Denefit enrollment tools',
      'Templates, letters studio, automation & vault',
      'Partnership line for escalations — not daily file co-piloting',
      'Academy refreshers and compliance updates',
    ],
    leadsAndMarketing:
      'You source your own customers. Finely provides capture pages and nurture — you own ad spend and prospecting unless you negotiate lead share.',
    whyThisSplit:
      'You keep ~52% because you run fulfillment and marketing. Finely retains ~48% for platform, payments, compliance infrastructure, and growth R&D.',
    graduateWhen: 'Proven volume, certified partner review, and white-label readiness if upgrading capacity.',
  },
  {
    id: 'partner',
    label: 'Certified partner',
    tagline: 'Top specialist status — highest per-file keep',
    agentKeepPctTypical: 62,
    platformKeepPctTypical: 38,
    yourTasks: [
      'Operate at volume with your brand and team',
      'Train junior seats under your agency capacity tier',
      'Own fulfillment, comms, and customer outcomes end-to-end',
      'Participate in quarterly strategy & product feedback',
    ],
    finelyProvides: [
      'Enterprise-grade platform + API where applicable',
      'Dedicated account support & priority routing',
      'Compliance guardrails, template updates, bureau rule changes',
      'Minimum 20% Finely retain for platform continuity (never below)',
    ],
    leadsAndMarketing:
      'You run your own growth engine. Certified partners at agency scale may negotiate custom lead programs — base split assumes you bring demand.',
    whyThisSplit:
      'Top operators keep up to ~62–80% depending on levers you run yourself. Finely always retains at least 20% for the operating system, updates, and risk/compliance layer.',
    graduateWhen: 'Invitation-based — maintained quality scores, volume, and compliance audits.',
  },
];

export function exampleEarnings(agentKeepPct: number, clientFeeCents = 150_000) {
  const agent = Math.round((clientFeeCents * agentKeepPct) / 100);
  const platform = clientFeeCents - agent;
  return {
    clientFeeCents,
    clientFeeLabel: formatAgentMoney(clientFeeCents),
    agentCents: agent,
    agentLabel: formatAgentMoney(agent),
    platformCents: platform,
    platformLabel: formatAgentMoney(platform),
    agentKeepPct,
    platformKeepPct: 100 - agentKeepPct,
  };
}

export function getTrainingPhaseDetail(id: AgentTrainingPhaseId): TrainingPhaseCareerDetail {
  return TRAINING_PHASE_CAREER_DETAILS.find((p) => p.id === id) ?? TRAINING_PHASE_CAREER_DETAILS[0]!;
}

/** Merge catalog training phases with career detail for UI. */
export function listTrainingPhasesForPublic() {
  return AGENT_TRAINING_PHASES.map((phase) => {
    const detail = getTrainingPhaseDetail(phase.id);
    return { ...phase, ...detail };
  });
}

export const PROGRAM_ROLE_MODEL = {
  headline: 'Three terms people confuse — quick map',
  rows: [
    {
      term: 'Credit specialist',
      meaning: 'Anyone in the program running client files. Pay is a % of that file’s service fee (restore, build, business, etc.) — starts ~30%, not 80%.',
    },
    {
      term: 'Certified partner',
      meaning: 'Top specialist step after Independent. Same per-file % model, max ~62–80% when you run almost everything yourself.',
    },
    {
      term: 'Finely platform (software)',
      meaning: 'The tools you work in — CRM, portal, letters, vault. Included at every training level. This is not a job title, not a pay tier, and not the same as agency white-label.',
    },
  ],
  percentOf: `Percentages are always of the client service fee on that sale (e.g. $1,500 restore). Building a company with team seats? See the ${AGENCY.programName} page — separate track.`,
} as const;

export const REVENUE_SHARE_EXPLAINER = {
  headline: 'How your percentage is determined',
  bullets: [
    'Training phase — how much of each customer file you run vs Finely co-pilots (Apprentice → Certified partner).',
    'Specialty lane — restore, business credit, debt, and funding files have different service fees and support load.',
    'Value levers — who runs marketing, dispute fulfillment, mentoring, and lead gen (each shifts the split a few points).',
    'Leads — when Finely contributes prospects or co-marketing, your keep is lower but volume risk is shared.',
  ],
  footnote:
    'No flat platform fee — revenue share only. Denefit contract commissions are separate and stack on top of service fees.',
};
