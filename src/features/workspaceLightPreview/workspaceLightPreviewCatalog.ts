import type { WlAccent } from './workspaceLightDesignTokens';

export type WorkspaceLightPreviewSurface = {
  id: string;
  title: string;
  blurb: string;
  path: string;
  livePath?: string;
  status: 'ready' | 'soon';
  accent: WlAccent;
  phase: 1 | 2 | 3;
  pageBed: 'hub' | 'admin' | 'partner' | 'business' | 'seller';
};

export const WORKSPACE_LIGHT_PREVIEW_SURFACES: WorkspaceLightPreviewSurface[] = [
  {
    id: 'admin-dashboard',
    title: 'Admin command dashboard',
    blurb: 'Cool slate-ivory bed · violet command hub · emerald / violet / sky section bands · module group signatures.',
    path: '/preview/workspace-light/admin/dashboard',
    livePath: '/admin',
    status: 'ready',
    accent: 'violet',
    phase: 1,
    pageBed: 'admin',
  },
  {
    id: 'partner-dashboard',
    title: 'Partner restore dashboard',
    blurb: 'Warm pearl bed · emerald command rail · violet overview workstation · rotating launcher tiles.',
    path: '/preview/workspace-light/portal/dashboard',
    livePath: '/portal/dashboard',
    status: 'ready',
    accent: 'emerald',
    phase: 1,
    pageBed: 'partner',
  },
  {
    id: 'letter-studio',
    title: 'Letter Studio',
    blurb: 'Violet writing bench — editor focus shell on ivory.',
    path: '/preview/workspace-light/portal/letters',
    livePath: '/portal/letters',
    status: 'soon',
    accent: 'violet',
    phase: 2,
    pageBed: 'partner',
  },
  {
    id: 'debt-center',
    title: 'Debt center',
    blurb: 'Rose validation lane — coaches and filing links on light bed.',
    path: '/preview/workspace-light/portal/debt',
    livePath: '/portal/debt',
    status: 'soon',
    accent: 'rose',
    phase: 2,
    pageBed: 'partner',
  },
  {
    id: 'ops-queue',
    title: 'Ops command center',
    blurb: 'Sky triage bench — queue rows with SLA state accents.',
    path: '/preview/workspace-light/admin/workflow',
    livePath: '/admin/workflow',
    status: 'soon',
    accent: 'sky',
    phase: 2,
    pageBed: 'admin',
  },
  {
    id: 'business-dashboard',
    title: 'Business dashboard',
    blurb: 'Entity fundability, vendor tiers, and business bureau progress.',
    path: '/preview/workspace-light/portal/business',
    livePath: '/business/dashboard',
    status: 'ready',
    accent: 'navy',
    phase: 2,
    pageBed: 'business',
  },
  {
    id: 'seller-dashboard',
    title: 'Tradelines & AU orders',
    blurb: 'Authorized user marketplace and order tracking — seller hub preview lives on the partner lane.',
    path: '/preview/workspace-light/portal/tradelines',
    livePath: '/seller/dashboard',
    status: 'soon',
    accent: 'fuchsia',
    phase: 2,
    pageBed: 'seller',
  },
];

export const WORKSPACE_LIGHT_PREVIEW_READY = WORKSPACE_LIGHT_PREVIEW_SURFACES.filter((s) => s.status === 'ready');

/**
 * The two workspaces a person can actually be in. The review toolbar switches between these
 * only.
 *
 * It used to switch between every `ready` surface, which meant Partner, Business and Tradelines
 * each got their own button — and since the label logic printed anything non-admin as
 * "Partner", the bar read "Admin · Partner · Partner" and looked like three rival partner apps.
 * Business and Tradelines are pages inside the partner workspace, reachable from its own
 * navigation, so they do not belong in a workspace switcher.
 */
export const WORKSPACE_LIGHT_PREVIEW_LANES = [
  { id: 'partner-dashboard', label: 'Partner portal', path: '/preview/workspace-light/portal/dashboard', prefix: '/preview/workspace-light/portal' },
  { id: 'admin-dashboard', label: 'Admin workspace', path: '/preview/workspace-light/admin/dashboard', prefix: '/preview/workspace-light/admin' },
] as const;

export const WORKSPACE_LIGHT_PREVIEW_HUB_PATH = '/preview/workspace-light';
