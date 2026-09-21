export type LoungeChannelId =
  | 'announce'
  | 'general'
  | 'ask_desk'
  | 'module_huddle'
  | 'wins'
  | 'meeting_lobby'
  | 'resources';

export type LoungeRole = 'trainee' | 'specialist' | 'coach' | 'admin';

export type LoungePost = {
  id: string;
  channelId: LoungeChannelId;
  authorEmail: string;
  authorName: string;
  role: LoungeRole;
  body: string;
  createdAt: string;
  pinned?: boolean;
  reactions?: Record<string, number>;
  threadParentId?: string;
  moduleLessonId?: string;
  meetLink?: string;
  reviewScore?: number;
};

export const LOUNGE_CHANNELS: { id: LoungeChannelId; label: string; labelHt: string; hint: string }[] = [
  { id: 'announce', label: 'Announce', labelHt: 'Anons', hint: 'Course drops & admin wins' },
  { id: 'general', label: 'General hangout', labelHt: 'Hangout', hint: 'EN + HT welcome' },
  { id: 'ask_desk', label: 'Ask the Desk', labelHt: 'Mande biwo a', hint: 'Questions + KB helper' },
  { id: 'module_huddle', label: 'Module huddles', labelHt: 'Modil', hint: 'Per-track threads' },
  { id: 'wins', label: 'Wins & reviews', labelHt: 'Viktwa', hint: 'Celebrate progress (no score promises)' },
  { id: 'meeting_lobby', label: 'Meeting lobby', labelHt: 'Reyinyon', hint: 'Upcoming meets & recaps' },
  { id: 'resources', label: 'Resources shelf', labelHt: 'Resous', hint: 'Academy SOPs — not Marketing HQ Social Media' },
];
