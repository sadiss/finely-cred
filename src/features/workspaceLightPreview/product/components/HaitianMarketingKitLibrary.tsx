import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download, ImageDown, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HAITIAN_DESK_LIVE_PATH, HAITIAN_PLACE_CARDS, haitianPlaceForKitId } from '../../../../lib/haitianCompanionDesk';
import { HAITIAN_HELPER_COMPLIANCE_EN } from '../../../../lib/haitianHelperPlaybook';
import {
  HAITIAN_PIECE_ROOMS,
  haitianPieceById,
  listHaitianPiecesByRoom,
  type HaitianPieceRoom,
} from '../../../../lib/haitianPieceSpec';
import { haitianKitById, type HaitianDeskKit } from '../../../../lib/haitianDeskKits';
import {
  copyHaitianCaption,
  downloadHaitianSocialPng,
  haitianKitCaptionText,
  waitForHaitianSocialReady,
  type HaitianSocialFormat,
} from '../../../../lib/downloadHaitianSocialPng';
import { HAITIAN_COLLECTOR_LETTER as LETTER, HAITIAN_LETTER_MEANING_VOICE as VOICE } from '../../../../lib/haitianLetterMeaningCopy';
import { qrCodeImageUrl } from '../../../../lib/leadAttribution';
import { downloadHaitianDeskKitPdf } from '../../../../resources/buildHaitianDeskKitPdf';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../../os/finelyOsLightUi';
import { HaitianKitSocialFrame } from './HaitianKitSocialFrame';
import { HaitianSendPieceSheet } from './HaitianSendPieceSheet';
import './haitianMarketingKitLibrary.css';

function kitOrigin(): string {
  if (typeof window === 'undefined') return 'https://finelycred.com';
  return window.location.origin.replace(/\/$/, '');
}

function CreditFileObject() {
  return (
    <div className="fc-ht-obj-file" aria-hidden>
      <div className="fc-ht-obj-file__tabs">
        <span>Equifax</span>
        <span>Experian</span>
        <span>TransUnion</span>
      </div>
      <div className="fc-ht-obj-file__body">
        <p className="fc-ht-obj-file__kicker">U.S. credit file</p>
        <p className="fc-ht-obj-file__title">Dosye kredi · SSN file</p>
        <div className="fc-ht-obj-file__meta">
          <span>Name + Social Security number</span>
          <span>Three bureaus keep the same file</span>
        </div>
        <div className="fc-ht-obj-file__words">
          <b>credit file = dosye kredi</b>
          <b>bureau = biwo</b>
          <b>score = nòt</b>
          <b>dispute = diskisyon</b>
        </div>
      </div>
    </div>
  );
}

function LetterObject() {
  return (
    <div className="fc-ht-obj-letter" aria-hidden>
      <div className="fc-ht-obj-letter__bar">{LETTER.sampleBanner}</div>
      <div className="fc-ht-obj-letter__body">
        <p className="fc-ht-obj-letter__from">{LETTER.collectorName}</p>
        <p className="fc-ht-obj-letter__line">{LETTER.artifactLine}</p>
        <p className="fc-ht-obj-letter__ht">{VOICE.meaningHt}</p>
      </div>
    </div>
  );
}

function SitTogetherObject() {
  return (
    <div className="fc-ht-obj-sit" aria-hidden>
      <div className="fc-ht-obj-sit__en">
        <small>Kitchen table</small>
        <p>You’re allowed to sit there. Don’t take the phone.</p>
      </div>
      <div className="fc-ht-obj-sit__ht">
        <small>Kreyòl</small>
        <p>Ou gen dwa chita la. Pa pran telefòn nan.</p>
      </div>
    </div>
  );
}

function FlyerObject({ qrSrc }: { qrSrc: string }) {
  return (
    <div className="fc-ht-obj-flyer" aria-hidden>
      <div className="fc-ht-obj-flyer__copy">
        <small>A rumor with a phone number</small>
        <strong>Pale Kreyòl</strong>
        <p>Paying a collection often does not delete the headline.</p>
      </div>
      <img src={qrSrc} alt="" width={86} height={86} />
      <div className="fc-ht-obj-flyer__cities">
        {HAITIAN_PLACE_CARDS.map((place) => (
          <span key={place.key}>{place.city}</span>
        ))}
      </div>
    </div>
  );
}

function RestoreObject() {
  return (
    <div className="fc-ht-obj-restore" aria-hidden>
      <small>The gossip column</small>
      <strong>Pay the rumor. Keep the headline.</strong>
      <p>Three cousins. Photograph the screen — not the emailed PDF.</p>
    </div>
  );
}

