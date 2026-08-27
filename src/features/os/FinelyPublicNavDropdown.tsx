import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { PublicNavAccent, PublicNavLink, PublicNavSection } from '../../config/siteWayfinderLanes';

type Props = {
  label: string;
  isActive?: boolean;
  sections?: PublicNavSection[];
  links?: PublicNavLink[];
  onNavigate: (path: string) => void;
  panelClassName?: string;
  wide?: boolean;
  /** Luxury glass mega panel (Solutions / Resources). */
  luxury?: boolean;
};

const ACCENT_DOT: Record<PublicNavAccent, string> = {
  emerald: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]',
  violet: 'bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.55)]',
  fuchsia: 'bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.55)]',
  rose: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.55)]',
  amber: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.55)]',
  sky: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.55)]',
};

const ACCENT_ROW: Record<PublicNavAccent, string> = {
  emerald: 'hover:border-emerald-400/35 hover:bg-emerald-500/10 data-[active=true]:border-emerald-400/45 data-[active=true]:bg-emerald-500/15',
  violet: 'hover:border-violet-400/35 hover:bg-violet-500/10 data-[active=true]:border-violet-400/45 data-[active=true]:bg-violet-500/15',
  fuchsia: 'hover:border-fuchsia-400/35 hover:bg-fuchsia-500/10 data-[active=true]:border-fuchsia-400/45 data-[active=true]:bg-fuchsia-500/15',
  rose: 'hover:border-rose-400/35 hover:bg-rose-500/10 data-[active=true]:border-rose-400/45 data-[active=true]:bg-rose-500/15',
  amber: 'hover:border-amber-400/35 hover:bg-amber-500/10 data-[active=true]:border-amber-400/45 data-[active=true]:bg-amber-500/15',
  sky: 'hover:border-sky-400/35 hover:bg-sky-500/10 data-[active=true]:border-sky-400/45 data-[active=true]:bg-sky-500/15',
};

function pathMatches(pathname: string, linkPath: string): boolean {
  if (pathname === linkPath) return true;
  if (linkPath === '/pricing') return pathname === '/pricing' || pathname === '/services';
  return pathname.startsWith(`${linkPath}/`);
}

export function FinelyPublicNavDropdown({
  label,
  isActive = false,
  sections,
  links,
  onNavigate,
  panelClassName = '',
  wide = false,
  luxury = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const flatLinks = links ?? sections?.flatMap((s) => s.links) ?? [];
  const panelWide = wide || luxury;

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
        <ChevronDown size={13} className={`opacity-70 ${open ? 'rotate-180' : ''} transition-transform duration-200`} />
      </button>
      {open ? (
        <div
          role="menu"
          className={`fc-public-nav-panel fc-public-nav-menu absolute left-0 top-[calc(100%+0.45rem)] z-[120] ${
            luxury ? 'fc-public-nav-panel--luxury' : ''
          } ${panelWide ? 'w-[min(560px,calc(100vw-2rem))]' : 'w-[min(280px,calc(100vw-2rem))]'} ${panelClassName}`}
        >
          {luxury ? <div className="fc-public-nav-panel-sheen" aria-hidden /> : null}
          {sections?.length ? (
            <div className={`relative z-[1] grid gap-3 p-2.5 ${panelWide ? 'sm:grid-cols-2' : ''}`}>
              {sections.map((section) => (
                <div key={section.id} className={luxury ? 'fc-public-nav-section-card' : ''}>
                  <p className="fc-public-nav-section-title">{section.title}</p>
                  <div className="space-y-1">
                    {section.links.map((link) => (
                      <NavRow
                        key={link.id}
                        link={link}
                        luxury={luxury}
                        active={pathMatches(pathname, link.path)}
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
            <div className="relative z-[1] space-y-1 p-2.5">
              {flatLinks.map((link) => (
                <NavRow
                  key={link.id}
                  link={link}
                  luxury={luxury}
                  active={pathMatches(pathname, link.path)}
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

function NavRow({
  link,
  onPick,
  active,
  luxury,
}: {
  link: PublicNavLink;
  onPick: (path: string) => void;
  active?: boolean;
  luxury?: boolean;
}) {
  const accent = link.accent ?? 'amber';
  return (
    <button
      type="button"
      role="menuitem"
      data-active={active ? 'true' : 'false'}
      onClick={() => onPick(link.path)}
      className={`fc-public-nav-row w-full text-left border border-transparent ${
        luxury ? `fc-public-nav-row--luxury ${ACCENT_ROW[accent]}` : ''
      } ${active && !luxury ? 'bg-white/[0.08]' : ''}`}
    >
      <span className="flex items-start gap-2.5 min-w-0">
        {luxury ? <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${ACCENT_DOT[accent]}`} aria-hidden /> : null}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-white/92 truncate">{link.label}</span>
            {link.badge ? (
              <span className="shrink-0 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-100">
                {link.badge}
              </span>
            ) : null}
            {active ? (
              <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/70">
                Active
              </span>
            ) : null}
          </span>
          {link.hint ? <span className="mt-0.5 block text-xs leading-snug text-white/48">{link.hint}</span> : null}
        </span>
      </span>
    </button>
  );
}
