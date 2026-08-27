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
    ? `Got your message${sent.length <= 4 ? ` (${sent})` : ''} — I'm here.`
    : sent
      ? `I saw what you sent — let me help you find the right next step.`
      : `I'm here whenever you're ready.`;

  const roleLine =
    args.audience === 'partner'
      ? `I'm Finely's AI standing in for ${firstName}, ${title}, in your portal.`
      : `I'm Finely's AI standing in for ${firstName}, ${title}, on shift right now.`;

  const reply = [
    opener,
    roleLine,
    'Pick a lane below or tell me what you want to work on — personal restore, business credit, disputes & letters, debt help, or booking a session.',
    args.audience === 'partner'
      ? 'Need a live person? Tap a routing chip or open Team chat — your specialist can take over.'
      : 'Want a live Credit Specialist? Pick a lane above or ask to book a free session.',
  ].join('\n\n');

  const followUps =
    args.audience === 'partner'
      ? ["What's on my plate today?", 'Help with my next dispute round', 'Book a strategy call']
      : ['How do credit disputes work?', 'Personal restore vs business credit', 'Book a free session'];

  return { reply, followUps };
}
