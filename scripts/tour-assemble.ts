/**
 * Tour Factory — assemble PNG steps + audio into MP4 via ffmpeg.
 * Run: npx tsx scripts/tour-assemble.ts --tour=tour-home-overview
 */
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { TOUR_MANIFEST } from '../src/config/tourManifest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const toursRoot = path.join(root, 'public', 'tours');

const args = process.argv.slice(2);
const tourArg = args.find((a) => a.startsWith('--tour='))?.split('=')[1];
const all = args.includes('--all');

function hasFfmpeg(): boolean {
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  return r.status === 0;
}

function assembleTour(tourId: string, stepCount: number) {
  const dir = path.join(toursRoot, tourId);
  if (!existsSync(dir)) {
    console.warn(`[tour-assemble] Skip ${tourId} — no capture folder`);
    return;
  }

  const listPath = path.join(dir, 'ffmpeg-concat.txt');
  const lines: string[] = [];

  for (let i = 1; i <= stepCount; i++) {
    const png = path.join(dir, `step-${String(i).padStart(2, '0')}.png`);
    const mp3 = path.join(dir, `step-${String(i).padStart(2, '0')}.mp3`);
    if (!existsSync(png)) continue;

    const seg = path.join(dir, `seg-${String(i).padStart(2, '0')}.mp4`);
    if (existsSync(mp3)) {
      const r = spawnSync(
        'ffmpeg',
        ['-y', '-loop', '1', '-i', png, '-i', mp3, '-c:v', 'libx264', '-tune', 'stillimage', '-c:a', 'aac', '-b:a', '192k', '-pix_fmt', 'yuv420p', '-shortest', seg],
        { stdio: 'inherit' },
      );
      if (r.status !== 0) throw new Error(`ffmpeg segment failed for step ${i}`);
    } else {
      const r = spawnSync(
        'ffmpeg',
        ['-y', '-loop', '1', '-i', png, '-c:v', 'libx264', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-t', '4', seg],
        { stdio: 'inherit' },
      );
      if (r.status !== 0) throw new Error(`ffmpeg still segment failed for step ${i}`);
    }
    lines.push(`file '${seg.replace(/\\/g, '/')}'`);
  }

  if (!lines.length) {
    console.warn(`[tour-assemble] No PNG steps for ${tourId}`);
    return;
  }

  writeFileSync(listPath, lines.join('\n'), 'utf8');

  const outMp4 = path.join(toursRoot, `${tourId}.mp4`);
  const concat = spawnSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outMp4], {
    stdio: 'inherit',
  });
  if (concat.status !== 0) throw new Error(`ffmpeg concat failed for ${tourId}`);
  console.log(`[tour-assemble] Wrote ${outMp4}`);
}

function main() {
  if (!hasFfmpeg()) {
    console.error('[tour-assemble] ffmpeg not found on PATH. Install ffmpeg and retry.');
    process.exit(1);
  }

  const tours = all ? TOUR_MANIFEST : TOUR_MANIFEST.filter((t) => t.id === tourArg);
  if (!tours.length) {
    console.error('Pass --tour=<id> or --all');
    process.exit(1);
  }

  for (const tour of tours) {
    assembleTour(tour.id, tour.steps.length);
  }
}

main();
