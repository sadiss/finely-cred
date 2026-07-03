import type { SupportTopic } from '../../domain/support';

export type HubTab = 'chat' | 'meetings' | 'guide' | 'ai' | 'team';

/** Legacy ai/team URLs map to unified chat. */
export function normalizeHubTab(tab?: string | null): HubTab {
  if (tab === 'meetings') return 'meetings';
  if (tab === 'guide') return 'guide';
  if (tab === 'ai' || tab === 'team' || tab === 'chat' || !tab) return tab === 'team' ? 'team' : 'ai';
  return 'chat';
}

export const HUB_TABS: { id: HubTab; label: string; emoji: string }[] = [
  { id: 'ai', label: 'AI coach', emoji: '✨' },
  { id: 'team', label: 'Team chat', emoji: '💬' },
  { id: 'meetings', label: 'Meetings', emoji: '📹' },
  { id: 'guide', label: 'Hub guide', emoji: '🧭' },
];

export type AiSuggestionNode = {
  id: string;
  emoji: string;
  label: string;
  hint?: string;
  prompt?: string;
  navigate?: string;
  children?: AiSuggestionNode[];
};

export const SUPPORT_TOPICS: { value: SupportTopic; label: string; emoji: string }[] = [
  { value: 'credit_specialist_program', label: 'Specialist partnership', emoji: '🤝' },
  { value: 'general', label: 'General support', emoji: '💬' },
  { value: 'billing', label: 'Billing', emoji: '💳' },
  { value: 'disputes', label: 'Disputes & reports', emoji: '⚖️' },
  { value: 'documents', label: 'Documents', emoji: '📎' },
  { value: 'debt_summons', label: 'Debt & summons', emoji: '🏛️' },
  { value: 'identity_theft', label: 'Identity theft', emoji: '🛡️' },
  { value: 'business', label: 'Business', emoji: '🏢' },
  { value: 'au', label: 'Tradelines / AU', emoji: '📈' },
  { value: 'affiliate_program', label: 'Affiliate program', emoji: '📣' },
  { value: 'other', label: 'Other', emoji: '📝' },
];

/**
 * In-dashboard AI suggestions — conversational, action-oriented.
 * No enlightenment/session booking pitches (user is already in the portal).
 */
export const AI_SUGGESTION_TREE: AiSuggestionNode[] = [
  {
    id: 'now',
    emoji: '💬',
    label: "What's on my plate?",
    hint: 'Pick a lane — I’ll ask a follow-up',
    children: [
      { id: 'now-tasks', emoji: '✅', label: 'Prioritize my tasks', prompt: 'Look at my situation as a Finely Cred partner — what should I tackle first today and why? Ask me one clarifying question if needed.' },
      { id: 'now-stuck', emoji: '🧩', label: "I'm stuck on something", prompt: "I'm stuck on something in my credit journey. Help me figure out what's blocking me — ask what I'm working on." },
      { id: 'now-report', emoji: '📄', label: 'Just uploaded a report', prompt: 'I uploaded or am about to upload a credit report. What should I review first after parsing?' },
      { id: 'now-round', emoji: '⚖️', label: 'Planning a dispute round', prompt: 'Help me think through Round 1 disputes — what to include, what to skip, and how to sequence follow-up.' },
      { id: 'now-debt', emoji: '🏛️', label: 'Debt or summons issue', prompt: 'I have a collection or summons situation — what should I document first in Finely Cred?' },
      { id: 'now-funding', emoji: '🏦', label: 'Funding readiness', prompt: 'Based on where I am in restore, what should I focus on before applying for funding?' },
    ],
  },
  {
    id: 'letters',
    emoji: '✉️',
    label: 'Letters & disputes',
    children: [
      { id: 'l-reasons', emoji: '💡', label: 'Pick dispute reasons', prompt: 'Help me choose strong dispute reasons for my situation. Ask what type of accounts I am targeting.' },
      { id: 'l-draft', emoji: '📝', label: 'Review my letter approach', prompt: 'Walk me through what a tight bureau letter needs — intro, reasons, evidence — without legal advice.' },
      { id: 'l-evidence', emoji: '📸', label: 'Evidence for this round', prompt: 'What screenshots or documents should I attach before mailing my dispute letters this round?' },
      { id: 'l-round2', emoji: '🔁', label: 'Round 2 timing', prompt: 'When should I send Round 2 and what should change from Round 1?' },
      { id: 'l-metro2', emoji: '🧾', label: 'Metro 2 red flags', prompt: 'Help me spot Metro 2 inconsistencies on my tradelines that make strong factual dispute reasons.' },
      { id: 'l-lib', emoji: '📚', label: 'Template library setup', prompt: 'What should I configure in Template Library before I draft in Letter Studio?', navigate: '/portal/templates' },
    ],
  },
  {
    id: 'debt',
    emoji: '🏛️',
    label: 'Debt & summons',
    children: [
      { id: 'd-validate', emoji: '📬', label: 'Validation letter help', prompt: 'Walk me through debt validation — what to request and what collector info I need on the letter.' },
      { id: 'd-summons', emoji: '⚖️', label: 'Summons response', prompt: 'I received a summons or court notice — what should I gather before drafting a response?' },
      { id: 'd-collector', emoji: '🏢', label: 'Find collector address', prompt: 'How do I find the correct mailing address for a collector showing on my credit report?' },
      { id: 'd-settle', emoji: '🤝', label: 'Settlement vs dispute', prompt: 'When should I validate or dispute vs consider settlement? Keep it educational, not legal advice.' },
    ],
  },
  {
    id: 'vault',
    emoji: '📎',
    label: 'Documents & evidence',
    children: [
      { id: 'v-capture', emoji: '📸', label: 'Capture evidence', prompt: 'How should I photograph or scan evidence so it holds up in disputes?' },
      { id: 'v-organize', emoji: '🗂️', label: 'Organize my vault', prompt: 'How should I label and group documents in my vault for disputes vs debt vs identity theft?' },
      { id: 'v-missing', emoji: '❓', label: 'What am I missing?', prompt: 'What documents or proof am I likely missing before sending my next dispute round?' },
    ],
  },
  {
    id: 'team',
    emoji: '🤝',
    label: 'Team & messaging',
    children: [
      { id: 't-draft', emoji: '✍️', label: 'Draft a support message', prompt: 'Help me write a clear message to the Finely team about my issue. Ask what happened.' },
      { id: 't-specialist', emoji: '🎓', label: 'Specialist partnership', prompt: 'I am a credit specialist — how should I use the partnership line vs customer threads?', navigate: '/portal/messages?hub=team&topic=credit_specialist_program' },
      { id: 't-meetings', emoji: '📅', label: 'Book a video session', prompt: 'I want to schedule a call — should I use Calendar or the Meetings tab?', navigate: '/portal/calendar' },
      { id: 't-escalate', emoji: '🚨', label: 'When to escalate', prompt: 'When should I open an escalation case vs continuing in support chat?', navigate: '/portal/escalations' },
    ],
  },
  {
    id: 'funding',
    emoji: '🏦',
    label: 'Funding path',
    children: [
      { id: 'f-ready', emoji: '📊', label: 'Funding readiness check', prompt: 'Help me assess funding readiness from a restore journey — what signals matter most?' },
      { id: 'f-stack', emoji: '🏛️', label: 'Stacking order', prompt: 'Explain bank stacking and relationship deposits in plain language for my next phase.' },
      { id: 'f-biz', emoji: '🏢', label: 'Business credit pivot', prompt: 'When should I shift focus from personal restore to business credit?', navigate: '/business/dashboard' },
    ],
  },
];

