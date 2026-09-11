import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendHaitianPieceEmail } from '../../lib/sendHaitianPieceEmail';
import { HAITIAN_KIT_PATH, openHaitianCompanionChat } from '../../lib/haitianCompanionDesk';
import type { HaitianDeskKit } from '../../lib/haitianDeskKits';
import './haitianLetterMeaningFlyer.css';

const LINES = [
  {
    key: 'collection',
    label: 'Collection',
    english: 'This account is reporting a collection.',
    kreyol: 'Yon kolektè ap rapòte yon kont sou dosye kredi w.',
    words: ['collection', 'account', 'reporting'],
    note: 'Sa pa vle di ou dwe peye jodi a. Li vle di yon kolektè ap mete yon kont sou dosye w.',
  },
  {
    key: 'verify',
    label: 'Verify',
    english: 'Please verify this information.',
    kreyol: 'Yo mande pou verifye enfòmasyon sa a.',
    words: ['verify', 'information'],
    note: 'Verify se yon mo sou lèt la. Se pa yon lòd pou voye lajan jodi a.',
  },
] as const;

type Props = {
  kit: HaitianDeskKit;
  haitianHref: string;
};

export function HaitianLetterMeaningFlyer({ kit, haitianHref }: Props) {
  const [lineKey, setLineKey] = useState<(typeof LINES)[number]['key']>('collection');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const line = LINES.find((item) => item.key === lineKey) ?? LINES[0];

  const sendKit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErr(null);
    setNote(null);
    if (!name.trim()) {
      setErr('Enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErr('Enter a valid email.');
      return;
    }
    setBusy(true);
    try {
      const result = await sendHaitianPieceEmail({
        pieceId: kit.id,
        email: email.trim(),
        name: name.trim(),
        audience: 'lead',
        locale: 'ht',
      });
      if (!result.ok) {
        setErr(result.error);
        return;
      }
      setNote(`We sent ${kit.titleHt} to ${email.trim()}.`);
    } catch {
      setErr('Could not save that email. Try again, or Pale Kreyòl.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-fc-letter-meaning-flyer="1">
      <div className="lm-gutter">
        <Link className="lm-back" to={HAITIAN_KIT_PATH}>
          <ArrowLeft size={16} aria-hidden /> All kits
        </Link>
      </div>

      <div className="lm-stage">
        <article className="lm-sheet" aria-label="What this letter says">
          <header className="lm-sheet__head">
            <p className="lm-brand">Finely Cred</p>
            <p className="lm-kicker">Haitian community · one letter</p>
            <h1>
              What this letter says
              <span>Lèt sa a di kisa?</span>
            </h1>
            <p className="lm-lede">
              The English line stays on the page. That is what they mailed you. Kreyòl tells you what it asks.
            </p>
          </header>

          <div className="lm-letter" data-line={line.key}>
            <div className="lm-letter__meta">
              <span>Collector letter</span>
              <span className="lm-letter__stamp" aria-hidden>
                On file
              </span>
            </div>
            <p className="lm-letter__from">Re: Your credit file</p>
            <p className="lm-letter__english">{line.english}</p>
            <div className="lm-letter__picks" role="tablist" aria-label="Letter lines">
              {LINES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={item.key === line.key}
                  className={item.key === line.key ? 'is-on' : undefined}
                  onClick={() => setLineKey(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <section className="lm-meaning" aria-label="Kreyòl meaning">
            <p className="lm-meaning__label">Kreyòl</p>
            <p className="lm-meaning__line">{line.kreyol}</p>
            <p className="lm-meaning__note">{line.note}</p>
            <p className="lm-words-label">On the letter</p>
            <ul className="lm-words">
              {line.words.map((word) => (
                <li key={word}>{word}</li>
              ))}
            </ul>
          </section>

          <footer className="lm-next">
            <div>
              <p className="lm-next__label">One next step</p>
              <p className="lm-next__copy">
                If this is a collector, open Debt and legal. Sit together. Do not promise a score.
              </p>
            </div>
            <div className="lm-next__actions">
              <button type="button" className="lm-btn-primary" onClick={() => openHaitianCompanionChat()}>
                Pale Kreyòl <ArrowRight size={16} aria-hidden />
              </button>
              <Link className="lm-btn-secondary" to="/pricing/debt-legal">
                Debt and legal
              </Link>
            </div>
            <p className="lm-compliance">
              Results vary · not legal advice · funding subject to underwriting · Rezilta yo varye
            </p>
          </footer>
        </article>
      </div>

      <section className="lm-gutter lm-capture" aria-label="Email this sheet">
        <img
          className="lm-cover"
          src="/images/haitian-kits/letter-meaning-cover.png"
          alt="What this letter says — one-sheet cover"
          width={360}
          height={480}
        />
        <div className="lm-capture__form">
          <p className="lm-kicker">Keep this sheet</p>
          <h2>Email this letter kit</h2>
          <p>One topic: what a collector letter is asking. We save your email so you can open it later.</p>
          <form onSubmit={(event) => void sendKit(event)}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
            <button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Email this kit'}
            </button>
          </form>
          {err ? <p className="lm-form-note is-err">{err}</p> : null}
          {note ? <p className="lm-form-note">{note}</p> : null}
          <Link className="lm-quiet" to={haitianHref}>
            Back to Haitian community
          </Link>
        </div>
      </section>
    </div>
  );
}
