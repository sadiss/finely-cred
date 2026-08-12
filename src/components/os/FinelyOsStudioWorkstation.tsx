import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImageIcon, ShieldAlert, Upload, X, ZoomIn } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import type { EvidenceItem } from '../../domain/evidence';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import { SmartProofUploader } from '../evidence/SmartProofUploader';
import { LetterEscalationPanel } from '../letters/LetterEscalationPanel';
import type { EscalationTrack } from '../../lib/letterEscalationPaths';
import { bureauShortCode } from '../../utils/bureaus';
import type { Bureau } from '../../domain/creditReports';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsWorkstationModal } from '../../features/os/FinelyOsWorkstationModal';

export type StudioWorkstationModal = null | 'screenshots' | 'uploads' | 'escalation';

export type DisputeScreenshotGalleryItem = {
  key: string;
  ev: EvidenceItem;
  negativeLabel: string;
  bureau?: Bureau | string;
};

function ScreenshotThumb({
  item,
  onOpen,
}: {
  item: DisputeScreenshotGalleryItem;
  onOpen: (url: string, item: DisputeScreenshotGalleryItem) => void;
}) {
  const ev = item.ev;
  const [url, setUrl] = useState('');
  useEffect(() => {
    let alive = true;
    if (!ev.blobRef) return undefined;
    void getBlobUrl(ev.blobRef, { mimeType: ev.mimeType, preferSigned: true }).then((res) => {
      if (!alive) {
        res?.revoke?.();
        return;
      }
      if (res?.url) setUrl(res.url);
    });
    return () => {
      alive = false;
    };
  }, [ev.blobRef, ev.mimeType]);

  const isImage = String(ev.mimeType || '').toLowerCase().startsWith('image/');
  const bureauLabel = item.bureau ? bureauShortCode(item.bureau as Bureau) : '';

  return (
    <button
      type="button"
      onClick={() => {
        if (url) onOpen(url, item);
        else if (ev.blobRef) void openBlobRefInNewTab({ blobRef: ev.blobRef, mimeType: ev.mimeType, preferSigned: true });
      }}
      className="group rounded-2xl border-2 border-fuchsia-400/25 bg-black/40 overflow-hidden text-left hover:border-fuchsia-300/55 hover:shadow-[0_0_28px_-8px_rgba(217,70,239,0.55)] transition-all"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-900 to-black flex items-center justify-center overflow-hidden relative min-h-[140px]">
        {url && isImage ? (
          <img src={url} alt="" className="h-full w-full object-contain bg-black" />
        ) : (
          <ImageIcon className="text-white/25" size={36} />
        )}
        <span className="absolute bottom-2 right-2 rounded-lg bg-black/75 p-2 text-fuchsia-100 opacity-90">
          <ZoomIn size={16} />
        </span>
      </div>
      <div className="p-3 border-t border-white/10 bg-black/50">
        <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-200/90">
          {bureauLabel ? `${bureauLabel} · Negative` : 'Vault screenshot'}
        </div>
        <div className="text-sm font-bold text-white mt-1 line-clamp-2 leading-snug">{item.negativeLabel}</div>
        <div className="text-[10px] text-white/45 mt-1 truncate">{ev.filename || ev.caption || 'Screenshot'}</div>
      </div>
    </button>
  );
}

const LAUNCHER_META: Record<
  'screenshots' | 'uploads' | 'escalation',
  { kicker: string; title: string; hint: string; accent: 'fuchsia' | 'sky' | 'amber'; icon: React.ReactNode }
> = {
  screenshots: {
    kicker: 'Step 1 · Proof',
    title: 'View screenshots',
    hint: 'See each negative’s bureau image — tap to enlarge',
    accent: 'fuchsia',
    icon: <ImageIcon size={22} />,
  },
  uploads: {
    kicker: 'Step 2 · Capture',
    title: 'Upload evidence',
    hint: 'Full uploader — attach files to your vault',
    accent: 'sky',
    icon: <Upload size={22} />,
  },
  escalation: {
    kicker: 'Step 3 · Escalate',
    title: 'Escalation ladder',
    hint: 'CFPB, AG, BBB & bureau follow-up steps',
    accent: 'amber',
    icon: <ShieldAlert size={22} />,
  },
};

