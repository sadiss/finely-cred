import type { CropMargins, DocScanProfile } from '../utils/imageScan';
import type { LiveDocumentGuess } from './liveDocumentClassifier';
import { isProfileMismatch } from './liveDocumentClassifier';

export type CaptureQualityIssue =
  | 'too_dark'
  | 'too_bright'
  | 'glare'
  | 'blurry'
  | 'no_document'
  | 'wrong_type'
  | 'not_recognized'
  | 'hold_steady'
  | 'align_document';

export type CaptureReadiness = {
  ready: boolean;
  score: number;
  issues: CaptureQualityIssue[];
  userMessage: string;
  subMessage?: string;
  lighting: 'poor' | 'fair' | 'good';
  sharpness: number;
  boundsConfidence: number;
  recognitionConfidence: number;
  profileMatch: boolean;
  stabilityPct: number;
};

export type CaptureProfileConfig = {
  label: string;
  autoCaptureDefault: boolean;
  /** Frames at ~400ms each before auto-capture */
  stabilityTicks: number;
  minBoundsConfidence: number;
  minRecognitionConfidence: number;
  requireProfileMatch: boolean;
  minSharpness: number;
  minMeanLuminance: number;
  maxMeanLuminance: number;
  maxGlareRatio: number;
  minOverallScore: number;
  tickIntervalMs: number;
  cooldownMs: number;
  /** Manual capture allowed when score >= this (even if auto not ready) */
  manualCaptureMinScore: number;
};

export const CAPTURE_PROFILE_CONFIG: Record<DocScanProfile, CaptureProfileConfig> = {
  id_card: {
    label: 'Government ID / license',
    autoCaptureDefault: true,
    stabilityTicks: 14,
    minBoundsConfidence: 0.72,
    minRecognitionConfidence: 0.58,
    requireProfileMatch: true,
    minSharpness: 85,
    minMeanLuminance: 72,
    maxMeanLuminance: 210,
    maxGlareRatio: 0.12,
    minOverallScore: 82,
    tickIntervalMs: 400,
    cooldownMs: 4000,
    manualCaptureMinScore: 68,
  },
  ssn_card: {
    label: 'Social Security card',
    autoCaptureDefault: true,
    stabilityTicks: 14,
    minBoundsConfidence: 0.7,
    minRecognitionConfidence: 0.52,
    requireProfileMatch: true,
    minSharpness: 80,
    minMeanLuminance: 75,
    maxMeanLuminance: 205,
    maxGlareRatio: 0.1,
    minOverallScore: 80,
    tickIntervalMs: 400,
    cooldownMs: 4000,
    manualCaptureMinScore: 65,
  },
  bureau_mail: {
    label: 'Bureau letter',
    autoCaptureDefault: true,
    stabilityTicks: 8,
    minBoundsConfidence: 0.52,
    minRecognitionConfidence: 0.42,
    requireProfileMatch: false,
    minSharpness: 45,
    minMeanLuminance: 55,
    maxMeanLuminance: 235,
    maxGlareRatio: 0.18,
    minOverallScore: 62,
    tickIntervalMs: 360,
    cooldownMs: 2800,
    manualCaptureMinScore: 48,
  },
  creditor_letter: {
    label: 'Collector / creditor letter',
    autoCaptureDefault: true,
    stabilityTicks: 8,
    minBoundsConfidence: 0.5,
    minRecognitionConfidence: 0.4,
    requireProfileMatch: false,
    minSharpness: 42,
    minMeanLuminance: 55,
    maxMeanLuminance: 235,
    maxGlareRatio: 0.18,
    minOverallScore: 60,
    tickIntervalMs: 360,
    cooldownMs: 2800,
    manualCaptureMinScore: 45,
  },
  general: {
    label: 'Document',
    autoCaptureDefault: false,
    stabilityTicks: 7,
    minBoundsConfidence: 0.48,
    minRecognitionConfidence: 0.35,
    requireProfileMatch: false,
    minSharpness: 35,
    minMeanLuminance: 45,
    maxMeanLuminance: 240,
    maxGlareRatio: 0.22,
    minOverallScore: 55,
    tickIntervalMs: 360,
    cooldownMs: 2500,
    manualCaptureMinScore: 40,
  },
};

