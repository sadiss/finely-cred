export type BriefingItemKind = 'task' | 'crm' | 'notification' | 'automation' | 'social' | 'support' | 'comms';

export type BriefingItem = {
  id: string;
  kind: BriefingItemKind;
  priority: number;
  title: string;
  subtitle: string;
  href?: string;
  reason: string;
};

export type DailyBriefing = {
  generatedAt: string;
  summary: string;
  items: BriefingItem[];
};
