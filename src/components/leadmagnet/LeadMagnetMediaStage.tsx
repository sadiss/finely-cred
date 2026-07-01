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
  videoPoster: string;
};

export function LeadMagnetMediaStage({ config, guide, theme, totalValue, videoPoster }: Props) {
  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lm-media-wrap">
      <div className="lm-media-frame">
        <LeadMagnetFunnelHeroVideo config={config} theme={theme} posterUrl={videoPoster} className="lm-media-video" />
        <div className="lm-media-ebook">
          <LeadMagnetThemedEbook guide={guide} theme={theme} totalValue={totalValue} />
        </div>
      </div>
    </div>
  );
}
