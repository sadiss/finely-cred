export type PartnerDetailTabKey =
  | 'overview'
  | 'reports'
  | 'analysis'
  | 'evidence'
  | 'disputes'
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
    tabKeys: ['overview', 'tasks', 'notes'],
  },
  {
    id: 'intel',
    label: 'Intel',
    hint: 'Reports & analysis',
    accent: 'sky',
    tabKeys: ['reports', 'analysis', 'evidence'],
  },
  {
    id: 'disputes',
    label: 'Disputes',
    hint: 'Letters workflow',
    accent: 'amber',
    tabKeys: ['disputes', 'letters'],
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
    reports: 'Reports',
    analysis: 'Analysis Report',
    evidence: 'Evidence',
    disputes: 'Bureaus',
    letters: 'Letters',
    tasks: 'Tasks',
    notes: 'Notes',
    debt: 'Debt & Summons',
  };
  return labels[key] ?? key;
}
