import type { EvidenceItem } from '../domain/evidence';

export type IdentityDocKind = 'government_id' | 'proof_of_address';

export type DocumentVaultMissingItem = {
  kind: IdentityDocKind;
  label: string;
};

export type DocumentVaultGateResult = {
  ok: boolean;
  missing: DocumentVaultMissingItem[];
  message: string;
};

const MISSING_LABELS: Record<IdentityDocKind, string> = {
  government_id: 'Government ID',
  proof_of_address: 'Proof of address',
};

const ID_RE = /\b(id|passport|driver|dl|license|state\s*id|identification)\b/i;
const ADDRESS_RE = /\b(proof\s*of\s*address|utility|lease|bank\s*statement|address)\b/i;

function tagHaystack(item: EvidenceItem): string {
  return [(item.tags ?? []).join(' '), item.caption ?? '', item.filename ?? '', item.sectionKey ?? ''].join(' ').toLowerCase();
}

export function hasGovernmentId(evidence: EvidenceItem[]): boolean {
  return evidence.some((e) => ID_RE.test(tagHaystack(e)) || (e.tags ?? []).includes('government_id'));
}

export function hasProofOfAddress(evidence: EvidenceItem[]): boolean {
  return evidence.some((e) => ADDRESS_RE.test(tagHaystack(e)) || (e.tags ?? []).includes('proof_of_address'));
}

/** Onboarding blocker until ID + POA uploaded (Phase 20). */
export function checkIdentityDocumentGate(evidence: EvidenceItem[]): DocumentVaultGateResult {
  const missingKinds: IdentityDocKind[] = [];
  if (!hasGovernmentId(evidence)) missingKinds.push('government_id');
  if (!hasProofOfAddress(evidence)) missingKinds.push('proof_of_address');

  const missing = missingKinds.map((kind) => ({ kind, label: MISSING_LABELS[kind] }));

  if (missing.length === 0) {
    return { ok: true, missing: [], message: 'Identity documents on file.' };
  }

  const labels = missing.map((m) => m.label).join(' and ');

  return {
    ok: false,
    missing,
    message: `Upload ${labels} to your Documents Vault before mailing dispute letters — bureaus require identity verification.`,
  };
}

/** Alias used by letter vault + partner detail screens. */
export const checkIdentityVaultGate = checkIdentityDocumentGate;
