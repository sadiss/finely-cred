import type { DebtCase } from '../domain/debt';
import { addDaysIso, nowIso } from '../domain/cases';
import { describeClaimWindow, getStateExemptionProfile } from '../domain/stateExemptions';
import {
  describeCollateralReview,
  describeJudgmentClock,
  getStateJudgmentClocks,
  type AppealExtensionClock,
  type CollateralReviewClock,
  type JudgmentClockKind,
  type PostJudgmentProcedureClock,
} from '../domain/stateJudgmentClocks';
import {
  describeSmallClaimsWindow,
  describeSummonsWindow,
  getStateSummonsCalendar,
  SUMMONS_ANSWER_FALLBACK_DAYS,
  type StateSummonsCalendar,
} from '../domain/stateSummonsCalendars';
import { createTask, listTasksByPartner } from '../data/tasksRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import {
  addDeadlineDays,
  addDeadlineDaysSync,
  addTexasAnswerMonday,
  calendarDaysRemaining,
  rollForwardToOpenDay,
} from './businessDays';

export const FDCPA_VALIDATION_DAYS = 30;
/** Fallback when the case has no usable state. Prefer getStateSummonsCalendar. */
export const SUMMONS_ANSWER_DAYS = SUMMONS_ANSWER_FALLBACK_DAYS;

export type DebtTimerKind =
  | 'fdcpa_validation'
  | 'summons_answer'
  | 'validation_follow_up'
  | 'levy_claim_deadline'
  | 'post_judgment_review'
  | 'vacate_deadline'
  | 'appeal_deadline'
  | 'coj_deadline'
  | 'appeal_extended_deadline'
  | 'restricted_appeal_deadline'
  | 'bill_of_review_deadline';

export type DebtWorkflowTimer = {
  kind: DebtTimerKind;
  label: string;
  dueAt: string;
  daysRemaining: number;
  tone: 'ok' | 'warning' | 'blocking';
  debtCaseId: string;
  /** How the window was counted when a state profile supplied it. */
  windowLabel?: string;
  holidayAdjusted?: boolean;
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
  priority?: 'urgent' | 'high' | 'normal' | 'low';
}) {
  if (hasDebtTask(args.partnerId, args.debt.id, args.kind)) return false;
  createTask({
    partnerId: args.partnerId,
    title: args.title,
    kind: 'follow_up',
    stage: 'disputes',
    status: 'pending',
    dueAt: args.dueAt,
    priority:
      args.priority ??
      (args.kind === 'summons_answer' ||
      args.kind === 'levy_claim_deadline' ||
      args.kind === 'vacate_deadline' ||
      args.kind === 'appeal_deadline' ||
      args.kind === 'coj_deadline' ||
      args.kind === 'appeal_extended_deadline' ||
      args.kind === 'restricted_appeal_deadline' ||
      args.kind === 'bill_of_review_deadline'
        ? 'urgent'
        : 'high'),
    notes: args.notes,
    assignedTo: 'partner',
    tags: ['debt_os', `debt_case:${args.debt.id}`, debtTaskTag(args.debt.id, args.kind), 'persona:debt_strategist'],
  });
  return true;
}

function resolveLevyAnchorIso(debt: DebtCase): string {
  return debt.firstContactDate ?? debt.dateServed ?? debt.createdAt.slice(0, 10);
}

function resolveLevyState(debt: DebtCase): string | undefined {
  return debt.accountState ?? debt.judgmentState ?? debt.stateJurisdiction;
}

function isLevyClaimCase(debt: DebtCase): boolean {
  return debt.type === 'levy' || (debt.type === 'judgment' && debt.mechanism === 'levy');
}

function resolveJudgmentClockState(debt: DebtCase): string | undefined {
  return debt.judgmentState ?? debt.stateJurisdiction ?? debt.accountState;
}

function resolveJudgmentAnchorIso(debt: DebtCase): string {
  return debt.judgmentEnteredAt ?? debt.hearingDate ?? debt.dateServed ?? debt.createdAt.slice(0, 10);
}

