import React from 'react';
import {
  getDigitalInviteDesign,
  getDigitalInviteIncentive,
  type DigitalInviteDesign,
} from '../../config/digitalInviteCardDesign';
import type { DigitalInviteCardRole } from '../../config/digitalInviteCards';
import { InviteCardMotif } from './InviteCardMotif';
import { InviteQrCode } from './InviteQrCode';
import { resolveInviteUrl, inviteDisplayUrl } from './inviteCardUrl';
import './digitalInviteCards.css';

const BRAND_LOGO = '/brand/finely-cred-logo-dark.png';

export interface DigitalInviteCardProps {
  role: DigitalInviteCardRole;
  /**
   * Fully-resolved invite URL. Leave undefined to use the tracked default from
   * the invite registry; pass a value to inject a promoter/referral URL.
   */
  inviteUrl?: string;
  /**
   * Override the bonus line. Keep it short — the card prints the bonus *label*
   * (e.g. "Priority onboarding call"), not the full unlock sentence.
   */
  incentiveText?: string;
  /** Rendered CSS width. The card scales its design canvas to match. */
  displayWidth?: number;
  /** Adds hover shine + lift. Turn off for static/print contexts. */
  interactive?: boolean;
  /** Ref to the capture node — pass this to `downloadInviteCardPng`. */
  cardRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

/**
 * A premium, downloadable invite card. Each role renders a different physical
 * silhouette (placard / credential pass / case ticket / charter banner / vault
 * door / share tag / petal / gem) with its own three-hue colour mix and foil
 * emblem, so the set never reads as one template recoloured.
 */
export function DigitalInviteCard({
  role,
  inviteUrl,
  incentiveText,
  displayWidth,
  interactive = true,
  cardRef,
  className = '',
}: DigitalInviteCardProps) {
  const design = getDigitalInviteDesign(role);
  const url = inviteUrl ?? resolveInviteUrl(role, { absolute: true });
  const incentive = incentiveText ?? getDigitalInviteIncentive(role).label;

  const width = displayWidth ?? design.width;
  const scale = width / design.width;

  const cardVars = {
    width: `${design.width}px`,
    height: `${design.height}px`,
    '--fcdc-ink': design.foil.ink,
    '--fcdc-ink-deep': design.foil.inkDeep,
    '--fcdc-foil-light': design.foil.foilLight,
    '--fcdc-foil-mid': design.foil.foilMid,
    '--fcdc-foil-deep': design.foil.foilDeep,
    '--fcdc-accent': design.foil.accentRgb,
    '--fcdc-mix': design.foil.mixRgb,
    '--fcdc-halo': design.foil.haloRgb,
  } as React.CSSProperties;

  return (
    <div
      className={`fcdc-frame ${interactive ? 'fcdc-frame--interactive' : ''} ${className}`}
      style={{ ['--fcdc-scale' as string]: String(scale), width } as React.CSSProperties}
    >
      <div className="fcdc-frame__slot" style={{ width, height: design.height * scale }}>
        <div ref={cardRef} className={`fcdc-card fcdc--${design.silhouette}`} style={cardVars}>
          <div className="fcdc-layer fcdc-ink" />
          <InviteCardMotif
            silhouette={design.silhouette}
            width={design.width}
            height={design.height}
            foil={design.foil}
          />
          <div className="fcdc-layer fcdc-grain" />
          <div className="fcdc-layer fcdc-vignette" />
          <div className="fcdc-layer fcdc-lacquer" />
          <div className="fcdc-layer fcdc-gloss" />
          <div className="fcdc-layer fcdc-gloss-lower" />
          <div className="fcdc-layer fcdc-sweep" />
          <div className="fcdc-layer fcdc-edge" />

          <SilhouetteChrome design={design} />
          <CardBody design={design} url={url} incentive={incentive} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared blocks
// ---------------------------------------------------------------------------

function Eyebrow({ text }: { text: string }) {
  return <span className="fcdc-eyebrow">{text}</span>;
}

function Title({ design }: { design: DigitalInviteDesign }) {
  return (
    <h2 className="fcdc-title fcdc-foil" style={{ fontSize: design.titleSize }}>
      {design.roleTitle}
      {design.roleTitleSub ? (
        <>
          <br />
          {design.roleTitleSub}
        </>
      ) : null}
    </h2>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="fcdc-chips">
      {items.map((item) => (
        <span key={item} className="fcdc-chip">
          <span className="fcdc-chip__dot" />
          {item}
        </span>
      ))}
    </div>
  );
}

function Ribbon({ text }: { text: string }) {
  return (
    <div className="fcdc-ribbon">
      <span className="fcdc-ribbon__label">Invite bonus</span>
      <span className="fcdc-ribbon__text">{text}</span>
    </div>
  );
}

function Seal({ design, size }: { design: DigitalInviteDesign; size: number }) {
  return (
    <div className="fcdc-seal" style={{ width: size, height: size }}>
      <div
        className="fcdc-seal__core"
        style={{ width: size - 14, height: size - 14, padding: size * 0.1 }}
      >
        <span
          className="fcdc-seal__mono fcdc-foil"
          style={{ fontSize: size * 0.34, lineHeight: 1 }}
        >
          {design.monogram}
        </span>
        <span
          style={{
            fontSize: Math.max(7.5, size * 0.075),
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            textAlign: 'center',
            lineHeight: 1.2,
            color: `rgba(${design.foil.haloRgb}, 0.82)`,
          }}
        >
          {design.sealCaption}
        </span>
      </div>
    </div>
  );
}

function QrBlock({ design, url }: { design: DigitalInviteDesign; url: string }) {
  return (
    <div className="fcdc-qr-block">
      <div className="fcdc-qr-plate">
        <InviteQrCode
          value={url}
          size={design.qrSize}
          eyeColor={design.foil.foilDeep}
          moduleColor="#0d0c0a"
          monogram={design.monogram}
        />
      </div>
      <span className="fcdc-qr-cue fcdc-foil">{design.qrCue}</span>
      <span className="fcdc-qr-sub">{design.qrSubCue}</span>
    </div>
  );
}

/**
 * Approved wordmark + destination. The logo artwork already contains the
 * "Finely Cred" lettering, so the row prints the URL beside it rather than
 * setting the brand name twice.
 */
function BrandRow({ url, logoHeight = 68 }: { url: string; logoHeight?: number }) {
  return (
    <div className="fcdc-brandrow">
      <img
        src={BRAND_LOGO}
        alt="Finely Cred"
        width={638}
        height={506}
        draggable={false}
        style={{ height: logoHeight, width: 'auto', display: 'block' }}
      />
      {/* Inline so the full destination is always printed — the card is the
          only place a reader can see where the QR goes. */}
      <span
        className="fcdc-domain"
        style={{ maxWidth: 'none', overflow: 'visible', textTransform: 'none', letterSpacing: '0.05em' }}
      >
        {inviteDisplayUrl(url)}
      </span>
    </div>
  );
}

function Compliance({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <p className="fcdc-compliance" style={{ margin: 0, ...style }}>
      {text}
    </p>
  );
}

/** Physical detail that belongs to the card shape, not the copy. */
function SilhouetteChrome({ design }: { design: DigitalInviteDesign }) {
  switch (design.silhouette) {
    case 'estate':
      return <div className="fcdc-bevel" />;
    case 'credential':
      return <div className="fcdc-slot" />;
    case 'docket':
      return (
        <div className="fcdc-stub">
          <span className="fcdc-stub__text">Case Desk</span>
        </div>
      );
    case 'tag':
      return <div className="fcdc-punch" />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------

type BodyProps = { design: DigitalInviteDesign; url: string; incentive: string };

function CardBody({ design, url, incentive }: BodyProps) {
  if (design.layout === 'portrait') {
    return <PortraitBody design={design} url={url} incentive={incentive} />;
  }
  return <SplitBody design={design} url={url} incentive={incentive} />;
}

/**
 * Landscape + square silhouettes: copy on the left, seal above the QR on the
 * right rail. Shape, colour mix, emblem, and title scale keep them apart.
 */
function SplitBody({ design, url, incentive }: BodyProps) {
  return (
    <div className={`fcdc-body fcdc-body--${design.layout}`}>
      <div className="fcdc-copy">
        <div className="fcdc-copy__top">
          <Eyebrow text={design.eyebrow} />
          <Title design={design} />
          <p className="fcdc-value">{design.valueProp}</p>
          <Chips items={design.proofPoints} />
        </div>
        <div className="fcdc-copy__foot">
          <Ribbon text={incentive} />
          <BrandRow url={url} />
          <Compliance text={design.compliance} />
        </div>
      </div>

      <div className="fcdc-rail-col">
        <Seal design={design} size={112} />
        <QrBlock design={design} url={url} />
      </div>
    </div>
  );
}

/**
 * Portrait silhouettes: a single stacked column. The credential pass runs
 * left-aligned behind its diffraction band; the vault and petal cards centre.
 */
function PortraitBody({ design, url, incentive }: BodyProps) {
  const centred = design.silhouette !== 'credential';

  return (
    <div className={`fcdc-body fcdc-body--portrait`}>
      {centred ? (
        <>
          <Seal design={design} size={112} />
          <Eyebrow text={design.eyebrow} />
          <Title design={design} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <Eyebrow text={design.eyebrow} />
            <Seal design={design} size={104} />
          </div>
          <Title design={design} />
          <div className="fcdc-holo">
            <span className="fcdc-holo__text">Finely Cred · Verified Invite</span>
          </div>
        </>
      )}

      <p className="fcdc-value" style={{ maxWidth: 'none' }}>
        {design.valueProp}
      </p>
      <Chips items={design.proofPoints} />
      <Ribbon text={incentive} />

      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <QrBlock design={design} url={url} />
        <BrandRow url={url} logoHeight={62} />
        <Compliance text={design.compliance} style={{ textAlign: 'center' }} />
      </div>
    </div>
  );
}
