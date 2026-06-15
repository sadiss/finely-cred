import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { captureCleanPng } from './capturePng';

async function nextFrame() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Render a React element into a temporary off-screen DOM node and capture it as a PNG.
 * This avoids capturing on-screen UI chrome/scrollbars and avoids white-on-white text
 * when the app UI is dark-themed.
 */
export async function captureReactElementPng(
  element: React.ReactElement,
  opts?: { pixelRatio?: number; widthPx?: number },
): Promise<string> {
  const host = document.createElement('div');
  host.setAttribute('data-no-capture-root', 'true');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = String(opts?.widthPx ?? 1100) + 'px';
  host.style.background = '#ffffff';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-1';
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    // Ensure the subtree exists before we attempt capture.
    flushSync(() => {
      root.render(element);
    });

    // Give fonts + layout a moment to resolve.
    try {
      await (document as any).fonts?.ready;
    } catch {
      // ignore
    }
    await nextFrame();
    await nextFrame();

    const target = (host.firstElementChild as HTMLElement | null) ?? host;
    return await captureCleanPng(target, { pixelRatio: opts?.pixelRatio });
  } finally {
    try {
      root.unmount();
    } catch {
      // ignore
    }
    host.remove();
  }
}

