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

export { detectReportDateFromText } from './detectReportDateFromText';

export async function extractPdfText(file: File): Promise<string> {
  const res = await extractPdfTextWithMeta(file);
  return res.text;
}

