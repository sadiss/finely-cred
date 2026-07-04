import sharp from 'sharp';

const SRC =
  'C:/Users/stlou/.cursor/projects/e-Finely-Cred/assets/c__Users_stlou_AppData_Roaming_Cursor_User_workspaceStorage_d7bfcfc657fce481bfd25c69b5fe9b14_images_Business_Credit-6f8ac76d-16c2-4b64-ab5e-de820d38e43a.png';
const OUT =
  'e:/Finely-Cred/Tishobe/finely-cred-main/public/images/lead-magnets/business-credit-power-guide-original-transparent.png';

function idx(w, x, y) {
  return y * w + x;
}

function isWarmPaper(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const warmth = r - b;
  if (warmth >= 12) return true;
  if (sat >= 14 && warmth >= 8) return true;
  if (sat >= 11 && warmth >= 10) return true;
  return false;
}

function isDarkContent(r, g, b) {
  return (r + g + b) / 3 < 58;
}

function isGoldContent(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min >= 20 && r > g && r > b;
}

function isProtected(r, g, b) {
  return isDarkContent(r, g, b) || isWarmPaper(r, g, b) || isGoldContent(r, g, b);
}

function isCheckerboard(r, g, b, a) {
  if (a < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const avg = (r + g + b) / 3;
  if (isProtected(r, g, b)) return false;
  if (sat <= 7 && avg >= 158) return true;
  if (sat <= 11 && avg >= 205) return true;
  return false;
}

function isDetachedNeutral(r, g, b) {
  if (isProtected(r, g, b)) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const avg = (r + g + b) / 3;
  if (sat <= 6 && avg >= 145) return true;
  if (sat <= 12 && avg >= 70 && avg <= 210) return true;
  return false;
}

function flood(w, h, ch, data, seedFn, growFn) {
  const seen = new Uint8Array(w * h);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = idx(w, x, y);
    if (seen[p]) return;
    const i = p * ch;
    if (!seedFn(data[i], data[i + 1], data[i + 2], data[i + 3], x, y)) return;
    seen[p] = 1;
    q.push(p);
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    const x = p % w;
    const y = (p / w) | 0;
    if (!growFn) {
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
      continue;
    }
    for (let yy = -1; yy <= 1; yy++) {
      for (let xx = -1; xx <= 1; xx++) {
        if (!xx && !yy) continue;
        const nx = x + xx;
        const ny = y + yy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const np = idx(w, nx, ny);
        if (seen[np]) continue;
        const i = np * ch;
        if (!growFn(data[i], data[i + 1], data[i + 2], data[i + 3], nx, ny)) continue;
        seen[np] = 1;
        q.push(np);
      }
    }
  }
  return seen;
}

function nearProtected(w, h, ch, data, x, y, radius = 2) {
  for (let yy = -radius; yy <= radius; yy++) {
    for (let xx = -radius; xx <= radius; xx++) {
      const nx = x + xx;
      const ny = y + yy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const i = idx(w, nx, ny) * ch;
      if (data[i + 3] === 0) continue;
      if (isProtected(data[i], data[i + 1], data[i + 2])) return true;
    }
  }
  return false;
}

const { data: srcData, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;
const ch = info.channels;
const outData = Buffer.from(srcData);

const removedBg = flood(w, h, ch, outData, isCheckerboard);
for (let p = 0; p < removedBg.length; p++) {
  if (removedBg[p]) outData[p * ch + 3] = 0;
}

let detachedTotal = 0;
for (let pass = 0; pass < 8; pass++) {
  const q = [];
  const kill = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = idx(w, x, y);
      const i = p * ch;
      if (outData[i + 3] === 0) {
        for (let yy = -1; yy <= 1; yy++) {
          for (let xx = -1; xx <= 1; xx++) {
            const nx = x + xx;
            const ny = y + yy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const np = idx(w, nx, ny);
            if (kill[np] || outData[np * ch + 3] === 0) continue;
            const ni = np * ch;
            const r = outData[ni];
            const g = outData[ni + 1];
            const b = outData[ni + 2];
            if (!isDetachedNeutral(r, g, b)) continue;
            if (nearProtected(w, h, ch, outData, nx, ny, 2)) continue;
            kill[np] = 1;
            q.push(np);
          }
        }
      }
    }
  }

  for (const p of q) {
    const x = p % w;
    const y = (p / w) | 0;
    const stack = [p];
    const comp = [];
    const local = new Uint8Array(w * h);
    local[p] = 1;
    while (stack.length) {
      const cp = stack.pop();
      comp.push(cp);
      const cx = cp % w;
      const cy = (cp / w) | 0;
      for (let yy = -1; yy <= 1; yy++) {
        for (let xx = -1; xx <= 1; xx++) {
          const nx = cx + xx;
          const ny = cy + yy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const np = idx(w, nx, ny);
          if (!kill[np] || local[np] || outData[np * ch + 3] === 0) continue;
          if (nearProtected(w, h, ch, outData, nx, ny, 1)) continue;
          local[np] = 1;
          stack.push(np);
        }
      }
    }
    for (const cp of comp) outData[cp * ch + 3] = 0;
    detachedTotal += comp.length;
  }
  if (!q.length) break;
}

await sharp(outData, { raw: { width: w, height: h, channels: ch } })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`wrote ${OUT}; removedBg=${removedBg.reduce((a, v) => a + v, 0)} detached=${detachedTotal}`);
