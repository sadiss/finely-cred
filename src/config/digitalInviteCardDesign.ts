/**
 * Digital invite card DESIGN layer — visual identity per role.
 *
 * Ownership split:
 * - `src/config/digitalInviteCards.ts` (role ids, destination paths, tracked URL
 *   contract, join bonuses) is the tracking SSOT. This file never redefines those.
 * - This file adds the *visual* contract: silhouette, canvas size, foil palette,
 *   engraved motif, and the on-card copy. Card components read from here only.
 *
 * Every role gets a deliberately different silhouette so a Real Estate placard,
 * a Credit Specialist credential pass, and a Case Help docket ticket are never
 * mistaken for the same template.
 */
import type { FinelyOsPublicAccent } from '../features/os/finelyOsLightUi';
import {
  DIGITAL_INVITE_CARDS,
  type DigitalInviteCardBonus,
  type DigitalInviteCardRole,
} from './digitalInviteCards';

/** Physical shape + engraving language of the card. One per role, never shared. */
export type DigitalInviteSilhouette =
  /** Landscape property placard — notched corner, blueprint skyline, key seal. */
  | 'estate'
  /** Portrait credential pass — lanyard slot, guilloche rosette, score arc. */
  | 'credential'
  /** Square docket ticket — pleading rail, perforated stub, wax seal. */
  | 'docket'
  /** Wide charter banner — chevron ledger rails, chrome edge. */
  | 'ledger'
  /** Portrait vault key — dial engraving, tradeline bars. */
  | 'vault';

/**
 * Foil + ink palette. Values are raw CSS so they can be pushed straight into
 * custom properties on the card root and consumed by `digitalInviteCards.css`.
 */
export interface DigitalInviteFoil {
  /** Deepest base ink (card corners). */
  inkDeep: string;
  /** Mid ink (card centre wash). */
  ink: string;
  /** Brightest foil highlight. */
  foilLight: string;
  /** Foil body — the colour a viewer reads as "gold" / "platinum" / "chrome". */
  foilMid: string;
  /** Foil shadow, gives the stamped-metal roll. */
  foilDeep: string;
  /** `r, g, b` triple for accent glows and rgba() mixes. */
  accentRgb: string;
  /** Secondary `r, g, b` used for the holographic cross-light. */
  haloRgb: string;
}

export interface DigitalInviteDesign {
  role: DigitalInviteCardRole;
  silhouette: DigitalInviteSilhouette;
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
  /** Single sentence value prop. Keep under ~92 characters. */
  valueProp: string;
  /** Two-to-three character foil monogram struck into the card. */
  monogram: string;
  /** Caption ringed around / under the embossed seal. */
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
}

const FOIL_CHAMPAGNE: DigitalInviteFoil = {
  inkDeep: '#02100c',
  ink: '#06231a',
  foilLight: '#fdf3d4',
  foilMid: '#d9b978',
  foilDeep: '#7d5c22',
  accentRgb: '16, 185, 129',
  haloRgb: '217, 185, 120',
};

const FOIL_PLATINUM: DigitalInviteFoil = {
  inkDeep: '#08051a',
  ink: '#160d33',
  foilLight: '#f8f6ff',
  foilMid: '#c3bce4',
  foilDeep: '#6b6296',
  accentRgb: '139, 92, 246',
  haloRgb: '195, 188, 228',
};

const FOIL_ANTIQUE: DigitalInviteFoil = {
  inkDeep: '#120318',
  ink: '#25082c',
  foilLight: '#ffeccf',
  foilMid: '#dcae6d',
  foilDeep: '#8a5623',
  accentRgb: '217, 70, 239',
  haloRgb: '220, 174, 109',
};

const FOIL_CHROME: DigitalInviteFoil = {
  inkDeep: '#020f19',
  ink: '#04263a',
  foilLight: '#f4faff',
  foilMid: '#b0cade',
  foilDeep: '#587a93',
  accentRgb: '56, 189, 248',
  haloRgb: '176, 202, 222',
};

const FOIL_BULLION: DigitalInviteFoil = {
  inkDeep: '#150d02',
  ink: '#2a1c05',
  foilLight: '#fff3c9',
  foilMid: '#e6bd5d',
  foilDeep: '#8d6612',
  accentRgb: '245, 158, 11',
  haloRgb: '230, 189, 93',
};

const CAREERS_COMPLIANCE =
  'Results vary · not an employment offer · affiliation subject to review';

