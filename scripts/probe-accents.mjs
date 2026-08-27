/**
 * Forensics: for the named washed-out pages, report the theme scope in play and
 * the ACTUAL computed border/background of each accent box, so we can tell
 * which stylesheet rule is winning instead of guessing from source.
 *
 *   node scripts/probe-accents.mjs portal/checklist
 */
import { chromium } from '@playwright/test';

const target = process.argv[2] || 'portal/checklist';
const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto(`${base}/preview/workspace-light/${target}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForTimeout(6000);

const out = await page.evaluate(() => {
  const html = document.documentElement;
  const scope = {
    dataFcTheme: html.getAttribute('data-fc-theme'),
    htmlClass: html.className,
    bodyClass: document.body.className,
    shellAttrs: [...document.querySelectorAll('[data-fc-theme],[data-wlp-scope],[data-fc-contrast-band]')]
      .slice(0, 6)
      .map((el) => el.tagName + ' ' + el.className.toString().slice(0, 70)),
  };

  const boxes = [];
  const els = document.querySelectorAll('.fc-accent-card, .fc-wlp-panel, .fc-wlp-metric, [data-accent]');
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width < 140 || r.height < 55) continue;
    const cs = getComputedStyle(el);
    boxes.push({
      cls: el.className.toString().replace(/\s+/g, ' ').slice(0, 110),
      accent: el.getAttribute('data-accent') || el.getAttribute('data-fc-accent') || '',
      borderW: cs.borderTopWidth,
      borderColor: cs.borderTopColor,
      bgColor: cs.backgroundColor,
      bgImage: cs.backgroundImage.slice(0, 120),
      pad: cs.padding,
    });
    if (boxes.length >= 14) break;
  }
  return { scope, boxes };
});

console.log(JSON.stringify(out, null, 2));
await browser.close();
