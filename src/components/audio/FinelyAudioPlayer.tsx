/** Unified Finely audio player — guides, ebooks, courses. */
import React from 'react';
import { GuideAudioPlayer } from '../resources/GuideAudioPlayer';
import type { GuideNarration } from '../../resources/guideNarration';
import type { FinelyAudioContentType } from './FinelyAudioPlayer.types';

export type { FinelyAudioContentType } from './FinelyAudioPlayer.types';

export function FinelyAudioPlayer({
  narration,
  contentType = 'guide',
  tenantId = 'finely_cred',
  presetOnly = true,
  autoPlayPreview = false,
}: {
  narration: GuideNarration;
  contentType?: FinelyAudioContentType;
  tenantId?: 'finely_cred' | 'nora_capital';
  presetOnly?: boolean;
  autoPlayPreview?: boolean;
}) {
  return (
    <div data-finely-audio-type={contentType}>
      <GuideAudioPlayer
        narration={narration}
        tenantId={tenantId}
        presetOnly={presetOnly}
        autoPlayPreview={autoPlayPreview}
        contentType={contentType}
      />
    </div>
  );
}
