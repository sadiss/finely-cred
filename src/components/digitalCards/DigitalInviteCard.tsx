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
 * silhouette (placard / credential pass / docket ticket / charter banner /
 * vault key) with its own foil palette and engraved motif, so the set never
 * reads as one template recoloured.
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
            line={design.foil.foilMid}
            lineBright={design.foil.foilLight}
          />
          <div className="fcdc-layer fcdc-grain" />
          <div className="fcdc-layer fcdc-vignette" />
          <div className="fcdc-layer fcdc-gloss" />
          <div className="fcdc-layer fcdc-gloss-lower" />
          <div className="fcdc-layer fcdc-sweep" />
          <div className="fcdc-layer fcdc-edge" />

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

function Title({ design, size }: { design: DigitalInviteDesign; size: number }) {
  return (
    <h2 className="fcdc-title fcdc-foil" style={{ fontSize: size }}>
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

function Chips({ items, max }: { items: string[]; max?: number }) {
  return (
    <div className="fcdc-chips">
      {items.slice(0, max ?? items.length).map((item) => (
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

function QrBlock({
  design,
  url,
  size,
  align = 'center',
}: {
  design: DigitalInviteDesign;
  url: string;
  size: number;
  align?: 'center' | 'left';
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        textAlign: align === 'center' ? 'center' : 'left',
        gap: 10,
      }}
    >
      <div className="fcdc-qr-plate">
        <InviteQrCode
          value={url}
          size={size}
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
function BrandRow({ url, logoHeight = 72 }: { url: string; logoHeight?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

// ---------------------------------------------------------------------------
// Per-silhouette layouts
// ---------------------------------------------------------------------------

function CardBody({
  design,
  url,
  incentive,
}: {
  design: DigitalInviteDesign;
  url: string;
  incentive: string;
}) {
  switch (design.silhouette) {
    case 'estate':
      return <EstateBody design={design} url={url} incentive={incentive} />;
    case 'credential':
      return <CredentialBody design={design} url={url} incentive={incentive} />;
    case 'docket':
      return <DocketBody design={design} url={url} incentive={incentive} />;
    case 'ledger':
      return <LedgerBody design={design} url={url} incentive={incentive} />;
    default:
      return <VaultBody design={design} url={url} incentive={incentive} />;
  }
}

type BodyProps = { design: DigitalInviteDesign; url: string; incentive: string };

/** Landscape property placard — copy left, seal + QR stacked on the right rail. */
function EstateBody({ design, url, incentive }: BodyProps) {
  return (
    <>
      <div className="fcdc-bevel" />
      <div className="fcdc-body">
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
            <Eyebrow text={design.eyebrow} />
            <Title design={design} size={74} />
            <p className="fcdc-value">{design.valueProp}</p>
            <Chips items={design.proofPoints} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Ribbon text={incentive} />
            <BrandRow url={url} />
            <Compliance text={design.compliance} />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 30,
          }}
        >
          <Seal design={design} size={118} />
          <QrBlock design={design} url={url} size={196} />
        </div>
      </div>
    </>
  );
}

/** Portrait credential pass — lanyard slot, holographic band, centred QR. */
function CredentialBody({ design, url, incentive }: BodyProps) {
  return (
    <>
      <div className="fcdc-slot" />
      <div className="fcdc-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <Eyebrow text={design.eyebrow} />
          <Seal design={design} size={104} />
        </div>

        <Title design={design} size={88} />

        <div className="fcdc-holo">
          <span className="fcdc-holo__text">Finely Cred · Verified Invite</span>
        </div>

        <p className="fcdc-value" style={{ maxWidth: 'none' }}>
          {design.valueProp}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <Chips items={design.proofPoints} />
        </div>

        <Ribbon text={incentive} />

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <QrBlock design={design} url={url} size={214} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderTop: `1px solid rgba(${design.foil.haloRgb}, 0.22)`,
              paddingTop: 16,
            }}
          >
            <BrandRow url={url} logoHeight={64} />
          </div>
          <Compliance text={design.compliance} style={{ textAlign: 'center' }} />
        </div>
      </div>
    </>
  );
}

/** Square docket ticket — pleading rail, perforated stub carrying the QR. */
function DocketBody({ design, url, incentive }: BodyProps) {
  return (
    <>
      <div className="fcdc-rail">
        <div className="fcdc-rail__nums">
          {['01', '02', '03', '04', '05', '06', '07', '08'].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>
      <div className="fcdc-perf">
        <span className="fcdc-perf__notch fcdc-perf__notch--top" />
        <span className="fcdc-perf__notch fcdc-perf__notch--bottom" />
      </div>

      <div className="fcdc-body">
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
            <Eyebrow text={design.eyebrow} />
            <Title design={design} size={66} />
            <p className="fcdc-value" style={{ maxWidth: '34ch' }}>
              {design.valueProp}
            </p>
            <Chips items={design.proofPoints} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Ribbon text={incentive} />
            <BrandRow url={url} logoHeight={66} />
            <Compliance text={design.compliance} style={{ maxWidth: '58ch' }} />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 18,
          }}
        >
          <Seal design={design} size={112} />
          <QrBlock design={design} url={url} size={182} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: `rgba(${design.foil.haloRgb}, 0.6)`,
            }}
          >
            Case Desk
          </span>
        </div>
      </div>
    </>
  );
}

/** Wide charter banner for agency partners. */
function LedgerBody({ design, url, incentive }: BodyProps) {
  return (
    <div className="fcdc-body">
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
          <Eyebrow text={design.eyebrow} />
          <Title design={design} size={64} />
          <p className="fcdc-value">{design.valueProp}</p>
          <Chips items={design.proofPoints} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Ribbon text={incentive} />
          <BrandRow url={url} logoHeight={64} />
          <Compliance text={design.compliance} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
        }}
      >
        <Seal design={design} size={100} />
        <QrBlock design={design} url={url} size={168} />
      </div>
    </div>
  );
}

/** Arched portrait key for AU tradeline sellers. */
function VaultBody({ design, url, incentive }: BodyProps) {
  return (
    <div className="fcdc-body">
      <Seal design={design} size={116} />
      <Eyebrow text={design.eyebrow} />
      <Title design={design} size={78} />
      <p className="fcdc-value" style={{ maxWidth: 'none' }}>
        {design.valueProp}
      </p>
      <Chips items={design.proofPoints} />
      <Ribbon text={incentive} />
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <QrBlock design={design} url={url} size={200} />
        <BrandRow url={url} logoHeight={62} />
        <Compliance text={design.compliance} style={{ textAlign: 'center' }} />
      </div>
    </div>
  );
}
