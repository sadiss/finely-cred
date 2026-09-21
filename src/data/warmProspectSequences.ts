/** Draft sequences for warm prospects — copy into Comms Studio; never auto-send. */

export type WarmSequenceDraft = {
  id: string;
  title: string;
  heat: 'warm' | 'nurture' | 'hot';
  channel: 'email' | 'sms';
  steps: { dayOffset: number; subject?: string; body: string }[];
};

export const WARM_SEQUENCE_DRAFTS: WarmSequenceDraft[] = [
  {
    id: 'warm-intro-partner',
    title: 'Warm partner — intro (3-touch)',
    heat: 'warm',
    channel: 'email',
    steps: [
      {
        dayOffset: 0,
        subject: 'Finely Cred — restore-to-readiness for your referrals',
        body: `Hi {{name}},\n\nWe help partners route clients through file-accuracy restore before lender handoff — educational, not legal advice.\n\nIf you have 15 minutes this week, I can share our partner one-sheet and intake path.\n\n— Finely Cred`,
      },
      {
        dayOffset: 3,
        subject: 'Quick follow-up — partner one-sheet',
        body: `Hi {{name}},\n\nSharing our restore → funding readiness one-sheet (Finely medallion only). Preview: https://finelycred.com/marketing-packs/finely/html-one-sheets/restore-to-funding-readiness.html\n\nReply “partner” if you want co-marketing options.\n`,
      },
      {
        dayOffset: 7,
        subject: 'Last nudge — warm',
        body: `Hi {{name}},\n\nClosing the loop on partner co-marketing. If timing is off, reply “later” and we will nurture quarterly.\n`,
      },
    ],
  },
  {
    id: 'hot-book-session',
    title: 'Hot — book enlightenment session',
    heat: 'hot',
    channel: 'email',
    steps: [
      {
        dayOffset: 0,
        subject: 'You asked for next steps — book your session',
        body: `Hi {{name}},\n\nYou are on our hot list from {{source}}. Book a free 1-hour enlightenment session (manual calendar — no auto-send):\nhttps://finelycred.com/enlightenment-session\n\nBring: last bureau snapshot (redact account numbers).\n`,
      },
      {
        dayOffset: 1,
        subject: 'SMS-style reminder (copy to phone)',
        body: `Hi {{name}} — Finely Cred here. You raised your hand for restore help. Book here: finelycred.com/enlightenment-session Reply STOP to opt out.`,
      },
    ],
  },
  {
    id: 'nurture-score-literacy',
    title: 'Nurture — score literacy drip',
    heat: 'nurture',
    channel: 'email',
    steps: [
      {
        dayOffset: 0,
        subject: 'Which score model matters for your goal?',
        body: `Hi {{name}},\n\nBefore comparing scores, ask: bureau, model, purpose, soft vs hard.\n\nFinely Cred — educational restore framing.\n`,
      },
      {
        dayOffset: 14,
        subject: 'Start Restore $147 — roadmap only',
        body: `Hi {{name}},\n\nOur $147 Start Restore is a starter roadmap + strategy call — not Core DFY pricing.\nhttps://finelycred.com/start\n`,
      },
    ],
  },
];

export function getWarmSequenceDraft(id: string) {
  return WARM_SEQUENCE_DRAFTS.find((s) => s.id === id) ?? null;
}
