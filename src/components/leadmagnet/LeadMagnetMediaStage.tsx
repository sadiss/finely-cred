import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import type { LeadMagnetPremiumProfile } from './leadMagnetPremiumProfiles';
import type { LeadMagnetVisualTheme } from './leadMagnetVisualThemes';
import { LeadMagnetFunnelHeroVideo } from './LeadMagnetFunnelHeroVideo';
import { LeadMagnetThemedEbook } from './LeadMagnetThemedEbook';

type Props = {
  config: LeadMagnetFunnelConfig;
  guide: FreeGuide;
  theme: LeadMagnetVisualTheme;
  profile: LeadMagnetPremiumProfile;
  totalValue: number;
  videoPoster: string;
  benefitsTitle: string;
  taglineBar: string;
  onGoForm: () => void;
};

export function LeadMagnetMediaStage({
  config,
  guide,
  theme,
  profile,
  totalValue,
  videoPoster,
  benefitsTitle,
  taglineBar,
  onGoForm,
}: Props) {
  return (
    <section className="container mx-auto max-w-6xl px-4 sm:px-6 lm-showcase-section">
      <div className="lm-flyer-tagline-bar">{taglineBar}</div>

      <div className="lm-flyer-stage">
        <div className="lm-flyer-stage-video">
          <div className="lm-video-spotlight-ring" aria-hidden />
          <div className="lm-video-card lm-video-card-featured">
            <LeadMagnetFunnelHeroVideo
              config={config}
              theme={theme}
              posterUrl={videoPoster}
              onGoForm={onGoForm}
              className="lm-video-card-inner lm-video-card-featured-inner"
            />
          </div>
        </div>

        <div className="lm-flyer-stage-ebook">
          <LeadMagnetThemedEbook guide={guide} theme={theme} totalValue={totalValue} size="hero" layout="stage" />
          <p className="lm-showcase-guide-title">{guide.title}</p>
        </div>

        <div className="lm-benefits-box lm-benefits-box-flyer">
          <h3 className="lm-benefits-box-title">{benefitsTitle}</h3>
          <ul className="lm-benefits-list">
            {profile.heroProof.map((line) => (
              <li key={line}>
                <CheckCircle2 className="w-4 h-4 shrink-0 lm-benefits-check" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
