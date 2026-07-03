import type { DisputeRoundLabel } from './disputeWorkflow';

export type DisputePipelineStage = DisputeRoundLabel | 'Litigation';

export type ResponseOutcome = 'deleted' | 'updated' | 'verified_unchanged' | 'no_response' | 'partial' | 'reinserted';

export type PlaybookStep = {
  id: string;
  title: string;
  detail: string;
  actor: 'partner' | 'credit_specialist' | 'dispute_specialist' | 'admin' | 'compliance' | 'system';
  commsTemplateHint?: string;
  href?: string;
  required?: boolean;
};

export type ResponsePlaybook = {
  stage: DisputePipelineStage;
  outcome: ResponseOutcome;
  title: string;
  summary: string;
  steps: PlaybookStep[];
  escalationOptions?: string[];
};

export const DISPUTE_PIPELINE_STAGES: DisputePipelineStage[] = [
  'Round 1',
  'Round 2',
  'Round 3',
  'Round 4',
  'Litigation',
];

export const STAGE_DESCRIPTIONS: Record<DisputePipelineStage, string> = {
  'Round 1': 'Initial bureau dispute — establish investigation clock',
  'Round 2': 'Follow-up with new angle, furnisher-direct, or MOV request',
  'Round 3': 'Strongest evidence + procedural violations documented',
  'Round 4': 'Final bureau push before regulatory / legal escalation',
  Litigation: 'Pre-litigation packet, attorney review, court-ready documentation',
};

const BASE_UPLOAD = 'Upload bureau response to evidence vault and log outcome in case timeline.';
const BASE_COMMS = 'Notify partner via portal thread + optional email/SMS from Comms Studio dispute templates.';

