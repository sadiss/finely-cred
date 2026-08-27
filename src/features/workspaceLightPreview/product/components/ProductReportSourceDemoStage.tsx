import React, { useState } from 'react';
import { EyeOff, Fingerprint, ScanSearch, ShieldCheck } from 'lucide-react';

const reportRows = [
  ['Account status', 'Open', 'Open', 'Open'],
  ['Balance', '$1,840', '$1,840', '$1,840'],
  ['Payment status', 'Current', 'Current', 'Current'],
  ['Date reported', '07/18/26', '07/20/26', '07/19/26'],
];

export function ProductReportSourceDemoStage() {
  const [showProvenance, setShowProvenance] = useState(false);

  return (
    <section className="fc-wlp-source-demo">
      <div className="fc-wlp-source-demo-head">
        <div>
          <span className="fc-wlp-eyebrow">Source-faithful evidence</span>
          <h2>Every crop comes from that partner’s protected report.</h2>
        </div>
        <span className="fc-wlp-source-demo-badge">
          Synthetic demo · not a consumer report
        </span>
      </div>

      <div className="fc-wlp-source-demo-grid">
        <div className="fc-wlp-source-paper">
          <div className="fc-wlp-source-paper-bar">
            <span>
              <ScanSearch size={15} />
              Source report crop
            </span>
            <span>Page 12 · redacted</span>
          </div>
          <div className="fc-wlp-source-paper-title">
            <div>
              <strong>Metro Community Bank</strong>
              <span>Account •••• 4821</span>
            </div>
            <ShieldCheck size={22} />
          </div>
          <div className="fc-wlp-source-paper-table">
            <div className="fc-wlp-source-paper-row fc-wlp-source-paper-columns">
              <span>Reported field</span>
              <span>Experian</span>
              <span>Equifax</span>
              <span>TransUnion</span>
            </div>
            {reportRows.map((row) => (
              <div key={row[0]} className="fc-wlp-source-paper-row">
                {row.map((value, index) => (
                  <span key={`${row[0]}-${index}`}>{value}</span>
                ))}
              </div>
            ))}
          </div>
          <div className="fc-wlp-source-redaction">
            <EyeOff size={13} />
            SSN, birth date, and unrelated account data masked
          </div>
        </div>

        <div className="fc-wlp-source-proof">
          <span className="fc-wlp-source-proof-icon">
            <Fingerprint size={24} />
          </span>
          <span className="fc-wlp-eyebrow">Integrity record</span>
          <h3>Traceable without pretending parsed data is bureau UI.</h3>
          <p>
            The crop keeps its report ID, provider, page or HTML locator, content hash,
            redaction policy, and review state.
          </p>
          <button type="button" onClick={() => setShowProvenance((value) => !value)}>
            {showProvenance ? 'Hide provenance' : 'Preview provenance'}
          </button>
          {showProvenance ? (
            <dl className="fc-wlp-source-proof-list">
              <div><dt>Origin</dt><dd>Protected partner PDF</dd></div>
              <div><dt>Anchor</dt><dd>Page 12 · exact match</dd></div>
              <div><dt>Redaction</dt><dd>Policy v1 · review required</dd></div>
              <div><dt>Mail gate</dt><dd>Blocked until approved</dd></div>
            </dl>
          ) : null}
        </div>
      </div>

      <p className="fc-wlp-source-demo-foot">
        Real workspaces render the selected region from the partner’s own PDF or sanitized HTML.
        The demo above is intentionally labeled and cannot enter a mailing.
      </p>
    </section>
  );
}
