/** Event-scoped hands-free ops — dispute drafts, review queue, staff tasks (Phase 3/8). */
import type { AutomationRule } from '../domain/automationStudio';
import type { PlatformEvent } from '../domain/platformEvents';
import { getPartner } from '../data/partnersRepo';
import { listReportsByPartner } from '../data/reportsRepo';
import { listTasksByPartner, createTask } from '../data/tasksRepo';
import { listInvitesByPartner } from '../data/invitesRepo';
import { getActiveBundleActivation } from '../data/productsRepo';
import { createNotification } from '../data/notificationsRepo';
import { pushAutopilotQueueItem } from '../data/automationOpsQueue';
import { resolveStaffOnDuty } from '../data/staffRoster';
import { staffMemberFullName } from '../domain/staffMember';
import { autoDraftDisputeLettersForPartner } from './disputeLetterAutomation';
import { isFeatureEnabled } from '../data/settingsRepo';
import { FINELY_MAIL_COPY } from './mailWhiteLabel';
import { addDaysIso, nowIso } from '../domain/cases';

const OPS_ACTION_TYPES = new Set([
  'draft_dispute_letter',
  'queue_letter_review',
  'request_mail_confirmation',
  'assign_staff_task',
  'queue_compliance_escalation',
]);

function safeNum(n: unknown, fallback: number) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function hasOpenTasks(partnerId: string, min = 1) {
  const tasks = listTasksByPartner(partnerId);
  const open = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  return open >= min;
}

function hasUnclaimedInvite(partnerId: string, olderThanHours = 0) {
  const invs = listInvitesByPartner(partnerId);
  const now = Date.now();
  return (
    invs.find((i) => {
      if (i.claimedAt) return false;
      if (i.sentAt) {
        const sentAgeH = (now - Date.parse(i.sentAt)) / (1000 * 60 * 60);
        if (Number.isFinite(sentAgeH) && sentAgeH < 24) return false;
      }
      if (!olderThanHours) return true;
      const ageH = (now - Date.parse(i.createdAt)) / (1000 * 60 * 60);
      return ageH >= olderThanHours;
    }) ?? null
  );
}

function partnerMatchesRuleConditions(partner: Awaited<ReturnType<typeof getPartner>>, rule: AutomationRule): boolean {
  if (!partner) return false;
  for (const c of rule.conditions || []) {
    if (c.type === 'always') continue;
    if (c.type === 'partner_lane_in') {
      const lane = partner.lane ?? 'other';
      if (!c.lanes.includes(lane)) return false;
      continue;
    }
    if (c.type === 'partner_stage_in') {
      const stage = partner.journeyStage ?? 'intake';
      if (!c.stages.includes(stage)) return false;
      continue;
    }
    if (c.type === 'has_open_tasks') {
      if (!hasOpenTasks(partner.id, safeNum(c.minOpenTasks, 1))) return false;
      continue;
    }
    if (c.type === 'has_unclaimed_invite') {
      if (!hasUnclaimedInvite(partner.id, safeNum(c.olderThanHours, 0))) return false;
      continue;
    }
    if (c.type === 'has_active_bundle') {
      if (!getActiveBundleActivation(partner.id, c.bundleId as never)) return false;
      continue;
    }
  }
  return true;
}

export function ruleHasLiveOpsActions(rule: AutomationRule): boolean {
  return (rule.actions ?? []).some((a) => OPS_ACTION_TYPES.has(a.type));
}

export type EventOpsResult = { messages: string[]; mode: 'live' | 'dry_run'; skipped?: boolean };

