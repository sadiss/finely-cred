/**
 * What a partner does *after* a debt matter ends in a monthly payment plan.
 *
 * Reusable for any post-court payment-plan partner — the Roosevelt Corelus
 * Midland / Citi matter is just the first case that ships with it.
 * Educational self-help · not legal advice.
 */

import type { EscalationStep } from './letterEscalationPaths';
import {
  buildPaymentSchedule,
  courtOutcomeBasisLabel,
  formatUsdCents,
  paymentPlanProgress,
  type PartnerCourtOutcome,
} from '../domain/courtOutcomes';

export type PostCourtStepStatus = 'done' | 'now' | 'later';

export type PostCourtStep = {
  id: string;
  n: number;
  title: string;
  /** Plain-English "what this actually means". */
  plain: string;
  /** The single action the partner takes. */
  nextAction: string;
  /** When it happens. */
  timing: string;
  status: PostCourtStepStatus;
  /** Internal route the partner or admin can open. */
  href?: string;
  hrefLabel?: string;
  externalUrl?: string;
  externalLabel?: string;
};

/**
 * Sequential path after a payment-plan outcome. Status is derived from what the
 * outcome record already knows, so the partner always sees one obvious next step.
 */
export function buildPostCourtPlanSteps(outcome: PartnerCourtOutcome): PostCourtStep[] {
  const plan = outcome.plan;
  const progress = plan
    ? paymentPlanProgress(plan, { confirmedCount: outcome.confirmedPaymentIsos?.length ?? 0 })
    : null;
  const schedule = plan ? buildPaymentSchedule(plan) : [];
  const monthly = plan ? formatUsdCents(plan.monthlyCents) : 'the monthly amount';
  const term = plan ? `${plan.termMonths} months` : 'the plan term';
  const total = plan ? formatUsdCents(plan.monthlyCents * plan.termMonths) : '';
  const finalIso = progress?.finalDueIso || '';
  const nextIso = progress?.nextDueIso || '';
  const started = (progress?.confirmedCount ?? 0) > 0;
  const finished = Boolean(progress && progress.remainingCount === 0);

  return [
    {
      id: 'order_on_file',
      n: 1,
      title: 'Get the written agreement on file',
      plain: `The outcome came from ${courtOutcomeBasisLabel(outcome.basis).toLowerCase()}. Whatever the court entered or the parties signed needs to exist on paper — the exact amount, the number of payments, and where payments go.`,
      nextAction: outcome.writtenOrderOnFile
        ? 'Written agreement is saved. Keep the original with your court papers.'
        : 'Request the stamped order or signed stipulation from the clerk or plaintiff counsel, then upload it to your vault.',
      timing: 'Within 7 days of the hearing',
      status: outcome.writtenOrderOnFile ? 'done' : 'now',
      href: '/portal/documents',
      hrefLabel: 'Upload to vault',
    },
    {
      id: 'calendar_payments',
      n: 2,
      title: `Calendar all ${term} of payments`,
      plain: `${monthly} is due every month${schedule.length ? ` starting ${schedule[0]!.dueIso}` : ''}${finalIso ? ` and ending ${finalIso}` : ''}${total ? ` — ${total} in total` : ''}. A missed payment is the single biggest risk left in this matter.`,
      nextAction: 'Set an automatic monthly reminder 3 days before each due date, and pay by a method that leaves a receipt.',
      timing: 'Before the first payment is due',
      status: started ? 'done' : 'now',
      href: '/portal/debt?tab=court',
      hrefLabel: 'Open court track',
    },
    {
      id: 'receipt_discipline',
      n: 3,
      title: 'Keep a receipt for every payment',
      plain:
        'Pay by check, money order, or a traceable transfer. Never pay cash without a signed receipt. Your receipts are the proof that closes this out.',
      nextAction: `Log each payment in the portal and save the receipt image${nextIso ? ` — next payment due ${nextIso}` : ''}.`,
      timing: 'Every month for the life of the plan',
      status: finished ? 'done' : started ? 'now' : 'later',
      href: '/portal/documents',
      hrefLabel: 'Save receipts',
    },
    {
      id: 'missed_payment_rule',
      n: 4,
      title: 'Know the missed-payment rule before you need it',
      plain:
        'If a payment will be late, act before the due date — not after. Most plans allow a written cure; silence is what turns a plan into a judgment or a garnishment.',
      nextAction:
        'If a payment is at risk, send a written notice to plaintiff counsel the same week and open the escalation path below.',
      timing: 'Any month a payment is at risk',
      status: (progress?.behindCount ?? 0) > 0 ? 'now' : 'later',
      href: '/portal/escalations',
      hrefLabel: 'Open escalation',
    },
    {
      id: 'midpoint_audit',
      n: 5,
      title: 'Audit the balance at the halfway point',
      plain:
        'Ask in writing for a payment history and the remaining balance. Confirm every payment you made was credited and that no fees or interest were quietly added.',
      nextAction: 'Send a written payment-history request to the payee and compare it to your receipts.',
      timing: plan ? `Around payment ${Math.ceil(plan.termMonths / 2)}` : 'Halfway through the plan',
      status: progress && progress.confirmedCount >= Math.ceil((plan?.termMonths ?? 2) / 2) ? 'now' : 'later',
      href: '/portal/letters',
      hrefLabel: 'Build the request',
    },
    {
      id: 'satisfaction',
      n: 6,
      title: 'Get satisfaction / dismissal paperwork at the end',
      plain: `When the last payment clears${finalIso ? ` (${finalIso})` : ''}, the matter is not finished until you hold written proof that it is satisfied and closed.`,
      nextAction:
        'Request a satisfaction of judgment, dismissal, or paid-in-full letter in writing, and file it with the court if a judgment was entered.',
      timing: 'Within 30 days of the final payment',
      status: finished ? 'now' : 'later',
      href: '/portal/letters',
      hrefLabel: 'Build the request',
    },
    {
      id: 'credit_followup',
      n: 7,
      title: 'Clean up the credit report after the plan closes',
      plain:
        'A satisfied matter should not keep reporting as an unpaid balance. Once you hold the satisfaction paperwork, the reporting has to match it.',
      nextAction:
        'Pull all three reports, compare them to your satisfaction letter, and dispute any tradeline still showing a balance or an open judgment.',
      timing: '30–60 days after the final payment',
      status: finished ? 'later' : 'later',
      href: '/portal/disputes',
      hrefLabel: 'Start a dispute',
    },
  ];
}