export function FinelyOsEscalationHeroButton({
  label = 'Escalation ladder',
  hint = 'CFPB, AG, BBB & bureau follow-up steps',
  accent = 'amber',
  onClick,
}: {
  label?: string;
  hint?: string;
  accent?: 'fuchsia' | 'sky' | 'amber' | 'violet';
  onClick: () => void;
}) {
  const glow: Record<string, string> = {
    fuchsia: 'shadow-[0_0_48px_-8px_rgba(217,70,239,0.7)] ring-2 ring-fuchsia-400/45 border-fuchsia-400/55',
    sky: 'shadow-[0_0_48px_-8px_rgba(56,189,248,0.6)] ring-2 ring-sky-400/45 border-sky-400/55',
    amber: 'shadow-[0_0_48px_-8px_rgba(251,191,36,0.55)] ring-2 ring-amber-400/45 border-amber-400/55',
    violet: 'shadow-[0_0_48px_-8px_rgba(167,139,250,0.65)] ring-2 ring-violet-400/45 border-violet-400/55',
  };
  const fill: Record<string, string> = {
    fuchsia: 'bg-gradient-to-br from-fuchsia-600/40 via-violet-900/45 to-black',
    sky: 'bg-gradient-to-br from-sky-600/40 via-cyan-900/45 to-black',
    amber: 'bg-gradient-to-br from-amber-600/40 via-orange-900/45 to-black',
    violet: 'bg-gradient-to-br from-violet-600/40 via-indigo-900/45 to-black',
  };
  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <button
        type="button"
        onClick={onClick}
        className={`w-full max-w-md rounded-2xl border-2 px-6 py-8 text-center transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.99] ${glow[accent]} ${fill[accent]}`}
      >
        <div className="inline-flex rounded-xl bg-black/35 p-3 text-white mb-3">
          <ShieldAlert size={28} />
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">Step · Escalate</div>
        <div className="text-xl sm:text-2xl font-black text-white mt-1 leading-tight">{label}</div>
        <div className="text-sm text-white/75 mt-2 leading-snug">{hint}</div>
      </button>
    </div>
  );
}

