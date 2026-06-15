/** Partner-facing communication surfaces — one mental model, distinct roles. */

export const PORTAL_COMMS_PATHS = {
  hub: '/portal/messages',
  hubMeetings: '/portal/messages?hub=meetings',
  hubChat: '/portal/messages?hub=chat',
  hubTeam: '/portal/messages?hub=chat',
  hubAi: '/portal/messages?hub=chat',
  hubGuide: '/portal/messages?hub=guide',
  calendar: '/portal/calendar',
  meeting: (eventId: string) => `/portal/meeting/${eventId}`,
} as const;

export const ADMIN_COMMS_PATHS = {
  commsStudio: '/admin/comms',
  supportInbox: '/admin/support',
  calendar: '/admin/calendar',
} as const;

export type CommsWorkspaceTab = 'hub' | 'calendar';

export const COMMS_WORKSPACE_TABS: {
  id: CommsWorkspaceTab;
  label: string;
  shortLabel: string;
  emoji: string;
  path: string;
  desc: string;
}[] = [
  {
    id: 'hub',
    label: 'Communication Hub',
    shortLabel: 'Hub',
    emoji: '💬',
    path: PORTAL_COMMS_PATHS.hub,
    desc: 'Live AI coach, team threads, and a meetings preview — your inbox for real conversations.',
  },
  {
    id: 'calendar',
    label: 'Calendar & video',
    shortLabel: 'Calendar',
    emoji: '📅',
    path: PORTAL_COMMS_PATHS.calendar,
    desc: 'Book strategy calls, request callbacks, and join in-app video rooms.',
  },
];

/** Clarifies Hub (live) vs Comms Studio (admin outbound) vs Calendar (scheduled video). */
export const COMMS_SURFACE_GUIDE: {
  id: string;
  title: string;
  emoji: string;
  audience: 'partner' | 'admin' | 'both';
  summary: string;
  when: string;
  path?: string;
  pathLabel?: string;
}[] = [
  {
    id: 'hub',
    title: 'Communication Hub',
    emoji: '💬',
    audience: 'partner',
    summary: 'Live conversations — AI coach, support threads, and a meetings tab.',
    when: 'Ask questions, reply to your team, attach documents, or jump into a thread topic.',
    path: PORTAL_COMMS_PATHS.hub,
    pathLabel: 'Open Hub',
  },
  {
    id: 'calendar',
    title: 'Calendar & video meetings',
    emoji: '📅',
    audience: 'partner',
    summary: 'Schedule strategy calls and join confirmed video rooms.',
    when: 'Request a call, pick preferred dates, export invites, or join a meeting at start time.',
    path: PORTAL_COMMS_PATHS.calendar,
    pathLabel: 'Open calendar',
  },
  {
    id: 'comms-studio',
    title: 'Comms Studio',
    emoji: '📨',
    audience: 'admin',
    summary: 'Outbound templates, sequences, and portal/email/SMS delivery — not live chat.',
    when: 'Send welcome messages, nurture sequences, or bulk portal posts from a template.',
    path: ADMIN_COMMS_PATHS.commsStudio,
    pathLabel: 'Open Comms Studio',
  },
  {
    id: 'support-inbox',
    title: 'Support Inbox',
    emoji: '🛡️',
    audience: 'admin',
    summary: 'Admin view of the same live threads partners see in the Hub.',
    when: 'Reply to partners, specialists, and affiliates in real time.',
    path: ADMIN_COMMS_PATHS.supportInbox,
    pathLabel: 'Open Support Inbox',
  },
];

export function hubPath(opts?: { tab?: 'chat' | 'ai' | 'team' | 'meetings' | 'guide'; topic?: string; thread?: string }) {
  const tab = opts?.tab === 'ai' || opts?.tab === 'team' ? 'chat' : opts?.tab ?? 'chat';
  const params = new URLSearchParams();
  params.set('hub', tab);
  if (opts?.topic) params.set('topic', opts.topic);
  if (opts?.thread) params.set('thread', opts.thread);
  const q = params.toString();
  return q ? `${PORTAL_COMMS_PATHS.hub}?${q}` : PORTAL_COMMS_PATHS.hub;
}

export function activeCommsWorkspaceTab(pathname: string, search = ''): CommsWorkspaceTab | null {
  if (pathname.startsWith('/portal/messages')) return 'hub';
  if (pathname.startsWith('/portal/calendar') || pathname.startsWith('/portal/meeting/')) return 'calendar';
  return null;
}

export const COMMS_WORKSPACE_EXPLAINER =
  'Hub is for live chat and coaching. Calendar is for booking and video sessions. Comms Studio (admin only) sends template messages into Hub threads — not a second inbox.';
