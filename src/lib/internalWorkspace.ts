/** Sentinel partnerId for internal staff/team threads (not tied to a client partner). */
export const FINELY_INTERNAL_WORKSPACE_ID = '__finely_internal_workspace__';

export function isInternalWorkspacePartnerId(partnerId: string | undefined | null): boolean {
  return partnerId === FINELY_INTERNAL_WORKSPACE_ID;
}
