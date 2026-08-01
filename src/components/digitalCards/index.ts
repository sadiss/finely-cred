/**
 * Digital invite cards — premium, downloadable share cards per partner track.
 *
 * Mount with `<DigitalInviteCardShare role="re" maxWidth={720} />`; everything
 * else (silhouette, foil palette, copy, QR payload, incentive) resolves from
 * `src/config/digitalInviteCards.ts` + `src/config/digitalInviteCardDesign.ts`.
 */
export { DigitalInviteCard } from './DigitalInviteCard';
export type { DigitalInviteCardProps } from './DigitalInviteCard';
export { DigitalInviteCardShare } from './DigitalInviteCardShare';
export type { DigitalInviteCardShareProps } from './DigitalInviteCardShare';
export { InviteQrCode } from './InviteQrCode';
export { InviteCardMotif } from './InviteCardMotif';
export {
  canShareInviteCardImage,
  copyInviteLink,
  downloadInviteCardPng,
  inviteCardFileName,
  renderInviteCardPng,
  shareInviteCardImage,
} from './downloadInviteCard';
export { inviteDisplayUrl, inviteOrigin, resolveInviteUrl } from './inviteCardUrl';
export { encodeQrMatrix, encodeQrMatrixBestFit } from './qrMatrix';
export type { QrEccLevel, QrMatrix } from './qrMatrix';