function resolveSummonsState(debt: DebtCase): string | undefined {
  return debt.stateJurisdiction ?? debt.judgmentState ?? debt.accountState;
}

function resolveSummonsAnchorIso(debt: DebtCase): string {
  return debt.dateServed ?? debt.createdAt.slice(0, 10);
}

function resolveSummonsCalendar(debt: DebtCase): StateSummonsCalendar {
  return (
    getStateSummonsCalendar(resolveSummonsState(debt)) ?? {
      state: 'UNSET',
      days: SUMMONS_ANSWER_FALLBACK_DAYS,
      deadlineKind: 'calendar',
      countRule: 'fixed',
      citation: 'State not set — 35-day planning default',
      note: 'Add a state so the answer window can follow that court. Confirm the summons. Not legal advice.',
    }
  );
}

function addSummonsDueAtSync(anchorIso: string, calendar: StateSummonsCalendar): string {
  if (calendar.countRule === 'texas_monday_after_20') return addTexasAnswerMonday(anchorIso);
  return addDeadlineDaysSync(anchorIso, calendar.days, calendar.deadlineKind);
}

async function addSummonsDueAtAsync(anchorIso: string, calendar: StateSummonsCalendar): Promise<string> {
  if (calendar.countRule === 'texas_monday_after_20') {
    return rollForwardToOpenDay(addTexasAnswerMonday(anchorIso));
  }
  return addDeadlineDays(anchorIso, calendar.days, calendar.deadlineKind);
}

function resolveSummonsDue(debt: DebtCase): { dueAt: string | null; windowLabel: string; calendar: StateSummonsCalendar } {
  const calendar = resolveSummonsCalendar(debt);
  const anchor = resolveSummonsAnchorIso(debt);

  if (debt.summonsCourtTrack === 'small_claims' && calendar.smallClaims) {
    const track = calendar.smallClaims;
    const smallLabel = describeSmallClaimsWindow(calendar) ?? track.note;
    if (track.kind === 'appearance_date') {
      return {
        dueAt: debt.hearingDate || null,
        windowLabel: smallLabel,
        calendar,
      };
    }
    if (track.kind === 'fixed' && track.days != null && track.days > 0) {
      return {
        dueAt: addDeadlineDaysSync(anchor, track.days, track.deadlineKind ?? 'calendar'),
        windowLabel: smallLabel,
        calendar,
      };
    }
  }

  const alt = calendar.alternateGeneral;
  if (alt?.trigger === 'non_personal_or_out_of_state' && debt.summonsServiceMethod === 'other_or_out_of_state') {
    return {
      dueAt: addDeadlineDaysSync(anchor, alt.days, alt.deadlineKind),
      windowLabel: `${alt.days} calendar days (non-personal / out-of-state track) · ${alt.citation}`,
      calendar,
    };
  }
  if (alt?.trigger === 'summons_only' && debt.summonsPapersServed === 'summons_only') {
    return {
      dueAt: addDeadlineDaysSync(anchor, alt.days, alt.deadlineKind),
      windowLabel: `${alt.days} calendar days (summons-only track) · ${alt.citation}`,
      calendar,
    };
  }

  return {
    dueAt: addSummonsDueAtSync(anchor, calendar),
    windowLabel: `${describeSummonsWindow(calendar)} · ${calendar.citation}`,
    calendar,
  };
}

export function computeSummonsAnswerDueAt(debt: DebtCase): string | null {
  return resolveSummonsDue(debt).dueAt;
}