function BuildObject() {
  return (
    <div className="fc-ht-obj-build" aria-hidden>
      <small>Card use</small>
      <strong>Watch how much you use</strong>
      <div className="fc-ht-obj-build__meter">
        <i style={{ width: '28%' }} />
      </div>
      <p>On-time trade · no promised score</p>
    </div>
  );
}

function BusinessObject() {
  return (
    <div className="fc-ht-obj-biz" aria-hidden>
      <small>Company file</small>
      <strong>EIN — not the owner SSN</strong>
      <p>Entity first. Vendors that report. A company ask.</p>
    </div>
  );
}

function IntroObject() {
  return (
    <div className="fc-ht-obj-intro" aria-hidden>
      <small>Haitian community</small>
      <strong>Nou ede Ayisyen ki viv Ozetazini</strong>
      <p>Reports, letters, and a next step.</p>
    </div>
  );
}

function StepsObject() {
  return (
    <div className="fc-ht-obj-steps" aria-hidden>
      <span>
        <i>1</i>
        Read the English line
      </span>
      <span>
        <i>2</i>
        Pick one service
      </span>
      <span>
        <i>3</i>
        Stop for the day
      </span>
    </div>
  );
}

function TradelineObject() {
  return (
    <div className="fc-ht-obj-trade" aria-hidden>
      <small>Guest chair</small>
      <strong>A guest chair is not a house</strong>
      <p>Authorized user is someone else’s family plan. Lenders can see last Tuesday.</p>
    </div>
  );
}

function RecruitObject() {
  return (
    <div className="fc-ht-obj-recruit" aria-hidden>
      <small>Credit Specialist</small>
      <p>One household. One page. Not thirty inboxes.</p>
    </div>
  );
}

function FieldPackObject() {
  return (
    <div className="fc-ht-obj-field" aria-hidden>
      <small>This week</small>
      <p>Look at what is on their table. Send that page to a person.</p>
    </div>
  );
}

function AffiliateObject() {
  return (
    <div className="fc-ht-obj-affiliate" aria-hidden>
      <small>Share pass</small>
      <p>Forward the fact they did not know. Not a coupon.</p>
    </div>
  );
}

function AdminMapObject() {
  return (
    <div className="fc-ht-obj-adminmap" aria-hidden>
      <small>Marketer map</small>
      <p>Look at what they are holding. Send that page. A person’s email — never a city.</p>
    </div>
  );
}

function MetroObject({ kit }: { kit: HaitianDeskKit }) {
  const place = haitianPlaceForKitId(kit.id);
  const a = kit.architecture;
  if (a === 'metro-miami-ledger') {
    return (
      <div className="fc-ht-obj-miami" data-fc-accent={kit.accent} aria-hidden>
        <small>Three people</small>
        <strong>{place?.city ?? 'Miami'}</strong>
        <p>The computer decided you are hiding. You were living a normal life.</p>
      </div>
    );
  }
  if (a === 'metro-brooklyn-mailbox') {
    return (
      <div className="fc-ht-obj-brooklyn" data-fc-accent={kit.accent} aria-hidden>
        <i>MAIL</i>
        <strong>The mailbox still wins</strong>
        <p>Envelope date is evidence. A text is a rumor.</p>
      </div>
    );
  }
  if (a === 'metro-boston-campus') {
    return (
      <div className="fc-ht-obj-boston" data-fc-accent={kit.accent} aria-hidden>
        <span>Campus</span>
        <span>Hospital</span>
        <p>They both sold your name. They are not the same debt.</p>
      </div>
    );
  }
  if (a === 'metro-houston-cycle') {
    return (
      <div className="fc-ht-obj-houston" data-fc-accent={kit.accent} aria-hidden>
        <small>payday Friday</small>
        <strong>SNAPSHOT Wednesday</strong>
        <p>You already paid. The percentage missed the memo.</p>
      </div>
    );
  }
  if (a === 'metro-atlanta-moves') {
    return (
      <div className="fc-ht-obj-atlanta" data-fc-accent={kit.accent} aria-hidden>
        <strong>Moving does not kill a collection</strong>
        <p>The fourth buyer is still shouting. Match the original creditor.</p>
      </div>
    );
  }
  if (a === 'metro-dc-fan') {
    return (
      <div className="fc-ht-obj-dc" data-fc-accent={kit.accent} aria-hidden>
        <span>DC</span>
        <span>MD</span>
        <span>VA</span>
        <p>Three states looks like identity theft. It is commuting.</p>
      </div>
    );
  }
  if (a === 'metro-chicago-docket') {
    return (
      <div className="fc-ht-obj-chicago" data-fc-accent={kit.accent} aria-hidden>
        <span>ComEd</span>
        <span>Visa</span>
        <p>Not one Chicago debt.</p>
      </div>
    );
  }
  if (a === 'metro-philly-age') {
    return (
      <div className="fc-ht-obj-philly" data-fc-accent={kit.accent} aria-hidden>
        <strong>Do not throw out the museum</strong>
        <p>The oldest good card is doing the real work.</p>
      </div>
    );
  }
  if (a === 'metro-jax-auto') {
    return (
      <div className="fc-ht-obj-jax" data-fc-accent={kit.accent} aria-hidden>
        <i>VIN</i>
        <p>Florida mail is on statute time. Not island time.</p>
      </div>
    );
  }
  return (
    <div className="fc-ht-obj-nj" data-fc-accent={kit.accent} aria-hidden>
      <span>Newark</span>
      <span>Elizabeth</span>
      <span>Jersey City</span>
      <p>The Turnpike is not a credit bureau.</p>
    </div>
  );
}

