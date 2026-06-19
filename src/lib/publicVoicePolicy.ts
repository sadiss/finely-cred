/** Voice / TTS playback is admin-only until Voice Studio is production-ready on the public site. */
export function isAdminVoiceSurface(pathname: string): boolean {
  return pathname.startsWith('/admin');
}