export async function computeSummonsAnswerDueAtAsync(debt: DebtCase): Promise<string | null> {
  const calendar = resolveSummonsCalendar(debt);
  const sync = resolveSummonsDue(debt);
  if (!sync.dueAt) return null;
  if (debt.summonsCourtTrack === 'small_claims' && calendar.smallClaims?.kind === 'appearance_date') {
    return debt.hearingDate || null;
  }
  if (debt.summonsCourtTrack === 'small_claims' && calendar.smallClaims?.kind === 'fixed' && calendar.smallClaims.days) {
    return addDeadlineDays(resolveSummonsAnchorIso(debt), calendar.smallClaims.days, calendar.smallClaims.deadlineKind ?? 'calendar');
  }
  if (
    calendar.alternateGeneral?.trigger === 'non_personal_or_out_of_state' &&
    debt.summonsServiceMethod === 'other_or_out_of_state'
  ) {
    return addDeadlineDays(
      resolveSummonsAnchorIso(debt),
      calendar.alternateGeneral.days,
      calendar.alternateGeneral.deadlineKind,
    );
  }
  if (calendar.alternateGeneral?.trigger === 'summons_only' && debt.summonsPapersServed === 'summons_only') {
    return addDeadlineDays(
      resolveSummonsAnchorIso(debt),
      calendar.alternateGeneral.days,
      calendar.alternateGeneral.deadlineKind,
    );
  }
  return addSummonsDueAtAsync(resolveSummonsAnchorIso(debt), calendar);
}

function resolveAppealExtension(debt: DebtCase): { clock: AppealExtensionClock; state: string } | null {
  if (!debt.postTrialMotionFiledAt) return null;
  const pack = getStateJudgmentClocks(resolveJudgmentClockState(debt));
  if (!pack?.appealExtension?.available || pack.appealExtension.days == null || pack.appealExtension.days <= 0) {
    return null;
  }
  return { clock: pack.appealExtension, state: pack.state };
}

function resolveRestrictedAppeal(debt: DebtCase): { clock: CollateralReviewClock; state: string; anchor: string } | null {
  const pack = getStateJudgmentClocks(resolveJudgmentClockState(debt));
  if (!pack?.restrictedAppeal || pack.restrictedAppeal.trigger !== 'no_participation') return null;
  if (!debt.didNotParticipateInHearing) return null;
  if (!debt.judgmentEnteredAt) return null;
  if (debt.postTrialMotionFiledAt) return null;
  return { clock: pack.restrictedAppeal, state: pack.state, anchor: debt.judgmentEnteredAt };
}

function resolveBillOfReview(debt: DebtCase): { clock: CollateralReviewClock; state: string; anchor: string } | null {
  const pack = getStateJudgmentClocks(resolveJudgmentClockState(debt));
  if (!pack?.billOfReview || pack.billOfReview.trigger !== 'bill_of_review_noted') return null;
  if (!debt.billOfReviewNotedAt) return null;
  if (!debt.judgmentEnteredAt) return null;
  return { clock: pack.billOfReview, state: pack.state, anchor: debt.judgmentEnteredAt };
}

function isJudgmentClockCase(debt: DebtCase): boolean {
  return debt.type === 'judgment' || debt.type === 'levy';
}

function clockToTimerKind(kind: JudgmentClockKind): DebtTimerKind {
  if (kind === 'vacate') return 'vacate_deadline';
  if (kind === 'appeal') return 'appeal_deadline';
  return 'coj_deadline';
}

function clockLabel(clock: PostJudgmentProcedureClock, state: string): string {
  if (clock.kind === 'vacate') return `Motion to vacate / set aside (${state})`;
  if (clock.kind === 'appeal') return `Notice of appeal (${state})`;
  return `Confession-of-judgment challenge (${state})`;
}

function actionableClocks(debt: DebtCase): Array<{ clock: PostJudgmentProcedureClock; state: string }> {
  const state = resolveJudgmentClockState(debt);
  const pack = getStateJudgmentClocks(state);
  if (!pack || !isJudgmentClockCase(debt)) return [];
  return [pack.vacate, pack.appeal, pack.coj]
    .filter((c) => c.available && c.days != null && c.days > 0)
    .map((clock) => ({ clock, state: pack.state }));
}

