/**
 * Site scanner — walks scan targets like a video recorder.
 * Captures highlighted screenshots + optional screen recording with animated cursor.
 *
 * Run:
 *   npm run tour:scan              # screenshots only
 *   npm run tour:scan:video        # screenshots + demo.webm per target
 *   npm run tour:demos:full        # scan + assemble all demo MP4s
 */
import { existsSync, mkdirSync, readdirSync, copyFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chromium, type Page } from 'playwright';
import { SITE_SCAN_TARGETS, siteScanTargetToTourSteps } from '../src/config/tourSiteScanner';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = process.env.TOUR_BASE_URL ?? 'http://127.0.0.1:5173';
const outRoot = path.join(root, 'public', 'tours', 'site-scan');
const demosRoot = path.join(root, 'public', 'tours', 'demos');

const recordVideo = process.argv.includes('--video') || process.argv.includes('--record');

async function injectDemoChrome(page: Page, rect: { x: number; y: number; w: number; h: number; label: string }) {
  await page.evaluate((r) => {
    document.getElementById('fc-scan-ring')?.remove();
    document.getElementById('fc-scan-cursor')?.remove();
    document.getElementById('fc-scan-label')?.remove();
    document.getElementById('fc-scan-styles')?.remove();

    const style = document.createElement('style');
    style.id = 'fc-scan-styles';
    style.textContent = `
      @keyframes fc-cursor-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
      @keyframes fc-ring-pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
    `;
    document.head.appendChild(style);

    const ring = document.createElement('div');
    ring.id = 'fc-scan-ring';
    ring.style.cssText = `position:fixed;left:${r.x - 4}px;top:${r.y - 4}px;width:${r.w + 8}px;height:${r.h + 8}px;border:3px solid #39ff14;box-shadow:0 0 0 9999px rgba(0,0,0,0.52),0 0 24px rgba(57,255,20,0.45);z-index:99998;border-radius:10px;animation:fc-ring-pulse 1.4s ease-in-out infinite;pointer-events:none;`;
    document.body.appendChild(ring);

    const cx = r.x + r.w * 0.85;
    const cy = r.y + r.h * 0.55;
    const cursor = document.createElement('div');
    cursor.id = 'fc-scan-cursor';
    cursor.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 8-6 1-3 7-5-16z" fill="#fff" stroke="#111" stroke-width="1.2"/></svg>`;
    cursor.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;z-index:99999;pointer-events:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.65));animation:fc-cursor-pulse 1.2s ease-in-out infinite;`;
    document.body.appendChild(cursor);

    const label = document.createElement('div');
    label.id = 'fc-scan-label';
    label.textContent = r.label;
    label.style.cssText = `position:fixed;left:${Math.max(8, r.x)}px;top:${Math.max(8, r.y - 34)}px;background:linear-gradient(135deg,#39ff14,#22c55e);color:#000;font:bold 12px Inter,sans-serif;padding:6px 10px;border-radius:8px;z-index:100000;box-shadow:0 8px 24px rgba(57,255,20,0.35);`;
    document.body.appendChild(label);
  }, { x: rect.x, y: rect.y, w: rect.w, h: rect.h, label: rect.label });
}

async function clearDemoChrome(page: Page) {
  await page.evaluate(() => {
    document.getElementById('fc-scan-ring')?.remove();
    document.getElementById('fc-scan-cursor')?.remove();
    document.getElementById('fc-scan-label')?.remove();
  });
}

function convertWebmToMp4(webmPath: string, mp4Path: string) {
  if (!existsSync(webmPath)) return false;
  const r = spawnSync('ffmpeg', ['-y', '-i', webmPath, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4Path], {
    stdio: 'inherit',
  });
  return r.status === 0;
}

