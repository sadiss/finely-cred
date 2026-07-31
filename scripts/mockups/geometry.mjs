/**
 * Premium Mockup Pipeline — geometry constants (art bible).
 * Source: plan premium_mockup_pipeline
 */

/** Relative to cover height H / cover width W */
export const GEOMETRY = Object.freeze({
  /** Cover thickness (spine depth) as fraction of H — magazine / soft guide */
  spineDepthMin: 0.025,
  spineDepthMax: 0.04,
  spineDepthDefault: 0.032,

  /** Rear page height vs cover height — full-bleed behind */
  pageHeightMin: 0.96,
  pageHeightMax: 1.0,
  pageHeightDefault: 0.98,

  /** Outer peek of each rear page beyond cover edge (fraction of cover width) */
  peekWidthMin: 0.12,
  peekWidthMax: 0.18,
  peekWidthDefault: 0.15,

  /** Gentle 3/4 yaw (degrees); negative = cover leans slightly left */
  yawMinDeg: -14,
  yawMaxDeg: -8,
  yawDefaultDeg: -11,

  /** Extra degrees of yaw for rear pages (page2 more than page1) */
  page1YawBiasDeg: 1.2,
  page2YawBiasDeg: 2.4,

  /** Fan: page2 further back / up-right than page1 (fractions of cover W/H) */
  page1RightExtra: 0.0,
  page2RightExtra: 0.045,
  page1UpExtra: 0.012,
  page2UpExtra: 0.028,

  /** Soft contact shadow */
  shadowOpacity: 0.42,
  shadowBlurPxAt1600: 48,
  shadowExpandBottomFrac: 0.055,
  shadowExpandXFrac: 0.04,
  shadowRxFracOfW: 0.42,
  shadowRyFracOfExpand: 0.72,

  /** Tight transparent canvas margins around product bbox */
  marginMin: 0.03,
  marginMax: 0.05,
  marginDefault: 0.04,

  /** Default render height for cover (px) when caller omits */
  defaultCoverHeight: 1600,

  /** Dark hero QA plate (landing void) */
  heroDarkRgb: Object.freeze({ r: 3, g: 5, b: 4 }),

  /** Magenta QA plate */
  magentaRgb: Object.freeze({ r: 255, g: 0, b: 200 }),
});

/** Clamp helper for agent overrides */
export function clampGeometry(partial = {}) {
  const g = { ...GEOMETRY, ...partial };
  g.spineDepthDefault = Math.min(
    GEOMETRY.spineDepthMax,
    Math.max(GEOMETRY.spineDepthMin, g.spineDepthDefault ?? GEOMETRY.spineDepthDefault),
  );
  g.pageHeightDefault = Math.min(
    GEOMETRY.pageHeightMax,
    Math.max(GEOMETRY.pageHeightMin, g.pageHeightDefault ?? GEOMETRY.pageHeightDefault),
  );
  g.peekWidthDefault = Math.min(
    GEOMETRY.peekWidthMax,
    Math.max(GEOMETRY.peekWidthMin, g.peekWidthDefault ?? GEOMETRY.peekWidthDefault),
  );
  g.marginDefault = Math.min(
    GEOMETRY.marginMax,
    Math.max(GEOMETRY.marginMin, g.marginDefault ?? GEOMETRY.marginDefault),
  );
  return g;
}
