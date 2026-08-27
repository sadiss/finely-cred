import { useCallback } from 'react';
import { useLocation, useNavigate, type NavigateOptions, type To } from 'react-router-dom';
import {
  getWorkspaceProductNavigationMode,
  resolveWorkspaceProductPath,
} from '../workspaceProductNav';
import type { WorkspaceProductRole } from '../workspaceProductTokens';

function useWorkspaceProductPathResolver(role: WorkspaceProductRole) {
  const { pathname } = useLocation();
  const mode = getWorkspaceProductNavigationMode(pathname);

  return useCallback(
    (href: string) => resolveWorkspaceProductPath(role, href, mode),
    [mode, role],
  );
}

/**
 * Preview surfaces stay inside the review shell; the same workstation on a canonical route
 * keeps canonical `/portal/*` (or `/business/*`) links. Accepts either a live path or a
 * leftover `/preview/workspace-light/...` href so live partners are never sent into preview.
 */
export function usePartnerProductPathResolver() {
  return useWorkspaceProductPathResolver('partner');
}

/** Admin equivalent — preview stays in preview, live stays on `/admin/*`. */
export function useAdminProductPathResolver() {
  return useWorkspaceProductPathResolver('admin');
}

/** Navigate through the partner/admin path resolver so leftover preview hrefs never leak on live routes. */
export function useMappedWorkspaceNavigate(role: WorkspaceProductRole) {
  const rawNavigate = useNavigate();
  const resolve = useWorkspaceProductPathResolver(role);
  return useCallback(
    ((to: To, options?: NavigateOptions) => {
      if (typeof to === 'string') return rawNavigate(resolve(to), options);
      return rawNavigate(to, options);
    }) as ReturnType<typeof useNavigate>,
    [rawNavigate, resolve],
  );
}

export function useMappedPartnerNavigate() {
  return useMappedWorkspaceNavigate('partner');
}

export function useMappedAdminNavigate() {
  return useMappedWorkspaceNavigate('admin');
}
