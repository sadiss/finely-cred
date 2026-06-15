import type { DebtCase } from '../domain/debt';
import { addDaysIso, nowIso } from '../domain/cases';
import { createTask, listTasksByPartner } from '../data/tasksRepo';
import { emitPlatformEvent } from '../domain/platformEvents';

export const FDCPA_VALIDATION_DAYS = 30;
export const SUMMONS_ANSWER_DAYS = 35;

export type DebtTimerKind = 'fdcpa_validation' | 'summons_answer' | 'validation_follow_up';

export type DebtWorkflowTimer = {
  kind: DebtTimerKind;
  label: string;
  dueAt: string;
  daysRemaining: number;
  tone: 'ok' | 'warning' | 'blocking';
  debtCaseId: string;
};

function debtTaskTag(debtCaseId: string, kind: DebtTimerKind) {
  return `debt_timer:${debtCaseId}:${kind}`;
}

function hasDebtTask(partnerId: string, debtCaseId: string, kind: DebtTimerKind) {
  const tag = debtTaskTag(debtCaseId, kind);
  return listTasksByPartner(partnerId).some(
    (t) => (t.tags ?? []).includes(tag) && t.status !== 'completed' && t.status !== 'cancelled',
  );
}

function spawnDebtTimerTask(args: {
  partnerId: string;
  debt: DebtCase;
  kind: DebtTimerKind;
  title: string;
  dueAt: string;
  notes: string;
}) {
  if (hasDebtTask(args.partnerId, args.debt.id, args.kind)) return false;
  createTask({
    partnerId: args.partnerId,
    title: args.title,
    kind: 'follow_up',
    stage: 'disputes',
    status: 'pending',
    dueAt: args.dueAt,
    priority: args.kind === 'summons_answer' ? 'urgent' : 'high',
    notes: args.notes,
    assignedTo: 'partner',
    tags: ['debt_os', `debt_case:${args.debt.id}`, debtTaskTag(args.debt.id, args.kind), 'persona:debt_strategist'],
  });
  return true;
}

/** Spawn Work OS tasks + platform event when a debt/summons case is created. */
export function onDebtCaseCreated(debt: DebtCase): { tasksCreated: number } {
  let tasksCreated = 0;

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    partnerId: debt.partnerId,
    entityType: 'debt_case',
    entityId: debt.id,
    payload: { kind: 'debt_case_created', caseType: debt.type, name: debt.name },
  });

  if (debt.type === 'debt') {
    const dueAt = addDaysIso(nowIso(), FDCPA_VALIDATION_DAYS);
    if (
      spawnDebtTimerTask({
        partnerId: debt.partnerId,
        debt,
        kind: 'fdcpa_validation',
        title: `FDCPA validation window: "${debt.name}"`,
        dueAt,
        notes: `Casey (Debt Strategist): Send validation request within ${FDCPA_VALIDATION_DAYS} days of first written contact. Collectors must cease until validated. Educational only — not legal advice.`,
      })
    ) {
      tasksCreated += 1;
    }
  }

  if (debt.type === 'summons') {
    const dueAt = addDaysIso(nowIso(), SUMMONS_ANSWER_DAYS);
    if (
      spawnDebtTimerTask({
        partnerId: debt.partnerId,
        debt,
        kind: 'summons_answer',
        title: `Summons answer deadline: "${debt.name}"`,
        dueAt,
        notes: `File or mail your answer within ~${SUMMONS_ANSWER_DAYS} days of service (varies by state). Use the summons response template on this case. Educational only — verify local rules.`,
      })
    ) {
      tasksCreated += 1;
    }
  }

  return { tasksCreated };
}

/** Recompute timers when first contact or service dates are set. */
export function onDebtCaseUpdated(prev: DebtCase, next: DebtCase): { tasksCreated: number } {
  let tasksCreated = 0;

  if (next.type === 'debt' && next.firstContactDate && next.firstContactDate !== prev.firstContactDate) {
    const dueAt = addDaysIso(next.firstContactDate, FDCPA_VALIDATION_DAYS);
    if (
      spawnDebtTimerTask({
        partnerId: next.partnerId,
        debt: next,
        kind: 'fdcpa_validation',
        title: `FDCPA validation deadline: "${next.name}"`,
        dueAt,
        notes: `Validation must be requested within ${FDCPA_VALIDATION_DAYS} days of first written contact (${next.firstContactDate}).`,
      })
    ) {
      tasksCreated += 1;
    }
  }

  if (next.type === 'summons' && next.dateServed && next.dateServed !== prev.dateServed) {
    const dueAt = addDaysIso(next.dateServed, SUMMONS_ANSWER_DAYS);
    if (
      spawnDebtTimerTask({
        partnerId: next.partnerId,
        debt: next,
        kind: 'summons_answer',
        title: `Answer due: "${next.name}" (served ${next.dateServed})`,
        dueAt,
        notes: `Summons served ${next.dateServed}. Typical answer window ~${SUMMONS_ANSWER_DAYS} days — confirm your court rules.`,
      })
    ) {
      tasksCreated += 1;
    }
  }

  return { tasksCreated };
}

export function listDebtWorkflowTimers(debt: DebtCase): DebtWorkflowTimer[] {
  const now = Date.now();
  const timers: DebtWorkflowTimer[] = [];

  const push = (kind: DebtTimerKind, label: string, anchorIso: string, windowDays: number) => {
    const dueMs = Date.parse(addDaysIso(anchorIso, windowDays));
    const daysRemaining = Math.ceil((dueMs - now) / (24 * 60 * 60 * 1000));
    timers.push({
      kind,
      label,
      dueAt: addDaysIso(anchorIso, windowDays),
      daysRemaining,
      tone: daysRemaining <= 0 ? 'blocking' : daysRemaining <= 7 ? 'warning' : 'ok',
      debtCaseId: debt.id,
    });
  };

  if (debt.type === 'debt') {
    const anchor = debt.firstContactDate ?? debt.createdAt.slice(0, 10);
    push('fdcpa_validation', 'FDCPA validation window', anchor, FDCPA_VALIDATION_DAYS);
  }

  if (debt.type === 'summons') {
    const anchor = debt.dateServed ?? debt.createdAt.slice(0, 10);
    push('summons_answer', 'Summons answer deadline', anchor, SUMMONS_ANSWER_DAYS);
  }

  return timers;
}
