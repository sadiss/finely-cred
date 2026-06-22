export type PartnerDetailTabKey =
  | 'overview'
  | 'profile'
  | 'reports'
  | 'analysis'
  | 'evidence'
  | 'letters'
  | 'tasks'
  | 'notes'
  | 'debt';

export type PartnerDetailTabLane = {
  id: string;
  label: string;
  hint: string;
  accent: 'emerald' | 'amber' | 'sky' | 'violet';
  tabKeys: PartnerDetailTabKey[];
};

export const PARTNER_DETAIL_TAB_LANES: PartnerDetailTabLane[] = [
  {
    id: 'file',
    label: 'File',
    hint: 'Overview & tasks',
    accent: 'emerald',
    tabKeys: ['overview', 'profile', 'tasks', 'notes'],
  },
  {
    id: 'intel',
    label: 'Intel',
    hint: 'Reports & analysis',
    accent: 'sky',
    tabKeys: ['reports', 'analysis', 'evidence'],
  },
  {
    id: 'letters',
    label: 'Letters',
    hint: 'Dispute letters & vault',
    accent: 'amber',
    tabKeys: ['letters'],
  },
  {
    id: 'debt',
    label: 'Debt',
    hint: 'Summons & legal',
    accent: 'violet',
    tabKeys: ['debt'],
  },
];

export function resolvePartnerDetailLaneId(activeTab: string): string {
  for (const lane of PARTNER_DETAIL_TAB_LANES) {
    if (lane.tabKeys.includes(activeTab as PartnerDetailTabKey)) {
      return lane.id;
    }
  }
  return 'file';
}

export function partnerDetailTabLabel(key: string): string {
  const labels: Record<string, string> = {
    overview: 'Overview',
    profile: 'Profile',
    reports: 'Reports',
    analysis: 'Analysis Report',
    evidence: 'Evidence',
    letters: 'Letters',
    tasks: 'Tasks',
    notes: 'Notes',
    debt: 'Debt & Summons',
  };
  return labels[key] ?? key;
}