function stepsFor(
  stage: DisputePipelineStage,
  outcome: ResponseOutcome,
): PlaybookStep[] {
  const common: PlaybookStep[] = [
    {
      id: 'log_response',
      title: 'Log bureau response',
      detail: BASE_UPLOAD,
      actor: 'partner',
      required: true,
      href: '/portal/documents',
    },
    {
      id: 'specialist_review',
      title: 'Specialist reviews outcome',
      detail: 'Credit or dispute specialist confirms deletion, update, or verified unchanged against report snapshot.',
      actor: 'credit_specialist',
      required: true,
    },
    {
      id: 'notify_partner',
      title: 'Partner notification',
      detail: BASE_COMMS,
      actor: 'dispute_specialist',
      commsTemplateHint: `dispute_${stage.toLowerCase().replace(' ', '_')}_response`,
    },
  ];

  if (outcome === 'deleted') {
    return [
      ...common,
      {
        id: 'confirm_deletion',
        title: 'Confirm deletion on fresh report',
        detail: 'Pull updated report in 30–45 days to monitor re-insertion risk.',
        actor: 'partner',
        href: '/portal/reports',
      },
      {
        id: 'close_or_monitor',
        title: 'Close case or set monitor task',
        detail: 'Admin marks case closed or creates 45-day re-insertion monitor task.',
        actor: 'admin',
      },
    ];
  }

  if (outcome === 'updated') {
    return [
      ...common,
      {
        id: 'diff_report',
        title: 'Diff before/after tradeline',
        detail: 'Document what changed — balance, status code, DOFD, or payment history.',
        actor: 'credit_specialist',
      },
      {
        id: 'decide_next',
        title: 'Decide next round or close',
        detail: 'If still inaccurate → advance to next dispute round. If acceptable → close with partner sign-off.',
        actor: 'dispute_specialist',
      },
    ];
  }

  if (outcome === 'verified_unchanged') {
    const nextStage = stage === 'Round 4' ? 'Litigation' : `Round ${Number(stage.replace(/\D/g, '')) + 1}`;
    return [
      ...common,
      {
        id: 'furnisher_direct',
        title: 'Furnisher-direct letter (if applicable)',
        detail: 'Send data-furnisher dispute citing FCRA §611 and documentation gaps.',
        actor: 'partner',
        href: '/portal/letters',
      },
      {
        id: 'complaint_checkpoint',
        title: 'Complaint checkpoint',
        detail: 'Evaluate CFPB, AG, BBB, or FTC complaint between rounds — document in escalations.',
        actor: 'dispute_specialist',
        href: '/portal/escalations',
        commsTemplateHint: 'complaint_filed_partner_update',
      },
      {
        id: 'prep_next_round',
        title: `Prepare ${nextStage}`,
        detail: `Generate ${nextStage} letter with new evidence angle and prior round references.`,
        actor: 'partner',
        href: '/portal/letters',
        required: stage !== 'Litigation',
      },
    ];
  }

  if (outcome === 'no_response') {
    return [
      ...common,
      {
        id: 'deadline_check',
        title: 'Confirm investigation deadline passed',
        detail: 'Bureau typically has ~30 days (45 max). Document overdue status.',
        actor: 'credit_specialist',
      },
      {
        id: 'cfpb_overdue',
        title: 'CFPB complaint for non-response',
        detail: 'File regulatory complaint citing missed investigation deadline.',
        actor: 'dispute_specialist',
        href: '/portal/escalations',
        commsTemplateHint: 'cfpb_no_response_filed',
      },
      {
        id: 'advance_round',
        title: 'Advance round with procedural violation',
        detail: 'Next round letter cites failure to investigate within statutory window.',
        actor: 'partner',
        href: '/portal/letters',
      },
    ];
  }

  if (outcome === 'partial') {
    return [
      ...common,
      {
        id: 'partial_audit',
        title: 'Audit partial deletion vs remaining tradelines',
        detail: 'Compare updated report line-by-line; note which fields changed and which remain negative.',
        actor: 'credit_specialist',
        href: '/portal/reports',
      },
      {
        id: 'partial_evidence',
        title: 'Attach partial response proof',
        detail: 'Upload bureau letter and highlight partial compliance in evidence vault.',
        actor: 'partner',
        href: '/portal/documents',
      },
      {
        id: 'partial_next_angle',
        title: 'Prepare targeted next-round angle',
        detail: 'Next letter addresses only remaining inaccuracies with new evidence or furnisher-direct.',
        actor: 'partner',
        href: '/portal/letters',
        required: true,
      },
      {
        id: 'partial_comms',
        title: 'Partner update — partial win',
        detail: 'Specialist explains what changed, what is left, and recommended next round timing.',
        actor: 'dispute_specialist',
        commsTemplateHint: 'dispute_partial_deletion_update',
      },
    ];
  }

  if (outcome === 'reinserted') {
    return [
      ...common,
      {
        id: 'reinsert_verify',
        title: 'Verify reinsertion on fresh report',
        detail: 'Pull updated report; confirm item reappeared and document dates of deletion vs reinsertion.',
        actor: 'credit_specialist',
        href: '/portal/reports',
        required: true,
      },
      {
        id: 'reinsert_notice',
        title: 'Demand reinsertion notice (FCRA §611)',
        detail: 'Request written notice of reinsertion if not already provided by bureau.',
        actor: 'dispute_specialist',
      },
      {
        id: 'reinsert_complaint',
        title: 'Regulatory complaint for improper reinsertion',
        detail: 'CFPB or AG complaint when reinsertion occurred without required consumer notice.',
        actor: 'dispute_specialist',
        href: '/portal/escalations',
        commsTemplateHint: 'dispute_reinsertion_escalation',
      },
      {
        id: 'reinsert_round',
        title: 'Escalation round letter',
        detail: 'Cite procedural violation and demand immediate removal with documented damages timeline.',
        actor: 'partner',
        href: '/portal/letters',
        required: true,
      },
    ];
  }

  return common;
}

export function getResponsePlaybook(stage: DisputePipelineStage, outcome: ResponseOutcome): ResponsePlaybook {
  const escalation =
    stage === 'Round 3' || stage === 'Round 4'
      ? ['CFPB complaint', 'State AG complaint', 'BBB filing', 'Internal compliance review']
      : stage === 'Litigation'
        ? ['Attorney packet assembly', 'Demand letter', 'Court filing prep']
        : ['Furnisher-direct', 'Internal escalation'];

  return {
    stage,
    outcome,
    title: `${stage} — ${outcome.replace(/_/g, ' ')}`,
    summary: `Real steps after a bureau response during ${stage}. Complaints and escalations can run between any round.`,
    steps: stepsFor(stage, outcome),
    escalationOptions: escalation,
  };
}

export const RESPONSE_OUTCOMES: ResponseOutcome[] = [
  'deleted',
  'updated',
  'verified_unchanged',
  'no_response',
  'partial',
  'reinserted',
];

