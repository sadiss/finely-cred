/**
 * Site scanner — walks scan targets like a video recorder, captures highlighted screenshots.
 * Run: npx tsx scripts/tour-site-scanner.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { SITE_SCAN_TARGETS, siteScanTargetToTourSteps } from '../src/config/tourSiteScanner';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = process.env.TOUR_BASE_URL ?? 'http://127.0.0.1:5173';
const outRoot = path.join(root, 'public', 'tours', 'site-scan');

async function scanTarget(target: (typeof SITE_SCAN_TARGETS)[0]) {
  const dir = path.join(outRoot, target.id);
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const steps = siteScanTargetToTourSteps(target);
  const highlights: unknown[] = [];
  const manifest: unknown[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const url = `${baseUrl}${target.path}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(step.waitMs ?? 800);
    try {
      const loc = page.locator(step.selector!).first();
      await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
      const box = await loc.boundingBox();
      if (box) {
        highlights.push({ stepId: step.id, selector: step.selector, label: step.highlightLabel, ...box });
        await page.evaluate(
          (rect) => {
            const ring = document.createElement('div');
            ring.style.cssText = `position:fixed;left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;border:3px solid #34d399;box-shadow:0 0 0 9999px rgba(0,0,0,0.45);z-index:99999;border-radius:8px;`;
            ring.id = 'fc-scan-ring';
            document.body.appendChild(ring);
          },
          { x: box.x, y: box.y, w: box.width, h: box.height },
        );
      }
    } catch {
      /* optional */
    }
    const file = `step-${String(i + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: path.join(dir, file) });
    await page.evaluate(() => document.getElementById('fc-scan-ring')?.remove());
    manifest.push({ stepId: step.id, file, path: target.path, label: step.label, narration: step.narrationPlain });
    console.log(`[tour-scan] ${target.id} → ${file}`);
  }

  writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ targetId: target.id, title: target.title, steps: manifest }, null, 2));
  writeFileSync(path.join(dir, 'highlights.json'), JSON.stringify({ tourId: target.id, steps: highlights }, null, 2));
  await browser.close();
}

async function main() {
  console.log(`[tour-scan] Base URL: ${baseUrl} · ${SITE_SCAN_TARGETS.length} targets`);
  mkdirSync(outRoot, { recursive: true });
  for (const t of SITE_SCAN_TARGETS) await scanTarget(t);
  writeFileSync(path.join(outRoot, 'index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), targets: SITE_SCAN_TARGETS.map((t) => t.id) }, null, 2));
  console.log('[tour-scan] Done. Preview under /tours/site-scan/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
