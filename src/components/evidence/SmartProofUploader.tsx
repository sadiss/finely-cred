import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  FileText,
  Gavel,
  Landmark,
  Loader2,
  Mail,
  Scale,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import type { EvidenceItem } from '../../domain/evidence';
import { EvidenceUploader } from './EvidenceUploader';
import { EvidenceExtractedFields } from './EvidenceExtractedFields';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import { ingestUploadedEvidence, type IngestUploadResult } from '../../lib/ingestUploadedEvidence';
import {
  allPresetsFromGroups,
  documentTypeGroupsForContext,
  type DocumentTypeGroup,
  type UploadIntentId,
  type UploadPresetChip,
} from '../../lib/evidenceDocumentTaxonomy';
import type { DocScanProfile } from '../../utils/imageScan';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowField,
  finelyOsGlowPanel,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

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

type Props = {
  partner: Partner;
  email?: string;
  compact?: boolean;
  disputeCaseId?: string;
  debtCaseId?: string;
  bankruptcyCaseId?: string;
  onUploaded?: (result: IngestUploadResult) => void;
  uploadContext?: 'general' | 'bureau' | 'debt' | 'foreclosure' | 'repossession' | 'bankruptcy';
};

export function SmartProofUploader({
  partner,
  email,
  compact,
  disputeCaseId,
  debtCaseId,
  bankruptcyCaseId,
  onUploaded,
  uploadContext = 'general',
}: Props) {
  const navigate = useNavigate();
  const [intent, setIntent] = useState<UploadIntentId | null>(null);
  const [scannerOverride, setScannerOverride] = useState<DocScanProfile | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IngestUploadResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const groups = useMemo(() => documentTypeGroupsForContext(uploadContext), [uploadContext]);
  const allPresets = useMemo(() => allPresetsFromGroups(groups), [groups]);
  const preset = allPresets.find((p) => p.id === intent);
  const effectiveCaption = caption.trim() || preset?.caption || 'Uploaded document';

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

  const handleCreated = async (item: EvidenceItem, file?: File) => {
    setBusy(true);
    setErr(null);
    try {
      const enriched = { ...item, caption: effectiveCaption };
      const res = await ingestUploadedEvidence({
        partnerId: partner.id,
        item: enriched,
        file,
        email,
        intent: intent ?? undefined,
        disputeCaseId,
        debtCaseId,
        bankruptcyCaseId,
      });
      setResult(res);
      onUploaded?.(res);
    } catch (e) {
      setErr((e as Error)?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const Icon = result ? iconFor(result.profile.icon) : Sparkles;

  const presetChipClass = (active: boolean) =>
    `px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition whitespace-nowrap ${
      active
        ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
        : 'border-white/10 bg-black/30 text-white/70 hover:border-emerald-500/30'
    }`;

  return (
    <div
      className={
        compact
          ? 'rounded-xl border border-white/10 bg-black/20 !p-2 space-y-2'
          : finelyOsGlassShell('panel', 'emerald')
      }
      id="smart-proof-uploader"
    >
      {!compact ? (
        <div className="border-b border-white/[0.08] pb-4 mb-4 space-y-2">
          <div className="inline-flex items-center gap-2 text-emerald-300">
            <Camera size={18} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Smart proof uploader</span>
          </div>
          <h2 className={FINELY_OS_ENTITY_TITLE}>Upload — pick document type, then scan or attach</h2>
          <p className={`${FINELY_OS_ENTITY_BODY} max-w-2xl text-sm`}>
            Every file is a document type (ID, proof of address, bureau mail, court filing, etc.). We classify it,
            extract what we can, and file it to the right vault folder — same flow here and on every workstation.
          </p>
        </div>
      ) : null}

      {compact ? (
        <details className="rounded-lg border border-white/[0.08] bg-black/25 !p-2">
          <summary className="cursor-pointer select-none text-xs font-semibold text-white/85">
            Document type{preset ? `: ${preset.label}` : ' — pick one'}
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-0.5">
            {allPresets.map((p) => (
              <button key={p.id} type="button" onClick={() => pickPreset(p)} className={presetChipClass(intent === p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          {intent && (intent === 'id_document' || intent === 'ssn_card') ? (
            <p className={`mt-2 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
              Camera opens in <strong className="text-emerald-200">ID scan mode</strong>.
            </p>
          ) : null}
        </details>
      ) : (
        <div className="mb-4 space-y-4">
          {groups.map((group: DocumentTypeGroup) => (
            <div key={group.id} className="rounded-xl border border-white/[0.08] bg-black/25 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <p className={`${FINELY_OS_ENTITY_SUBLABEL}`}>{group.label}</p>
                {group.hint ? <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY} opacity-75 max-w-md`}>{group.hint}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickPreset(p)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition min-w-[7rem] ${
                      intent === p.id
                        ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                        : 'border-white/10 bg-black/30 text-white/70 hover:border-emerald-500/30'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {intent && (intent === 'id_document' || intent === 'ssn_card') ? (
            <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
              Camera opens in <strong className="text-emerald-200">ID scan mode</strong> — auto-crops edges and enhances readability.
            </p>
          ) : null}
        </div>
      )}

      <div className={compact ? 'space-y-1' : 'mb-3'}>
        <label className={`block ${FINELY_OS_ENTITY_SUBLABEL} ${compact ? 'text-[10px] mb-0.5' : 'mb-1'}`}>
          Notes (optional)
        </label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={preset?.caption || 'e.g. Equifax Round 1 investigation results received today'}
          className={`${finelyOsGlowField('emerald')} w-full ${compact ? 'max-w-full text-xs' : 'max-w-xl text-sm'}`}
        />
      </div>

      <EvidenceUploader
        partnerId={partner.id}
        initialCaption={effectiveCaption}
        scannerProfile={scannerProfile}
        onCreated={handleCreated}
        compact={compact}
      />

      {busy ? (
        <div className={`flex items-center gap-2 text-emerald-200 ${compact ? 'text-xs' : 'mt-4 text-sm'}`}>
          <Loader2 size={16} className="animate-spin" /> Identifying document and filing…
        </div>
      ) : null}

      {err ? <p className={`${compact ? 'text-xs' : 'mt-3 text-sm'} text-red-300`}>{err}</p> : null}

      {result ? (
        <div className={`${compact ? 'mt-2' : 'mt-4'} ${finelyOsGlowPanel('emerald')} ${compact ? '!p-3 space-y-2' : 'p-4 space-y-3'}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
              <Icon size={20} className="text-emerald-300" />
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
              <EvidenceExtractedFields
                entities={result.entities}
                summary={result.summary}
                compact={compact}
              />
              <p className={`mt-2 text-xs text-emerald-200/90`}>
                Filed to vault folder: <strong>{result.profile.folder.replace(/_/g, ' ')}</strong>
                {disputeCaseId && result.docType === 'bureau_response' ? ' • linked to this dispute round' : ''}
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
  );
}
