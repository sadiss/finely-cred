/** Manual $0 channel copy for the daily authority pack. Human posts. No scrape-to-DM. */

export type AuthorityChannelPack = {
  captions: [string, string, string];
  gbpPost: string;
  wildReplies: string[];
  nextdoorPost: string;
};

export function buildAuthorityChannelPack(args: { headline: string; lane: string }): AuthorityChannelPack {
  const source = args.headline.replace(/\s+/g, ' ').trim().slice(0, 110);
  return {
    captions: [
      `${args.lane}: ${source} Free guide if you want the next step. Results vary.`,
      `What changed: ${source} We do not promise a score. Start the free guide when you are ready.`,
      `${source} Educational only — not legal advice. Book a session if you are stuck.`,
    ],
    gbpPost: `${source} Finely Cred can walk you through the free guide or a session. Results vary. Not legal advice. Funding subject to underwriting.`,
    wildReplies: [
      `Reddit: Answer the question first. Then: I wrote a free guide on this — finelycred.com/free-guide. No dump.`,
      `Quora: Quote the statute or the filing, then one next step. Results vary.`,
      `Facebook group: Help the person in front of you. One guide link, once.`,
      `YouTube comment: Reply to the pain in the video. Point to the free guide, not a pitch deck.`,
      `Forum thread: If someone was served, tell them to read the date on the paper. Then the debt guide.`,
    ],
    nextdoorPost: `${args.lane} note for neighbors: ${source} Free education at finelycred.com/free-guide. Results vary. Not legal advice.`,
  };
}

export function formatAuthorityChannelBlock(pack: AuthorityChannelPack): string {
  return [
    'Three captions (rotate emerald / violet / sky — no two the same)',
    ...pack.captions.map((c, i) => `${i + 1}. ${c}`),
    '',
    'Google Business Profile post',
    pack.gbpPost,
    '',
    'Reply in the wild (answers, one link)',
    ...pack.wildReplies.map((r, i) => `${i + 1}. ${r}`),
    '',
    'Nextdoor neighborhood post',
    pack.nextdoorPost,
  ].join('\n');
}
