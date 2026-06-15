import { loadJson, saveJson } from './localJsonStore';
import type { Bureau } from '../domain/creditReports';
import type { SelectedDispute } from '../components/disputes/DisputePickerModal';

type LetterTone = 'formal' | 'neutral' | 'conversational';
type LetterRound = 'Round 1' | 'Round 2' | 'Round 3';

export type LettersCommandCenterDraft = {
  savedAt: string;
  selectedDisputes: SelectedDispute[];
  evidenceByCandidateId: Record<string, string | undefined>;
  reasonsByCandidateId: Record<string, string[]>;
  /** Optional freeform reasons override (one reason per line), keyed by SelectedDispute.key */
  customReasonsByCandidateKey?: Record<string, string>;
  toneByBureau: Record<Bureau, LetterTone>;
  roundByBureau: Record<Bureau, LetterRound>;
  introByBureau: Record<Bureau, string>;
  /** Optional closing/footer block HTML per bureau (editable bottom section). */
  footerByBureau?: Partial<Record<Bureau, string>>;
  /** Optional overrides for header + addressing blocks (so edits apply to real PDF output). */
  sender?: { name?: string; addressLine1?: string; addressLine2?: string; cityStateZip?: string };
  subjectLineByBureau?: Partial<Record<Bureau, string>>;
  bureauAddressByBureau?: Partial<Record<Bureau, { name: string; lines: string[] }>>;
  /** Optional AI narratives keyed by SelectedDispute.key */
  aiNarrativeByCandidateKey?: Record<string, string>;
  /** Optional AI follow-up questions per bureau */
  aiQuestionsByBureau?: Partial<Record<Bureau, string[]>>;
};

const VERSION = 1;

function keyForPartner(partnerId: string) {
  return `finely.letters.command_center.draft.v1:${partnerId}`;
}

export function loadLettersCommandCenterDraft(partnerId: string): LettersCommandCenterDraft | null {
  const key = keyForPartner(partnerId);
  const draft = loadJson<LettersCommandCenterDraft | null>(key, null, VERSION);
  return draft;
}

export function saveLettersCommandCenterDraft(partnerId: string, draft: Omit<LettersCommandCenterDraft, 'savedAt'>) {
  const key = keyForPartner(partnerId);
  saveJson<LettersCommandCenterDraft>(key, { ...draft, savedAt: new Date().toISOString() }, VERSION);
}

export function clearLettersCommandCenterDraft(partnerId: string) {
  const key = keyForPartner(partnerId);
  try {
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent('finely:store', { detail: { key } }));
  } catch {
    // ignore
  }
}