export function computeJudgmentClockDueAt(debt: DebtCase, kind: JudgmentClockKind): string | null {
  const row = actionableClocks(debt).find((r) => r.clock.kind === kind);
  if (!row || row.clock.days == null) return null;
  return addDeadlineDaysSync(resolveJudgmentAnchorIso(debt), row.clock.days, row.clock.deadlineKind);
}

export async function computeJudgmentClockDueAtAsync(debt: DebtCase, kind: JudgmentClockKind): Promise<string | null> {
  const row = actionableClocks(debt).find((r) => r.clock.kind === kind);
  if (!row || row.clock.days == null) return null;
  return addDeadlineDays(resolveJudgmentAnchorIso(debt), row.clock.days, row.clock.deadlineKind);
}

function levyWindowLabel(debt: DebtCase): string | undefined {
  const profile = getStateExemptionProfile(resolveLevyState(debt));
  return profile ? describeClaimWindow(profile) : undefined;
}

/** Weekend-aware levy deadline (sync). Holiday-aware version is computeLevyClaimDueAtAsync. */
export function computeLevyClaimDueAt(debt: DebtCase): string | null {
  const profile = getStateExemptionProfile(resolveLevyState(debt));
  const claimDays = profile?.claimDeadlineDays;
  if (!profile || claimDays == null || claimDays <= 0) return null;
  return addDeadlineDaysSync(resolveLevyAnchorIso(debt), claimDays, profile.deadlineKind);
}

/** Holiday-aware levy deadline when Nager / public-data holidays are available. */
export async function computeLevyClaimDueAtAsync(debt: DebtCase): Promise<string | null> {
  const profile = getStateExemptionProfile(resolveLevyState(debt));
  const claimDays = profile?.claimDeadlineDays;
  if (!profile || claimDays == null || claimDays <= 0) return null;
  return addDeadlineDays(resolveLevyAnchorIso(debt), claimDays, profile.deadlineKind);
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
        notes: `Send validation request within ${FDCPA_VALIDATION_DAYS} days of first written contact. After the validation letter is sent, collectors must cease collection — including suit — until they properly validate (not a guarantee they never sue; summons already filed still needs a court answer). Educational only — not legal advice.`,
      })
    ) {
      tasksCreated += 1;
    }
  }

  if (debt.type === 'summons') {
    const resolved = resolveSummonsDue(debt);
    if (resolved.dueAt) {
      if (
        spawnDebtTimerTask({
          partnerId: debt.partnerId,
          debt,
          kind: 'summons_answer',
          title: `Summons answer deadline (${resolved.calendar.state}): "${debt.name}"`,
          dueAt: resolved.dueAt,
          notes: `${resolved.windowLabel}. ${resolved.calendar.note} Use the summons response template on this case. Educational only — verify local rules.`,
        })
      ) {
        tasksCreated += 1;
      }
    }
  }

  if (debt.type === 'judgment') {
    if (
      spawnDebtTimerTask({
        partnerId: debt.partnerId,
        debt,
        kind: 'post_judgment_review',
        title: `Post-judgment review: "${debt.name}"`,
        dueAt: addDaysIso(nowIso(), 7),
        notes:
          'Judgment entered — review exemption profiles, Reg E / Reg Z / 31 CFR 212 letter stubs, and state levy procedure. Educational only — not legal advice; confirm with counsel.',
        priority: 'high',
      })
    ) {
      tasksCreated += 1;
    }
  }

  if (isLevyClaimCase(debt)) {
    const dueAt = computeLevyClaimDueAt(debt);
    const profile = getStateExemptionProfile(resolveLevyState(debt));
    if (dueAt && profile?.claimDeadlineDays) {
      if (
        spawnDebtTimerTask({
          partnerId: debt.partnerId,
          debt,
          kind: 'levy_claim_deadline',
          title: `Levy exemption claim deadline (${profile.state}): "${debt.name}"`,
          dueAt,
          notes: `Bank levy / restraining notice anchor ${resolveLevyAnchorIso(debt)}. ${profile.state} claim window ~${describeClaimWindow(profile)} (weekends skipped; US holidays applied in the partner workspace when holiday data loads). Citation: ${profile.citation}. Educational only — not legal advice.`,
          priority: 'urgent',
        })
      ) {
        tasksCreated += 1;
      }
    }
  }

  tasksCreated += spawnJudgmentClockTasks(debt);
  tasksCreated += spawnAppealExtensionTask(debt);
  tasksCreated += spawnCollateralReviewTasks(debt);

  return { tasksCreated };
}

