import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  FileText,
  FileUp,
  Gavel,
  Images,
  Landmark,
  Loader2,
  Mail,
  Scale,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import type { DebtCase } from '../../domain/debt';
import type { EvidenceItem } from '../../domain/evidence';
import { getBlobStore } from '../../storage/getBlobStore';
import { newId } from '../../utils/ids';
import { scanUploadedImageFile, type DocScanProfile } from '../../utils/imageScan';
import { CameraCaptureModal } from './CameraCaptureModal';
import { EvidenceExtractedFields } from './EvidenceExtractedFields';
import { EvidenceScrapeIntelPanel, type ScrapeIntelLine } from './EvidenceScrapeIntelPanel';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import { ingestUploadedEvidence, type IngestUploadResult } from '../../lib/ingestUploadedEvidence';
import {
  allPresetsFromGroups,
  documentTypeGroupsForContext,
  type DocumentTypeGroup,
  type UploadIntentId,
  type UploadPresetChip,
} from '../../lib/evidenceDocumentTaxonomy';
import { upsertDebt } from '../../data/debtRepo';
import { listReportsByPartner } from '../../data/reportsRepo';
import {
  debtPatchFromLitigationScrape,
  enrichLitigationScrapeFromCreditReports,
  mergeEmptyDebtFieldsFromScrape,
  persistLitigationScrapeAsDocument,
  scrapeLitigationDocument,
  type LitigationScrapeResult,
  type ScrapedLitigationField,
} from '../../lib/ocr/litigationDocScraper';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowField,
  finelyOsGlowPanel,
  finelyOsGlowTile,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

const blobStore = getBlobStore();
const ACCEPT = 'image/*,application/pdf,video/mp4,video/webm,video/quicktime,.html,.htm,.txt,text/html';

type PendingThumb = {
  id: string;
  file: File;
  url: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
};

function iconFor(profileIcon: string) {
  switch (profileIcon) {
    case 'mail':
      return Mail;
    case 'gavel':
      return Gavel;
    case 'scale':
      return Scale;
    case 'landmark':
      return Landmark;
    case 'shield':
      return Shield;
    default:
      return FileText;
  }
}

function parseLooseDate(raw: string): string | undefined {
  const s = String(raw || '').trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const mm = m[1]!.padStart(2, '0');
    const dd = m[2]!.padStart(2, '0');
    let yyyy = m[3]!;
    if (yyyy.length === 2) yyyy = `20${yyyy}`;
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return undefined;
}

function amountToCents(raw?: string): number | undefined {
  if (!raw) return undefined;
  const n = Number(String(raw).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 100);
}

export type UnifiedEvidenceCaptureProps = {
  partner: Partner;
  email?: string;
  compact?: boolean;
  disputeCaseId?: string;
  debtCaseId?: string;
  bankruptcyCaseId?: string;
  onUploaded?: (result: IngestUploadResult) => void;
  uploadContext?: 'general' | 'bureau' | 'debt' | 'foreclosure' | 'repossession' | 'bankruptcy';
  /** Show scrape-intel panel (Evidence hub + litigation / debt strips). */
  enableScrape?: boolean;
  /** Litigation Apply wiring */
  debt?: DebtCase | null;
  onDebtChange?: (d: DebtCase) => void;
  onScrapeApplied?: (result: LitigationScrapeResult) => void;
  onScrapeComplete?: (result: LitigationScrapeResult) => void;
  defaultHearingIso?: string;
  autoApplyOnHighConfidence?: boolean;
  reports?: Array<{
    id?: string;
    parsed?: { tradelines?: Array<Record<string, unknown>>; creditorContacts?: Array<Record<string, unknown>> } | null;
  }>;
};

/**
 * One cinematic glass composition: doc-type chips + drop/camera/gallery deck + scrape intel.
 * Shared by Documents vault, debt proof strips, litigation Step 1, and other upload surfaces.
 */
