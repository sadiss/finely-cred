import type {
  ParsedCreditReport,
  ReportSourceAnchor,
} from '../domain/creditReports';

type SourceAnchored = {
  sourceAnchor?: ReportSourceAnchor;
};

/**
 * Binds parser-created anchors to the immutable report content hash.
 * Legacy reports without anchors remain valid and can be re-parsed later.
 */
export function stampReportSourceHash(
  parsed: ParsedCreditReport | undefined,
  reportSha256: string | undefined,
): ParsedCreditReport | undefined {
  if (!parsed || !reportSha256) return parsed;

  const stamp = <T extends SourceAnchored>(item: T): T => (
    item.sourceAnchor
      ? { ...item, sourceAnchor: { ...item.sourceAnchor, reportSha256 } }
      : item
  );

  return {
    ...parsed,
    tradelines: (parsed.tradelines ?? []).map(stamp),
    scores: parsed.scores?.map(stamp),
    sections: parsed.sections?.map((section) => ({
      ...stamp(section),
      items: section.items?.map(stamp),
    })),
  };
}