type RegionStats = {
  meanLum: number;
  glareRatio: number;
  sharpness: number;
  paperRatio: number;
};

function lumAt(data: Uint8ClampedArray, w: number, x: number, y: number) {
  const i = (y * w + x) * 4;
  return 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
}

function analyzeCropRegion(canvas: HTMLCanvasElement, crop: CropMargins): RegionStats {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { meanLum: 128, glareRatio: 0, sharpness: 0, paperRatio: 0 };

  const w = canvas.width;
  const h = canvas.height;
  const x0 = Math.floor(crop.left * w);
  const y0 = Math.floor(crop.top * h);
  const x1 = Math.floor((1 - crop.right) * w);
  const y1 = Math.floor((1 - crop.bottom) * h);
  const rw = Math.max(1, x1 - x0);
  const rh = Math.max(1, y1 - y0);
  const img = ctx.getImageData(x0, y0, rw, rh);
  const d = img.data;

  let lumSum = 0;
  let glare = 0;
  let paper = 0;
  let samples = 0;
  let lapSum = 0;
  let lapSumSq = 0;
  let lapN = 0;
  const step = Math.max(1, Math.floor(Math.min(rw, rh) / 64));

  for (let y = 0; y < rh; y += step) {
    for (let x = 0; x < rw; x += step) {
      const i = (y * rw + x) * 4;
      const r = d[i]!;
      const g = d[i + 1]!;
      const b = d[i + 2]!;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lumSum += lum;
      if (lum > 248) glare++;
      if (lum > 215) paper++;
      samples++;

      if (x >= step && y >= step) {
        const c = lum;
        const l = lumAt(d, rw, x - step, y);
        const rL = lumAt(d, rw, x + step, y);
        const t = lumAt(d, rw, x, y - step);
        const bL = lumAt(d, rw, x, y + step);
        const lap = 4 * c - l - rL - t - bL;
        lapSum += lap;
        lapSumSq += lap * lap;
        lapN++;
      }
    }
  }

  const meanLum = samples ? lumSum / samples : 128;
  const glareRatio = samples ? glare / samples : 0;
  const paperRatio = samples ? paper / samples : 0;
  const sharpness =
    lapN > 0 ? Math.max(0, lapSumSq / lapN - (lapSum / lapN) * (lapSum / lapN)) : 0;

  return { meanLum, glareRatio, sharpness, paperRatio };
}

function lightingLabel(meanLum: number, glareRatio: number, cfg: CaptureProfileConfig): 'poor' | 'fair' | 'good' {
  if (meanLum < cfg.minMeanLuminance || meanLum > cfg.maxMeanLuminance || glareRatio > cfg.maxGlareRatio) return 'poor';
  if (meanLum < cfg.minMeanLuminance + 18 || glareRatio > cfg.maxGlareRatio * 0.65) return 'fair';
  return 'good';
}

function issueMessage(issue: CaptureQualityIssue, profile: DocScanProfile): string {
  switch (issue) {
    case 'too_dark':
      return profile === 'id_card' || profile === 'ssn_card'
        ? 'Too dark — move to brighter light or tap flash'
        : 'Lighting is low — brighten the scene';
    case 'too_bright':
      return 'Too bright — reduce direct light on the document';
    case 'glare':
      return 'Glare detected — tilt card slightly to remove shine';
    case 'blurry':
      return 'Hold steady — image is blurry';
    case 'no_document':
      return 'Align the full document inside the frame';
    case 'wrong_type':
      return 'Document type mismatch — switch type above or realign';
    case 'not_recognized':
      return profile === 'id_card' || profile === 'ssn_card'
        ? 'Waiting to recognize your ID — fill the green frame'
        : 'Recognizing document…';
    case 'hold_steady':
      return 'Almost there — hold still';
    case 'align_document':
      return 'Center the document in the frame';
    default:
      return 'Align document in frame';
  }
}

