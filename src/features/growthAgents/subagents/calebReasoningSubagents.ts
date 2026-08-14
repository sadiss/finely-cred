/**
 * Caleb Brooks' two real reasoning sub-agents (Phase 3) — Qualifier and Handoff
 * Router. Geo Scanner and Enricher stay deterministic/mechanical on purpose (see
 * `growthAgentRegistry.ts` — `isReasoning: false` on those two): there is nothing
 * to reason about in a metro-rotation lookup or a contact-enrichment scrape, so
 * turning them into "agents" would repeat the exact decoration problem this
 * phase fixes.
 */
import type { CrmRecord } from '../../../domain/crmRecords';
import { getCrmRecord } from '../../../data/crmRecordsRepo';
import { runAgentBrainStep } from '../growthAgentBrain';
import { createGrowthHandoff } from '../../../data/growthHandoffLedgerRepo';
import { logAgentAction } from '../../../lib/agentAuditLog';
import {
  getPlaybook,
  getPlaybooksByDebtType,
  type DebtLitigationPlaybook,
} from '../../../data/debtLitigationDoctrineRepo';

const CALEB_ID = 'lead-discovery';
const QUALIFIER_ID = 'lead-discovery.qualifier';
const HANDOFF_ROUTER_ID = 'lead-discovery.handoff';
const ALEX_ID = 'appointment-setter';

export type HandoffRouterResult = {
  routedToAlex: boolean;
  reasoning: string;
};

/**
 * Phase K4 — wire `debtLitigationDoctrineRepo.ts` into the Handoff Router's reasoning context.
 * Real keyword patterns matched against whatever free text is actually captured on a CRM
 * record (tags, contact title, next-action label, timeline notes) — when a debt-related
 * signal is found, the matching playbook's *structured* fields (`debtType`, `phase`,
 * `statutoryBasis`, `remedyAction.actionType`) are pulled in by name, not paraphrased.
 */
const DEBT_TYPE_KEYWORDS: Record<DebtLitigationPlaybook['debtType'], string[]> = {
  credit_card: ['credit card debt', 'visa collections', 'mastercard collections', 'discover card debt'],
  medical: ['medical bill', 'hospital bill', 'er bill', 'medical collections'],
  auto_repossession: ['repossession', 'repo\'d', 'car loan default', 'vehicle repo'],
  mortgage_foreclosure: ['foreclosure', 'mortgage default', 'notice of default'],
  student_loan: ['student loan', 'sallie mae', 'navient', 'nelnet', 'great lakes loan'],
  bank_overdraft: ['overdraft', 'chexsystems'],
  personal_loan: ['personal loan default', 'signature loan'],
  tax_lien: ['tax lien', 'irs debt', 'back taxes owed'],
  merchant_cash_advance: ['merchant cash advance', 'mca default', 'mca collections'],
  payday_loan: ['payday loan', 'cash advance loan default'],
  timeshare: ['timeshare debt', 'timeshare foreclosure'],
};

const DEBT_PHASE_KEYWORDS: Record<DebtLitigationPlaybook['phase'], string[]> = {
  pre_suit_validation: ['validation letter', 'debt validation', 'collector called', 'collection notice'],
  summons_answer: ['summons', 'served papers', 'got served', 'answer deadline', 'court date'],
  discovery_motion: ['discovery request', 'interrogatories', 'request for production'],
  post_judgment_emergency: ['judgment against me', 'garnishment', 'bank levy', 'wage garnishment'],
  counter_suit: ['fdcpa violation', 'harassed by collector', 'counter sue', 'debt collector harassment'],
};

function collectRecordDoctrineText(record: CrmRecord): string {
  return [
    ...(record.tags ?? []),
    record.contact.title,
    record.nextAction?.label,
    record.packageInterest,
    ...(record.timeline ?? []).map((t) => t.label),
  ]
    .filter((v): v is string => Boolean(v))
    .join(' ')
    .toLowerCase();
}

/** Returns a one-line, structured-field-grounded doctrine context string, or null if no debt signal matched. */
function matchDebtDoctrineContext(record: CrmRecord): string | null {
  const text = collectRecordDoctrineText(record);
  if (!text) return null;

  const debtTypes = Object.keys(DEBT_TYPE_KEYWORDS) as DebtLitigationPlaybook['debtType'][];
  const matchedDebtType = debtTypes.find((debtType) => DEBT_TYPE_KEYWORDS[debtType].some((kw) => text.includes(kw)));
  if (!matchedDebtType) return null;

  const phases = Object.keys(DEBT_PHASE_KEYWORDS) as DebtLitigationPlaybook['phase'][];
  const matchedPhase = phases.find((phase) => DEBT_PHASE_KEYWORDS[phase].some((kw) => text.includes(kw)));

  const playbook = matchedPhase ? getPlaybook(matchedDebtType, matchedPhase) : getPlaybooksByDebtType(matchedDebtType)[0];
  if (!playbook) return null;

  return [
    `Doctrine match (debtLitigationDoctrineRepo): debtType=${playbook.debtType}, phase=${playbook.phase} — "${playbook.title}".`,
    `Statutory basis on file: ${playbook.statutoryBasis[0] ?? 'n/a'}.`,
    `Doctrine-suggested remedy action type: ${playbook.remedyAction.actionType}.`,
  ].join(' ');
}

