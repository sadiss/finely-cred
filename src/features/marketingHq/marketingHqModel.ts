/** Marketing Command Floor — departments → channel desks → roles (not top-level nav). */

export type MarketingChannelId = 'email' | 'social' | 'sms' | 'paid' | 'content' | 'direct-mail';

export type DeskRole = 'Director' | 'Specialist' | 'VA';

export type SendStatus = 'send' | 'hold' | 'draft' | 'scheduled';

export type MarketingDepartmentId =
  | 'growth-acquisition'
  | 'partner-referral'
  | 'haitian-kreyol'
  | 'nurture-lifecycle'
  | 'brand-creative'
  | 'performance-analytics'
  | 'direct-mail';

export type MarketingChannelDesk = {
  id: MarketingChannelId;
  label: string;
  short: string;
  comingSoon?: boolean;
};

export type MarketingDepartment = {
  id: MarketingDepartmentId;
  name: string;
  floorLabel: string;
  tagline: string;
  channels: MarketingChannelDesk[];
  comingSoon?: boolean;
};

export type MarketingQueueItem = {
  id: string;
  title: string;
  status: SendStatus;
  ownerRole: DeskRole;
  dueLabel: string;
};

export type MarketingCampaign = {
  id: string;
  name: string;
  status: SendStatus;
  ownerRole: DeskRole;
  packageId?: string;
  publicPath?: string;
  note?: string;
};

export type MarketingAsset = {
  id: string;
  name: string;
  type: string;
  updated: string;
};

export type MarketingRoomSnapshot = {
  departmentId: MarketingDepartmentId;
  channelId: MarketingChannelId;
  queue: MarketingQueueItem[];
  campaigns: MarketingCampaign[];
  assets: MarketingAsset[];
  wiredTools: { label: string; path: string }[];
};

export const MARKETING_DEPARTMENTS: MarketingDepartment[] = [
  {
    id: 'growth-acquisition',
    name: 'Growth Acquisition',
    floorLabel: 'Floor 1',
    tagline: 'Demand, starters, and top-of-funnel conversion.',
    channels: [
      { id: 'email', label: 'Email Desk', short: 'Email' },
      { id: 'social', label: 'Social Desk', short: 'Social' },
      { id: 'sms', label: 'SMS Desk', short: 'SMS' },
      { id: 'paid', label: 'Paid Ads Desk', short: 'Paid' },
      { id: 'content', label: 'SEO & Content Desk', short: 'Content' },
    ],
  },
  {
    id: 'partner-referral',
    name: 'Partner Referral Marketing',
    floorLabel: 'Floor 2',
    tagline: 'Agents, affiliates, and partner-sourced demand.',
    channels: [
      { id: 'email', label: 'Email Desk', short: 'Email' },
      { id: 'social', label: 'Social Desk', short: 'Social' },
      { id: 'content', label: 'Partner Playbooks', short: 'Content' },
    ],
  },
  {
    id: 'haitian-kreyol',
    name: 'Haitian / Kreyòl Corridor',
    floorLabel: 'Floor 3',
    tagline: 'Kreyòl-first community desk and kit funnels.',
    channels: [
      { id: 'email', label: 'Email Desk', short: 'Email' },
      { id: 'social', label: 'Social Desk', short: 'Social' },
      { id: 'sms', label: 'SMS Desk', short: 'SMS' },
      { id: 'content', label: 'Kreyòl Content', short: 'Content' },
    ],
  },
  {
    id: 'nurture-lifecycle',
    name: 'Nurture & Lifecycle',
    floorLabel: 'Floor 4',
    tagline: 'Sequences, onboarding, and upgrade paths.',
    channels: [
      { id: 'email', label: 'Email Desk', short: 'Email' },
      { id: 'sms', label: 'SMS Desk', short: 'SMS' },
      { id: 'content', label: 'Lifecycle Content', short: 'Content' },
    ],
  },
  {
    id: 'brand-creative',
    name: 'Brand & Creative',
    floorLabel: 'Floor 5',
    tagline: 'Visual system, media studio, and brand lock.',
    channels: [
      { id: 'content', label: 'Brand & Copy', short: 'Content' },
      { id: 'social', label: 'Social Templates', short: 'Social' },
      { id: 'email', label: 'Email Templates', short: 'Email' },
    ],
  },
  {
    id: 'performance-analytics',
    name: 'Performance Analytics',
    floorLabel: 'Floor 6',
    tagline: 'Attribution, experiments, and funnel health.',
    channels: [
      { id: 'content', label: 'Reporting & SEO', short: 'Content' },
      { id: 'paid', label: 'Paid Performance', short: 'Paid' },
      { id: 'email', label: 'Email Analytics', short: 'Email' },
    ],
  },
  {
    id: 'direct-mail',
    name: 'Direct Mail',
    floorLabel: 'Floor 7',
    tagline: 'Physical mail — partner network & vendor connect (planned).',
    comingSoon: true,
    channels: [{ id: 'direct-mail', label: 'Direct Mail Room', short: 'Mail', comingSoon: true }],
  },
];

