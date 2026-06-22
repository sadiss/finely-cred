function safeName(name: string) {
  return String(name || 'Partner')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function fmtShortDate(d: Date) {
  try {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function isoFileDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Display title — no underscores, clean separators */
export function buildCreditAnalysisTitle(args: { partnerName: string; generatedAt?: Date; sourceReportFilename?: string }) {
  const name = safeName(args.partnerName);
  const when = args.generatedAt ?? new Date();
  const date = fmtShortDate(when);
  return `Credit Analysis · ${name} · ${date}`;
}

/** Filesystem-safe download name with spaces and dashes */
export function buildCreditAnalysisFilename(args: { partnerName: string; generatedAt?: Date }) {
  const name = safeName(args.partnerName);
  const when = args.generatedAt ?? new Date();
  return `Credit Analysis - ${name} - ${isoFileDate(when)}.pdf`;
}

export function formatCreditAnalysisCardSubtitle(args: {
  pages?: number;
  createdAt?: string;
  sourceReportFilename?: string;
}) {
  const parts: string[] = [];
  if (args.pages && args.pages > 0) parts.push(`${args.pages} pages`);
  if (args.createdAt) {
    try {
      parts.push(new Date(args.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }));
    } catch {
      parts.push(args.createdAt);
    }
  }
  if (args.sourceReportFilename) {
    const short = args.sourceReportFilename.length > 28 ? `${args.sourceReportFilename.slice(0, 25)}…` : args.sourceReportFilename;
    parts.push(`From ${short}`);
  }
  return parts.join(' · ');
}
