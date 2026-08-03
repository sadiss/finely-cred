/**
 * Digital invite card DESIGN layer — visual identity per role.
 *
 * Ownership split:
 * - `src/config/digitalInviteCards.ts` (role ids, destination paths, tracked URL
 *   contract, join bonuses) is the tracking SSOT. This file never redefines those.
 * - This file adds the *visual* contract: silhouette, canvas size, colour mix,
 *   emblem, and the on-card copy. Card components read from here only.
 *
 * Art direction: liquid jewel ink. Every card is a deep three-hue colour wash
 * with a soft foil emblem and a wet gloss highlight — no engraved line work, no
 * guilloche rosettes, no survey grids, no bar/graph motifs. Roles stay apart
 * through four levers at once: card shape, colour mix, emblem, and title scale.
 */
import type { FinelyOsPublicAccent } from '../features/os/finelyOsLightUi';
import {
  DIGITAL_INVITE_CARDS,
  type DigitalInviteCardBonus,
  type DigitalInviteCardRole,
} from './digitalInviteCards';

/** Physical shape of the card. One per role, never shared. */
export type DigitalInviteSilhouette =
  /** Landscape property placard — notched top-right corner. */
  | 'estate'
  /** Portrait credential pass — punched lanyard slot. */
  | 'credential'
  /** Square case ticket — foil stub band down the left edge. */
  | 'docket'
  /** Wide charter banner — chevron cut on the trailing edge. */
  | 'ledger'
  /** Arched portrait vault door. */
  | 'vault'
  /** Landscape share tag — rounded leading end with a punched eyelet. */
  | 'tag'
  /** Portrait leaf — opposite corners drawn into a soft petal. */
  | 'bloom'
  /** Landscape gem — chamfered corners on the diagonal. */
  | 'gem';

/** Copy layout the card body uses. Silhouettes map onto one of the three. */
export type DigitalInviteLayout = 'landscape' | 'portrait' | 'square';

/**
 * What the card is asking for. `join` cards recruit a partner into a track;
 * `service` cards are handed to someone the partner is helping.
 */
export type DigitalInviteKind = 'join' | 'service';

/**
 * Colour + foil mix. Values are raw CSS so they can be pushed straight into
 * custom properties on the card root and consumed by `digitalInviteCards.css`.
 */
export interface DigitalInviteFoil {
  /** Deepest base ink (card corners). */
  inkDeep: string;
  /** Mid ink (card centre wash). */
  ink: string;
  /** Brightest foil highlight. */
  foilLight: string;
  /** Foil body — the colour a viewer reads as "gold" / "platinum" / "rose". */
  foilMid: string;
  /** Foil shadow, gives the stamped-metal roll. */
  foilDeep: string;
  /** Lead hue, `r, g, b`. Blooms from the top-left and drives accent glows. */
  accentRgb: string;
  /** Second hue, `r, g, b`. Blooms from the trailing edge — the colour *mix*. */
  mixRgb: string;
  /** Foil hue, `r, g, b`. Warm/cool bounce along the bottom + rim light. */
  haloRgb: string;
}

export interface DigitalInviteDesign {
  role: DigitalInviteCardRole;
  silhouette: DigitalInviteSilhouette;
  layout: DigitalInviteLayout;
  kind: DigitalInviteKind;
  /** Design-space canvas in px. Cards render at this size and scale to fit. */
  width: number;
  height: number;
  /** Finely OS public accent, so surrounding page chrome can match the card. */
  accent: FinelyOsPublicAccent;
  foil: DigitalInviteFoil;

  /** Small caps line above the role title. */
  eyebrow: string;
  /** Role title as printed on the card (may differ from the tracking title). */
  roleTitle: string;
  /** Optional second line of the title for portrait silhouettes. */
  roleTitleSub?: string;
  /** Printed title size in design px. */
  titleSize: number;
  /** QR edge length in design px. */
  qrSize: number;
  /** Single sentence value prop. Keep under ~92 characters. */
  valueProp: string;
  /** Two-to-three character foil monogram struck into the card. */
  monogram: string;
  /** Caption ringed under the embossed seal. */
  sealCaption: string;
  /** Three micro proof chips. */
  proofPoints: string[];
  /** Call to action beside the QR. */
  qrCue: string;
  /** Secondary line under the QR cue. */
  qrSubCue: string;
  /** Compliance footnote printed small on the card. */
  compliance: string;
  /** Fallback blurb if the tracking registry has no bonus for this role yet. */
  incentiveFallback: string;
  /** Heading used by the mounted share block on public pages. */
  shareHeading: string;
  /** One-line pitch for the share block. */
  shareBlurb: string;
}

