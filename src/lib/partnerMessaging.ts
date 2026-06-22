import { createThread, addThreadMessage } from '../data/supportRepo';
import type { SupportTopic } from '../domain/support';
import { resolveTeamContact } from './staffMessagingContacts';

export function sendPartnerOutreachMessage(args: {
  partnerId: string;
  partnerName: string;
  body: string;
  topic?: SupportTopic;
  staffIds?: string[];
  subject?: string;
  fromAdmin?: boolean;
}) {
  const body = args.body.trim();
  if (!body) throw new Error('Message body is required.');

  const staffIds = (args.staffIds ?? []).filter(Boolean);
  const contacts = staffIds.map((id) => resolveTeamContact(id)).filter(Boolean);
  const subject =
    args.subject?.trim() ||
    (contacts.length === 1
      ? `Welcome · ${args.partnerName}`
      : contacts.length
        ? `Team note · ${args.partnerName}`
        : `Welcome · ${args.partnerName}`);

  const { thread } = createThread({
    partnerId: args.partnerId,
    topic: args.topic ?? 'general',
    subject,
    participantIds: staffIds.length ? staffIds : undefined,
    threadKind: staffIds.length === 1 ? 'direct' : staffIds.length > 1 ? 'team' : 'general',
    initialMessage: {
      fromPartner: false,
      body,
    },
  });

  return thread;
}

export function appendPartnerOutreachMessage(args: {
  threadId: string;
  partnerId: string;
  topic: SupportTopic;
  body: string;
}) {
  return addThreadMessage({
    threadId: args.threadId,
    partnerId: args.partnerId,
    topic: args.topic,
    fromPartner: false,
    body: args.body,
  });
}

export function defaultPartnerWelcomeMessage(partnerName: string) {
  const name = partnerName.trim() || 'there';
  return `Hi ${name} — welcome to Finely Cred. Your profile is set up and our team is here when you log in. Reply anytime with questions about reports, disputes, or next steps.`;
}
