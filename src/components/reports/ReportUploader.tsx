import React, { useMemo, useState } from 'react';
import { FileUp, ShieldCheck } from 'lucide-react';
import type { UploadActor, CreditReportFileType, CreditReportRecord } from '../../domain/creditReports';
import { parseCreditReportHtmlEnhanced } from '../../creditReports/parseHtmlReport';
import { detectProviderFromText } from '../../creditReports/detectProvider';
import { detectReportDateFromText } from '../../creditReports/parsePdfText';
import { parseCreditReportPdf } from '../../creditReports/parsePdfReport';
import { computeReportIdentityCheck } from '../../creditReports/identityCheck';
import { htmlToPdfTextFallback } from '../../creditReports/htmlToPdfFallback';
import { getBlobStore } from '../../storage/getBlobStore';
import { newId } from '../../utils/ids';
import { createTask, listTasksByPartner } from '../../data/tasksRepo';

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
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState<string | null>(null);

  const accept = useMemo(() => '.html,.htm,.pdf,application/pdf,text/html', []);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setProgress(null);
    try {
      const fileType: CreditReportFileType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html';
      const { ref, sha256 } = await blobStore.put(file, { partnerId, uploadedBy, note });

      let parsed;
      let provider: any = 'unknown';
      let pdfText: string | undefined;
      let pdfMeta: CreditReportRecord['pdfMeta'] | undefined;
      let reportDate: string | undefined;

      if (fileType === 'html') {
        const html = await file.text();
        try {
          parsed = await parseCreditReportHtmlEnhanced(html, { onProgress: (s) => setProgress(s) });
        } catch (e: any) {
          parsed = undefined;
          setProgress(e?.message ? `HTML parse failed (${e.message}). Preparing fallback…` : 'HTML parse failed. Preparing fallback…');
        }

        const tradelines = (parsed as any)?.tradelines?.length ?? 0;
        const scores = (parsed as any)?.scores?.length ?? 0;
        const shouldFallback = !parsed || (tradelines === 0 && scores < 3);

        if (shouldFallback) {
          setProgress('Fallback: converting HTML → PDF (text-first)…');
          const { blob } = await htmlToPdfTextFallback({ html, title: file.name });
          const pdfFile = new File([blob], file.name.replace(/\.html?$/i, '') + '_fallback.pdf', { type: 'application/pdf' });
          const res = await parseCreditReportPdf(pdfFile, {
            onProgress: (p) => {
              const page = typeof p.page === 'number' ? p.page : null;
              const pages = typeof p.numPages === 'number' ? p.numPages : null;
              setProgress(page && pages ? `${p.status} (page ${page}/${pages})` : p.status);
            },
          });
          pdfText = res.pdfText;
          pdfMeta = { ...(res.pdfMeta as any), ocrUsed: Boolean(res.ocrUsed), ocrEngine: (res.pdfMeta as any)?.ocrEngine };
          provider = res.provider ?? (pdfText ? detectProviderFromText(pdfText) : 'unknown');
          reportDate = res.reportDate ?? (pdfText ? detectReportDateFromText(pdfText) : undefined);
          parsed = res.parsed;
        } else {
          provider = (parsed as any).provider;
          reportDate = (parsed as any).reportDate;
        }
      } else {
        // Full pipeline: extract text, parse into tradelines/scores, OCR fallback when needed.
        const res = await parseCreditReportPdf(file, {
          onProgress: (p) => {
            const page = typeof p.page === 'number' ? p.page : null;
            const pages = typeof p.numPages === 'number' ? p.numPages : null;
            setProgress(page && pages ? `${p.status} (page ${page}/${pages})` : p.status);
          },
        });
        pdfText = res.pdfText;
        pdfMeta = { ...(res.pdfMeta as any), ocrUsed: Boolean(res.ocrUsed), ocrEngine: (res.pdfMeta as any)?.ocrEngine };
        provider = res.provider ?? (pdfText ? detectProviderFromText(pdfText) : 'unknown');
        reportDate = res.reportDate ?? (pdfText ? detectReportDateFromText(pdfText) : undefined);
        parsed = res.parsed;
      }

      const reportId = newId('report');
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

      onCreated(record);
      setNote('');
    } catch (e: any) {
      setError(e?.message || 'Upload failed.');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <ShieldCheck size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Secure report upload</span>
          </div>
          <h3 className="text-xl font-light text-white">Upload Credit Report (HTML or PDF)</h3>
          <p className="text-white/50 text-sm">
            Upload your exported report. HTML uploads are parsed immediately into tradelines + 2-year payment history.
          </p>
        </div>
        <div className="text-right text-[10px] uppercase tracking-widest text-white/40">
          uploader: <span className="text-white/70">{uploadedBy}</span>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Notes (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
            placeholder="Example: Updated report after bureau refresh"
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">File</label>
          <label className="mt-2 w-full cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all">
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

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">
          {error}
        </div>
      )}
      {busy && progress && (
        <div className="mt-4 p-4 rounded-xl border border-white/10 bg-black/30 text-white/70 text-sm">
          {progress}
        </div>
      )}
    </div>
  );
}

