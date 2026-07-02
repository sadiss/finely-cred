import { getHumanStaffAgent } from './humanStaffDirectory';
import { addHumanStaffNotifications, humanStaffNowIso, makeHumanStaffId } from './humanStaffRepo';
import type { HumanStaffAgentId, HumanStaffNotification, HumanStaffPriority } from './types';

export function buildStaffNotification(args: {
  fromAgentId: HumanStaffAgentId;
  toAgentId: HumanStaffAgentId;
  title: string;
  body: string;
  priority?: HumanStaffPriority;
  actionLabel?: string;
  routeHint?: string;
  threadId?: string;
}): HumanStaffNotification {
  return {
    id: makeHumanStaffId('note'),
    createdAt: humanStaffNowIso(),
    fromAgentId: args.fromAgentId,
    toAgentId: args.toAgentId,
    title: args.title,
    body: args.body,
    priority: args.priority ?? 'normal',
    read: false,
    actionLabel: args.actionLabel,
    routeHint: args.routeHint,
    threadId: args.threadId,
  };
}

export function notifyAgentTeam(args: {
  fromAgentId: HumanStaffAgentId;
  toAgentIds: HumanStaffAgentId[];
  title: string;
  body: string;
  priority?: HumanStaffPriority;
  actionLabel?: string;
  routeHint?: string;
  threadId?: string;
}) {
  const unique = Array.from(new Set(args.toAgentIds)).filter((id) => id !== args.fromAgentId);
  const notifications = unique.map((toAgentId) => buildStaffNotification({ ...args, toAgentId }));
  addHumanStaffNotifications(notifications);
  return notifications;
}

export function buildHandoffNotification(args: {
  fromAgentId: HumanStaffAgentId;
  toAgentId: HumanStaffAgentId;
  reason: string;
  nextAction: string;
  routeHint?: string;
  priority?: HumanStaffPriority;
}) {
  const from = getHumanStaffAgent(args.fromAgentId);
  const to = getHumanStaffAgent(args.toAgentId);
  return buildStaffNotification({
    fromAgentId: args.fromAgentId,
    toAgentId: args.toAgentId,
    title: `${from.name} handed work to ${to.name}`,
    body: `${args.reason}\n\nRequested next action: ${args.nextAction}`,
    priority: args.priority ?? 'normal',
    actionLabel: 'Review handoff',
    routeHint: args.routeHint,
  });
}

export function autoNotifyForTrigger(trigger: string, subject: string) {
  const q = trigger.toLowerCase();
  if (q.includes('risk') || q.includes('compliance') || q.includes('claim')) {
    return notifyAgentTeam({ fromAgentId: 'velvet_hammer', toAgentIds: ['cmo_prime', 'liora_lifecycle'], title: 'Compliance review needed', body: subject, priority: 'high', actionLabel: 'Open compliance gate', routeHint: '/admin/staff' });
  }
  if (q.includes('queue') || q.includes('worker') || q.includes('blocked')) {
    return notifyAgentTeam({ fromAgentId: 'switchboard', toAgentIds: ['pipeline_titan', 'professor_apex'], title: 'Automation blocker detected', body: subject, priority: 'high', actionLabel: 'Check workers', routeHint: '/admin/hands-free-ops' });
  }
  if (q.includes('hot_lead') || q.includes('booking')) {
    return notifyAgentTeam({ fromAgentId: 'pipeline_titan', toAgentIds: ['appointment_architect', 'liora_lifecycle'], title: 'Hot lead needs action', body: subject, priority: 'urgent', actionLabel: 'Open Action Center', routeHint: '/admin/lead-engine-system' });
  }
  if (q.includes('city') || q.includes('geo')) {
    return notifyAgentTeam({ fromAgentId: 'geo_commander', toAgentIds: ['local_news_radar', 'analytics_beast'], title: 'City board update', body: subject, priority: 'normal', actionLabel: 'Open Geo War Room', routeHint: '/admin/staff' });
  }
  return notifyAgentTeam({ fromAgentId: 'professor_apex', toAgentIds: ['cmo_prime', 'pipeline_titan'], title: 'Staff coordination update', body: subject, priority: 'normal', actionLabel: 'Open Staff Command', routeHint: '/admin/staff' });
}
