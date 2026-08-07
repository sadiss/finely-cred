/**
 * Offline scrape smoke for DOCKET_NUMBER.pdf — prints redacted field summary.
 * Run: node _import_docket/scrape-docket-sample.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');

const pdfPath = path.join(__dirname, 'DOCKET_NUMBER.pdf');
if (!fs.existsSync(pdfPath)) {
  console.error('Missing', pdfPath);
  process.exit(1);
}

function firstMatch(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return String(m[1]).replace(/\s+/g, ' ').trim();
  }
  return undefined;
}

function redactName(s) {
  if (!s) return s;
  const parts = s.split(/\s+/);
  if (parts.length < 2) return s.slice(0, 2) + '***';
  return parts.map((p, i) => (i === 0 ? p[0] + '***' : p[0] + '***')).join(' ');
}

const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
const maxPages = Math.min(doc.numPages, 8);
const parts = [];
for (let i = 1; i <= maxPages; i++) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  const str = content.items.map((it) => (typeof it.str === 'string' ? it.str : '')).join(' ');
  parts.push(str);
}
const text = parts.join('\n\n');

const fields = {
  caseNumber: firstMatch(text, [
    /(?:case\s*(?:no\.?|number|#)|docket\s*(?:no\.?|number|#)|file\s*(?:no\.?|number))\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/ ]{3,40})/i,
    /\b(\d{2,4}[- ]?\d{2,8}[- ]?(?:GC|CK|CZ|CV|SC|CI)[- ]?\d{0,6})\b/i,
    /\b(\d{2}-\d{4,8}-[A-Z]{1,4})\b/,
  ]),
  courtName: firstMatch(text, [
    /((?:[\w.]+\s+){0,4}(?:DISTRICT|CIRCUIT|SUPERIOR|MUNICIPAL|JUSTICE|SMALL CLAIMS)\s+COURT[^\n]{0,60})/i,
  ]),
  plaintiff: firstMatch(text, [
    /Plaintiff[:\s]+([A-Z][A-Za-z0-9 &.,'\-]{2,80})/i,
    /([A-Z][A-Z0-9 &.,'\-]{2,60})\s+v(?:s)?\.?\s+/i,
  ]),
  defendant: firstMatch(text, [/Defendant[:\s]+([A-Z][A-Za-z0-9 &.,'\-]{2,80})/i]),
  hearingDate: firstMatch(text, [
    /(?:hearing|trial|pretrial|pre-trial|return)\s*(?:date)?\s*[:\s]+([A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  ]),
  amount: firstMatch(text, [
    /(?:amount\s*(?:claimed|due|owing)|principal|balance\s*due|judgment\s*amount)\s*[:$]?\s*\$?\s*([\d,]+\.\d{2})/i,
    /\$\s*([\d,]+\.\d{2})/,
  ]),
  counsel: firstMatch(text, [
    /Attorney(?:s)? for Plaintiff[:\s]+([^\n]{3,80})/i,
    /([A-Z][A-Za-z &.,'\-]{2,60}(?:P\.?C\.?|LLC|LLP|Law(?:\s+Group|\s+Firm| Offices)?))/,
  ]),
};

const out = {
  file: 'DOCKET_NUMBER.pdf',
  pagesScanned: maxPages,
  totalPages: doc.numPages,
  textChars: text.length,
  fields: {
    ...fields,
    defendant: fields.defendant ? redactName(fields.defendant) : undefined,
  },
  preview: text.slice(0, 500).replace(/\s+/g, ' '),
};

fs.writeFileSync(path.join(__dirname, 'scrape-result.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
