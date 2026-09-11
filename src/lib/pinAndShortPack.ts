/** Manual Pinterest + TikTok copy from the daily authority lane. No paid APIs. */

export type PinAndShortPack = {
  pinterestTitle: string;
  pinterestDescription: string;
  tiktokOpen: string;
  tiktokCaption: string;
};

export function buildPinAndShortPack(args: { headline: string; lane: string }): PinAndShortPack {
  const source = args.headline.replace(/\s+/g, ' ').trim().slice(0, 90);
  return {
    pinterestTitle: `${args.lane}: ${source}`.slice(0, 100),
    pinterestDescription: `${source} Educational only. Start the free guide at finelycred.com/free-guide — results vary, not legal advice.`,
    tiktokOpen: `${args.lane} update: ${source}`.slice(0, 80),
    tiktokCaption: `${source} Full walkthrough in the free guide. Results vary. Not legal advice. Funding subject to underwriting.`,
  };
}

export function formatPinAndShortBlock(pack: PinAndShortPack): string {
  return [
    'Pinterest pin (paste title + description)',
    pack.pinterestTitle,
    pack.pinterestDescription,
    '',
    'TikTok / Short (first line is the hook)',
    pack.tiktokOpen,
    pack.tiktokCaption,
  ].join('\n');
}
