import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  guessUploadIntentFromFile,
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
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowField,
  finelyOsGlowPanel,
} from '../../features/os/finelyOsLightUi';
import './unifiedEvidenceCapture.css';

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
  /** Limit quick-pick document types when a dedicated vault owns only part of the taxonomy. */
  allowedIntentIds?: readonly UploadIntentId[];
  captureEyebrow?: string;
  captureTitle?: string;
  captureDescription?: string;
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
  /** Where the post-upload primary CTA opens — defaults to Documents vault. */
  vaultOpenPath?: string;
  vaultOpenLabel?: string;
  surface?: 'dark' | 'light';
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
  allowedIntentIds,
  captureEyebrow = 'Unified evidence capture',
  captureTitle = 'Capture deck — type · drop · scrape',
  captureDescription = 'Pick a document type, then use camera, gallery, or multi-file drag and drop. Scrape intel extracts useful fields beside the upload.',
  enableScrape = true,
  debt = null,
  onDebtChange,
  onScrapeApplied,
  onScrapeComplete,
  defaultHearingIso,
  autoApplyOnHighConfidence = false,
  reports: reportsProp,
  vaultOpenPath = '/portal/documents',
  vaultOpenLabel = 'Open documents vault',
  surface = 'dark',
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
  const [staged, setStaged] = useState<PendingThumb[]>([]);
  const [pending, setPending] = useState<PendingThumb[]>([]);
  const [result, setResult] = useState<IngestUploadResult | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
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

  const groups = useMemo(() => {
    const available = documentTypeGroupsForContext(uploadContext);
    if (!allowedIntentIds?.length) return available;
    const allowed = new Set<UploadIntentId>(allowedIntentIds);
    return available
      .map((group) => ({ ...group, presets: group.presets.filter((item) => allowed.has(item.id)) }))
      .filter((group) => group.presets.length > 0);
  }, [allowedIntentIds, uploadContext]);
  const allPresets = useMemo(() => allPresetsFromGroups(groups), [groups]);
  const preset = allPresets.find((p) => p.id === intent);
  const effectiveCaption = caption.trim() || preset?.caption || 'Uploaded document';
  const activeDebtCaseId = debtCaseId || debt?.id;
  const stayInDebtWorkflow = uploadContext === 'debt' && Boolean(activeDebtCaseId);

  useEffect(() => {
    const blockBrowserFileNavigation = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', blockBrowserFileNavigation);
    window.addEventListener('drop', blockBrowserFileNavigation);
    return () => {
      window.removeEventListener('dragover', blockBrowserFileNavigation);
      window.removeEventListener('drop', blockBrowserFileNavigation);
    };
  }, []);

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
    if (intent === 'summons' || intent === 'docket' || intent === 'court_filing' || c.includes('summons') || c.includes('docket'))
      return 'creditor_letter';
    if (intent === 'id_document' || c.includes('driver') || c.includes('passport') || c.includes('license')) return 'id_card';
    if (intent === 'ssn_card' || c.includes('ssn') || c.includes('social security')) return 'ssn_card';
    return 'general';
  }, [effectiveCaption, intent, preset?.scanner, scannerOverride]);

  const pickPreset = (p: UploadPresetChip) => {
    setIntent(p.id);
    setCaption(p.caption);
    setScannerOverride(p.scanner);
    setResult(null);
    setSaveNotice(null);
  };

  const applyIntentGuessFromFile = (file: File) => {
    if (intent) return;
    const guessed = guessUploadIntentFromFile(caption, file.name);
    if (guessed) {
      const chip = allPresets.find((p) => p.id === guessed);
      if (chip) {
        setIntent(chip.id);
        if (!caption.trim()) setCaption(chip.caption);
        setScannerOverride(chip.scanner);
      }
      return;
    }
    if (uploadContext === 'debt' || uploadContext === 'foreclosure' || uploadContext === 'repossession') {
      const docket = allPresets.find((p) => p.id === 'docket');
      if (docket && /docket|roa|register|summons|complaint|court/i.test(file.name)) {
        setIntent(docket.id);
        if (!caption.trim()) setCaption(docket.caption);
        setScannerOverride(docket.scanner);
      }
    }
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

  const inferIntentFromFile = (file: File, forcedIntent?: UploadIntentId | null): UploadIntentId | undefined => {
    if (forcedIntent) return forcedIntent;
    if (intent) return intent;
    const guessed = guessUploadIntentFromFile(effectiveCaption, file.name);
    if (guessed) return guessed;
    if (uploadContext !== 'debt' && uploadContext !== 'foreclosure' && uploadContext !== 'repossession') {
      return undefined;
    }
    const hay = `${file.name} ${effectiveCaption}`.toLowerCase();
    if (/docket|register of actions|case history|\broa\b/.test(hay)) return 'docket';
    if (/summons|complaint/.test(hay) && !/answer/.test(hay)) return 'summons';
    if (/affidavit|sworn|notary/.test(hay)) return 'affidavit';
    if (/collector|validation notice|fdcpa|collection letter/.test(hay)) return 'collection_notice';
    if (/motion|discovery|court order|judgment/.test(hay)) return 'court_filing';
    return undefined;
  };

  const ingestOne = async (
    file: File,
    opts?: { skipScan?: boolean; captionOverride?: string; runScrapeToo?: boolean; intentOverride?: UploadIntentId },
  ) => {
    const { item, file: finalFile } = await persistFile(file, opts);
    const enriched = { ...item, caption: opts?.captionOverride?.trim() || effectiveCaption };
    const resolvedIntent = inferIntentFromFile(finalFile, opts?.intentOverride ?? intent);
    const res = await ingestUploadedEvidence({
      partnerId: partner.id,
      item: enriched,
      file: finalFile,
      email,
      intent: resolvedIntent ?? undefined,
      disputeCaseId,
      debtCaseId: activeDebtCaseId,
      bankruptcyCaseId,
      uploadContext,
    });
    setResult(res);
    onUploaded?.(res);
    if (opts?.runScrapeToo !== false && enableScrape) {
      void runScrape(finalFile, { evidenceId: res.evidence.id, blobRef: res.evidence.blobRef });
    }
    return res;
  };

  const processFiles = async (
    files: File[],
    opts?: { skipScan?: boolean; intentOverride?: UploadIntentId },
  ) => {
    if (!files.length) return;
    setBusy(true);
    setErr(null);
    setSaveNotice(null);
    const thumbs: PendingThumb[] = files.map((file) => ({
      id: newId('pend'),
      file,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      status: 'queued' as const,
    }));
    setPending(thumbs);

    try {
      let lastResult: IngestUploadResult | null = null;
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
          lastResult = await ingestOne(t.file, {
            skipScan: opts?.skipScan,
            captionOverride: cap,
            runScrapeToo: i === thumbs.length - 1,
            intentOverride: opts?.intentOverride,
          });
          setPending((prev) => prev.map((p) => (p.id === t.id ? { ...p, status: 'done' } : p)));
        } catch (e: unknown) {
          const msg = (e as Error)?.message || 'Upload failed';
          setPending((prev) => prev.map((p) => (p.id === t.id ? { ...p, status: 'error', error: msg } : p)));
          setErr(msg);
        }
      }
      if (lastResult) {
        setSaveNotice(
          lastResult.filedMessage.replace(/\*\*/g, '') ||
            `Saved to vault — ${lastResult.profile.label}.`,
        );
        window.dispatchEvent(new CustomEvent('finely:store', { detail: { key: 'evidence' } }));
      }
      setStaged((prev) => {
        revokePending(prev);
        return [];
      });
    } finally {
      setBusy(false);
    }
  };

  const queueFiles = (files: File[]) => {
    if (!files.length) return;
    setErr(null);
    setResult(null);
    setSaveNotice(null);
    applyIntentGuessFromFile(files[0]!);
    const thumbs: PendingThumb[] = files.map((file) => ({
      id: newId('pend'),
      file,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      status: 'queued' as const,
    }));
    setStaged((prev) => [...prev, ...thumbs]);
  };

  const confirmSaveToVault = () => {
    if (!staged.length || busy) return;
    const guessed = intent ?? guessUploadIntentFromFile(caption, staged[0]!.file.name) ?? undefined;
    if (!guessed) {
      setErr('Pick a document type above so we file this in the right vault section — then tap Save to vault.');
      return;
    }
    if (!intent) {
      const chip = allPresets.find((p) => p.id === guessed);
      setIntent(guessed);
      if (chip && !caption.trim()) setCaption(chip.caption);
    }
    const files = staged.map((s) => s.file);
    void processFiles(files, { intentOverride: guessed });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const list = Array.from(e.dataTransfer.files || []);
    if (list.length) queueFiles(list);
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

  return (
    <div
      className={`fc-capture-panel ${compact ? 'fc-capture-panel--compact' : ''} space-y-3`}
      id="unified-evidence-capture"
      data-fc-evidence-capture="1"
      data-fc-evidence-capture-surface={surface}
      data-accent="emerald"
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
          queueFiles(files);
          setCaption('');
        }}
      />

      <div className="relative space-y-3">
        {!compact ? (
          <div className="border-b border-white/[0.08] pb-3 space-y-1.5">
            <div className="inline-flex items-center gap-2">
              <Camera size={16} className="text-emerald-500" />
              <span className="fc-capture-eyebrow">{captureEyebrow}</span>
            </div>
            <h2 className="fc-capture-title">{captureTitle}</h2>
            <p className="fc-capture-body max-w-3xl text-sm">{captureDescription}</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="fc-capture-eyebrow">
              {uploadContext === 'debt' ? 'Debt & docket upload' : 'Evidence capture'}
            </span>
            <span className="fc-capture-sublabel normal-case tracking-normal">
              {uploadContext === 'debt'
                ? 'Summons, docket, collector mail — stays in Debt Center'
                : 'Vault + scrape · one unit'}
            </span>
          </div>
        )}

        {/* Document type — chips / tiles only (never dropdown) */}
        <div className="space-y-2">
          <p className="fc-capture-sublabel">
            Document type{preset ? `: ${preset.label}` : ''}
          </p>
          {compact ? (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-0.5">
              {allPresets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPreset(p)}
                  className="fc-capture-chip"
                  data-active={intent === p.id ? '1' : '0'}
                >
                  {p.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group: DocumentTypeGroup) => (
                <div key={group.id} className="fc-capture-group">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <p className="fc-capture-sublabel">{group.label}</p>
                    {group.hint ? (
                      <p className="fc-capture-body opacity-75 max-w-md">{group.hint}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.presets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => pickPreset(p)}
                        className="fc-capture-chip min-w-[7rem] text-left"
                        data-active={intent === p.id ? '1' : '0'}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {intent && (intent === 'id_document' || intent === 'ssn_card') ? (
            <p className="fc-capture-body">
              Camera opens in <strong className="text-emerald-600">ID scan mode</strong>.
            </p>
          ) : null}
        </div>

        <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
          <label className="block fc-capture-sublabel">Notes (optional)</label>
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
              onClick={() => fileRef.current?.click()}
              onDragEnter={(e) => e.preventDefault()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`fc-capture-dropzone px-4 ${compact ? 'py-5' : 'py-8'}`}
              data-drag={dragOver ? '1' : '0'}
            >
              <div className="fc-capture-dropzone-label inline-flex items-center justify-center gap-2">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
                {busy ? 'Uploading…' : staged.length ? `${staged.length} file(s) ready — confirm type & save` : 'Drag & drop files — or use buttons below'}
              </div>
              <p className="mt-2 text-xs fc-capture-body">
                {uploadContext === 'debt'
                  ? 'Pick Docket / ROA or Summons above, then drop your PDF — we file to this case and scrape fields here.'
                  : 'Multi-file · PDF · images · video · HTML. Camera scan for phone-quality capture.'}
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
                  if (list.length) queueFiles(list);
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
                  if (list.length) queueFiles(list);
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
                className="fc-capture-action-btn disabled:opacity-60"
              >
                <Camera size={14} /> Camera
              </button>
            </div>

            <label className="inline-flex items-center gap-2 fc-capture-sublabel normal-case">
              <input
                type="checkbox"
                checked={scanMode}
                onChange={(e) => setScanMode(e.target.checked)}
                className="accent-emerald-500"
              />
              Scan-style enhance (photos of letters)
            </label>

            {(staged.length > 0 || pending.length > 0) ? (
              <div className="space-y-2">
                <p className="fc-capture-sublabel">
                  {staged.length ? 'Ready to save' : 'Saving…'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(staged.length ? staged : pending).map((p) => (
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
                                ? 'bg-violet-600/80'
                                : 'bg-black/70'
                        }`}
                      >
                        {p.status}
                      </div>
                      {p.status === 'queued' && staged.length > 0 ? (
                        <button
                          type="button"
                          className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5 text-white/80"
                          onClick={() => {
                            setStaged((prev) => {
                              const next = prev.filter((x) => x.id !== p.id);
                              if (p.url) URL.revokeObjectURL(p.url);
                              return next;
                            });
                          }}
                          aria-label="Remove from queue"
                        >
                          <X size={10} />
                        </button>
                      ) : null}
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
                {staged.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy || staged.length === 0}
                      onClick={confirmSaveToVault}
                      className="fc-capture-action-btn disabled:opacity-50"
                    >
                      {busy ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} /> Save to vault ({staged.length})
                        </>
                      )}
                    </button>
                    {!intent ? (
                      <span className="fc-capture-body text-rose-600">
                        Select document type first.
                      </span>
                    ) : null}
                  </div>
                ) : null}
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
        {saveNotice ? <p className={FINELY_OS_NOTICE_SUCCESS}>{saveNotice}</p> : null}
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
                  <span className="font-semibold fc-capture-title text-base">{result.profile.label}</span>
                  {result.confidence != null ? (
                    <span className="fc-capture-sublabel normal-case">{Math.round(result.confidence * 100)}% match</span>
                  ) : null}
                </div>
                <p className="mt-1 fc-capture-body text-sm">{result.profile.userExplanation}</p>
                <EvidenceExtractedFields entities={result.entities} summary={result.summary} compact={compact} />
                <p className="mt-2 text-xs fc-capture-body">
                  Filed to vault folder: <strong>{result.profile.folder.replace(/_/g, ' ')}</strong>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="fc-capture-action-btn" onClick={() => navigate(vaultOpenPath)}>
                {vaultOpenLabel} <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
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
              {stayInDebtWorkflow ? (
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => navigate(`/portal/debt/${activeDebtCaseId}`)}
                >
                  Continue on this case <ArrowRight size={14} />
                </button>
              ) : (
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(result.profile.primaryRoute)}>
                  {result.profile.primaryRouteLabel} <ArrowRight size={14} />
                </button>
              )}
              {!stayInDebtWorkflow
                ? result.routing.actions.slice(0, 3).map((a) => (
                    <button key={a.id} type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(a.path)}>
                      {a.label}
                    </button>
                  ))
                : null}
            </div>
            <p className={FINELY_OS_NOTICE_SUCCESS}>{result.routing.summary}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
