/**
 * Tour Factory — Playwright screenshot capture for manifest tours.
 * Run: npx tsx scripts/tour-capture.ts --tour=tour-home-overview
 * Dev server: http://127.0.0.1:5173
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { TOUR_MANIFEST } from '../src/config/tourManifest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = process.env.TOUR_BASE_URL ?? 'http://127.0.0.1:5173';
const outRoot = path.join(root, 'public', 'tours');

const args = process.argv.slice(2);
const tourArg = args.find((a) => a.startsWith('--tour='))?.split('=')[1];
const all = args.includes('--all');

const tours = all ? TOUR_MANIFEST : TOUR_MANIFEST.filter((t) => t.id === tourArg);

if (!tours.length) {
  console.error('Pass --tour=<id> or --all. Available:', TOUR_MANIFEST.map((t) => t.id).join(', '));
  process.exit(1);
}

async function captureTour(tour: (typeof TOUR_MANIFEST)[0]) {
  const dir = path.join(outRoot, tour.id);
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const manifest: Array<{ stepId: string; file: string; path: string }> = [];
  const highlights: Array<{ stepId: string; selector?: string; label?: string; x: number; y: number; width: number; height: number }> = [];

  for (let i = 0; i < tour.steps.length; i++) {
    const step = tour.steps[i];
    const url = step.path.startsWith('http') ? step.path : `${baseUrl}${step.path}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    if (step.waitMs) await page.waitForTimeout(step.waitMs);
    if (step.selector) {
      try {
        await page.locator(step.selector).first().scrollIntoViewIfNeeded({ timeout: 5000 });
        const box = await page.locator(step.selector).first().boundingBox();
        if (box) {
          highlights.push({
            stepId: step.id,
            selector: step.selector,
            label: step.highlightLabel ?? step.label,
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          });
          await page.evaluate((rect) => {
            const ring = document.createElement('div');
            ring.id = 'fc-tour-highlight-ring';
            ring.style.cssText = `position:fixed;left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;border:3px solid #34d399;box-shadow:0 0 0 9999px rgba(0,0,0,0.45);pointer-events:none;z-index:99999;border-radius:8px;animation:fc-pulse 1.2s ease-in-out infinite;`;
            const style = document.createElement('style');
            style.textContent = '@keyframes fc-pulse{0%,100%{opacity:1}50%{opacity:.65}}';
            document.head.appendChild(style);
            document.body.appendChild(ring);
            const tag = document.createElement('div');
            tag.textContent = `👆 ${rect.label}`;
            tag.style.cssText = `position:fixed;left:${rect.x}px;top:${Math.max(0, rect.y - 28)}px;background:#34d399;color:#000;font:bold 12px sans-serif;padding:4px 8px;border-radius:6px;z-index:100000;`;
            tag.id = 'fc-tour-highlight-label';
            document.body.appendChild(tag);
          }, { x: box.x, y: box.y, w: box.width, h: box.height, label: step.highlightLabel ?? step.label });
        }
      } catch {
        // selector optional during scaffold
      }
    }
    const file = `step-${String(i + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: path.join(dir, file), fullPage: false });
    await page.evaluate(() => {
      document.getElementById('fc-tour-highlight-ring')?.remove();
      document.getElementById('fc-tour-highlight-label')?.remove();
    });
    manifest.push({ stepId: step.id, file, path: step.path });
    console.log(`[tour-capture] ${tour.id} → ${file} (${step.path})`);
  }

  writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ tourId: tour.id, steps: manifest }, null, 2));
  writeFileSync(path.join(dir, 'highlights.json'), JSON.stringify({ tourId: tour.id, steps: highlights }, null, 2));
  await browser.close();
}

async function main() {
  console.log(`[tour-capture] Base URL: ${baseUrl}`);
  for (const tour of tours) {
    await captureTour(tour);
  }
  console.log('[tour-capture] Done. Next: narrate with Voice Studio, assemble with ffmpeg (see docs/TOUR-FACTORY.md).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
