import type { EvidenceItem } from '../domain/evidence';

export function isParsedExhibit(item: EvidenceItem): boolean {
  return (
    item.source === 'parsed_finely_exhibit' ||
    item.source === 'tradeline_screenshot' ||
    item.source === 'section_screenshot' ||
    item.provenance?.kind === 'parsed_finely_exhibit'
  );
}

export function isSourceCrop(item: EvidenceItem): boolean {
  return item.source === 'source_report_crop' || item.provenance?.kind === 'source_faithful_report_crop';
}

/** Synthetic or machine-generated exhibits must be confirmed before mailing. */
export function needsEvidenceMailReview(item: EvidenceItem): boolean {
  if (item.source === 'demo_synthetic' || item.provenance?.demoOnly) return true;

  const generatedOrCropped = isParsedExhibit(item) || isSourceCrop(item);
  return Boolean(
    generatedOrCropped &&
      (item.provenance?.mailEligible !== true || item.provenance?.humanVerified !== true),
  );
}

export function isMailEligibleEvidence(item: EvidenceItem): boolean {
  if (item.source === 'demo_synthetic' || item.provenance?.demoOnly) return false;
  if (needsEvidenceMailReview(item)) return false;
  if (item.provenance?.mailEligible === true && item.provenance?.humanVerified === true) return true;

  return !(isParsedExhibit(item) || isSourceCrop(item));
}

export function isSourceLinkedEvidence(item: EvidenceItem): boolean {
  return Boolean(item.sectionKey) || isSourceCrop(item);
}

/** Partner confirms a crop or parsed exhibit matches the original source report. */
export function approveEvidenceForMail(item: EvidenceItem): EvidenceItem {
  const sourceCrop = isSourceCrop(item);
  return {
    ...item,
    provenance: {
      kind: sourceCrop ? 'source_faithful_report_crop' : 'parsed_finely_exhibit',
      sourceReportId: item.reportId,
      ...item.provenance,
      redaction: item.provenance?.redaction
        ? {
            ...item.provenance.redaction,
            reviewedByUser: true,
          }
        : undefined,
      generatedAt: item.provenance?.generatedAt ?? item.createdAt,
      mailEligible: true,
      humanVerified: true,
    },
  };
}