export const DIGITAL_INVITE_CARD_DESIGNS: Record<DigitalInviteCardRole, DigitalInviteDesign> = {
  re: {
    role: 're',
    silhouette: 'estate',
    width: 1120,
    height: 700,
    accent: 'emerald',
    foil: FOIL_CHAMPAGNE,
    eyebrow: 'Real Estate Partner Invite',
    roleTitle: 'Real Estate Partner',
    valueProp: 'Send declined buyers to us — we build their fundability, you keep the closing.',
    monogram: 'RE',
    sealCaption: 'Underwriting Readiness',
    proofPoints: ['Buyer readiness reviews', 'Co-branded partner assets', 'Tracked referral pipeline'],
    qrCue: 'Join via this invite',
    qrSubCue: 'Scan to open your partner application',
    compliance: `${CAREERS_COMPLIANCE} · funding subject to underwriting`,
    incentiveFallback: 'Priority onboarding call for partners who join through this card.',
  },
  cs: {
    role: 'cs',
    silhouette: 'credential',
    width: 760,
    height: 1180,
    accent: 'violet',
    foil: FOIL_PLATINUM,
    eyebrow: 'Credential Pass',
    roleTitle: 'Credit',
    roleTitleSub: 'Specialist',
    valueProp: 'Run partner files on the full Finely OS — trained, mentor-backed, revenue share.',
    monogram: 'CS',
    sealCaption: 'Specialist Credential',
    proofPoints: ['Full partner OS access', 'Mentor-backed first files', 'Revenue share — no platform fee'],
    qrCue: 'Join via this invite',
    qrSubCue: 'Scan to claim your specialist seat',
    compliance: `${CAREERS_COMPLIANCE} · income examples are illustrative only`,
    incentiveFallback: 'Bonus lead credit toward your 3-lead minimum when you join through this card.',
  },
  case_help: {
    role: 'case_help',
    silhouette: 'docket',
    width: 980,
    height: 980,
    accent: 'fuchsia',
    foil: FOIL_ANTIQUE,
    eyebrow: 'Case Desk Docket',
    roleTitle: 'Paralegal',
    roleTitleSub: '& Case Help',
    valueProp: 'Help partners answer collection suits — dockets, validation packets, hearing timelines.',
    monogram: 'PL',
    sealCaption: 'Case Desk Admission',
    proofPoints: ['Docket + deadline tracking', 'Validation letter packets', 'Structured case workflows'],
    qrCue: 'Join via this invite',
    qrSubCue: 'Scan to open the case desk application',
    compliance: `${CAREERS_COMPLIANCE} · educational support only · not legal advice`,
    incentiveFallback: 'Priority application review plus the partner one-sheet pack.',
  },
  agency: {
    role: 'agency',
    silhouette: 'ledger',
    width: 1200,
    height: 630,
    accent: 'sky',
    foil: FOIL_CHROME,
    eyebrow: 'Agency Charter',
    roleTitle: 'Agency Partner',
    valueProp: 'Run your book of business on a white-labelled Finely OS with your own team seats.',
    monogram: 'AG',
    sealCaption: 'Chartered Agency',
    proofPoints: ['White-label portal', 'Team seats + roles', 'Revenue share tiers'],
    qrCue: 'Join via this invite',
    qrSubCue: 'Scan to open the agency charter',
    compliance: 'Results vary · partner outcomes subject to underwriting and effort',
    incentiveFallback: 'Charter review fast-tracked for agencies that join through this card.',
  },
  au_seller: {
    role: 'au_seller',
    silhouette: 'vault',
    width: 760,
    height: 1180,
    accent: 'amber',
    foil: FOIL_BULLION,
    eyebrow: 'Vault Access',
    roleTitle: 'Tradeline',
    roleTitleSub: 'Partner',
    valueProp: 'List seasoned authorized-user spots and get paid on every verified add.',
    monogram: 'AU',
    sealCaption: 'Vault Seller Access',
    proofPoints: ['Verified add tracking', 'Payout on confirmation', 'Compliance-reviewed listings'],
    qrCue: 'Join via this invite',
    qrSubCue: 'Scan to open the vault seller form',
    compliance: 'Results vary · payouts subject to verification and compliance review',
    incentiveFallback: 'Front-of-queue listing review for sellers who join through this card.',
  },
};

/** The three roles this pack ships as primary, in display order. */
export const PRIMARY_INVITE_CARD_ROLES: DigitalInviteCardRole[] = ['re', 'cs', 'case_help'];

/** Extended tracks (Agency, AU seller) — same tokens, mounted separately. */
export const EXTENDED_INVITE_CARD_ROLES: DigitalInviteCardRole[] = ['agency', 'au_seller'];

export function getDigitalInviteDesign(role: DigitalInviteCardRole): DigitalInviteDesign {
  return DIGITAL_INVITE_CARD_DESIGNS[role];
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
  return role === 'agency' ? '/agency-partners' : '/au-tradelines';
}

/** Filename stem used for PNG downloads. */
export function digitalInviteFileStem(role: DigitalInviteCardRole): string {
  return `finely-cred-invite-${role.replace(/_/g, '-')}`;
}
