import React from 'react';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetVisualTheme } from './leadMagnetVisualThemes';
import { getGuideCoverArt } from './leadMagnetGuideCovers';

type Props = {
  guide: FreeGuide;
  theme: LeadMagnetVisualTheme;
  totalValue: number;
  coverImageUrl?: string | null;
  className?: string;
};

export function LeadMagnetThemedEbook({ guide, theme, totalValue, coverImageUrl, className = '' }: Props) {
  const art = getGuideCoverArt(guide.id, theme);

  return (
    <div className={`lm-ebook-stage ${className}`}>
      <div className="lm-ebook-aura" style={{ '--lm-accent': art.accent } as React.CSSProperties} aria-hidden />
      <div className="fg-book relative aspect-[723/1024] w-full max-w-[200px] sm:max-w-[220px] mx-auto lm-ebook-float">
        <div className="fg-book-spine absolute inset-y-[2%] left-0 w-[7px] -translate-x-[4px] rounded-l-[4px] z-[5]" style={{ background: art.spine }} />
        <div className="fg-book-pages absolute top-0 bottom-0 left-3 right-[-10px] rounded-[3px_12px_12px_3px] z-[8]" />
        <div className="fg-book-cover absolute inset-y-0 left-[6px] right-0 rounded-[3px_12px_12px_3px] overflow-hidden z-[10] border border-white/15">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt={guide.title} className="absolute inset-0 w-full h-full object-cover fg-book-cover-img" loading="eager" />
          ) : (
            <div className="absolute inset-0 p-4 flex flex-col justify-between" style={{ background: art.gradient }}>
              <div>
                <div className="text-[8px] font-black uppercase tracking-[0.22em] text-white/55">{art.kicker}</div>
                <div className="mt-3 text-[11px] font-black leading-tight text-white sm:text-xs">{guide.title}</div>
              </div>
              <div>
                <div className="text-[7px] uppercase tracking-widest text-white/45">Finely Cred edition</div>
                <div className="text-lg font-black mt-1" style={{ color: art.accent }}>
                  ${totalValue}+
                </div>
                <div className="text-[8px] font-bold text-emerald-300 mt-0.5">FREE PDF</div>
              </div>
            </div>
          )}
          <div className="absolute inset-y-0 left-0 w-[5%] bg-gradient-to-r from-black/12 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/25 pointer-events-none" />
        </div>
        <div className="lm-ebook-free-badge">FREE</div>
      </div>
    </div>
  );
}
