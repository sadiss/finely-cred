import { downloadBlob as downloadBlobUtil } from '../utils/download';
import type { MediaTransition } from '../domain/mediaStudio';

export function dataUrlToBlob(dataUrl: string): Blob {
  const s = String(dataUrl || '');
  const m = s.match(/^data:([^;]+);base64,(.+)$/);
  if (!m?.[1] || !m?.[2]) throw new Error('Invalid data URL');
  const mime = m[1];
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Back-compat export (used by Media Studio). */
export function downloadBlob(blob: Blob, filename: string) {
  downloadBlobUtil({ blob, filename });
}

export async function downloadDataUrl(dataUrl: string, filename: string) {
  const blob = dataUrlToBlob(dataUrl);
  downloadBlobUtil({ blob, filename });
}

export type VideoScene = {
  id: string;
  imageDataUrl: string;
  caption?: string;
  durationSec: number;
  transition?: MediaTransition;
};

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

type DrawCoverOpts = {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  sceneProgress?: number;
  kenBurns?: boolean;
};

function drawCover(
  ctx: CanvasRenderingContext2D,
  im: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  opts?: DrawCoverOpts,
) {
  const iw = im.naturalWidth || im.width;
  const ih = im.naturalHeight || im.height;
  let scale = Math.max(canvasW / iw, canvasH / ih);
  let offsetX = opts?.offsetX ?? 0;
  let offsetY = opts?.offsetY ?? 0;

  if (opts?.kenBurns && opts.sceneProgress != null) {
    const p = opts.sceneProgress;
    const kbScale = 1 + p * 0.1;
    scale *= kbScale;
    offsetX += (p - 0.5) * canvasW * 0.04;
    offsetY += (0.5 - p) * canvasH * 0.02;
  }

  if (opts?.scale != null) scale *= opts.scale;

  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (canvasW - dw) / 2 + offsetX;
  const dy = (canvasH - dh) / 2 + offsetY;
  ctx.drawImage(im, dx, dy, dw, dh);
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function transitionDurationSec(transition?: MediaTransition): number {
  if (!transition || transition.type === 'cut') return 0;
  return Math.max(0.1, Math.min(2.0, Number(transition.durationSec ?? 0.45)));
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  caption: string,
  width: number,
  height: number,
  style?: { enabled?: boolean; position?: 'bottom' | 'top'; backgroundOpacity?: number },
) {
  const text = (caption || '').trim();
  if (!text) return;
  if (style && style.enabled === false) return;

  const pad = Math.round(Math.min(width, height) * 0.04);
  const boxH = Math.round(height * 0.18);
  const x = pad;
  const position = style?.position === 'top' ? 'top' : 'bottom';
  const y = position === 'top' ? pad : height - boxH - pad;
  const w = width - pad * 2;
  const h = boxH;

  ctx.save();
  const bg = Math.max(0, Math.min(1, Number(style?.backgroundOpacity ?? 0.55)));
  ctx.fillStyle = `rgba(0,0,0,${bg.toFixed(3)})`;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const r = 18;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `600 ${Math.max(18, Math.round(height * 0.04))}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.textBaseline = 'middle';

  const words = text.split(/\s+/).slice(0, 60);
  const lines: string[] = [];
  let line = '';
  for (const w0 of words) {
    const test = line ? `${line} ${w0}` : w0;
    if (ctx.measureText(test).width > w - pad * 2) {
      if (line) lines.push(line);
      line = w0;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const maxLines = 3;
  const shown = lines.slice(0, maxLines);
  const lineH = Math.max(20, Math.round(height * 0.05));
  const startY = y + h / 2 - ((shown.length - 1) * lineH) / 2;
  shown.forEach((ln, idx) => ctx.fillText(ln, x + pad, startY + idx * lineH));
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grd = ctx.createLinearGradient(0, h * 0.55, 0, h);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);
}

type TransitionDrawArgs = {
  ctx: CanvasRenderingContext2D;
  canvasW: number;
  canvasH: number;
  currentImg: HTMLImageElement;
  nextImg: HTMLImageElement | null;
  transition: MediaTransition | undefined;
  t: number;
  sceneProgress: number;
};

function drawSceneFrame(args: TransitionDrawArgs) {
  const { ctx, canvasW, canvasH, currentImg, nextImg, transition, t, sceneProgress } = args;
  const type = transition?.type ?? 'cut';
  const kenBurnsInScene = type === 'ken_burns';

  ctx.fillStyle = '#0b1110';
  ctx.fillRect(0, 0, canvasW, canvasH);

  if (!nextImg || t <= 0 || type === 'cut') {
    drawCover(ctx, currentImg, canvasW, canvasH, {
      sceneProgress,
      kenBurns: kenBurnsInScene,
    });
    return;
  }

  const eased = type === 'dissolve' ? easeInOut(t) : t;
  const zoomDir = transition?.zoom === 'out' ? 'out' : 'in';

  if (type === 'fade' || type === 'dissolve') {
    ctx.save();
    ctx.globalAlpha = 1 - eased;
    drawCover(ctx, currentImg, canvasW, canvasH, { sceneProgress });
    ctx.globalAlpha = eased;
    drawCover(ctx, nextImg, canvasW, canvasH);
    ctx.restore();
    return;
  }

  if (type === 'wipe') {
    drawCover(ctx, currentImg, canvasW, canvasH, { sceneProgress });
    const dir = transition?.direction ?? 'left';
    ctx.save();
    ctx.beginPath();
    if (dir === 'left') ctx.rect(canvasW * (1 - eased), 0, canvasW * eased, canvasH);
    else if (dir === 'right') ctx.rect(0, 0, canvasW * eased, canvasH);
    else if (dir === 'up') ctx.rect(0, canvasH * (1 - eased), canvasW, canvasH * eased);
    else ctx.rect(0, 0, canvasW, canvasH * eased);
    ctx.clip();
    drawCover(ctx, nextImg, canvasW, canvasH);
    ctx.restore();
    return;
  }

  if (type === 'zoom') {
    const outScale = zoomDir === 'in' ? 1 + eased * 0.15 : 1 - eased * 0.08;
    const inScale = zoomDir === 'in' ? 0.88 + eased * 0.12 : 1.12 - eased * 0.12;
    ctx.save();
    ctx.globalAlpha = 1 - eased * 0.85;
    drawCover(ctx, currentImg, canvasW, canvasH, { scale: outScale, sceneProgress });
    ctx.globalAlpha = eased;
    drawCover(ctx, nextImg, canvasW, canvasH, { scale: inScale });
    ctx.restore();
    return;
  }

  if (type === 'ken_burns') {
    ctx.save();
    ctx.globalAlpha = 1 - eased * 0.35;
    drawCover(ctx, currentImg, canvasW, canvasH, { sceneProgress, kenBurns: true });
    ctx.globalAlpha = eased;
    drawCover(ctx, nextImg, canvasW, canvasH, { sceneProgress: eased, kenBurns: true });
    ctx.restore();
    return;
  }

  drawCover(ctx, currentImg, canvasW, canvasH, { sceneProgress, kenBurns: kenBurnsInScene });
}

export async function exportScenesToWebm(args: {
  scenes: VideoScene[];
  width: number;
  height: number;
  fps?: number;
  captionStyle?: { enabled?: boolean; position?: 'bottom' | 'top'; backgroundOpacity?: number };
  audioTracks?: Array<{ blob: Blob; volume?: number; startSec?: number; endSec?: number }>;
}): Promise<Blob> {
  const fps = Math.max(10, Math.min(60, Math.round(args.fps ?? 30)));
  const scenes = args.scenes.filter((s) => s.imageDataUrl && s.durationSec > 0);
  if (!scenes.length) throw new Error('No scenes to export.');

  const canvas = document.createElement('canvas');
  canvas.width = args.width;
  canvas.height = args.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported.');

  const videoStream = canvas.captureStream(fps);

  let stream: MediaStream = videoStream;
  if (args.audioTracks && args.audioTracks.length) {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const audioCtx: AudioContext = new AudioCtx();
      const dest = audioCtx.createMediaStreamDestination();
      const tracks = args.audioTracks.slice(0, 6);

      for (const t of tracks) {
        const vol = Math.max(0, Math.min(1, Number(t.volume ?? 0.35)));
        const startSec = t.startSec != null ? Math.max(0, Number(t.startSec) || 0) : 0;
        const endSec = t.endSec != null ? Math.max(0, Number(t.endSec) || 0) : undefined;

        // eslint-disable-next-line no-await-in-loop
        const buf = await t.blob.arrayBuffer();
        // eslint-disable-next-line no-await-in-loop
        const decoded = await audioCtx.decodeAudioData(buf.slice(0));
        const src = audioCtx.createBufferSource();
        src.buffer = decoded;
        const gain = audioCtx.createGain();
        gain.gain.value = vol;
        src.connect(gain);
        gain.connect(dest);
        src.start(audioCtx.currentTime + startSec);
        if (endSec != null && endSec > startSec) {
          src.stop(audioCtx.currentTime + endSec);
        }
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        audioCtx.resume?.();
      } catch {
        // ignore
      }

      stream = new MediaStream([...videoStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
    }
  }
  const mimeCandidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const mimeType = mimeCandidates.find((m) => (window as any).MediaRecorder?.isTypeSupported?.(m)) || 'video/webm';
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const tickMs = Math.round(1000 / fps);
  const started = new Promise<void>((resolve) => (rec.onstart = () => resolve()));
  rec.start(250);
  await started;

  const imageCache = new Map<string, HTMLImageElement>();
  async function getImg(dataUrl: string) {
    let img = imageCache.get(dataUrl);
    if (!img) {
      img = await loadImage(dataUrl);
      imageCache.set(dataUrl, img);
    }
    return img;
  }

  for (let si = 0; si < scenes.length; si++) {
    const scene = scenes[si]!;
    const img = await getImg(scene.imageDataUrl);
    const next = scenes[si + 1] ?? null;
    const nextImg = next ? await getImg(next.imageDataUrl) : null;
    const transition = scene.transition;
    const transType = transition?.type ?? 'cut';
    const needsNext = transType !== 'cut' && nextImg != null;
    const frames = Math.max(1, Math.round(scene.durationSec * fps));
    const fadeSec = needsNext ? transitionDurationSec(transition) : 0;
    const fadeFrames = fadeSec ? Math.max(1, Math.round(fadeSec * fps)) : 0;

    for (let f = 0; f < frames; f++) {
      const sceneProgress = frames <= 1 ? 0 : f / (frames - 1);
      const inTransition = Boolean(needsNext && fadeFrames > 0 && f >= Math.max(0, frames - fadeFrames));
      const t = inTransition ? Math.max(0, Math.min(1, (f - (frames - fadeFrames)) / fadeFrames)) : 0;

      drawSceneFrame({
        ctx,
        canvasW: canvas.width,
        canvasH: canvas.height,
        currentImg: img,
        nextImg: inTransition ? nextImg : null,
        transition,
        t,
        sceneProgress,
      });

      drawVignette(ctx, canvas.width, canvas.height);
      drawCaption(ctx, scene.caption || '', canvas.width, canvas.height, args.captionStyle);

      await new Promise((r) => setTimeout(r, tickMs));
    }
  }

  const stopped = new Promise<void>((resolve) => (rec.onstop = () => resolve()));
  rec.stop();
  await stopped;

  return new Blob(chunks, { type: mimeType });
}
