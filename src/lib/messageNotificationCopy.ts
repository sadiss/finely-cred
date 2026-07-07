import type { AppNotification } from '../domain/notifications';

export function messageNotificationPresentation(n: AppNotification): {
  eyebrow: string;
  accent: 'inbound' | 'outbound' | 'system';
  icon: string;
} {
  if (n.kind !== 'support_message') {
    return { eyebrow: 'Update', accent: 'system', icon: '🔔' };
  }

  const title = n.title.toLowerCase();
  const direction = n.meta?.direction;
  if (direction === 'inbound' || title.startsWith('📥')) {
    return { eyebrow: 'Inbound message', accent: 'inbound', icon: '📥' };
  }
  if (direction === 'outbound' || title.startsWith('📤')) {
    return { eyebrow: 'Team reply', accent: 'outbound', icon: '📤' };
  }
  if (title.includes('new support thread')) {
    return { eyebrow: 'New thread', accent: 'inbound', icon: '💬' };
  }
  return { eyebrow: 'Message', accent: 'system', icon: '💬' };
}

export function buildSupportMessageHref(args: {
  fromPartner: boolean;
  partnerId: string;
  threadId: string;
}): string {
  if (args.fromPartner) {
    return `/admin/support?partner=${encodeURIComponent(args.partnerId)}&thread=${encodeURIComponent(args.threadId)}`;
  }
  return `/portal/messages?hub=team&thread=${encodeURIComponent(args.threadId)}`;
}

export function buildSupportMessageTitle(args: {
  fromPartner: boolean;
  subject: string;
  senderLabel?: string;
}): string {
  if (args.fromPartner) {
    return `📥 ${args.senderLabel || 'Partner'} · ${args.subject}`;
  }
  return `📤 Finely team · ${args.subject}`;
}
