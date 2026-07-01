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
  onGoForm,
}: Props) {
  return (
    <section className="container mx-auto max-w-6xl px-4 sm:px-6 lm-showcase-section">
      <div className="lm-showcase-grid">
        <div className="lm-showcase-ebook">
          <LeadMagnetThemedEbook guide={guide} theme={theme} totalValue={totalValue} size="hero" />
          <p className="lm-showcase-guide-title">{guide.title}</p>
        </div>

        <div className="lm-showcase-media">
          <div className="lm-video-card">
            <LeadMagnetFunnelHeroVideo
              config={config}
              theme={theme}
              posterUrl={videoPoster}
              onGoForm={onGoForm}
              className="lm-video-card-inner"
            />
          </div>

          <div className="lm-benefits-box">
            <h3 className="lm-benefits-box-title">{benefitsTitle}</h3>
            <ul className="lm-benefits-list">
              {profile.heroProof.map((line) => (
                <li key={line}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-orange-400" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
