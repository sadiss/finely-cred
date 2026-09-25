import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import {
  bulkImportLeads,
  bulkImportSampleCsv,
  haitianColdImportSampleCsv,
  leadsToCsv,
  parseLeadsCsv,
} from '../../lib/leadsBulkImport';
import {
  dedupePreparedImportRows,
  importCrmOnlyLeads,
  parseCommunityContactCsv,
} from '../../lib/crmSilentLeadImport';
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
  const [crmOnly, setCrmOnly] = useState(true);
  const [haitianPreset, setHaitianPreset] = useState(true);

  const loadSample = () => {
    setCsv(haitianPreset ? haitianColdImportSampleCsv() : bulkImportSampleCsv());
    setNotice(
      haitianPreset
        ? 'Haitian community sample loaded — CRM-only, cold, no email.'
        : 'Sample CSV loaded — edit or paste your own rows.',
    );
  };

  const exportExisting = () => {
    const text = leadsToCsv(listLeadCaptures().slice(0, 500));
    downloadText({ filename: 'finely-leads-export.csv', text, mimeType: 'text/csv' });
  };

  const runImport = async () => {
    setBusy(true);
    setNotice(null);
    try {
      if (haitianPreset || crmOnly) {
        const { rows, errors: parseErrors } = parseCommunityContactCsv(csv, {
          listName: haitianPreset ? 'finely-haitian-admin-paste' : 'admin-csv-import',
        });
        const { unique } = dedupePreparedImportRows([rows]);
        if (!unique.length) {
          setNotice(parseErrors.join(' ') || 'No valid rows to import.');
          return;
        }
        const result = await importCrmOnlyLeads(unique);
        const parts = [
          `Imported ${result.imported}`,
          result.updated ? `${result.updated} updated` : '',
          result.skipped ? `${result.skipped} skipped (dupes)` : '',
          result.failed ? `${result.failed} failed` : '',
          '0 emails sent',
          '0 sequences enrolled',
        ].filter(Boolean);
        setNotice(parts.join(' · ') + (parseErrors.length ? ` · ${parseErrors.length} parse warnings` : ''));
        if (result.imported + result.updated > 0) {
          window.dispatchEvent(new Event('finely:store'));
          onImported?.();
        }
        return;
      }

      const { rows, errors: parseErrors } = parseLeadsCsv(csv);
      if (!rows.length) {
        setNotice(parseErrors.join(' ') || 'No valid rows to import.');
        return;
      }
      const result = await bulkImportLeads(rows);
      const parts = [
        `Imported ${result.imported}`,
        result.skipped ? `${result.skipped} skipped (dupes)` : '',
        result.failed ? `${result.failed} failed` : '',
      ].filter(Boolean);
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
        Paste CSV. Haitian community headers work: First name, Last name, Phone number, Email, Area
        code, State guess. CRM-only mode writes inbound leads and tags — it does not email or enroll
        sequences.
      </p>
      <label className={`${FINELY_OS_ENTITY_BODY} flex items-center gap-2 text-sm`}>
        <input type="checkbox" checked={crmOnly} onChange={(e) => setCrmOnly(e.target.checked)} />
        CRM only — no email, no sequences
      </label>
      <label className={`${FINELY_OS_ENTITY_BODY} flex items-center gap-2 text-sm`}>
        <input
          type="checkbox"
          checked={haitianPreset}
          onChange={(e) => {
            setHaitianPreset(e.target.checked);
            if (e.target.checked) setCrmOnly(true);
          }}
        />
        Haitian community cold preset (source=haitian_csv_import, temperature=cold)
      </label>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={8}
        placeholder="First name,Last name,Phone number,Email,Area code,State guess"
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
