import React, { useState } from 'react';
import { sendHaitianPieceEmail, type HaitianPieceAudience } from '../../../../lib/sendHaitianPieceEmail';
import type { HaitianDeskKit } from '../../../../lib/haitianDeskKits';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../../os/finelyOsLightUi';

export function HaitianSendPieceSheet({
  kit,
  onClose,
}: {
  kit: HaitianDeskKit;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [audience, setAudience] = useState<HaitianPieceAudience>('lead');
  const [locale, setLocale] = useState<'en' | 'ht'>('en');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setErr(null);
    setNote(null);
    setBusy(true);
    try {
      const result = await sendHaitianPieceEmail({
        pieceId: kit.id,
        email,
        name,
        audience,
        locale,
      });
      if (result.ok) {
        setNote(`Sent ${kit.title} to ${email.trim()}.`);
        setEmail('');
      } else {
        setErr(
          result.error +
            ('savedLead' in result && result.savedLead ? ' We still saved this email as a lead.' : ''),
        );
      }
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not send.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="fc-ht-send" onSubmit={send} aria-label={`Send ${kit.title}`}>
      <p className={FINELY_OS_ENTITY_SUBLABEL}>Send this piece</p>
      <h3 className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{kit.title}</h3>
      <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
        Type their email. One page. A city is what a flyer is about — not who receives it.
      </p>
      {kit.architecture?.startsWith('metro-') ? (
        <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          This flyer is about households in this city. Send it to a person — type their email.
        </p>
      ) : null}
      <label className="fc-ht-send__field">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <label className="fc-ht-send__field">
        <span>Email</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" />
      </label>
      <label className="fc-ht-send__field">
        <span>Who are you sending this to?</span>
        <select value={audience} onChange={(e) => setAudience(e.target.value as HaitianPieceAudience)}>
          <option value="lead">Someone who needs help</option>
          <option value="helper">A family helper (niece, son, spouse)</option>
          <option value="specialist">A Credit Specialist</option>
          <option value="church">A church or community contact</option>
          <option value="affiliate">A referral partner</option>
        </select>
      </label>
      <label className="fc-ht-send__field">
        <span>Email language</span>
        <select value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'ht')}>
          <option value="en">English</option>
          <option value="ht">Kreyòl</option>
        </select>
      </label>
      <div className="fc-ht-send__actions">
        <button type="submit" className={FINELY_OS_PRIMARY_BTN} disabled={busy}>
          {busy ? 'Sending…' : 'Send'}
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onClose}>
          Close
        </button>
      </div>
      {note ? <p className={`fc-ht-lib__notice ${FINELY_OS_ENTITY_BODY}`}>{note}</p> : null}
      {err ? <p className={`fc-ht-lib__notice ${FINELY_OS_ENTITY_BODY}`}>{err}</p> : null}
    </form>
  );
}
