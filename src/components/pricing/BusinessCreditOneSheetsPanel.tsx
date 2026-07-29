import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import {
  downloadBusinessCreditOneSheet,
  listBusinessCreditOneSheets,
  type BusinessCreditOneSheetId,
} from '../../resources/buildBusinessCreditOneSheetPdf';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsDeckTile,
} from '../../features/os/finelyOsLightUi';

export function BusinessCreditOneSheetsPanel() {
  const sheets = listBusinessCreditOneSheets();
  const [busy, setBusy] = useState<BusinessCreditOneSheetId | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onDownload = async (id: BusinessCreditOneSheetId) => {
    setBusy(id);
    setErr(null);
    try {
      await downloadBusinessCreditOneSheet(id);
    } catch (e) {
      setErr((e as Error)?.message || 'Download failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className={`${finelyOsCatalogCardCompact('violet')} space-y-3`} data-fc-accent="violet">
      <div className="flex items-start gap-3">
        <FileText className="text-violet-300 mt-0.5" size={18} />
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Premium one-sheets</div>
          <h3 className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>Download price & service sheets</h3>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            High-appeal single pages — overview, four tiers, comparison, and named-cards path. Results vary · funding subject to underwriting.
          </p>
        </div>
      </div>
      {err ? <p className="text-sm text-rose-300">{err}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sheets.map((s, i) => (
          <div key={s.id} className={finelyOsDeckTile((['amber', 'emerald', 'violet', 'fuchsia', 'sky'] as const)[i % 5])}>
            <div className="text-[10px] uppercase tracking-wider text-white/45">{s.eyebrow}</div>
            <div className={`mt-1 font-semibold text-white`}>{s.title}</div>
            {s.priceLine ? <div className="mt-1 text-lg font-black text-amber-200">{s.priceLine}</div> : null}
            <button
              type="button"
              disabled={busy === s.id}
              onClick={() => void onDownload(s.id)}
              className={`${FINELY_OS_PRIMARY_BTN} mt-3 inline-flex items-center gap-2`}
            >
              <Download size={14} /> {busy === s.id ? 'Building…' : 'Download PDF'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
