/**
 * Design-parity capture for the pages the owner called out as washed out
 * (Restore Workspace, Credit Reports, Evidence, Documents) against the
 * partner dashboard, which is the reference.
 *
 * Rather than trusting a class list, this walks every card-sized box on the page
 * and scores how much colour is ACTUALLY painted on it — border ink, background
 * colour, own background gradients, and any decorative `.pbx-layer` child. A box
 * the owner can "barely see" scores in the low single digits.
 *
 *   node scripts/shot-design-parity.mjs --label=before
 *   node scripts/shot-design-parity.mjs --label=after
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);

const label = args.label || 'shot';
const width = Number(args.width) || 1440;
const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const outDir = `qa-shots/design-parity-${label}`;

const TARGETS = [
  { id: 'dashboard', path: 'portal/dashboard', note: 'REFERENCE' },
  { id: 'checklist', path: 'portal/checklist', note: 'Restore Workspace' },
  { id: 'reports', path: 'portal/reports', note: 'Credit Reports (+ tabs)' },
  { id: 'evidence', path: 'portal/evidence', note: 'Evidence' },
  { id: 'documents', path: 'portal/documents', note: 'Documents' },
  { id: 'letters', path: 'portal/letters', note: 'sibling — shares vault + hub' },
  { id: 'disputes', path: 'portal/disputes', note: 'sibling — shares hub' },
  { id: 'debt', path: 'portal/debt', note: 'sibling — shares product panels' },
  { id: 'admin-partners', path: 'admin/partners', note: 'admin partner portfolio' },
  { id: 'admin-partner-file', path: 'admin/partners/p1', note: 'admin view partner' },
];

const PROBE = `(() => {
  const parseColors = (text) => {
    const out = [];
    for (const m of String(text).matchAll(/rgba?\\(([^)]+)\\)/g)) {
      const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number);
      if (p.length >= 3) out.push({ r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 });
    }
    for (const m of String(text).matchAll(/#([0-9a-f]{6})\\b/gi)) {
      const h = m[1];
      out.push({ r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16), a: 1 });
    }
    return out;
  };
  // Distance from grey scaled by alpha: "how much colour is really there".
  const chroma = (c) => ((Math.max(c.r,c.g,c.b) - Math.min(c.r,c.g,c.b)) / 2.55) * (c.a ?? 1);
  const maxChroma = (text) => parseColors(text).reduce((acc, c) => Math.max(acc, chroma(c)), 0);

  const rows = [];
  for (const el of document.querySelectorAll('div, section, article, button, a, li')) {
    const r = el.getBoundingClientRect();
    // Card-sized only: skip page wrappers, skip chips and hairlines.
    if (r.width < 170 || r.width > 1300 || r.height < 78 || r.height > 620) continue;
    const cs = getComputedStyle(el);
    const bw = parseFloat(cs.borderTopWidth) || 0;
    const radius = parseFloat(cs.borderTopLeftRadius) || 0;
    const hasEdge = bw > 0 || cs.boxShadow !== 'none';
    if (!hasEdge && radius < 6) continue;

    const borderChroma = bw > 0 ? maxChroma(cs.borderTopColor) : 0;
    let fillChroma = maxChroma(cs.backgroundColor);
    if (cs.backgroundImage !== 'none') fillChroma = Math.max(fillChroma, maxChroma(cs.backgroundImage));
    for (const child of el.children) {
      if (child.classList && child.classList.contains('pbx-layer')) {
        fillChroma = Math.max(fillChroma, maxChroma(getComputedStyle(child).backgroundImage));
      }
    }
    rows.push({
      tag: el.tagName.toLowerCase(),
      cls: el.className.toString().replace(/\\s+/g, ' ').slice(0, 70),
      w: Math.round(r.width), h: Math.round(r.height),
      borderW: +bw.toFixed(1),
      borderChroma: +borderChroma.toFixed(1),
      fillChroma: +fillChroma.toFixed(1),
      score: +Math.max(borderChroma * (bw >= 1.5 ? 1 : 0.6), fillChroma).toFixed(1),
    });
  }
  return rows;
})()`;

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const report = [];

for (const target of TARGETS) {
  const page = await browser.newPage({ viewport: { width, height: 1100 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const row = { ...target, boxes: 0, weak: 0, weakPct: 0, medianScore: 0, note: '' };

  try {
    await page.goto(`${base}/preview/workspace-light/${target.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(3200);

    const probe = await page.evaluate(PROBE);
    row.boxes = probe.length;
    // "Weak" is the owner's complaint made measurable: no real edge AND no real fill.
    row.weak = probe.filter((p) => p.score < 8).length;
    row.weakPct = probe.length ? Math.round((row.weak / probe.length) * 100) : 0;
    const scores = probe.map((p) => p.score).sort((a, b) => a - b);
    row.medianScore = scores.length ? scores[Math.floor(scores.length / 2)] : 0;

    await page.screenshot({ path: `${outDir}/${target.id}.png`, fullPage: true });
    await writeFile(`${outDir}/${target.id}.boxes.json`, JSON.stringify(probe, null, 2));
  } catch (err) {
    row.note = err instanceof Error ? err.message.split('\n')[0].slice(0, 90) : String(err);
  }
  if (errors.length) row.note ||= errors[0].slice(0, 90);

  report.push(row);
  console.log(
    `${target.id.padEnd(12)} boxes=${String(row.boxes).padEnd(4)} weak=${String(row.weak).padEnd(4)} ` +
      `(${String(row.weakPct).padStart(3)}%)  medianScore=${String(row.medianScore).padEnd(6)} ${row.note}`,
  );
  await page.close();
}

await browser.close();
await writeFile(`${outDir}/report.json`, JSON.stringify(report, null, 2));
console.log(`\nshots + report -> ${outDir}/`);
