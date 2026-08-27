/**
 * Single source for admin role-preview: every product lane from the capability matrix
 * plus live preview entry paths. AdminRolePreviewPage and the floating switcher both read this.
 */

import type { RoleCapabilityRole } from './roleCapabilityMatrix';
import { ROLE_CAPABILITY_MATRIX } from './roleCapabilityMatrix';
import { AGENCY } from './agencyPartnersProgram';
import { CASE_HELP } from './caseHelpProgram';
import { RE } from './realEstateProgram';
import { AF } from './affiliateProgram';
import { CS } from './creditSpecialistProgram';
import { AU_SELLER } from './auSellerProgram';

export type RolePreviewRole = RoleCapabilityRole;

export type RolePreviewEntry = {
  role: RolePreviewRole;
  label: string;
  shortLabel: string;
  /** Live lane entry — admin role preview navigates here. */
  previewPath: string;
  /** Workspace-light preview shell page id (partner/admin product surface). */
  previewPageId: string | null;
  /** Review-shell URL when a matching product surface exists. */
  workspacePreviewPath: string | null;
  studioPath: string;
  accent: 'violet' | 'fuchsia' | 'emerald' | 'sky' | 'rose';
};

const SHORT_LABELS: Record<RolePreviewRole, string> = {
  partner: 'Partner',
  heta_society: 'HOS',
  business: 'Business',
  agent: 'Specialist',
  affiliate: 'Affiliate',
  real_estate: 'RE',
  agency: 'Agency',
  case_help: 'Case Help',
  au_seller: 'AU seller',
  au_buyer: 'AU buyer',
  admin: 'Admin',
};

const PREVIEW_PATHS: Record<RolePreviewRole, string> = {
  partner: '/portal/dashboard',
  heta_society: '/portal/hos',
  business: '/business/dashboard',
  agent: CS.hubPath,
  affiliate: AF.hubPath,
  real_estate: RE.hubPath,
  agency: AGENCY.hubPath,
  case_help: CASE_HELP.hubPath,
  au_seller: AU_SELLER.hubPath,
  au_buyer: '/au/marketplace',
  admin: '/admin',
};

/** Product surface page ids inside `/preview/workspace-light/...` for each lane. */
const PREVIEW_PAGE_IDS: Record<RolePreviewRole, string | null> = {
  partner: 'dashboard',
  heta_society: 'hos-hub',
  business: 'business',
  agent: 'specialist-hub',
  affiliate: 'affiliate-hub',
  real_estate: 'real-estate-hub',
  agency: 'agency-hub',
  case_help: 'case-help-hub',
  au_seller: 'au-seller',
  au_buyer: 'au-marketplace',
  admin: 'dashboard',
};

const ACCENTS: Record<RolePreviewRole, RolePreviewEntry['accent']> = {
  partner: 'sky',
  heta_society: 'rose',
  business: 'emerald',
  agent: 'fuchsia',
  affiliate: 'violet',
  real_estate: 'emerald',
  agency: 'sky',
  case_help: 'fuchsia',
  au_seller: 'emerald',
  au_buyer: 'sky',
  admin: 'violet',
};

/** Display order for tabs and the floating switcher — driven from the capability matrix. */
export const ROLE_PREVIEW_ORDER: RolePreviewRole[] = ROLE_CAPABILITY_MATRIX.map((row) => row.role);

function workspacePreviewPathForRole(role: RolePreviewRole, pageId: string | null): string | null {
  if (!pageId) return null;
  if (role === 'admin') return `/preview/workspace-light/admin/${pageId}`;
  return `/preview/workspace-light/portal/${pageId}`;
}

export function rolePreviewEntry(role: RolePreviewRole): RolePreviewEntry {
  const matrix = ROLE_CAPABILITY_MATRIX.find((r) => r.role === role);
  const previewPageId = PREVIEW_PAGE_IDS[role];
  return {
    role,
    label: matrix?.label ?? SHORT_LABELS[role],
    shortLabel: SHORT_LABELS[role],
    previewPath: PREVIEW_PATHS[role],
    previewPageId,
    workspacePreviewPath: workspacePreviewPathForRole(role, previewPageId),
    studioPath: `/admin/role-preview?role=${role}`,
    accent: ACCENTS[role],
  };
}

export function allRolePreviewEntries(): RolePreviewEntry[] {
  return ROLE_PREVIEW_ORDER.map(rolePreviewEntry);
}

export function parseRolePreviewRole(raw: string | null | undefined): RolePreviewRole {
  const key = (raw || '').trim().toLowerCase();
  if (ROLE_PREVIEW_ORDER.includes(key as RolePreviewRole)) return key as RolePreviewRole;
  return 'partner';
}
