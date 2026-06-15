/**
 * Voicemail → Ruth co-owner summary prompts (voice AI handoff).
 */

export function buildVoicemailSummaryPrompt(args: {
  from: string;
  transcription: string;
  displayName?: string;
}): string {
  const who = args.displayName ?? args.from;
  return [
    `Summarize this voicemail from ${who} and recommend the next operational action for Finely Cred staff.`,
    'Include: urgency (1-5), suggested persona route (sales, support, debt, affiliate), and one callback script opening line.',
    'Voicemail transcript:',
    `"${args.transcription.trim()}"`,
  ].join('\n\n');
}

export function buildPhoneQueueBriefing(missed: Array<{ from: string; status: string; transcription?: string }>): string {
  if (!missed.length) return 'Phone queue is clear — no missed calls or voicemails pending callback.';
  const lines = missed.slice(0, 8).map((c, i) => {
    const snippet = c.transcription ? ` — "${c.transcription.slice(0, 120)}"` : '';
    return `${i + 1}. ${c.from} (${c.status})${snippet}`;
  });
  return ['Missed / voicemail queue:', ...lines, '', 'Prioritize callbacks and assign to the correct agent persona.'].join('\n');
}
