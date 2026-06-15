import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  FileBadge,
  FolderOpen,
  Gavel,
  BookOpen,
  Scale,
  KanbanSquare,
  MessageSquare,
  Library,
  Calendar,
  CreditCard,
  ListChecks,
  TrendingUp,
  ShieldAlert,
  MessageCircle,
  Handshake,
  Settings,
} from 'lucide-react';

export type PortalNavLinkDef = {
  path: string;
  label: string;
  icon: LucideIcon;
};

export type PortalNavLaneDef = {
  id: string;
  label: string;
  hint: string;
  accent: 'emerald' | 'amber' | 'sky' | 'violet';
  links: PortalNavLinkDef[];
};

/** Full nav strip — legacy horizontal layout. */
export const PORTAL_PRIMARY_LINKS: PortalNavLinkDef[] = [
  { path: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/portal/reports', label: 'Reports', icon: FileText },
  { path: '/portal/analysis', label: 'Analysis', icon: FileBadge },
  { path: '/portal/documents', label: 'Documents', icon: FolderOpen },
  { path: '/portal/disputes', label: 'Dispute letters', icon: Gavel },
  { path: '/portal/templates', label: 'Letter templates', icon: BookOpen },
  { path: '/portal/debt', label: 'Debt & Summons', icon: Scale },
  { path: '/portal/projects', label: 'Projects & Tasks', icon: KanbanSquare },
  { path: '/portal/messages', label: 'Messages', icon: MessageSquare },
  { path: '/portal/library', label: 'My Library', icon: Library },
  { path: '/portal/calendar', label: 'Calendar', icon: Calendar },
  { path: '/portal/billing', label: 'Billing', icon: CreditCard },
];

export const PORTAL_LETTER_FLOW_LINKS: { path: string; label: string }[] = [
  { path: '/portal/letters', label: 'Letter Studio' },
  { path: '/portal/letters/vault', label: 'Letters Vault' },
  { path: '/portal/disputes', label: 'Dispute Center' },
];

export const PORTAL_MORE_LINKS: PortalNavLinkDef[] = [
  { path: '/account/settings', label: 'Account', icon: Settings },
  { path: '/portal/checklist', label: 'Checklist', icon: ListChecks },
  { path: '/portal/checkout', label: 'Checkout', icon: CreditCard },
  { path: '/portal/build', label: 'Credit Building', icon: TrendingUp },
  { path: '/portal/identity-theft', label: 'Identity Theft', icon: ShieldAlert },
  { path: '/portal/escalations', label: 'Escalations', icon: MessageCircle },
  { path: '/portal/education', label: 'Education', icon: BookOpen },
  { path: '/portal/courses', label: 'Courses', icon: BookOpen },
  { path: '/portal/barter', label: 'Barter Exchange', icon: Handshake },
];

/** Four-lane simple portal nav — default UX (no long horizontal strip). */
export const PORTAL_NAV_LANES: PortalNavLaneDef[] = [
  {
    id: 'work',
    label: 'Work',
    hint: 'Dashboard & files',
    accent: 'emerald',
    links: [
      { path: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/portal/reports', label: 'Reports', icon: FileText },
      { path: '/portal/analysis', label: 'Analysis', icon: FileBadge },
      { path: '/portal/documents', label: 'Documents', icon: FolderOpen },
      { path: '/portal/disputes', label: 'Dispute letters', icon: Gavel },
      { path: '/portal/projects', label: 'Projects & Tasks', icon: KanbanSquare },
      { path: '/portal/checklist', label: 'Checklist', icon: ListChecks },
    ],
  },
  {
    id: 'letters',
    label: 'Letters & debt',
    hint: 'Dispute workflow',
    accent: 'amber',
    links: [
      { path: '/portal/letters', label: 'Letter Studio', icon: Gavel },
      { path: '/portal/letters/vault', label: 'Letters Vault', icon: FolderOpen },
      { path: '/portal/templates', label: 'Letter templates', icon: BookOpen },
      { path: '/portal/debt', label: 'Debt & Summons', icon: Scale },
      { path: '/portal/escalations', label: 'Escalations', icon: MessageCircle },
      { path: '/portal/identity-theft', label: 'Identity Theft', icon: ShieldAlert },
    ],
  },
  {
    id: 'connect',
    label: 'Connect',
    hint: 'Messages & calendar',
    accent: 'sky',
    links: [
      { path: '/portal/messages', label: 'Messages', icon: MessageSquare },
      { path: '/portal/calendar', label: 'Calendar', icon: Calendar },
      { path: '/portal/library', label: 'My Library', icon: Library },
    ],
  },
  {
    id: 'grow',
    label: 'Grow & billing',
    hint: 'Education & upgrades',
    accent: 'violet',
    links: [
      { path: '/portal/education', label: 'Education', icon: BookOpen },
      { path: '/portal/courses', label: 'Courses', icon: BookOpen },
      { path: '/portal/build', label: 'Credit Building', icon: TrendingUp },
      { path: '/portal/barter', label: 'Barter Exchange', icon: Handshake },
      { path: '/portal/billing', label: 'Billing', icon: CreditCard },
      { path: '/portal/checkout', label: 'Checkout', icon: CreditCard },
      { path: '/account/settings', label: 'Account', icon: Settings },
    ],
  },
];

export function resolvePortalNavLaneId(pathname: string): string {
  for (const lane of PORTAL_NAV_LANES) {
    if (lane.links.some((link) => isPortalNavPathActive(pathname, link.path))) {
      return lane.id;
    }
  }
  return 'work';
}

export function isPortalNavPathActive(pathname: string, path: string): boolean {
  if (path === '/portal/disputes') {
    return pathname.startsWith('/portal/disputes') || pathname.startsWith('/portal/letters');
  }
  return pathname === path || (path !== '/portal/dashboard' && pathname.startsWith(`${path}/`));
}
