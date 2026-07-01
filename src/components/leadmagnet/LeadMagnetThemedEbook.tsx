import React from 'react';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetVisualTheme } from './leadMagnetVisualThemes';
import { getGuideCoverArt } from './leadMagnetGuideCovers';

type Props = {
  guide: FreeGuide;
  theme: LeadMagnetVisualTheme;
  totalValue: number;
  coverImageUrl?: string | null;
  size?: 'default' | 'hero';
};

export function LeadMagnetThemedEbook({ guide, theme, totalValue, coverImageUrl, size = 'default' }: Props) {
  const art = getGuideCoverArt(guide.id, theme);
  const widthClass = size === 'hero' ? 'w-[200px] sm:w-[240px] md:w-[260px]' : 'w-[160px] sm:w-[180px]';

  return (
    <div className={`lm-ebook-hero-wrap ${size === 'hero' ? 'is-hero' : ''}`}>
      <div className="lm-ebook-gradient-ring" aria-hidden />
      <div className={`fg-book relative aspect-[723/1024] ${widthClass} lm-ebook-book`}>
        <div className="fg-book-spine absolute inset-y-[2%] left-0 w-[8px] -translate-x-[4px] rounded-l-[4px] z-[5]" style={{ background: art.spine }} />
        <div className="fg-book-pages absolute top-0 bottom-0 left-3 right-[-12px] rounded-[3px_14px_14px_3px] z-[8]" />
        <div className="fg-book-cover absolute inset-y-0 left-[7px] right-0 rounded-[3px_14px_14px_3px] overflow-hidden z-[10] border-2 border-white/15">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt={guide.title} className="absolute inset-0 w-full h-full object-cover" loading="eager" />
          ) : (
            <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between" style={{ background: art.gradient }}>
              <div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">{art.kicker}</div>
                <div className="mt-3 text-sm sm:text-base font-bold leading-snug text-white">{guide.title}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-white/45">Finely Cred edition</div>
                <div className="text-2xl sm:text-3xl font-black mt-1 tabular-nums lm-text-finely-gradient">${totalValue}+</div>
                <div className="text-xs font-bold text-orange-400 mt-1">FREE PDF</div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-purple-900/30 pointer-events-none" />
        </div>
      </div>
      {size === 'hero' ? (
        <div className="lm-ebook-ribbon">
          <span className="lm-text-finely-gradient font-black">${totalValue}+</span>
          <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Free kit</span>
        </div>
      ) : null}
    </div>
  );
}
