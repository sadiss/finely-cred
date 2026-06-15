import React, { useMemo, useState } from 'react';
import { ArrowRight, Camera, FileText, Gavel, IdCard, Mail, Scale, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import { EvidenceUploader } from './EvidenceUploader';
import type { EvidenceItem } from '../../domain/evidence';
import { upsertEvidence } from '../../data/evidenceRepo';
import { addAuditEvent } from '../../data/auditRepo';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { processUploadedDocument } from '../../docIntel/processUploadedDocument';
import { routeProcessedDocument } from '../../docIntel/routeProcessedDocument';
import type { DocumentRouteResult } from '../../docIntel/routeProcessedDocument';
import type { DocScanProfile } from '../../utils/imageScan';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

const DOC_TYPES = [
  { id: 'bureau', label: 'Bureau response', caption: 'Bureau investigation results / dispute response', icon: Mail },
  { id: 'id', label: 'ID / SSN', caption: 'Driver license, passport, Social Security card', icon: IdCard },
  { id: 'address', label: 'Proof of address', caption: 'Utility bill, lease, bank statement', icon: FileText },
  { id: 'collection', label: 'Collector / summons', caption: 'Collection letter, validation notice, court summons', icon: Scale },
  { id: 'dispute', label: 'Dispute proof', caption: 'Payment proof, screenshots, creditor mail', icon: Gavel },
  { id: 'identity', label: 'Identity theft', caption: 'FTC report, fraud affidavits, police report', icon: ShieldAlert },
] as const;

type Props = {
  partner: Partner;
  email?: string;
  compact?: boolean;
  onUploaded?: () => void;
};

export function ProofDocumentsHub({ partner, email, compact, onUploaded }: Props) {
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [routeResult, setRouteResult] = useState<DocumentRouteResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const scannerProfile: DocScanProfile = useMemo(() => {
    const c = caption.toLowerCase();
    if (c.includes('social security') || c.includes('ssn')) return 'ssn_card';
    if (c.includes('driver') || c.includes('license') || c.includes('passport') || c.includes('id')) return 'id_card';
    if (c.includes('utility') || c.includes('lease') || c.includes('address')) return 'bureau_mail';
    if (c.includes('bureau') || c.includes('investigation')) return 'bureau_mail';
    if (c.includes('collection') || c.includes('summons') || c.includes('collector')) return 'creditor_letter';
    return 'general';
  }, [caption]);

  const handleCreated = async (item: EvidenceItem, file?: File) => {
    upsertEvidence(item);
    addAuditEvent({
      partnerId: partner.id,
      actorType: 'partner',
      actorEmail: email,
      action: 'evidence.uploaded',
      entityType: 'evidence',
      entityId: item.id,
      meta: { filename: item.filename, mimeType: item.mimeType, caption: item.caption },
    });

    let routing: DocumentRouteResult;
    if (file && isFeatureEnabled('docIntel')) {
      try {
        setNotice('Analyzing document and routing…');
        const res = await processUploadedDocument({
          partnerId: partner.id,
          evidenceId: item.id,
          blobRef: item.blobRef,
          file,
          caption: item.caption,
        });
        routing = res.routing;
        setNotice(`Analyzed: ${res.docType.replace(/_/g, ' ')}`);
      } catch (e) {
        routing = routeProcessedDocument({
          partnerId: partner.id,
          docType: 'unknown',
          evidenceId: item.id,
          caption: item.caption,
          filename: file.name,
        });
        setNotice(`Saved. Used caption-based routing (${(e as Error)?.message || 'AI unavailable'}).`);
      }
    } else {
      routing = routeProcessedDocument({
        partnerId: partner.id,
        docType: 'unknown',
        evidenceId: item.id,
        caption: item.caption,
        filename: file?.name,
      });
      setNotice(`Saved to vault. ${routing.summary}`);
    }

    setRouteResult(routing);
    onUploaded?.();
  };

  return (
    <div className={`${finelyOsGlassShell('panel', 'emerald')} overflow-hidden`} id="proof-documents-hub">
      <div className="border-b border-white/[0.08] pb-5 mb-0">
        <div className="inline-flex items-center gap-2 text-emerald-300">
          <Camera size={18} />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Proof & documents</span>
        </div>
        <h2 className={`mt-2 ${FINELY_OS_ENTITY_TITLE}`}>Upload proof — camera scans to clean white paper</h2>
        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} max-w-3xl`}>
          Snap ID, SSN card, bureau mail, or collector letters. We flatten them onto a scanned-document look, classify the type, and route you to
          Disputes, Debt Center, or Identity — especially when you already have an open case.
        </p>
      </div>

      {!compact ? (
        <div className="py-4 border-b border-white/[0.08]">
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} mb-3`}>What are you uploading?</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {DOC_TYPES.map((d) => {
              const Icon = d.icon;
              const active = caption === d.caption;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setCaption(d.caption)}
                  className={`text-left p-3 ${finelyOsListItem(active, 'amber')}`}
                >
                  <div className="flex items-center gap-2 text-amber-300">
                    <Icon size={16} />
                    <span className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{d.label}</span>
                  </div>
                  <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{d.caption}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="py-4">
        <EvidenceUploader
          partnerId={partner.id}
          onCreated={handleCreated}
          initialCaption={caption}
          prominent
          scannerProfile={scannerProfile}
        />
      </div>

      {routeResult && routeResult.actions.length > 0 ? (
        <div className="pb-4 space-y-3">
          <div className={FINELY_OS_NOTICE_SUCCESS}>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Routed automatically</p>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{routeResult.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {routeResult.actions.map((a) => (
                <button key={a.id} type="button" onClick={() => navigate(a.path)} className={FINELY_OS_SECONDARY_BTN}>
                  {a.label} <ArrowRight size={12} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {notice ? <p className={`pb-4 ${FINELY_OS_ENTITY_BODY}`}>{notice}</p> : null}

      <div className="flex flex-wrap gap-3 border-t border-emerald-100/70 pt-4">
        <button type="button" onClick={() => navigate('/portal/documents')} className={FINELY_OS_SECONDARY_BTN}>
          Full documents vault <ArrowRight size={12} />
        </button>
        <button type="button" onClick={() => navigate('/portal/debt')} className={FINELY_OS_PRIMARY_BTN}>
          Debt center <ArrowRight size={12} />
        </button>
        <button type="button" onClick={() => navigate('/portal/disputes')} className={FINELY_OS_SECONDARY_BTN}>
          Dispute center <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
