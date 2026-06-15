import { applyPronunciationLexicon } from './pronunciationLexicon';

/** Natural narration segments — paced for human-like listen + SSML export. */
export type NarrationSegment = {
  text: string;
  /** Pause after this segment (ms) */
  pauseMs: number;
  /** Slight rate adjustment 0.85–1.05 */
  rate?: number;
  /** Acting direction for neural TTS or human voiceover. */
  direction?: string;
};

export type GuideNarration = {
  guideId: string;
  title: string;
  intro: string;
  voiceDirection?: string;
  segments: NarrationSegment[];
};

function seg(text: string, pauseMs = 900, rate?: number, direction?: string): NarrationSegment {
  return { text, pauseMs, rate, direction };
}

/** Build narration from guide sections when no custom script exists. */
export function buildDefaultNarration(guideId: string, title: string, sections: { heading: string; bullets: string[] }[]): GuideNarration {
  const segments: NarrationSegment[] = [
    seg(`Welcome. You're about to hear ${title}.`, 1300, 0.93, 'warm opening, slight smile, confident but not hyped'),
    seg(`This is Finely Cred — client-first education you can act on.`, 1200, 0.91, 'slow down on “client-first”; reassuring advisor tone'),
  ];
  for (const s of sections) {
    if (s.heading.toLowerCase().includes('disclaimer')) continue;
    segments.push(seg(s.heading + '.', 1150, 0.92, 'chapter heading; grounded, polished, short pause after'));
    for (const b of s.bullets) {
      segments.push(seg(b, 900 + Math.min(b.length * 9, 750), 0.94, 'explain like a trusted expert; avoid announcer cadence'));
    }
    segments.push(seg('', 700));
  }
  segments.push(seg(`That completes ${title}. Save the PDF, track your next step in the portal, and execute with discipline.`, 1600, 0.91, 'calm close; “execute with discipline” should land with quiet confidence'));
  return {
    guideId,
    title,
    intro: segments[0]!.text,
    voiceDirection:
      'Premium Finely Cred narration: warm private-advisor voice, human pacing, no robotic list-reading, no hype. Use small breaths between ideas, soften legal/finance jargon, and emphasize client-first clarity.',
    segments,
  };
}

const CUSTOM: Partial<Record<string, GuideNarration>> = {
  'primary-tradeline-insider': {
    guideId: 'primary-tradeline-insider',
    title: 'Primary Tradeline Insider Field Manual',
    intro: 'Let me walk you through what most lenders never say out loud about primary tradelines.',
    voiceDirection:
      'Sound like a calm senior credit strategist in a private consultation. Conversational, intimate, confident. Slight pauses before insider points. Avoid podcast hype and avoid AI cadence.',
    segments: [
      seg('Let me walk you through what most lenders never say out loud about primary tradelines.', 1400, 0.91, 'quiet confidence; make it feel exclusive, not salesy'),
      seg('First — primary versus authorized user.', 1150, 0.9, 'chapter transition; pause after “First”'),
      seg('If your name is on the contract, that is primary. Authorized user can help utilization… but many funders weight primaries heavier.', 1450, 0.93, 'clear contrast; pause after “primary”'),
      seg('Insider signal: depth of payment history on primaries beats a shiny limit with no seasoning.', 1300, 0.92, 'lower tone on “Insider signal”; emphasize “depth”'),
      seg('How do primaries land on your file?', 1050, 0.9, 'curious transition'),
      seg('Issuers report on their schedule — usually monthly, often tied to statement close, not your due date.', 1450, 0.93, 'slow down on “statement close”'),
      seg('Some feed one bureau only. That is why tri-bureau pulls still matter.', 1200, 0.92, 'matter-of-fact'),
      seg('Expect a ninety-day runway after a new primary — inquiry plus new account can dip scores before they help.', 1500, 0.91, 'reassuring; not alarming'),
      seg('Bank-verified primaries.', 900, 0.9, 'short section title; slight pause'),
      seg('Real verification ties to deposit relationships and identity consistency — not a reseller badge.', 1400, 0.92, 'firm but calm'),
      seg('Mismatch address or impossible open dates? Underwriters flag it.', 1250, 0.9, 'subtle warning; no drama'),
      seg('Combo ladders — twelve, eighteen, twenty-four months — target average age and oldest tradeline.', 1450, 0.93, 'educational cadence; articulate the numbers'),
      seg('They are not magic. Stack without inquiry discipline and you can decline anyway.', 1350, 0.9, 'direct; pause after “not magic”'),
      seg('Execute: pull tri-bureau, screenshot every field, calendar ninety days, one task per bureau in Finely Cred.', 1600, 0.91, 'action-oriented close'),
      seg('Educational only. Verify compliance before you act.', 1350, 0.89, 'soft disclaimer; not rushed'),
    ],
  },
};

