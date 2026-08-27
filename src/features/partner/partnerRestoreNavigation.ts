/** Portal vs workspace-light preview paths for the Personal Credit Restore lane. */
export type PartnerRestoreNavigation = {
  reportsPath: string;
  evidencePath: string;
  documentsPath: string;
  disputesPath: string;
  lettersPath: string;
  letterVaultPath: string;
  projectsPath: string;
  dashboardPath: string;
  debtPath: string;
  myTasksPath: string;
  checklistPath: string;
};

export const DEFAULT_PARTNER_RESTORE_NAVIGATION: PartnerRestoreNavigation = {
  reportsPath: '/portal/reports',
  evidencePath: '/portal/evidence',
  documentsPath: '/portal/documents',
  disputesPath: '/portal/disputes',
  lettersPath: '/portal/letters',
  letterVaultPath: '/portal/letters/vault',
  projectsPath: '/portal/projects',
  dashboardPath: '/portal/dashboard',
  debtPath: '/portal/debt',
  myTasksPath: '/portal/my-tasks',
  checklistPath: '/portal/checklist',
};

/** Map a legacy `/portal/*` href to the active restore navigation set. */
export function mapPartnerRestorePortalPath(path: string, nav: PartnerRestoreNavigation): string {
  if (!path) return nav.checklistPath;
  const debtCase = path.match(/^\/portal\/debt\/([^/?#]+)/);
  if (debtCase) return `${nav.debtPath}/${debtCase[1]}`;
  if (path.startsWith('/portal/letters/vault')) return `${nav.letterVaultPath}${path.slice('/portal/letters/vault'.length)}`;
  if (path.startsWith('/portal/letters')) return `${nav.lettersPath}${path.slice('/portal/letters'.length)}`;
  if (path.startsWith('/portal/reports')) return `${nav.reportsPath}${path.slice('/portal/reports'.length)}`;
  if (path.startsWith('/portal/evidence')) return `${nav.evidencePath}${path.slice('/portal/evidence'.length)}`;
  if (path.startsWith('/portal/documents')) return `${nav.documentsPath}${path.slice('/portal/documents'.length)}`;
  if (path.startsWith('/portal/disputes')) return `${nav.disputesPath}${path.slice('/portal/disputes'.length)}`;
  if (path.startsWith('/portal/projects')) return `${nav.projectsPath}${path.slice('/portal/projects'.length)}`;
  if (path.startsWith('/portal/my-tasks')) return `${nav.myTasksPath}${path.slice('/portal/my-tasks'.length)}`;
  if (path.startsWith('/portal/debt')) return `${nav.debtPath}${path.slice('/portal/debt'.length)}`;
  if (path.startsWith('/portal/dashboard')) return `${nav.dashboardPath}${path.slice('/portal/dashboard'.length)}`;
  if (path.startsWith('/portal/checklist')) return `${nav.checklistPath}${path.slice('/portal/checklist'.length)}`;
  return path;
}
