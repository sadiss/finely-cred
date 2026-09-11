import React, { forwardRef } from 'react';
import { HAITIAN_PLACE_CARDS, haitianPlaceForKitId } from '../../../../lib/haitianCompanionDesk';
import type { HaitianDeskKit } from '../../../../lib/haitianDeskKits';
import { haitianPieceById } from '../../../../lib/haitianPieceSpec';
import type { HaitianSocialFormat } from '../../../../lib/downloadHaitianSocialPng';
import { HAITIAN_SOCIAL_SIZES } from '../../../../lib/downloadHaitianSocialPng';
import { FINELY_COPY_COMPLIANCE_EN } from '../../../../lib/finelyCopyVoice';
import { HAITIAN_COLLECTOR_LETTER as LETTER, HAITIAN_LETTER_MEANING_VOICE as VOICE } from '../../../../lib/haitianLetterMeaningCopy';

function Signature({ kit }: { kit: HaitianDeskKit }) {
  const architecture = kit.architecture ?? 'bureau-file';
  if (architecture === 'collector-letter') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--letter">
        <p className="fc-ht-social-sig__from">{LETTER.collectorName}</p>
        <p className="fc-ht-social-sig__line">{LETTER.artifactLine}</p>
        <p className="fc-ht-social-sig__ht">{VOICE.meaningHt}</p>
      </div>
    );
  }
  if (architecture === 'helper-playbook') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--sit">
        <div>
          <small>Kitchen table</small>
          <p>You’re allowed to sit there. Don’t take the phone.</p>
        </div>
        <div>
          <small>Kreyòl</small>
          <p>Ou gen dwa chita la. Pa pran telefòn nan.</p>
        </div>
      </div>
    );
  }
  if (architecture === 'church-handbill') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--flyer">
        <strong>Pale Kreyòl</strong>
        <p>A collection is a rumor with a phone number.</p>
        <div className="fc-ht-social-sig__cities">
          {HAITIAN_PLACE_CARDS.map((place) => (
            <span key={place.key}>{place.city}</span>
          ))}
        </div>
      </div>
    );
  }
  if (architecture === 'bureau-dossier') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--restore">
        <small>Bureau file</small>
        <p>Paying often does not delete the rumor.</p>
        <ol>
          <li>01 Gossip</li>
          <li>02 Clocks</li>
          <li>03 Garden</li>
        </ol>
      </div>
    );
  }
  if (architecture === 'card-use-ledger') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--build">
        <small>Statement-day photo</small>
        <p>Payday is the outfit. Statement day is the photo.</p>
        <div className="fc-ht-social-sig__meter" aria-hidden>
          <i style={{ width: '28%' }} />
        </div>
        <span>On-time trade · no promised score</span>
      </div>
    );
  }
  if (architecture === 'ein-folder') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--biz">
        <small>Company file</small>
        <p>EIN — not the owner SSN</p>
        <span>PAYDEX is not FICO in a suit</span>
      </div>
    );
  }
  if (architecture === 'welcome-one-sheet') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--intro">
        <small>Haitian community</small>
        <p>Nou ede Ayisyen ki viv Ozetazini</p>
        <span>Reports · letters · a next step</span>
      </div>
    );
  }
  if (architecture === 'visit-runway') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--steps">
        <i>1</i>
        <p>Read the English line</p>
        <i>2</i>
        <p>Pick one service</p>
        <i>3</i>
        <p>Stop for the day</p>
      </div>
    );
  }
  if (architecture === 'validation-docket') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--docket">
        <small>Validation docket</small>
        <p>The letter is a clock</p>
        <span>______ / ______ / ______</span>
      </div>
    );
  }
  if (architecture === 'court-summons') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--court">
        <small>In the court of teaching examples</small>
        <p>SUMMONS</p>
        <span>YOU MUST ANSWER BY April 17, 2026</span>
      </div>
    );
  }
  if (architecture === 'foreclosure-notice') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--notice">
        <b>FORECLOSURE NOTICE</b>
        <p>Equifax cannot pause a sale.</p>
      </div>
    );
  }
  if (architecture === 'repo-notice') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--repo">
        <i>VIN</i>
        <p>The VIN does not RSVP to family meeting night.</p>
      </div>
    );
  }
  if (architecture === 'bankruptcy-file') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--bk">
        <small>United States Bankruptcy Court</small>
        <p>IN RE</p>
        <span>We read the line. We do not file one.</span>
      </div>
    );
  }
  if (architecture === 'chex-stamp') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--chex">
        <span>ChexSystems · banking</span>
        <span>Equifax · not the same cousin</span>
      </div>
    );
  }
  if (architecture === 'appointment-card') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--session">
        <small>Session</small>
        <p>Bring the envelope. Not the whole life story.</p>
      </div>
    );
  }
  if (architecture === 'dfy-matter-brief') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--dfy">
        <span>You hold the envelope</span>
        <span>We run the clocks</span>
      </div>
    );
  }
  if (architecture === 'diy-starter-card') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--diy">
        <small>Certified mail log</small>
        <p>Circle one wrong line. Screenshot the screen. Mail.</p>
      </div>
    );
  }
  if (architecture === 'vendor-ladder') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--ladder">
        <i>1</i><p>EIN</p>
        <i>2</i><p>Vendors that report</p>
        <i>3</i><p>Company ask</p>
      </div>
    );
  }
  if (architecture === 'privacy-lock') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--pin">
        <small>PIN</small>
        <p>A freeze is a deadbolt. It does not erase a line.</p>
      </div>
    );
  }
  if (architecture === 'bundle-band') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--rooms">
        <span>Restore</span>
        <span>Debt</span>
      </div>
    );
  }
  if (architecture === 'maintenance-calendar') {
    return (
      <div className="fc-ht-social-sig fc-ht-social-sig--hold">
        <small>Statement day</small>
        <p>15</p>
      </div>
    );
  }
  if (architecture === 'tradeline-stack') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-trade">
        <small>Guest chair</small>
        <p>Authorized user is a guest chair. It is not a lottery ticket.</p>
      </div>
    );
  }
  if (architecture === 'cs-recruit-playbook') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-recruit">
        <small>Credit Specialist</small>
        <p>One household. One page. Not thirty inboxes.</p>
      </div>
    );
  }
  if (architecture === 'cs-field-pack') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-field">
        <small>This week</small>
        <p>Look at what is on their table. Send that page to a person.</p>
      </div>
    );
  }
  if (architecture === 'affiliate-pass') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-affiliate">
        <small>Share pass</small>
        <p>Forward the fact they did not know. Not a coupon.</p>
      </div>
    );
  }
  if (architecture === 'admin-playbook') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-adminmap">
        <small>Marketer map</small>
        <p>Send the page that matches what they are holding.</p>
      </div>
    );
  }
  if (architecture === 'metro-miami-ledger') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-miami">
        <small>Three people</small>
        <strong>Haiti · Couch · Condo</strong>
        <p>A computer can decide you are hiding. You were living a normal Miami life.</p>
      </div>
    );
  }
  if (architecture === 'metro-brooklyn-mailbox') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-brooklyn">
        <i>MAIL</i>
        <div>
          <strong>The mailbox still wins</strong>
          <p>Envelope date is evidence. A text is a rumor.</p>
        </div>
      </div>
    );
  }
  if (architecture === 'metro-boston-campus') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-boston">
        <span>Campus</span>
        <span>Hospital</span>
        <p>They both sold your name. They are not the same debt.</p>
      </div>
    );
  }
  if (architecture === 'metro-houston-cycle') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-houston">
        <small>payday Friday</small>
        <strong>SNAPSHOT Wednesday</strong>
        <p>You already paid. The percentage missed the memo.</p>
      </div>
    );
  }
  if (architecture === 'metro-atlanta-moves') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-atlanta">
        <strong>Moving does not kill a collection</strong>
        <p>The fourth buyer is still shouting. Match the original creditor.</p>
      </div>
    );
  }
  if (architecture === 'metro-dc-fan') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-dc">
        <span>DC</span>
        <span>MD</span>
        <span>VA</span>
        <p>Three states looks like identity theft. It is commuting.</p>
      </div>
    );
  }
  if (architecture === 'metro-chicago-docket') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-chicago">
        <span>City / utility</span>
        <span>Bank card</span>
        <p>Not one Chicago debt.</p>
      </div>
    );
  }
  if (architecture === 'metro-philly-age') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-philly">
        <strong>Do not throw out the museum</strong>
        <p>The oldest good card is doing the real work.</p>
      </div>
    );
  }
  if (architecture === 'metro-jax-auto') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-jax">
        <i>VIN</i>
        <p>Florida mail is on statute time. Not island time.</p>
      </div>
    );
  }
  if (architecture === 'metro-nj-corridor') {
    return (
      <div className="fc-ht-social-sig fc-ht-obj-nj">
        <span>Newark</span>
        <span>Elizabeth</span>
        <span>Jersey City</span>
        <p>The Turnpike is not a credit bureau.</p>
      </div>
    );
  }
  if (architecture.startsWith('metro-')) {
    const place = haitianPlaceForKitId(kit.id);
    return (
      <div className="fc-ht-social-sig fc-ht-obj-miami">
        <small>{place?.metro ?? 'Haitian community'}</small>
        <strong>{place?.city ?? kit.title}</strong>
        <p>{kit.purpose}</p>
      </div>
    );
  }
  return (
    <div className="fc-ht-social-sig fc-ht-social-sig--cousins">
      <div>
        <span>Equifax</span>
        <span>Experian</span>
        <span>TransUnion</span>
      </div>
      <p>Three cousins. No group chat.</p>
      <small>Photograph the screen. The emailed PDF is a cousin.</small>
    </div>
  );
}

