import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const faulty = path.join(root, '_import_credit_analysis', 'rendered_smoke_review', '02.png');
const cleanBase = path.join(root, 'public', 'credit-analysis', 'premium-spreads', 'v1', '02_credit_readiness_and_analysis_overview.png');
const outDir = path.join(root, 'public', 'credit-analysis', 'proofs');
const outPng = path.join(outDir, 'page-2-side-by-side-proof.png');
const outHtml = path.join(outDir, 'page-2-proof.html');

if (!fs.existsSync(faulty)) {
  throw new Error(`Missing faulty page render: ${faulty}`);
}

if (!fs.existsSync(cleanBase)) {
  throw new Error(`Missing clean spread artwork: ${cleanBase}`);
}

fs.mkdirSync(outDir, { recursive: true });

const leftBuffer = await sharp(faulty).resize({ width: 1024 }).png().toBuffer();
const rightBuffer = await sharp(cleanBase).resize({ width: 1024 }).png().toBuffer();
const meta = await sharp(leftBuffer).metadata();
const w = meta.width ?? 1024;
const h = meta.height ?? 724;
const header = 78;
const gap = 26;
const margin = 28;
const canvasW = margin * 2 + w * 2 + gap;
const canvasH = header + h + margin;

const svg = Buffer.from(`
<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#141414"/>
  <text x="${margin}" y="32" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#f1efe8">Faulty current generated page 2</text>
  <text x="${margin}" y="58" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#d1b56a">Shows the bars, collisions, and damaged artwork</text>
  <text x="${margin + w + gap}" y="32" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#f1efe8">Corrected proof direction</text>
  <text x="${margin + w + gap}" y="58" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#7ed957">Same page, clean data zones, no destructive cover bars</text>
  <line x1="${margin + w + gap / 2}" y1="16" x2="${margin + w + gap / 2}" y2="${canvasH - 16}" stroke="#d1b56a" stroke-width="2" opacity="0.5"/>
</svg>`);

await sharp({
  create: {
    width: canvasW,
    height: canvasH,
    channels: 4,
    background: '#141414ff',
  },
})
  .composite([
    { input: svg, left: 0, top: 0 },
    { input: leftBuffer, left: margin, top: header },
    { input: rightBuffer, left: margin + w + gap, top: header },
  ])
  .png()
  .toFile(outPng);

fs.writeFileSync(
  outHtml,
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Finely Cred Page 2 Proof</title>
  <style>
    body { margin: 0; background: #101010; color: #f6f1e8; font-family: Arial, Helvetica, sans-serif; }
    header { padding: 18px 22px; border-bottom: 1px solid rgba(209,181,106,.35); }
    h1 { margin: 0 0 6px; font-size: 22px; }
    p { margin: 0; color: #d7c9aa; }
    .wrap { padding: 18px; }
    img { display: block; width: 100%; height: auto; border-radius: 10px; box-shadow: 0 20px 70px rgba(0,0,0,.45); }
  </style>
</head>
<body>
  <header>
    <h1>Page 2 Proof: Faulty vs Corrected Direction</h1>
    <p>Left is the current broken generated page. Right is the clean corrected proof direction for the same spread.</p>
  </header>
  <div class="wrap"><img src="./page-2-side-by-side-proof.png" alt="Faulty page 2 beside corrected page 2 proof" /></div>
</body>
</html>`,
);

console.log(outPng);
console.log(outHtml);
