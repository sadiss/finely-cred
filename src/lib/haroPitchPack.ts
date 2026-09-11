export type HaroPitch = {
  outlet: string;
  angle: string;
  draft: string;
};

/** Three journalist-ready pitches from today’s authority lane. No guarantees. */
export function buildHaroPitches(args: { headline: string; lane: string }): HaroPitch[] {
  const source = args.headline.replace(/\s+/g, ' ').trim().slice(0, 140);
  return [
    {
      outlet: 'Personal-finance desk',
      angle: `${args.lane}: what a credit file actually shows`,
      draft: `Happy to comment on “${source}.” We walk partners through uploaded bureau screenshots — factual findings only. Results vary. Not legal advice.`,
    },
    {
      outlet: 'Local business / metro',
      angle: 'Why city-level credit questions keep showing up',
      draft: `On “${source}”: collections and address history differ by metro. We publish a free guide and city pages so people can see the next step without a sales script.`,
    },
    {
      outlet: 'Help a writer / Connectively',
      angle: 'Debt collection education without scare copy',
      draft: `Re “${source}”: validation and evidence come first. We do not promise deletions. Funding is subject to underwriting. Glad to share a statute-true explainer.`,
    },
  ];
}

export function formatHaroPitchBlock(pitches: HaroPitch[]): string {
  return [
    'Journalist pitches (review before you send)',
    ...pitches.map((p, i) => `${i + 1}. ${p.outlet} — ${p.angle}\n${p.draft}`),
  ].join('\n\n');
}
