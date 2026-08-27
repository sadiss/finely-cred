/**
 * Contrast probe: Partners + Admin dashboard in light and dark site theme.
 * Checks luxury-glass / KPI / inspector ink vs bed (no light-on-light / dark-on-dark).
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const outDir = 'qa-shots/contrast-pass';
await mkdir(outDir, { recursive: true });

function luminance(rgb) {
  const m = String(rgb).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  const [r, g, b] = [m[1], m[2], m[3]].map((n) => {
    const c = Number(n) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  if (a == null || b == null) return null;
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

async function sample(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const bg = (() => {
      let node = el;
      while (node && node !== document.documentElement) {
        const bgc = getComputedStyle(node).backgroundColor;
        if (bgc && bgc !== 'rgba(0, 0, 0, 0)' && bgc !== 'transparent') return bgc;
        node = node.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    })();
    return {
      text: (el.innerText || '').slice(0, 80),
      color: cs.color,
      backgroundColor: bg,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
    };
  }, selector);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const report = [];

async function runTheme(theme, path, samples) {
  await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-fc-theme', t);
    document.documentElement.style.colorScheme = t;
  }, theme);
  await page.waitForTimeout(2500);
  const slug = path.replace(/\//g, '-').replace(/^-/, '');
  await page.screenshot({ path: `${outDir}/${theme}-${slug}.png`, fullPage: false });
  for (const sel of samples) {
    const hit = await sample(page, sel);
    if (!hit) {
      report.push({ theme, path, sel, missing: true });
      continue;
    }
    const ratio = contrastRatio(luminance(hit.color), luminance(hit.backgroundColor));
    report.push({
      theme,
      path,
      sel,
      ratio: ratio ? Number(ratio.toFixed(2)) : null,
      fail: ratio != null && ratio < 3,
      ...hit,
    });
  }
}

const partnerSels = [
  '.fc-wlp-command-title, .fc-wlp-command h1, [data-page-id] h1',
  '.fc-wlp-arch-metrics-inline-chip',
  '.fc-partners-portfolio-lens-copy strong',
  '.fc-partners-portfolio-mosaic-head h2',
  '.fc-wlp-atlas-node-name',
  '.fc-wlp-atlas-filter-btn',
];

const adminSels = [
  '.fc-unified-hub-shell h2',
  '[data-fc-kpi-surface] .text-4xl, [data-fc-kpi-surface] [class*="text-4xl"]',
  '[data-fc-kpi-surface]',
  '.fc-hub-kpi',
];

await runTheme('light', '/preview/workspace-light/admin/partners', partnerSels);
await runTheme('dark', '/preview/workspace-light/admin/partners', partnerSels);
await runTheme('light', '/preview/workspace-light/admin/dashboard', adminSels);
await runTheme('dark', '/preview/workspace-light/admin/dashboard', adminSels);

const fails = report.filter((r) => r.fail || r.missing);
console.log(JSON.stringify({ fails, all: report }, null, 2));
await browser.close();
process.exit(fails.length ? 1 : 0);
