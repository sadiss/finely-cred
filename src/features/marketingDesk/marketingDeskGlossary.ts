/** Plain-English labels for Marketing Desk (never lead with jargon). */
export const MARKETING_DESK_GLOSSARY = [
  { say: 'Find new people', means: 'Live prospect search', never: 'Serper / swarm / intel' },
  { say: 'Exceptions', means: 'Mid-score people to Approve/Reject before save', never: 'Staging board / lanes' },
  { say: 'While you slept', means: 'Overnight Find + mail brief on Desk home', never: 'Cron digest / BI' },
  { say: 'Lane pace', means: 'Top found→booked rates (max 3 chips)', never: 'Full analytics wall' },
  { say: 'Ruth tip', means: 'One weekly lane suggestion from pace', never: 'Model recommendation wall' },
  { say: 'Find failed', means: 'My work Fix setup after overnight/pack/hard Find fail', never: 'Serper error dump' },
  { say: 'Convert in CRM', means: 'Booked seed fallback when partner/email missing', never: 'CRM convert API' },
  { say: 'Hot reply', means: 'They wrote back — sequences paused; follow up', never: 'Inbound webhook event' },
  { say: 'Auto-pause', means: 'Reply / bounce / complaint stops matching mail', never: 'ESP suppression list' },
  { say: 'Round-robin', means: 'Alternate seat shares new Desk tasks', never: 'Complex CRM routing matrix' },
  { say: 'People who asked', means: 'Inbound form leads', never: 'Capture stream' },
  { say: 'Board', means: 'New → Talking → Booked → Won/No', never: 'Pipeline kanban' },
  { say: 'Clean out junk', means: 'Hide + leave Board', never: 'Trash tombstone' },
  { say: 'Put back', means: 'Restore from cleanup', never: 'Undelete' },
  { say: "Today's to-dos", means: 'Real Projects & Tasks', never: 'NBA / autonomy' },
  { say: 'Mail on autopilot', means: 'Automated sequences', never: 'Cadence engine' },
  { say: 'Practice mode', means: 'Owner simulation counters', never: 'Lead search tool jargon' },
] as const;

export type MarketingDeskHelperId = 'find' | 'board' | 'clean' | 'ruth' | 'mail';

export const MARKETING_DESK_HELPERS: Array<{
  id: MarketingDeskHelperId;
  title: string;
  blurb: string;
  accent: 'emerald' | 'violet' | 'rose' | 'amber' | 'sky';
  cta: string;
}> = [
  {
    id: 'find',
    title: 'Find new people',
    blurb: 'One-tap Find — good fits auto-save; clear mid-score exceptions only.',
    accent: 'emerald',
    cta: 'Open Find',
  },
  {
    id: 'board',
    title: 'Board',
    blurb: 'People who asked — New → Talking → Booked.',
    accent: 'violet',
    cta: 'Open Board',
  },
  {
    id: 'clean',
    title: 'Clean out junk',
    blurb: 'Hide from Board. Put back if you made a mistake.',
    accent: 'rose',
    cta: 'Open Clean',
  },
  {
    id: 'ruth',
    title: 'Ruth',
    blurb: 'What to do / what to say — with action chips.',
    accent: 'amber',
    cta: 'Ask Ruth',
  },
  {
    id: 'mail',
    title: 'Mail on autopilot',
    blurb: 'Ready, Needs setup, or Paused — short sequence tiles.',
    accent: 'sky',
    cta: 'Check Mail',
  },
];