export function getGuideNarration(guideId: string, title: string, sections: { heading: string; bullets: string[] }[]): GuideNarration {
  return CUSTOM[guideId] ?? buildDefaultNarration(guideId, title, sections);
}

export function narrationToPlainText(n: GuideNarration): string {
  return n.segments.map((s) => s.text).filter(Boolean).join('\n\n');
}

/** Single-flow speech text for browser TTS — no segment gaps, lexicon applied, disclaimers softened. */
export function narrationToNaturalSpeechText(n: GuideNarration): string {
  const parts: string[] = [];
  for (const s of n.segments) {
    const t = s.text?.trim();
    if (!t) continue;
    if (/disclaimer|educational only|not legal advice/i.test(t) && t.length < 120) continue;
    parts.push(t.endsWith('.') || t.endsWith('?') || t.endsWith('!') ? t : `${t}.`);
  }
  const joined = parts.join(' ');
  return applyPronunciationLexicon(joined.replace(/\s+/g, ' ').trim());
}

export function narrationToStudioTtsText(n: GuideNarration): string {
  return n.segments
    .filter((s) => s.text)
    .map((s) => {
      const pause = s.pauseMs >= 1300 ? '\n\n' : '\n';
      return `${s.text.trim()}${pause}`;
    })
    .join('')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

export function narrationToPerformanceScript(n: GuideNarration): string {
  return [
    `TITLE: ${n.title}`,
    '',
    `VOICE DIRECTION: ${n.voiceDirection ?? 'Warm private-advisor narration. Smooth transitions. Natural breaths. No robotic list cadence.'}`,
    '',
    ...n.segments
      .filter((s) => s.text)
      .map((s, i) => {
        const pause = s.pauseMs ? ` [pause ${Math.round(s.pauseMs / 100) / 10}s]` : '';
        const direction = s.direction ? `\n(${s.direction})` : '';
        return `#${i + 1}${direction}\n${s.text}${pause}`;
      }),
  ].join('\n\n');
}

export function narrationToProducerNotes(n: GuideNarration): string {
  return [
    `Finely Cred Narration Producer Notes`,
    `Guide: ${n.title}`,
    '',
    'Voice brief:',
    n.voiceDirection ?? 'Warm private-advisor narration. Smooth transitions. Natural breaths. No robotic list cadence.',
    '',
    'Performance rules:',
    '- Read like a trusted human advisor, not a synthetic explainer.',
    '- Use light breaths and micro-pauses between clauses.',
    '- Do not over-emphasize every bullet; vary energy.',
    '- Legal/credit terms should be clear, calm, and slower.',
    '- Keep disclaimers soft and professional, never rushed.',
    '',
    'Deliverables:',
    '- Master MP3, 44.1kHz or 48kHz, normalized around -16 LUFS.',
    '- Optional WAV master for archival.',
    '- Remove mouth clicks, long dead air, and harsh sibilance.',
  ].join('\n');
}

export function narrationToSsml(n: GuideNarration): string {
  const body = n.segments
    .filter((s) => s.text)
    .map((s) => {
      const rateAttr = s.rate ? ` rate="${s.rate}"` : '';
      const pauseTag = `<break time="${Math.round(s.pauseMs)}ms"/>`;
      const direction = s.direction ? `<!-- ${escapeXml(s.direction)} -->\n` : '';
      return `${direction}<prosody${rateAttr}>${escapeXml(s.text)}</prosody>${pauseTag}`;
    })
    .join('\n');
  const voiceDirection = n.voiceDirection ? `<!-- ${escapeXml(n.voiceDirection)} -->\n` : '';
  return `<?xml version="1.0"?>\n<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis">\n${voiceDirection}${body}\n</speak>`;
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
