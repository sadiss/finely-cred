import React, { useRef, useState } from 'react';
import type { CrmRecord } from '../../../domain/crmRecords';
import {
  downloadTextFile,
  exportCrmRecordsCsv,
  exportCrmRecordsJson,
  exportFilename,
  importCrmRows,
  parseCrmImportCsv,
  summarizeExport,
} from '../bulk/crmBulkData';
import { Download, Upload, FileSpreadsheet, X } from 'lucide-react';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_INNER,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
  finelyOsCatalogCard,} from '../../os/finelyOsLightUi';

const CSV_TEMPLATE = `fullName,email,phone,interest,consentToContact,referralCode,kind,target
Jane Doe,jane@example.com,555-0100,personal restore,true,AFF123,lead,clients
Acme Corp,,sales@acme.com,,true,,prospect,clients`;

export function CrmBulkDataPanel({
  open,
  onClose,
  records,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  records: CrmRecord[];
  onImported?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleFile = async (file: File) => {
    setBusy(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const rows = parseCrmImportCsv(text);
      if (!rows.length) {
        setImportResult('No valid rows found. Use the CSV template headers.');
        return;
      }
      const result = importCrmRows(rows);
      window.dispatchEvent(new Event('finely:store'));
      onImported?.();
      setImportResult(`Imported ${result.created} record(s). Skipped ${result.skipped}.${result.errors.length ? ` ${result.errors.slice(0, 3).join(' · ')}` : ''}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-fc-chrome/90 backdrop-blur-sm">
      <div className={`w-full max-w-lg shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto ${finelyOsGlassShell('panel', 'violet')}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-violet-300" />
            <span className={FINELY_OS_ENTITY_VALUE}>Import / export</span>
          </div>
          <button type="button" onClick={onClose} className="text-white/45 hover:text-white/80">
            <X size={18} />
          </button>
        </div>

        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{summarizeExport(records)} in current pipeline filter.</p>

        <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Export</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadTextFile(exportFilename('crm-export', 'csv'), exportCrmRecordsCsv(records), 'text/csv;charset=utf-8')}
              className={FINELY_OS_SECONDARY_BTN}
            >
              <Download size={14} /> CSV
            </button>
            <button
              type="button"
              onClick={() => downloadTextFile(exportFilename('crm-export', 'json'), exportCrmRecordsJson(records), 'application/json')}
              className={FINELY_OS_SECONDARY_BTN}
            >
              <Download size={14} /> JSON
            </button>
          </div>
        </div>

        <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Import CSV</div>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Creates inbound leads or prospects. Email required per row.</p>
          <textarea
            readOnly
            value={CSV_TEMPLATE}
            className={`w-full h-24 resize-none font-mono text-[10px] ${FINELY_OS_ENTITY_INPUT}`}
          />
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-50`}
          >
            <Upload size={14} /> Choose CSV file
          </button>
          {importResult ? <p className={`text-xs ${FINELY_OS_NOTICE_SUCCESS}`}>{importResult}</p> : null}
        </div>
      </div>
    </div>
  );
}