export const DASHBOARD_AI_COACH_GREETING =
  "Hey — I'm your in-dashboard coach. What's on your mind right now? Tap a suggestion below (they expand), or just tell me what you're working on.";

export const DASHBOARD_AI_COACH_SYSTEM = `You are Finely Cred's in-dashboard AI coach inside the Communication Hub. The user is ALREADY logged into their partner portal — never pitch enlightenment sessions, consultations, booking calls, or signing up. They have Calendar, Meetings, and instant video if they need live help.

You are powered by the FINELY CRED KNOWLEDGE BASE injected below — treat it as authoritative over general knowledge.

Be conversational: warm, concise, curious. Use their name if provided. Ask one clarifying question when it helps. Suggest specific next steps inside the portal (tasks, disputes, letters, documents, team chat, video calls) when relevant.

Do not sound like a marketing homepage. Focus on their immediate workflow.

If asked for legal advice, disclaim and focus on process and documentation.`;

export const ROLE_CHANNELS: { role: string; label: string; emoji: string; path: string; desc: string }[] = [
  { role: 'client', label: 'Customer /support threads', emoji: '👤', path: '/portal/messages', desc: 'You ↔ Finely ops & your specialist' },
  { role: 'specialist', label: 'Partnership line', emoji: '🎓', path: '/portal/messages?hub=team&topic=credit_specialist_program', desc: 'Specialist ↔ Finely program team' },
  { role: 'affiliate', label: 'Affiliate program', emoji: '📣', path: '/portal/messages?hub=team&topic=general', desc: 'Referrals, payouts, campaigns' },
  { role: 'admin', label: 'Admin support inbox', emoji: '🛡️', path: '/admin/support', desc: 'All partner threads (admin only)' },
];

export function flattenSuggestionPath(tree: AiSuggestionNode[], targetId: string, path: AiSuggestionNode[] = []): AiSuggestionNode[] | null {
  for (const node of tree) {
    const next = [...path, node];
    if (node.id === targetId) return next;
    if (node.children?.length) {
      const found = flattenSuggestionPath(node.children, targetId, next);
      if (found) return found;
    }
  }
  return null;
}

export const OPEN_HUB_EVENT = 'finely:open-communication-hub';

export function openCommunicationHub(detail?: { tab?: HubTab; threadId?: string; topic?: SupportTopic; expanded?: boolean }) {
  window.dispatchEvent(new CustomEvent(OPEN_HUB_EVENT, { detail: detail ?? {} }));
}