/* -------------------------------------------------------------------------
   Colour mixes — each is a three-hue wash, not a recolour of one template.
   ------------------------------------------------------------------------- */

/** Real estate — jade field, warm champagne foil, teal bounce. */
const MIX_VERDANT_GOLD: DigitalInviteFoil = {
  inkDeep: '#02150f',
  ink: '#073328',
  foilLight: '#fff6dc',
  foilMid: '#e8c684',
  foilDeep: '#8a6524',
  accentRgb: '16, 185, 129',
  mixRgb: '20, 184, 166',
  haloRgb: '232, 198, 132',
};

/** Credit specialist — amethyst core, indigo mix, platinum foil. */
const MIX_AMETHYST_AURORA: DigitalInviteFoil = {
  inkDeep: '#0a0620',
  ink: '#1d1046',
  foilLight: '#fbf8ff',
  foilMid: '#cfc6f2',
  foilDeep: '#6d5fae',
  accentRgb: '139, 92, 246',
  mixRgb: '236, 72, 153',
  haloRgb: '207, 198, 242',
};

/** Case desk — plum chamber, magenta mix, antique gold foil. */
const MIX_COURT_PLUM: DigitalInviteFoil = {
  inkDeep: '#140418',
  ink: '#320c36',
  foilLight: '#ffeed2',
  foilMid: '#e2b673',
  foilDeep: '#8c5a26',
  accentRgb: '217, 70, 239',
  mixRgb: '244, 114, 182',
  haloRgb: '226, 182, 115',
};

/** Agency — cobalt hull, cyan mix, chrome foil. */
const MIX_COBALT_CHROME: DigitalInviteFoil = {
  inkDeep: '#020d1c',
  ink: '#062a4b',
  foilLight: '#f6fbff',
  foilMid: '#bcd6ea',
  foilDeep: '#59809d',
  accentRgb: '56, 189, 248',
  mixRgb: '99, 102, 241',
  haloRgb: '188, 214, 234',
};

/** AU seller — bullion field, copper mix, warm gold foil. */
const MIX_BULLION_COPPER: DigitalInviteFoil = {
  inkDeep: '#170d02',
  ink: '#37220a',
  foilLight: '#fff4c8',
  foilMid: '#edc464',
  foilDeep: '#906812',
  accentRgb: '245, 158, 11',
  mixRgb: '234, 88, 12',
  haloRgb: '237, 196, 100',
};

/** Affiliate — coral signal, magenta mix, rose-gold foil. */
const MIX_CORAL_SIGNAL: DigitalInviteFoil = {
  inkDeep: '#1a0512',
  ink: '#3d0d2a',
  foilLight: '#ffeae2',
  foilMid: '#f0b39c',
  foilDeep: '#9c5340',
  accentRgb: '244, 63, 94',
  mixRgb: '249, 115, 22',
  haloRgb: '240, 179, 156',
};

/** Personal restore — tidewater cyan, sea-green mix, pearl foil. */
const MIX_TIDEWATER_PEARL: DigitalInviteFoil = {
  inkDeep: '#021418',
  ink: '#053540',
  foilLight: '#f2fdff',
  foilMid: '#a9e6e4',
  foilDeep: '#3f8b8c',
  accentRgb: '34, 211, 238',
  mixRgb: '52, 211, 153',
  haloRgb: '169, 230, 228',
};