function spawnJudgmentClockTasks(debt: DebtCase): number {
  if (!isJudgmentClockCase(debt)) return 0;
  let created = 0;
  const anchor = resolveJudgmentAnchorIso(debt);
  for (const { clock, state } of actionableClocks(debt)) {
    if (clock.days == null) continue;
    const dueAt = addDeadlineDaysSync(anchor, clock.days, clock.deadlineKind);
    const kind = clockToTimerKind(clock.kind);
    if (
      spawnDebtTimerTask({
        partnerId: debt.partnerId,
        debt,
        kind,
        title: `${clockLabel(clock, state)}: "${debt.name}"`,
        dueAt,
        notes: `${state} ${describeJudgmentClock(clock)}. Anchor ${anchor}. ${clock.citation}. ${clock.note} Educational only — not legal advice.`,
        priority: 'urgent',
      })
    ) {
      created += 1;
    }
  }
  return created;
}

function spawnAppealExtensionTask(debt: DebtCase): number {
  const row = resolveAppealExtension(debt);
  if (!row || !isJudgmentClockCase(debt) || row.clock.days == null) return 0;
  const anchor = resolveJudgmentAnchorIso(debt);
  const dueAt = addDeadlineDaysSync(anchor, row.clock.days, row.clock.deadlineKind);
  const spawned = spawnDebtTimerTask({
    partnerId: debt.partnerId,
    debt,
    kind: 'appeal_extended_deadline',
    title: `Extended notice of appeal (${row.state}): "${debt.name}"`,
    dueAt,
    notes: `${row.state} ${describeJudgmentClock(row.clock)} from judgment date ${anchor} because a post-trial motion date is on this case (${debt.postTrialMotionFiledAt}). ${row.clock.citation}. ${row.clock.note} Educational only — not legal advice.`,
    priority: 'urgent',
  });
  return spawned ? 1 : 0;
}

function spawnCollateralReviewTasks(debt: DebtCase): number {
  if (!isJudgmentClockCase(debt)) return 0;
  let created = 0;
  const restricted = resolveRestrictedAppeal(debt);
  if (restricted) {
    const dueAt = addDeadlineDaysSync(restricted.anchor, restricted.clock.days, restricted.clock.deadlineKind);
    if (
      spawnDebtTimerTask({
        partnerId: debt.partnerId,
        debt,
        kind: 'restricted_appeal_deadline',
        title: `Restricted appeal (${restricted.state}): "${debt.name}"`,
        dueAt,
        notes: `${restricted.state} ${describeCollateralReview(restricted.clock)} from judgment date ${restricted.anchor}. ${restricted.clock.citation}. ${restricted.clock.note} Educational only — not legal advice.`,
        priority: 'urgent',
      })
    ) {
      created += 1;
    }
  }
  const bill = resolveBillOfReview(debt);
  if (bill) {
    const dueAt = addDeadlineDaysSync(bill.anchor, bill.clock.days, bill.clock.deadlineKind);
    if (
      spawnDebtTimerTask({
        partnerId: debt.partnerId,
        debt,
        kind: 'bill_of_review_deadline',
        title: `Residual review (${bill.state}): "${debt.name}"`,
        dueAt,
        notes: `${bill.state} ${describeCollateralReview(bill.clock)} from judgment date ${bill.anchor}. ${bill.clock.citation}. ${bill.clock.note} Educational only — not legal advice.`,
        priority: 'urgent',
      })
    ) {
      created += 1;
    }
  }
  return created;
}

