import React, { useEffect, useMemo, useState } from 'react';
import { Crop, ExternalLink, FileCheck2, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type {
  CreditReportRecord,
  NormalizedReportRegion,
  ParsedTradeline,
} from '../../domain/creditReports';
import type { EvidenceItem } from '../../domain/evidence';
import { upsertEvidence } from '../../data/evidenceRepo';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import {
  createReportSourceEvidence,
  renderReportSourceExhibit,
} from '../../lib/reportSourceEvidence';
import {
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

const FALLBACK_REGION: NormalizedReportRegion = {
  x: 0.02,
  y: 0.08,
  width: 0.96,
  height: 0.44,
};

function pct(value: number) {
  return Math.round(value * 100);
}

export function ReportSourceEvidenceModal({
  open,
  record,
  tradeline,
  partnerId,
  onCreated,
  onClose,
}: {
  open: boolean;
  record: CreditReportRecord | null;
  tradeline: ParsedTradeline | null;
  partnerId: string;
  onCreated?: (item: EvidenceItem) => void;
  onClose: () => void;
}) {
  const [region, setRegion] = useState<NormalizedReportRegion>(FALLBACK_REGION);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPdf = record?.fileType === 'pdf';
  const anchor = tradeline?.sourceAnchor;

  useEffect(() => {
    if (!open) return;
    setRegion(anchor?.region ?? FALLBACK_REGION);
    setError(null);
  }, [anchor, open, tradeline?.creditorName]);

  useEffect(() => {
    if (!open || !record || !tradeline || !anchor) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    const timer = window.setTimeout(() => {
      setBusy(true);
      setError(null);
      void renderReportSourceExhibit({
        record,
        tradeline,
        region: isPdf ? region : undefined,
      })
        .then((rendered) => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(rendered.blob);
          setPreviewUrl((previous) => {
            if (previous) URL.revokeObjectURL(previous);
            return objectUrl;
          });
        })
        .catch((cause: unknown) => {
          if (!cancelled) {
            setError(cause instanceof Error ? cause.message : 'Could not render this source region.');
          }
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [anchor, isPdf, open, record, region, tradeline]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const sourceDetail = useMemo(() => {
    if (!record || !anchor) return '';
    if (record.fileType === 'pdf') {
      return `PDF page ${anchor.page ?? 1} · ${anchor.confidence ?? 'approximate'} match`;
    }
    return `Sanitized HTML region · ${anchor.confidence ?? 'exact'} match`;
  }, [anchor, record]);

  if (!open) return null;

  const save = async () => {
    if (!record || !tradeline) return;
    setSaving(true);
    setError(null);
    try {
      const item = await createReportSourceEvidence({
        record,
        tradeline,
        partnerId,
        region: isPdf ? region : undefined,
      });
      upsertEvidence(item);
      onCreated?.(item);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Could not save this source report crop.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className={FINELY_OS_FIXED_OVERLAY} role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section
        className={`${FINELY_OS_MODAL_SHELL} w-[min(1120px,calc(100vw-24px))] overflow-hidden`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-evidence-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-[#07101d] px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">
              <ShieldCheck size={14} />
              Source-faithful evidence
            </div>
            <h2 id="source-evidence-title" className="mt-1 truncate text-xl font-bold text-white">
              {tradeline?.creditorName ?? 'Report source region'}
            </h2>
            <p className="mt-1 text-xs text-white/55">{sourceDetail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close source evidence"
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid max-h-[72vh] gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="relative min-h-[360px] overflow-auto rounded-2xl border border-sky-400/25 bg-slate-950/70 p-3">
            {busy ? (
              <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/65 text-sky-100">
                <span className="inline-flex items-center gap-2 text-sm font-bold">
                  <LoaderCircle className="animate-spin" size={18} />
                  Rendering protected source…
                </span>
              </div>
            ) : null}
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`Redacted source report crop for ${tradeline?.creditorName ?? 'account'}`}
                className="mx-auto h-auto max-w-full rounded-lg bg-white shadow-2xl"
              />
            ) : (
              <div className="grid min-h-[330px] place-items-center text-center text-sm text-white/55">
                {anchor ? 'Preparing source preview…' : 'Re-parse the report to create a source anchor for this account.'}
              </div>
            )}
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-100">
                <FileCheck2 size={14} />
                What this is
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                A crop rendered from this partner’s protected report—not a repeated template. Sensitive fields are masked.
              </p>
            </div>

            {isPdf ? (
              <div className="space-y-3 rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-100">
                  <Crop size={14} />
                  Adjust crop
                </div>
                <label className="block text-xs text-white/70">
                  Start position · {pct(region.y)}%
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, 100 - pct(region.height))}
                    value={pct(region.y)}
                    onChange={(event) =>
                      setRegion((current) => ({
                        ...current,
                        y: Number(event.target.value) / 100,
                      }))
                    }
                    className="mt-2 w-full accent-violet-400"
                  />
                </label>
                <label className="block text-xs text-white/70">
                  Crop height · {pct(region.height)}%
                  <input
                    type="range"
                    min="15"
                    max={Math.max(15, 100 - pct(region.y))}
                    value={pct(region.height)}
                    onChange={(event) =>
                      setRegion((current) => ({
                        ...current,
                        height: Number(event.target.value) / 100,
                      }))
                    }
                    className="mt-2 w-full accent-violet-400"
                  />
                </label>
              </div>
            ) : null}

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-relaxed text-white/55">
              Saved crops enter the evidence vault as <strong className="text-white/80">review required</strong>. They cannot be mailed until a person opens and approves them.
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`}
              onClick={() =>
                record &&
                void openBlobRefInNewTab({
                  blobRef: record.rawBlobRef,
                  mimeType: record.mimeType,
                  preferSigned: true,
                })
              }
              disabled={!record}
            >
              <ExternalLink size={15} />
              Open original report
            </button>
            <button
              type="button"
              className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`}
              onClick={() => void save()}
              disabled={!record || !tradeline || !anchor || busy || saving}
            >
              {saving ? <LoaderCircle className="animate-spin" size={16} /> : <FileCheck2 size={16} />}
              {saving ? 'Saving…' : 'Save source crop'}
            </button>
          </aside>
        </div>
      </section>
    </div>,
    document.body,
  );
}