export const START_RESTORE_CAMPAIGN: MarketingCampaign = {
  id: 'camp_start_restore_147',
  name: 'Start Restore — $147 starter',
  status: 'send',
  ownerRole: 'Director',
  packageId: 'start_restore_147',
  publicPath: '/start',
  note: 'Live consumer starter — credits to Core within 7 days. Not Core membership pricing.',
};

function baseRoom(deptId: MarketingDepartmentId, channelId: MarketingChannelId): MarketingRoomSnapshot {
  const dept = getDepartment(deptId);
  const channel = dept?.channels.find((c) => c.id === channelId);
  const wired: MarketingRoomSnapshot['wiredTools'] = [
    { label: 'Comms Studio', path: '/admin/comms' },
    { label: 'Automations', path: '/admin/automations' },
  ];
  if (deptId === 'growth-acquisition' || deptId === 'performance-analytics') {
    wired.push({ label: 'Lead Intel', path: '/admin/lead-intel' });
  }
  if (deptId === 'brand-creative') {
    wired.push({ label: 'Media Studio', path: '/admin/media-studio' });
  }
  if (deptId === 'haitian-kreyol') {
    wired.push({ label: 'Public Kreyòl kit', path: '/free-kreyol-guide' });
    wired.push({ label: 'Haitian desk', path: '/haitian' });
  }

  const queue: MarketingQueueItem[] = [
    {
      id: 'q1',
      title: `Review ${channel?.short ?? 'channel'} send calendar`,
      status: 'scheduled',
      ownerRole: 'Director',
      dueLabel: 'Today 4:00 PM',
    },
    {
      id: 'q2',
      title: 'Approve hold queue — compliance language',
      status: 'hold',
      ownerRole: 'Specialist',
      dueLabel: 'Today',
    },
    {
      id: 'q3',
      title: 'Stage assets for next send window',
      status: 'draft',
      ownerRole: 'VA',
      dueLabel: 'Tomorrow',
    },
  ];

  const campaigns: MarketingCampaign[] = [];
  if (deptId === 'growth-acquisition' && (channelId === 'email' || channelId === 'social')) {
    campaigns.push(START_RESTORE_CAMPAIGN);
  }
  if (deptId === 'haitian-kreyol' && channelId === 'social') {
    campaigns.push({
      id: 'camp_kreyol_kit',
      name: 'Free Kreyòl kit unlock',
      status: 'send',
      ownerRole: 'Specialist',
      publicPath: '/free-kreyol-guide',
    });
  }
  if (deptId === 'nurture-lifecycle' && channelId === 'email') {
    campaigns.push({
      id: 'camp_core_upgrade',
      name: '7-day Start Restore → Core upgrade',
      status: 'scheduled',
      ownerRole: 'Director',
      note: 'Triggered when start_restore_147 purchase detected.',
    });
  }

  const assets: MarketingAsset[] = [
    { id: 'a1', name: 'Finely medallion mark', type: 'Brand', updated: 'Locked' },
    { id: 'a2', name: `${dept?.name} — ${channel?.short} template pack`, type: 'Template', updated: 'This week' },
  ];

  if (campaigns.some((c) => c.id === START_RESTORE_CAMPAIGN.id)) {
    assets.unshift({
      id: 'a_sr',
      name: 'Start Restore /start page + hero CTA',
      type: 'Landing',
      updated: 'Live',
    });
  }

  return {
    departmentId: deptId,
    channelId,
    queue,
    campaigns,
    assets,
    wiredTools: wired,
  };
}

export function getDepartment(id: string): MarketingDepartment | undefined {
  return MARKETING_DEPARTMENTS.find((d) => d.id === id);
}

export function getRoomSnapshot(deptId: MarketingDepartmentId, channelId: MarketingChannelId): MarketingRoomSnapshot {
  if (deptId === 'direct-mail') {
    return {
      departmentId: deptId,
      channelId: 'direct-mail',
      queue: [
        {
          id: 'dm1',
          title: 'Partner network mail routes — not connected',
          status: 'hold',
          ownerRole: 'Director',
          dueLabel: 'Future',
        },
      ],
      campaigns: [],
      assets: [{ id: 'dm_brief', name: 'Vendor connect brief (internal)', type: 'Brief', updated: 'Draft' }],
      wiredTools: [{ label: 'Vendors (admin)', path: '/admin/vendors' }],
    };
  }
  return baseRoom(deptId, channelId);
}

/** Legacy aliases for admin/marketing OS wiring */
export const marketingDepartments = MARKETING_DEPARTMENTS;
export type MarketingDesk = MarketingChannelDesk;
export type MarketingDepartmentFloor = MarketingDepartment;