export async function runEventScopedOpsActions(
  rule: AutomationRule,
  event: PlatformEvent,
  opts?: { dryRun?: boolean },
): Promise<EventOpsResult> {
  const dryRun = opts?.dryRun ?? !isFeatureEnabled('automationAutopilot');
  const mode = dryRun ? 'dry_run' : 'live';
  const partnerId = event.partnerId;
  const hasPartnerScoped = (rule.actions ?? []).some(
    (a) => a.type !== 'queue_compliance_escalation' && a.type !== 'notify_admin',
  );

  if (hasPartnerScoped && !partnerId) {
    return { messages: ['No partnerId on event'], mode, skipped: true };
  }

  let partner: Awaited<ReturnType<typeof getPartner>> = null;
  if (partnerId) {
    partner = await getPartner(partnerId);
    if (!partner && hasPartnerScoped) return { messages: ['Partner not found'], mode, skipped: true };
    if (partner && hasPartnerScoped && !partnerMatchesRuleConditions(partner, rule)) {
      return { messages: ['Partner did not match rule conditions'], mode, skipped: true };
    }
  }

  const messages: string[] = [];
  const partnerName = partner?.profile?.fullName ?? 'Partner';

  for (const a of rule.actions ?? []) {
    if (a.type === 'notify_admin') {
      if (!dryRun) {
        createNotification({
          audience: 'admin',
          kind: 'system',
          title: a.title ?? `Automation: ${rule.name}`,
          body: a.body ?? `Triggered by ${event.type}`,
          href: '/admin/ops-autopilot',
          meta: { ruleId: rule.id, eventId: event.id, partnerId },
        });
      }
      messages.push(`${dryRun ? 'Would notify' : 'Notified'} admin: ${a.title ?? rule.name}`);
      continue;
    }

    if (a.type === 'draft_dispute_letter') {
      if (!partnerId) {
        messages.push('Skipped draft — no partnerId');
        continue;
      }
      const hasReport = listReportsByPartner(partnerId).some((r) => r.parsed);
      if (!hasReport) {
        messages.push('Skipped draft — no parsed report');
        continue;
      }
      if (dryRun) {
        messages.push(`Would auto-draft dispute letter for ${partnerId}`);
        continue;
      }
      const res = autoDraftDisputeLettersForPartner({
        partnerId,
        partnerName,
        bureau: a.bureau,
        round: a.round ?? '1',
        maxCandidates: a.maxCandidates ?? 3,
        enqueueReview: true,
      });
      messages.push(
        res.drafted
          ? `Auto-drafted ${res.drafted} letter(s) for ${partnerId}`
          : `No draftable negatives for ${partnerId}`,
      );
      continue;
    }

    if (a.type === 'queue_letter_review') {
      if (!partnerId) {
        messages.push('Skipped letter review — no partnerId');
        continue;
      }
      const title = a.title ?? 'Review auto-drafted dispute letter';
      const dueInDays = safeNum(a.dueInDays, 2);
      if (dryRun) {
        messages.push(`Would queue letter review for ${partnerId}`);
        continue;
      }
      createTask({
        partnerId,
        title,
        kind: 'review_results',
        status: 'pending',
        stage: 'disputes',
        priority: 'high',
        dueAt: addDaysIso(nowIso(), dueInDays),
        notes: 'Letter Operations — verify factual findings before mail.',
        tags: ['letter_ops', 'automation', 'draft_review'],
        assignedTo: 'admin',
      });
      pushAutopilotQueueItem({
        kind: 'draft_review',
        partnerId,
        partnerName,
        title,
        body: FINELY_MAIL_COPY.humanReviewBeforeSend,
      });
      messages.push(`Queued letter review for ${partnerId}`);
      continue;
    }

    if (a.type === 'request_mail_confirmation') {
      if (!partnerId) {
        messages.push('Skipped mail confirmation — no partnerId');
        continue;
      }
      const title = a.title ?? 'Confirm certified mail send';
      if (dryRun) {
        messages.push(`Would request mail confirmation for ${partnerId}`);
        continue;
      }
      pushAutopilotQueueItem({
        kind: 'mail_confirm',
        partnerId,
        partnerName,
        title,
        body: FINELY_MAIL_COPY.evidenceGatesConfirm,
      });
      createTask({
        partnerId,
        title,
        kind: 'follow_up',
        status: 'pending',
        stage: 'disputes',
        priority: 'urgent',
        dueAt: addDaysIso(nowIso(), 1),
        notes: 'Mail confirmation gate — human must approve send.',
        tags: ['mail_confirm', 'automation'],
        assignedTo: 'admin',
      });
      messages.push(`Requested mail confirmation for ${partnerId}`);
      continue;
    }

    if (a.type === 'assign_staff_task') {
      const staff = resolveStaffOnDuty(a.roleId);
      const staffLabel = staff ? staffMemberFullName(staff) : a.roleId;
      if (!partnerId) {
        messages.push('Skipped staff task — no partnerId');
        continue;
      }
      if (dryRun) {
        messages.push(`Would assign staff task (${staffLabel}) for ${partnerId}: ${a.title}`);
        continue;
      }
      createTask({
        partnerId,
        title: a.title,
        kind: a.kind,
        status: 'pending',
        stage: a.stage ?? 'disputes',
        priority: a.priority ?? 'normal',
        dueAt: addDaysIso(nowIso(), safeNum(a.dueInDays, 3)),
        notes: a.notes ?? `Assigned role: ${a.roleId}${staff ? ` · on-duty: ${staffLabel}` : ''}`,
        tags: Array.from(new Set(['staff_task', 'automation', ...(a.tags ?? [])])),
        assignedTo: 'admin',
      });
      messages.push(`Assigned staff task (${staffLabel}) for ${partnerId}: ${a.title}`);
      continue;
    }

    if (a.type === 'queue_compliance_escalation') {
      const title = a.title ?? 'Review complaint escalation';
      const snippet = String(event.payload?.snippet ?? event.payload?.message ?? '').slice(0, 240);
      const queuePartnerId = partnerId ?? event.leadId ?? 'public_chat';
      if (dryRun) {
        messages.push(`Would queue compliance escalation (${queuePartnerId})`);
        continue;
      }
      pushAutopilotQueueItem({
        kind: 'complaint',
        partnerId: queuePartnerId,
        partnerName: partnerName !== 'Partner' ? partnerName : undefined,
        title,
        body: snippet || 'Complaint or escalation language detected in public chat.',
        roleId: 'compliance_agent',
        meta: { leadId: event.leadId, eventId: event.id, auto: true },
      });
      createNotification({
        audience: 'admin',
        kind: 'system',
        title: 'Complaint keyword detected',
        body: snippet || 'Review in Hands-Free Ops → Complaints.',
        href: '/admin/ops-autopilot',
        meta: { ruleId: rule.id, eventId: event.id, leadId: event.leadId },
      });
      messages.push(`Queued compliance escalation for ${queuePartnerId}`);
    }
  }

  return { messages, mode };
}