async function scanTarget(target: (typeof SITE_SCAN_TARGETS)[0]) {
  const dir = path.join(outRoot, target.id);
  mkdirSync(dir, { recursive: true });
  mkdirSync(demosRoot, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const videoDir = path.join(dir, 'raw-video');
  if (recordVideo) mkdirSync(videoDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: recordVideo ? { dir: videoDir, size: { width: 1280, height: 800 } } : undefined,
  });
  const page = await context.newPage();
  const steps = siteScanTargetToTourSteps(target);
  const highlights: unknown[] = [];
  const manifest: unknown[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const url = `${baseUrl}${target.path}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 });
    await page.waitForTimeout(step.waitMs ?? 900);

    try {
      const loc = page.locator(step.selector!).first();
      await loc.scrollIntoViewIfNeeded({ timeout: 8000 });
      const box = await loc.boundingBox();
      if (box) {
        highlights.push({ stepId: step.id, selector: step.selector, label: step.highlightLabel, ...box });
        await injectDemoChrome(page, {
          x: box.x,
          y: box.y,
          w: box.width,
          h: box.height,
          label: step.highlightLabel ?? step.label,
        });
        await page.waitForTimeout(recordVideo ? 2800 : 400);
        try {
          await loc.hover({ timeout: 2000 });
          await page.waitForTimeout(recordVideo ? 600 : 200);
        } catch {
          /* hover optional */
        }
      }
    } catch {
      /* selector optional */
    }

    const file = `step-${String(i + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: path.join(dir, file) });
    await clearDemoChrome(page);
    manifest.push({ stepId: step.id, file, path: target.path, label: step.label, narration: step.narrationPlain });
    console.log(`[tour-scan] ${target.id} → ${file}${recordVideo ? ' (recording)' : ''}`);
  }

  await context.close();
  await browser.close();

  writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ targetId: target.id, title: target.title, steps: manifest }, null, 2));
  writeFileSync(path.join(dir, 'highlights.json'), JSON.stringify({ tourId: target.id, steps: highlights }, null, 2));

  if (recordVideo) {
    const webmFiles = existsSync(videoDir) ? readdirSync(videoDir).filter((f) => f.endsWith('.webm')) : [];
    if (webmFiles.length) {
      const webmPath = path.join(videoDir, webmFiles[webmFiles.length - 1]!);
      const targetWebm = path.join(dir, 'demo.webm');
      const targetMp4 = path.join(demosRoot, `${target.id}.mp4`);
      try {
        copyFileSync(webmPath, targetWebm);
        if (convertWebmToMp4(targetWebm, targetMp4)) {
          console.log(`[tour-scan] Video → ${targetMp4}`);
        } else {
          console.log(`[tour-scan] Video → ${targetWebm} (install ffmpeg for MP4)`);
        }
      } catch (e) {
        console.warn('[tour-scan] Video save failed', e);
      }
    }
  }
}

async function assembleSlideshowMp4(targetId: string, stepCount: number) {
  const dir = path.join(outRoot, targetId);
  const lines: string[] = [];
  for (let i = 1; i <= stepCount; i++) {
    const png = path.join(dir, `step-${String(i).padStart(2, '0')}.png`);
    if (!existsSync(png)) continue;
    const seg = path.join(dir, `seg-${String(i).padStart(2, '0')}.mp4`);
    const r = spawnSync(
      'ffmpeg',
      ['-y', '-loop', '1', '-i', png, '-c:v', 'libx264', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-t', '3.5', seg],
      { stdio: 'pipe' },
    );
    if (r.status === 0) lines.push(`file '${seg.replace(/\\/g, '/')}'`);
  }
  if (!lines.length) return;
  const listPath = path.join(dir, 'ffmpeg-concat.txt');
  writeFileSync(listPath, lines.join('\n'));
  const outMp4 = path.join(demosRoot, `${targetId}-slides.mp4`);
  spawnSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outMp4], { stdio: 'inherit' });
  console.log(`[tour-scan] Slideshow → ${outMp4}`);
}

async function main() {
  const assemble = process.argv.includes('--assemble');
  console.log(`[tour-scan] Base URL: ${baseUrl} · ${SITE_SCAN_TARGETS.length} targets · video=${recordVideo}`);
  mkdirSync(outRoot, { recursive: true });
  mkdirSync(demosRoot, { recursive: true });

  for (const t of SITE_SCAN_TARGETS) {
    await scanTarget(t);
    if (assemble) {
      const steps = siteScanTargetToTourSteps(t);
      await assembleSlideshowMp4(t.id, steps.length);
    }
  }

  const index = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    recordVideo,
    output: {
      screenshots: 'public/tours/site-scan/{target-id}/step-NN.png',
      demos: 'public/tours/demos/{target-id}.mp4',
      slideshows: 'public/tours/demos/{target-id}-slides.mp4',
      marketing: 'public/media/',
    },
    targets: SITE_SCAN_TARGETS.map((t) => ({
      id: t.id,
      title: t.title,
      path: t.path,
      demoUrl: `/tours/demos/${t.id}.mp4`,
    })),
  };
  writeFileSync(path.join(outRoot, 'index.json'), JSON.stringify(index, null, 2));
  writeFileSync(path.join(demosRoot, 'index.json'), JSON.stringify(index, null, 2));
  console.log('[tour-scan] Done.');
  console.log('[tour-scan] Screenshots: public/tours/site-scan/');
  console.log('[tour-scan] Demo videos:  public/tours/demos/');
  console.log('[tour-scan] Admin UI:      /admin/tour-studio');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
