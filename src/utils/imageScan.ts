export type ScanPreset = 'original' | 'clean' | 'bw_crisp' | 'color_enhance' | 'document_scan' | 'id_card_enhance';

export type DocScanProfile = 'general' | 'id_card' | 'ssn_card' | 'bureau_mail' | 'creditor_letter';

export type CropMargins = {
  /** 0..1 fraction from left */
  left: number;
  /** 0..1 fraction from top */
  top: number;
  /** 0..1 fraction from right */
  right: number;
  /** 0..1 fraction from bottom */
  bottom: number;
};

export type RenderScanOptions = {
  preset: ScanPreset;
  rotateDeg?: 0 | 90 | 180 | 270;
  crop?: CropMargins;
  /** 0..1 JPEG quality */
  quality?: number;
  /** Optional max output dimension (long edge) */
  maxDimension?: number;
};

function clamp01(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function clampInt(v: number, min: number, max: number) {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.round(v)));
}

async function decodeImageToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  // Prefer createImageBitmap when available.
  const anyGlobal: any = globalThis as any;
  if (anyGlobal?.createImageBitmap) {
    const bmp: ImageBitmap = await anyGlobal.createImageBitmap(blob);
    const c = document.createElement('canvas');
    c.width = bmp.width;
    c.height = bmp.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable.');
    ctx.drawImage(bmp, 0, 0);
    return c;
  }

  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Failed to load image.'));
      i.src = url;
    });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable.');
    ctx.drawImage(img, 0, 0);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function rotateCanvas(src: HTMLCanvasElement, rotateDeg: 0 | 90 | 180 | 270): HTMLCanvasElement {
  if (rotateDeg === 0) return src;
  const out = document.createElement('canvas');
  const ctx = out.getContext('2d');
  if (!ctx) return src;

  if (rotateDeg === 90 || rotateDeg === 270) {
    out.width = src.height;
    out.height = src.width;
  } else {
    out.width = src.width;
    out.height = src.height;
  }

  ctx.save();
  if (rotateDeg === 90) {
    ctx.translate(out.width, 0);
    ctx.rotate(Math.PI / 2);
  } else if (rotateDeg === 180) {
    ctx.translate(out.width, out.height);
    ctx.rotate(Math.PI);
  } else if (rotateDeg === 270) {
    ctx.translate(0, out.height);
    ctx.rotate(-Math.PI / 2);
  }
  ctx.drawImage(src, 0, 0);
  ctx.restore();
  return out;
}

function cropCanvas(src: HTMLCanvasElement, crop: CropMargins | undefined): HTMLCanvasElement {
  if (!crop) return src;
  const left = clamp01(crop.left);
  const top = clamp01(crop.top);
  const right = clamp01(crop.right);
  const bottom = clamp01(crop.bottom);

  const x0 = clampInt(left * src.width, 0, src.width - 1);
  const y0 = clampInt(top * src.height, 0, src.height - 1);
  const x1 = clampInt(src.width - right * src.width, x0 + 1, src.width);
  const y1 = clampInt(src.height - bottom * src.height, y0 + 1, src.height);

  const w = Math.max(1, x1 - x0);
  const h = Math.max(1, y1 - y0);

  if (w === src.width && h === src.height) return src;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) return src;
  ctx.drawImage(src, x0, y0, w, h, 0, 0, w, h);
  return out;
}

function resizeCanvas(src: HTMLCanvasElement, maxDimension: number | undefined): HTMLCanvasElement {
  const md = maxDimension && Number.isFinite(maxDimension) ? Math.max(256, Math.round(maxDimension)) : 0;
  if (!md) return src;
  const longEdge = Math.max(src.width, src.height);
  if (longEdge <= md) return src;
  const scale = md / longEdge;
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(src.width * scale));
  out.height = Math.max(1, Math.round(src.height * scale));
  const ctx = out.getContext('2d');
  if (!ctx) return src;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, out.width, out.height);
  return out;
}

