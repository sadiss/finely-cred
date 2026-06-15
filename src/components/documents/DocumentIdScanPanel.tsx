import React, { useRef, useState } from 'react';
import { Camera, FileUp, IdCard, MapPin, Shield } from 'lucide-react';
import type { EvidenceItem } from '../../domain/evidence';
import { upsertEvidence } from '../../data/evidenceRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { newId } from '../../utils/ids';
import type { DocScanProfile } from '../../utils/imageScan';
import { CameraCaptureModal } from '../evidence/CameraCaptureModal';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

const blobStore = getBlobStore();

type DocKind = 'government_id' | 'proof_of_address';

const KIND_META: Record<
  DocKind,
  { label: string; icon: typeof IdCard; hint: string; profile: DocScanProfile; sectionKey: string }
> = {
  government_id: {
    label: 'Government ID',
    icon: IdCard,
    hint: 'Driver license, state ID, or passport — redact full SSN if visible. Align inside the on-screen frame.',
    profile: 'id_card',
    sectionKey: 'identity',
  },
  proof_of_address: {
    label: 'Proof of address',
    icon: MapPin,
    hint: 'Utility bill, lease, or bank statement dated within 60 days.',
    profile: 'bureau_mail',
    sectionKey: 'address',
  },
};

export function DocumentIdScanPanel({
  partnerId,
  onUploaded,
}: {
  partnerId: string;
  onUploaded?: (item: EvidenceItem) => void;
}) {
  const [kind, setKind] = useState<DocKind>('government_id');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = KIND_META[kind];

  const saveFile = async (file: File) => {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      const { ref } = await blobStore.put(file, {
        partnerId,
        caption: meta.label,
        scanMode: true,
        kind: 'evidence',
      });
      const item: EvidenceItem = {
        id: newId('evidence'),
        partnerId,
        type: 'upload',
        source: 'upload',
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        blobRef: ref,
        caption: meta.label,
        tags: [kind, 'identity_vault', 'onboarding'],
        sectionKey: meta.sectionKey,
        createdAt: new Date().toISOString(),
      };
      const saved = upsertEvidence(item);
      setNotice(`${meta.label} saved to vault — cropped and enhanced from scanner.`);
      onUploaded?.(saved);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${finelyOsGlassShell('panel', 'emerald')} p-5 space-y-4`} data-fc-id-scan>
      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        caption={meta.label}
        defaultProfile={meta.profile}
        title={kind === 'government_id' ? 'ID card scanner' : 'Address proof scanner'}
        subtitle="Place your document inside the glowing frame. Only that area is captured — not your desk or background."
        onSaveFiles={async ({ files }) => {
          for (const f of files) await saveFile(f);
          setCameraOpen(false);
        }}
      />

      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
        <Shield size={14} className="text-emerald-300" /> Identity vault
      </div>
      <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
        Use the <strong className="text-emerald-200">live camera scanner</strong> with the on-screen ID frame — required before dispute mail tasks.
      </p>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(KIND_META) as DocKind[]).map((k) => {
          const m = KIND_META[k];
          const Icon = m.icon;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={kind === k ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            >
              <Icon size={14} className="inline mr-1" /> {m.label}
            </button>
          );
        })}
      </div>

      <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY} opacity-80`}>{meta.hint}</p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void saveFile(f);
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => setCameraOpen(true)} className={FINELY_OS_PRIMARY_BTN}>
          <Camera size={14} className="inline mr-1" /> {busy ? 'Saving…' : 'Open camera scanner'}
        </button>
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className={FINELY_OS_SECONDARY_BTN}>
          <FileUp size={14} className="inline mr-1" /> Upload file instead
        </button>
      </div>

      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      {error ? <div className={FINELY_OS_NOTICE_ERROR}>{error}</div> : null}
    </div>
  );
}
