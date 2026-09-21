import type { VirtualBackgroundId } from './meetingVideoQuality';

/** Procedural HD-style backgrounds (no cartoon assets). */
export function backgroundImageForId(id: VirtualBackgroundId): HTMLCanvasElement | null {
  if (id === 'none' || id === 'blur') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (id === 'finely_gradient') {
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, '#0f172a');
    g.addColorStop(0.45, '#1e1b4b');
    g.addColorStop(1, '#064e3b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.fillRect(0, canvas.height * 0.62, canvas.width, canvas.height * 0.38);
  } else if (id === 'finely_executive') {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#1a1f2e');
    g.addColorStop(1, '#0d1117');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 80; x < canvas.width; x += 120) {
      ctx.fillRect(x, 120, 8, canvas.height * 0.5);
    }
    ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.75, canvas.height * 0.35, 180, 120, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
    g.addColorStop(0, '#e8eef5');
    g.addColorStop(1, '#d4dce8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#c5cdd9';
    ctx.fillRect(0, canvas.height * 0.72, canvas.width, canvas.height * 0.28);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(80, canvas.height * 0.35, 420, 220);
    ctx.strokeStyle = 'rgba(15,23,42,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, canvas.height * 0.35, 420, 220);
  }

  return canvas;
}
