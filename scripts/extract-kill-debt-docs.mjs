import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const folder = process.argv[2] || 'f:\\Kill Debt letters';
const outDir = process.argv[3] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.rshot', 'kill-debt-extract');

fs.mkdirSync(outDir, { recursive: true });

function docxText(filePath) {
  const zip = new AdmZip(filePath);
  const entry = zip.getEntry('word/document.xml');
  if (!entry) return '[no document.xml]';
  const xml = entry.getData().toString('utf8');
  return xml
    .replace(/<w:tab[^>]*\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function pdfText(filePath) {
  try {
    const mod = await import('pdf-parse');
    const pdfParse = typeof mod.default === 'function' ? mod.default : mod;
    const data = await pdfParse(fs.readFileSync(filePath));
    return (data.text || '').trim();
  } catch (e) {
    return `[PDF extract failed: ${e.message}]`;
  }
}

const files = fs.readdirSync(folder).filter((f) => /\.(docx|pdf)$/i.test(f)).sort();
const index = [];

for (const f of files) {
  const fp = path.join(folder, f);
  const base = f.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_').slice(0, 80);
  const outPath = path.join(outDir, `${base}.txt`);
  let text = '';
  if (f.toLowerCase().endsWith('.docx')) {
    text = docxText(fp);
  } else {
    text = await pdfText(fp);
  }
  fs.writeFileSync(outPath, text, 'utf8');
  index.push({ file: f, out: outPath, chars: text.length, preview: text.slice(0, 400) });
  console.log(`Wrote ${f} (${text.length} chars)`);
}

fs.writeFileSync(path.join(outDir, '_index.json'), JSON.stringify(index, null, 2));
console.log('Done ->', outDir);