function ValidationDocketObject() {
  return (
    <div className="fc-ht-obj-docket" aria-hidden>
      <small>Validation docket</small>
      <strong>The letter is a clock</strong>
      <label>
        Day the envelope arrived
        <span>______ / ______ / ______</span>
      </label>
      <p>Keep the envelope. Ask for proof in writing.</p>
    </div>
  );
}

function CourtCaptionObject() {
  return (
    <div className="fc-ht-obj-court" aria-hidden>
      <small>In the court of</small>
      <p>Plaintiff v. Defendant</p>
      <em>Read the caption. Keep the answer date.</em>
    </div>
  );
}

function NoticeObject({ title, line }: { title: string; line: string }) {
  return (
    <div className="fc-ht-obj-notice" aria-hidden>
      <b>{title}</b>
      <p>{line}</p>
    </div>
  );
}

function RepoClockObject() {
  return (
    <div className="fc-ht-obj-repo" aria-hidden>
      <i>VIN</i>
      <div>
        <small>Repossession clock</small>
        <strong>The vehicle line and the date</strong>
        <p>Insurance notice + VIN last 6. Short window.</p>
      </div>
    </div>
  );
}

function BankruptcyCaptionObject() {
  return (
    <div className="fc-ht-obj-bk" aria-hidden>
      <small>United States Bankruptcy Court</small>
      <strong>IN RE</strong>
      <p>We read the line. We do not file one.</p>
    </div>
  );
}

function ChexObject() {
  return (
    <div className="fc-ht-obj-chex" aria-hidden>
      <span>
        <small>ChexSystems</small>
        <p>Banking report</p>
      </span>
      <span>
        <small>Equifax</small>
        <p>Credit bureau</p>
      </span>
    </div>
  );
}

function SessionCardObject() {
  return (
    <div className="fc-ht-obj-session" aria-hidden>
      <small>Session card</small>
      <strong>Bring the English letter</strong>
      <p>Date ______ · Time ______</p>
    </div>
  );
}

function DfyBriefObject() {
  return (
    <div className="fc-ht-obj-dfy" aria-hidden>
      <span>
        <small>You hold</small>
        <p>The envelope</p>
      </span>
      <span>
        <small>We run</small>
        <p>The English paper</p>
      </span>
    </div>
  );
}

function PrivacyLockObject() {
  return (
    <div className="fc-ht-obj-pin" aria-hidden>
      <i>PIN</i>
      <p>A freeze is a deadbolt. It does not erase a line.</p>
    </div>
  );
}

function TwoRoomsObject() {
  return (
    <div className="fc-ht-obj-rooms" aria-hidden>
      <span>Restore</span>
      <span>Debt</span>
      <p>Two rooms. Not a smoothie.</p>
    </div>
  );
}

function HoldCalendarObject() {
  return (
    <div className="fc-ht-obj-hold" aria-hidden>
      <small>Statement day</small>
      <strong>15</strong>
      <p>Photograph the statement. No new cards to celebrate.</p>
    </div>
  );
}

function DiyStarterObject() {
  return (
    <div className="fc-ht-obj-diy" aria-hidden>
      <small>You mail</small>
      <ol>
        <li>Circle one wrong line</li>
        <li>Screenshot the bureau</li>
        <li>Write the finding in English</li>
        <li>Print, sign, mail</li>
      </ol>
    </div>
  );
}

function VendorLadderObject() {
  return (
    <div className="fc-ht-obj-ladder" aria-hidden>
      <i>1</i>
      <p>Entity + EIN</p>
      <i>2</i>
      <p>Vendors that report</p>
      <i>3</i>
      <p>A company ask</p>
    </div>
  );
}

