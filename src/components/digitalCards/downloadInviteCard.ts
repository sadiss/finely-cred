/**
 * PNG export for digital invite cards.
 *
 * Distinct from `src/utils/capturePng.ts`, which forces a white, print-safe
 * theme for documents. Invite cards must export exactly as designed — dark ink,
 * foil gradients, gloss — so this path preserves colour and captures the card
 * at its full design resolution regardless of the preview scale on screen.
 */
import { toBlob, toPng } from 'html-to-image';
import { digitalInviteFileStem, getDigitalInviteDesign } from '../../config/digitalInviteCardDesign';
import type { DigitalInviteCardRole } from '../../config/digitalInviteCards';

export interface InviteCaptureOptions {
  /** Output multiplier over the design canvas. 2 gives 2240x1400 for a placard. */
  pixelRatio?: number;
}

function captureOptions(role: DigitalInviteCardRole, opts: InviteCaptureOptions = {}) {
  const design = getDigitalInviteDesign(role);
  return {
    cacheBust: true,
    pixelRatio: opts.pixelRatio ?? 2,
    width: design.width,
    height: design.height,
    // The preview shrinks the card with a CSS transform; neutralise it so the
    // export is always full design resolution.
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
      width: `${design.width}px`,
      height: `${design.height}px`,
    },
    filter: (node: Node) => (node as HTMLElement)?.dataset?.noCapture !== 'true',
  };
}

/** Freeze hover animations so the exported frame is deterministic. */
async function withStaticCard<T>(node: HTMLElement, run: () => Promise<T>): Promise<T> {
  node.setAttribute('data-fcdc-capture', 'true');
  try {
    return await run();
  } finally {
    node.removeAttribute('data-fcdc-capture');
  }
}

export function inviteCardFileName(role: DigitalInviteCardRole, ext: 'png' = 'png'): string {
  return `${digitalInviteFileStem(role)}.${ext}`;
}

/** Render the card node to a PNG data URL at full design resolution. */
export async function renderInviteCardPng(
  node: HTMLElement,
  role: DigitalInviteCardRole,
  opts: InviteCaptureOptions = {},
): Promise<string> {
  return withStaticCard(node, () => toPng(node, captureOptions(role, opts) as never));
}

/** Trigger a browser download of the card as a PNG. */
export async function downloadInviteCardPng(
  node: HTMLElement,
  role: DigitalInviteCardRole,
  opts: InviteCaptureOptions = {},
): Promise<void> {
  const dataUrl = await renderInviteCardPng(node, role, opts);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = inviteCardFileName(role);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** True when this browser can share a PNG file through the native share sheet. */
export function canShareInviteCardImage(): boolean {
  if (typeof navigator === 'undefined' || !('canShare' in navigator)) return false;
  try {
    const probe = new File([new Blob([''], { type: 'image/png' })], 'probe.png', { type: 'image/png' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/**
 * Share the card image through the OS share sheet when available. Returns false
 * when sharing is unsupported or dismissed so callers can fall back to download.
 */
export async function shareInviteCardImage(
  node: HTMLElement,
  role: DigitalInviteCardRole,
  payload: { title: string; text: string; url: string },
  opts: InviteCaptureOptions = {},
): Promise<boolean> {
  if (!canShareInviteCardImage()) return false;
  const blob = await withStaticCard(node, () => toBlob(node, captureOptions(role, opts) as never));
  if (!blob) return false;
  const file = new File([blob], inviteCardFileName(role), { type: 'image/png' });
  if (!navigator.canShare({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: payload.title, text: payload.text, url: payload.url });
    return true;
  } catch {
    return false;
  }
}

/** Copy the invite link to the clipboard. Returns false if the browser blocks it. */
export async function copyInviteLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