/** Recompute timers when first contact, service, or levy state dates change. */
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

  if (
    next.type === 'summons' &&
    ((next.dateServed && next.dateServed !== prev.dateServed) ||
      next.stateJurisdiction !== prev.stateJurisdiction ||
      next.judgmentState !== prev.judgmentState ||
      next.accountState !== prev.accountState ||
      next.summonsCourtTrack !== prev.summonsCourtTrack ||
      next.summonsServiceMethod !== prev.summonsServiceMethod ||
      next.summonsPapersServed !== prev.summonsPapersServed ||
      next.hearingDate !== prev.hearingDate)
  ) {
    const resolved = resolveSummonsDue(next);
    if (resolved.dueAt) {
      if (
        spawnDebtTimerTask({
          partnerId: next.partnerId,
          debt: next,
          kind: 'summons_answer',
          title: `Answer due (${resolved.calendar.state}): "${next.name}" (served ${next.dateServed ?? 'date on file'})`,
          dueAt: resolved.dueAt,
          notes: `Summons served ${next.dateServed ?? 'date on file'}. ${resolved.windowLabel}. ${resolved.calendar.note}`,
        })
      ) {
        tasksCreated += 1;
      }
    }
  }

  const levyAnchorChanged =
    next.firstContactDate !== prev.firstContactDate || next.dateServed !== prev.dateServed;
  const levyStateChanged =
    next.accountState !== prev.accountState ||
    next.judgmentState !== prev.judgmentState ||
    next.stateJurisdiction !== prev.stateJurisdiction ||
    next.mechanism !== prev.mechanism ||
    next.type !== prev.type;

  if (isLevyClaimCase(next) && (levyAnchorChanged || levyStateChanged)) {
    const dueAt = computeLevyClaimDueAt(next);
    const profile = getStateExemptionProfile(resolveLevyState(next));
    if (dueAt && profile?.claimDeadlineDays) {
      if (
        spawnDebtTimerTask({
          partnerId: next.partnerId,
          debt: next,
          kind: 'levy_claim_deadline',
          title: `Levy exemption claim deadline (${profile.state}): "${next.name}"`,
          dueAt,
          notes: `Updated levy anchor ${resolveLevyAnchorIso(next)}. ${profile.state} window ~${describeClaimWindow(profile)} (weekends skipped; holiday-adjusted in the partner workspace). Citation: ${profile.citation}.`,
          priority: 'urgent',
        })
      ) {
        tasksCreated += 1;
      }
    }
  }

  const judgmentClockChanged =
    next.judgmentEnteredAt !== prev.judgmentEnteredAt ||
    next.hearingDate !== prev.hearingDate ||
    next.dateServed !== prev.dateServed ||
    next.judgmentState !== prev.judgmentState ||
    next.stateJurisdiction !== prev.stateJurisdiction ||
    next.accountState !== prev.accountState ||
    next.postTrialMotionFiledAt !== prev.postTrialMotionFiledAt ||
    next.didNotParticipateInHearing !== prev.didNotParticipateInHearing ||
    next.billOfReviewNotedAt !== prev.billOfReviewNotedAt ||
    next.type !== prev.type;

  if (isJudgmentClockCase(next) && judgmentClockChanged) {
    tasksCreated += spawnJudgmentClockTasks(next);
    tasksCreated += spawnAppealExtensionTask(next);
    tasksCreated += spawnCollateralReviewTasks(next);
  }

  return { tasksCreated };
}

function timerTone(daysRemaining: number): DebtWorkflowTimer['tone'] {
  if (daysRemaining <= 0) return 'blocking';
  if (daysRemaining <= 7) return 'warning';
  return 'ok';
}

function buildTimer(args: {
  debt: DebtCase;
  kind: DebtTimerKind;
  label: string;
  dueAt: string;
  windowLabel?: string;
  holidayAdjusted?: boolean;
}): DebtWorkflowTimer {
  const daysRemaining = calendarDaysRemaining(args.dueAt.slice(0, 10));
  return {
    kind: args.kind,
    label: args.label,
    dueAt: args.dueAt,
    daysRemaining,
    tone: timerTone(daysRemaining),
    debtCaseId: args.debt.id,
    windowLabel: args.windowLabel,
    holidayAdjusted: args.holidayAdjusted,
  };
}

