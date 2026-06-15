import type { TaskItem } from '../../../domain/tasks';
import type { CrmRecord } from '../../../domain/crmRecords';
import type { SlaBreach } from '../../../domain/workSla';
import type { DailyBriefing, BriefingItem } from '../schemas/briefing';
import { listAutopilotQueue } from '../../../data/automationOpsQueue';
import { listInboxMessages, listScheduledPosts } from '../../../data/socialHubRepo';
import { listAllThreads } from '../../../data/supportRepo';
import { aiActionAuditStats, listAiActionAudit } from '../../../data/aiActionAuditLog';

function isOverdue(t: TaskItem) {
  if (!t.dueAt) return false;
  if (t.status === 'completed' || t.status === 'cancelled') return false;
  return Date.parse(t.dueAt) < Date.now();
}

export function buildDailyBriefing(args: {
  openTasks: TaskItem[];
  crmRecords: CrmRecord[];
  unreadCount: number;
  slaBreaches?: SlaBreach[];
}): DailyBriefing {
  const items: BriefingItem[] = [];

  for (const b of (args.slaBreaches ?? []).slice(0, 5)) {
    items.push({
      id: `sla_${b.taskId}`,
      kind: 'task',
      priority: 110,
      title: b.taskTitle,
      subtitle: `${b.kind === 'response' ? 'Response SLA' : 'Overdue SLA'} • +${b.hoursLate}h`,
      href: b.projectId ? `/admin/projects/${b.projectId}?task=${b.taskId}` : '/admin/projects',
      reason: `${b.profile.label} breach`,
    });
  }

  for (const t of args.openTasks.filter(isOverdue).slice(0, 5)) {
    if (items.some((i) => i.id === `task_${t.id}` || i.id === `sla_${t.id}`)) continue;
    items.push({
      id: `task_${t.id}`,
      kind: 'task',
      priority: 100,
      title: t.title,
      subtitle: `Overdue • ${t.kind}`,
      href: t.projectId ? `/admin/projects/${t.projectId}?task=${t.id}` : '/admin/projects',
      reason: 'SLA risk — past due date',
    });
  }

  for (const t of args.openTasks.filter((x) => x.priority === 'urgent').slice(0, 3)) {
    if (items.some((i) => i.id === `task_${t.id}`)) continue;
    items.push({
      id: `task_${t.id}`,
      kind: 'task',
      priority: 90,
      title: t.title,
      subtitle: 'Urgent priority',
      href: t.projectId ? `/admin/projects/${t.projectId}?task=${t.id}` : '/admin/projects',
      reason: 'Urgent task in queue',
    });
  }

  for (const r of args.crmRecords.filter((x) => x.workSignals?.riskLevel === 'high').slice(0, 4)) {
    if (items.some((i) => i.id === r.id)) continue;
    items.push({
      id: r.id,
      kind: 'crm',
      priority: 95,
      title: r.contact.fullName || r.contact.email || 'Client at risk',
      subtitle: `Work idle ${Math.round(r.workSignals!.idleDays)}d • ${r.workSignals!.slaBreachCount} SLA breach(es)`,
      href: `/admin/crm/records/${encodeURIComponent(r.id)}`,
      reason: 'Work OS churn risk — CRM re-engagement needed',
    });
  }

  for (const r of args.crmRecords.filter((x) => x.stage === 'new').slice(0, 5)) {
    items.push({
      id: r.id,
      kind: 'crm',
      priority: 80,
      title: r.contact.fullName || r.contact.email || 'New lead',
      subtitle: `${r.kind} • ${r.stage}`,
      href: `/admin/crm/records/${encodeURIComponent(r.id)}`,
      reason: 'New inbound — respond within 24h',
    });
  }

  for (const r of args.crmRecords.filter((x) => x.nextAction?.dueAt && Date.parse(x.nextAction.dueAt) <= Date.now() + 86400000).slice(0, 3)) {
    if (items.some((i) => i.id === r.id)) continue;
    items.push({
      id: r.id,
      kind: 'crm',
      priority: 70,
      title: r.contact.fullName || r.contact.company || 'CRM follow-up',
      subtitle: r.nextAction?.label ?? 'Due soon',
      href: `/admin/crm/records/${encodeURIComponent(r.id)}`,
      reason: 'CRM next action due',
    });
  }

  for (const q of listAutopilotQueue().slice(0, 4)) {
    items.push({
      id: `auto_${q.id}`,
      kind: 'automation',
      priority: 88,
      title: q.title,
      subtitle: q.partnerName ?? q.kind.replace(/_/g, ' '),
      href: q.partnerId ? `/admin/partners/${encodeURIComponent(q.partnerId)}` : '/admin/workflow',
      reason: `Hands-free ops — ${q.kind.replace(/_/g, ' ')}`,
    });
  }

  const socialReview = listScheduledPosts().filter(
    (p) => p.status === 'needs_review' || p.complianceStatus === 'needs_review',
  );
  if (socialReview.length > 0) {
    items.push({
      id: 'social_compliance_review',
      kind: 'social',
      priority: 78,
      title: `${socialReview.length} social post${socialReview.length === 1 ? '' : 's'} need review`,
      subtitle: 'Social Hub autopilot queue',
      href: '/admin/social-hub?tab=autopilot',
      reason: 'Approve SOP captions before live publish',
    });
  }

  const dueSocial = listScheduledPosts().filter(
    (p) => p.status === 'queued' && Date.parse(p.scheduledAt) <= Date.now(),
  );
  if (dueSocial.length > 0) {
    items.push({
      id: 'social_publish_due',
      kind: 'social',
      priority: 72,
      title: `${dueSocial.length} scheduled post${dueSocial.length === 1 ? '' : 's'} ready to publish`,
      subtitle: 'Social autopilot',
      href: '/admin/social-hub?tab=autopilot',
      reason: 'Publish window open — run autopilot or publish due',
    });
  }

  const supportWaiting = listAllThreads().filter(
    (t) => t.status === 'new' || (t.status === 'waiting_on_team' && !t.firstResponseAt),
  );
  for (const t of supportWaiting.slice(0, 3)) {
    items.push({
      id: `support_${t.id}`,
      kind: 'support',
      priority: 85,
      title: t.subject,
      subtitle: `${t.topic.replace(/_/g, ' ')} · ${t.status.replace(/_/g, ' ')}`,
      href: `/admin/support?thread=${encodeURIComponent(t.id)}`,
      reason: 'Support inbox — awaiting team response',
    });
  }

  const metaInbound = listInboxMessages().filter((m) => m.direction === 'inbound').slice(0, 5);
  if (metaInbound.length > 0) {
    items.push({
      id: 'meta_inbox_unread',
      kind: 'comms',
      priority: 68,
      title: `${metaInbound.length} recent Meta inbound message${metaInbound.length === 1 ? '' : 's'}`,
      subtitle: 'Social Hub unified inbox',
      href: '/admin/social-hub?tab=inbox',
      reason: 'Omnichannel — reply from Support or Social Hub',
    });
  }

  if (args.unreadCount > 0) {
    items.push({
      id: 'notifications_unread',
      kind: 'notification',
      priority: 60,
      title: `${args.unreadCount} unread notifications`,
      subtitle: 'Ops alerts',
      href: '/admin/workflow',
      reason: 'Clear inbox noise',
    });
  }

  const auditStats = aiActionAuditStats();
  if (auditStats.last24h > 0) {
    items.push({
      id: 'ai_audit_recent',
      kind: 'automation',
      priority: 55,
      title: `${auditStats.last24h} AI / autopilot action${auditStats.last24h === 1 ? '' : 's'} (24h)`,
      subtitle: `${auditStats.pendingQueue} awaiting approval`,
      href: '/admin/hands-free-ops',
      reason: 'Review hands-free queue + audit log',
    });
  }

  for (const a of listAiActionAudit(3).filter((e) => e.status === 'blocked')) {
    items.push({
      id: `audit_${a.id}`,
      kind: 'automation',
      priority: 92,
      title: a.action,
      subtitle: a.detail ?? a.kind.replace(/_/g, ' '),
      href: '/admin/hands-free-ops',
      reason: 'Compliance or evidence gate blocked an action',
    });
  }

  items.sort((a, b) => b.priority - a.priority);

  const summary =
    items.length === 0
      ? 'Queue is clear — no critical actions right now.'
      : `Top ${Math.min(items.length, 10)} actions across Work + CRM + ops + inbox. ${items.filter((i) => i.kind === 'task').length} work, ${items.filter((i) => i.kind === 'crm').length} CRM, ${items.filter((i) => i.kind === 'automation').length} autopilot, ${items.filter((i) => i.kind === 'social').length} social, ${items.filter((i) => i.kind === 'support').length} support.`;

  return {
    generatedAt: new Date().toISOString(),
    summary,
    items: items.slice(0, 10),
  };
}