export function FinelyOsStudioWorkstationMiniLaunchers({
  onScreenshots,
  onUploads,
}: {
  onScreenshots: () => void;
  onUploads: () => void;
}) {
  const items = [
    { id: 'screenshots' as const, onClick: onScreenshots },
    { id: 'uploads' as const, onClick: onUploads },
  ];

  const glow: Record<string, string> = {
    fuchsia: 'shadow-[0_0_32px_-10px_rgba(217,70,239,0.55)] ring-2 ring-fuchsia-400/35 border-fuchsia-400/45',
    sky: 'shadow-[0_0_32px_-10px_rgba(56,189,248,0.45)] ring-2 ring-sky-400/35 border-sky-400/45',
  };

  const fill: Record<string, string> = {
    fuchsia: 'bg-gradient-to-br from-fuchsia-600/30 via-violet-900/35 to-black',
    sky: 'bg-gradient-to-br from-sky-600/30 via-cyan-900/35 to-black',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mx-auto" data-fc-studio-mini-launchers="1">
      {items.map(({ id, onClick }) => {
        const meta = LAUNCHER_META[id];
        return (
          <button
            key={id}
            type="button"
            onClick={onClick}
            className={`w-full rounded-xl border-2 px-4 py-4 text-left transition-all hover:brightness-110 ${glow[meta.accent]} ${fill[meta.accent]}`}
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0 rounded-lg bg-black/35 p-2 text-white">{meta.icon}</span>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/65">{meta.kicker}</div>
                <div className="text-sm font-bold text-white mt-0.5">{meta.title}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function FinelyOsStudioWorkstationLauncherRow({
  onScreenshots,
  onUploads,
  onEscalation,
  escalationLabel = 'Escalation ladder',
}: {
  onScreenshots: () => void;
  onUploads: () => void;
  onEscalation: () => void;
  escalationLabel?: string;
}) {
  const items = [
    { id: 'screenshots' as const, onClick: onScreenshots },
    { id: 'uploads' as const, onClick: onUploads },
    { id: 'escalation' as const, onClick: onEscalation },
  ];

  const glow: Record<string, string> = {
    fuchsia: 'shadow-[0_0_40px_-10px_rgba(217,70,239,0.65)] ring-2 ring-fuchsia-400/40 border-fuchsia-400/50',
    sky: 'shadow-[0_0_40px_-10px_rgba(56,189,248,0.55)] ring-2 ring-sky-400/40 border-sky-400/50',
    amber: 'shadow-[0_0_40px_-10px_rgba(251,191,36,0.5)] ring-2 ring-amber-400/40 border-amber-400/50',
  };

  const fill: Record<string, string> = {
    fuchsia: 'bg-gradient-to-br from-fuchsia-600/35 via-violet-900/40 to-black',
    sky: 'bg-gradient-to-br from-sky-600/35 via-cyan-900/40 to-black',
    amber: 'bg-gradient-to-br from-amber-600/35 via-orange-900/40 to-black',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full" data-fc-studio-launchers="1">
      {items.map(({ id, onClick }) => {
        const meta = LAUNCHER_META[id];
        const title = id === 'escalation' ? escalationLabel : meta.title;
        return (
          <button
            key={id}
            type="button"
            onClick={onClick}
            className={`w-full rounded-2xl border-2 px-5 py-6 sm:py-7 text-left transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.99] min-h-[7.5rem] ${glow[meta.accent]} ${fill[meta.accent]}`}
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 rounded-xl bg-black/35 p-2.5 text-white">{meta.icon}</span>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">{meta.kicker}</div>
                <div className="text-lg sm:text-xl font-black text-white mt-1 leading-tight">{title}</div>
                <div className="text-xs sm:text-sm text-white/75 mt-2 leading-snug">{meta.hint}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function FinelyOsStudioWorkstationModals({
  partner,
  open,
  onClose,
  screenshotGallery = [],
  screenshotEvidence = [],
  escalationTrack,
  uploadContext = 'bureau',
  onUploaded,
}: {
  partner: Partner;
  open: StudioWorkstationModal;
  onClose: () => void;
  screenshotGallery?: DisputeScreenshotGalleryItem[];
  screenshotEvidence?: EvidenceItem[];
  escalationTrack: EscalationTrack;
  uploadContext?: 'bureau' | 'debt' | 'validation' | 'court';
  onUploaded?: () => void;
}) {
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  const galleryItems: DisputeScreenshotGalleryItem[] =
    screenshotGallery.length > 0
      ? screenshotGallery
      : screenshotEvidence.map((ev) => ({
          key: ev.id,
          ev,
          negativeLabel: ev.caption || ev.filename || 'Screenshot',
        }));

  useEffect(() => {
    if (!open) setLightbox(null);
  }, [open]);

  const escalationTitle =
    escalationTrack === 'debt_validation'
      ? 'Validation escalation ladder'
      : escalationTrack === 'debt_court'
        ? 'Court escalation ladder'
        : 'Bureau escalation ladder';

  return (
    <>
      <FinelyOsWorkstationModal
        open={open === 'escalation'}
        title={escalationTitle}
        subtitle="Regulatory complaints & next steps if they ignore you"
        accent="amber"
        size="large"
        onClose={onClose}
      >
        <LetterEscalationPanel track={escalationTrack} accent="amber" />
      </FinelyOsWorkstationModal>

      <FinelyOsWorkstationModal
        open={open === 'uploads'}
        title="Upload evidence"
        subtitle="Proof & uploads — full workstation"
        accent="sky"
        size="large"
        onClose={onClose}
      >
        <div className="min-h-[min(56vh,560px)]">
          <p className={`text-sm mb-4 ${FINELY_OS_ENTITY_BODY}`}>
            Upload bureau screenshots, collector letters, and ID docs. Everything lands in your Documents vault and can attach to dispute negatives.
          </p>
          <SmartProofUploader
            partner={partner}
            uploadContext={
              uploadContext === 'validation' || uploadContext === 'court' ? 'debt' : uploadContext
            }
            compact={false}
            enableScrape
            onUploaded={() => onUploaded?.()}
          />
        </div>
      </FinelyOsWorkstationModal>

      <FinelyOsWorkstationModal
        open={open === 'screenshots'}
        title="Screenshot gallery"
        subtitle="Each image matches a negative on your letter"
        accent="fuchsia"
        size="large"
        onClose={onClose}
      >
        {galleryItems.length === 0 ? (
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
            No screenshots linked yet. Attach proof on each negative above, or open <strong className="text-white">Upload evidence</strong> to add files.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryItems.map((item) => (
              <ScreenshotThumb
                key={item.key}
                item={item}
                onOpen={(url, row) =>
                  setLightbox({
                    url,
                    title: `${row.negativeLabel}${row.bureau ? ` · ${bureauShortCode(row.bureau as Bureau)}` : ''}`,
                  })
                }
              />
            ))}
          </div>
        )}
      </FinelyOsWorkstationModal>

      {lightbox
        ? createPortal(
            <div className="fixed inset-0 z-[9200] flex flex-col bg-black/95">
              <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
                <span className="text-sm font-semibold text-white truncate">{lightbox.title}</span>
                <button type="button" onClick={() => setLightbox(null)} className={`${FINELY_OS_SECONDARY_BTN} !py-2`}>
                  <X size={16} /> Close
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-auto">
                <img src={lightbox.url} alt={lightbox.title} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
