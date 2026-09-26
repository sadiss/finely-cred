import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { StaffPortraitImg } from '../../components/staff/StaffPortraitImg';
import { getStaffMemberById } from '../../data/staffRoster';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { usePreviewReveal } from '../../features/personalCredit/preview/usePreviewReveal';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import {
  HAITIAN_DESK_LIVE_PATH,
  HAITIAN_HEAR_IT_LINES,
  HAITIAN_LETTER_SAMPLES,
  HAITIAN_PLACE_CARDS,
  HAITIAN_STAFF_IDS,
  openHaitianCompanionChat,
} from '../../lib/haitianCompanionDesk';
import { HAITIAN_HELPER_ARTICLE } from '../../lib/haitianHelperPlaybook';
import { playStaffReplyAudio } from '../../lib/publicChatStaffVoice';
import { CS_OFFER } from '../../config/creditSpecialistOffer';
import { HT_OFFERS, HT_PUBLIC } from '../../lib/haitianKreyolCopy';
import './haitianCompanionDesk.css';

const LETTERS = HAITIAN_LETTER_SAMPLES;
const STAFF_ACCENTS = ['emerald', 'violet', 'sky', 'rose', 'emerald', 'violet'] as const;

const SERVICE_OFFERS = HT_OFFERS;

