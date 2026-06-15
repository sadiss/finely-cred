import { loadJson, saveJson } from './localJsonStore';
import type { PhoneCallRecord, PhoneCallStatus, PhoneThread } from '../domain/phoneSystem';
import { newId } from '../utils/ids';

const KEY = 'finely.phone.threads.v1';

type PhoneMessage = {
  id: string;
  threadId: string;
  direction: 'inbound' | 'outbound';
  body: string;
  createdAt: string;
  status: 'sent' | 'delivered' | 'failed';
};

type Store = {
  threads: PhoneThread[];
  messages: PhoneMessage[];
  calls: PhoneCallRecord[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { threads: [], messages: [], calls: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function nowIso() {
  return new Date().toISOString();
}

function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? digits : digits.length === 10 ? `+1${digits}` : digits;
}

export function listPhoneThreads(): PhoneThread[] {
  return loadStore()
    .threads.slice()
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function listPhoneCalls(limit = 20): PhoneCallRecord[] {
  return loadStore()
    .calls.slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

export function listMissedCalls(): PhoneCallRecord[] {
  return loadStore().calls.filter((c) => c.status === 'missed' || c.status === 'voicemail');
}

export function upsertPhoneThread(args: {
  phoneE164: string;
  displayName?: string;
  partnerId?: string;
  leadId?: string;
  channel?: PhoneThread['channel'];
  assignedPersonaId?: string;
}): PhoneThread {
  const store = loadStore();
  const phoneE164 = normalizePhone(args.phoneE164);
  let thread = store.threads.find((t) => t.phoneE164 === phoneE164);
  if (!thread) {
    thread = {
      id: newId('phone_thread'),
      phoneE164,
      displayName: args.displayName,
      partnerId: args.partnerId,
      leadId: args.leadId,
      lastMessageAt: nowIso(),
      unreadCount: 0,
      channel: args.channel ?? 'sms',
      assignedPersonaId: args.assignedPersonaId,
    };
    store.threads.push(thread);
  } else {
    thread = {
      ...thread,
      displayName: args.displayName ?? thread.displayName,
      partnerId: args.partnerId ?? thread.partnerId,
      leadId: args.leadId ?? thread.leadId,
      assignedPersonaId: args.assignedPersonaId ?? thread.assignedPersonaId,
    };
    const idx = store.threads.findIndex((t) => t.id === thread!.id);
    if (idx >= 0) store.threads[idx] = thread;
  }
  saveStore(store);
  return thread!;
}

export function appendPhoneMessage(args: {
  threadId: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status?: PhoneMessage['status'];
}): PhoneMessage {
  const store = loadStore();
  const msg: PhoneMessage = {
    id: newId('phone_msg'),
    threadId: args.threadId,
    direction: args.direction,
    body: args.body.trim(),
    createdAt: nowIso(),
    status: args.status ?? 'sent',
  };
  store.messages.push(msg);
  const tIdx = store.threads.findIndex((t) => t.id === args.threadId);
  if (tIdx >= 0) {
    const t = store.threads[tIdx]!;
    store.threads[tIdx] = {
      ...t,
      lastMessageAt: msg.createdAt,
      unreadCount: args.direction === 'inbound' ? t.unreadCount + 1 : t.unreadCount,
    };
  }
  saveStore(store);
  return msg;
}

export function logPhoneCall(args: {
  direction: PhoneCallRecord['direction'];
  from: string;
  to: string;
  status: PhoneCallStatus;
  personaId?: string;
  durationSec?: number;
  transcription?: string;
}): PhoneCallRecord {
  const store = loadStore();
  const call: PhoneCallRecord = {
    id: newId('phone_call'),
    direction: args.direction,
    from: normalizePhone(args.from),
    to: normalizePhone(args.to),
    status: args.status,
    startedAt: nowIso(),
    endedAt: args.status === 'completed' || args.status === 'missed' ? nowIso() : undefined,
    durationSec: args.durationSec,
    transcription: args.transcription,
    personaId: args.personaId,
  };
  store.calls.unshift(call);
  const remote = args.direction === 'inbound' ? args.from : args.to;
  upsertPhoneThread({
    phoneE164: remote,
    channel: 'voice',
    assignedPersonaId: args.personaId,
  });
  saveStore(store);
  return call;
}

export function getPhoneThreadMessages(threadId: string): PhoneMessage[] {
  return loadStore()
    .messages.filter((m) => m.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getPhoneOpsSnapshot() {
  const threads = listPhoneThreads();
  const missed = listMissedCalls();
  return {
    threadCount: threads.length,
    unreadThreads: threads.filter((t) => t.unreadCount > 0).length,
    missedCalls: missed.length,
    recentMissed: missed.slice(0, 5),
  };
}
