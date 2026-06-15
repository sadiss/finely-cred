import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { bulkImportLeads, bulkImportSampleCsv, leadsToCsv, parseLeadsCsv } from '../../lib/leadsBulkImport';
import { listLeadCaptures } from '../../data/leadsRepo';
import { downloadText } from '../../utils/download';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../os/finelyOsLightUi';

export function LeadBulkImportPanel({ onImported }: { onImported?: () => void }) {
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSample = () => {
    setCsv(bulkImportSampleCsv());
    setNotice('Sample CSV loaded — edit or paste your own rows.');
  };

  const exportExisting = () => {
    const text = leadsToCsv(listLeadCaptures().slice(0, 500));
    downloadText({ filename: 'finely-leads-export.csv', text, mimeType: 'text/csv' });
  };

  const runImport = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const { rows, errors: parseErrors } = parseLeadsCsv(csv);
      if (!rows.length) {
        setNotice(parseErrors.join(' ') || 'No valid rows to import.');
        return;
      }
      const result = await bulkImportLeads(rows);
      const parts = [`Imported ${result.imported}`, result.skipped ? `${result.skipped} skipped (dupes)` : '', result.failed ? `${result.failed} failed` : ''].filter(Boolean);
      setNotice(parts.join(' · ') + (parseErrors.length ? ` · ${parseErrors.length} parse warnings` : ''));
      if (result.imported > 0) {
        window.dispatchEvent(new Event('finely:store'));
        onImported?.();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className={FINELY_OS_ENTITY_SUBLABEL}>Bulk CSV import</div>
      <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
        Paste CSV with headers: full_name, email, phone, interest, source, consent_to_contact. Each row runs the full lead capture pipeline (CRM, nurture, scoring).
      </p>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={8}
        placeholder="full_name,email,phone,interest..."
        className={`${FINELY_OS_ENTITY_INPUT} font-mono text-xs resize-y`}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={loadSample} className={FINELY_OS_SECONDARY_BTN}>
          Load sample
        </button>
        <button type="button" onClick={exportExisting} className={FINELY_OS_SECONDARY_BTN}>
          <Download size={14} /> Export leads
        </button>
        <button type="button" disabled={busy || !csv.trim()} onClick={() => void runImport()} className={FINELY_OS_PRIMARY_BTN}>
          <Upload size={14} /> {busy ? 'Importing…' : 'Import CSV'}
        </button>
      </div>
      {notice ? <div className="text-sm text-emerald-200/90">{notice}</div> : null}
    </div>
  );
}
