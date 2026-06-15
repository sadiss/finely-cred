import type { SupportThread } from '../domain/support';
import { CS } from '../config/creditSpecialistProgram';
import {
  addThreadMessage,
  getOrCreateThreadBySubject,
  listMessagesByThread,
} from '../data/supportRepo';
import { createNotification } from '../data/notificationsRepo';

export const CREDIT_SPECIALIST_PROGRAM_TOPIC = 'credit_specialist_program' as const;

const WELCOME_MARKER = 'Welcome to your Credit Specialist partnership line';

function buildWelcomeBody(args: {
  specialistName?: string;
  tierName?: string;
  fromApplication?: boolean;
}): string {
  const name = (args.specialistName || 'Credit Specialist').trim();
  const tier = args.tierName ? `\n\nYour workspace tier: ${args.tierName}.` : '';
  const intro = args.fromApplication
    ? 'Thanks for applying to the Credit Specialist Program. Once your account is provisioned, this thread is your direct line to Finely for onboarding, mentoring, and program support.'
    : 'This is your dedicated partnership line with Finely — use it for onboarding, mentor checkpoints, tier upgrades, and any program questions.';

  return `${WELCOME_MARKER}

Hi ${name},

${intro}

What to expect here:
• Finely ops replies in this same thread (portal messages)
• Your client-facing comms stay in separate threads — this line is for the partnership only
• Comms Studio sequences from admin may also post updates here when enrolled${tier}

Reply anytime with your question, niche, or availability for a mentor call.`;
}

/** Ensures the specialist has a persistent program thread (reuses existing open thread). */
export function ensureCreditSpecialistProgramThread(partnerId: string): SupportThread {
  return getOrCreateThreadBySubject({
    partnerId,
    topic: CREDIT_SPECIALIST_PROGRAM_TOPIC,
    subject: CS.supportThreadSubject,
    reuseClosed: false,
  });
}

/** Opens the partnership line and posts a welcome message once (does not duplicate). */
export function onboardCreditSpecialistCommunication(args: {
  partnerId: string;
  specialistName?: string;
  tierName?: string;
  fromApplication?: boolean;
}): { thread: SupportThread; welcomeSent: boolean } {
  const thread = ensureCreditSpecialistProgramThread(args.partnerId);
  const existing = listMessagesByThread(thread.id);
  const hasWelcome = existing.some((m) => m.body.includes(WELCOME_MARKER));

  if (hasWelcome) {
    return { thread, welcomeSent: false };
  }

  addThreadMessage({
    threadId: thread.id,
    partnerId: args.partnerId,
    topic: CREDIT_SPECIALIST_PROGRAM_TOPIC,
    fromPartner: false,
    body: buildWelcomeBody(args),
  });

  createNotification({
    partnerId: args.partnerId,
    audience: 'partner',
    kind: 'support_message',
    title: 'Your Finely partnership line is open',
    body: 'Message Finely anytime about onboarding, training, or your revenue-share model.',
    href: CS.messagesDeepLink,
    meta: { threadId: thread.id, topic: CREDIT_SPECIALIST_PROGRAM_TOPIC },
  });

  return { thread, welcomeSent: true };
}
