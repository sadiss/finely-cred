import type { Partner } from '../domain/partners';
import type { EvidenceItem } from '../domain/evidence';
import type { LetterRecord } from '../domain/letters';
import type { CreditReportRecord } from '../domain/creditReports';

/**
 * Stage 1 (staged backend cutover):
 * Define repository interfaces so we can swap Local JSON → Supabase/Postgres later
 * without rewriting UI modules.
 */

export type BackendKind = 'local_json' | 'supabase';

export type RepoContext = {
  backend: BackendKind;
};

export interface PartnersRepo {
  listPartners(): Partner[];
  getPartner(id: string): Partner | null;
  upsertPartner(p: Partner): Partner;
}

export interface ReportsRepo {
  listReportsByPartner(partnerId: string): CreditReportRecord[];
  upsertReport(r: CreditReportRecord): CreditReportRecord;
  deleteReport(id: string): boolean;
}

export interface EvidenceRepo {
  listEvidenceByPartner(partnerId: string): EvidenceItem[];
  upsertEvidence(e: EvidenceItem): EvidenceItem;
  deleteEvidence(id: string): boolean;
}

export interface LettersRepo {
  listLettersByPartner(partnerId: string): LetterRecord[];
  upsertLetter(l: LetterRecord): LetterRecord;
  setLetterArchived(args: { letterId: string; archived: boolean }): LetterRecord | null;
  deleteLetter(args: { letterId: string }): boolean;
}

