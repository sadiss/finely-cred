/**
 * Facebook-ready PNG for Haitian community kits.
 * Preserves designed color — do not route through captureCleanPng.
 */
import { toPng } from 'html-to-image';

export const HAITIAN_SOCIAL_SIZES = {
  post: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
} as const;

export type HaitianSocialFormat = keyof typeof HAITIAN_SOCIAL_SIZES;

export function haitianSocialFileName(kitId: string, format: HaitianSocialFormat): string {
  return `finely-cred-haitian-${kitId}-${format}.png`;
}

export function haitianKitCaptionText(captionEn?: string, captionHt?: string): string {
  return [captionEn?.trim(), captionHt?.trim()].filter(Boolean).join('\n\n');
}

export async function renderHaitianSocialPng(node: HTMLElement, format: HaitianSocialFormat): Promise<string> {
  const { width, height } = HAITIAN_SOCIAL_SIZES[format];
  return toPng(node, {
    cacheBust: true,
    pixelRatio: 1,
    width,
    height,
    backgroundColor: '#ffffff',
    style: {
      transform: 'none',
      width: `${width}px`,
      height: `${height}px`,
    },
  } as never);
}

export async function downloadHaitianSocialPng(
  node: HTMLElement,
  kitId: string,
  format: HaitianSocialFormat,
): Promise<void> {
  const dataUrl = await renderHaitianSocialPng(node, format);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = haitianSocialFileName(kitId, format);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function copyHaitianCaption(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.left = '-9999px';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      field.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export async function waitForHaitianSocialReady(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            }),
    ),
  );
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
