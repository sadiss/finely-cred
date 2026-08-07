export type NoteAuthorType = 'admin' | 'partner' | 'system';
export type NoteKind = 'manual' | 'system';
export type NoteVisibility = 'internal' | 'partner';

export type PartnerNoteMeta = {
  letterId?: string;
  debtCaseId?: string;
  source?: 'letter_save' | 'letter_mail' | string;
};

export type PartnerNote = {
  id: string;
  partnerId: string;
  kind: NoteKind;
  authorType: NoteAuthorType;
  authorEmail?: string;
  visibility: NoteVisibility;
  title?: string;
  body: string;
  pinned?: boolean;
  /** Optional linkage when note is created from letter Save / Mail */
  meta?: PartnerNoteMeta;
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