function KitObject({ kit, qrSrc }: { kit: HaitianDeskKit; qrSrc: string }) {
  const a = kit.architecture;
  if (a === 'collector-letter') return <LetterObject />;
  if (a === 'helper-playbook') return <SitTogetherObject />;
  if (a === 'church-handbill') return <FlyerObject qrSrc={qrSrc} />;
  if (a === 'bureau-dossier') return <RestoreObject />;
  if (a === 'diy-starter-card') return <DiyStarterObject />;
  if (a === 'card-use-ledger') return <BuildObject />;
  if (a === 'tradeline-stack') return <TradelineObject />;
  if (a === 'ein-folder') return <BusinessObject />;
  if (a === 'vendor-ladder') return <VendorLadderObject />;
  if (a === 'welcome-one-sheet') return <IntroObject />;
  if (a === 'visit-runway') return <StepsObject />;
  if (a === 'validation-docket') return <ValidationDocketObject />;
  if (a === 'court-summons') return <CourtCaptionObject />;
  if (a === 'foreclosure-notice') return <NoticeObject title="FORECLOSURE NOTICE" line="Equifax cannot pause a sale." />;
  if (a === 'repo-notice') return <RepoClockObject />;
  if (a === 'bankruptcy-file') return <BankruptcyCaptionObject />;
  if (a === 'chex-stamp') return <ChexObject />;
  if (a === 'appointment-card') return <SessionCardObject />;
  if (a === 'dfy-matter-brief') return <DfyBriefObject />;
  if (a === 'privacy-lock') return <PrivacyLockObject />;
  if (a === 'bundle-band') return <TwoRoomsObject />;
  if (a === 'maintenance-calendar') return <HoldCalendarObject />;
  if (a === 'cs-recruit-playbook') return <RecruitObject />;
  if (a === 'cs-field-pack') return <FieldPackObject />;
  if (a === 'affiliate-pass') return <AffiliateObject />;
  if (a === 'admin-playbook') return <AdminMapObject />;
  if (a?.startsWith('metro-')) return <MetroObject kit={kit} />;
  return <CreditFileObject />;
}

function pieceToKit(id: string): HaitianDeskKit | undefined {
  return haitianKitById(id);
}

