import type { SupportMessage, SupportThread, SupportThreadStatus, SupportTopic } from '../domain/support';
import { nowIso } from '../domain/support';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { createNotification } from './notificationsRepo';

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

export function listThreadsByPartner(partnerId: string): SupportThread[] {
  const store = loadStore();
  return store.threads
    .filter((t) => t.partnerId === partnerId)
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
}): { thread: SupportThread; message: SupportMessage } {
  const store = loadStore();
  const now = nowIso();
  const threadId = newId('th');
  const thread: SupportThread = {
    id: threadId,
    partnerId: args.partnerId,
    topic: args.topic,
    subject: args.subject.trim() || 'Support request',
    status: 'new',
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    relatedCaseId: args.relatedCaseId,
    relatedLetterId: args.relatedLetterId,
    relatedReportId: args.relatedReportId,
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
    title: args.initialMessage.fromPartner ? `New support thread: ${thread.subject}` : `Support opened: ${thread.subject}`,
    body: msg.body.slice(0, 220),
    href: args.initialMessage.fromPartner ? '/admin/support' : '/portal/messages',
    meta: { threadId: thread.id, topic: thread.topic },
  });
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
  store.threads[threadIdx] = {
    ...cur,
    updatedAt: now,
    lastMessageAt: now,
    status: nextStatus,
  };
  saveStore(store);

  createNotification({
    partnerId: args.partnerId,
    audience: args.fromPartner ? 'admin' : 'partner',
    kind: 'support_message',
    title: args.fromPartner ? `New partner message: ${cur.subject}` : `Support replied: ${cur.subject}`,
    body: msg.body.slice(0, 220),
    href: args.fromPartner ? '/admin/support' : '/portal/messages',
    meta: { threadId: args.threadId, topic: args.topic },
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

