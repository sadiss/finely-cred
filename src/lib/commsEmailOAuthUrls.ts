import type { CommsEmailProviderId } from '../domain/commsEmailProviders';
import type { CommsEmailProvidersConfig } from '../data/commsEmailProviderRepo';

const OAUTH_PATHS: Record<Exclude<CommsEmailProviderId, 'finely_native'>, string> = {
  outlook: '/admin/comms?room=settings&oauth=outlook',
  gmail: '/admin/comms?room=settings&oauth=gmail',
  zoho: '/admin/comms?room=settings&oauth=zoho',
};

/** Register these redirect URIs in each provider's OAuth app console. */
export function buildCommsEmailOAuthRedirectUris(
  cfg?: Pick<CommsEmailProvidersConfig, 'productionSiteUrl'>,
): string[] {
  const origins = new Set<string>();
  if (typeof window !== 'undefined') origins.add(window.location.origin);
  if (cfg?.productionSiteUrl?.trim()) {
    try {
      origins.add(new URL(cfg.productionSiteUrl.trim()).origin);
    } catch {
      /* ignore */
    }
  }
  origins.add('https://finelycred.com');
  origins.add('https://www.finelycred.com');

  const uris: string[] = [];
  for (const origin of origins) {
    for (const path of Object.values(OAUTH_PATHS)) {
      uris.push(`${origin}${path}`);
    }
    uris.push(`${origin}/functions/v1/comms-oauth-callback`);
  }
  return [...new Set(uris)];
}

export function primaryCommsOAuthRedirectUri(
  provider: Exclude<CommsEmailProviderId, 'finely_native'>,
  cfg?: Pick<CommsEmailProvidersConfig, 'productionSiteUrl'>,
): string {
  const path = OAUTH_PATHS[provider];
  if (cfg?.productionSiteUrl?.trim()) {
    try {
      return `${new URL(cfg.productionSiteUrl.trim()).origin}${path}`;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
  return `https://finelycred.com${path}`;
}

export function commsOAuthAuthorizeUrl(provider: Exclude<CommsEmailProviderId, 'finely_native'>): string {
  const redirect = encodeURIComponent(primaryCommsOAuthRedirectUri(provider));
  switch (provider) {
    case 'outlook':
      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=FINELY_OUTLOOK_CLIENT_ID&response_type=code&redirect_uri=${redirect}&scope=${encodeURIComponent('openid email offline_access https://graph.microsoft.com/Mail.Send')}`;
    case 'gmail':
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=FINELY_GMAIL_CLIENT_ID&response_type=code&redirect_uri=${redirect}&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.send')}&access_type=offline`;
    case 'zoho':
      return `https://accounts.zoho.com/oauth/v2/auth?client_id=FINELY_ZOHO_CLIENT_ID&response_type=code&redirect_uri=${redirect}&scope=${encodeURIComponent('ZohoMail.messages.CREATE')}&access_type=offline`;
    default:
      return '#';
  }
}
