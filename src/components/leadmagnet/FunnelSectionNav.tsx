import React, { useEffect, useState } from 'react';

export type FunnelSection = { id: string; label: string };

type Props = {
  sections: readonly FunnelSection[];
  className?: string;
};

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Sticky section nav with scroll-spy active state. */
export function FunnelSectionNav({ sections, className = '' }: Props) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        const top = visible[0]?.target.id;
        if (top && ids.includes(top)) setActiveId(top);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.08, 0.2, 0.45] },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className={`sticky top-0 z-30 fc-funnel-nav backdrop-blur border-b border-white/[0.08] ${className}`}>
      <div className="container mx-auto px-3 sm:px-6 max-w-7xl flex gap-1.5 sm:gap-2 overflow-x-auto py-2 sm:py-2.5 [scrollbar-width:thin]">
        {sections.map((s) => {
          const active = activeId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToSection(s.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition ${
                active
                  ? 'border-[#39ff14]/45 bg-[#39ff14]/10 text-[#39ff14] shadow-[0_0_16px_rgba(57,255,20,0.12)]'
                  : 'border-white/[0.08] text-white/60 hover:text-[#39ff14] hover:border-[#39ff14]/30'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
