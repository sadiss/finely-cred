import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PUBLIC_MOBILE_EXPLORE } from '../../config/siteWayfinderLanes';

export function FinelyPublicNavExploreMenu({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fc-nav-pill inline-flex items-center gap-1.5 ${open ? 'fc-nav-pill-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        More <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[120] min-w-[220px] rounded-2xl border border-white/[0.08] bg-fc-chrome/95 backdrop-blur-xl p-2 shadow-xl fc-public-explore-menu"
        >
          {PUBLIC_MOBILE_EXPLORE.map((link) => (
            <button
              key={link.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onNavigate(link.path);
                setOpen(false);
              }}
              className="w-full text-left fc-nav-pill !px-3 !py-2.5 !text-sm !font-semibold"
            >
              {link.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
