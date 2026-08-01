/**
 * Invite URL resolution for the card visuals.
 *
 * The tracked URL contract lives in `src/config/digitalInviteCards.ts`. This
 * shim exists only so the card components stay renderable for roles whose
 * registry entry has not landed yet (Agency / AU seller), and so any caller can
 * inject a promoter-specific URL through the card's `inviteUrl` prop.
 */
import {
  DIGITAL_INVITE_CARDS,
  DIGITAL_INVITE_CARD_SRC,
  DIGITAL_INVITE_PARAM,
  DIGITAL_INVITE_SRC_PARAM,
  buildDigitalInviteCardUrl,
  type DigitalInviteCardRole,
} from '../../config/digitalInviteCards';
import { getDigitalInviteDestPath } from '../../config/digitalInviteCardDesign';

export const INVITE_FALLBACK_ORIGIN = 'https://finelycred.com';

export function inviteOrigin(): string {
  return typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : INVITE_FALLBACK_ORIGIN;
}

export interface ResolveInviteUrlOptions {
  absolute?: boolean;
  extraParams?: Record<string, string>;
}

/** Tracked invite URL for a role, safe for roles not yet in the registry. */
export function resolveInviteUrl(
  role: DigitalInviteCardRole,
  opts: ResolveInviteUrlOptions = {},
): string {
  const registered = (DIGITAL_INVITE_CARDS as Partial<Record<DigitalInviteCardRole, unknown>>)[role];
  if (registered) return buildDigitalInviteCardUrl(role, opts);

  const params = new URLSearchParams();
  params.set(DIGITAL_INVITE_PARAM, role);
  params.set(DIGITAL_INVITE_SRC_PARAM, DIGITAL_INVITE_CARD_SRC);
  for (const [key, value] of Object.entries(opts.extraParams ?? {})) params.set(key, value);
  const path = `${getDigitalInviteDestPath(role)}?${params.toString()}`;
  return opts.absolute ? `${inviteOrigin()}${path}` : path;
}

/** Public brand host printed on cards, regardless of the environment they render in. */
export const INVITE_BRAND_HOST = 'finelycred.com';

/**
 * Short, printable form of an invite URL. Cards always print the production
 * brand host and destination path — never a localhost/preview origin and never
 * the tracking query string.
 */
export function inviteDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url, inviteOrigin());
    return `${INVITE_BRAND_HOST}${parsed.pathname}`.replace(/\/$/, '');
  } catch {
    return INVITE_BRAND_HOST;
  }
}