export function HaitianMarketingKitLibrary() {
  const [room, setRoom] = useState<HaitianPieceRoom>('service');
  const pieces = useMemo(() => listHaitianPiecesByRoom(room), [room]);
  const [selectedId, setSelectedId] = useState(pieces[0]?.id ?? 'restore');
  const [sendOpen, setSendOpen] = useState(false);
  const selected = useMemo(() => pieceToKit(selectedId) ?? pieceToKit(pieces[0]?.id ?? 'restore'), [selectedId, pieces]);
  const spec = haitianPieceById(selected?.id);
  const qrSrc = useMemo(() => qrCodeImageUrl(`${kitOrigin()}${spec?.ctaPath ?? HAITIAN_DESK_LIVE_PATH}`, 220), [spec?.ctaPath]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exportJob, setExportJob] = useState<{ kit: HaitianDeskKit; format: HaitianSocialFormat } | null>(null);
  const socialRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pieces.some((piece) => piece.id === selectedId) && pieces[0]) {
      setSelectedId(pieces[0].id);
      setSendOpen(false);
    }
  }, [pieces, selectedId]);

  const downloadKit = async (kit: HaitianDeskKit) => {
    setBusyId(kit.id);
    setNotice(null);
    try {
      await downloadHaitianDeskKitPdf(kit.id);
      setNotice(`Downloaded ${kit.title} PDF.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setBusyId(null);
    }
  };

  const copyCaption = async (kit: HaitianDeskKit) => {
    const text = haitianKitCaptionText(kit.captionEn, kit.captionHt);
    const ok = await copyHaitianCaption(text);
    setNotice(ok ? `Copied caption for ${kit.title}.` : 'Could not copy caption.');
  };

  const startSocial = (kit: HaitianDeskKit, format: HaitianSocialFormat) => {
    setNotice(null);
    setBusyId(kit.id);
    setExportJob({ kit, format });
  };

  useEffect(() => {
    if (!exportJob) return;
    let cancelled = false;
    const run = async () => {
      let attempts = 0;
      while (!socialRef.current && attempts < 12 && !cancelled) {
        attempts += 1;
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
      const node = socialRef.current;
      if (!node || cancelled) {
        if (!cancelled) {
          setNotice('Could not prepare the image.');
          setExportJob(null);
          setBusyId(null);
        }
        return;
      }
      try {
        await waitForHaitianSocialReady(node);
        if (cancelled) return;
        await downloadHaitianSocialPng(node, exportJob.kit.id, exportJob.format);
        if (!cancelled) setNotice(`Downloaded ${exportJob.kit.title} ${exportJob.format}.`);
      } catch (error) {
        if (!cancelled) setNotice(error instanceof Error ? error.message : 'Image download failed');
      } finally {
        if (!cancelled) {
          setExportJob(null);
          setBusyId(null);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [exportJob]);

  if (!selected) return null;
  const busy = busyId === selected.id;

  return (
    <div className="fc-ht-closet">
      <nav className="fc-ht-closet__rooms" aria-label="Closet rooms">
        {HAITIAN_PIECE_ROOMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === room ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            aria-pressed={item.id === room}
            onClick={() => setRoom(item.id)}
          >
            {item.title}
          </button>
        ))}
      </nav>

      <div className="fc-ht-closet__floor">
        <aside className="fc-ht-closet__nav" aria-label="Pieces in this room">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>{HAITIAN_PIECE_ROOMS.find((item) => item.id === room)?.lede}</p>
          <FinelyOsPaginatedStack
            items={pieces}
            pageSize={10}
            emptyMessage="No pieces in this room."
            renderItem={(piece) => (
              <button
                key={piece.id}
                type="button"
                className="fc-ht-closet__row"
                data-fc-accent={piece.accent}
                data-selected={piece.id === selected.id ? '1' : '0'}
                onClick={() => {
                  setSelectedId(piece.id);
                  setSendOpen(false);
                }}
              >
                <strong>{piece.title}</strong>
                <span>{piece.titleHt}</span>
              </button>
            )}
          />
        </aside>

        <section className="fc-ht-closet__sheet" aria-label={selected.title}>
          <KitObject kit={selected} qrSrc={qrSrc} />
          <p className={FINELY_OS_ENTITY_SUBLABEL}>{selected.ordinal} · {spec?.format ?? 'one-sheet'}</p>
          <h2 className={`mt-1 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selected.title}</h2>
          <p className={`mt-1 text-lg font-bold ${FINELY_OS_ENTITY_BODY}`}>{selected.titleHt}</p>
          <p className={`mt-3 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{spec?.hookEn ?? selected.purpose}</p>
          <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{spec?.actionEn}</p>
          {room === 'metro' && spec?.ctaPath ? (
            <p className="mt-2">
              <Link className={FINELY_OS_SECONDARY_BTN} to={spec.ctaPath}>
                Open this metro desk
              </Link>
            </p>
          ) : null}
          <div className="fc-ht-lib__actions">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={() => downloadKit(selected)}>
              Download PDF <Download size={16} aria-hidden />
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={() => startSocial(selected, 'post')}>
              Download post <ImageDown size={16} aria-hidden />
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={() => startSocial(selected, 'story')}>
              Download story <ImageDown size={16} aria-hidden />
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={() => copyCaption(selected)}>
              Copy caption <Copy size={16} aria-hidden />
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setSendOpen(true)}>
              Send <Mail size={16} aria-hidden />
            </button>
          </div>
          {sendOpen ? <HaitianSendPieceSheet kit={selected} onClose={() => setSendOpen(false)} /> : null}
          {notice ? <p className={`fc-ht-lib__notice ${FINELY_OS_ENTITY_BODY}`}>{notice}</p> : null}
          <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-5`}>{HAITIAN_HELPER_COMPLIANCE_EN}</p>
        </section>
      </div>

      <section className="fc-ht-lib__room" data-room="metro" aria-label="City flyers">
        <p className={FINELY_OS_ENTITY_SUBLABEL}>Public metro desks</p>
        <h2 className={`mt-1 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Open a city desk</h2>
        <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          These links open the public page. To send a flyer, pick City flyers above and type a person’s email.
        </p>
        <div className="fc-ht-lib__metro">
          {HAITIAN_PLACE_CARDS.map((place) => (
            <Link
              key={place.key}
              className="fc-ht-lib__chip"
              data-fc-accent={place.accent}
              to={place.cityPath ?? HAITIAN_DESK_LIVE_PATH}
            >
              <strong>{place.city}</strong>
              <span>{place.metro}</span>
            </Link>
          ))}
        </div>
      </section>

      {exportJob ? (
        <div className="fc-ht-social-host" aria-hidden>
          <HaitianKitSocialFrame ref={socialRef} kit={exportJob.kit} format={exportJob.format} qrSrc={qrSrc} />
        </div>
      ) : null}
    </div>
  );
}