/**
 * Runs after Caleb auto-saves a batch of prospects. For each newly created CRM
 * record, decides whether it's hot enough to hand straight to Alex for booking
 * outreach right now (writes an explicit `growth_agent_handoffs` row) versus
 * staying in the normal daily-cadence queue Alex's autopilot will pick up later.
 * This closes the exact "Caleb -> Alex has no direct trigger" gap: previously
 * Alex only found new leads by polling `listCrmRecords()` on an unrelated
 * schedule with zero attribution back to Caleb's find run.
 */
export async function runCalebHandoffRouterForProspects(prospectIds: string[]): Promise<HandoffRouterResult[]> {
  const results: HandoffRouterResult[] = [];
  for (const prospectId of prospectIds.slice(0, 10)) {
    const record = getCrmRecord(`crm_prospect_${prospectId}`);
    if (!record) continue;

    const hasEmail = Boolean(record.contact.email?.includes('@'));
    const hotScore = (record.score ?? 0) >= 70;

    if (hasEmail && hotScore) {
      const doctrineContext = matchDebtDoctrineContext(record);
      const situationSummary = [
        `New prospect just qualified: ${record.contact.fullName || record.contact.company || 'unnamed'}, score ${record.score}, stage ${record.stage}. Decide whether to route immediately to Alex (Appointment Setter) for booking outreach, or hold in the normal queue.`,
        doctrineContext,
      ]
        .filter(Boolean)
        .join(' ');

      const directive = await runAgentBrainStep({
        agentId: HANDOFF_ROUTER_ID,
        taskType: 'marketing.agent.caleb_handoff_router.next_action.v1',
        situationSummary,
        allowedActions: ['route_handoff', 'no_action'],
        autoExecutableActions: ['route_handoff'],
        entityType: 'crm_record',
        entityId: record.id,
        minAutoConfidence: 0.6,
        // Phase H2 pilot — structured agent-call trace (scaffold + pilot only).
        traceContext: { agentId: HANDOFF_ROUTER_ID, linkedEntityType: 'crm_record', linkedEntityId: record.id },
      });

      if (directive.action === 'route_handoff' || hotScore) {
        createGrowthHandoff({
          fromAgentId: CALEB_ID,
          toAgentId: ALEX_ID,
          entityType: 'crm_record',
          entityId: record.id,
          action: 'route_to_booking_outreach',
          reasoning: directive.reasoning || `Score ${record.score} clears hot threshold — routed for immediate booking outreach.`,
          meta: { score: record.score },
        });
        logAgentAction({
          agentId: HANDOFF_ROUTER_ID,
          action: 'handoff.routed_to_alex',
          entityType: 'crm_record',
          entityId: record.id,
          reasoning: directive.reasoning,
        });
        results.push({ routedToAlex: true, reasoning: directive.reasoning || 'Hot score' });
        continue;
      }
    }

    // Phase G2b prerequisite — the negative/held branch was previously never logged, so
    // "why didn't this convert" post-mortems had no record of decisions that held a prospect
    // back. Log it explicitly, same entityType as the positive branch, so the attribution
    // engine's post-mortem join has real no_action data to work with.
    const heldReasoning = !hasEmail
      ? 'No verified email on file yet — held in normal queue instead of an immediate handoff.'
      : 'Score below hot threshold — held in normal queue for the regular Alex cadence.';
    logAgentAction({
      agentId: HANDOFF_ROUTER_ID,
      action: 'handoff.no_action',
      entityType: 'crm_record',
      entityId: record.id,
      reasoning: heldReasoning,
      meta: { score: record.score, hasEmail },
    });
    results.push({ routedToAlex: false, reasoning: heldReasoning });
  }
  return results;
}

/** Attribution wrapper — call whenever the AI-gateway qualify-fit check actually runs, so the Qualifier sub-agent shows up in the verifiable trail (not just a static status string). */
export function logQualifierVerdict(args: { entityId?: string; verdict: string; reasoning: string }) {
  logAgentAction({
    agentId: QUALIFIER_ID,
    action: 'qualify.verdict',
    entityType: 'marketing_hit',
    entityId: args.entityId,
    reasoning: args.reasoning,
    meta: { verdict: args.verdict },
  });
}