function applyPresetToCanvas(canvas: HTMLCanvasElement, preset: ScanPreset): HTMLCanvasElement {
  if (preset === 'original') return canvas;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  if (preset === 'clean') {
    const contrast = 1.35;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i]!;
      const g = d[i + 1]!;
      const b = d[i + 2]!;
      let v = 0.299 * r + 0.587 * g + 0.114 * b;
      v = (v - 128) * contrast + 128;
      v = v + 12;
      if (v > 235) v = 255;
      if (v < 20) v = 0;
      const out = Math.max(0, Math.min(255, Math.round(v)));
      d[i] = out;
      d[i + 1] = out;
      d[i + 2] = out;
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  if (preset === 'bw_crisp') {
    // Grayscale + adaptive-ish threshold (simple global threshold with light bias).
    // This creates crisp text on white background for OCR readability.
    let sum = 0;
    let count = 0;
    for (let i = 0; i < d.length; i += 4) {
      const v = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
      sum += v;
      count++;
    }
    const mean = count ? sum / count : 128;
    const threshold = Math.max(80, Math.min(210, mean + 12));
    for (let i = 0; i < d.length; i += 4) {
      const v = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
      const out = v >= threshold ? 255 : 0;
      d[i] = out;
      d[i + 1] = out;
      d[i + 2] = out;
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  if (preset === 'color_enhance') {
    // Mild contrast + vibrance to keep color stamps/highlights but still readable.
    const contrast = 1.18;
    const vibrance = 0.18;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i]!;
      let g = d[i + 1]!;
      let b = d[i + 2]!;

      // Contrast
      r = (r - 128) * contrast + 128;
      g = (g - 128) * contrast + 128;
      b = (b - 128) * contrast + 128;

      // Vibrance (boost less-saturated channels)
      const max = Math.max(r, g, b);
      const avg = (r + g + b) / 3;
      const amt = (max - avg) / 255;
      const boost = vibrance * (1 - amt);
      r = r + (r - avg) * boost;
      g = g + (g - avg) * boost;
      b = b + (b - avg) * boost;

      d[i] = Math.max(0, Math.min(255, Math.round(r)));
      d[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      d[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  if (preset === 'document_scan') {
    const contrast = 1.42;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i]!;
      const g = d[i + 1]!;
      const b = d[i + 2]!;
      let v = 0.299 * r + 0.587 * g + 0.114 * b;
      v = (v - 128) * contrast + 128;
      v = v + 18;
      if (v > 242) v = 255;
      if (v < 28) v = 0;
      const out = Math.max(0, Math.min(255, Math.round(v)));
      d[i] = out;
      d[i + 1] = out;
      d[i + 2] = out;
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  if (preset === 'id_card_enhance') {
    const contrast = 1.22;
    const vibrance = 0.22;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i]!;
      let g = d[i + 1]!;
      let b = d[i + 2]!;
      r = (r - 128) * contrast + 128;
      g = (g - 128) * contrast + 128;
      b = (b - 128) * contrast + 128;
      const max = Math.max(r, g, b);
      const avg = (r + g + b) / 3;
      const amt = (max - avg) / 255;
      const boost = vibrance * (1 - amt);
      r = r + (r - avg) * boost;
      g = g + (g - avg) * boost;
      b = b + (b - avg) * boost;
      d[i] = Math.max(0, Math.min(255, Math.round(r)));
      d[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      d[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  return canvas;
}

/** Auto-detect document edges — returns crop margins (0..1) with padding. */
export function detectDocumentCropMargins(canvas: HTMLCanvasElement, paddingPct = 0.02): CropMargins {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { left: 0, top: 0, right: 0, bottom: 0 };
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  const lumAt = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
  };

  const threshold = 210;
  const rowInk = (y: number) => {
    let ink = 0;
    const step = Math.max(1, Math.floor(w / 120));
    for (let x = 0; x < w; x += step) {
      if (lumAt(x, y) < threshold) ink++;
    }
    return ink;
  };
  const colInk = (x: number) => {
    let ink = 0;
    const step = Math.max(1, Math.floor(h / 120));
    for (let y = 0; y < h; y += step) {
      if (lumAt(x, y) < threshold) ink++;
    }
    return ink;
  };

  const minRowInk = Math.max(3, Math.floor(w / 120) * 0.04);
  const minColInk = Math.max(3, Math.floor(h / 120) * 0.04);

  let top = 0;
  let bottom = 0;
  let left = 0;
  let right = 0;

  for (let y = 0; y < h; y++) {
    if (rowInk(y) >= minRowInk) {
      top = y;
      break;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    if (rowInk(y) >= minRowInk) {
      bottom = h - 1 - y;
      break;
    }
  }
  for (let x = 0; x < w; x++) {
    if (colInk(x) >= minColInk) {
      left = x;
      break;
    }
  }
  for (let x = w - 1; x >= 0; x--) {
    if (colInk(x) >= minColInk) {
      right = w - 1 - x;
      break;
    }
  }

  const padX = Math.round(w * paddingPct);
  const padY = Math.round(h * paddingPct);
  top = Math.max(0, top - padY);
  bottom = Math.max(0, bottom - padY);
  left = Math.max(0, left - padX);
  right = Math.max(0, right - padX);

  return {
    left: clamp01(left / w),
    top: clamp01(top / h),
    right: clamp01(right / w),
    bottom: clamp01(bottom / h),
  };
}

function compositeOnWhitePaper(src: HTMLCanvasElement, marginPct = 0.06): HTMLCanvasElement {
  const margin = Math.max(24, Math.round(Math.max(src.width, src.height) * marginPct));
  const out = document.createElement('canvas');
  out.width = src.width + margin * 2;
  out.height = src.height + margin * 2;
  const ctx = out.getContext('2d');
  if (!ctx) return src;

  ctx.fillStyle = '#f8f9fb';
  ctx.fillRect(0, 0, out.width, out.height);

  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(margin + 6, margin + 8, src.width, src.height);

  ctx.drawImage(src, margin, margin);
  return out;
}

export type DocumentBounds = {
  crop: CropMargins;
  confidence: number;
};

/**
 * Advanced document bounds — center-weighted ink clustering for ID/SSN held in hand with background clutter.
 * Optionally snaps crop to target aspect ratio (e.g. ID card ~1.586).
 */
export function detectDocumentBoundsAdvanced(
  canvas: HTMLCanvasElement,
  opts?: { targetAspect?: number; paddingPct?: number; centerBias?: number },
): DocumentBounds {
  const paddingPct = opts?.paddingPct ?? 0.025;
  const centerBias = opts?.centerBias ?? 0.35;
  const targetAspect = opts?.targetAspect;

  const maxSample = 480;
  const scale = Math.min(1, maxSample / Math.max(canvas.width, canvas.height));
  const sw = Math.max(1, Math.round(canvas.width * scale));
  const sh = Math.max(1, Math.round(canvas.height * scale));
  const sample = document.createElement('canvas');
  sample.width = sw;
  sample.height = sh;
  const sctx = sample.getContext('2d');
  if (!sctx) return { crop: detectDocumentCropMargins(canvas, paddingPct), confidence: 0.3 };

  sctx.drawImage(canvas, 0, 0, sw, sh);
  const img = sctx.getImageData(0, 0, sw, sh);
  const d = img.data;

  const lum = (i: number) => 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;

  let bestScore = 0;
  let best = { x0: 0, y0: 0, x1: sw - 1, y1: sh - 1 };

  const grid = 24;
  const cellW = sw / grid;
  const cellH = sh / grid;
  const cells: number[][] = Array.from({ length: grid }, () => Array(grid).fill(0));

  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      const x0 = Math.floor(gx * cellW);
      const y0 = Math.floor(gy * cellH);
      const x1 = Math.min(sw - 1, Math.floor((gx + 1) * cellW));
      const y1 = Math.min(sh - 1, Math.floor((gy + 1) * cellH));
      let ink = 0;
      let samples = 0;
      const step = Math.max(1, Math.floor(Math.min(cellW, cellH) / 6));
      for (let y = y0; y <= y1; y += step) {
        for (let x = x0; x <= x1; x += step) {
          const i = (y * sw + x) * 4;
          if (lum(i) < 200) ink++;
          samples++;
        }
      }
      const density = samples ? ink / samples : 0;
      const dist = Math.hypot(gx + 0.5 - grid / 2, gy + 0.5 - grid / 2) / (grid / 2);
      const weight = 1 + centerBias * (1 - dist);
      cells[gy]![gx] = density * weight;
    }
  }

  const threshold = 0.08;
  let minGx = grid;
  let minGy = grid;
  let maxGx = 0;
  let maxGy = 0;
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      if ((cells[gy]![gx] ?? 0) < threshold) continue;
      minGx = Math.min(minGx, gx);
      minGy = Math.min(minGy, gy);
      maxGx = Math.max(maxGx, gx);
      maxGy = Math.max(maxGy, gy);
      bestScore += cells[gy]![gx] ?? 0;
    }
  }

  if (maxGx >= minGx && maxGy >= minGy) {
    best = {
      x0: Math.floor(minGx * cellW),
      y0: Math.floor(minGy * cellH),
      x1: Math.min(sw - 1, Math.ceil((maxGx + 1) * cellW)),
      y1: Math.min(sh - 1, Math.ceil((maxGy + 1) * cellH)),
    };
  }

  if (targetAspect && targetAspect > 0) {
    const bw = best.x1 - best.x0;
    const bh = best.y1 - best.y0;
    const current = bw / Math.max(1, bh);
    if (current > targetAspect) {
      const newH = bw / targetAspect;
      const midY = (best.y0 + best.y1) / 2;
      best.y0 = Math.max(0, Math.round(midY - newH / 2));
      best.y1 = Math.min(sh - 1, Math.round(midY + newH / 2));
    } else {
      const newW = bh * targetAspect;
      const midX = (best.x0 + best.x1) / 2;
      best.x0 = Math.max(0, Math.round(midX - newW / 2));
      best.x1 = Math.min(sw - 1, Math.round(midX + newW / 2));
    }
  }

  const padX = Math.round(sw * paddingPct);
  const padY = Math.round(sh * paddingPct);
  best.x0 = Math.max(0, best.x0 - padX);
  best.y0 = Math.max(0, best.y0 - padY);
  best.x1 = Math.min(sw - 1, best.x1 + padX);
  best.y1 = Math.min(sh - 1, best.y1 + padY);

  const invScale = 1 / scale;
  const crop: CropMargins = {
    left: clamp01((best.x0 * invScale) / canvas.width),
    top: clamp01((best.y0 * invScale) / canvas.height),
    right: clamp01((canvas.width - best.x1 * invScale) / canvas.width),
    bottom: clamp01((canvas.height - best.y1 * invScale) / canvas.height),
  };

  const confidence = Math.max(0, Math.min(1, bestScore / (grid * grid * 0.15)));
  return { crop, confidence };
}

/** Profile-specific aspect targets for tighter ID / SSN framing */
export function documentAspectForProfile(profile: DocScanProfile): number | undefined {
  if (profile === 'id_card') return 1.586;
  if (profile === 'ssn_card') return 1.55;
  if (profile === 'bureau_mail' || profile === 'creditor_letter') return 0.72;
  return undefined;
}

/** Centered guide frame crop — always visible in the live camera UI. */
export function guideCropForProfile(profile: DocScanProfile, width: number, height: number, fill = 0.88): CropMargins {
  const aspect = documentAspectForProfile(profile) ?? 1.586;
  const videoAspect = width / Math.max(1, height);
  let cropWFrac: number;
  let cropHFrac: number;
  if (videoAspect >= aspect) {
    cropHFrac = fill;
    cropWFrac = (cropHFrac * height * aspect) / Math.max(1, width);
  } else {
    cropWFrac = fill;
    cropHFrac = (cropWFrac * width / aspect) / Math.max(1, height);
  }
  cropWFrac = Math.min(0.94, Math.max(0.35, cropWFrac));
  cropHFrac = Math.min(0.94, Math.max(0.22, cropHFrac));
  const sideX = (1 - cropWFrac) / 2;
  const sideY = (1 - cropHFrac) / 2;
  return { left: sideX, top: sideY, right: sideX, bottom: sideY };
}

export function isFullFrameCrop(crop: CropMargins, tolerance = 0.03): boolean {
  return crop.left <= tolerance && crop.top <= tolerance && crop.right <= tolerance && crop.bottom <= tolerance;
}

/** Pick detected crop when confident; otherwise fall back to the on-screen guide frame. */
export function resolveCaptureCrop(
  profile: DocScanProfile,
  width: number,
  height: number,
  detected: DocumentBounds,
): CropMargins {
  const guide = guideCropForProfile(profile, width, height);
  if (detected.confidence >= 0.38 && !isFullFrameCrop(detected.crop)) return detected.crop;
  return guide;
}

export function scanPresetForProfile(profile: DocScanProfile): ScanPreset {
  if (profile === 'id_card' || profile === 'ssn_card') return 'id_card_enhance';
  if (profile === 'bureau_mail' || profile === 'creditor_letter') return 'document_scan';
  return 'document_scan';
}

export async function autoDetectDocumentCrop(blob: Blob): Promise<CropMargins> {
  const canvas = await decodeImageToCanvas(blob);
  return detectDocumentCropMargins(canvas);
}

export async function renderScannedJpeg(blob: Blob, opts: RenderScanOptions): Promise<Blob> {
  const preset = opts.preset ?? 'clean';
  const rotateDeg = opts.rotateDeg ?? 0;
  const quality = typeof opts.quality === 'number' ? Math.max(0.6, Math.min(0.98, opts.quality)) : 0.92;

  const base = await decodeImageToCanvas(blob);
  const rotated = rotateCanvas(base, rotateDeg);
  const cropped = cropCanvas(rotated, opts.crop);
  const resized = resizeCanvas(cropped, opts.maxDimension ?? 2200);
  let processed =
    preset === 'original'
      ? resized
      : preset === 'document_scan'
        ? applyPresetToCanvas(resized, 'document_scan')
        : applyPresetToCanvas(resized, preset);
  if (preset === 'document_scan') {
    processed = compositeOnWhitePaper(processed);
  }
  if (preset === 'id_card_enhance') {
    processed = compositeOnWhitePaper(processed, 0.04);
  }

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    processed.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode image.'))),
      'image/jpeg',
      quality,
    );
  });
  return outBlob;
}

