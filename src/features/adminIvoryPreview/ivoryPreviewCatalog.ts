export type IvoryPreviewSurface = {
  id: string;
  title: string;
  blurb: string;
  path: string;
  livePath?: string;
  status: 'ready' | 'soon';
  accent: 'amber' | 'emerald' | 'violet' | 'sky' | 'fuchsia';
};

/** Surfaces listed on /admin/preview and in the layout-preview shell switcher. */
export const IVORY_PREVIEW_SURFACES: IvoryPreviewSurface[] = [
  {
    id: 'dashboard',
    title: 'Dashboard layout preview',
    blurb: 'Command strip · KPI chips · featured tiles · dense module rows (not a wall of same cards).',
    path: '/admin/preview/dashboard-ivory',
    livePath: '/admin',
    status: 'ready',
    accent: 'amber',
  },
  {
    id: 'marketing-desk',
    title: 'Marketing Desk layout preview',
    blurb: 'Find · Board · Clean · Ruth · Mail desk structure.',
    path: '/admin/preview/marketing-desk-ivory',
    livePath: '/admin/marketing-desk',
    status: 'ready',
    accent: 'emerald',
  },
  {
    id: 'leads',
    title: 'Leads layout preview',
    blurb: 'Owner Leads Ops launcher + ops structure.',
    path: '/admin/preview/leads-ivory',
    livePath: '/admin/leads',
    status: 'ready',
    accent: 'violet',
  },
  {
    id: 'pricing',
    title: 'Pricing layout preview',
    blurb: 'Products & packages catalog structure.',
    path: '/admin/preview/pricing-ivory',
    livePath: '/admin/products',
    status: 'ready',
    accent: 'sky',
  },
  {
    id: 'crm',
    title: 'CRM layout preview',
    blurb: 'CRM pipeline workspace structure.',
    path: '/admin/preview/crm-ivory',
    livePath: '/admin/crm',
    status: 'ready',
    accent: 'fuchsia',
  },
];

export const IVORY_PREVIEW_READY = IVORY_PREVIEW_SURFACES.filter((s) => s.status === 'ready');
