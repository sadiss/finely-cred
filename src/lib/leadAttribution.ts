const STORAGE_KEY = 'finely.lead_attribution.v1';

export type LeadAttribution = {
  referralCode?: string;
  promoterRole?: string;
  promoType?: string;
  promoAsset?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  /** Overnight50 geo — from ?city= or ?cluster= */
  geoCity?: string;
  geoCluster?: string;
  landingPath?: string;
  capturedAt: string;
};

function load(): LeadAttribution | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LeadAttribution;
  } catch {
    return null;
  }
}

function save(attr: LeadAttribution) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attr));
  } catch {
    /* ignore */
  }
}

/** Read ref + UTM from URL and persist for the session (first-touch). */
export function captureLeadAttributionFromUrl(search: string, pathname = '/') {
  const params = new URLSearchParams(search);
  const ref = params.get('ref')?.trim();
  const promoterRole = (params.get('promoter_role') || params.get('role'))?.trim();
  const promoType = (params.get('promo_type') || params.get('type'))?.trim();
  const promoAsset = (params.get('promo_asset') || params.get('asset') || params.get('service'))?.trim();
  const utmSource = params.get('utm_source')?.trim();
  const utmMedium = params.get('utm_medium')?.trim();
  const utmCampaign = params.get('utm_campaign')?.trim();
  const utmContent = params.get('utm_content')?.trim();
  const geoCity = (params.get('city') || params.get('geo') || params.get('metro'))?.trim();
  const geoCluster = (params.get('cluster') || params.get('dma'))?.trim();

  if (!ref && !promoterRole && !promoType && !promoAsset && !utmSource && !utmMedium && !utmCampaign && !geoCity && !geoCluster) {
    return load();
  }

  const existing = load();
  if (existing?.referralCode && !ref) return existing;

  const attr: LeadAttribution = {
    referralCode: ref || existing?.referralCode,
    promoterRole: promoterRole || existing?.promoterRole,
    promoType: promoType || existing?.promoType,
    promoAsset: promoAsset || existing?.promoAsset,
    utmSource: utmSource || existing?.utmSource,
    utmMedium: utmMedium || existing?.utmMedium,
    utmCampaign: utmCampaign || existing?.utmCampaign,
    utmContent: utmContent || existing?.utmContent,
    geoCity: geoCity || existing?.geoCity,
    geoCluster: geoCluster || existing?.geoCluster,
    landingPath: pathname,
    capturedAt: new Date().toISOString(),
  };
  save(attr);
  return attr;
}

export function getLeadAttribution(): LeadAttribution | null {
  return load();
}

export function buildLeadMagnetUrl(args: {
  basePath?: string;
  referralCode?: string;
  guideId?: string;
  utmSource?: string;
  utmMedium?: string;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://finelycred.com';
  const path = args.basePath ?? '/free-guide';
  const params = new URLSearchParams();
  if (args.referralCode) params.set('ref', args.referralCode);
  if (args.guideId) params.set('guide', args.guideId);
  if (args.utmSource) params.set('utm_source', args.utmSource);
  if (args.utmMedium) params.set('utm_medium', args.utmMedium ?? 'referral');
  const q = params.toString();
  return `${origin}${path}${q ? `?${q}` : ''}`;
}

export function buildPromotedUrl(args: {
  path: string;
  referralCode?: string;
  promoterRole?: string;
  promoType?: string;
  promoAsset?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://finelycred.com';
  const [basePath, existingQuery = ''] = args.path.split('?');
  const params = new URLSearchParams(existingQuery);
  if (args.referralCode) params.set('ref', args.referralCode);
  if (args.promoterRole) params.set('promoter_role', args.promoterRole);
  if (args.promoType) params.set('promo_type', args.promoType);
  if (args.promoAsset) params.set('promo_asset', args.promoAsset);
  if (args.utmSource) params.set('utm_source', args.utmSource);
  if (args.utmMedium) params.set('utm_medium', args.utmMedium);
  if (args.utmCampaign) params.set('utm_campaign', args.utmCampaign);
  const q = params.toString();
  return `${origin}${basePath}${q ? `?${q}` : ''}`;
}

export function buildShortReferralUrl(code: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://finelycred.com';
  return `${origin}/g/${encodeURIComponent(code)}`;
}

export function qrCodeImageUrl(data: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}