/** Tradelines — obsidian field, violet mix, champagne foil. */
const MIX_OBSIDIAN_GOLD: DigitalInviteFoil = {
  inkDeep: '#08070c',
  ink: '#191426',
  foilLight: '#fff8e3',
  foilMid: '#dcc48f',
  foilDeep: '#7d6634',
  accentRgb: '250, 204, 21',
  mixRgb: '129, 140, 248',
  haloRgb: '220, 196, 143',
};

const CAREERS_COMPLIANCE =
  'Results vary · not an employment offer · affiliation subject to review';

export const DIGITAL_INVITE_CARD_DESIGNS: Record<DigitalInviteCardRole, DigitalInviteDesign> = {
  re: {
    role: 're',
    silhouette: 'estate',
    layout: 'landscape',
    kind: 'join',
    width: 1120,
    height: 700,
    accent: 'emerald',
    foil: MIX_VERDANT_GOLD,
    eyebrow: 'Real Estate Partner Invite',
    roleTitle: 'Real Estate Partner',
    titleSize: 72,
    qrSize: 196,
    valueProp: 'Send declined buyers to us — we build their fundability, you keep the closing.',
    monogram: 'RE',
    sealCaption: 'Underwriting Readiness',
    proofPoints: ['Buyer readiness reviews', 'Co-branded partner assets', 'Tracked referral pipeline'],
    qrCue: 'Join via this invite',
    qrSubCue: 'Scan to open your partner application',
    compliance: `${CAREERS_COMPLIANCE} · funding subject to underwriting`,
    incentiveFallback: 'Priority onboarding call for partners who join through this card.',
    shareHeading: 'Your real estate partner card',
    shareBlurb:
      'Hand this to an agent or broker. Every scan is tracked to you, and they land on the partner application with the invite bonus already attached.',
  },
  cs: {
    role: 'cs',
    silhouette: 'credential',
    layout: 'portrait',
    kind: 'join',
    width: 760,
    height: 1180,
    accent: 'violet',
    foil: MIX_AMETHYST_AURORA,
    eyebrow: 'Credential Pass',
    roleTitle: 'Credit',
    roleTitleSub: 'Specialist',
    titleSize: 92,
    qrSize: 214,
    valueProp: 'Run partner files on the full Finely OS — trained, mentor-backed, payouts on every close.',
    monogram: 'CS',
    sealCaption: 'Specialist Credential',
    proofPoints: ['Full partner OS access', 'Mentor-backed first files', 'Payout tiers — no platform fee'],
    qrCue: 'Join via this invite',
    qrSubCue: 'Scan to claim your specialist seat',
    compliance: `${CAREERS_COMPLIANCE} · payout examples are illustrative only`,
    incentiveFallback: 'Bonus lead credit toward your 3-lead minimum when you join through this card.',
    shareHeading: 'Your specialist credential card',
    shareBlurb:
      'Post it, text it, or print it. Anyone who joins through this pass is tagged to you and starts with the invite bonus applied.',
  },
  case_help: {
    role: 'case_help',
    silhouette: 'docket',
    layout: 'square',
    kind: 'join',
    width: 980,
    height: 980,
    accent: 'fuchsia',
    foil: MIX_COURT_PLUM,
    eyebrow: 'Case Desk Docket',
    roleTitle: 'Paralegal',
    roleTitleSub: '& Case Help',
    titleSize: 66,
    qrSize: 182,
    valueProp: 'Help partners answer collection suits — dockets, validation packets, hearing timelines.',
    monogram: 'PL',
    sealCaption: 'Case Desk Admission',
    proofPoints: ['Docket + deadline tracking', 'Validation letter packets', 'Structured case workflows'],
    qrCue: 'Join via this invite',
    qrSubCue: 'Scan to open the case desk application',
    compliance: `${CAREERS_COMPLIANCE} · educational support only · not legal advice`,
    incentiveFallback: 'Priority application review plus the partner sheet pack.',
    shareHeading: 'Your case desk invite card',
    shareBlurb:
      'Share it with paralegals, attorneys, and consultants. Applications that arrive through this docket are flagged for priority review.',
  },
  agency: {
    role: 'agency',
    silhouette: 'ledger',
    layout: 'landscape',
    kind: 'join',
    width: 1200,
    height: 630,
    accent: 'sky',
    foil: MIX_COBALT_CHROME,
    eyebrow: 'Agency Charter',
    roleTitle: 'Agency Partner',
    titleSize: 66,
    qrSize: 172,
    valueProp: 'Run your book of business on a white-labelled Finely OS with your own team seats.',
    monogram: 'AG',
    sealCaption: 'Chartered Agency',
    proofPoints: ['White-label portal', 'Team seats + roles', 'Payout tiers as you scale'],
    qrCue: 'Join via this invite',
    qrSubCue: 'Scan to open the agency charter',
    compliance: 'Results vary · buy-in and payouts subject to review · partners are independent operators',
    incentiveFallback: 'Charter review fast-tracked for agencies that join through this card.',
    shareHeading: 'Your agency charter card',
    shareBlurb:
      'Send it to a firm owner. They land on the charter page with the invite bonus attached, and the lead is tagged to your card.',
  },
  au_seller: {
    role: 'au_seller',
    silhouette: 'vault',
    layout: 'portrait',
    kind: 'join',
    width: 760,
    height: 1180,
    accent: 'amber',
    foil: MIX_BULLION_COPPER,
    eyebrow: 'Vault Access',
    roleTitle: 'Tradeline',
    roleTitleSub: 'Partner',
    titleSize: 82,
    qrSize: 200,
    valueProp: 'List seasoned authorized-user spots and earn a payout on every verified add.',
    monogram: 'AU',
    sealCaption: 'Vault Seller Access',
    proofPoints: ['Verified add tracking', 'Payouts on confirmation', 'Compliance-reviewed listings'],
    qrCue: 'Join via this invite',
    qrSubCue: 'Scan to open the vault seller form',
    compliance: 'Results vary · payouts subject to verification and compliance review',
    incentiveFallback: 'Front-of-queue listing review for sellers who join through this card.',
    shareHeading: 'Your vault seller card',
    shareBlurb:
      'Give it to anyone sitting on seasoned lines. Sellers who join through the vault card get their inventory reviewed first.',
  },
  affiliate: {
    role: 'affiliate',
    silhouette: 'tag',
    layout: 'landscape',
    kind: 'join',
    width: 1120,
    height: 640,
    accent: 'fuchsia',
    foil: MIX_CORAL_SIGNAL,
    eyebrow: 'Affiliate Signal',
    roleTitle: 'Affiliate Partner',
    titleSize: 68,
    qrSize: 186,
    valueProp: 'Share one tracked link — earn upfront and recurring payouts on every referral you send.',
    monogram: 'AF',
    sealCaption: 'Tracked Affiliate',
    proofPoints: ['One tracked link', 'Upfront + recurring payouts', 'Live referral dashboard'],
    qrCue: 'Join via this invite',
    qrSubCue: 'Scan to open the affiliate application',
    compliance: 'Results vary · payouts subject to verification · no earnings guarantees',
    incentiveFallback: 'Priority payout setup for affiliates who join through this card.',
    shareHeading: 'Your affiliate signal card',
    shareBlurb:
      'Drop it in a story, a group chat, or a bio link. Anyone who joins through it is tagged to your card and set up for payouts first.',
  },
  restore: {
    role: 'restore',
    silhouette: 'bloom',
    layout: 'portrait',
    kind: 'service',
    width: 820,
    height: 1140,
    accent: 'emerald',
    foil: MIX_TIDEWATER_PEARL,
    eyebrow: 'Credit Restore Invite',
    roleTitle: 'Personal',
    roleTitleSub: 'Credit Restore',
    titleSize: 76,
    qrSize: 208,
    valueProp: 'Inaccurate, unverifiable, or outdated items challenged under the laws that protect you.',
    monogram: 'PR',
    sealCaption: 'Restore Intake',
    proofPoints: ['Three-bureau report review', 'FCRA dispute sequencing', 'Progress you can watch'],
    qrCue: 'Scan to start',
    qrSubCue: 'Opens the restore intake with your invite attached',
    compliance: 'Results vary · not legal advice · no deletion or score guarantees',
    incentiveFallback: 'Priority report review when someone starts through this card.',
    shareHeading: 'Restore invite card',
    shareBlurb:
      'For the person who keeps getting declined. They scan, land on restore intake, and their file is reviewed before the first call.',
  },
  tradelines: {
    role: 'tradelines',
    silhouette: 'gem',
    layout: 'landscape',
    kind: 'service',
    width: 1080,
    height: 700,
    accent: 'amber',
    foil: MIX_OBSIDIAN_GOLD,
    eyebrow: 'Tradeline Invite',
    roleTitle: 'Seasoned Tradelines',
    titleSize: 64,
    qrSize: 192,
    valueProp: 'Authorized-user spots on aged, low-utilization accounts — matched to the profile, not guessed.',
    monogram: 'TL',
    sealCaption: 'Marketplace Access',
    proofPoints: ['Aged, low-utilization lines', 'Limits and slots shown upfront', 'Compliance-first guidance'],
    qrCue: 'Scan to browse',
    qrSubCue: 'Opens the tradeline marketplace with your invite attached',
    compliance: 'Results vary · issuer reporting is not guaranteed · educational guidance only',
    incentiveFallback: 'Priority AU matching when someone starts through this card.',
    shareHeading: 'Tradeline invite card',
    shareBlurb:
      'Hand it to someone thinning out a file. They scan into the marketplace and get matched against available lines first.',
  },
};