export type PostCourtEscalationTrigger =
  | 'payment_missed'
  | 'improper_contact'
  | 'terms_disputed'
  | 'closeout_docs_missing';

export type PostCourtEscalationStep = EscalationStep & {
  trigger: PostCourtEscalationTrigger;
  /** Internal Finely route that starts this level. */
  href?: string;
  hrefLabel?: string;
};

export const POST_COURT_ESCALATION_TRIGGER_LABELS: Record<PostCourtEscalationTrigger, string> = {
  payment_missed: 'A payment was missed or will be late',
  improper_contact: 'The collector is contacting you improperly',
  terms_disputed: 'The plan terms or balance are wrong',
  closeout_docs_missing: 'End-of-plan paperwork never arrived',
};

/**
 * Escalation ladder for a live payment plan. Every level names who it goes to and,
 * where a real filing exists, links straight to it.
 */
export const POST_COURT_PLAN_ESCALATION: PostCourtEscalationStep[] = [
  {
    level: 1,
    trigger: 'payment_missed',
    title: 'Cure it in writing before the due date',
    subtitle: 'Self-cure — cheapest and fastest fix',
    when: 'You know a payment will be short or late.',
    actions: [
      'Send plaintiff counsel (and the payee) a dated written notice naming the payment, the amount, and the date you will pay.',
      'Pay whatever you can toward that month rather than skipping it entirely.',
      'Save the notice and the payment receipt together in your vault.',
    ],
    escalateTo: 'Plaintiff counsel / payee — in writing',
    timing: 'Before the due date, never after',
    evidenceChecklist: ['Written notice with date', 'Partial payment receipt', 'Plan order or stipulation'],
    href: '/portal/letters',
    hrefLabel: 'Draft the notice',
  },
  {
    level: 2,
    trigger: 'payment_missed',
    title: 'Ask the court to modify or reinstate the plan',
    subtitle: 'Keep the plan alive instead of defaulting',
    when: 'You missed a payment and the payee is threatening to accelerate, execute, or garnish.',
    actions: [
      'File a written motion to modify the payment schedule or to reinstate the plan, attaching your payment receipts.',
      'Ask for the smallest change that you can actually sustain — courts reward realistic numbers.',
      'Appear on the date given. Missing that date is what converts a plan into an enforceable judgment.',
    ],
    escalateTo: 'The court that entered the plan',
    timing: 'Same week you fall behind',
    evidenceChecklist: ['Full receipt history', 'Plan order', 'Proof of the hardship (hours cut, medical, etc.)'],
    href: '/portal/debt?tab=court',
    hrefLabel: 'Open court track',
  },
  {
    level: 3,
    trigger: 'improper_contact',
    title: 'Send a written contact-conduct notice',
    subtitle: 'FDCPA limits still apply during a plan',
    when: 'Calls at prohibited hours, contact at work after you said stop, threats, or contact that goes around your representation.',
    actions: [
      'Log every contact — date, time, number, and what was said.',
      'Send a written notice citing FDCPA § 1692c (communication) and § 1692d (harassment) and state exactly what must stop.',
      'Keep paying the plan while the conduct issue is handled — the two are separate.',
    ],
    escalateTo: 'Collector compliance department (certified mail)',
    externalUrl: 'https://www.law.cornell.edu/uscode/text/15/1692c',
    timing: 'Within days of the contact',
    evidenceChecklist: ['Contact log', 'Voicemails or texts', 'Prior written instructions you sent'],
    href: '/portal/letters',
    hrefLabel: 'Draft the notice',
  },
  {
    level: 4,
    trigger: 'terms_disputed',
    title: 'Demand a written payment history and payoff figure',
    subtitle: 'Force the math into writing',
    when: 'The balance, the credited payments, or added fees and interest do not match your receipts.',
    actions: [
      'Request a full payment history and current payoff figure in writing.',
      'Send your own receipt ledger alongside it and identify each discrepancy line by line.',
      'Do not make a new verbal arrangement over the phone — it will not survive later.',
    ],
    escalateTo: 'Payee + plaintiff counsel of record',
    timing: 'As soon as the numbers stop matching',
    evidenceChecklist: ['Your receipt ledger', 'Their statements', 'The signed plan or order'],
    href: '/portal/letters',
    hrefLabel: 'Build the request',
  },
  {
    level: 5,
    trigger: 'improper_contact',
    title: 'File a CFPB complaint',
    subtitle: 'Federal regulator — debt collection',
    when: 'Written notices are ignored, contact continues, or payments keep being misapplied.',
    actions: [
      'File at consumerfinance.gov/complaint under “Debt collection” and attach your letters and receipts.',
      'Name the collector, the plaintiff, and the plan by case number.',
      'Save the CFPB reference number — you will cite it at every later level.',
    ],
    escalateTo: 'Consumer Financial Protection Bureau',
    externalUrl: 'https://www.consumerfinance.gov/complaint/',
    timing: 'After your written notice goes unanswered',
    evidenceChecklist: ['Letter chain', 'Contact log', 'Receipt history', 'Plan order'],
  },
  {
    level: 6,
    trigger: 'closeout_docs_missing',
    title: 'State Attorney General + court filing for satisfaction',
    subtitle: 'Close the matter on the record',
    when: 'The plan is paid in full but no satisfaction, dismissal, or paid-in-full letter arrives.',
    actions: [
      'Send a final written demand for satisfaction paperwork with your complete receipt history attached.',
      'File a motion or praecipe with the court to enter satisfaction if a judgment was on the docket.',
      'File a state Attorney General complaint if the payee simply refuses to close it out.',
    ],
    escalateTo: 'The court + your state Attorney General',
    externalUrl: 'https://www.naag.org/find-my-ag/',
    timing: '30 days after the final payment clears',
    evidenceChecklist: ['All receipts', 'Final demand letter', 'Docket printout'],
    href: '/portal/debt?tab=court',
    hrefLabel: 'Open court track',
  },
  {
    level: 7,
    trigger: 'terms_disputed',
    title: 'Specialist handoff + attorney review',
    subtitle: 'When money or your wages are on the line',
    when: 'Garnishment or execution is threatened, the payee refuses to correct the record, or the plan is being enforced against terms you never agreed to.',
    actions: [
      'Flag the case for your Credit Specialist so the full evidence file is packaged in one place.',
      'Consult a consumer attorney — FDCPA and FCRA claims often shift fees to the other side.',
      'Report fraud or an imposter payee to the FTC.',
    ],
    escalateTo: 'Credit Specialist + licensed consumer attorney',
    externalUrl: 'https://reportfraud.ftc.gov/',
    timing: 'Immediately when wages or bank funds are targeted',
    evidenceChecklist: ['Complete vault export', 'Plan order', 'Garnishment or execution papers'],
    href: '/portal/messages',
    hrefLabel: 'Message my specialist',
  },
];

export function postCourtEscalationForTrigger(
  trigger: PostCourtEscalationTrigger | 'all',
): PostCourtEscalationStep[] {
  if (trigger === 'all') return POST_COURT_PLAN_ESCALATION;
  return POST_COURT_PLAN_ESCALATION.filter((s) => s.trigger === trigger);
}

/** Live risk flags an admin or the portal HUD should surface first. */
export function postCourtPlanRiskFlags(outcome: PartnerCourtOutcome, now = new Date()): string[] {
  const flags: string[] = [];
  if (!outcome.writtenOrderOnFile) flags.push('Written agreement not on file yet');
  if (!outcome.plan) return flags;
  const progress = paymentPlanProgress(outcome.plan, {
    confirmedCount: outcome.confirmedPaymentIsos?.length ?? 0,
    now,
  });
  if (progress.behindCount > 0) {
    flags.push(
      `${progress.behindCount} payment${progress.behindCount === 1 ? '' : 's'} due but not confirmed`,
    );
  }
  if (progress.remainingCount === 0) flags.push('Plan complete — request satisfaction paperwork');
  return flags;
}
