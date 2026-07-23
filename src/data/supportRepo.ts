import type { SupportMessage, SupportThread, SupportThreadStatus, SupportTopic } from '../domain/support';
import { nowIso } from '../domain/support';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { createNotification } from './notificationsRepo';
import {
  computeSupportSlaDue,
  defaultPersonaForSupportTopic,
  onSupportFirstTeamReply,
} from '../lib/supportInboxOs';
import { buildSupportMessageHref, buildSupportMessageTitle } from '../lib/messageNotificationCopy';
import { notifyPartnerMessageEmail } from '../lib/partnerMessageEmail';
import { emitPlatformEvent } from '../domain/platformEvents';
import { FINELY_TENANT_ID } from '../domain/tenants';

const KEY = 'finely.support.v1';

type Store = {
  threads: SupportThread[];
  messages: SupportMessage[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { threads: [], messages: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function queuePartnerOutboundEmail(args: {
  partnerId: string;
  threadId: string;
  subject: string;
  bodyPreview: string;
}) {
  try {
    void notifyPartnerMessageEmail(args);
  } catch {
    // non-blocking
  }
}

export function listThreadsByPartner(partnerId: string): SupportThread[] {
  const store = loadStore();
  return store.threads
    .filter((t) => t.partnerId === partnerId)
    .slice()
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function listThreadsByCase(caseId: string): SupportThread[] {
  return loadStore()
    .threads.filter((t) => t.relatedCaseId === caseId)
    .slice()
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function listAllThreads(): SupportThread[] {
  const store = loadStore();
  return store.threads.slice().sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function getThread(id: string): SupportThread | null {
  return loadStore().threads.find((t) => t.id === id) ?? null;
}

export function listMessagesByThread(threadId: string): SupportMessage[] {
  const store = loadStore();
  return store.messages
    .filter((m) => m.threadId === threadId)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createThread(args: {
  partnerId: string;
  topic: SupportTopic;
  subject: string;
  initialMessage: { body: string; fromPartner: boolean; attachments?: SupportMessage['attachments'] };
  relatedCaseId?: string;
  relatedLetterId?: string;
  relatedReportId?: string;
  participantIds?: string[];
  threadKind?: import('../domain/support').SupportThreadKind;
}): { thread: SupportThread; message: SupportMessage } {
  const store = loadStore();
  const now = nowIso();
  const threadId = newId('th');
  const participantIds = (args.participantIds ?? []).map((x) => String(x).trim()).filter(Boolean);
  const threadKind = args.threadKind ?? (participantIds.length === 1 ? 'direct' : participantIds.length > 1 ? 'team' : 'general');
  const thread: SupportThread = {
    id: threadId,
    partnerId: args.partnerId,
    topic: args.topic,
    subject: args.subject.trim() || 'Support request',
    status: 'new',
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    slaDueAt: computeSupportSlaDue(now),
    assignedPersonaId: defaultPersonaForSupportTopic(args.topic),
    relatedCaseId: args.relatedCaseId,
    relatedLetterId: args.relatedLetterId,
    relatedReportId: args.relatedReportId,
    participantIds: participantIds.length ? participantIds : undefined,
    threadKind,
  };
  const msg: SupportMessage = {
    id: newId('thmsg'),
    threadId,
    partnerId: args.partnerId,
    topic: args.topic,
    fromPartner: args.initialMessage.fromPartner,
    createdAt: now,
    subject: args.subject.trim() || 'Support request',
    body: args.initialMessage.body.trim(),
    attachments: args.initialMessage.attachments ?? [],
  };
  store.threads.push(thread);
  store.messages.push(msg);
  saveStore(store);

  createNotification({
    partnerId: args.partnerId,
    audience: args.initialMessage.fromPartner ? 'admin' : 'partner',
    kind: 'support_message',
    title: buildSupportMessageTitle({
      fromPartner: args.initialMessage.fromPartner,
      subject: thread.subject,
    }),
    body: msg.body.slice(0, 220),
    href: buildSupportMessageHref({
      fromPartner: args.initialMessage.fromPartner,
      partnerId: args.partnerId,
      threadId: thread.id,
    }),
    meta: { threadId: thread.id, topic: thread.topic, direction: args.initialMessage.fromPartner ? 'inbound' : 'outbound' },
  });

  if (!args.initialMessage.fromPartner) {
    queuePartnerOutboundEmail({
      partnerId: args.partnerId,
      threadId: thread.id,
      subject: thread.subject,
      bodyPreview: msg.body,
    });
  }

  return { thread, message: msg };
}

export function getOrCreateThreadBySubject(args: {
  partnerId: string;
  topic: SupportTopic;
  subject: string;
  /** If existing matching thread is closed, create a new one. */
  reuseClosed?: boolean;
}): SupportThread {
  const store = loadStore();
  const subject = args.subject.trim() || 'Support request';
  const match = store.threads
    .filter((t) => t.partnerId === args.partnerId && t.topic === args.topic && t.subject === subject)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  if (match && (args.reuseClosed || (match.status !== 'closed' && match.status !== 'resolved'))) {
    return match;
  }

  const now = nowIso();
  const thread: SupportThread = {
    id: newId('th'),
    partnerId: args.partnerId,
    topic: args.topic,
    subject,
    status: 'new',
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    slaDueAt: computeSupportSlaDue(now),
    assignedPersonaId: defaultPersonaForSupportTopic(args.topic),
  };
  store.threads.push(thread);
  saveStore(store);
  return thread;
}

export function addThreadMessage(args: {
  threadId: string;
  partnerId: string;
  topic: SupportTopic;
  fromPartner: boolean;
  body: string;
  attachments?: SupportMessage['attachments'];
}): SupportMessage {
  const store = loadStore();
  const threadIdx = store.threads.findIndex((t) => t.id === args.threadId);
  if (threadIdx < 0) throw new Error('Thread not found');
  const now = nowIso();
  const msg: SupportMessage = {
    id: newId('thmsg'),
    threadId: args.threadId,
    partnerId: args.partnerId,
    topic: args.topic,
    fromPartner: args.fromPartner,
    createdAt: now,
    body: args.body.trim(),
    attachments: args.attachments ?? [],
  };
  store.messages.push(msg);

  const cur = store.threads[threadIdx]!;
  const nextStatus: SupportThreadStatus =
    args.fromPartner ? (cur.status === 'resolved' ? 'waiting_on_team' : 'waiting_on_team') : 'waiting_on_partner';
  const firstResponseAt =
    !args.fromPartner && !cur.firstResponseAt ? now : cur.firstResponseAt;
  store.threads[threadIdx] = {
    ...cur,
    updatedAt: now,
    lastMessageAt: now,
    status: nextStatus,
    firstResponseAt,
  };
  saveStore(store);

  if (!args.fromPartner && firstResponseAt === now) {
    try {
      onSupportFirstTeamReply({ thread: store.threads[threadIdx]!, partnerId: args.partnerId });
    } catch {
      // non-blocking
    }
  }

  createNotification({
    partnerId: args.partnerId,
    audience: args.fromPartner ? 'admin' : 'partner',
    kind: 'support_message',
    title: buildSupportMessageTitle({
      fromPartner: args.fromPartner,
      subject: cur.subject,
    }),
    body: msg.body.slice(0, 220),
    href: buildSupportMessageHref({
      fromPartner: args.fromPartner,
      partnerId: args.partnerId,
      threadId: args.threadId,
    }),
    meta: { threadId: args.threadId, topic: args.topic, direction: args.fromPartner ? 'inbound' : 'outbound' },
  });

  if (!args.fromPartner) {
    queuePartnerOutboundEmail({
      partnerId: args.partnerId,
      threadId: args.threadId,
      subject: cur.subject,
      bodyPreview: msg.body,
    });
  }

  emitPlatformEvent({
    type: 'chat.message_received',
    tenantId: FINELY_TENANT_ID,
    partnerId: args.partnerId,
    entityType: 'support_thread',
    entityId: args.threadId,
    payload: {
      preview: msg.body.slice(0, 160),
      fromPartner: args.fromPartner,
      subject: cur.subject,
      threadId: args.threadId,
    },
  });
  return msg;
}

export function setThreadStatus(threadId: string, status: SupportThreadStatus): SupportThread | null {
  const store = loadStore();
  const idx = store.threads.findIndex((t) => t.id === threadId);
  if (idx < 0) return null;
  const now = nowIso();
  const next = { ...store.threads[idx]!, status, updatedAt: now };
  store.threads[idx] = next;
  saveStore(store);
  return next;
}