export function listDebtWorkflowTimers(debt: DebtCase): DebtWorkflowTimer[] {
  const timers: DebtWorkflowTimer[] = [];

  if (debt.type === 'debt') {
    const anchor = debt.firstContactDate ?? debt.createdAt.slice(0, 10);
    timers.push(
      buildTimer({
        debt,
        kind: 'fdcpa_validation',
        label: 'FDCPA validation window',
        dueAt: addDaysIso(anchor, FDCPA_VALIDATION_DAYS),
        windowLabel: `${FDCPA_VALIDATION_DAYS} calendar days`,
      }),
    );
  }

  if (debt.type === 'summons') {
    const resolved = resolveSummonsDue(debt);
    if (resolved.dueAt) {
      timers.push(
        buildTimer({
          debt,
          kind: 'summons_answer',
          label: `Summons answer deadline (${resolved.calendar.state})`,
          dueAt: resolved.dueAt,
          windowLabel: resolved.windowLabel,
        }),
      );
    }
  }

  if (debt.type === 'judgment') {
    const anchor = debt.hearingDate ?? debt.createdAt.slice(0, 10);
    timers.push(
      buildTimer({
        debt,
        kind: 'post_judgment_review',
        label: 'Post-judgment action review',
        dueAt: addDeadlineDaysSync(anchor, 7, 'calendar'),
        windowLabel: '7 calendar days (weekend-adjusted)',
      }),
    );
  }

  if (isLevyClaimCase(debt)) {
    const dueAt = computeLevyClaimDueAt(debt);
    const profile = getStateExemptionProfile(resolveLevyState(debt));
    if (dueAt && profile?.claimDeadlineDays) {
      const stateLabel = profile.state ?? resolveLevyState(debt) ?? 'state';
      timers.push(
        buildTimer({
          debt,
          kind: 'levy_claim_deadline',
          label: `Levy exemption claim (${stateLabel})`,
          dueAt,
          windowLabel: levyWindowLabel(debt),
        }),
      );
    }
  }

  if (isJudgmentClockCase(debt)) {
    const anchor = resolveJudgmentAnchorIso(debt);
    for (const { clock, state } of actionableClocks(debt)) {
      if (clock.days == null) continue;
      timers.push(
        buildTimer({
          debt,
          kind: clockToTimerKind(clock.kind),
          label: clockLabel(clock, state),
          dueAt: addDeadlineDaysSync(anchor, clock.days, clock.deadlineKind),
          windowLabel: `${describeJudgmentClock(clock)} · ${clock.citation}`,
        }),
      );
    }
    const extension = resolveAppealExtension(debt);
    if (extension && extension.clock.days != null) {
      timers.push(
        buildTimer({
          debt,
          kind: 'appeal_extended_deadline',
          label: `Extended notice of appeal (${extension.state})`,
          dueAt: addDeadlineDaysSync(anchor, extension.clock.days, extension.clock.deadlineKind),
          windowLabel: `${describeJudgmentClock(extension.clock)} from judgment · ${extension.clock.citation}`,
        }),
      );
    }
    const restricted = resolveRestrictedAppeal(debt);
    if (restricted) {
      timers.push(
        buildTimer({
          debt,
          kind: 'restricted_appeal_deadline',
          label: `Restricted appeal (${restricted.state})`,
          dueAt: addDeadlineDaysSync(restricted.anchor, restricted.clock.days, restricted.clock.deadlineKind),
          windowLabel: `${describeCollateralReview(restricted.clock)} · ${restricted.clock.citation}`,
        }),
      );
    }
    const bill = resolveBillOfReview(debt);
    if (bill) {
      timers.push(
        buildTimer({
          debt,
          kind: 'bill_of_review_deadline',
          label: `Residual review (${bill.state})`,
          dueAt: addDeadlineDaysSync(bill.anchor, bill.clock.days, bill.clock.deadlineKind),
          windowLabel: `${describeCollateralReview(bill.clock)} · ${bill.clock.citation}`,
        }),
      );
    }
  }

  return timers;
}

