/**
 * Which rule actually wins on the hub KPI tile, and where the preview scope attribute lives.
 *   node scripts/probe-kpi.mjs portal/documents
 */
import { chromium } from '@playwright/test';

const target = process.argv[2] || 'portal/documents';
const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto(`${base}/preview/workspace-light/${target}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForTimeout(5000);

const out = await page.evaluate(() => {
  const scopeHost = document.querySelector('[data-fc-workspace-light-preview]');
  const kpi = document.querySelector('.fc-wl-kpi');
  const hub = document.querySelector('.fc-wl-hub-shell');
  const describe = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      cls: el.className.toString().slice(0, 130),
      accentAttr: el.getAttribute('data-fc-accent'),
      bgColor: cs.backgroundColor,
      bgImage: cs.backgroundImage.slice(0, 160),
      borderTop: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      color: cs.color,
    };
  };
  return {
    scopeHostTag: scopeHost ? scopeHost.tagName : null,
    scopeHostIsHtml: scopeHost === document.documentElement,
    htmlAttrs: [...document.documentElement.attributes].map((a) => a.name),
    kpi: describe(kpi),
    kpiLabel: kpi ? describe(kpi.querySelector('.fc-wl-kpi-label')) : null,
    hub: describe(hub),
  };
});

console.log(JSON.stringify(out, null, 2));
await browser.close();
