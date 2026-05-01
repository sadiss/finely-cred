export type ScanPreset = 'original' | 'clean' | 'bw_crisp' | 'color_enhance';

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

  return canvas;
}

export async function renderScannedJpeg(blob: Blob, opts: RenderScanOptions): Promise<Blob> {
  const preset = opts.preset ?? 'clean';
  const rotateDeg = opts.rotateDeg ?? 0;
  const quality = typeof opts.quality === 'number' ? Math.max(0.6, Math.min(0.98, opts.quality)) : 0.92;

  const base = await decodeImageToCanvas(blob);
  const rotated = rotateCanvas(base, rotateDeg);
  const cropped = cropCanvas(rotated, opts.crop);
  const resized = resizeCanvas(cropped, opts.maxDimension ?? 2200);
  const outCanvas = preset === 'original' ? resized : applyPresetToCanvas(resized, preset);

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode image.'))),
      'image/jpeg',
      quality,
    );
  });
  return outBlob;
}