export function UnifiedEvidenceCapture({
  partner,
  email,
  compact,
  disputeCaseId,
  debtCaseId,
  bankruptcyCaseId,
  onUploaded,
  uploadContext = 'general',
  enableScrape = true,
  debt = null,
  onDebtChange,
  onScrapeApplied,
  onScrapeComplete,
  defaultHearingIso,
  autoApplyOnHighConfidence = false,
  reports: reportsProp,
}: UnifiedEvidenceCaptureProps) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);

  const [intent, setIntent] = useState<UploadIntentId | null>(null);
  const [scannerOverride, setScannerOverride] = useState<DocScanProfile | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanMode, setScanMode] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<PendingThumb[]>([]);
  const [result, setResult] = useState<IngestUploadResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [scrapeBusy, setScrapeBusy] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState<string | null>(null);
  const [scrapeResult, setScrapeResult] = useState<LitigationScrapeResult | null>(null);
  const [scrapeErr, setScrapeErr] = useState<string | null>(null);
  const [scrapeNotice, setScrapeNotice] = useState<string | null>(null);
  const [scrapeLines, setScrapeLines] = useState<ScrapeIntelLine[]>([
    {
      kind: 'signal',
      text: 'Standby. Drop a summons, docket, collector letter, affidavit, or image on the capture deck — signals extract here.',
    },
  ]);

  const groups = useMemo(() => documentTypeGroupsForContext(uploadContext), [uploadContext]);
  const allPresets = useMemo(() => allPresetsFromGroups(groups), [groups]);
  const preset = allPresets.find((p) => p.id === intent);
  const effectiveCaption = caption.trim() || preset?.caption || 'Uploaded document';

  const reports = useMemo(
    () => reportsProp ?? (partner.id ? listReportsByPartner(partner.id) : []),
    [reportsProp, partner.id],
  );

  const scannerProfile: DocScanProfile = useMemo(() => {
    if (scannerOverride) return scannerOverride;
    if (preset?.scanner) return preset.scanner;
    const c = effectiveCaption.toLowerCase();
    if (intent === 'bureau_response' || c.includes('bureau')) return 'bureau_mail';
    if (intent === 'affidavit' || c.includes('affidavit')) return 'creditor_letter';
    if (intent === 'summons' || intent === 'court_filing' || c.includes('summons')) return 'creditor_letter';
    if (intent === 'id_document' || c.includes('driver') || c.includes('passport') || c.includes('license')) return 'id_card';
    if (intent === 'ssn_card' || c.includes('ssn') || c.includes('social security')) return 'ssn_card';
    return 'general';
  }, [effectiveCaption, intent, preset?.scanner, scannerOverride]);

  const pickPreset = (p: UploadPresetChip) => {
    setIntent(p.id);
    setCaption(p.caption);
    setScannerOverride(p.scanner);
    setResult(null);
  };

  const revokePending = (items: PendingThumb[]) => {
    for (const p of items) {
      if (p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
    }
  };

  const scanifyImage = async (file: File): Promise<File> => {
    const type = file.type || '';
    if (!type.startsWith('image/')) return file;
    const blob = await scanUploadedImageFile(file, scannerProfile);
    const base = file.name.replace(/\.[a-z0-9]+$/i, '') || 'Document';
    return new File([blob], `${base}_scanned.jpg`, { type: 'image/jpeg' });
  };

  const persistFile = async (
    file: File,
    opts?: { skipScan?: boolean; captionOverride?: string },
  ): Promise<{ item: EvidenceItem; file: File }> => {
    const shouldScan = !opts?.skipScan && scanMode;
    const finalFile = shouldScan ? await scanifyImage(file) : file;
    const effective = (opts?.captionOverride ?? effectiveCaption).trim() || undefined;
    const { ref } = await blobStore.put(finalFile, {
      partnerId: partner.id,
      caption: effective,
      scanMode: shouldScan,
      kind: 'evidence',
    });
    const item: EvidenceItem = {
      id: newId('evidence'),
      partnerId: partner.id,
      type: 'upload',
      source: 'upload',
      caption: effective,
      filename: finalFile.name,
      mimeType: finalFile.type || 'application/octet-stream',
      sizeBytes: finalFile.size,
      blobRef: ref,
      createdAt: new Date().toISOString(),
    };
    return { item, file: finalFile };
  };

  const applyScrape = (scraped: LitigationScrapeResult, opts?: { auto?: boolean }) => {
    if (!onDebtChange || !partner.id) return;
    const patch = debtPatchFromLitigationScrape(scraped.entities);
    const hearingIso = parseLooseDate(patch.hearingDate || '') || defaultHearingIso;
    const amountCents = amountToCents(patch.amountClaimed);
    const base: DebtCase =
      debt ||
      ({
        id: '',
        partnerId: partner.id,
        type: 'summons',
        name: patch.name || 'Court matter',
        amountCents: amountCents || 0,
        status: 'in_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as DebtCase);

    const merged = mergeEmptyDebtFieldsFromScrape(
      {
        ...base,
        partnerId: partner.id,
        type: base.type === 'debt' && scraped.docKind !== 'collector_letter' ? 'summons' : base.type,
        hearingDate: parseLooseDate(String(base.hearingDate || '')) || hearingIso || base.hearingDate,
        dateServed:
          parseLooseDate(String(base.dateServed || '')) ||
          parseLooseDate(patch.dateServed || '') ||
          base.dateServed,
        source: 'document' as const,
        notes: [base.notes, `Litigation scrape: ${scraped.filename} (${scraped.docKind}).`].filter(Boolean).join('\n'),
      },
      {
        ...patch,
        hearingDate: hearingIso || patch.hearingDate,
        dateServed: parseLooseDate(patch.dateServed || '') || patch.dateServed,
      },
      amountCents,
    );

    const next = upsertDebt(merged as DebtCase);
    onDebtChange(next);
    setScrapeNotice(
      `${opts?.auto ? 'Auto-applied' : 'Applied'} empty Court / Validation fields from scrape. Confirm parties next.`,
    );
    setScrapeLines((prev) => [
      ...prev,
      {
        kind: 'signal',
        text: `${opts?.auto ? 'Auto-applied' : 'Applied'} → “${next.name}”. Case #: ${next.courtCaseNumber || '—'} · Firm: ${next.plaintiffLawFirm || '—'} · Hearing: ${next.hearingDate || '—'}`,
      },
    ]);
    onScrapeApplied?.(scraped);
  };

  const runScrape = async (file: File, ctx?: { evidenceId?: string; blobRef?: string }) => {
    if (!enableScrape) return;
    setScrapeBusy(true);
    setScrapeErr(null);
    setScrapeNotice(null);
    setScrapeProgress('Starting scrape…');
    setScrapeLines((prev) => [...prev, { kind: 'probe', text: `Uploaded ${file.name}` }]);
    try {
      let scraped = await scrapeLitigationDocument(file, {
        maxOcrPages: 12,
        onProgress: (msg) => setScrapeProgress(msg),
      });
      if (reports.length) {
        setScrapeProgress('Enriching from credit reports…');
        scraped = enrichLitigationScrapeFromCreditReports(scraped, reports);
      }
      setScrapeResult(scraped);
      onScrapeComplete?.(scraped);
      // Persist regardless of whether a debt case is open yet — so letter
      // builders can resolve this document's party address later even without
      // an Apply, and even when the AI doc-intel pass missed a field.
      if (partner.id) {
        try {
          persistLitigationScrapeAsDocument({
            partnerId: partner.id,
            evidenceId: ctx?.evidenceId,
            blobRef: ctx?.blobRef,
            filename: file.name,
            scraped,
          });
        } catch {
          /* best-effort persistence only */
        }
      }
      const lines = scraped.fields.length
        ? scraped.fields.map((f) => `• ${f.label}: ${f.value} (${f.confidence})`).join('\n')
        : 'Few structured fields — review caption / type chips, then confirm manually.';
      const usable = scraped.fields.filter((f) => f.confidence === 'high' || f.confidence === 'medium');
      const hasCore =
        Boolean(scraped.entities.caseNumber || scraped.entities.plaintiffName || scraped.entities.address) &&
        usable.length >= 2;
      const shouldAuto =
        autoApplyOnHighConfidence &&
        Boolean(onDebtChange) &&
        partner.id &&
        (usable.length >= 2 || hasCore) &&
        scraped.fields.length > 0;
      setScrapeLines((prev) => [
        ...prev,
        {
          kind: 'signal',
          text: `${scraped.summary}\n${lines}\n${
            shouldAuto
              ? 'High-confidence — auto-applying empty case fields.'
              : onDebtChange
                ? 'Tap Apply signals to fill empty case fields.'
                : 'Filed to vault. Open Debt / Litigation to Apply to a case.'
          }`,
        },
      ]);
      if (shouldAuto) {
        setScrapeProgress('Auto-applying empty fields…');
        applyScrape(scraped, { auto: true });
      }
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'Scrape failed.';
      setScrapeErr(msg);
      setScrapeLines((prev) => [...prev, { kind: 'alert', text: msg }]);
    } finally {
      setScrapeBusy(false);
      setScrapeProgress(null);
    }
  };

  const ingestOne = async (
    file: File,
    opts?: { skipScan?: boolean; captionOverride?: string; runScrapeToo?: boolean },
  ) => {
    const { item, file: finalFile } = await persistFile(file, opts);
    const enriched = { ...item, caption: opts?.captionOverride?.trim() || effectiveCaption };
    const res = await ingestUploadedEvidence({
      partnerId: partner.id,
      item: enriched,
      file: finalFile,
      email,
      intent: intent ?? undefined,
      disputeCaseId,
      debtCaseId,
      bankruptcyCaseId,
    });
    setResult(res);
    onUploaded?.(res);
    if (opts?.runScrapeToo !== false && enableScrape) {
      void runScrape(finalFile, { evidenceId: res.evidence.id, blobRef: res.evidence.blobRef });
    }
    return res;
  };

  const processFiles = async (files: File[], opts?: { skipScan?: boolean }) => {
    if (!files.length) return;
    setBusy(true);
    setErr(null);
    const thumbs: PendingThumb[] = files.map((file) => ({
      id: newId('pend'),
      file,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      status: 'queued' as const,
    }));
    setPending((prev) => {
      revokePending(prev.filter((p) => p.status === 'done' || p.status === 'error'));
      return thumbs;
    });

    try {
      for (let i = 0; i < thumbs.length; i++) {
        const t = thumbs[i]!;
        setPending((prev) => prev.map((p) => (p.id === t.id ? { ...p, status: 'uploading' } : p)));
        const baseCap = effectiveCaption;
        const cap =
          !baseCap.trim()
            ? undefined
            : thumbs.length > 1
              ? `${baseCap} — ${i + 1}/${thumbs.length}`
              : baseCap;
        try {
          await ingestOne(t.file, {
            skipScan: opts?.skipScan,
            captionOverride: cap,
            runScrapeToo: i === thumbs.length - 1,
          });
          setPending((prev) => prev.map((p) => (p.id === t.id ? { ...p, status: 'done' } : p)));
        } catch (e: unknown) {
          const msg = (e as Error)?.message || 'Upload failed';
          setPending((prev) => prev.map((p) => (p.id === t.id ? { ...p, status: 'error', error: msg } : p)));
          setErr(msg);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const list = Array.from(e.dataTransfer.files || []);
    if (list.length) void processFiles(list);
  };

  const explainField = (f: ScrapedLitigationField) => {
    setScrapeLines((prev) => [
      ...prev,
      { kind: 'probe', text: `Explain ${f.label}` },
      {
        kind: 'signal',
        text: `${f.label}: “${f.value}” · ${f.confidence}${f.sourceHint ? ` · ${f.sourceHint}` : ''}\n${f.meaning}`,
      },
    ]);
  };

  const onProbe = (query: string) => {
    const q = query.toLowerCase();
    const match = scrapeResult?.fields.find(
      (f) => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) || f.value.toLowerCase().includes(q),
    );
    setScrapeLines((prev) => [
      ...prev,
      { kind: 'probe', text: query },
      match
        ? {
            kind: 'signal',
            text: `${match.label}: “${match.value}” (${match.confidence})\n${match.meaning}`,
          }
        : {
            kind: 'alert',
            text: scrapeResult
              ? `No field matched “${query}”. Try case, plaintiff, court, amount, or account.`
              : 'No scrape yet — upload a document first.',
          },
    ]);
  };

  const Icon = result ? iconFor(result.profile.icon) : Sparkles;

  const chipClass = (active: boolean) =>
    `px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition whitespace-nowrap ${
      active
        ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
        : 'border-white/10 bg-black/30 text-white/70 hover:border-emerald-500/30'
    }`;

  const tileClass = (active: boolean) =>
    `${finelyOsGlowTile('emerald', active)} px-3 py-2.5 text-left text-xs font-medium min-w-[7rem] ${
      active ? 'text-emerald-100' : 'text-white/75'
    }`;

  return (
    <div
      className={
        compact
          ? 'rounded-2xl border border-emerald-400/25 bg-black/30 !p-3 space-y-3 overflow-hidden relative'
          : `${finelyOsGlassShell('panel', 'emerald')} overflow-hidden relative`
      }
      id="unified-evidence-capture"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 8% 0%, rgba(16,185,129,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 92% 100%, rgba(34,211,238,0.12), transparent 50%)',
        }}
      />

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        caption={caption}
        defaultProfile={scannerProfile}
        title={scannerProfile === 'id_card' || scannerProfile === 'ssn_card' ? 'ID card scanner' : 'Document scanner'}
        subtitle={
          scannerProfile === 'id_card' || scannerProfile === 'ssn_card'
            ? 'Wait for the quality bar and “Ready” before capture — bright, even lighting required.'
            : 'Align your document — we crop, enhance, classify, and scrape after capture.'
        }
        onSaveFiles={async ({ files }) => {
          const baseCap = caption.trim() || effectiveCaption;
          await processFiles(files, { skipScan: true });
          if (baseCap && files.length > 1) {
            /* captions applied inside processFiles via effectiveCaption */
          }
          setCaption('');
        }}
      />

      <div className="relative space-y-3">
        {!compact ? (
          <div className="border-b border-white/[0.08] pb-3 space-y-1.5">
            <div className="inline-flex items-center gap-2 text-emerald-300">
              <Camera size={16} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Unified evidence capture</span>
            </div>
            <h2 className={FINELY_OS_ENTITY_TITLE}>Capture deck — type · drop · scrape</h2>
            <p className={`${FINELY_OS_ENTITY_BODY} max-w-3xl text-sm`}>
              One composition for the Evidence hub and every workstation: pick a document type, then camera / gallery /
              drag-drop (multi-file). Scrape intel extracts fields beside the drop zone — not a separate chat widget.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-200/90`}>Evidence capture</span>
            <span className="text-[10px] text-white/45">Vault + scrape · one unit</span>
          </div>
        )}

        {/* Document type — chips / tiles only (never dropdown) */}
        <div className="space-y-2">
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} ${compact ? 'text-[10px]' : ''}`}>
            Document type{preset ? `: ${preset.label}` : ''}
          </p>
          {compact ? (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-0.5">
              {allPresets.map((p) => (
                <button key={p.id} type="button" onClick={() => pickPreset(p)} className={chipClass(intent === p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group: DocumentTypeGroup) => (
                <div key={group.id} className="rounded-xl border border-white/[0.08] bg-black/25 !p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <p className={FINELY_OS_ENTITY_SUBLABEL}>{group.label}</p>
                    {group.hint ? (
                      <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY} opacity-75 max-w-md`}>{group.hint}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.presets.map((p) => (
                      <button key={p.id} type="button" onClick={() => pickPreset(p)} className={tileClass(intent === p.id)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {intent && (intent === 'id_document' || intent === 'ssn_card') ? (
            <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
              Camera opens in <strong className="text-emerald-200">ID scan mode</strong>.
            </p>
          ) : null}
        </div>

        <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
          <label className={`block ${FINELY_OS_ENTITY_SUBLABEL} ${compact ? 'text-[10px]' : ''}`}>Notes (optional)</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={preset?.caption || 'e.g. Equifax Round 1 investigation results received today'}
            className={`${finelyOsGlowField('emerald')} w-full ${compact ? 'max-w-full text-xs' : 'max-w-xl text-sm'}`}
          />
        </div>

        {/* One composition: capture deck + scrape intel */}
        <div className={`grid gap-3 ${enableScrape ? 'lg:grid-cols-2' : ''}`}>
          <div className="space-y-2 min-w-0">
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`rounded-2xl border-2 border-dashed px-4 ${compact ? 'py-5' : 'py-8'} text-center transition-colors ${
                dragOver
                  ? 'border-amber-400/70 bg-amber-500/15'
                  : 'border-emerald-400/40 bg-black/35 hover:border-emerald-300/55 hover:bg-emerald-500/10'
              }`}
            >
              <div className="inline-flex items-center justify-center gap-2 text-emerald-100 font-semibold text-sm">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
                {busy ? 'Uploading…' : 'Drag & drop files — or use buttons below'}
              </div>
              <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Multi-file · PDF · images · video · HTML. Camera scan for phone-quality capture.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);
                  e.target.value = '';
                  if (list.length) void processFiles(list);
                }}
              />
              <input
                ref={galleryRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);
                  e.target.value = '';
                  if (list.length) void processFiles(list);
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className={`${FINELY_OS_SECONDARY_BTN} !w-full justify-center disabled:opacity-60`}
              >
                <FileUp size={14} /> Files
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => galleryRef.current?.click()}
                className={`${FINELY_OS_SECONDARY_BTN} !w-full justify-center disabled:opacity-60`}
                title="Photos / gallery (multi-select)"
              >
                <Images size={14} /> Gallery
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setCameraOpen(true)}
                className={`${FINELY_OS_PRIMARY_BTN} !w-full justify-center disabled:opacity-60`}
              >
                <Camera size={14} /> Camera
              </button>
            </div>

            <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case text-[11px]`}>
              <input
                type="checkbox"
                checked={scanMode}
                onChange={(e) => setScanMode(e.target.checked)}
                className="accent-amber-500"
              />
              Scan-style enhance (photos of letters)
            </label>

            {pending.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pending.map((p) => (
                  <div
                    key={p.id}
                    className="relative w-16 h-16 rounded-lg border border-white/15 bg-black/40 overflow-hidden shrink-0"
                    title={p.error || p.file.name}
                  >
                    {p.url ? (
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-white/50 p-1 text-center">
                        PDF
                      </div>
                    )}
                    <div
                      className={`absolute inset-x-0 bottom-0 text-[8px] font-bold text-center py-0.5 ${
                        p.status === 'done'
                          ? 'bg-emerald-600/80'
                          : p.status === 'error'
                            ? 'bg-rose-600/80'
                            : p.status === 'uploading'
                              ? 'bg-amber-600/80'
                              : 'bg-black/70'
                      }`}
                    >
                      {p.status}
                    </div>
                    {p.status === 'done' || p.status === 'error' ? (
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5 text-white/80"
                        onClick={() => {
                          setPending((prev) => {
                            const next = prev.filter((x) => x.id !== p.id);
                            if (p.url) URL.revokeObjectURL(p.url);
                            return next;
                          });
                        }}
                        aria-label="Dismiss preview"
                      >
                        <X size={10} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {enableScrape ? (
            <EvidenceScrapeIntelPanel
              busy={scrapeBusy}
              progress={scrapeProgress}
              result={scrapeResult}
              lines={scrapeLines}
              notice={scrapeNotice}
              err={scrapeErr}
              canApply={Boolean(onDebtChange && scrapeResult)}
              onApply={() => scrapeResult && applyScrape(scrapeResult)}
              onExplainField={explainField}
              onProbe={onProbe}
              compact={compact}
            />
          ) : null}
        </div>

        {busy ? (
          <div className={`flex items-center gap-2 text-emerald-200 ${compact ? 'text-xs' : 'text-sm'}`}>
            <Loader2 size={16} className="animate-spin" /> Identifying document and filing…
          </div>
        ) : null}
        {err ? <p className={`${compact ? 'text-xs' : 'text-sm'} text-red-300`}>{err}</p> : null}

        {result ? (
          <div className={`${finelyOsGlowPanel('emerald')} ${compact ? '!p-3 space-y-2' : 'p-4 space-y-3'}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                <Icon size={18} className="text-emerald-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white">{result.profile.label}</span>
                  {result.confidence != null ? (
                    <span className="text-[10px] text-white/50">{Math.round(result.confidence * 100)}% match</span>
                  ) : null}
                </div>
                <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>{result.profile.userExplanation}</p>
                <EvidenceExtractedFields entities={result.entities} summary={result.summary} compact={compact} />
                <p className="mt-2 text-xs text-emerald-200/90">
                  Filed to vault folder: <strong>{result.profile.folder.replace(/_/g, ' ')}</strong>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={FINELY_OS_PRIMARY_BTN}
                onClick={() => {
                  void openBlobRefInNewTab({
                    blobRef: result.evidence.blobRef,
                    mimeType: result.evidence.mimeType,
                  }).then((r) => {
                    if (!r.ok) setErr(r.message);
                  });
                }}
              >
                <Eye size={14} /> View document
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(result.profile.primaryRoute)}>
                {result.profile.primaryRouteLabel} <ArrowRight size={14} />
              </button>
              {result.routing.actions.slice(0, 3).map((a) => (
                <button key={a.id} type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(a.path)}>
                  {a.label}
                </button>
              ))}
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/portal/documents')}>
                Evidence vault
              </button>
            </div>
            <p className={FINELY_OS_NOTICE_SUCCESS}>{result.routing.summary}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
