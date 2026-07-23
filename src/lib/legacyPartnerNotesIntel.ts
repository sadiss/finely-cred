import type { Bureau } from '../domain/creditReports';
import type { PartnerJourneyStage } from '../domain/partners';
import type { LegacyPartnerExportV1 } from '../domain/imports';
import { legacyNoteEntriesForPartner } from './legacyPartnerNotesHydrate';

export type LegacyLetterEventKind =
  | 'personal_info'
  | 'inquiry'
  | 'collections'
  | 'late_payment'
  | 'validation'
  | 'bureau_response'
  | 'bankruptcy'
  | 'court'
  | 'student_loan'
  | 'repo'
  | 'dispute'
  | 'unknown';

export type LegacyLetterNoteAction = 'mailed' | 'created' | 'received' | 'edited' | 'mentioned';

export type LegacyLetterNoteEvent = {
  kind: LegacyLetterEventKind;
  action: LegacyLetterNoteAction;
  mailedAt?: string;
  receivedAt?: string;
  bureau?: Bureau;
  creditor?: string;
  raw: string;
};

export type LegacyPartnerNotesIntel = {
  events: LegacyLetterNoteEvent[];
  suggestedRound: '1' | '2' | '3';
  suggestedStage?: PartnerJourneyStage;
  nextActions: string[];
  hasMailedRound1: boolean;
  hasBureauResponse: boolean;
  needsFollowUpResponse: boolean;
};

