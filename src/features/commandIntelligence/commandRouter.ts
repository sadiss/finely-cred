export type CommandIntent =
  | { kind: 'find'; place: string; raw: string }
  | { kind: 'email'; raw: string }
  | { kind: 'caption'; topic: string }
  | { kind: 'course'; topic: string }
  | { kind: 'next'; name: string }
  | { kind: 'softpull' }
  | { kind: 'playbook' }
  | { kind: 'banks'; state: string }
  | { kind: 'corridor'; state: string }
  | { kind: 'weather'; place: string }
  | { kind: 'youtube'; query: string }
  | { kind: 'unknown'; raw: string };

const STATE_RE = /\b([A-Z]{2})\b/;

function stateFrom(text: string): string {
  const match = text.toUpperCase().match(STATE_RE);
  return match?.[1] ?? '';
}

/** Deterministic desk router. It does not call a model and it does not invent facts. */
export function routeCommand(input: string): CommandIntent {
  const raw = input.trim();
  const text = raw.toLowerCase();
  if (!text) return { kind: 'unknown', raw };

  if (/\b(soft[ -]?pull|bureau|fico|credit score)\b/.test(text)) return { kind: 'softpull' };
  if (/\b(playbook|anna)\b/.test(text)) return { kind: 'playbook' };
  if (/\b(youtube|video idea)\b/.test(text)) {
    return { kind: 'youtube', query: raw.replace(/\b(youtube|video idea)\b/gi, '').trim() || raw };
  }
  if (/\b(caption|social post|instagram|tiktok)\b/.test(text)) {
    return { kind: 'caption', topic: raw.replace(/\b(caption|social post|instagram|tiktok)\b/gi, '').trim() || 'this week’s credit step' };
  }
  if (/\b(email|draft)\b/.test(text)) return { kind: 'email', raw };
  if (/\b(course|lesson|academy|onboarding step)\b/.test(text)) {
    return { kind: 'course', topic: raw };
  }
  if (/\b(weather|forecast)\b/.test(text)) {
    return { kind: 'weather', place: raw.replace(/\b(weather|forecast)\b/gi, '').trim() };
  }
  if (/\b(bank|fdic|ncua|credit union)\b/.test(text)) return { kind: 'banks', state: stateFrom(raw) };
  if (/\b(census|corridor|income|population)\b/.test(text)) return { kind: 'corridor', state: stateFrom(raw) };
  if (/\b(find|geo|nominatim|near)\b/.test(text)) {
    const place = raw.replace(/\b(find|partners?|people|geo|nominatim|near|in)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    return { kind: 'find', place, raw };
  }
  if (/\b(next|file|partner)\b/.test(text)) {
    const name = raw.replace(/\b(next action on|next|file|partner)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    return { kind: 'next', name };
  }
  return { kind: 'unknown', raw };
}

export function captionDraft(topic: string): string {
  const subject = topic.trim() || 'one credit step';
  return [
    `Hook: ${subject} — one move, no score promise.`,
    'Body: Name the document or habit the partner can finish this week.',
    'CTA: Book a session at finelycred.com. Results vary. This is education, not a guarantee.',
  ].join('\n');
}

export function courseStepExplanation(topic: string): string {
  return [
    `Asked about: ${topic || 'a course step'}.`,
    '1. Open Courses and pick the published course, or start a blank one.',
    '2. Add a module, then a lesson with the plain-language step.',
    '3. Attach the quiz or video only after the lesson text is readable.',
    '4. Publish when onboarding should point partners at it.',
    'This is the builder path. It does not invent lesson copy.',
  ].join('\n');
}
