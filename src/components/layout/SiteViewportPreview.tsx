import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Monitor, Smartphone, Tablet, ExternalLink } from 'lucide-react';
import { useIsMobileOrTabletViewport } from '../../hooks/useMediaQuery';
import { inPreviewFrame } from '../../lib/inPreviewFrame';

export type SiteViewportMode = 'desktop' | 'tablet' | 'mobile';

const MODE_WIDTH: Record<Exclude<SiteViewportMode, 'desktop'>, number> = {
  mobile: 390,
  tablet: 768,
};

const STORAGE_KEY = 'finely:site-viewport-mode-v2';

type Props = {
  children: React.ReactNode;
};

/**
 * Site-wide phone / tablet / desktop preview for reviewers on a large screen.
 *
 * Framed modes render the live site inside an <iframe>, which gives the page a REAL
 * viewport at the chosen width — so CSS media queries / Tailwind breakpoints actually
 * fire (a plain max-width wrapper does not, because breakpoints track the window, not
 * the element). On real phones/tablets the site renders normally with no toolbar.
 */
export function SiteViewportPreview({ children }: Props) {
  const onRealCompactDevice = useIsMobileOrTabletViewport();
  const inIframe = useMemo(() => inPreviewFrame(), []);
  const [mode, setMode] = useState<SiteViewportMode>('desktop');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (onRealCompactDevice || inIframe) return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) as SiteViewportMode | null;
      if (saved === 'desktop' || saved === 'tablet' || saved === 'mobile') setMode(saved);
    } catch {
      /* ignore */
    }
  }, [onRealCompactDevice, inIframe]);

  useEffect(() => {
    if (onRealCompactDevice || inIframe) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode, onRealCompactDevice, inIframe]);

  // Inside the preview iframe, or on a genuine small device, render the real site only.
  if (inIframe || onRealCompactDevice) {
    return <div className="fc-site-root min-h-screen w-full overflow-x-clip">{children}</div>;
  }

  const framed = mode !== 'desktop';
  const frameWidth = framed ? MODE_WIDTH[mode] : undefined;
  const framePath =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : '/';

  // Hide the iframe's scrollbar so its inner viewport equals the device width exactly
  // (a desktop scrollbar would shave ~16px and drop the page below the breakpoint).
  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const doc = e.currentTarget.contentDocument;
      if (!doc) return;
      if (!doc.getElementById('fc-preview-scrollbar-hide')) {
        const style = doc.createElement('style');
        style.id = 'fc-preview-scrollbar-hide';
        style.textContent =
          'html{scrollbar-width:none;-ms-overflow-style:none;}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;width:0;height:0;}';
        doc.head.appendChild(style);
      }
    } catch {
      /* cross-origin or not ready — ignore */
    }
  };

  return (
    <div className="fc-site-root min-h-screen w-full">
      <div
        className="fixed top-0 inset-x-0 z-[9999] border-b border-[#39ff14]/25 bg-[#07110d]/95 backdrop-blur-md"
        role="toolbar"
        aria-label="Site viewport preview"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#39ff14] w-full sm:w-auto">
            Site preview
          </span>
          {(
            [
              { id: 'mobile' as const, label: 'Phone', icon: Smartphone },
              { id: 'tablet' as const, label: 'Tablet', icon: Tablet },
              { id: 'desktop' as const, label: 'Desktop', icon: Monitor },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition min-h-[40px] ${
                mode === id
                  ? 'border-[#39ff14]/45 bg-[#39ff14]/10 text-[#39ff14]'
                  : 'border-white/[0.1] text-white/55 hover:text-white/85'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
          <span className="text-[10px] text-white/40 ml-auto hidden sm:inline">
            {framed ? `Live site at ${frameWidth}px viewport — real responsive breakpoints` : 'Full desktop width'}
          </span>
          <a
            href={framePath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/[0.12] text-white/70 hover:text-white hover:border-[#39ff14]/35 transition min-h-[40px] sm:ml-0 ml-auto"
          >
            <ExternalLink className="w-4 h-4" />
            Open site
          </a>
        </div>
      </div>

      <div className="pt-[52px] sm:pt-[56px] min-h-screen flex justify-center px-2 sm:px-4 pb-6">
        {framed ? (
          <div
            className="w-full rounded-[1.75rem] border border-white/[0.12] bg-[#0a0a0a] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] overflow-hidden"
            style={{ maxWidth: `${frameWidth}px` }}
          >
            <div className="px-3 py-2 bg-[#0a0f14] border-b border-white/[0.06] flex items-center justify-center gap-2">
              <span className="w-14 h-1 rounded-full bg-white/15" />
              <span className="text-[9px] text-white/40 font-mono">{frameWidth}px</span>
            </div>
            {/* One persistent iframe — switching Phone/Tablet just resizes it
                (media queries re-evaluate live) instead of reloading the app. */}
            <iframe
              ref={iframeRef}
              src={framePath}
              title="Finely Cred responsive preview"
              onLoad={handleIframeLoad}
              className="block w-full border-0 bg-[#0a0a0a]"
              style={{ height: 'calc(100vh - 7.5rem)' }}
            />
          </div>
        ) : (
          <div className="fc-site-viewport-frame w-full max-w-[100vw] overflow-x-clip">{children}</div>
        )}
      </div>
    </div>
  );
}
