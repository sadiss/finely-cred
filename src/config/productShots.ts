/**
 * Marketing product-shot wiring — Wave 4 / Agent 8.
 *
 * Paths live under `/images/product-shots/`. Prefer real captures from
 * `public/tours/` and guide art already in `public/`. Never label a CSS mock
 * or pending slot as a live product screenshot.
 */

export type ProductShotKind =
  /** Real UI / site capture (demo data, no PII). */
  | 'capture'
  /** Guide / book / brochure art (not the live OS). */
  | 'guide-art'
  /** Canonical path reserved; file not shipped yet — render honest placeholder. */
  | 'pending';

export type ProductShotSlot = {
  id: string;
  /** Public URL path (always under /images/product-shots/). */
  src: string;
  alt: string;
  caption: string;
  kind: ProductShotKind;
  /** Surface this shot is wired onto. */
  surface:
    | 'free-guide'
    | 'career-cs'
    | 'career-agency'
    | 'career-affiliate'
    | 'career-au_seller'
    | 'career-case_help'
    | 'career-real_estate'
    | 'hub-cs'
    | 'hub-affiliate'
    | 'hub-au_seller';
};

const ROOT = '/images/product-shots';

/** Canonical shot inventory + surface map. */
export const PRODUCT_SHOTS = {
  freeGuideDesktop: {
    id: 'free-guide-desktop',
    src: `${ROOT}/free-guide-desktop.png`,
    alt: 'Finely Cred free guide landing — desktop preview',
    caption: 'Free guide · desktop',
    kind: 'capture',
    surface: 'free-guide',
  },
  freeGuideTablet: {
    id: 'free-guide-tablet',
    src: `${ROOT}/free-guide-tablet.png`,
    alt: 'Finely Cred free guide — tablet preview with portal frame',
    caption: 'Free guide · tablet',
    kind: 'capture',
    surface: 'free-guide',
  },
  freeGuidePhone: {
    id: 'free-guide-phone',
    src: `${ROOT}/free-guide-phone.png`,
    alt: 'Finely Cred free guide — phone preview',
    caption: 'Free guide · phone',
    kind: 'capture',
    surface: 'free-guide',
  },
  freeGuidePortalFallback: {
    id: 'free-guide-portal-site',
    src: `${ROOT}/site-personal-credit.png`,
    alt: 'Finely Cred personal credit lane — site capture',
    caption: 'Site capture · personal credit',
    kind: 'capture',
    surface: 'free-guide',
  },
  freeGuideDisputeSpread: {
    id: 'free-guide-dispute-spread',
    src: `${ROOT}/guide-dispute-spread.png`,
    alt: 'Credit dispute letter guide — interior spread',
    caption: 'Guide art · dispute spread',
    kind: 'guide-art',
    surface: 'free-guide',
  },
  freeGuideDisputeCover: {
    id: 'free-guide-dispute-cover',
    src: `${ROOT}/guide-dispute-cover.png`,
    alt: 'Credit dispute letter guide — cover art',
    caption: 'Guide art · dispute cover',
    kind: 'guide-art',
    surface: 'free-guide',
  },
  freeGuideScoreMockup: {
    id: 'free-guide-score-mockup',
    src: `${ROOT}/guide-score-mockup.png`,
    alt: 'Credit score roadmap guide mockup',
    caption: 'Guide art · score mockup',
    kind: 'guide-art',
    surface: 'free-guide',
  },
  analysisElitePath: {
    id: 'analysis-elite-path',
    src: `${ROOT}/analysis-elite-path.png`,
    alt: 'Premium credit analysis report — elite path spread',
    caption: 'Guide art · analysis path',
    kind: 'guide-art',
    surface: 'free-guide',
  },
  careerCs: {
    id: 'career-cs',
    src: `${ROOT}/career-cs-preview.png`,
    alt: 'Credit Specialist careers track preview',
    caption: 'Careers · Credit Specialist',
    kind: 'capture',
    surface: 'career-cs',
  },
  careerAgency: {
    id: 'career-agency',
    src: `${ROOT}/career-agency-preview.png`,
    alt: 'Agency partners careers track preview',
    caption: 'Careers · Agency',
    kind: 'capture',
    surface: 'career-agency',
  },
  careerAffiliate: {
    id: 'career-affiliate',
    src: `${ROOT}/site-fundability.png`,
    alt: 'Affiliate promo surface — fundability site capture',
    caption: 'Affiliate · promo surface',
    kind: 'capture',
    surface: 'career-affiliate',
  },
  careerAuSeller: {
    id: 'career-au-seller',
    src: `${ROOT}/career-au-preview.png`,
    alt: 'AU seller careers track preview',
    caption: 'Careers · AU seller',
    kind: 'capture',
    surface: 'career-au_seller',
  },
  careerAuGuideArt: {
    id: 'career-au-guide-art',
    src: `${ROOT}/guide-tradeline-mockup.png`,
    alt: 'AU seller — tradeline advantage guide mockup',
    caption: 'AU seller · tradeline guide',
    kind: 'guide-art',
    surface: 'career-au_seller',
  },
  careerCaseHelp: {
    id: 'career-case-help',
    src: `${ROOT}/career-case-help-preview.png`,
    alt: 'Case help careers track preview',
    caption: 'Careers · Case help',
    kind: 'capture',
    surface: 'career-case_help',
  },
  careerRealEstate: {
    id: 'career-real-estate',
    src: `${ROOT}/career-real-estate-preview.png`,
    alt: 'Real estate careers track preview',
    caption: 'Careers · Real estate',
    kind: 'capture',
    surface: 'career-real_estate',
  },
  /**
   * Hub marketing frames reuse career-track captures until dedicated hub
   * screenshots ship. Captions stay honest — not labeled as live hub UI.
   */
  hubCs: {
    id: 'hub-cs',
    src: `${ROOT}/career-cs-preview.png`,
    alt: 'Credit Specialist track preview — Specialist Hub opens after join',
    caption: 'Track preview · Specialist',
    kind: 'capture',
    surface: 'hub-cs',
  },
  hubAffiliate: {
    id: 'hub-affiliate',
    src: `${ROOT}/site-fundability.png`,
    alt: 'Affiliate promo surface — Affiliate Hub tools open after signup',
    caption: 'Promo surface · Affiliate',
    kind: 'capture',
    surface: 'hub-affiliate',
  },
  hubAuSeller: {
    id: 'hub-au-seller',
    src: `${ROOT}/career-au-preview.png`,
    alt: 'AU seller track preview — Seller Hub opens after activation',
    caption: 'Track preview · AU seller',
    kind: 'capture',
    surface: 'hub-au_seller',
  },
  siteHome: {
    id: 'site-home',
    src: `${ROOT}/site-home.png`,
    alt: 'Finely Cred homepage — demo capture',
    caption: 'Site · home',
    kind: 'capture',
    surface: 'free-guide',
  },
  siteResources: {
    id: 'site-resources',
    src: `${ROOT}/site-resources.png`,
    alt: 'Finely Cred resources hub — site capture',
    caption: 'Site · resources',
    kind: 'capture',
    surface: 'free-guide',
  },
  guideAgencyBook: {
    id: 'guide-agency-book',
    src: `${ROOT}/guide-agency-book.png`,
    alt: 'Agency launch guide book',
    caption: 'Guide art · agency book',
    kind: 'guide-art',
    surface: 'career-agency',
  },
} as const satisfies Record<string, ProductShotSlot>;

