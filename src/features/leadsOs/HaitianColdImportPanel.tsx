import React, { useState } from 'react';
import { Upload, Users } from 'lucide-react';
import {
  bulkImportHaitianColdLeads,
  formatHaitianColdImportReport,
  haitianColdImportSampleCsv,
  parseHaitianColdCsv,
} from '../../lib/haitianColdImport';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../os/finelyOsLightUi';

export function HaitianColdImportPanel({ onImported }: { onImported?: () => void }) {
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSample = () => {
    setCsv(haitianColdImportSampleCsv());
    setNotice('Sample CSV loaded — paste your cleaned Haitian list (no PII in git).');
  };

  const runImport = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const { rows, errors: parseErrors } = parseHaitianColdCsv(csv);
      if (!rows.length) {
        setNotice(parseErrors.join(' ') || 'No valid rows to import.');
        return;
      }
      const result = await bulkImportHaitianColdLeads(rows, { dryRun });
      const report = formatHaitianColdImportReport(result);
      const warn = parseErrors.length ? ` · ${parseErrors.length} parse warnings` : '';
      const fail = result.errors.length ? ` · ${result.errors.length} errors` : '';
      setNotice(`${report}${warn}${fail}`);
      if (!dryRun && (result.inserted > 0 || result.updated > 0)) {
        window.dispatchEvent(new Event('finely:store'));
        onImported?.();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-emerald-300" />
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Haitian cold CSV import</div>
      </div>
      <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
        Imports cold Haitian community contacts with <strong>no consent</strong> and <strong>no nurture</strong>.
        Dedupes by email (phone fallback). Re-run is idempotent. Never commit PII CSVs to git.
      </p>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={6}
        placeholder="First name,Last name,Phone number,Email,..."
        className={`${FINELY_OS_ENTITY_INPUT} font-mono text-xs resize-y`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="rounded" />
          Dry run (counts only)
        </label>
        <button type="button" onClick={loadSample} className={FINELY_OS_SECONDARY_BTN}>
          Load sample
        </button>
        <button
          type="button"
          disabled={busy || !csv.trim()}
          onClick={() => void runImport()}
          className={FINELY_OS_PRIMARY_BTN}
        >
          <Upload size={14} /> {busy ? 'Running…' : dryRun ? 'Dry run import' : 'Import cold leads'}
        </button>
      </div>
      {notice ? <div className="text-sm text-emerald-200/90">{notice}</div> : null}
    </div>
  );
}
