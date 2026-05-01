import { toPng } from 'html-to-image';

/**
 * Generate a clean, print-friendly PNG capture from an on-screen element.
 * Goals:
 * - White background (avoid black screenshots in PDFs)
 * - No UI chrome (buttons/toolbars marked data-no-capture)
 * - No scrollbars / clipped content (expand overflow containers + max-height caps)
 */
export async function captureCleanPng(el: HTMLElement, opts?: { pixelRatio?: number }): Promise<string> {
  // NOTE: some html-to-image type definitions omit `onClone` even though runtime supports it.
  // We keep this strictly typed everywhere else and cast only the options object.
  const options: any = {
    cacheBust: true,
    pixelRatio: opts?.pixelRatio ?? 2,
    backgroundColor: '#ffffff',
    style: { background: '#ffffff', color: '#111111' },
    filter: (node: Node) => {
      const anyNode = node as any;
      const ds = anyNode?.dataset;
      if (ds?.noCapture === 'true') return false;
      return true;
    },
    onClone: (doc: Document, clonedNode: HTMLElement) => {
      const root = clonedNode as HTMLElement;

      // Force a print-safe “light” theme inside the clone to prevent black-on-black screenshots
      // when capturing dark-mode UI tables.
      try {
        const style = doc.createElement('style');
        style.setAttribute('data-capture-style', 'true');
        style.textContent = `
          *{box-sizing:border-box}
          html,body{background:#fff!important;color:#111!important}
          /* Make text readable even if the UI uses text-white */
          *, *::before, *::after{color:#111!important;text-shadow:none!important}
          /* Remove dark panel backgrounds that cause “black screenshots” */
          [class*="bg-black"], [class*="bg-[#0"], [class*="bg-slate"], [class*="bg-zinc"], [class*="bg-neutral"]{background:#fff!important;background-color:#fff!important}
          [class*="backdrop-blur"]{backdrop-filter:none!important}
          /* Tables should always be printable */
          table, thead, tbody, tfoot, tr, th, td{background:#fff!important;color:#111!important;border-color:#e5e7eb!important}
          th{font-weight:700!important}
          a{color:#0f766e!important}
        `.trim();
        doc.head.appendChild(style);
      } catch {
        // ignore
      }

      // Remove any explicitly marked chrome.
      root.querySelectorAll('[data-no-capture="true"]').forEach((n) => n.remove());

      // Expand scroll containers + remove max-height caps so tables render fully.
      const all = Array.from(root.querySelectorAll<HTMLElement>('*'));
      for (const n of all) {
        const cls = (n.className || '').toString();
        if (cls.includes('overflow-auto') || cls.includes('overflow-y-auto') || cls.includes('overflow-x-auto')) {
          n.style.overflow = 'visible';
          n.style.overflowX = 'visible';
          n.style.overflowY = 'visible';
        }
        if (cls.includes('max-h-') || cls.includes('max-h[') || cls.includes('max-h-[')) {
          n.style.maxHeight = 'none';
        }
        if (cls.includes('sticky')) {
          // Sticky headers often render oddly in captures; make them static.
          n.style.position = 'static';
          (n.style as any).top = 'auto';
        }
      }
    },
  };

  return await toPng(el, options);
}

