import type { MetaIntegrationConfig } from '../domain/metaIntegration';

/** Canonical Meta OAuth redirect URIs — register ALL in Meta App → Facebook Login → Valid OAuth Redirect URIs. */
export function buildMetaOAuthRedirectUris(cfg?: Pick<MetaIntegrationConfig, 'productionSiteUrl' | 'allowedRedirectUris'>): string[] {
  const custom = cfg?.allowedRedirectUris?.filter(Boolean) ?? [];
  if (custom.length) return [...new Set(custom)];

  const origins = new Set<string>();
  if (typeof window !== 'undefined') origins.add(window.location.origin);
  if (cfg?.productionSiteUrl?.trim()) {
    try {
      origins.add(new URL(cfg.productionSiteUrl.trim()).origin);
    } catch {
      /* ignore invalid */
    }
  }
  origins.add('https://finelycred.com');
  origins.add('https://www.finelycred.com');

  const paths = ['/admin/social-hub?tab=settings'];
  const uris: string[] = [];
  for (const origin of origins) {
    for (const path of paths) {
      uris.push(`${origin}${path}`);
    }
  }
  return [...new Set(uris)];
}

export const META_OAUTH_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'leads_retrieval',
].join(',');

export function buildMetaOAuthDialogUrl(appId: string, redirectUri?: string): string {
  const uri = redirectUri ?? primaryMetaOAuthRedirectUri();
  return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(uri)}&scope=${encodeURIComponent(META_OAUTH_SCOPES)}&response_type=code`;
}

/** Starts Facebook Page OAuth. Returns false when the App ID is missing. */
export function startMetaPageOAuth(appId: string, cfg?: Pick<MetaIntegrationConfig, 'productionSiteUrl'>): boolean {
  const id = appId.trim();
  if (!id || id === 'YOUR_META_APP_ID') return false;
  window.location.href = buildMetaOAuthDialogUrl(id, primaryMetaOAuthRedirectUri(cfg));
  return true;
}

export function primaryMetaOAuthRedirectUri(cfg?: Pick<MetaIntegrationConfig, 'productionSiteUrl'>): string {
  if (cfg?.productionSiteUrl?.trim()) {
    try {
      const origin = new URL(cfg.productionSiteUrl.trim()).origin;
      return `${origin}/admin/social-hub?tab=settings`;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/admin/social-hub?tab=settings`;
  }
  return 'https://finelycred.com/admin/social-hub?tab=settings';
}
