/**
 * Element-level QA screenshots for the workspace product preview.
 *
 * Full-page captures are too coarse to judge a single widget, and `npx playwright screenshot`
 * cannot clip to a selector. Usage:
 *
 *   node scripts/shot-element.mjs <route> <selector> <out.png> [viewportWidth]
 *
 * Example:
 *   node scripts/shot-element.mjs /preview/workspace-light/portal/build ".fc-wlp-arch-metrics-jewel" jewel.png
 */
import { chromium } from '@playwright/test';

const [, , route, selector, out, widthArg] = process.argv;

if (!route || !selector || !out) {
  console.error('usage: node scripts/shot-element.mjs <route> <selector> <out.png> [viewportWidth]');
  process.exit(1);
}

const width = Number(widthArg) || 1440;
const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 1000 } });

try {
  await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const target = page.locator(selector).first();
  await target.waitFor({ state: 'visible', timeout: 30_000 });
  // Let entrance animations and count-up numbers settle before capturing.
  await page.waitForTimeout(2500);
  await target.screenshot({ path: out });
  const box = await target.boundingBox();
  console.log(`captured ${out} — ${Math.round(box?.width ?? 0)}x${Math.round(box?.height ?? 0)} at ${width}px viewport`);
} finally {
  await browser.close();
}
