import React from 'react';
import { MARKETING_HUB_CONTENT_SHELL, MarketingKpiChip } from './marketingHubUi';
import { MarketingHelpButton } from './MarketingHelpModal';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL } from '../os/finelyOsLightUi';

/** Explains what the hub colors mean — replaces the old glossary fine print. */
export function MarketingColorLegend() {
  return (
    <div className={`${MARKETING_HUB_CONTENT_SHELL}`}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <p className={FINELY_OS_ENTITY_SUBLABEL}>How to read these tiles</p>
        <MarketingHelpButton helpId="capability_percent" />
      </div>
      <p className={`text-xs mb-3 ${FINELY_OS_ENTITY_BODY}`}>
        Colors show <strong className="text-white/90">what kind of thing</strong> you are looking at. The small badge or
        percent shows <strong className="text-white/90">how ready</strong> it is — not a navigation direction.
      </p>
      <div className="grid sm:grid-cols-3 gap-2">
        <MarketingKpiChip label="Green tile" value="On / ready" accent="emerald" purpose="Safe to run or already wired" />
        <MarketingKpiChip label="Amber tile" value="Attention" accent="amber" purpose="Works but needs a fix soon" />
        <MarketingKpiChip label="Red tile" value="Off / blocked" accent="rose" purpose="Turn on or finish setup first" />
      </div>
    </div>
  );
}
