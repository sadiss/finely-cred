import type { SupportMessage, SupportThread } from '../domain/support';
import { callAiGateway } from './aiClient';
import { extractFirstJsonObject } from '../utils/jsonExtract';

export type ReplySuggestion = { title: string; body: string };

export async function fetchSupportReplySuggestions(args: {
  thread: SupportThread;
  messages: SupportMessage[];
  partnerId: string;
  /** When true, drafts are for staff replying to a partner (outbound). */
  staffOutbound?: boolean;
}): Promise<ReplySuggestion[]> {
  const recent = args.messages.slice(-8);
  const transcript = recent
    .map((m) => `${m.fromPartner ? 'Partner' : 'Finely'}: ${m.body}`)
    .join('\n');

  const res = await callAiGateway({
    taskType: 'support.reply_suggestions',
    providerHint: 'openai',
    responseFormat: 'json',
    context: { topic: args.thread.topic, threadId: args.thread.id, partnerId: args.partnerId },
    messages: [
      {
        role: 'system',
        content: args.staffOutbound
          ? 'Return JSON only: { "suggestions": [ { "title": string, "body": string } ] }. Provide 4 concise outbound drafts for Finely Cred staff messaging a partner. Friendly, compliant, no legal advice.'
          : 'Return JSON only: { "suggestions": [ { "title": string, "body": string } ] }. Provide 4 concise reply drafts for a credit repair partner. Friendly, compliant, no legal advice.',
      },
      { role: 'user', content: `Subject: ${args.thread.subject}\n\n${transcript}` },
    ],
  });

  const obj = extractFirstJsonObject(res.text) as { suggestions?: ReplySuggestion[] } | null;
  return (Array.isArray(obj?.suggestions) ? obj.suggestions : [])
    .map((s) => ({ title: `${s?.title ?? ''}`.trim(), body: `${s?.body ?? ''}`.trim() }))
    .filter((s) => s.title && s.body)
    .slice(0, 5);
}
