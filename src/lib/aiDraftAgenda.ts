import { callPublicAiGateway } from './aiClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';

export type AiDraftAgendaResult = {
  text: string;
  source: 'gateway' | 'fallback';
};

function fallbackAgenda(args: { focusLabel?: string; goalText?: string }): string {
  const focus = (args.focusLabel || '').trim();
  const goal = (args.goalText || '').trim();
  if (goal) {
    const firstLine = goal.split(/\n+/)[0]?.slice(0, 160) ?? '';
    return `Review current situation and goals: ${firstLine}${focus ? ` (focus: ${focus})` : ''}. Map next steps and timeline.`;
  }
  if (focus) {
    return `Review current ${focus.toLowerCase()} situation, clarify goals, and map the safest next steps and timeline.`;
  }
  return 'Review current situation and goals, then map the safest next steps and timeline.';
}

/**
 * AI-draft a short meeting agenda line from whatever context is on hand — form focus
 * lane, free-text goal, and (when available) recent CRM notes for this lead. Falls
 * back to a sensible generic line when the AI gateway is unavailable/unconfigured —
 * this button must never be a dead end.
 */
export async function draftBookingAgenda(args: {
  focusLabel?: string;
  goalText?: string;
  crmNotes?: string[];
}): Promise<AiDraftAgendaResult> {
  const canUseGateway = isFeatureEnabled('aiGateway') && isSupabaseConfigured;
  if (!canUseGateway) {
    return { text: fallbackAgenda(args), source: 'fallback' };
  }

  try {
    const contextLines = [
      args.focusLabel ? `Focus lane: ${args.focusLabel}` : null,
      args.goalText ? `Visitor goal notes:\n${args.goalText.slice(0, 600)}` : null,
      args.crmNotes?.length ? `Recent CRM notes:\n${args.crmNotes.slice(0, 3).join('\n---\n').slice(0, 600)}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const res = await callPublicAiGateway({
      taskType: 'public_concierge',
      messages: [
        {
          role: 'system',
          content:
            'Write one short, specific meeting-agenda line (max 220 characters, one sentence, no preamble, no quotes) for a free strategy call, based on the context below. If context is thin, keep it generic but useful.',
        },
        { role: 'user', content: contextLines || 'No additional context provided — write a generic strategy-call agenda line.' },
      ],
      context: { surface: 'booking_agenda_draft' },
      providerHint: 'openai',
    });
    const text = (res.text || '').trim().replace(/^"|"$/g, '');
    if (!text) return { text: fallbackAgenda(args), source: 'fallback' };
    return { text: text.slice(0, 260), source: 'gateway' };
  } catch {
    return { text: fallbackAgenda(args), source: 'fallback' };
  }
}
