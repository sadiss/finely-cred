import type { BackendKind, EvidenceRepo, LettersRepo, PartnersRepo, ReportsRepo, RepoContext } from './repoContracts';

// Local JSON repos (current implementation)
import { listPartners, getPartner as getPartnerLocal, upsertPartner as upsertPartnerLocal } from './partnersRepo';
import { listReportsByPartner, upsertReport, deleteReport } from './reportsRepo';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from './evidenceRepo';
import { listLettersByPartner, upsertLetter, setLetterArchived, deleteLetter } from './lettersRepo';

/**
 * Central registry of repo implementations.
 * Today: Local JSON.
 * Next: Swap to Supabase/Postgres by providing the same interface.
 */

export function getBackendKind(): BackendKind {
  // Stage 2 will read tenant / env config to choose.
  return 'local_json';
}

export function getRepoContext(): RepoContext {
  return { backend: getBackendKind() };
}

export const repos: {
  partners: PartnersRepo;
  reports: ReportsRepo;
  evidence: EvidenceRepo;
  letters: LettersRepo;
} = {
  partners: {
    listPartners,
    getPartner: getPartnerLocal,
    upsertPartner: upsertPartnerLocal,
  },
  reports: {
    listReportsByPartner,
    upsertReport,
    deleteReport: (id) => {
      try {
        deleteReport(id);
        return true;
      } catch {
        return false;
      }
    },
  },
  evidence: {
    listEvidenceByPartner,
    upsertEvidence,
    deleteEvidence: (id) => {
      try {
        deleteEvidence(id);
        return true;
      } catch {
        return false;
      }
    },
  },
  letters: {
    listLettersByPartner,
    upsertLetter,
    setLetterArchived,
    deleteLetter,
  },
};

