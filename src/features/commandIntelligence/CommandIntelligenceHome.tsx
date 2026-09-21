import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import './commandIntelligence.css';
import { listCommandAudit } from './commandAudit';
import { FinelyAssistantMark } from './FinelyAssistantMark';
import { runCommand, type CommandRun } from './commandRunner';
import { PARTNER_SUPPORT_FROM, sendPartnerEmail, zohoPartnerEmailEnabled } from './sendPartnerEmail';
import { listSoftPullConsents, recordSoftPullConsent, SOFT_PULL_DOCS, SOFT_PULL_VENDORS } from './softPullDesk';
import { warmPartnerRows } from './warmPartners';

const SHORTCUTS = [
  { href: '/admin/courses', title: 'Courses', detail: 'Build a lesson in plain language.' },
  { href: '/portal/training/academy', title: 'Onboarding', detail: 'Trainee academy and specialist lounge.' },
  { href: '/admin/marketing-desk', title: 'Marketing Desk', detail: 'Find partners on the map desk.' },
  { href: '/admin/partners', title: 'Warm partners', detail: 'Real files only. No invented scores.' },
  { href: '/pricing/business-credit', title: 'Business credit', detail: 'Public journey. Education, not a guarantee.' },
  { href: '/admin/playbooks', title: 'Playbooks', detail: 'Checklist library. No Anna persona.' },
] as const;

export function CommandIntelligenceHome() {
  const [ask, setAsk] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<CommandRun | null>(null);
  const [vendorId, setVendorId] = useState(SOFT_PULL_VENDORS[0]?.id ?? 'smartcredit');
  const [consentName, setConsentName] = useState('');
  const [consentNote, setConsentNote] = useState('');
  const [consents, setConsents] = useState(() => listSoftPullConsents());
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('A next step on your file');
  const [body, setBody] = useState('Here is the document or habit to finish this week. This is education, not a score promise.');
  const [approved, setApproved] = useState(false);
  const [sendNote, setSendNote] = useState('');
  const [auditTick, setAuditTick] = useState(0);
  const warm = useMemo(() => warmPartnerRows(5), [auditTick]);
  const drafts = useMemo(
    () => listCommandAudit().filter((row) => row.action.startsWith('partner_email')).slice(0, 4),
    [auditTick, sendNote],
  );

  async function onAsk(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      setAnswer(await runCommand(ask));
    } finally {
      setBusy(false);
    }
  }

  async function onSend(event: FormEvent) {
    event.preventDefault();
    const result = await sendPartnerEmail({ toEmail, subject, text: body, approved });
    setSendNote(result.message);
    setAuditTick((n) => n + 1);
  }

  return (
    <section className="fc-cmd" aria-label="Command Intelligence">
      <header className="fc-cmd-head">
        <FinelyAssistantMark />
        <div>
          <p className="fc-cmd-kicker">Start here</p>
          <h2 className="fc-cmd-title">Command Intelligence</h2>
          <p className="fc-cmd-lead">One desk. Ask in plain language. Nothing sends unless you approve it.</p>
        </div>
      </header>

      <div className="fc-cmd-grid fc-cmd-grid-4">
        <div className="fc-cmd-kpi"><b>{warm.length}</b><span>Warm files</span></div>
        <div className="fc-cmd-kpi"><b>{drafts.length}</b><span>Email notes</span></div>
        <div className="fc-cmd-kpi"><b>{zohoPartnerEmailEnabled() ? 'On' : 'Off'}</b><span>Zoho flag</span></div>
        <div className="fc-cmd-kpi"><b>0</b><span>Invented scores</span></div>
      </div>

      <div className="fc-cmd-grid fc-cmd-grid-2">
        {SHORTCUTS.map((item) => (
          <Link key={item.href} to={item.href} className="fc-cmd-card">
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </Link>
        ))}
      </div>

      <form className="fc-cmd-ask" onSubmit={onAsk}>
        <input
          value={ask}
          onChange={(event) => setAsk(event.target.value)}
          placeholder="Ask: find partners in Miami, draft a partner email, caption, course step…"
          aria-label="Ask Command Intelligence"
        />
        <button className="fc-cmd-gold" type="submit" disabled={busy}>
          {busy ? 'Working' : 'Ask'}
        </button>
      </form>
      {answer ? (
        <div className="fc-cmd-light">
          <strong>{answer.title}</strong>
          <p className="fc-cmd-answer">{answer.body}</p>
          {answer.href ? <Link to={answer.href}>{answer.hrefLabel || 'Open'}</Link> : null}
        </div>
      ) : null}

      <div className="fc-cmd-grid fc-cmd-grid-2">
        <article className="fc-cmd-card">
          <strong>Warm partner list</strong>
          <span>Sorted by the file’s last update. Paused files stay off this list.</span>
          {warm.length === 0 ? <span>No local partner files yet. Add one in Partners.</span> : null}
          {warm.map((row) => (
            <div className="fc-cmd-row" key={row.id}>
              <span>
                <strong>{row.name}</strong>
                <br />
                {row.next}
              </span>
              <span>{row.stage}</span>
            </div>
          ))}
        </article>

        <form className="fc-cmd-card fc-cmd-field" onSubmit={onSend}>
          <strong>Partner email</strong>
          <span>From {PARTNER_SUPPORT_FROM}. Drafts save locally. Send needs your approval and Zoho secrets.</span>
          <input value={toEmail} onChange={(event) => setToEmail(event.target.value)} placeholder="Partner email" aria-label="Partner email" />
          <input value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Subject" />
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} aria-label="Email body" />
          <label className="fc-cmd-check">
            <input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} />
            Approve before send
          </label>
          <button className="fc-cmd-ink" type="submit">{approved ? 'Send if Zoho is ready' : 'Save draft'}</button>
          {sendNote ? <span>{sendNote}</span> : null}
        </form>
      </div>

      <details>
        <summary>Soft pull — vendor, consent, documents</summary>
        <div className="fc-cmd-field" style={{ marginTop: '0.75rem', display: 'grid', gap: '0.6rem' }}>
          <p className="fc-cmd-note">Choosing a vendor does not call their API and does not return a score.</p>
          <select value={vendorId} onChange={(event) => setVendorId(event.target.value)} aria-label="Monitoring vendor">
            {SOFT_PULL_VENDORS.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
            ))}
          </select>
          <span>{SOFT_PULL_VENDORS.find((vendor) => vendor.id === vendorId)?.note}</span>
          <ul>
            {SOFT_PULL_DOCS.map((doc) => <li key={doc}>{doc}</li>)}
          </ul>
          <input value={consentName} onChange={(event) => setConsentName(event.target.value)} placeholder="Partner name" aria-label="Consent partner name" />
          <textarea value={consentNote} onChange={(event) => setConsentNote(event.target.value)} rows={2} placeholder="What they agreed to" aria-label="Consent note" />
          <button
            className="fc-cmd-gold"
            type="button"
            onClick={() => {
              recordSoftPullConsent({ vendorId, partnerName: consentName, note: consentNote });
              setConsents(listSoftPullConsents());
              setConsentNote('');
            }}
          >
            Log consent
          </button>
          {consents.slice(0, 3).map((row) => (
            <span key={row.id}>{row.partnerName} · {row.vendorId} · pull not run</span>
          ))}
        </div>
      </details>
    </section>
  );
}
