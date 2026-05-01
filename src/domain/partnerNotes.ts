export type NoteAuthorType = 'admin' | 'partner' | 'system';
export type NoteKind = 'manual' | 'system';
export type NoteVisibility = 'internal' | 'partner';

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
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

