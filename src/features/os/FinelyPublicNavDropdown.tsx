import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { PublicNavLink, PublicNavSection } from '../../config/siteWayfinderLanes';

type Props = {
  label: string;
  isActive?: boolean;
  sections?: PublicNavSection[];
  links?: PublicNavLink[];
  onNavigate: (path: string) => void;
  panelClassName?: string;
  wide?: boolean;
};

export function FinelyPublicNavDropdown({
  label,
  isActive = false,
  sections,
  links,
  onNavigate,
  panelClassName = '',
  wide = false,
}: Props) {
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

  const flatLinks = links ?? sections?.flatMap((s) => s.links) ?? [];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fc-nav-pill-compact inline-flex items-center gap-1 ${open || isActive ? 'fc-nav-pill-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
        <ChevronDown size={13} className={`opacity-70 ${open ? 'rotate-180' : ''} transition-transform`} />
      </button>
      {open ? (
        <div
          role="menu"
          className={`fc-public-nav-panel fc-public-nav-menu absolute left-0 top-[calc(100%+0.4rem)] z-[120] ${
            wide ? 'w-[min(520px,calc(100vw-2rem))]' : 'w-[min(280px,calc(100vw-2rem))]'
          } ${panelClassName}`}
        >
          {sections?.length ? (
            <div className={`grid gap-3 p-2 ${wide ? 'sm:grid-cols-2' : ''}`}>
              {sections.map((section) => (
                <div key={section.id}>
                  <p className="fc-public-nav-section-title">{section.title}</p>
                  <div className="space-y-0.5">
                    {section.links.map((link) => (
                      <NavRow
                        key={link.id}
                        link={link}
                        onPick={(path) => {
                          onNavigate(path);
                          setOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {flatLinks.map((link) => (
                <NavRow
                  key={link.id}
                  link={link}
                  onPick={(path) => {
                    onNavigate(path);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function NavRow({ link, onPick }: { link: PublicNavLink; onPick: (path: string) => void }) {
  return (
    <button type="button" role="menuitem" onClick={() => onPick(link.path)} className="fc-public-nav-row w-full text-left">
      <span className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-white/90 truncate">{link.label}</span>
        {link.badge ? (
          <span className="shrink-0 rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-100">
            {link.badge}
          </span>
        ) : null}
      </span>
      {link.hint ? <span className="mt-0.5 block text-xs text-white/48">{link.hint}</span> : null}
    </button>
  );
}
