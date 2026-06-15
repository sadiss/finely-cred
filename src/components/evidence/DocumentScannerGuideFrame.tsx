import React from 'react';
import type { CropMargins, DocScanProfile } from '../../utils/imageScan';
import { documentAspectForProfile } from '../../utils/imageScan';

type Props = {
  profile: DocScanProfile;
  guideCrop: CropMargins;
  detectedCrop?: CropMargins | null;
  confidence: number;
  cameraReady: boolean;
};

const PROFILE_LABELS: Record<DocScanProfile, string> = {
  id_card: 'Driver license / ID',
  ssn_card: 'Social Security card',
  bureau_mail: 'Bureau letter',
  creditor_letter: 'Collector letter',
  general: 'Document',
};

function cropStyle(crop: CropMargins): React.CSSProperties {
  return {
    left: `${crop.left * 100}%`,
    top: `${crop.top * 100}%`,
    right: `${crop.right * 100}%`,
    bottom: `${crop.bottom * 100}%`,
  };
}

function dimClipPath(crop: CropMargins): string {
  const l = crop.left * 100;
  const t = crop.top * 100;
  const r = (1 - crop.right) * 100;
  const b = (1 - crop.bottom) * 100;
  return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${l}% ${t}%, ${l}% ${b}%, ${r}% ${b}%, ${r}% ${t}%, ${l}% ${t}%)`;
}

function CornerBracket({ className }: { className: string }) {
  return (
    <span
      className={`absolute w-8 h-8 border-emerald-400 ${className}`}
      style={{ borderWidth: 4 }}
    />
  );
}

export function DocumentScannerGuideFrame({ profile, guideCrop, detectedCrop, confidence, cameraReady }: Props) {
  const locked = confidence >= 0.42;
  const aspect = documentAspectForProfile(profile);
  const showDetected =
    detectedCrop &&
    confidence >= 0.28 &&
    !(detectedCrop.left < 0.02 && detectedCrop.top < 0.02 && detectedCrop.right < 0.02 && detectedCrop.bottom < 0.02);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {/* Dim outside guide frame — always visible */}
      <div className="absolute inset-0 bg-black/62" style={{ clipPath: dimClipPath(guideCrop) }} />

      {/* Guide frame — pulsing corner brackets + border */}
      <div
        className={`absolute rounded-xl transition-all duration-200 ${
          locked ? 'border-[3px] border-emerald-400 shadow-[0_0_32px_rgba(52,211,153,0.45)]' : 'border-[3px] border-amber-400/95 shadow-[0_0_24px_rgba(251,191,36,0.35)] animate-pulse'
        }`}
        style={cropStyle(guideCrop)}
      >
        <CornerBracket className="top-0 left-0 border-r-0 border-b-0 rounded-tl-xl" />
        <CornerBracket className="top-0 right-0 border-l-0 border-b-0 rounded-tr-xl" />
        <CornerBracket className="bottom-0 left-0 border-r-0 border-t-0 rounded-bl-xl" />
        <CornerBracket className="bottom-0 right-0 border-l-0 border-t-0 rounded-br-xl" />

        <div
          className={`absolute -top-8 left-0 right-0 text-center text-[10px] font-black uppercase tracking-widest ${
            locked ? 'text-emerald-300' : 'text-amber-200'
          }`}
        >
          {locked ? '✓ ID locked — tap capture' : cameraReady ? 'Align card inside frame' : 'Starting camera…'}
        </div>

        <div className="absolute -bottom-7 left-0 right-0 text-center text-[9px] text-white/75 font-mono">
          {PROFILE_LABELS[profile]}
          {aspect ? ` · ${aspect.toFixed(2)}:1` : ''}
        </div>
      </div>

      {/* Inner detected region when AI finds edges */}
      {showDetected && detectedCrop ? (
        <div
          className="absolute border-2 border-dashed border-sky-400/80 rounded-lg transition-all duration-150"
          style={cropStyle(detectedCrop)}
        />
      ) : null}

      {/* Center crosshair for alignment */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className="w-6 h-px bg-white/80" />
        <div className="absolute w-px h-6 bg-white/80" />
      </div>
    </div>
  );
}
