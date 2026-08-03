import React from 'react';
import type {
  DigitalInviteFoil,
  DigitalInviteSilhouette,
} from '../../config/digitalInviteCardDesign';

interface MotifProps {
  silhouette: DigitalInviteSilhouette;
  width: number;
  height: number;
  foil: DigitalInviteFoil;
}

/**
 * Card artwork: three soft colour blooms plus one solid foil emblem.
 *
 * Deliberately free of engraved line work — no survey grids, guilloche
 * rosettes, statute rules, chevron rails, or bar/graph shapes. Depth comes from
 * overlapping radial washes and a single large silhouette per role, which reads
 * as luxury at card size and still survives a 2x PNG downscale.
 *
 * Rendered as inline SVG with gradients only (no filters, no external assets)
 * so `html-to-image` exports it pixel-identically.
 */
export function InviteCardMotif({ silhouette, width, height, foil }: MotifProps) {
  const uid = React.useId().replace(/:/g, '');
  const id = (name: string) => `fcdc-${name}-${uid}`;

  const emblem = EMBLEM_PLACEMENT[silhouette];
  const scale = (emblem.size * (emblem.of === 'w' ? width : height)) / 100;
  const blooms = BLOOM_PLACEMENT[silhouette];

  return (
    <svg
      className="fcdc-layer fcdc-motif"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={id('accent')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgb(${foil.accentRgb})`} stopOpacity={0.62} />
          <stop offset="52%" stopColor={`rgb(${foil.accentRgb})`} stopOpacity={0.2} />
          <stop offset="100%" stopColor={`rgb(${foil.accentRgb})`} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id('mix')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgb(${foil.mixRgb})`} stopOpacity={0.5} />
          <stop offset="55%" stopColor={`rgb(${foil.mixRgb})`} stopOpacity={0.16} />
          <stop offset="100%" stopColor={`rgb(${foil.mixRgb})`} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id('halo')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgb(${foil.haloRgb})`} stopOpacity={0.34} />
          <stop offset="60%" stopColor={`rgb(${foil.haloRgb})`} stopOpacity={0.1} />
          <stop offset="100%" stopColor={`rgb(${foil.haloRgb})`} stopOpacity={0} />
        </radialGradient>

        {/* Foil the emblem is struck in — light rolls off the top-left. */}
        <linearGradient id={id('foil')} x1="6%" y1="0%" x2="94%" y2="100%">
          <stop offset="0%" stopColor={foil.foilLight} />
          <stop offset="38%" stopColor={foil.foilMid} />
          <stop offset="72%" stopColor={foil.foilDeep} />
          <stop offset="100%" stopColor={foil.foilMid} />
        </linearGradient>

        {/* Wet-glass sweep. A single wide band, never a stripe pattern. */}
        <linearGradient id={id('glass')} x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.16} />
          <stop offset="46%" stopColor="#ffffff" stopOpacity={0.05} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
      </defs>

      {blooms.map((bloom, i) => (
        <ellipse
          key={`bloom-${i}`}
          cx={bloom.x * width}
          cy={bloom.y * height}
          rx={bloom.rx * width}
          ry={bloom.ry * height}
          fill={`url(#${id(bloom.tone)})`}
        />
      ))}

      <g
        opacity={0.19}
        transform={`translate(${emblem.x * width - (scale * 100) / 2} ${
          emblem.y * height - (scale * 100) / 2
        }) scale(${scale})`}
      >
        <Emblem silhouette={silhouette} fill={`url(#${id('foil')})`} maskId={id('emblem-mask')} />
      </g>

      {/* Top-left glass wash tying the blooms together. */}
      <path
        d={`M0 0 H${width} L0 ${height * 0.92} Z`}
        fill={`url(#${id('glass')})`}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------
   Placement — where each role's colour lands and where the emblem is struck.
   ------------------------------------------------------------------------- */

type Bloom = { x: number; y: number; rx: number; ry: number; tone: 'accent' | 'mix' | 'halo' };

