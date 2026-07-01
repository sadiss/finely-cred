import React from 'react';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import type { LeadMagnetVisualTheme } from './leadMagnetVisualThemes';
import { LeadMagnetFunnelHeroVideo } from './LeadMagnetFunnelHeroVideo';
import { LeadMagnetThemedEbook } from './LeadMagnetThemedEbook';

type Props = {
  config: LeadMagnetFunnelConfig;
  guide: FreeGuide;
  theme: LeadMagnetVisualTheme;
  totalValue: number;
  heroImage: string;
  onGoForm: () => void;
};

/** Cinematic video + floating e-guide mockup — vertical showcase, no side-by-side copy columns. */
export function LeadMagnetMediaStage({ config, guide, theme, totalValue, heroImage, onGoForm }: Props) {
  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 -mt-6 sm:-mt-10 relative z-20">
      <div className={`lm-media-stage ${theme.cardGlow}`}>
        <div className="lm-media-stage-glow" style={{ background: `radial-gradient(circle, rgba(${theme.accentRgb},0.2), transparent 70%)` }} aria-hidden />
        <LeadMagnetFunnelHeroVideo config={config} theme={theme} posterUrl={heroImage} onGoForm={onGoForm} className="lm-media-video" />
        <div className="lm-media-ebook-wrap">
          <LeadMagnetThemedEbook guide={guide} theme={theme} totalValue={totalValue} />
        </div>
        <div className="lm-media-stage-footer">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Instant PDF + portal preview</span>
          <button type="button" onClick={onGoForm} className={`${theme.ctaClass} text-xs py-2.5 px-6 mt-2`}>
            Claim free kit
          </button>
        </div>
      </div>
    </div>
  );
}
