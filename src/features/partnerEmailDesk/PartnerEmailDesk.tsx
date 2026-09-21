import { useMemo, useState } from 'react';
import '../commandIntelligence/commandIntelligence.css';
import {
  PARTNER_EMAIL_VERTICALS,
  PARTNER_FROM_ADDRESSES,
  addPartnerEmailDraft,
  approvePartnerEmailDraft,
  ensurePartnerEmailDrafts,
  isPartnerFromAddress,
  savePartnerEmailDraft,
  verticalLabel,
  type PartnerEmailDraft,
  type PartnerEmailVertical,
  type PartnerFromAddress,
} from './partnerEmailDesk';

const ZOHO_COPY = 'Site deploy NOT required — sends via Zoho SMTP when ZOHO_SMTP_* set';

export function PartnerEmailDesk() {
  const [rows, setRows] = useState<PartnerEmailDraft[]>(() => ensurePartnerEmailDrafts());
  const [vertical, setVertical] = useState<PartnerEmailVertical>('tax');
  const [fromEmail, setFromEmail] = useState<PartnerFromAddress>(PARTNER_FROM_ADDRESSES[0]);
  const [toName, setToName] = useState('');
  const [toEmail, setToEmail] = useState('');
  const hold = useMemo(() => rows.filter((row) => row.status === 'hold').length, [rows]);
  const approved = rows.length - hold;

  return (
    <section className="fc-mail-desk" aria-label="Partner Email Desk">
      <p className="fc-mail-kicker">Partner Email Desk</p>
      <h2>Approve before send</h2>
      <p className="fc-mail-banner">{ZOHO_COPY}</p>
      <p>From addresses already on the account. Nothing on this screen transmits.</p>
      <div className="fc-mail-kpis">
        <div><b>{hold}</b><span>HOLD</span></div>
        <div><b>{approved}</b><span>Approved, unsent</span></div>
        <div><b>0</b><span>Sent</span></div>
      </div>

      <form
        className="fc-mail-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!toEmail.trim()) return;
          setRows(addPartnerEmailDraft({ toName, toEmail, vertical, fromEmail }));
          setToName('');
          setToEmail('');
        }}
      >
        <label>
          Vertical
          <select value={vertical} onChange={(event) => setVertical(event.target.value as PartnerEmailVertical)} aria-label="Vertical template">
            {PARTNER_EMAIL_VERTICALS.map((item) => (
              <option key={item} value={item}>{verticalLabel(item)}</option>
            ))}
          </select>
        </label>
        <label>
          From
          <select
            value={fromEmail}
            onChange={(event) => {
              if (isPartnerFromAddress(event.target.value)) setFromEmail(event.target.value);
            }}
            aria-label="From address"
          >
            {PARTNER_FROM_ADDRESSES.map((address) => (
              <option key={address} value={address}>{address}</option>
            ))}
          </select>
        </label>
        <input value={toName} onChange={(event) => setToName(event.target.value)} placeholder="Partner name" aria-label="Partner name" />
        <input value={toEmail} onChange={(event) => setToEmail(event.target.value)} placeholder="Partner email" aria-label="Partner email" />
        <button type="submit">Add HOLD draft</button>
      </form>

      {rows.length === 0 ? (
        <p>No warm partner files with an email yet. Add a name above. The queue stays empty until then.</p>
      ) : null}

      {rows.map((row) => (
        <details key={row.id} className="fc-mail-card">
          <summary>
            <strong>{row.toName || row.toEmail}</strong>
            <span>{verticalLabel(row.vertical)} · {row.status === 'hold' ? 'HOLD' : 'Approved, unsent'}</span>
          </summary>
          <DraftEditor
            draft={row}
            onChange={(next) => setRows(savePartnerEmailDraft(next))}
            onApprove={() => setRows(approvePartnerEmailDraft(row.id))}
          />
        </details>
      ))}
    </section>
  );
}

function DraftEditor({
  draft,
  onChange,
  onApprove,
}: {
  draft: PartnerEmailDraft;
  onChange: (draft: PartnerEmailDraft) => void;
  onApprove: () => void;
}) {
  return (
    <div className="fc-mail-form">
      <label>
        From
        <select
          value={draft.fromEmail}
          aria-label={`From for ${draft.toName || draft.toEmail}`}
          onChange={(event) => {
            if (!isPartnerFromAddress(event.target.value)) return;
            onChange({ ...draft, fromEmail: event.target.value, sent: false });
          }}
        >
          {PARTNER_FROM_ADDRESSES.map((address) => (
            <option key={address} value={address}>{address}</option>
          ))}
        </select>
      </label>
      <input
        value={draft.subject}
        aria-label="Subject"
        onChange={(event) => onChange({ ...draft, subject: event.target.value, sent: false, status: 'hold' })}
      />
      <textarea
        rows={6}
        value={draft.body}
        aria-label="Body"
        onChange={(event) => onChange({ ...draft, body: event.target.value, sent: false, status: 'hold' })}
      />
      <p>To {draft.toEmail}. Status {draft.status === 'hold' ? 'HOLD' : 'approved'}. Unsent.</p>
      <button type="button" onClick={onApprove} disabled={draft.status === 'approved'}>
        {draft.status === 'approved' ? 'Approved — still unsent' : 'Approve — still unsent'}
      </button>
    </div>
  );
}
