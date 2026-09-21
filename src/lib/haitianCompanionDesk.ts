/** Public Haitian desk / Kreyòl companion paths (canonical). */

export const HAITIAN_DESK_LIVE_PATH = '/haitian';
export const HAITIAN_DESK_ALIAS_PATH = '/kreyol';
export const HAITIAN_KIT_PATH = '/free-kreyol-guide';

export function isHaitianDeskPath(pathname: string): boolean {
  const p = (pathname || '').split('?')[0];
  return (
    p === HAITIAN_DESK_LIVE_PATH ||
    p === HAITIAN_DESK_ALIAS_PATH ||
    p.startsWith(`${HAITIAN_DESK_LIVE_PATH}/`) ||
    p === HAITIAN_KIT_PATH ||
    p.startsWith(`${HAITIAN_KIT_PATH}/`)
  );
}
