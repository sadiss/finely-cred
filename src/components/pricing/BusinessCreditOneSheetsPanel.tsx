import React, { useState } from 'react';
import { ArrowRight, Download, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  downloadBusinessCreditOneSheet,
  listBusinessCreditOneSheets,
  type BusinessCreditOneSheetId,
} from '../../resources/buildBusinessCreditOneSheetPdf';
import {
  BUSINESS_CREDIT_PROCESS_BRIEF,
  downloadBusinessCreditProcessBrief,
} from '../../resources/buildBusinessCreditProcessBriefPdf';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsDeckTile,
} from '../../features/os/finelyOsLightUi';

const LIBRARY_PATH = '/resources/business-credit-one-sheets';

export function BusinessCreditOneSheetsPanel() {
  const sheets = listBusinessCreditOneSheets();
  const [busy, setBusy] = useState<BusinessCreditOneSheetId | 'process_brief' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const brief = BUSINESS_CREDIT_PROCESS_BRIEF;

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

  const onDownloadBrief = async () => {
    setBusy('process_brief');
    setErr(null);
    try {
      await downloadBusinessCreditProcessBrief();
    } catch (e) {
      setErr((e as Error)?.message || 'Download failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className={`${finelyOsCatalogCardCompact('violet')} space-y-3`} data-fc-accent="violet">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <FileText className="text-violet-300 mt-0.5 shrink-0" size={18} />
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Premium one-sheets</div>
            <h3 className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>3-sheet Process Brief + partner one-sheets</h3>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Start with the 3-sheet Process Brief, then Fundability Roadmap and Tier Ladder & Capital Outlook, then
              destination PDFs. Results vary · not guaranteed · business credit only · funding subject to underwriting ·
              outlay varies by vendors.
            </p>
          </div>
        </div>
        <Link to={LIBRARY_PATH} className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2 shrink-0`}>
          Open full Partner One-Sheets library <ArrowRight size={14} />
        </Link>
      </div>
      {err ? <p className="text-sm text-rose-300">{err}</p> : null}

      <div className={`${finelyOsDeckTile('emerald')} space-y-2 !p-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">{brief.eyebrow}</div>
          <span className={`${FINELY_OS_ENTITY_CHIP} bg-emerald-500/15 text-emerald-200`}>
            Featured · {brief.sheetLabel}
          </span>
        </div>
        <div className="font-semibold text-white">{brief.title}</div>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{brief.summary}</p>
        <div className="flex flex-wrap gap-1.5">
          {brief.pages.map((line, i) => {
            const label = line.includes(' — ') ? line.split(' — ')[0]! : `Page ${i + 1}`;
            return (
              <span key={line} className={`${FINELY_OS_ENTITY_CHIP} bg-emerald-500/10 text-emerald-100/85`}>
                {i + 1}. {label}
              </span>
            );
          })}
        </div>
        <button
          type="button"
          disabled={busy === 'process_brief'}
          onClick={() => void onDownloadBrief()}
          className={`${FINELY_OS_PRIMARY_BTN} mt-1 inline-flex items-center gap-2`}
        >
          <Download size={14} /> {busy === 'process_brief' ? 'Building…' : brief.downloadLabel}
        </button>
      </div>

      <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-white/45`}>Roadmap, ladder & path one-sheets</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sheets.map((s, i) => (
          <div
            key={s.id}
            className={finelyOsDeckTile((['sky', 'amber', 'emerald', 'violet', 'fuchsia', 'rose'] as const)[i % 6])}
          >
            <div className="text-[10px] uppercase tracking-wider text-white/45">{s.eyebrow}</div>
            <div className={`mt-1 font-semibold text-white`}>{s.title}</div>
            {s.priceLine ? <div className="mt-1 text-lg font-black text-amber-200">{s.priceLine}</div> : null}
            {s.capitalProgramFeeLine && s.capitalOutlayLine && s.capitalPotentialLine ? (
              <div className="mt-2 space-y-1 text-[11px]">
                <div className="flex justify-between gap-2">
                  <span className="text-white/45">Program</span>
                  <span className="font-semibold text-white">{s.capitalProgramFeeLine}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-white/45">Vendor outlay</span>
                  <span className="font-semibold text-white">{s.capitalOutlayLine}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-white/45">Potential BC</span>
                  <span className="font-semibold text-amber-200">{s.capitalPotentialLine}</span>
                </div>
              </div>
            ) : null}
            <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY} line-clamp-3`}>{s.summary}</p>
            <p className={`mt-1.5 text-[11px] text-white/50 line-clamp-2`}>
              <span className="text-white/40">For: </span>
              {s.whoFor}
            </p>
            <p className={`mt-1.5 text-[11px] text-amber-100/70 line-clamp-2`}>{s.proofPoints[0]}</p>
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
      <div className="pt-1">
        <Link to={LIBRARY_PATH} className={`text-sm text-amber-200/90 hover:text-amber-100 inline-flex items-center gap-1.5`}>
          Browse descriptive Partner One-Sheets library <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
