/**
 * Downloads real portrait photos and applies subtle touch-ups (grade, sharpen, vignette)
 * so each agent looks like a real team member — not a cartoon or obvious stock tile.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { STAFF_ROSTER_SEED } from '../src/data/staffRoster';
import { effectivePortraitGender } from '../src/lib/staffPortrait';
import {
  STAFF_PORTRAIT_CATALOG,
  portraitFolderForGender,
  randomUserPortraitUrl,
  type StaffPortraitSource,
} from '../src/data/staffPortraitCatalog';

const OUT_DIR = path.join(process.cwd(), 'public', 'staff-portraits');

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

async function touchUpPortrait(buffer: Buffer, staffId: string, src: StaffPortraitSource): Promise<Buffer> {
  const seed = hashString(staffId);
  const warmShift = src.warmShift ?? (seed % 5);
  const saturation = src.saturation ?? 0.9 - (seed % 8) * 0.01;
  const brightness = 1.01 + (seed % 3) * 0.008;

  const vignette = Buffer.from(`
    <svg width="640" height="640">
      <defs>
        <radialGradient id="v" cx="50%" cy="40%" r="60%">
          <stop offset="50%" stop-color="white" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.2"/>
        </radialGradient>
      </defs>
      <rect width="640" height="640" fill="url(#v)"/>
    </svg>
  `);

  return sharp(buffer)
    .rotate()
    .resize(640, 640, { fit: 'cover', position: 'attention' })
    .modulate({ brightness, saturation, hue: warmShift })
    .gamma(1.04 + (seed % 4) * 0.01)
    .sharpen({ sigma: 0.55, m1: 0.45, m2: 0.3 })
    .composite([{ input: vignette, blend: 'multiply' }])
    .jpeg({ quality: 91, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  let fail = 0;

  for (const member of STAFF_ROSTER_SEED) {
    const src = STAFF_PORTRAIT_CATALOG[member.id];
    if (!src) {
      console.warn(`⚠ No catalog entry for ${member.id}`);
      fail += 1;
      continue;
    }

    const gender = effectivePortraitGender(member);
    const folder = portraitFolderForGender(gender);
    const outPath = path.join(OUT_DIR, `${member.id}.jpg`);

    try {
      const url = randomUserPortraitUrl(folder, src.portraitIndex);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'FinelyCred-StaffPortraitBuild/1.0' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = Buffer.from(await res.arrayBuffer());
      const touched = await touchUpPortrait(raw, member.id, src);
      fs.writeFileSync(outPath, touched);
      console.log(`✓ ${member.firstName} ${member.lastName} (${folder}/${src.portraitIndex}) → ${member.id}.jpg`);
      ok += 1;
    } catch (e) {
      console.error(`✗ ${member.id}:`, (e as Error).message);
      fail += 1;
    }
  }

  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith('.svg')) {
      fs.unlinkSync(path.join(OUT_DIR, f));
    }
  }

  console.log(`\nDone: ${ok} photo portraits, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main();
