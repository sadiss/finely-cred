/**
 * Co-owner KNOWLEDGE archive — laws, dispute pairings, case patterns.
 * Lives in libraries (Reasons hub, Letter Studio, dispute guides) — NOT the co-owner command UI.
 */

import { DISPUTE_REASON_LAW_MAP } from './disputeReasonLawMap';

export const ARCHIVE_CREDIT_LAWS = [
  'FCRA §611', 'FCRA §623', 'FCRA §605', 'FCRA §607', 'FCRA §609', 'FCRA §612',
  'FDCPA §809', 'FDCPA §805', 'FDCPA §807', 'FDCPA §813', 'FDCPA §806',
  'TILA §130', 'TILA §1640', 'ECOA Reg B', 'FCBA §161', 'FACTA Red Flags',
  'UCC §3-308', 'UCC §3-501', 'UCC §9-210', 'State SOL', 'State Debt Collection',
  'CFPB Reg V', 'Metro2 CDIA', 'e-OSCAR ACDV',
] as const;

export const ARCHIVE_NEGATIVE_TYPES = [
  'charge_off', 'collection', 'late_payment', 'inquiry', 'public_record', 'bankruptcy',
  'foreclosure', 'repossession', 'medical_collection', 'student_loan', 'tax_lien',
  'judgment', 'hard_inquiry', 'authorized_user', 'reaging', 'duplicate_tradeline',
] as const;

export type KnowledgeArchiveEntry = {
  id: string;
  kind: 'law' | 'negative_type' | 'law_pairing' | 'reason_map';
  label: string;
  archiveRoute: string;
  description: string;
};

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Indexed pairings for stats — browse in Template Library / Reasons hub, not co-owner ops UI. */
export function buildDisputeLawPairingArchive(): KnowledgeArchiveEntry[] {
  const out: KnowledgeArchiveEntry[] = [];
  for (const law of ARCHIVE_CREDIT_LAWS) {
    for (const neg of ARCHIVE_NEGATIVE_TYPES) {
      out.push({
        id: `arch_pair_${slug(law)}_${neg}`,
        kind: 'law_pairing',
        label: `${neg.replace(/_/g, ' ')} × ${law}`,
        archiveRoute: '/portal/templates?tab=reasons',
        description: `Situation-specific challenge pattern — stored in dispute reasons library.`,
      });
    }
  }
  return out;
}

export const CO_OWNER_KNOWLEDGE_ARCHIVE: KnowledgeArchiveEntry[] = [
  ...Object.entries(DISPUTE_REASON_LAW_MAP).map(([key, basis]) => ({
    id: `arch_reason_${key}`,
    kind: 'reason_map' as const,
    label: key.replace(/_/g, ' '),
    archiveRoute: '/portal/templates?tab=reasons',
    description: basis.challengeAngle,
  })),
  ...buildDisputeLawPairingArchive(),
];

export function getKnowledgeArchiveStats() {
  return {
    lawsIndexed: ARCHIVE_CREDIT_LAWS.length,
    negativeTypes: ARCHIVE_NEGATIVE_TYPES.length,
    reasonMapEntries: Object.keys(DISPUTE_REASON_LAW_MAP).length,
    pairingEntries: ARCHIVE_CREDIT_LAWS.length * ARCHIVE_NEGATIVE_TYPES.length,
    totalArchiveEntries: CO_OWNER_KNOWLEDGE_ARCHIVE.length,
    primaryRoutes: [
      { label: 'Dispute reasons library', path: '/portal/templates?tab=reasons' },
      { label: 'Letter Studio', path: '/portal/letters' },
      { label: 'Template vault', path: '/portal/templates' },
      { label: 'Training Academy', path: '/portal/training/academy' },
    ],
  };
}
