/**
 * Why the capture panel / action buttons on Documents are still neutral.
 *   node scripts/probe-capture.mjs
 */
import { chromium } from '@playwright/test';

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto(`${base}/preview/workspace-light/portal/documents`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForTimeout(5000);

const out = await page.evaluate(() => {
  const describe = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, missing: true };
    const cs = getComputedStyle(el);
    return {
      sel,
      cls: el.className.toString().slice(0, 100),
      accentVar: cs.getPropertyValue('--fc-capture-accent').trim(),
      inkVar: cs.getPropertyValue('--fc-capture-accent-ink').trim(),
      border: `${cs.borderTopWidth} ${cs.borderTopColor}`,
      bgColor: cs.backgroundColor,
      bgImage: cs.backgroundImage.slice(0, 110),
    };
  };
  return {
    hasCaptureRoot: !!document.querySelector('[data-fc-evidence-capture]'),
    captureRootAttrs: document.querySelector('[data-fc-evidence-capture]')
      ? [...document.querySelector('[data-fc-evidence-capture]').attributes].map((a) => `${a.name}=${a.value}`.slice(0, 60))
      : null,
    panel: describe('.fc-capture-panel'),
    group: describe('.fc-capture-group'),
    actionBtn: describe('.fc-capture-action-btn'),
    chip: describe('.fc-capture-chip'),
    tab: describe('[data-fc-hub-tab]:not([aria-selected="true"])'),
  };
});

console.log(JSON.stringify(out, null, 2));
await browser.close();