export const RESTORE_AFTER_ROUND_ONE: PlaybookStep[] = [
  {
    id: 'r1_mail_proof',
    title: 'Mail Round 1 + save proof',
    detail: 'Upload certified mail receipt or upload proof in letters vault.',
    actor: 'partner',
    href: '/portal/letters',
    required: true,
  },
  {
    id: 'r1_timer',
    title: 'Start 30–35 day response timer',
    detail: 'System creates follow-up task; specialist monitors due date.',
    actor: 'system',
  },
  {
    id: 'r1_evidence',
    title: 'Evidence vault ready for response',
    detail: 'Prepare folder for bureau mail, screenshots, and updated report.',
    actor: 'partner',
    href: '/portal/documents',
  },
  {
    id: 'r1_restore_hud',
    title: 'Credit restore HUD — step 4 complete',
    detail: 'Partner dashboard shows letters mailed milestone; next HUD focus is response handling.',
    actor: 'partner',
    href: '/portal',
  },
  {
    id: 'r1_comms',
    title: 'Specialist check-in',
    detail: 'Dispute specialist sends Round 1 mailed confirmation via portal + optional SMS deadline reminder.',
    actor: 'dispute_specialist',
    commsTemplateHint: 'dispute_r1_mailed_confirmation',
  },
];

export const RESTORE_AFTER_ROUND_TWO: PlaybookStep[] = [
  {
    id: 'r2_furnisher',
    title: 'Furnisher-direct parallel (if applicable)',
    detail: 'Send data furnisher dispute while Round 2 clock runs on bureau file.',
    actor: 'partner',
    href: '/portal/letters',
  },
  {
    id: 'r2_evidence_angle',
    title: 'New evidence angle documented',
    detail: 'Round 2 must cite Round 1 response gaps — attach MOV or procedural notes in vault.',
    actor: 'credit_specialist',
    href: '/portal/documents',
    required: true,
  },
  {
    id: 'r2_mail_proof',
    title: 'Mail Round 2 + save proof',
    detail: 'Certified mail receipt uploaded; 30–35 day timer restarts.',
    actor: 'partner',
    href: '/portal/letters',
    required: true,
  },
  {
    id: 'r2_comms',
    title: 'Round 2 mailed update',
    detail: 'Specialist confirms stronger evidence package and expected response window.',
    actor: 'dispute_specialist',
    commsTemplateHint: 'dispute_r2_mailed_confirmation',
  },
];

export const RESTORE_AFTER_ROUND_THREE: PlaybookStep[] = [
  {
    id: 'r3_complaint_ready',
    title: 'Complaint lane ready',
    detail: 'CFPB / AG / BBB templates pre-staged if Round 3 response is weak.',
    actor: 'dispute_specialist',
    href: '/portal/escalations',
  },
  {
    id: 'r3_procedural',
    title: 'Procedural violation log',
    detail: 'Document every missed deadline, vague verification, or method-of-verification gap.',
    actor: 'credit_specialist',
    required: true,
  },
  {
    id: 'r3_mail_proof',
    title: 'Mail Round 3 + save proof',
    detail: 'Strongest evidence round — certified mail and vault proof required.',
    actor: 'partner',
    href: '/portal/letters',
    required: true,
  },
  {
    id: 'r3_comms',
    title: 'Escalation-aware partner briefing',
    detail: 'Specialist sets expectations for regulatory options between Round 3 and 4.',
    actor: 'dispute_specialist',
    commsTemplateHint: 'dispute_r3_escalation_brief',
  },
];

export const RESTORE_AFTER_ROUND_FOUR: PlaybookStep[] = [
  {
    id: 'r4_final_push',
    title: 'Final bureau push mailed',
    detail: 'Round 4 letter references full dispute history and demands resolution before litigation.',
    actor: 'partner',
    href: '/portal/letters',
    required: true,
  },
  {
    id: 'r4_litigation_prep',
    title: 'Pre-litigation packet staging',
    detail: 'Attorney packet, demand letter, and damages timeline assembled if items remain.',
    actor: 'dispute_specialist',
    href: '/portal/escalations',
  },
  {
    id: 'r4_partner_signoff',
    title: 'Partner sign-off on next path',
    detail: 'Close with deletions, continue regulatory complaints, or advance to litigation lane.',
    actor: 'partner',
    href: '/portal/disputes',
    required: true,
  },
  {
    id: 'r4_comms',
    title: 'Round 4 / litigation handoff',
    detail: 'Specialist comms with litigation prep notice when Round 4 response is insufficient.',
    actor: 'dispute_specialist',
    commsTemplateHint: 'tpl_litigation_prep_notice',
  },
];

export function getRestoreAfterRound(round: DisputeRoundLabel): PlaybookStep[] {
  if (round === 'Round 1') return RESTORE_AFTER_ROUND_ONE;
  if (round === 'Round 2') return RESTORE_AFTER_ROUND_TWO;
  if (round === 'Round 3') return RESTORE_AFTER_ROUND_THREE;
  return RESTORE_AFTER_ROUND_FOUR;
}