export function evaluateCaptureReadiness(args: {
  canvas: HTMLCanvasElement;
  crop: CropMargins;
  profile: DocScanProfile;
  boundsConfidence: number;
  guess: LiveDocumentGuess | null;
  stableTicks: number;
  profileManual: boolean;
}): CaptureReadiness {
  const cfg = CAPTURE_PROFILE_CONFIG[args.profile];
  const stats = analyzeCropRegion(args.canvas, args.crop);
  const issues: CaptureQualityIssue[] = [];

  const stabilityPct = Math.min(100, Math.round((args.stableTicks / cfg.stabilityTicks) * 100));
  const profileMatch =
    !args.guess ||
    args.guess.suggestedProfile === args.profile ||
    (args.profile === 'bureau_mail' && args.guess.suggestedProfile === 'creditor_letter') ||
    (args.profile === 'creditor_letter' && args.guess.suggestedProfile === 'bureau_mail');

  const recognitionConfidence = args.guess?.confidence ?? 0;
  const mismatch =
    args.profileManual && args.guess ? isProfileMismatch(args.profile, args.guess) : false;

  if (stats.meanLum < cfg.minMeanLuminance) issues.push('too_dark');
  if (stats.meanLum > cfg.maxMeanLuminance) issues.push('too_bright');
  if (stats.glareRatio > cfg.maxGlareRatio) issues.push('glare');
  if (stats.sharpness < cfg.minSharpness) issues.push('blurry');
  if (args.boundsConfidence < cfg.minBoundsConfidence * 0.85) issues.push('no_document');
  if (mismatch) issues.push('wrong_type');
  if (cfg.requireProfileMatch && recognitionConfidence < cfg.minRecognitionConfidence) issues.push('not_recognized');
  if (cfg.requireProfileMatch && !profileMatch && recognitionConfidence >= cfg.minRecognitionConfidence) {
    issues.push('wrong_type');
  }
  if (args.stableTicks < cfg.stabilityTicks) issues.push('hold_steady');

  const lighting = lightingLabel(stats.meanLum, stats.glareRatio, cfg);

  let score = 0;
  score += Math.min(28, (args.boundsConfidence / cfg.minBoundsConfidence) * 22);
  score += Math.min(22, (stats.sharpness / cfg.minSharpness) * 18);
  score += lighting === 'good' ? 20 : lighting === 'fair' ? 12 : 4;
  score += Math.min(18, stabilityPct * 0.18);
  if (profileMatch) score += 8;
  if (recognitionConfidence >= cfg.minRecognitionConfidence) score += Math.min(12, recognitionConfidence * 14);
  if (!mismatch) score += 4;
  score = Math.round(Math.max(0, Math.min(100, score)));

  const blocking = issues.filter((i) => i !== 'hold_steady');
  const ready =
    score >= cfg.minOverallScore &&
    args.stableTicks >= cfg.stabilityTicks &&
    args.boundsConfidence >= cfg.minBoundsConfidence &&
    stats.sharpness >= cfg.minSharpness &&
    lighting !== 'poor' &&
    !mismatch &&
    (!cfg.requireProfileMatch || (profileMatch && recognitionConfidence >= cfg.minRecognitionConfidence));

  const primaryIssue = blocking[0] ?? (args.stableTicks < cfg.stabilityTicks ? 'hold_steady' : undefined);
  const userMessage = ready
    ? 'Perfect — capturing now…'
    : primaryIssue
      ? issueMessage(primaryIssue, args.profile)
      : 'Align document inside the frame';

  const subMessage = ready
    ? args.guess?.label
      ? `Recognized: ${args.guess.label}`
      : cfg.label
    : args.stableTicks < cfg.stabilityTicks
      ? `Stability ${stabilityPct}% — need ${cfg.stabilityTicks - args.stableTicks} more steady moments`
      : args.guess && recognitionConfidence >= 0.4
        ? `Seeing: ${args.guess.label}`
        : lighting === 'poor'
          ? 'Improve lighting for a clear scan'
          : undefined;

  return {
    ready,
    score,
    issues,
    userMessage,
    subMessage,
    lighting,
    sharpness: Math.round(stats.sharpness),
    boundsConfidence: args.boundsConfidence,
    recognitionConfidence,
    profileMatch,
    stabilityPct,
  };
}

export function captureConfigForProfile(profile: DocScanProfile): CaptureProfileConfig {
  return CAPTURE_PROFILE_CONFIG[profile];
}
