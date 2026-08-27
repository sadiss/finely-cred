import type { EvidenceItem } from '../domain/evidence';

/** Top-level vault sections shown in the partner documents hub. */
export type EvidenceVaultBucketId =
  | 'screenshots'
  | 'credit_reports'
  | 'bureau_responses'
  | 'debt_docket'
  | 'letters_and_contracts'
  | 'identification'
  | 'dispute_proof'
  | 'uncategorized';

export const EVIDENCE_VAULT_BUCKET_ORDER: EvidenceVaultBucketId[] = [
  'screenshots',
  'credit_reports',
  'bureau_responses',
  'debt_docket',
  'letters_and_contracts',
  'identification',
  'dispute_proof',
  'uncategorized',
];

export const EVIDENCE_VAULT_BUCKET_LABELS: Record<EvidenceVaultBucketId, string> = {
  screenshots: 'Credit report screenshots',
  credit_reports: 'Credit report documents',
  bureau_responses: 'Bureau investigation responses',
  debt_docket: 'Debt, collector & court / docket',
  letters_and_contracts: 'Credit & dispute letters',
  identification: 'Identification & proof of address',
  dispute_proof: 'Payment & dispute proof',
  uncategorized: 'Needs category',
};

const DEBT_DOCKET_SECTION_KEYS = new Set([
  'affidavit',
  'summons_court',
  'summons',
  'debt_collector',
  'creditor_response',
  'court_filing',
  'bankruptcy_court',
]);

const DEBT_DOCKET_DOC_TYPES = new Set([
  'affidavit',
  'summons',
  'collection_notice',
  'creditor_response',
  'court_filing',
  'bankruptcy_order',
]);

const TRADELINE_SCREENSHOT_SECTION_KEYS = new Set([
  'collections',
  'collections_tradeline',
  'inquiries',
  'public_records',
  'bankruptcy',
  'charge_off',
]);

export function docTypeFromEvidenceTags(item: EvidenceItem): string | null {
  const tag = (item.tags ?? []).find((t) => t.startsWith('doctype:'));
  return tag ? tag.slice('doctype:'.length) : null;
}

function haystack(item: EvidenceItem): string {
  return `${item.filename || ''} ${item.caption || ''} ${item.sectionKey || ''}`.toLowerCase();
}

export function isCreditReportScreenshot(item: EvidenceItem): boolean {
  if (item.type !== 'screenshot') return false;
  if (item.source === 'tradeline_screenshot' || item.source === 'section_screenshot') return true;
  return true;
}

export function evidenceVaultBucket(item: EvidenceItem): EvidenceVaultBucketId {
  if (isCreditReportScreenshot(item)) return 'screenshots';

  const section = String(item.sectionKey || '').toLowerCase();
  const docType = docTypeFromEvidenceTags(item);
  const h = haystack(item);

  if (
    section === 'identity' ||
    section === 'proof_of_address' ||
    section === 'id_docs' ||
    docType === 'id_document' ||
    docType === 'ssn_card' ||
    docType === 'utility_bill'
  ) {
    return 'identification';
  }

  if (section === 'credit_report' || docType === 'credit_report') return 'credit_reports';

  if (section === 'bureau_response' || docType === 'bureau_response') return 'bureau_responses';

  if (DEBT_DOCKET_SECTION_KEYS.has(section) || (docType && DEBT_DOCKET_DOC_TYPES.has(docType))) {
    return 'debt_docket';
  }

  if (TRADELINE_SCREENSHOT_SECTION_KEYS.has(section) && item.type !== 'screenshot') {
    return 'uncategorized';
  }

  if (section === 'dispute_proof' || docType === 'bank_statement') return 'dispute_proof';

  if (
    section === 'contracts' ||
    docType === 'contract' ||
    /\b(dispute letter|validation letter|cease and desist|607\s*b|623\s*a|creditor letter)\b/.test(h)
  ) {
    return 'letters_and_contracts';
  }

  if (section === 'other' || !section) return 'uncategorized';

  return 'uncategorized';
}

/**
 * Which of the two partner destinations a vault file belongs to.
 *
 * `Documents` and `Evidence vault` are separate pages, and a file must appear on exactly one of
 * them — showing the same upload in both is what made the two pages feel like one duplicated
 * list. The line is *purpose*, not file type:
 *
 *   documents — paperwork the partner supplies about themselves: ID, proof of address, the raw
 *               report file they exported, signed contracts.
 *   evidence  — exhibits that back a specific dispute reason: report crops, bureau replies,
 *               collector and court paper, payment proof.
 */
export type EvidenceDestination = 'documents' | 'evidence';

const EVIDENCE_BUCKETS = new Set<EvidenceVaultBucketId>([
  'screenshots',
  'bureau_responses',
  'debt_docket',
  'dispute_proof',
]);

export function evidenceDestination(item: EvidenceItem): EvidenceDestination {
  return EVIDENCE_BUCKETS.has(evidenceVaultBucket(item)) ? 'evidence' : 'documents';
}

/** Subgroup label inside a bucket (e.g. tradeline vs section capture). */
export function evidenceVaultSubgroupLabel(item: EvidenceItem): string {
  if (item.type === 'screenshot') {
    if (item.source === 'tradeline_screenshot') return 'Tradeline captures';
    if (item.source === 'section_screenshot' && item.sectionKey) {
      return item.sectionKey.replace(/_/g, ' ');
    }
    if (item.sectionKey && TRADELINE_SCREENSHOT_SECTION_KEYS.has(item.sectionKey)) {
      return item.sectionKey.replace(/_/g, ' ');
    }
    return 'Screenshots';
  }
  if (item.sectionKey) {
    return item.sectionKey.replace(/_/g, ' ');
  }
  const dt = docTypeFromEvidenceTags(item);
  if (dt) return dt.replace(/_/g, ' ');
  return 'General';
}

export function groupEvidenceByVaultBucket(items: EvidenceItem[]): Array<{
  bucket: EvidenceVaultBucketId;
  label: string;
  subgroups: Array<{ key: string; label: string; items: EvidenceItem[] }>;
}> {
  const byBucket = new Map<EvidenceVaultBucketId, EvidenceItem[]>();
  for (const item of items) {
    const bucket = evidenceVaultBucket(item);
    const arr = byBucket.get(bucket) ?? [];
    arr.push(item);
    byBucket.set(bucket, arr);
  }

  return EVIDENCE_VAULT_BUCKET_ORDER.filter((b) => (byBucket.get(b)?.length ?? 0) > 0).map((bucket) => {
    const bucketItems = byBucket.get(bucket) ?? [];
    const subMap = new Map<string, EvidenceItem[]>();
    for (const item of bucketItems) {
      const subKey = evidenceVaultSubgroupLabel(item);
      const arr = subMap.get(subKey) ?? [];
      arr.push(item);
      subMap.set(subKey, arr);
    }
    const subgroups = Array.from(subMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, subgroupItems]) => ({
        key,
        label: key,
        items: subgroupItems.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }));
    return {
      bucket,
      label: EVIDENCE_VAULT_BUCKET_LABELS[bucket],
      subgroups,
    };
  });
}
