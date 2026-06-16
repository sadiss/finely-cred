/**
 * Public demo / tour videos are admin-only until polished for launch.
 * Admin preview: /admin/tour-studio
 */
export const PUBLIC_DEMO_VIDEOS_ENABLED = false;

export function isAdminMediaPreviewRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

export function canShowPublicDemoVideos(pathname: string): boolean {
  return PUBLIC_DEMO_VIDEOS_ENABLED || isAdminMediaPreviewRoute(pathname);
}
