import * as pdfjsLib from 'pdfjs-dist';

// Use the worker bundled by Vite.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type PdfTextExtraction = {
  text: string;
  numPages: number;
  nonEmptyPages: number;
  pages: Array<{ page: number; text: string; extractedChars: number }>;
};

export async function extractPdfTextWithMeta(file: File): Promise<PdfTextExtraction> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;

  const parts: string[] = [];
  const pages: Array<{ page: number; text: string; extractedChars: number }> = [];
  let nonEmptyPages = 0;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = (content.items as any[])
      .map((it) => {
        const str = typeof it?.str === 'string' ? String(it.str) : '';
        const t = Array.isArray(it?.transform) ? it.transform : null;
        // transform: [a,b,c,d,e,f] where e=x, f=y in PDF space
        const x = t && typeof t[4] === 'number' ? t[4] : 0;
        const y = t && typeof t[5] === 'number' ? t[5] : 0;
        return { str: str.replace(/\s+/g, ' ').trim(), x, y };
      })
      .filter((x) => Boolean(x.str));

    // Preserve rough layout by grouping into lines (y buckets) then ordering by x.
    // This massively improves downstream parsing vs a single space-joined blob.
    const lineBucket = (y: number) => Math.round(y / 1.5) * 1.5; // slightly finer buckets improves multi-row tables
    const byLine = new Map<number, { x: number; str: string }[]>();
    for (const it of items) {
      const key = lineBucket(it.y);
      const arr = byLine.get(key) ?? [];
      arr.push({ x: it.x, str: it.str });
      byLine.set(key, arr);
    }

    const lineKeys = Array.from(byLine.keys()).sort((a, b) => b - a); // higher y first (top to bottom)
    const lines: string[] = [];
    for (const k of lineKeys) {
      const row = (byLine.get(k) ?? []).slice().sort((a, b) => a.x - b.x);
      let out = '';
      let prevX: number | null = null;
      for (const cell of row) {
        if (!cell.str) continue;
        if (prevX != null) {
          const gap = cell.x - prevX;
          // heuristic: larger x gaps likely indicate column breaks
          out += gap > 14 ? '  ' : ' ';
        }
        out += cell.str;
        prevX = cell.x;
      }
      const s = out.replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\s{2,}/g, '  ').trim();
      if (s) lines.push(s);
    }

    const pageText = lines.join('\n').trim();
    if (pageText) {
      nonEmptyPages += 1;
      parts.push(pageText);
    }
    pages.push({ page: i, text: pageText, extractedChars: pageText.length });
  }
  return { text: parts.join('\n\n'), numPages: doc.numPages, nonEmptyPages, pages };
}

export function detectReportDateFromText(text: string): string | undefined {
  // Best-effort for PDFs: look for "report" + a date nearby.
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (!t) return undefined;
  const lower = t.toLowerCase();
  const dateRe = /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/;
  const isoRe = /\b(20\d{2}-\d{2}-\d{2})\b/;

  const idx = Math.max(lower.indexOf('report date'), lower.indexOf('report generated'), lower.indexOf('generated'), lower.indexOf('report'));
  const windowText = idx >= 0 ? t.slice(Math.max(0, idx - 120), Math.min(t.length, idx + 260)) : t.slice(0, 800);

  const m1 = windowText.match(dateRe);
  if (m1?.[1]) return m1[1];
  const m2 = windowText.match(isoRe);
  if (m2?.[1]) return m2[1];
  return undefined;
}

export async function extractPdfText(file: File): Promise<string> {
  const res = await extractPdfTextWithMeta(file);
  return res.text;
}