/** The three careers cards this pack ships as primary, in display order. */
export const PRIMARY_INVITE_CARD_ROLES: DigitalInviteCardRole[] = ['re', 'cs', 'case_help'];

/** Extended partner tracks — same tokens, mounted separately. */
export const EXTENDED_INVITE_CARD_ROLES: DigitalInviteCardRole[] = ['agency', 'au_seller', 'affiliate'];

/** Service invites a partner hands to someone they are helping. */
export const SERVICE_INVITE_CARD_ROLES: DigitalInviteCardRole[] = ['restore', 'tradelines'];

/** Every card, in the order the set should be presented. */
export const ALL_INVITE_CARD_ROLES: DigitalInviteCardRole[] = [
  ...PRIMARY_INVITE_CARD_ROLES,
  ...EXTENDED_INVITE_CARD_ROLES,
  ...SERVICE_INVITE_CARD_ROLES,
];

export function getDigitalInviteDesign(role: DigitalInviteCardRole): DigitalInviteDesign {
  return DIGITAL_INVITE_CARD_DESIGNS[role];
}

/**
 * Full role name as one line. The card splits the title across two lines for
 * typography, so `roleTitle` on its own reads as a fragment ("Paralegal",
 * "Personal") — use this anywhere the name is spoken or shared as prose.
 */