const BLOOM_PLACEMENT: Record<DigitalInviteSilhouette, Bloom[]> = {
  estate: [
    { x: 0.04, y: -0.06, rx: 0.62, ry: 0.9, tone: 'accent' },
    { x: 1.02, y: 0.78, rx: 0.5, ry: 0.78, tone: 'mix' },
    { x: 0.7, y: 1.06, rx: 0.55, ry: 0.6, tone: 'halo' },
  ],
  credential: [
    { x: 0.5, y: -0.04, rx: 0.92, ry: 0.36, tone: 'accent' },
    { x: 1.06, y: 0.5, rx: 0.72, ry: 0.42, tone: 'mix' },
    { x: 0.14, y: 1.02, rx: 0.8, ry: 0.34, tone: 'halo' },
  ],
  docket: [
    { x: -0.02, y: 0.1, rx: 0.6, ry: 0.62, tone: 'accent' },
    { x: 1.04, y: 0.94, rx: 0.62, ry: 0.62, tone: 'mix' },
    { x: 0.52, y: -0.06, rx: 0.7, ry: 0.4, tone: 'halo' },
  ],
  ledger: [
    { x: -0.04, y: 0.5, rx: 0.5, ry: 0.95, tone: 'accent' },
    { x: 1.0, y: 0.02, rx: 0.46, ry: 0.7, tone: 'mix' },
    { x: 0.46, y: 1.08, rx: 0.7, ry: 0.55, tone: 'halo' },
  ],
  vault: [
    { x: 0.5, y: 0.04, rx: 0.85, ry: 0.34, tone: 'accent' },
    { x: -0.06, y: 0.62, rx: 0.66, ry: 0.4, tone: 'mix' },
    { x: 0.92, y: 1.0, rx: 0.72, ry: 0.36, tone: 'halo' },
  ],
  tag: [
    { x: 0.02, y: 0.46, rx: 0.5, ry: 0.95, tone: 'accent' },
    { x: 0.9, y: -0.06, rx: 0.52, ry: 0.72, tone: 'mix' },
    { x: 0.62, y: 1.06, rx: 0.6, ry: 0.6, tone: 'halo' },
  ],
  bloom: [
    { x: 0.46, y: 0.1, rx: 0.78, ry: 0.36, tone: 'accent' },
    { x: 1.04, y: 0.66, rx: 0.6, ry: 0.44, tone: 'mix' },
    { x: 0.06, y: 1.02, rx: 0.72, ry: 0.36, tone: 'halo' },
  ],
  gem: [
    { x: 0.08, y: 0.02, rx: 0.6, ry: 0.7, tone: 'mix' },
    { x: 0.96, y: 0.62, rx: 0.56, ry: 0.8, tone: 'accent' },
    { x: 0.4, y: 1.04, rx: 0.66, ry: 0.5, tone: 'halo' },
  ],
};

/** `size` is a fraction of the card's width (`of: 'w'`) or height (`of: 'h'`). */
const EMBLEM_PLACEMENT: Record<
  DigitalInviteSilhouette,
  { x: number; y: number; size: number; of: 'w' | 'h' }
> = {
  estate: { x: 0.79, y: 0.5, size: 0.62, of: 'h' },
  credential: { x: 0.5, y: 0.4, size: 0.66, of: 'w' },
  docket: { x: 0.44, y: 0.5, size: 0.56, of: 'w' },
  ledger: { x: 0.8, y: 0.5, size: 0.66, of: 'h' },
  vault: { x: 0.5, y: 0.37, size: 0.6, of: 'w' },
  tag: { x: 0.78, y: 0.5, size: 0.66, of: 'h' },
  bloom: { x: 0.5, y: 0.38, size: 0.62, of: 'w' },
  gem: { x: 0.77, y: 0.5, size: 0.6, of: 'h' },
};

/* -------------------------------------------------------------------------
   Emblems — solid silhouettes in a 100 x 100 box. No strokes anywhere.
   ------------------------------------------------------------------------- */