/** Holiday-aware post-judgment timers for the levy workspace (does not replace listDebtWorkflowTimers). */
export async function listPostJudgmentWorkflowTimers(debt: DebtCase): Promise<DebtWorkflowTimer[]> {
  const timers: DebtWorkflowTimer[] = [];

  if (debt.type === 'judgment') {
    const anchor = debt.hearingDate ?? debt.createdAt.slice(0, 10);
    const dueAt = await addDeadlineDays(anchor, 7, 'calendar');
    timers.push(
      buildTimer({
        debt,
        kind: 'post_judgment_review',
        label: 'Post-judgment action review',
        dueAt,
        windowLabel: '7 calendar days (US holidays + weekends rolled forward)',
        holidayAdjusted: true,
      }),
    );
  }

  if (isLevyClaimCase(debt)) {
    const dueAt = await computeLevyClaimDueAtAsync(debt);
    const profile = getStateExemptionProfile(resolveLevyState(debt));
    if (dueAt && profile?.claimDeadlineDays) {
      timers.push(
        buildTimer({
          debt,
          kind: 'levy_claim_deadline',
          label: `Levy exemption claim (${profile.state})`,
          dueAt,
          windowLabel: `${describeClaimWindow(profile)} · US holidays applied when available`,
          holidayAdjusted: true,
        }),
      );
    }
  }

  if (isJudgmentClockCase(debt)) {
    const anchor = resolveJudgmentAnchorIso(debt);
    for (const { clock, state } of actionableClocks(debt)) {
      if (clock.days == null) continue;
      const dueAt = await addDeadlineDays(anchor, clock.days, clock.deadlineKind);
      timers.push(
        buildTimer({
          debt,
          kind: clockToTimerKind(clock.kind),
          label: clockLabel(clock, state),
          dueAt,
          windowLabel: `${describeJudgmentClock(clock)} · ${clock.citation} · US holidays applied when available`,
          holidayAdjusted: true,
        }),
      );
    }
    const extension = resolveAppealExtension(debt);
    if (extension && extension.clock.days != null) {
      const dueAt = await addDeadlineDays(anchor, extension.clock.days, extension.clock.deadlineKind);
      timers.push(
        buildTimer({
          debt,
          kind: 'appeal_extended_deadline',
          label: `Extended notice of appeal (${extension.state})`,
          dueAt,
          windowLabel: `${describeJudgmentClock(extension.clock)} from judgment · ${extension.clock.citation} · US holidays applied when available`,
          holidayAdjusted: true,
        }),
      );
    }
    const restricted = resolveRestrictedAppeal(debt);
    if (restricted) {
      const dueAt = await addDeadlineDays(restricted.anchor, restricted.clock.days, restricted.clock.deadlineKind);
      timers.push(
        buildTimer({
          debt,
          kind: 'restricted_appeal_deadline',
          label: `Restricted appeal (${restricted.state})`,
          dueAt,
          windowLabel: `${describeCollateralReview(restricted.clock)} · ${restricted.clock.citation} · US holidays applied when available`,
          holidayAdjusted: true,
        }),
      );
    }
    const bill = resolveBillOfReview(debt);
    if (bill) {
      const dueAt = await addDeadlineDays(bill.anchor, bill.clock.days, bill.clock.deadlineKind);
      timers.push(
        buildTimer({
          debt,
          kind: 'bill_of_review_deadline',
          label: `Residual review (${bill.state})`,
          dueAt,
          windowLabel: `${describeCollateralReview(bill.clock)} · ${bill.clock.citation} · US holidays applied when available`,
          holidayAdjusted: true,
        }),
      );
    }
  }

  return timers;
}
