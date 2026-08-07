/**
 * OCR smoke for scanned docket PDFs (native text sparse).
 * Uses pdfjs raw image ops + tesseract.js (no node-canvas).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createWorker } from 'tesseract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

const pdfPath = path.join(__dirname, 'DOCKET_NUMBER.pdf');
const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

function firstMatch(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return String(m[1]).replace(/\s+/g, ' ').trim();
  }
  return undefined;
}

function redactName(s) {
  if (!s) return s;
  return s
    .split(/\s+/)
    .map((p) => (p.length <= 2 ? p[0] + '*' : p[0] + '***'))
    .join(' ');
}

async function extractPageImages(page) {
  const ops = await page.getOperatorList();
  const images = [];
  const { OPS } = pdfjs;
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];
    if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      const name = args[0];
      try {
        const img = await page.objs.get(name);
        if (img?.data && img?.width && img?.height) {
          images.push({ width: img.width, height: img.height, data: img.data, kind: img.kind });
        }
      } catch {
        // ignore unresolved
      }
    }
  }
  return images;
}

function rgbaPngLikeBuffer(img) {
  // tesseract.js accepts Buffer/Uint8Array of image file OR ImageLike with data/width/height
  const { width, height, data } = img;
  // Ensure RGBA
  let rgba;
  if (data.length === width * height * 4) rgba = data;
  else if (data.length === width * height * 3) {
    rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      rgba[j] = data[i];
      rgba[j + 1] = data[i + 1];
      rgba[j + 2] = data[i + 2];
      rgba[j + 3] = 255;
    }
  } else if (data.length === width * height) {
    rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0, j = 0; i < data.length; i++, j += 4) {
      rgba[j] = rgba[j + 1] = rgba[j + 2] = data[i];
      rgba[j + 3] = 255;
    }
  } else {
    return null;
  }
  return { width, height, data: rgba };
}

const worker = await createWorker('eng');
const texts = [];
const maxPages = Math.min(doc.numPages, 2);
for (let p = 1; p <= maxPages; p++) {
  const page = await doc.getPage(p);
  const images = await extractPageImages(page);
  console.error(`Page ${p}: ${images.length} image(s)`);
  // Prefer largest image (full-page scan)
  images.sort((a, b) => b.width * b.height - a.width * a.height);
  const top = images[0];
  if (!top) continue;
  const like = rgbaPngLikeBuffer(top);
  if (!like) continue;
  const {
    data: { text },
  } = await worker.recognize(like);
  texts.push(text || '');
  console.error(`Page ${p} OCR chars: ${(text || '').length}`);
}
await worker.terminate();

const text = texts.join('\n\n');
const fields = {
  caseNumber: firstMatch(text, [
    /(?:case\s*(?:no\.?|number|#)|docket\s*(?:no\.?|number|#))\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/ ]{3,40})/i,
    /\b(\d{2,4}[- ]?\d{2,8}[- ]?(?:GC|CK|CZ|CV|SC|CI)[- ]?\d{0,6})\b/i,
  ]),
  courtName: firstMatch(text, [/((?:[\w.]+\s+){0,6}(?:DISTRICT|CIRCUIT|SUPERIOR|MUNICIPAL)\s+COURT[^\n]{0,40})/i]),
  plaintiff: firstMatch(text, [/Plaintiff[:\s]+([A-Z][A-Za-z0-9 &.,'\-]{2,80})/i, /([A-Z][A-Z0-9 &.,'\-]{2,60})\s+v(?:s)?\.?\s+/i]),
  defendant: firstMatch(text, [/Defendant[:\s]+([A-Z][A-Za-z0-9 &.,'\-]{2,80})/i]),
  hearingDate: firstMatch(text, [/(?:hearing|trial|pretrial|return)\s*(?:date)?\s*[:\s]+([A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i]),
  amount: firstMatch(text, [/\$\s*([\d,]+\.\d{2})/]),
  counsel: firstMatch(text, [/([A-Z][A-Za-z &.,'\-]{2,60}(?:P\.?C\.?|LLC|LLP|Law\s+(?:Group|Firm|Offices)))/]),
};

const out = {
  file: 'DOCKET_NUMBER.pdf',
  usedOcr: true,
  pagesOcrd: maxPages,
  totalPages: doc.numPages,
  textChars: text.length,
  fields: { ...fields, defendant: fields.defendant ? redactName(fields.defendant) : undefined },
  preview: text.slice(0, 800).replace(/\s+/g, ' '),
};
fs.writeFileSync(path.join(__dirname, 'scrape-result-ocr.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
