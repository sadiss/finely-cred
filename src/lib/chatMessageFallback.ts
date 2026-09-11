import type { PublicChatPersonaPresentation } from './chatPersonaStyles';

/** True when the message has no letters or digits (emoji-only, punctuation, gibberish symbols). */
export function isUnclassifiableChatMessage(text: string): boolean {
  const trimmed = (text || '').trim();
  if (!trimmed) return true;
  const withoutEmoji = trimmed.replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F]/gu, '');
  const lettersOrDigits = withoutEmoji.replace(/[^\p{L}\p{N}]/gu, '');
  return lettersOrDigits.length === 0;
}

export type WarmFallbackAudience = 'guest' | 'partner';

export function buildWarmUnclassifiedReply(args: {
  presentation: Pick<PublicChatPersonaPresentation, 'firstName' | 'title'>;
  audience: WarmFallbackAudience;
  sentContent?: string;
}): { reply: string; followUps: string[] } {
  const { firstName, title } = args.presentation;
  const sent = (args.sentContent || '').trim();
  const sawEmoji = sent && /[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(sent);
  const opener = sawEmoji
    ? `Got it${sent.length <= 4 ? ` (${sent})` : ''}.`
    : sent
      ? `${firstName} here — I did not catch a clear ask.`
      : `${firstName} here.`;

  const reply = [
    opener,
    `I'm the AI sitting in for ${firstName} (${title}). Tell me what is in front of you — a report, a collector letter, or a company file.`,
    args.audience === 'partner'
      ? 'If you want a live person, open Team chat and they can take over.'
      : 'If you want a live Credit Specialist, ask to book a free session.',
  ].join('\n\n');

  const followUps =
    args.audience === 'partner'
      ? ["What's on my plate today?", 'Help with my next dispute round', 'Book a strategy call']
      : ['How do credit disputes work?', 'Personal restore vs business credit', 'Book a free session'];

  return { reply, followUps };
}
