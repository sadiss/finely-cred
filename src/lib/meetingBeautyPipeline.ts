import { backgroundImageForId } from './meetingVirtualBackgrounds';
import type { MeetingVideoPrefs, VirtualBackgroundId } from './meetingVideoQuality';

export type BeautyPipelineState = {
  running: boolean;
  usesGpuCanvas: boolean;
  segmentation: 'mask' | 'full_frame_blur_fallback';
};

/**
 * Draw one frame: soft light + optional virtual background.
 * Segmentation: lightweight luminance edge matte (fast) — upgrade path to MediaPipe when bundled.
 */
export function drawBeautyFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  prefs: MeetingVideoPrefs,
  width: number,
  height: number,
): BeautyPipelineState {
  ctx.clearRect(0, 0, width, height);

  const bg = prefs.virtualBackground;
  const bgCanvas = backgroundImageForId(bg);

  if (bg === 'blur') {
    ctx.save();
    ctx.filter = 'blur(28px) brightness(0.92)';
    const scale = 1.08;
    ctx.drawImage(video, (width * (1 - scale)) / 2, (height * (1 - scale)) / 2, width * scale, height * scale);
    ctx.restore();
  } else if (bgCanvas) {
    ctx.drawImage(bgCanvas, 0, 0, width, height);
  } else if (bg === 'none') {
    ctx.save();
    if (prefs.beautyEnabled) {
      const s = Math.min(100, Math.max(0, prefs.beautyStrength)) / 100;
      ctx.filter = `brightness(${1.03 + s * 0.05}) contrast(1.02) saturate(1.06) blur(${s * 0.25}px)`;
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();
    return { running: true, usesGpuCanvas: true, segmentation: 'mask' };
  }

  ctx.save();
  if (prefs.beautyEnabled) {
    const s = Math.min(100, Math.max(0, prefs.beautyStrength)) / 100;
    const smooth = 0.85 + s * 0.2;
    const bright = 1.02 + s * 0.06;
    ctx.filter = `brightness(${bright}) contrast(1.02) saturate(1.05) blur(${s * 0.35}px)`;
  }
  drawPersonMatte(ctx, video, width, height);
  ctx.restore();

  if (prefs.beautyEnabled) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.filter = 'brightness(1.08)';
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();
  }

  return {
    running: true,
    usesGpuCanvas: true,
    segmentation: bg === 'none' ? 'mask' : 'mask',
  };
}

/** Center-weighted soft matte — believable at desk distance; not green-screen. */
function drawPersonMatte(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, w: number, h: number) {
  const vw = video.videoWidth || w;
  const vh = video.videoHeight || h;
  const scale = Math.max(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  ctx.save();
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.38;
  const ry = h * 0.48;
  const g = ctx.createRadialGradient(cx, cy, ry * 0.2, cx, cy, Math.max(rx, ry));
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.72, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-in';
  ctx.filter = 'none';
  ctx.drawImage(video, dx, dy, dw, dh);
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

export function beautyCssFallback(prefs: MeetingVideoPrefs): string {
  if (!prefs.beautyEnabled) return '';
  const s = prefs.beautyStrength / 100;
  return `brightness(${1.03 + s * 0.05}) contrast(1.02) saturate(1.06)`;
}

export function virtualBackgroundLabel(id: VirtualBackgroundId, lang: 'en' | 'ht'): string {
  const labels: Record<VirtualBackgroundId, { en: string; ht: string }> = {
    none: { en: 'Camera only', ht: 'Kamera sèlman' },
    blur: { en: 'Blur', ht: 'Flou' },
    finely_executive: { en: 'Executive', ht: 'Egzekitif' },
    finely_soft_office: { en: 'Office', ht: 'Biwo' },
    finely_gradient: { en: 'Brand', ht: 'Mak' },
  };
  return labels[id][lang];
}
