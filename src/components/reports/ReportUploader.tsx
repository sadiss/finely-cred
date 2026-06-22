import React, { useMemo, useState } from 'react';
import { FileUp, ShieldCheck } from 'lucide-react';
import type { UploadActor, CreditReportFileType, CreditReportRecord } from '../../domain/creditReports';
import { parseHtmlReportWithCache, parsePdfReportWithCache, parseWarningForReport } from '../../lib/reportParsePipeline';
import { computeReportIdentityCheck } from '../../creditReports/identityCheck';
import { getBlobStore } from '../../storage/getBlobStore';
import { isSupabaseBlobRef } from '../../storage/SupabaseBlobStore';
import { newId } from '../../utils/ids';
import { createTask, listTasksByPartner } from '../../data/tasksRepo';
import { upsertReport, listReportsByPartner } from '../../data/reportsRepo';
import { handleReportUploadTimeline } from '../../lib/reportTimeline';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
} from '../../features/os/finelyOsLightUi';

const blobStore = getBlobStore();

export function ReportUploader({
  partnerId,
  uploadedBy,
  onCreated,
}: {
  partnerId: string;
  uploadedBy: UploadActor;
  onCreated: (record: CreditReportRecord) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [storageNote, setStorageNote] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState<string | null>(null);

  const accept = useMemo(() => '.html,.htm,.pdf,application/pdf,text/html', []);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setParseWarning(null);
    setStorageNote(null);
    setProgress(null);

    const reportId = newId('report');
    const fileType: CreditReportFileType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html';

    let ref: string;
    let sha256: string | undefined;
    try {
      setProgress('Storing report file…');
      const put = await blobStore.put(file, { partnerId, uploadedBy, note, kind: 'credit_report' });
      ref = put.ref;
      sha256 = put.sha256;
      if (!isSupabaseBlobRef(ref)) {
        setStorageNote(
          'Report file saved in this browser (cloud storage unavailable). Re-parse and viewing still work here; configure Supabase storage for cross-device access.',
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Storage failed';
      setError(`Could not store the report file: ${msg}. Check your connection and try again.`);
      setBusy(false);
      setProgress(null);
      return;
    }

    let parsed;
    let provider: CreditReportRecord['provider'] = 'unknown';
    let pdfText: string | undefined;
    let pdfMeta: CreditReportRecord['pdfMeta'] | undefined;
    let reportDate: string | undefined;

    try {
      if (fileType === 'html') {
        setProgress('Parsing HTML report…');
        const html = await file.text();
        const bundle = await parseHtmlReportWithCache({
          reportId,
          html,
          onProgress: (s) => setProgress(s),
        });
        parsed = bundle.parsed;
        provider = (bundle.provider as CreditReportRecord['provider']) ?? 'unknown';
        reportDate = bundle.reportDate;
        pdfText = bundle.pdfText;
        pdfMeta = bundle.pdfMeta as CreditReportRecord['pdfMeta'];
        if (bundle.fromCache) setProgress('Loaded from parse cache');
      } else {
        setProgress('Parsing PDF report…');
        const bundle = await parsePdfReportWithCache({
          reportId,
          file,
          onProgress: (s) => setProgress(s),
        });
        parsed = bundle.parsed;
        provider = (bundle.provider as CreditReportRecord['provider']) ?? 'unknown';
        reportDate = bundle.reportDate;
        pdfText = bundle.pdfText;
        pdfMeta = bundle.pdfMeta as CreditReportRecord['pdfMeta'];
        if (bundle.fromCache) setProgress('Loaded from parse cache');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Parse failed';
      setParseWarning(
        `File uploaded but parsing hit an error: ${msg}. Open the report and click Re-parse, or try an HTML export from your monitoring service.`,
      );
    }

    const identityCheck = computeReportIdentityCheck({ partnerId, parsed: (parsed as any) ?? null });

    const record: CreditReportRecord = {
      id: reportId,
      partnerId,
      provider,
      fileType,
      uploadedBy,
      receivedAt: new Date().toISOString(),
      reportDate,
      filename: file.name,
      mimeType: file.type || (fileType === 'pdf' ? 'application/pdf' : 'text/html'),
      sizeBytes: file.size,
      sha256,
      rawBlobRef: ref,
      parsed,
      pdfText,
      pdfMeta,
      identityCheck,
    };

    if (identityCheck.faults.length) {
      const tag = `identity_check:${reportId}`;
      const existing = listTasksByPartner(partnerId).some((t) => (t.tags ?? []).includes(tag));
      if (!existing) {
        createTask({
          partnerId,
          title: 'Verify identity details from report upload',
          kind: 'general',
          stage: 'identity',
          status: 'pending',
          priority: identityCheck.faults.some((f) => f.severity === 'warn' || f.severity === 'error') ? 'high' : 'normal',
          tags: [tag, 'identity', 'reports'],
          notes: identityCheck.faults.map((f) => `- ${f.message}`).join('\n'),
        });
      }
    }

    upsertReport(record);
    const warn = parseWarningForReport(parsed);
    if (warn) setParseWarning(warn);

    const allReports = listReportsByPartner(partnerId);
    handleReportUploadTimeline({ partnerId, newReportId: reportId, allReports });
    onCreated(record);
    setNote('');
    setBusy(false);
    setProgress(null);
  };

  return (
    <div className={`${FINELY_OS_GLASS_CATALOG} space-y-6`} data-fc-report-upload>
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2 min-w-0">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
            <ShieldCheck size={16} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Secure report upload</span>
          </div>
          <h3 className={FINELY_OS_ENTITY_TITLE}>Upload Credit Report (HTML or PDF)</h3>
          <p className={FINELY_OS_ENTITY_BODY}>
            Upload your exported report. HTML is parsed into tradelines + 2-year payment history; PDF uses text/OCR fallback when needed.
          </p>
        </div>
        <div className={`text-right ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case shrink-0`}>
          uploader: <span className={FINELY_OS_ENTITY_VALUE}>{uploadedBy}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 min-w-0">
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Notes (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={FINELY_OS_ENTITY_INPUT}
            placeholder="Example: Updated report after bureau refresh"
          />
        </div>
        <div className="md:col-span-1 min-w-0">
          <label className={FINELY_OS_ENTITY_SUBLABEL}>File</label>
          <label className={`mt-2 w-full cursor-pointer ${FINELY_OS_PRIMARY_BTN} !w-full justify-center`}>
            <FileUp size={14} />
            {busy ? 'Uploading…' : 'Choose file'}
            <input
              type="file"
              accept={accept}
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.currentTarget.value = '';
              }}
            />
          </label>
        </div>
      </div>

      {error && <div className={FINELY_OS_NOTICE_ERROR}>{error}</div>}
      {storageNote && !error ? <div className={FINELY_OS_NOTICE_WARN}>{storageNote}</div> : null}
      {parseWarning && !error ? <div className={FINELY_OS_NOTICE_WARN}>{parseWarning}</div> : null}
      {busy && progress && <div className={FINELY_OS_NOTICE}>{progress}</div>}
    </div>
  );
}