function normalizeLegacyNoteText(text: string): string {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/rn/gi, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

function parseLegacyDate(raw: string): string | undefined {
  const m = raw.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (!m) return undefined;
  let year = Number(m[3]);
  if (year < 100) year += year >= 70 ? 1900 : 2000;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (!month || !day || !year) return undefined;
  const iso = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();
  return iso;
}

function inferBureau(text: string): Bureau | undefined {
  const n = text.toLowerCase();
  if (/\bexperian\b|\bexp\b/.test(n)) return 'EXP';
  if (/\bequifax\b|\beqf\b/.test(n)) return 'EQF';
  if (/\btrans\s*union\b|\btransunion\b|\btuc\b/.test(n)) return 'TUC';
  return undefined;
}

function inferCreditor(text: string): string | undefined {
  const validationMailed = text.match(
    /([A-Z][A-Za-z0-9\s/&.'-]{2,60}?)\s+validation\s+letter\s+mailed/i,
  );
  if (validationMailed?.[1]) {
    const raw = validationMailed[1].trim();
    const parts = raw.split(/\s{2,}|\s+$/);
    return (parts[parts.length - 1] || raw).trim();
  }
  const mailedCreditor = text.match(/([A-Z][A-Za-z0-9\s/&.'-]{2,50}?)\s+(?:validation\s+)?letter\s+mailed/i);
  if (mailedCreditor?.[1] && !/^(pi|inquiry|collection|late)/i.test(mailedCreditor[1])) {
    const raw = mailedCreditor[1].trim();
    const parts = raw.split(/\s{2,}/);
    return (parts[parts.length - 1] || raw).trim();
  }
  return undefined;
}

function inferKind(fragment: string): LegacyLetterEventKind {
  const n = fragment.toLowerCase();
  if (/\bpi\b|personal\s*info/.test(n)) return 'personal_info';
  if (/\binquiry\b/.test(n)) return 'inquiry';
  if (/\bcollection/.test(n)) return 'collections';
  if (/\blate\s*pay/.test(n)) return 'late_payment';
  if (/\bvalidation\b/.test(n)) return 'validation';
  if (/\bbankruptcy\b/.test(n)) return 'bankruptcy';
  if (/\bcourt\b|district\s+court/.test(n)) return 'court';
  if (/\bstudent\s+loan\b/.test(n)) return 'student_loan';
  if (/\brepo\b|repossession/.test(n)) return 'repo';
  if (/\b3rd\s*party\b|third\s*party\b|bureau\s+response|transunion\s+response|experian\s+response|equifax\s+response/.test(n)) {
    return 'bureau_response';
  }
  if (/\bdispute\b/.test(n)) return 'dispute';
  return 'unknown';
}

function inferAction(fragment: string): LegacyLetterNoteAction {
  const n = fragment.toLowerCase();
  if (/\breceived\b|\bresponse\b/.test(n) && !/\bneed\b/.test(n)) return 'received';
  if (/\bmailed\b|\bsent\b/.test(n)) return 'mailed';
  if (/\bcreated\b|\bgenerated\b|\badded\b/.test(n)) return 'created';
  if (/\bedited\b|\bupdated\b/.test(n)) return 'edited';
  return 'mentioned';
}

function extractDateForAction(fragment: string, action: LegacyLetterNoteAction): string | undefined {
  const direct = parseLegacyDate(fragment);
  if (direct) return direct;
  if (action === 'mailed') {
    const after = fragment.match(/mailed\s*(?:on\s*)?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (after?.[1]) return parseLegacyDate(after[1]);
  }
  if (action === 'received') {
    const after = fragment.match(/received\s*(?:on\s*)?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (after?.[1]) return parseLegacyDate(after[1]);
  }
  return undefined;
}

function splitNoteFragments(note: string): string[] {
  const normalized = normalizeLegacyNoteText(note);
  const lines = normalized
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((x) => x.trim())
    .filter(Boolean);

  const expanded: string[] = [];
  for (const line of lines) {
    if (/,\s*(?:pi|inquiry|collection|late\s*pay|validation|bankruptcy|court)/i.test(line)) {
      const parts = line.split(/,(?=\s*(?:pi|inquiry|collection|late\s*pay|validation|bankruptcy|court))/i);
      expanded.push(...parts.map((p) => p.trim()).filter(Boolean));
      continue;
    }
    expanded.push(line);
  }
  return expanded;
}

function parseFragment(fragment: string): LegacyLetterNoteEvent | null {
  const lower = fragment.toLowerCase();
  if (!/(letter|mailed|created|received|validation|inquiry|collection|late\s*pay|\bpi\b|personal\s*info|bureau|3rd\s*party|third\s*party|bankruptcy|court|student\s+loan|repo|dispute)/i.test(lower)) {
    return null;
  }

  const kind = inferKind(fragment);
  const action = inferAction(fragment);
  const bureau = inferBureau(fragment);
  const creditor = inferCreditor(fragment);
  const mailedAt = action === 'mailed' ? extractDateForAction(fragment, 'mailed') : undefined;
  const receivedAt = action === 'received' ? extractDateForAction(fragment, 'received') : undefined;

  if (kind === 'unknown' && action === 'mentioned' && !creditor) return null;

  return {
    kind: kind === 'unknown' && creditor ? 'validation' : kind,
    action,
    mailedAt,
    receivedAt,
    bureau,
    creditor,
    raw: fragment,
  };
}

function dedupeEvents(events: LegacyLetterNoteEvent[]): LegacyLetterNoteEvent[] {
  const seen = new Set<string>();
  const out: LegacyLetterNoteEvent[] = [];
  for (const e of events) {
    const key = [e.kind, e.action, e.mailedAt ?? '', e.receivedAt ?? '', e.bureau ?? '', e.creditor ?? '', e.raw.slice(0, 80)].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

function buildNextActions(events: LegacyLetterNoteEvent[]): string[] {
  const actions: string[] = [];
  const hasBureauResponse = events.some((e) => e.kind === 'bureau_response' && e.action === 'received');
  const mailedKinds = new Set(events.filter((e) => e.action === 'mailed').map((e) => e.kind));
  const createdNotMailed = events.filter(
    (e) => e.action === 'created' && !mailedKinds.has(e.kind) && e.kind !== 'unknown',
  );

  if (hasBureauResponse) {
    actions.push('Review bureau / 3rd-party response and draft follow-up letter');
    actions.push('Advance dispute round to Round 2 for items that received a response');
  }

  for (const e of createdNotMailed) {
    actions.push(`Mail ${labelForKind(e.kind)} letter`);
  }

  if (events.some((e) => e.action === 'mailed' && ['personal_info', 'inquiry', 'collections', 'late_payment'].includes(e.kind))) {
    actions.push('Set Round 2 targets for mailed negative-class letters awaiting bureau response');
  }

  return [...new Set(actions)];
}

function labelForKind(kind: LegacyLetterEventKind): string {
  switch (kind) {
    case 'personal_info':
      return 'personal info (PI)';
    case 'inquiry':
      return 'inquiry';
    case 'collections':
      return 'collections';
    case 'late_payment':
      return 'late payment';
    case 'validation':
      return 'validation';
    case 'bureau_response':
      return 'bureau response';
    case 'bankruptcy':
      return 'bankruptcy';
    case 'court':
      return 'court';
    case 'student_loan':
      return 'student loan';
    case 'repo':
      return 'repossession';
    case 'dispute':
      return 'dispute';
    default:
      return 'letter';
  }
}

function suggestRound(events: LegacyLetterNoteEvent[]): '1' | '2' | '3' {
  const hasRound2Cue = events.some((e) => /round\s*2|no\s+response/i.test(e.raw));
  if (hasRound2Cue) return '2';
  const mailedCount = events.filter((e) => e.action === 'mailed').length;
  const hasResponse = events.some((e) => e.action === 'received');
  if (hasResponse && mailedCount >= 1) return '2';
  if (mailedCount >= 3) return '2';
  return '1';
}

function suggestStage(events: LegacyLetterNoteEvent[]): PartnerJourneyStage | undefined {
  const hasResponse = events.some((e) => e.kind === 'bureau_response' && e.action === 'received');
  const hasMailed = events.some((e) => e.action === 'mailed');
  const hasCreated = events.some((e) => e.action === 'created');
  if (hasResponse) return 'mailing';
  if (hasMailed) return 'mailing';
  if (hasCreated) return 'letters';
  return undefined;
}

/** Parse legacy staff notes into structured letter events + stage hints. */
export function parseLegacyPartnerNotes(args: {
  notesText?: string;
  noteEntries?: Array<{ message: string; createdAt?: string }>;
  partner?: { notes?: string; journeySignals?: Record<string, unknown> };
}): LegacyPartnerNotesIntel {
  const entries =
    args.noteEntries?.length
      ? args.noteEntries
      : legacyNoteEntriesForPartner(
          args.partner ?? { notes: args.notesText, journeySignals: undefined },
        );

  const messages = entries.length
    ? entries.map((e) => e.message)
    : args.notesText
      ? [normalizeLegacyNoteText(args.notesText)]
      : [];

  const events: LegacyLetterNoteEvent[] = [];
  for (const message of messages) {
    for (const fragment of splitNoteFragments(message)) {
      const parsed = parseFragment(fragment);
      if (parsed) events.push(parsed);
    }
  }

  const deduped = dedupeEvents(events);
  const hasMailedRound1 = deduped.some((e) => e.action === 'mailed');
  const hasBureauResponse = deduped.some((e) => e.kind === 'bureau_response' && e.action === 'received');
  const needsFollowUpResponse =
    hasBureauResponse ||
    messages.some((m) => /need to respond|need to work on.*response|uploaded in profile need to respond/i.test(m));

  return {
    events: deduped,
    suggestedRound: suggestRound(deduped),
    suggestedStage: suggestStage(deduped),
    nextActions: buildNextActions(deduped),
    hasMailedRound1,
    hasBureauResponse,
    needsFollowUpResponse,
  };
}

export function parseLegacyPartnerNotesFromExport(
  exportPartner: LegacyPartnerExportV1['partners'][0],
): LegacyPartnerNotesIntel {
  return parseLegacyPartnerNotes({
    notesText: exportPartner.notes ?? undefined,
    noteEntries: exportPartner.legacyNoteEntries ?? undefined,
    partner: {
      notes: exportPartner.notes ?? undefined,
      journeySignals: exportPartner.journeySignals as Record<string, unknown> | undefined,
    },
  });
}

export function titleForLegacyNoteEvent(event: LegacyLetterNoteEvent, round = '1'): string {
  const kindLabel = labelForKind(event.kind);
  const creditor = event.creditor ? ` — ${event.creditor}` : '';
  if (event.action === 'received') return `${kindLabel} response received${creditor}`;
  if (event.action === 'mailed') return `${kindLabel} letter (Round ${round})${creditor}`;
  if (event.action === 'created') return `${kindLabel} letter drafted${creditor}`;
  return `${kindLabel} letter${creditor}`;
}
