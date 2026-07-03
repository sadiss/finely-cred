import React from 'react';
import { AlertTriangle, CheckCircle2, Sun, SunDim, Zap } from 'lucide-react';
import type { CropMargins, DocScanProfile } from '../../utils/imageScan';
import { documentAspectForProfile } from '../../utils/imageScan';
import type { CaptureReadiness } from '../../lib/captureReadiness';

type Props = {
  profile: DocScanProfile;
  guideCrop: CropMargins;
  detectedCrop?: CropMargins | null;
  confidence: number;
  cameraReady: boolean;
  liveGuessLabel?: string;
  liveGuessConfidence?: number;
  readiness?: CaptureReadiness | null;
  autoCaptureEnabled?: boolean;
  autoCapturing?: boolean;
  profileMismatch?: boolean;
  mismatchLabel?: string;
};

const PROFILE_LABELS: Record<DocScanProfile, string> = {
  id_card: 'Driver license / ID',
  ssn_card: 'Social Security card',
  bureau_mail: 'Bureau letter',
  creditor_letter: 'Collector letter',
  general: 'Document',
};

const ID_LIKE = (p: DocScanProfile) => p === 'id_card' || p === 'ssn_card';

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

function CornerBracket({ className, ready }: { className: string; ready: boolean }) {
  return (
    <span
      className={`absolute w-8 h-8 ${ready ? 'border-emerald-400' : 'border-violet-400/90'} ${className}`}
      style={{ borderWidth: 4 }}
    />
  );
}

function LightingIcon({ level }: { level: 'poor' | 'fair' | 'good' }) {
  if (level === 'good') return <Sun size={12} className="text-emerald-300" />;
  if (level === 'fair') return <SunDim size={12} className="text-sky-300" />;
  return <Sun size={12} className="text-rose-300" />;
}

export function DocumentScannerGuideFrame({
  profile,
  guideCrop,
  detectedCrop,
  confidence,
  cameraReady,
  liveGuessLabel,
  liveGuessConfidence,
  readiness,
  autoCaptureEnabled,
  autoCapturing,
  profileMismatch: profileMismatchWarn,
  mismatchLabel,
}: Props) {
  const idLike = ID_LIKE(profile);
  const locked = readiness ? readiness.score >= 55 && !profileMismatchWarn : confidence >= 0.55 && !profileMismatchWarn;
  const ready = readiness?.ready ?? false;
  const aspect = documentAspectForProfile(profile);
  const showDetected =
    detectedCrop &&
    confidence >= 0.28 &&
    !(detectedCrop.left < 0.02 && detectedCrop.top < 0.02 && detectedCrop.right < 0.02 && detectedCrop.bottom < 0.02);

  const statusLine = profileMismatchWarn
    ? mismatchLabel || 'Wrong document type — switch profile or realign'
    : autoCapturing
      ? 'Capturing…'
      : readiness?.userMessage
        ? readiness.userMessage
        : locked
          ? 'Document detected — improving quality…'
          : cameraReady
            ? idLike
              ? 'Place ID flat in frame — good lighting required'
              : 'Align document inside frame'
            : 'Starting camera…';

  const frameClass = ready
    ? 'border-[3px] border-emerald-400 shadow-[0_0_36px_rgba(52,211,153,0.55)]'
    : locked
      ? 'border-[3px] border-sky-400/90 shadow-[0_0_28px_rgba(56,189,248,0.35)]'
      : 'border-[3px] border-violet-400/85 shadow-[0_0_24px_rgba(139,92,246,0.35)]';

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-black/62" style={{ clipPath: dimClipPath(guideCrop) }} />

      <div className={`absolute rounded-xl transition-all duration-300 ${frameClass}`} style={cropStyle(guideCrop)}>
        <CornerBracket ready={ready} className="top-0 left-0 border-r-0 border-b-0 rounded-tl-xl" />
        <CornerBracket ready={ready} className="top-0 right-0 border-l-0 border-b-0 rounded-tr-xl" />
        <CornerBracket ready={ready} className="bottom-0 left-0 border-r-0 border-t-0 rounded-bl-xl" />
        <CornerBracket ready={ready} className="bottom-0 right-0 border-l-0 border-t-0 rounded-br-xl" />

        {(autoCaptureEnabled && readiness && readiness.stabilityPct > 0) || ready ? (
          <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-black/50 rounded-full overflow-hidden mx-3">
            <div
              className={`h-full transition-all duration-300 ${ready ? 'bg-emerald-400' : 'bg-sky-400'}`}
              style={{ width: `${ready ? 100 : readiness?.stabilityPct ?? 0}%` }}
            />
          </div>
        ) : null}

        <div
          className={`absolute -top-10 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-wide px-2 ${
            ready ? 'text-emerald-300' : profileMismatchWarn ? 'text-rose-300' : 'text-violet-100'
          }`}
        >
          {statusLine}
        </div>

        {readiness?.subMessage ? (
          <div className="absolute -top-[4.25rem] left-0 right-0 text-center text-[9px] text-white/75 px-3 line-clamp-2">
            {readiness.subMessage}
          </div>
        ) : null}

        <div className="absolute -bottom-9 left-0 right-0 flex flex-col items-center gap-1 text-[9px] text-white/85">
          <div className="font-mono">
            {liveGuessLabel && (liveGuessConfidence ?? 0) >= 0.42
              ? `Detected: ${liveGuessLabel}`
              : PROFILE_LABELS[profile]}
            {aspect ? ` · ${aspect.toFixed(2)}:1` : ''}
          </div>
        </div>
      </div>

      {showDetected && detectedCrop ? (
        <div
          className="absolute border-2 border-dashed border-sky-400/70 rounded-lg transition-all duration-150"
          style={cropStyle(detectedCrop)}
        />
      ) : null}

      {/* Quality HUD */}
      {readiness && cameraReady ? (
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 max-w-[11rem]">
          <div className="rounded-lg border border-white/15 bg-black/65 backdrop-blur-sm px-2.5 py-1.5 text-[9px] text-white/90 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="uppercase tracking-widest text-white/50">Quality</span>
              <span className={`font-black ${ready ? 'text-emerald-300' : readiness.score >= 50 ? 'text-sky-200' : 'text-white/70'}`}>
                {readiness.score}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full transition-all ${ready ? 'bg-emerald-400' : 'bg-violet-400'}`}
                style={{ width: `${readiness.score}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1" title="Lighting">
                <LightingIcon level={readiness.lighting} />
                Light
              </span>
              {ready ? (
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <CheckCircle2 size={11} /> Ready
                </span>
              ) : readiness.issues.includes('blurry') ? (
                <span className="inline-flex items-center gap-1 text-rose-200">
                  <AlertTriangle size={11} /> Blur
                </span>
              ) : idLike && readiness.issues.includes('not_recognized') ? (
                <span className="inline-flex items-center gap-1 text-violet-200">
                  <Zap size={11} /> ID scan
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="absolute inset-0 flex items-center justify-center opacity-25">
        <div className="w-6 h-px bg-white/80" />
        <div className="absolute w-px h-6 bg-white/80" />
      </div>
    </div>
  );
}
