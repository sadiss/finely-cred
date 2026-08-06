/** Best-effort report-date detection from extracted PDF/text blobs (Node + browser safe). */
export function detectReportDateFromText(text: string): string | undefined {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (!t) return undefined;
  const lower = t.toLowerCase();
  const dateRe = /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/;
  const isoRe = /\b(20\d{2}-\d{2}-\d{2})\b/;

  const idx = Math.max(
    lower.indexOf('report date'),
    lower.indexOf('report generated'),
    lower.indexOf('generated'),
    lower.indexOf('report'),
  );
  const windowText = idx >= 0 ? t.slice(Math.max(0, idx - 120), Math.min(t.length, idx + 260)) : t.slice(0, 800);

  const m1 = windowText.match(dateRe);
  if (m1?.[1]) return m1[1];
  const m2 = windowText.match(isoRe);
  if (m2?.[1]) return m2[1];
  return undefined;
}
