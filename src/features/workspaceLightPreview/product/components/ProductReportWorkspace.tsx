import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  FileCheck2,
  FileSearch,
  FileText,
  RefreshCcw,
  ScanSearch,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreditIntelTabs } from '../../../../components/creditIntel/CreditIntelTabs';
import { LegacyPendingReportNotice } from '../../../../components/reports/LegacyPendingReportNotice';
import { ParsedReportOverviewPanel } from '../../../../components/reports/ParsedReportOverviewPanel';
import { ParsedReportViewer } from '../../../../components/reports/ParsedReportViewer';
import { PdfReportFallbackView } from '../../../../components/reports/PdfReportFallbackView';
import { ReportActionsBar } from '../../../../components/reports/ReportFileStrip';
import { ReportUploader } from '../../../../components/reports/ReportUploader';
import { ReportSourceEvidenceModal } from '../../../../components/evidence/ReportSourceEvidenceModal';
import { SectionItemEvidenceSheet } from '../../../../components/evidence/EvidenceSheet';
import { candidateToCaseItem, nowIso } from '../../../../domain/cases';
import type { CreditReportRecord, CreditReportProvider, DisputeCandidate, ParsedCreditReport, ParsedSection, ParsedTradeline, PdfTextMeta } from '../../../../domain/creditReports';
import type { EvidenceItem } from '../../../../domain/evidence';
import { createDisputeCase } from '../../../../data/casesRepo';
import { captureScoreSnapshotFromReport } from '../../../../data/creditScoreSnapshotsRepo';
import { deleteReport, listReportsByPartner, upsertReport } from '../../../../data/reportsRepo';
import { listEvidenceByPartner, upsertEvidence } from '../../../../data/evidenceRepo';
import { addAuditEvent } from '../../../../data/auditRepo';
import { canAccessReportBlob } from '../../../../lib/reportBlobAccess';
import { isLegacyPendingReportBlob } from '../../../../lib/legacyPendingReport';
import { reparseStoredCreditReport } from '../../../../lib/reportParsePipeline';
import { getBlobStore } from '../../../../storage/getBlobStore';
import { captureReactElementPng } from '../../../../utils/captureReactPng';
import { newId } from '../../../../utils/ids';
import { FinelyOsPaginatedStack } from '../../../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../../features/os/finelyOsLightUi';
import { ProductReportSourceDemoStage } from './ProductReportSourceDemoStage';
import './productReportWorkspace.css';

export type ProductReportWorkspaceRoom = 'source' | 'upload' | 'viewer' | 'findings';

const PREVIEW_REPORT_PARTNER_ID = 'workspace-product-report-preview';
const SECTION_PAGE_SIZE = 12;

function reportLabel(report: CreditReportRecord): string {
  if (report.filename) return report.filename;
  if (report.provider && report.provider !== 'unknown') return `${report.provider} credit report`;
  return 'Credit report';
}