function Emblem({
  silhouette,
  fill,
  maskId,
}: {
  silhouette: DigitalInviteSilhouette;
  fill: string;
  maskId: string;
}) {
  switch (silhouette) {
    /** Real estate — a doorway with a struck keyhole. */
    case 'estate':
      return (
        <>
          <mask id={maskId}>
            <rect x="0" y="0" width="100" height="100" fill="#fff" />
            <circle cx="50" cy="56" r="7.5" fill="#000" />
            <path d="M46 58 h8 l-2.4 18 h-3.2 Z" fill="#000" />
          </mask>
          <path
            d="M14 96 V44 A36 36 0 0 1 86 44 V96 Z"
            fill={fill}
            mask={`url(#${maskId})`}
          />
        </>
      );

    /** Credit specialist — credential shield with a struck check. */
    case 'credential':
      return (
        <>
          <mask id={maskId}>
            <rect x="0" y="0" width="100" height="100" fill="#fff" />
            <path d="M33 52 l6.5-6.5 9 9 21-21 6.5 6.5-27.5 27.5 Z" fill="#000" />
          </mask>
          <path
            d="M50 3 L92 19 V52 C92 74 74 90 50 98 C26 90 8 74 8 52 V19 Z"
            fill={fill}
            mask={`url(#${maskId})`}
          />
        </>
      );

    /** Case desk — gavel and sound block. */
    case 'docket':
      return (
        <g>
          <rect x="18" y="86" width="64" height="11" rx="5.5" fill={fill} />
          <g transform="rotate(-38 50 46)">
            <rect x="24" y="38" width="52" height="24" rx="9" fill={fill} />
            <rect x="45" y="60" width="10" height="40" rx="5" fill={fill} />
          </g>
        </g>
      );

    /** Agency — chartered banner with a swallowtail. */
    case 'ledger':
      return (
        <g>
          <rect x="8" y="4" width="9" height="94" rx="4.5" fill={fill} />
          <path d="M20 8 H92 L78 34 L92 60 H20 Z" fill={fill} />
        </g>
      );

    /** AU seller — vault door with bolts and a struck keyhole. */
    case 'vault':
      return (
        <>
          <mask id={maskId}>
            <rect x="0" y="0" width="100" height="100" fill="#fff" />
            <circle cx="50" cy="45" r="8" fill="#000" />
            <path d="M45.5 47 h9 l-2.6 20 h-3.8 Z" fill="#000" />
          </mask>
          <circle cx="50" cy="50" r="44" fill={fill} mask={`url(#${maskId})`} />
          <circle cx="50" cy="2.5" r="4.5" fill={fill} />
          <circle cx="97.5" cy="50" r="4.5" fill={fill} />
          <circle cx="50" cy="97.5" r="4.5" fill={fill} />
          <circle cx="2.5" cy="50" r="4.5" fill={fill} />
        </>
      );

    /**
     * Affiliate — two linked rings. Each ring is a single even-odd path so the
     * overlap reads as interlocking metal rather than one merged blob.
     */
    case 'tag':
      return (
        <g fillRule="evenodd">
          <path d="M33 20 a30 30 0 1 0 0.01 0 Z M33 32 a18 18 0 1 1 -0.01 0 Z" fill={fill} />
          <path d="M67 20 a30 30 0 1 0 0.01 0 Z M67 32 a18 18 0 1 1 -0.01 0 Z" fill={fill} />
        </g>
      );

    /** Personal restore — sunrise over a clean horizon. */
    case 'bloom':
      return (
        <>
          <mask id={maskId}>
            <rect x="0" y="0" width="100" height="100" fill="#fff" />
            <path d="M0 62 H100 V72 H0 Z" fill="#000" />
          </mask>
          <g mask={`url(#${maskId})`}>
            <circle cx="50" cy="44" r="30" fill={fill} />
          </g>
          <path d="M6 96 C24 66 40 66 54 84 C64 96 76 92 94 74 V96 Z" fill={fill} />
        </>
      );

    /** Tradelines — faceted gem. */
    default:
      return (
        <g>
          <path d="M22 24 H78 L94 44 H6 Z" fill={fill} opacity={0.78} />
          <path d="M6 46 H94 L50 96 Z" fill={fill} />
        </g>
      );
  }
}
