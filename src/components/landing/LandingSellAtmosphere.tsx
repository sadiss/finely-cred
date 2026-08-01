/** Shared cinematic atmosphere for homepage sell bands. */
import React from 'react';
import './landingSellBands.css';

type Tone = 'platinum' | 'navy' | 'emerald';

export function LandingSellAtmosphere({ tone = 'platinum' }: { tone?: Tone }) {
  const base =
    tone === 'navy'
      ? 'fc-sell-atmosphere__base--navy'
      : tone === 'emerald'
        ? 'fc-sell-atmosphere__base--emerald'
        : 'fc-sell-atmosphere__base--platinum';

  return (
    <div className="fc-sell-atmosphere" aria-hidden>
      <div className={base} />
      <div className="fc-sell-atmosphere__beam" />
      <div className="fc-sell-atmosphere__beam fc-sell-atmosphere__beam--late" />
      <div className="fc-sell-atmosphere__grain" />
      <div className="fc-sell-atmosphere__line fc-sell-atmosphere__line--top" />
      <div className="fc-sell-atmosphere__line fc-sell-atmosphere__line--bottom" />
    </div>
  );
}