function reportDate(report: CreditReportRecord): string {
  const date = new Date(report.receivedAt);
  return Number.isNaN(date.getTime())
    ? 'Recently uploaded'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function normName(value: string): string {
  return (value || '').trim().toLowerCase();
}

function tradelineHasSourceCrop(evidence: EvidenceItem[], reportId: string, creditorName: string): boolean {
  const name = normName(creditorName);
  return evidence.some(
    (item) =>
      item.reportId === reportId &&
      (item.source === 'source_report_crop' || item.provenance?.kind === 'source_faithful_report_crop') &&
      normName(item.creditorName || '') === name,
  );
}

function tradelineHasParsedExhibit(evidence: EvidenceItem[], reportId: string, creditorName: string): boolean {
  const name = normName(creditorName);
  return evidence.some(
    (item) =>
      item.reportId === reportId &&
      (item.source === 'parsed_finely_exhibit' ||
        item.source === 'tradeline_screenshot' ||
        item.source === 'section_screenshot' ||
        item.provenance?.kind === 'parsed_finely_exhibit') &&
      normName(item.creditorName || '') === name,
  );
}

function sectionItemHasProof(
  evidence: EvidenceItem[],
  reportId: string,
  sectionKey: string,
  itemLabel: string,
): boolean {
  const label = normName(itemLabel);
  return evidence.some(
    (item) =>
      item.reportId === reportId &&
      item.sectionKey === sectionKey &&
      normName(item.creditorName || item.caption || '') === label,
  );
}

async function captureSectionItemScreenshot(args: {
  key: string;
  title: string;
  itemIndex: number;
  itemLabel: string;
  element: React.ReactElement;
  partnerId: string;
  reportId?: string;
}): Promise<EvidenceItem> {
  const dataUrl = await captureReactElementPng(args.element, { pixelRatio: 2, widthPx: 1100 });
  const blob = await (await fetch(dataUrl)).blob();
  const store = getBlobStore();
  const put = await store.put(blob, {
    kind: 'evidence_screenshot_section_item',
    partnerId: args.partnerId,
    reportId: args.reportId,
    sectionKey: args.key,
    sectionTitle: args.title,
  });
  const safeLabel = (args.itemLabel || `Item ${args.itemIndex + 1}`).replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
  const now = new Date().toISOString();
  const filename = `Finely_Parsed_Exhibit_${args.key}_${safeLabel}_${now.slice(0, 10)}.png`;
  const item: EvidenceItem = {
    id: newId('evidence'),
    partnerId: args.partnerId,
    reportId: args.reportId,
    type: 'screenshot',
    source: 'parsed_finely_exhibit',
    sectionKey: args.key,
    creditorName: args.itemLabel || undefined,
    caption: `Finely Parsed Exhibit: ${args.title} · ${args.itemLabel || `Item ${args.itemIndex + 1}`} · not bureau UI`,
    filename,
    mimeType: 'image/png',
    sizeBytes: blob.size,
    blobRef: put.ref,
    provenance: {
      kind: 'parsed_finely_exhibit',
      sourceReportId: args.reportId,
      contentSha256: put.sha256,
      generatedAt: now,
      mailEligible: false,
      humanVerified: false,
    },
    createdAt: now,
  };
  upsertEvidence(item);
  addAuditEvent({
    partnerId: args.partnerId,
    actorType: 'partner',
    action: 'evidence.captured',
    entityType: 'evidence',
    entityId: item.id,
    meta: {
      filename,
      source: item.source,
      reportId: args.reportId ?? null,
      sectionKey: args.key,
      creditorName: item.creditorName ?? null,
    },
  });
  return item;
}

function ReportFileRail({
  reports,
  selectedId,
  onSelect,
  onUpload,
}: {
  reports: CreditReportRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpload: () => void;
}) {
  return (
    <div className="fc-wlp-report-file-rail" aria-label="Uploaded credit reports">
      <div className="fc-wlp-report-file-rail-head">
        <FileSearch size={16} />
        <span>Report library</span>
      </div>
      {reports.length ? (
        reports.map((report, index) => (
          <button
            key={report.id}
            type="button"
            data-selected={(selectedId ?? reports[0]?.id) === report.id ? 'true' : undefined}
            onClick={() => onSelect(report.id)}
          >
            <span className="fc-wlp-report-file-icon">
              <FileText size={16} />
            </span>
            <span>
              <strong>{reportLabel(report)}</strong>
              <small>
                {reportDate(report)} · {report.fileType.toUpperCase()}
              </small>
            </span>
            {index === 0 ? <em>Current</em> : null}
          </button>
        ))
      ) : (
        <div className="fc-wlp-report-file-empty">
          <UploadCloud size={20} />
          <strong>No uploads yet</strong>
          <span>Upload the first report without leaving this page.</span>
          <button type="button" onClick={onUpload}>
            Upload report
          </button>
        </div>
      )}
    </div>
  );
}

function ProductReportSourceVerificationStage({
  partnerId,
  report,
  evidence,
  onOpenUpload,
}: {
  partnerId: string;
  report: CreditReportRecord;
  evidence: EvidenceItem[];
  onOpenUpload: () => void;
}) {
  const [sourceTradeline, setSourceTradeline] = useState<ParsedTradeline | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const parsed = report.parsed;

  const tradelines = parsed?.tradelines ?? [];
  const withSource = tradelines.filter((t) => tradelineHasSourceCrop(evidence, report.id, t.creditorName)).length;
  const withParsed = tradelines.filter((t) => tradelineHasParsedExhibit(evidence, report.id, t.creditorName)).length;

  if (!parsed) {
    return (
      <div className="fc-wlp-report-viewer-empty">
        <FileSearch size={25} />
        <h3>{reportLabel(report)}</h3>
        <p>
          The original upload is here, but parsed tradelines are not available yet. Re-upload the source export or open
          View reports once parsing finishes.
        </p>
        <button type="button" onClick={onOpenUpload}>
          Upload another report
        </button>
      </div>
    );
  }

  return (
    <div className="fc-wlp-report-source-stage space-y-4">
      {notice ? <div className={FINELY_OS_NOTICE}>{notice}</div> : null}

      <div className={`${finelyOsCatalogCard('sky')} !p-4 space-y-2`}>
        <div className="flex flex-wrap items-center gap-2">
          <ShieldCheck size={16} className="text-sky-300" />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Source verification workstation</span>
        </div>
        <p className={FINELY_OS_ENTITY_BODY}>
          Pick an account, crop the matching region from your protected report, and save a source-faithful exhibit. Parsed
          exhibits are labeled separately and still require review before mailing.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className={finelyOsStatusChip('ok')}>
            {withSource}/{tradelines.length} source crop{tradelines.length === 1 ? '' : 's'} on file
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-200 text-[10px] font-black uppercase tracking-widest">
            {withParsed}/{tradelines.length} parsed exhibit{tradelines.length === 1 ? '' : 's'} on file
          </span>
        </div>
      </div>

      {tradelines.length ? (
        <FinelyOsPaginatedStack
          items={tradelines}
          pageSize={20}
          itemSpacingClassName="grid gap-3"
          emptyMessage="No tradelines parsed on this report."
          renderItem={(tradeline, index) => {
            const hasSource = tradelineHasSourceCrop(evidence, report.id, tradeline.creditorName);
            const hasParsed = tradelineHasParsedExhibit(evidence, report.id, tradeline.creditorName);
            const needsProof = !hasSource && !hasParsed;
            return (
              <div
                key={`${tradeline.creditorName}_${index}`}
                className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
                  needsProof ? 'border-rose-400/30 bg-rose-500/5' : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate">{tradeline.creditorName}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>
                    {[tradeline.accountType, tradeline.accountStatus, tradeline.accountNumberMasked]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {hasSource ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-200 text-[10px] font-black uppercase tracking-widest">
                        Source crop on file
                      </span>
                    ) : (
                      <span className={finelyOsStatusChip('blocked')}>No source crop yet</span>
                    )}
                    {hasParsed ? (
                      <span className={finelyOsStatusChip('ok')}>Parsed exhibit on file</span>
                    ) : (
                      <span className={finelyOsStatusChip('warn')}>No parsed exhibit yet</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSourceTradeline(tradeline)}
                  className={FINELY_OS_SECONDARY_BTN}
                  disabled={!report || !tradeline.sourceAnchor}
                  title={
                    tradeline.sourceAnchor
                      ? 'Open this account in its original protected report'
                      : 'Re-parse the original report to add source anchors'
                  }
                >
                  <ScanSearch size={14} className="text-sky-300" />
                  {tradeline.sourceAnchor ? 'Source crop' : 'Re-parse for source'}
                </button>
              </div>
            );
          }}
        />
      ) : (
        <div className="fc-wlp-report-viewer-empty">
          <FileSearch size={25} />
          <h3>No tradelines parsed yet</h3>
          <p>Upload an HTML bureau export so Finely can anchor each account to its original report region.</p>
          <button type="button" onClick={onOpenUpload}>
            Upload report
          </button>
        </div>
      )}

      <ReportSourceEvidenceModal
        open={Boolean(sourceTradeline && report && partnerId)}
        record={report}
        tradeline={sourceTradeline}
        partnerId={partnerId}
        onCreated={(item) =>
          setNotice(`Saved source-faithful crop: ${item.filename}. Review and approve it in the evidence vault before mailing.`)
        }
        onClose={() => setSourceTradeline(null)}
      />
    </div>
  );
}

function getSectionItemLabel(section: ParsedSection, index: number): string {
  const hasStructuredItems = Boolean(section.items?.length);
  const hasTableRows = Boolean(section.table?.rows?.length);
  if (hasStructuredItems && section.items![index]) {
    const fields = section.items![index]!.fields;
    const prefer = (k: string) =>
      fields[k] || fields[k.toLowerCase()] || fields[k.replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '')];
    const looksLikeName = (v: string) => (v || '').trim().length > 2 && !/^\d[\d\s\-*]*$/.test((v || '').trim());
    const nameVal =
      prefer('creditor') ||
      prefer('agency') ||
      prefer('original creditor') ||
      prefer('original_creditor') ||
      prefer('furnisher') ||
      prefer('subscriber') ||
      prefer('creditor_name') ||
      prefer('collector');
    if (nameVal && looksLikeName(nameVal)) return nameVal;
    const accountVal = prefer('account');
    if (accountVal && looksLikeName(accountVal)) return accountVal;
    const firstVal = Object.values(fields)[0];
    if (firstVal && looksLikeName(firstVal)) return firstVal;
    return nameVal || accountVal || firstVal || `Item ${index + 1}`;
  }
  if (hasTableRows && section.table!.rows[index]) {
    const row = section.table!.rows[index]!;
    const cols = section.table!.columns ?? [];
    const nameIdx = cols.findIndex((c) => /creditor|collector|inquirer|company|name/i.test(c || ''));
    if (nameIdx >= 0 && row[nameIdx]?.trim()) return row[nameIdx]!.trim();
    return row.find((cell) => cell?.trim())?.trim() || `Item ${index + 1}`;
  }
  return `Item ${index + 1}`;
}

function shouldUsePerCardScreenshots(section: ParsedSection, key: string): boolean {
  const hasStructuredItems = Boolean(section.items?.length);
  const hasTableRows = Boolean(section.table?.rows?.length);
  const isCollectionsOrInquiries = key === 'collections' || key === 'inquiries';
  if (!isCollectionsOrInquiries) return false;

  const norm = (v: string) => (v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const isBureauCol = (c: string) => {
    const n = norm(c);
    return /\bexperian\b|\bexp\b/.test(n) || /\bequifax\b|\beqf\b/.test(n) || /\btransunion\b|\btuc\b/.test(n);
  };
  const bureauKeyCount = (fields: Record<string, string>) => {
    const keys = Object.keys(fields || {}).map((k) => norm(k));
    const hasExp = keys.some((k) => /\bexperian\b|\bexp\b/.test(k));
    const hasEqf = keys.some((k) => /\bequifax\b|\beqf\b/.test(k));
    const hasTuc = keys.some((k) => /\btransunion\b|\btuc\b/.test(k));
    return Number(hasExp) + Number(hasEqf) + Number(hasTuc);
  };

  const looksLikeBureauMatrixTable =
    hasTableRows &&
    (section.table?.columns ?? []).filter(isBureauCol).length >= 2 &&
    (section.table?.rows?.length ?? 0) >= 6;
  const looksLikeBureauMatrixItems =
    hasStructuredItems &&
    (section.items?.length ?? 0) >= 6 &&
    (section.items ?? []).slice(0, 8).every((it) => bureauKeyCount(it.fields) >= 2);

  return !looksLikeBureauMatrixTable && !looksLikeBureauMatrixItems && (hasStructuredItems || hasTableRows);
}

function ReportCollectionsInquiriesCapture({
  parsed,
  partnerId,
  reportId,
  evidence,
  onNotice,
}: {
  parsed: ParsedCreditReport;
  partnerId: string;
  reportId: string;
  evidence: EvidenceItem[];
  onNotice: (message: string | null) => void;
}) {
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const sections = useMemo(
    () => (parsed.sections ?? []).filter((section) => section.key === 'collections' || section.key === 'inquiries'),
    [parsed.sections],
  );

  const handleCapture = useCallback(
    async (args: {
      key: string;
      title: string;
      itemIndex: number;
      itemLabel: string;
      element: React.ReactElement;
    }) => {
      const refKey = `${args.key}_${args.itemIndex}`;
      setSavingKey(refKey);
      onNotice(null);
      try {
        const item = await captureSectionItemScreenshot({
          ...args,
          partnerId,
          reportId,
        });
        onNotice(`Saved Finely Parsed Exhibit: ${item.filename}. Review it in the evidence vault before attaching.`);
      } catch (e: any) {
        onNotice(`Parsed exhibit failed: ${e?.message || 'unknown error'}`);
      } finally {
        setSavingKey(null);
      }
    },
    [onNotice, partnerId, reportId],
  );

  if (!sections.length) return null;

  return (
    <div className="space-y-4 border-t border-white/10 pt-4">
      {sections.map((section) => {
        const key = section.key;
        if (!shouldUsePerCardScreenshots(section, key)) return null;
        const hasStructuredItems = Boolean(section.items?.length);
        const items = section.items ?? [];
        const rows = section.table?.rows ?? [];
        const columns = section.table?.columns ?? [];

        return (
          <div key={key} className={`${finelyOsCatalogCard(key === 'collections' ? 'rose' : 'violet')} !p-4 space-y-3`}>
            <div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{section.title}</div>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                Each card can become a clearly labeled parsed exhibit. Prefer a source crop from Verify source when the
                original report region is available.
              </p>
            </div>

            {hasStructuredItems ? (
              <FinelyOsPaginatedStack
                items={items}
                pageSize={SECTION_PAGE_SIZE}
                itemSpacingClassName="grid gap-3 md:grid-cols-2"
                emptyMessage="No items in this section."
                renderItem={(item, index) => {
                  const itemLabel = getSectionItemLabel(section, index);
                  const hasProof = sectionItemHasProof(evidence, reportId, key, itemLabel);
                  return (
                    <div key={item.rowIndex ?? index} className="fc-soft-surface p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px] tracking-widest shrink-0`}>{itemLabel}</span>
                          {hasProof ? (
                            <div className="mt-1">
                              <span className={finelyOsStatusChip('ok')}>Proof on file</span>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <span className={finelyOsStatusChip('blocked')}>No exhibit yet</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void handleCapture({
                              key,
                              title: section.title,
                              itemIndex: index,
                              itemLabel,
                              element: (
                                <SectionItemEvidenceSheet sectionTitle={section.title} itemLabel={itemLabel} item={item} />
                              ),
                            })
                          }
                          data-no-capture="true"
                          className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg fc-light-chrome-btn text-[10px] font-bold uppercase tracking-wider ${FINELY_OS_ENTITY_SUBLABEL} disabled:opacity-60`}
                          disabled={Boolean(savingKey)}
                          title="Save this card to Evidence Vault — attach to the matching dispute item"
                        >
                          <FileCheck2 size={12} className="text-fuchsia-400" />
                          {savingKey === `${key}_${index}` ? 'Creating…' : 'Parsed exhibit'}
                        </button>
                      </div>
                      {Object.entries(item.fields).map(([fieldKey, val]) =>
                        (val ?? '').trim() ? (
                          <div key={fieldKey} className="flex gap-2">
                            <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px] tracking-widest shrink-0`}>{fieldKey}:</span>
                            <span className={`${FINELY_OS_ENTITY_BODY} text-sm font-mono whitespace-pre-wrap break-all`}>{val}</span>
                          </div>
                        ) : null,
                      )}
                    </div>
                  );
                }}
              />
            ) : (
              <FinelyOsPaginatedStack
                items={rows}
                pageSize={SECTION_PAGE_SIZE}
                itemSpacingClassName="grid gap-3 md:grid-cols-2"
                emptyMessage="No rows in this section."
                renderItem={(row, index) => {
                  const itemLabel = getSectionItemLabel(section, index);
                  const hasProof = sectionItemHasProof(evidence, reportId, key, itemLabel);
                  return (
                    <div key={index} className="fc-soft-surface p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px] tracking-widest shrink-0 truncate`}>
                            {itemLabel}
                          </span>
                          {hasProof ? (
                            <div className="mt-1">
                              <span className={finelyOsStatusChip('ok')}>Proof on file</span>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <span className={finelyOsStatusChip('blocked')}>No exhibit yet</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void handleCapture({
                              key,
                              title: section.title,
                              itemIndex: index,
                              itemLabel,
                              element: (
                                <SectionItemEvidenceSheet
                                  sectionTitle={section.title}
                                  itemLabel={itemLabel}
                                  columns={columns}
                                  row={row}
                                />
                              ),
                            })
                          }
                          data-no-capture="true"
                          className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg fc-light-chrome-btn text-[10px] font-bold uppercase tracking-wider ${FINELY_OS_ENTITY_SUBLABEL} disabled:opacity-60`}
                          disabled={Boolean(savingKey)}
                          title="Save this card to Evidence Vault — attach to the matching dispute item"
                        >
                          <FileCheck2 size={12} className="text-fuchsia-400" />
                          {savingKey === `${key}_${index}` ? 'Creating…' : 'Parsed exhibit'}
                        </button>
                      </div>
                      {columns.map((col, columnIndex) => {
                        const val = (row[columnIndex] ?? '').trim();
                        if (!val) return null;
                        return (
                          <div key={`${col}_${columnIndex}`} className="flex gap-2">
                            <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px] tracking-widest shrink-0`}>{col}:</span>
                            <span className={`${FINELY_OS_ENTITY_BODY} text-sm font-mono whitespace-pre-wrap break-all`}>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReportWorkbenchToolbar({
  report,
  reparseId,
  deletingId,
  onParseOverview,
  onReparse,
  onDelete,
  onOpenError,
}: {
  report: CreditReportRecord;
  reparseId: string | null;
  deletingId: string | null;
  onParseOverview: () => void;
  onReparse: () => void;
  onDelete: () => void;
  onOpenError: (message: string) => void;
}) {
  const canOpen =
    !isLegacyPendingReportBlob(report.rawBlobRef) && canAccessReportBlob(report.rawBlobRef);
  const canReparse = canOpen;

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 lg:!p-6 space-y-4`}>
      <ReportActionsBar report={report}>
        {report.parsed ? (
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onParseOverview}>
            Parse overview
          </button>
        ) : null}
        {canOpen ? (
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={async () => {
              try {
                const { openBlobRefInNewTab } = await import('../../../../lib/openBlobRef');
                await openBlobRefInNewTab({
                  blobRef: report.rawBlobRef,
                  mimeType: report.mimeType || (report.fileType === 'pdf' ? 'application/pdf' : 'text/html'),
                });
              } catch (e: unknown) {
                onOpenError(e instanceof Error ? e.message : 'Could not open file.');
              }
            }}
          >
            Open file
          </button>
        ) : null}
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          disabled={Boolean(reparseId) || deletingId === report.id || !canReparse}
          onClick={onReparse}
        >
          <RefreshCcw size={14} />
          {reparseId === report.id ? 'Re-parsing…' : 'Re-parse'}
        </button>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          disabled={deletingId === report.id || Boolean(reparseId)}
          onClick={onDelete}
        >
          <Trash2 size={14} className="text-rose-500" />
          {deletingId === report.id ? 'Deleting…' : 'Delete'}
        </button>
      </ReportActionsBar>
    </div>
  );
}

/**
 * The report destination is the report product—not a signpost to an older page.
 * Upload, source intelligence, report selection, and parsed viewing all stay in this room.
 */
export function ProductReportWorkspace({
  partnerId,
  initialReports = [],
  initialRoom = 'source',
  room: controlledRoom,
  onRoomChange,
  onActiveReportChange,
  dataMode = 'real',
  layout = 'standalone',
  mapPortalHref,
}: {
  partnerId?: string;
  initialReports?: CreditReportRecord[];
  initialRoom?: ProductReportWorkspaceRoom;
  room?: ProductReportWorkspaceRoom;
  onRoomChange?: (room: ProductReportWorkspaceRoom) => void;
  onActiveReportChange?: (report: CreditReportRecord | null) => void;
  dataMode?: 'demo' | 'real';
  layout?: 'standalone' | 'embedded';
  mapPortalHref?: (href: string) => string;
}) {
  const rawNavigate = useNavigate();
  const navigate = useCallback(
    (href: string) => rawNavigate(mapPortalHref?.(href) ?? href),
    [mapPortalHref, rawNavigate],
  );
  const resolvedPartnerId = partnerId ?? PREVIEW_REPORT_PARTNER_ID;
  const isPreviewPartner = resolvedPartnerId === PREVIEW_REPORT_PARTNER_ID;
  const isEmbedded = layout === 'embedded';
  const [internalRoom, setInternalRoom] = useState<ProductReportWorkspaceRoom>(controlledRoom ?? initialRoom);
  const room = controlledRoom ?? internalRoom;
  const [viewerNotice, setViewerNotice] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [parseOverviewOpen, setParseOverviewOpen] = useState(false);
  const [reparseId, setReparseId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reportsVersion, setReportsVersion] = useState(0);
  const [uploadedReports, setUploadedReports] = useState<CreditReportRecord[]>(() => {
    try {
      return listReportsByPartner(resolvedPartnerId);
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    initialReports[0]?.id ?? uploadedReports[0]?.id ?? null,
  );
  const [evidenceVersion, setEvidenceVersion] = useState(0);

  useEffect(() => {
    if (controlledRoom !== undefined) return;
    setInternalRoom(initialRoom);
  }, [controlledRoom, initialRoom]);

  useEffect(() => {
    if (controlledRoom !== undefined) setInternalRoom(controlledRoom);
  }, [controlledRoom]);

  useEffect(() => {
    if (!initialReports.length) return;
    setSelectedId((current) => current ?? initialReports[0].id);
  }, [initialReports]);

  useEffect(() => {
    const onStore = () => {
      setEvidenceVersion((value) => value + 1);
      setReportsVersion((value) => value + 1);
      try {
        setUploadedReports(listReportsByPartner(resolvedPartnerId));
      } catch {
        // ignore
      }
    };
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, [resolvedPartnerId]);

  const reports = useMemo(() => {
    void reportsVersion;
    const byId = new Map<string, CreditReportRecord>();
    for (const report of [...uploadedReports, ...initialReports]) byId.set(report.id, report);
    return [...byId.values()].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  }, [initialReports, reportsVersion, uploadedReports]);

  const selected = reports.find((report) => report.id === selectedId) ?? reports[0] ?? null;

  useEffect(() => {
    onActiveReportChange?.(selected);
  }, [onActiveReportChange, selected]);

  const evidence = useMemo(() => {
    void evidenceVersion;
    try {
      return listEvidenceByPartner(resolvedPartnerId);
    } catch {
      return [];
    }
  }, [evidenceVersion, resolvedPartnerId]);

  const showDemoSource = dataMode === 'demo' || (!selected?.parsed && isPreviewPartner);

  const openRoom = (next: ProductReportWorkspaceRoom) => {
    if (controlledRoom === undefined) setInternalRoom(next);
    onRoomChange?.(next);
  };

  const handleCreated = (report: CreditReportRecord) => {
    upsertReport(report);
    if (report.parsed) {
      captureScoreSnapshotFromReport({
        partnerId: resolvedPartnerId,
        reportId: report.id,
        parsed: report.parsed,
        provider: report.provider,
      });
    }
    setUploadedReports((current) => [report, ...current.filter((item) => item.id !== report.id)]);
    setSelectedId(report.id);
    setReportsVersion((value) => value + 1);
    openRoom('viewer');
  };

  const handleReparse = async (report: CreditReportRecord) => {
    setWorkspaceError(null);
    setReparseId(report.id);
    try {
      if (isLegacyPendingReportBlob(report.rawBlobRef)) {
        throw new Error('This report has no stored file. Upload the original export again.');
      }
      if (!canAccessReportBlob(report.rawBlobRef)) {
        throw new Error('Stored file missing. Re-upload the original HTML or PDF export.');
      }
      const updated = await reparseStoredCreditReport({ record: report });
      upsertReport(updated);
      if (updated.parsed) {
        captureScoreSnapshotFromReport({
          partnerId: resolvedPartnerId,
          reportId: report.id,
          parsed: updated.parsed,
          provider: updated.provider ?? undefined,
        });
      }
      setUploadedReports((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setReportsVersion((value) => value + 1);
      setViewerNotice('Re-parse complete.');
    } catch (e: unknown) {
      setWorkspaceError(e instanceof Error ? e.message : 'Re-parse failed.');
    } finally {
      setReparseId(null);
    }
  };

  const handleDelete = async (report: CreditReportRecord) => {
    setWorkspaceError(null);
    const ok = window.confirm(`Delete this report?\n\n${report.filename}\n\nThis removes the upload and stored file.`);
    if (!ok) return;
    setDeletingId(report.id);
    try {
      const store = getBlobStore();
      try {
        await store.delete(report.rawBlobRef);
      } catch {
        // ignore
      }
      deleteReport(report.id);
      if (selectedId === report.id) setSelectedId(null);
      setUploadedReports((current) => current.filter((item) => item.id !== report.id));
      setReportsVersion((value) => value + 1);
    } catch (e: unknown) {
      setWorkspaceError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderSelectedToolbar = selected ? (
    <ReportWorkbenchToolbar
      report={selected}
      reparseId={reparseId}
      deletingId={deletingId}
      onParseOverview={() => setParseOverviewOpen(true)}
      onReparse={() => void handleReparse(selected)}
      onDelete={() => void handleDelete(selected)}
      onOpenError={setWorkspaceError}
    />
  ) : null;

  const renderFindingsStage = () => {
    if (!selected) {
      return (
        <div className="fc-wlp-report-viewer-empty">
          <FileSearch size={28} />
          <h3>Upload a report to review findings</h3>
          <p>Dispute-ready items appear after Finely parses your bureau export.</p>
          <button type="button" onClick={() => openRoom('upload')}>
            Upload report
          </button>
        </div>
      );
    }

    if (isLegacyPendingReportBlob(selected.rawBlobRef)) {
      return (
        <div className="space-y-6">
          <LegacyPendingReportNotice filename={selected.filename} rawBlobRef={selected.rawBlobRef} variant="partner" />
          {selected.parsed ? (
            <CreditIntelTabs
              parsed={selected.parsed}
              reportId={selected.id}
              reportRecord={selected}
              partnerId={resolvedPartnerId}
              evidence={evidence as EvidenceItem[]}
              availableReports={reports.map((r) => ({ id: r.id, receivedAt: r.receivedAt, filename: r.filename, parsed: r.parsed }))}
              onOpenEvidenceVault={() => navigate('/portal/evidence')}
              onOpenTasks={() => navigate('/portal/projects')}
              onReparseRequest={() => void handleReparse(selected)}
              onStartDispute={(candidate: DisputeCandidate, reasonTexts: string[]) => {
                const item = candidateToCaseItem(candidate, { reasons: reasonTexts });
                const disputeCase = createDisputeCase({
                  partnerId: resolvedPartnerId,
                  bureau: candidate.bureau,
                  title: `${candidate.account} — ${candidate.type}`,
                  latestReportId: selected.id,
                  items: [item],
                  initialRound: { round: 'Round 1', tone: 'formal', createdAt: nowIso() },
                });
                navigate(`/portal/letters?caseId=${encodeURIComponent(disputeCase.id)}`);
              }}
            />
          ) : null}
        </div>
      );
    }

    if (selected.parsed) {
      return (
        <CreditIntelTabs
          parsed={selected.parsed}
          reportId={selected.id}
          reportRecord={selected}
          partnerId={resolvedPartnerId}
          evidence={evidence as EvidenceItem[]}
          availableReports={reports.map((r) => ({ id: r.id, receivedAt: r.receivedAt, filename: r.filename, parsed: r.parsed }))}
          onOpenEvidenceVault={() => navigate('/portal/evidence')}
          onOpenTasks={() => navigate('/portal/projects')}
          onReparseRequest={() => void handleReparse(selected)}
          onStartDispute={(candidate: DisputeCandidate, reasonTexts: string[]) => {
            const item = candidateToCaseItem(candidate, { reasons: reasonTexts });
            const disputeCase = createDisputeCase({
              partnerId: resolvedPartnerId,
              bureau: candidate.bureau,
              title: `${candidate.account} — ${candidate.type}`,
              latestReportId: selected.id,
              items: [item],
              initialRound: { round: 'Round 1', tone: 'formal', createdAt: nowIso() },
            });
            navigate(`/portal/letters?caseId=${encodeURIComponent(disputeCase.id)}`);
          }}
        />
      );
    }

    if (selected.fileType === 'pdf') {
      return (
        <PdfReportFallbackView
          pdfText={selected.pdfText}
          pdfMeta={selected.pdfMeta as PdfTextMeta | undefined}
          provider={selected.provider as CreditReportProvider | undefined}
          reportDate={selected.reportDate}
          filename={selected.filename}
          variant="partner"
        />
      );
    }

    return (
      <div className={`${finelyOsCatalogCard('rose')} space-y-4 p-6`}>
        <div className="text-lg font-extrabold text-white">Parsing not available yet</div>
        <p className={FINELY_OS_ENTITY_BODY}>Re-parse this upload to extract tradelines and findings.</p>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void handleReparse(selected)}>
          <RefreshCcw size={14} /> Re-parse
        </button>
      </div>
    );
  };

  return (
    <section className="fc-wlp-report-workspace" data-room={room} data-layout={layout}>
      {!isEmbedded ? (
        <>
          <div className="fc-wlp-report-workspace-head">
            <div>
              <span>Credit reports</span>
              <h2>Upload and review your bureau files.</h2>
              <p>Parsed accounts, findings, and source regions stay on this page.</p>
            </div>
            <div className="fc-wlp-report-workspace-state">
              <strong>{reports.length}</strong>
              <span>report{reports.length === 1 ? '' : 's'} on file</span>
            </div>
          </div>

          <div className="fc-wlp-report-room-tabs" role="tablist" aria-label="Credit report rooms">
            <button
              type="button"
              role="tab"
              aria-selected={room === 'upload'}
              data-active={room === 'upload' ? 'true' : undefined}
              data-accent="emerald"
              onClick={() => openRoom('upload')}
            >
              <UploadCloud size={17} />
              <span>
                <strong>Upload</strong>
                <small>HTML or PDF export</small>
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={room === 'viewer'}
              data-active={room === 'viewer' ? 'true' : undefined}
              data-accent="violet"
              onClick={() => openRoom('viewer')}
            >
              <Eye size={17} />
              <span>
                <strong>Inspect</strong>
                <small>Parsed accounts</small>
              </span>
              {reports.length ? <em>{reports.length}</em> : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={room === 'findings'}
              data-active={room === 'findings' ? 'true' : undefined}
              data-accent="rose"
              onClick={() => openRoom('findings')}
            >
              <ShieldCheck size={17} />
              <span>
                <strong>Findings</strong>
                <small>Dispute-ready items</small>
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={room === 'source'}
              data-active={room === 'source' ? 'true' : undefined}
              data-accent="sky"
              onClick={() => openRoom('source')}
            >
              <ScanSearch size={17} />
              <span>
                <strong>Verify source</strong>
                <small>Original regions</small>
              </span>
            </button>
          </div>
        </>
      ) : null}

      {workspaceError ? <div className={FINELY_OS_NOTICE_ERROR}>{workspaceError}</div> : null}

      {room !== 'upload' && selected ? renderSelectedToolbar : null}

      {room === 'source' ? (
        showDemoSource ? (
          <ProductReportSourceDemoStage />
        ) : selected ? (
          <div className="fc-wlp-report-viewer-stage">
            {reports.length > 1 ? (
              <ReportFileRail
                reports={reports}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
                onUpload={() => openRoom('upload')}
              />
            ) : null}
            <div className="fc-wlp-report-viewer">
              <ProductReportSourceVerificationStage
                partnerId={resolvedPartnerId}
                report={selected}
                evidence={evidence}
                onOpenUpload={() => openRoom('upload')}
              />
            </div>
          </div>
        ) : (
          <div className="fc-wlp-report-viewer-empty">
            <FileSearch size={25} />
            <h3>Upload a report to verify source regions</h3>
            <p>Source-faithful crops come from your protected bureau export — not a synthetic demo.</p>
            <button type="button" onClick={() => openRoom('upload')}>
              Upload first report
            </button>
          </div>
        )
      ) : null}

      {room === 'upload' ? (
        <div className="fc-wlp-report-upload-stage">
          <div className="fc-wlp-report-upload-copy">
            <span>
              <UploadCloud size={16} /> Add a bureau export
            </span>
            <h3>Add your bureau export</h3>
            <p>IdentityIQ or MyScoreIQ HTML keeps the most detail. PDF works when HTML is unavailable.</p>
            <ul>
              <li>Original file stays protected.</li>
              <li>Tradelines and scores parse on upload.</li>
              <li>Source regions link to findings.</li>
            </ul>
          </div>
          <div className="fc-wlp-report-uploader-shell">
            <ReportUploader partnerId={resolvedPartnerId} uploadedBy="partner" onCreated={handleCreated} />
          </div>
        </div>
      ) : null}

      {room === 'viewer' ? (
        <div className="fc-wlp-report-viewer-stage">
          <ReportFileRail
            reports={reports}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            onUpload={() => openRoom('upload')}
          />

          <div className="fc-wlp-report-viewer">
            {viewerNotice ? <div className={FINELY_OS_NOTICE}>{viewerNotice}</div> : null}
            {selected?.parsed ? (
              <>
                <ParsedReportViewer
                  parsed={selected.parsed}
                  partnerId={resolvedPartnerId}
                  reportId={selected.id}
                  reportRecord={selected}
                  showSequence
                  scrollBody
                />
                <ReportCollectionsInquiriesCapture
                  parsed={selected.parsed}
                  partnerId={resolvedPartnerId}
                  reportId={selected.id}
                  evidence={evidence}
                  onNotice={setViewerNotice}
                />
              </>
            ) : selected ? (
              <div className="fc-wlp-report-viewer-empty">
                <FileSearch size={25} />
                <h3>{reportLabel(selected)}</h3>
                <p>
                  The original upload is here, but parsed tradelines are not available yet. Re-upload the source export if
                  needed.
                </p>
                <button type="button" onClick={() => openRoom('upload')}>
                  Upload another report
                </button>
              </div>
            ) : (
              <div className="fc-wlp-report-viewer-empty">
                <FileSearch size={25} />
                <h3>Your parsed report will appear here</h3>
                <p>
                  Upload a bureau export, then review scores, accounts, payment history, and source-backed findings on this
                  page.
                </p>
                <button type="button" onClick={() => openRoom('upload')}>
                  Upload first report
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {room === 'findings' ? (
        <div className="fc-wlp-report-viewer-stage">
          <ReportFileRail
            reports={reports}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            onUpload={() => openRoom('upload')}
          />
          <div className="fc-wlp-report-viewer">{renderFindingsStage()}</div>
        </div>
      ) : null}

      {parseOverviewOpen && selected?.parsed ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setParseOverviewOpen(false)}
        >
          <div
            className={`relative max-h-[85vh] w-full max-w-4xl overflow-y-auto ${finelyOsCatalogCard('violet')} shadow-2xl`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Parse overview</div>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setParseOverviewOpen(false)}>
                Close
              </button>
            </div>
            <ParsedReportOverviewPanel parsed={selected.parsed} filename={selected.filename} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