export const HaitianKitSocialFrame = forwardRef<
  HTMLDivElement,
  { kit: HaitianDeskKit; format: HaitianSocialFormat; qrSrc: string }
>(function HaitianKitSocialFrame({ kit, format, qrSrc }, ref) {
  const size = HAITIAN_SOCIAL_SIZES[format];
  const spec = haitianPieceById(kit.id);
  return (
    <div
      ref={ref}
      className={`fc-ht-social fc-ht-social--${format}`}
      data-fc-accent={kit.accent}
      data-architecture={kit.architecture ?? 'bureau-file'}
      style={{ width: size.width, height: size.height }}
    >
      <p className="fc-ht-social__brand">Haitian community · Finely Cred</p>
      <Signature kit={kit} />
      <div className="fc-ht-social__copy">
        <h2>{kit.title}</h2>
        <p className="fc-ht-social__ht">{kit.titleHt}</p>
        <p className="fc-ht-social__purpose">{spec?.hookEn ?? kit.purpose}</p>
        <p className="fc-ht-social__cta">Pale Kreyòl · finelycred.com/haitian</p>
      </div>
      <div className="fc-ht-social__foot">
        <img src={qrSrc} alt="" width={148} height={148} />
        <p>{FINELY_COPY_COMPLIANCE_EN}</p>
      </div>
    </div>
  );
});
