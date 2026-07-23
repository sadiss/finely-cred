import type { CreditAnalysisReportRecord } from '../domain/creditAnalysisReports';
import type { Partner } from '../domain/partners';
import type { SupportTopic } from '../domain/support';
import { addThreadMessage, createThread, getOrCreateThreadBySubject } from '../data/supportRepo';

function portalUrl(path: string): string {
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
  return path;
}

function actorLabel(role?: 'admin' | 'partner' | 'credit_specialist') {
  if (role === 'partner') return 'Partner';
  if (role === 'credit_specialist') return 'Credit specialist';
  return 'Finely Cred team';
}

export function shareCreditAnalysisReportToChat(args: {
  partner: Partner;
  analysis: CreditAnalysisReportRecord;
  actorRole?: 'admin' | 'partner' | 'credit_specialist';
  actorEmail?: string;
  topic?: SupportTopic;
}): { threadId: string } {
  const topic = args.topic ?? 'disputes';
  const subject = 'Credit analysis report delivery';
  const fromPartner = args.actorRole === 'partner';
  const body = [
    `Premium credit analysis report shared: ${args.analysis.title}`,
    '',
    `Pages: ${args.analysis.pages}`,
    `File: ${args.analysis.filename}`,
    `Open vault: ${portalUrl('/portal/analysis')}`,
    '',
    `${actorLabel(args.actorRole)}${args.actorEmail ? ` (${args.actorEmail})` : ''} shared this so it stays attached to the Team chat thread.`,
  ].join('\n');

  const existing = getOrCreateThreadBySubject({
    partnerId: args.partner.id,
    topic,
    subject,
  });

  if (existing.lastMessageAt === existing.createdAt && existing.subject === subject) {
    const emptyExisting = existing.status === 'new';
    if (emptyExisting) {
      addThreadMessage({
        threadId: existing.id,
        partnerId: args.partner.id,
        topic,
        fromPartner,
        body,
      });
      return { threadId: existing.id };
    }
  }

  addThreadMessage({
    threadId: existing.id,
    partnerId: args.partner.id,
    topic,
    fromPartner,
    body,
  });
  return { threadId: existing.id };
}

export function shareGuideToChat(args: {
  partnerId: string;
  title: string;
  url: string;
  summary?: string;
  actorRole?: 'admin' | 'partner' | 'credit_specialist';
  topic?: SupportTopic;
}): { threadId: string } {
  const topic = args.topic ?? 'documents';
  const subject = 'Guide shared in portal';
  const thread = createThread({
    partnerId: args.partnerId,
    topic,
    subject,
    initialMessage: {
      fromPartner: args.actorRole === 'partner',
      body: [
        `Guide shared: ${args.title}`,
        args.summary ? `\n${args.summary}` : '',
        '',
        `Open guide: ${portalUrl(args.url)}`,
      ].join('\n'),
    },
  });
  return { threadId: thread.thread.id };
}