export default function HaitianCompanionDeskPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [letterKey, setLetterKey] = useState<(typeof LETTERS)[number]['key']>('collection');
  const [hearing, setHearing] = useState(false);
  const [hearNote, setHearNote] = useState<string | null>(null);
  const letter = LETTERS.find((item) => item.key === letterKey) ?? LETTERS[0];
  const splitReveal = usePreviewReveal<HTMLDivElement>(0.2);

  const staff = useMemo(
    () => HAITIAN_STAFF_IDS.map((id) => getStaffMemberById(id)).filter(Boolean),
    [],
  );

  usePublicSeoMeta({
    title: 'Kreyòl credit help for Haitian Americans',
    description:
      'Credit help for Haitian Americans — restore, debt, building, and business credit. Pale Kreyòl. Book a session.',
    path: HAITIAN_DESK_LIVE_PATH,
  });

  useEffect(() => {
    if (params.get('chat') === '1') openHaitianCompanionChat();
  }, [params]);

  const paleKreyol = () => openHaitianCompanionChat();
  const bookSession = () => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Haitian community' });
  const hearIt = async (line: string) => {
    setHearing(true);
    setHearNote(null);
    const result = await playStaffReplyAudio({
      text: line,
      personaId: 'haitian_companion',
      staffMemberId: 'staff-marie-claire-baptiste',
    });
    setHearing(false);
    if (!result.ok) {
      setHearNote('Vwa a ap chaje. Eseye ankò nan yon ti moman.');
    }
  };

  return (
    <PageShell hideHero hideLaunchHelpStrip surface="ivory" contentWidth="full" title="Haitian community">
      <div data-fc-haitian-desk="1">
        <header className="ht-desk-hero">
          <div className="ht-desk-inner">
            <p className="ht-desk-eyebrow">{HT_PUBLIC.heroEyebrow}</p>
            <h1 className="ht-desk-hero__title">
              {HT_PUBLIC.heroTitleLead} <em>{HT_PUBLIC.heroTitleEm}</em>
            </h1>
            <p className="ht-desk-hero__sub">
              Credit help for <span>Haitian Americans</span>
            </p>
            <p className="ht-desk-hero__lede">{HT_PUBLIC.heroLede}</p>
            <div className="ht-desk-actions">
              <button type="button" className="ht-desk-btn-primary" onClick={paleKreyol}>
                Pale Kreyòl <ArrowRight size={16} aria-hidden />
              </button>
              <button type="button" className="ht-desk-btn-secondary" onClick={bookSession}>
                Book a session
              </button>
            </div>
            <p className="ht-desk-compliance">
              Results vary · not legal advice · funding subject to underwriting · Rezilta yo varye
            </p>

            <div
              ref={splitReveal.ref}
              className={`ht-split${splitReveal.visible ? ' is-on' : ''}`}
              aria-label="Credit letter sample"
            >
              <div className="ht-split__sheen" aria-hidden />
              <div className="ht-split__en">
                <span className="ht-split__label">English</span>
                <p className="ht-split__line">{letter.english}</p>
                <div className="ht-split__words">
                  {LETTERS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={item.key === letterKey ? 'is-on' : undefined}
                      onClick={() => setLetterKey(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ht-split__ht">
                <div className="ht-split__ribbon" aria-hidden />
                <span className="ht-split__label">Kreyòl</span>
                <p className="ht-split__meaning">{letter.kreyol}</p>
                <p className="ht-split__learn">
                  On the letter: <strong>{letter.learn}</strong>
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="ht-desk-section" id="ht-wow">
          <div className="ht-desk-inner">
            <p className="ht-desk-kicker">{HT_PUBLIC.wowKicker}</p>
            <h2 className="ht-desk-h2">{HT_PUBLIC.wowH2}</h2>
            <p className="ht-desk-lede">{HT_PUBLIC.wowLede}</p>
            <div className="ht-wow-grid">
              <article className="ht-wow-card" data-fc-accent="emerald">
                <strong>Equifax</strong>
                <p>One cousin. Photograph this screen.</p>
              </article>
              <article className="ht-wow-card" data-fc-accent="violet">
                <strong>Experian</strong>
                <p>Another cousin. They do not share a group chat.</p>
              </article>
              <article className="ht-wow-card" data-fc-accent="sky">
                <strong>TransUnion</strong>
                <p>The third. Late updates land unevenly.</p>
              </article>
              <article className="ht-wow-card" data-fc-accent="rose">
                <strong>The emailed PDF</strong>
                <p>A cousin, not the twin. The screen is the document.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="ht-desk-section" id="ht-metro">
          <div className="ht-desk-inner">
            <p className="ht-desk-kicker">{HT_PUBLIC.metroKicker}</p>
            <h2 className="ht-desk-h2">{HT_PUBLIC.metroH2}</h2>
            <div className="ht-metro-runway">
              {HAITIAN_PLACE_CARDS.map((stop) =>
                stop.cityPath ? (
                  <Link key={stop.key} className="ht-metro-chip" data-fc-accent={stop.accent} to={stop.cityPath}>
                    <strong>{stop.city}</strong>
                    <span>{stop.metro}</span>
                  </Link>
                ) : (
                  <button
                    key={stop.key}
                    type="button"
                    className="ht-metro-chip"
                    data-fc-accent={stop.accent}
                    onClick={paleKreyol}
                  >
                    <strong>{stop.city}</strong>
                    <span>{stop.metro}</span>
                  </button>
                ),
              )}
            </div>
            <nav className="ht-next-links" aria-label="Next steps">
              <Link to="/free-kreyol-guide">Free Kreyòl kits</Link>
              <Link to="/pricing/debt-legal">Debt summons desk</Link>
              <Link to="/start-here">All lanes</Link>
            </nav>
          </div>
        </section>

        <section className="ht-desk-section" id="ht-process">
          <div className="ht-desk-inner">
            <p className="ht-desk-kicker">{HT_PUBLIC.processKicker}</p>
            <h2 className="ht-desk-h2">{HT_PUBLIC.processH2}</h2>
            <p className="ht-desk-lede">{HT_PUBLIC.processLede}</p>
            <div className="ht-process ht-process--article">
              <p>
                We read the English line. You pick one desk — restore, debt, building, or business. Then we stop. Screenshots
                without dates are modern folklore. If the paper is a summons, the visit changes shape. We never promise a
                score. We never pretend to be the court.
              </p>
              <p>Yon liy angle. Yon biwo. Apre sa nou kanpe. Se pa yon seri tout lannwit.</p>
            </div>
          </div>
        </section>

        <section className="ht-desk-section ht-desk-section--offers" id="ht-offers">
          <div className="ht-desk-inner">
            <p className="ht-desk-kicker">{HT_PUBLIC.offersKicker}</p>
            <h2 className="ht-desk-h2">{HT_PUBLIC.offersH2}</h2>
            <p className="ht-desk-lede">{HT_PUBLIC.offersLede}</p>
            <div className="ht-offer-mosaic">
              {SERVICE_OFFERS.map((offer) => (
                <Link
                  key={offer.id}
                  className="ht-offer"
                  data-offer={offer.id}
                  data-fc-accent={offer.accent}
                  to={offer.path}
                >
                  <span className="ht-offer__sheen" aria-hidden />
                  <p className="ht-offer__kicker">
                    {offer.kicker}
                    <em>{offer.kickerHt}</em>
                  </p>
                  <strong>{offer.title}</strong>
                  <span className="ht-offer__ht">{offer.titleHt}</span>
                  <p className="ht-offer__process">{offer.process}</p>
                  <p className="ht-offer__process-ht">{offer.processHt}</p>
                  <p className="ht-offer__wow">{offer.wow}</p>
                  <p className="ht-offer__wow-ht">{offer.wowHt}</p>
                  <span className="ht-offer__go">
                    Open this desk <ArrowRight size={16} aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
            <p className="ht-desk-compliance">
              Results vary · not legal advice · funding subject to underwriting · Rezilta yo varye
            </p>
          </div>
        </section>

        <section className="ht-desk-section">
          <div className="ht-desk-inner">
            <div className="ht-hear">
              <span className="ht-hear__sheen" aria-hidden />
              <p className="ht-desk-kicker ht-hear__kicker">Tande l</p>
              <p>{HAITIAN_HEAR_IT_LINES.welcome}</p>
              <button type="button" onClick={() => void hearIt(HAITIAN_HEAR_IT_LINES.welcome)} disabled={hearing}>
                {hearing ? 'Ap pale…' : 'Tande mesaj la'}
              </button>
              {hearNote ? <p className="ht-hear-note">{hearNote}</p> : null}
            </div>
          </div>
        </section>

        <section className="ht-desk-section">
          <div className="ht-desk-inner">
            <p className="ht-desk-kicker">{HT_PUBLIC.staffKicker}</p>
            <h2 className="ht-desk-h2">{HT_PUBLIC.staffH2}</h2>
            <p className="ht-desk-lede">{HT_PUBLIC.staffLede}</p>
            <div className="ht-staff">
              {staff.map((member, index) => (
                <article
                  key={member!.id}
                  className="ht-staff__card"
                  data-fc-accent={STAFF_ACCENTS[index] ?? 'sky'}
                >
                  <StaffPortraitImg staff={member!} className="ht-staff-photo" />
                  <div>
                    <strong>
                      {member!.firstName} {member!.lastName}
                    </strong>
                    <span>{member!.displayTitle}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ht-desk-section" id="ht-helper">
          <div className="ht-desk-inner">
            <p className="ht-desk-kicker">{HT_PUBLIC.helperKicker}</p>
            <h2 className="ht-desk-h2">{HT_PUBLIC.helperH2}</h2>
            <div className="ht-helper">
              <article className="ht-helper__card">
                <span>{HT_PUBLIC.helperTitleEn}</span>
                <strong>{HT_PUBLIC.helperTitle}</strong>
                <p>{HAITIAN_HELPER_ARTICLE.p1En}</p>
                <p>{HAITIAN_HELPER_ARTICLE.p1Ht}</p>
                <p>{HAITIAN_HELPER_ARTICLE.p2En}</p>
                <p>{HAITIAN_HELPER_ARTICLE.p2Ht}</p>
                <div className="ht-desk-actions ht-desk-actions--start">
                  <button type="button" className="ht-desk-btn-primary" onClick={paleKreyol}>
                    Pale Kreyòl
                  </button>
                  <Link className="ht-desk-btn-secondary" to={CS_OFFER.pricingPath}>
                    Credit specialist
                  </Link>
                </div>
              </article>
              <article className="ht-hear ht-hear--side">
                <span className="ht-hear__sheen" aria-hidden />
                <p>{HAITIAN_HEAR_IT_LINES.helper}</p>
                <button type="button" onClick={() => void hearIt(HAITIAN_HEAR_IT_LINES.helper)} disabled={hearing}>
                  Tande pou moun k ap ede
                </button>
              </article>
            </div>
            <p className="ht-desk-compliance">
              Results vary · not legal advice · funding subject to underwriting · Rezilta yo varye
            </p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