export type ProductShotKey = keyof typeof PRODUCT_SHOTS;

/** Career track → primary marketing shot. */
export const CAREER_PRODUCT_SHOT: Record<
  'credit_specialists' | 'agency_partners' | 'affiliates' | 'au_sellers' | 'case_help' | 'real_estate',
  ProductShotKey
> = {
  credit_specialists: 'careerCs',
  agency_partners: 'careerAgency',
  affiliates: 'careerAffiliate',
  au_sellers: 'careerAuSeller',
  case_help: 'careerCaseHelp',
  real_estate: 'careerRealEstate',
};

/** Free-guide device band (primary row). */
export const FREE_GUIDE_PRODUCT_SHOTS: ProductShotKey[] = [
  'freeGuideDesktop',
  'freeGuideTablet',
  'freeGuidePhone',
];

/** Free-guide materials band (secondary row — guide art that exists on disk). */
export const FREE_GUIDE_MATERIAL_SHOTS: ProductShotKey[] = [
  'freeGuideDisputeCover',
  'freeGuideDisputeSpread',
  'freeGuideScoreMockup',
];

/** Fallback keys when a preferred free-guide file is missing at runtime. */
export const FREE_GUIDE_FALLBACK_SHOTS: ProductShotKey[] = [
  'siteHome',
  'freeGuidePortalFallback',
  'siteResources',
  'freeGuideDisputeSpread',
];

/** Hub deepen / marketing surfaces (reuse track previews until hub captures land). */
export const HUB_PRODUCT_SHOT: Record<'cs' | 'affiliate' | 'au_seller', ProductShotKey> = {
  cs: 'hubCs',
  affiliate: 'hubAffiliate',
  au_seller: 'hubAuSeller',
};

export function getProductShot(key: ProductShotKey): ProductShotSlot {
  return PRODUCT_SHOTS[key];
}

export function productShotPublicPath(filename: string): string {
  return `${ROOT}/${filename.replace(/^\/+/, '')}`;
}

/** Flat shot map for docs / agent handoff. */
export function productShotSurfaceMap(): Array<{
  key: ProductShotKey;
  surface: ProductShotSlot['surface'];
  src: string;
  kind: ProductShotKind;
  wiredOn: string;
}> {
  return (Object.keys(PRODUCT_SHOTS) as ProductShotKey[]).map((key) => {
    const shot = PRODUCT_SHOTS[key];
    let wiredOn = 'inventory only';
    if (key === 'careerAuGuideArt') wiredOn = '/au-sellers → CareerProductShotBand secondary';
    else if (key === 'guideAgencyBook') wiredOn = '/agency-partners → CareerProductShotBand secondary';
    else if (key === 'analysisElitePath') wiredOn = 'inventory only (credit-analysis art copy)';
    else if (FREE_GUIDE_FALLBACK_SHOTS.includes(key) && !FREE_GUIDE_PRODUCT_SHOTS.includes(key) && !FREE_GUIDE_MATERIAL_SHOTS.includes(key))
      wiredOn = '/free-guide fallback row (if primary capture missing)';
    else if (shot.surface === 'free-guide')
      wiredOn = '/free-guide materials stage (FreeGuideMaterialsShowcase) — not a product-shot strip';
    else if (shot.surface.startsWith('career-'))
      wiredOn = 'six careers → CAREER_PRODUCT_SHOT → CareerProductShotBand';
    else if (shot.surface.startsWith('hub-'))
      wiredOn = 'CS/Affiliate/AU hubs → HUB_PRODUCT_SHOT → RoleHubDeepenOverview (track preview)';
    return { key, surface: shot.surface, src: shot.src, kind: shot.kind, wiredOn };
  });
}
