import React from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import { HAITIAN_DESK_LIVE_PATH, openHaitianCompanionChat } from '../../lib/haitianCompanionDesk';
import { HAITIAN_METRO_DESKS, haitianMetroBySlug } from '../../lib/haitianMetroDesks';
import { FINELY_COPY_COMPLIANCE_EN, FINELY_COPY_COMPLIANCE_HT } from '../../lib/finelyCopyVoice';
import './haitianMetroDesk.css';

function MetroSignature({ architecture }: { architecture: string }) {
  if (architecture === 'metro-miami-ledger') {
    return (
      <div className="ht-metro-sig ht-metro-sig--ledger" aria-hidden>
        <span>Haiti</span>
        <span>Couch</span>
        <span>Condo</span>
      </div>
    );
  }
  if (architecture === 'metro-brooklyn-mailbox') {
    return (
      <div className="ht-metro-sig ht-metro-sig--mail" aria-hidden>
        <i>MAIL</i>
        <p>Envelope date is evidence. A text is a rumor.</p>
      </div>
    );
  }
  if (architecture === 'metro-boston-campus') {
    return (
      <div className="ht-metro-sig ht-metro-sig--campus" aria-hidden>
        <span>Campus sold your name</span>
        <span>Hospital sold it too</span>
      </div>
    );
  }
  if (architecture === 'metro-houston-cycle') {
    return (
      <div className="ht-metro-sig ht-metro-sig--cycle" aria-hidden>
        <i>payday</i>
        <p>Payday Friday. Snapshot Wednesday. Panic Thursday.</p>
      </div>
    );
  }
  if (architecture === 'metro-atlanta-moves') {
    return (
      <div className="ht-metro-sig ht-metro-sig--moves" aria-hidden>
        <b />
        <b />
        <b />
        <p>Moving does not kill a collection.</p>
      </div>
    );
  }
  if (architecture === 'metro-dc-fan') {
    return (
      <div className="ht-metro-sig ht-metro-sig--fan" aria-hidden>
        <span>DC</span>
        <span>MD</span>
        <span>VA</span>
      </div>
    );
  }
  if (architecture === 'metro-chicago-docket') {
    return (
      <div className="ht-metro-sig ht-metro-sig--docket" aria-hidden>
        <span>City / utility</span>
        <span>Bank card</span>
      </div>
    );
  }
  if (architecture === 'metro-philly-age') {
    return (
      <div className="ht-metro-sig ht-metro-sig--age" aria-hidden>
        <i />
        <em />
        <p>Do not throw out the museum.</p>
      </div>
    );
  }
  if (architecture === 'metro-jax-auto') {
    return (
      <div className="ht-metro-sig ht-metro-sig--auto" aria-hidden>
        <i>VIN</i>
        <p>Florida mail is on statute time. Not island time.</p>
      </div>
    );
  }
  return (
    <div className="ht-metro-sig ht-metro-sig--corridor" aria-hidden>
      <span>Newark</span>
      <span>Elizabeth</span>
      <span>Jersey City</span>
    </div>
  );
}

export default function HaitianMetroDeskPage() {
  const { metro } = useParams();
  const navigate = useNavigate();
  const desk = haitianMetroBySlug(metro);

  usePublicSeoMeta({
    title: desk ? `${desk.city} Kreyòl credit help` : 'Kreyòl credit help',
    description: desk
      ? `${desk.jobEn} Pale Kreyòl. Book a session.`
      : 'Credit help for Haitian Americans.',
    path: desk ? `/haitian/${desk.slug}` : HAITIAN_DESK_LIVE_PATH,
    local: desk ? { city: desk.city, state: desk.metro } : undefined,
  });

  if (!desk) return <Navigate to={HAITIAN_DESK_LIVE_PATH} replace />;

  return (
    <PageShell hideHero hideLaunchHelpStrip surface="ivory" contentWidth="full" title={`${desk.city} Haitian community`}>
      <div data-fc-haitian-metro={desk.slug} data-architecture={desk.architecture} data-fc-accent={desk.accent}>
        <header className="ht-metro-hero">
          <div className="ht-metro-inner">
            <Link className="ht-metro-back" to={HAITIAN_DESK_LIVE_PATH}>
              Haitian community
            </Link>
            <p className="ht-metro-kicker">{desk.metro}</p>
            <h1 className="ht-metro-title">{desk.city}</h1>
            <p className="ht-metro-job">{desk.jobEn}</p>
            <p className="ht-metro-job-ht">{desk.jobHt}</p>
            <MetroSignature architecture={desk.architecture} />
            <p className="ht-metro-lede">{desk.ledeEn}</p>
            <p className="ht-metro-lede-ht">{desk.ledeHt}</p>
            <div className="ht-metro-actions">
              <button type="button" className="ht-metro-btn-primary" onClick={() => openHaitianCompanionChat()}>
                Pale Kreyòl
              </button>
              <button
                type="button"
                className="ht-metro-btn-secondary"
                onClick={() => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Haitian community' })}
              >
                Book a session
              </button>
            </div>
          </div>
        </header>

        <section className="ht-metro-section" data-band="wow">
          <div className="ht-metro-inner">
            {desk.sections.map((section) => (
              <article key={section.headingEn} className="ht-metro-article">
                <p className="ht-metro-kicker">{desk.city}</p>
                <h2 className="ht-metro-h2">{section.headingEn}</h2>
                <p className="ht-metro-lede-ht">{section.headingHt}</p>
                {section.paragraphsEn.map((para) => (
                  <p key={para} className="ht-metro-lede">
                    {para}
                  </p>
                ))}
                {section.paragraphsHt.map((para) => (
                  <p key={para} className="ht-metro-lede-ht">
                    {para}
                  </p>
                ))}
              </article>
            ))}
          </div>
        </section>

        <section className="ht-metro-section">
          <div className="ht-metro-inner">
            <p className="ht-metro-kicker">Do this today</p>
            <h2 className="ht-metro-h2">{desk.actionEn}</h2>
            <p className="ht-metro-lede-ht">{desk.actionHt}</p>
            <nav className="ht-next-links" aria-label="Next steps">
              <Link to="/free-kreyol-guide">Free Kreyòl kits</Link>
              <Link to="/pricing/debt-legal">Debt summons desk</Link>
              <Link to="/haitian">All Haitian desks</Link>
            </nav>
          </div>
        </section>

        <section className="ht-metro-section">
          <div className="ht-metro-inner">
            <p className="ht-metro-kicker">All desks</p>
            <div className="ht-metro-others">
              {HAITIAN_METRO_DESKS.map((item) => (
                <Link
                  key={item.slug}
                  className="ht-metro-chip"
                  data-fc-accent={item.accent}
                  data-current={item.slug === desk.slug ? '1' : '0'}
                  to={`/haitian/${item.slug}`}
                  aria-current={item.slug === desk.slug ? 'page' : undefined}
                >
                  <strong>{item.city}</strong>
                  <span>{item.metro}</span>
                </Link>
              ))}
            </div>
            <p className="ht-metro-comply">
              {FINELY_COPY_COMPLIANCE_EN} · {FINELY_COPY_COMPLIANCE_HT}
            </p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