export function digitalInviteFullTitle(role: DigitalInviteCardRole): string {
  const design = DIGITAL_INVITE_CARD_DESIGNS[role];
  return [design.roleTitle, design.roleTitleSub].filter(Boolean).join(' ');
}

/**
 * Incentive blurb for a role. Prefers the tracked bonus from the registry
 * (Agent 2 lane) and falls back to the design-layer placeholder so a card is
 * never blank while bonuses are being wired.
 */
export function getDigitalInviteIncentive(role: DigitalInviteCardRole): {
  label: string;
  description: string;
} {
  const def = DIGITAL_INVITE_CARDS[role] as { bonus?: DigitalInviteCardBonus } | undefined;
  const design = DIGITAL_INVITE_CARD_DESIGNS[role];
  if (def?.bonus) return { label: def.bonus.label, description: def.bonus.description };
  return { label: 'Invite bonus', description: design.incentiveFallback };
}

/** Destination path for a role, tolerant of registry entries not yet defined. */
export function getDigitalInviteDestPath(role: DigitalInviteCardRole): string {
  const def = DIGITAL_INVITE_CARDS[role] as { destPath?: string } | undefined;
  if (def?.destPath) return def.destPath;
  return role === 'agency' ? '/agency-partners' : '/au-sellers';
}

/** Filename stem used for PNG downloads. */
export function digitalInviteFileStem(role: DigitalInviteCardRole): string {
  return `finely-cred-invite-${role.replace(/_/g, '-')}`;
}
