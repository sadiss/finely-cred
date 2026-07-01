import React from 'react';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetVisualTheme } from './leadMagnetVisualThemes';
import { getGuideCoverArt } from './leadMagnetGuideCovers';

type Props = {
  guide: FreeGuide;
  theme: LeadMagnetVisualTheme;
  totalValue: number;
  coverImageUrl?: string | null;
};

export function LeadMagnetThemedEbook({ guide, theme, totalValue, coverImageUrl }: Props) {
  const art = getGuideCoverArt(guide.id, theme);

  return (
    <div className="lm-ebook">
      <div className="fg-book relative aspect-[723/1024] w-[148px] sm:w-[168px]">
        <div className="fg-book-spine absolute inset-y-[2%] left-0 w-[6px] -translate-x-[3px] rounded-l-[3px] z-[5]" style={{ background: art.spine }} />
        <div className="fg-book-pages absolute top-0 bottom-0 left-2.5 right-[-8px] rounded-[2px_10px_10px_2px] z-[8]" />
        <div className="fg-book-cover absolute inset-y-0 left-[5px] right-0 rounded-[2px_10px_10px_2px] overflow-hidden z-[10] border border-white/10 shadow-2xl">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt={guide.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0 p-3 flex flex-col justify-between" style={{ background: art.gradient }}>
              <div className="text-[7px] font-semibold uppercase tracking-[0.18em] text-white/50">{art.kicker}</div>
              <div>
                <div className="text-[10px] font-semibold leading-snug text-white/95">{guide.title}</div>
                <div className="mt-2 text-[9px] text-white/45">Finely Cred</div>
                <div className="text-sm font-semibold mt-1 tabular-nums" style={{ color: art.accent }}>
                  ${totalValue}+
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
