import { ingestInboxMessage, listInboxMessages } from '../data/socialHubRepo';
import type { MetaThreadChannel, MetaThreadMessage } from '../domain/metaIntegration';
import { newId } from '../utils/ids';

export type OmnichannelSource = 'support' | 'meta';

export type MetaInboxThreadSummary = {
  /** Prefixed id for UI selection — `meta:{threadId}` */
  id: string;
  source: 'meta';
  threadId: string;
  channel: MetaThreadChannel;
  pageId: string;
  subject: string;
  lastMessageAt: string;
  preview: string;
  messageCount: number;
  inboundCount: number;
};

export function metaThreadUiId(threadId: string): string {
  return `meta:${threadId}`;
}

export function isMetaThreadUiId(id: string): boolean {
  return id.startsWith('meta:');
}

export function parseMetaThreadUiId(id: string): string | null {
  return isMetaThreadUiId(id) ? id.slice(5) : null;
}

/** Group Meta inbox rows into thread summaries for omnichannel inboxes (Phase 7). */
export function listMetaInboxThreadSummaries(): MetaInboxThreadSummary[] {
  const byThread = new Map<string, MetaThreadMessage[]>();
  for (const m of listInboxMessages()) {
    const list = byThread.get(m.threadId) ?? [];
    list.push(m);
    byThread.set(m.threadId, list);
  }

  const summaries: MetaInboxThreadSummary[] = [];
  for (const [threadId, msgs] of byThread) {
    const sorted = msgs.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = sorted[sorted.length - 1]!;
    const inbound = sorted.filter((m) => m.direction === 'inbound');
    const previewSource = inbound[inbound.length - 1] ?? last;
    const channelLabel = last.channel === 'instagram' ? 'Instagram' : 'Messenger';
    const leadHint = threadId.startsWith('lead_') ? 'Lead' : 'DM';
    summaries.push({
      id: metaThreadUiId(threadId),
      source: 'meta',
      threadId,
      channel: last.channel,
      pageId: last.pageId,
      subject: `${channelLabel} · ${leadHint}`,
      lastMessageAt: last.createdAt,
      preview: previewSource.text.slice(0, 120),
      messageCount: sorted.length,
      inboundCount: inbound.length,
    });
  }

  return summaries.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function listMetaMessagesByThreadId(threadId: string): MetaThreadMessage[] {
  return listInboxMessages()
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Queue an outbound Meta reply locally (production sends via meta-webhook edge function). */
export function replyMetaInboxThread(args: {
  threadId: string;
  text: string;
  pageId: string;
  channel: MetaThreadChannel;
}): MetaThreadMessage {
  return ingestInboxMessage({
    threadId: args.threadId,
    channel: args.channel,
    direction: 'outbound',
    pageId: args.pageId,
    text: args.text.trim(),
  });
}

/** Dev helper — simulate an inbound DM thread for omnichannel QA. */
export function simulateMetaDmThread(args: { pageId: string; name: string; text: string; channel?: MetaThreadChannel }) {
  const threadId = `dm_${args.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  const msg = ingestInboxMessage({
    id: newId('meta'),
    threadId,
    channel: args.channel ?? 'messenger',
    direction: 'inbound',
    pageId: args.pageId,
    text: args.text,
  });
  return { threadId, message: msg };
}
