/** Plain English for Growth Agents (extends Marketing Desk glossary). */
export const GROWTH_AGENTS_GLOSSARY = [
  { say: 'Talk score', means: 'Likely to reply to outreach', never: 'P(conversation)' },
  { say: 'Guide score', means: 'Likely to use a free guide link', never: 'P(self_signup)' },
  { say: 'Good fit', means: 'Approve for learning system', never: 'Positive label' },
  { say: 'Wrong fit', means: 'Reject for learning system', never: 'Negative class' },
  { say: 'Test search', means: 'Prove server search is connected', never: 'Serper ping' },
  { say: 'Run details', means: 'Why rows were skipped', never: 'Skip reason aggregate' },
] as const;
